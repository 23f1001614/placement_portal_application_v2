from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Student, Company
from utils.auth_utils import generate_token, token_required

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email and password are required'}), 400

    user = User.query.filter_by(email=data['email']).first()
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'message': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'message': 'Your account has been deactivated'}), 403

    if user.role == 'company' and user.company:
        if not user.company.is_approved:
            return jsonify({'message': 'Your company profile is pending admin approval'}), 403
        if user.company.is_blacklisted:
            return jsonify({'message': 'Your company has been blacklisted'}), 403

    if user.role == 'student' and user.student:
        if user.student.is_blacklisted:
            return jsonify({'message': 'Your account has been blacklisted'}), 403

    token = generate_token(user)

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/register/student', methods=['POST'])
def register_student():
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400

    required = ['email', 'password', 'name']
    for field in required:
        if not data.get(field):
            return jsonify({'message': f'{field} is required'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 409

    user = User(
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        role='student',
        is_active=True
    )
    db.session.add(user)
    db.session.flush()

    student = Student(
        user_id=user.id,
        name=data['name'],
        phone=data.get('phone', ''),
        education=data.get('education', ''),
        skills=data.get('skills', ''),
        experience=data.get('experience', ''),
        cgpa=data.get('cgpa'),
        graduation_year=data.get('graduation_year')
    )
    db.session.add(student)
    db.session.commit()

    return jsonify({
        'message': 'Student registration successful',
        'user': user.to_dict()
    }), 201


@auth_bp.route('/register/company', methods=['POST'])
def register_company():
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400

    required = ['email', 'password', 'name']
    for field in required:
        if not data.get(field):
            return jsonify({'message': f'{field} is required'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 409

    user = User(
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        role='company',
        is_active=True
    )
    db.session.add(user)
    db.session.flush()

    company = Company(
        user_id=user.id,
        name=data['name'],
        industry=data.get('industry', ''),
        location=data.get('location', ''),
        website=data.get('website', ''),
        description=data.get('description', ''),
        is_approved=False 
    )
    db.session.add(company)
    db.session.commit()

    return jsonify({
        'message': 'Company registration successful. Awaiting admin approval.',
        'user': user.to_dict()
    }), 201


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_me(current_user):
    user_data = current_user.to_dict()

    if current_user.role == 'student' and current_user.student:
        user_data['student'] = current_user.student.to_dict()
    elif current_user.role == 'company' and current_user.company:
        user_data['company'] = current_user.company.to_dict()

    return jsonify({'user': user_data}), 200