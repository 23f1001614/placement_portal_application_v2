from flask import Blueprint, request, jsonify, send_file
from models import db, Student, Application, JobPosition, Placement
from utils.auth_utils import token_required, role_required
import os

student_bp = Blueprint('student', __name__)


@student_bp.route('/dashboard', methods=['GET'])
@token_required
@role_required('student')
def dashboard(current_user):
    student = current_user.student
    if not student:
        return jsonify({'message': 'Student profile not found'}), 404

    total_applications = Application.query.filter_by(student_id=student.id).count()
    shortlisted = Application.query.filter_by(student_id=student.id, status='shortlisted').count()
    interviews = Application.query.filter_by(student_id=student.id, status='interview').count()
    offers = Application.query.filter_by(student_id=student.id, status='offer').count()
    placements = Placement.query.filter_by(student_id=student.id).count()

    return jsonify({
        'student': student.to_dict(),
        'stats': {
            'total_applications': total_applications,
            'shortlisted': shortlisted,
            'interviews': interviews,
            'offers': offers,
            'placements': placements
        }
    }), 200


@student_bp.route('/profile', methods=['PUT'])
@token_required
@role_required('student')
def update_profile(current_user):
    student = current_user.student
    if not student:
        return jsonify({'message': 'Student profile not found'}), 404

    data = request.get_json()
    for field in ['name', 'phone', 'education', 'skills', 'experience', 'cgpa', 'graduation_year']:
        if field in data:
            setattr(student, field, data[field])

    db.session.commit()
    return jsonify({'message': 'Profile updated', 'student': student.to_dict()}), 200


@student_bp.route('/profile/resume', methods=['POST'])
@token_required
@role_required('student')
def upload_resume(current_user):
    student = current_user.student
    if not student:
        return jsonify({'message': 'Student profile not found'}), 404

    if 'resume' not in request.files:
        return jsonify({'message': 'No resume file provided'}), 400

    file = request.files['resume']
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400

    from flask import current_app
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    filename = f"resume_{student.id}_{file.filename}"
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    student.resume_path = filename
    db.session.commit()

    return jsonify({'message': 'Resume uploaded', 'resume_path': filename}), 200



@student_bp.route('/applications', methods=['GET'])
@token_required
@role_required('student')
def get_applications(current_user):
    student = current_user.student
    applications = Application.query.filter_by(student_id=student.id).order_by(
        Application.applied_date.desc()
    ).all()
    return jsonify({'applications': [a.to_dict() for a in applications]}), 200


@student_bp.route('/apply/<int:job_id>', methods=['POST'])
@token_required
@role_required('student')
def apply_for_job(current_user, job_id):
    student = current_user.student
    if not student:
        return jsonify({'message': 'Student profile not found'}), 404
    if student.is_blacklisted:
        return jsonify({'message': 'Your account is blacklisted'}), 403

    job = JobPosition.query.get_or_404(job_id)
    if not job.is_approved or job.status != 'active':
        return jsonify({'message': 'This job posting is not available'}), 400


    existing = Application.query.filter_by(student_id=student.id, job_id=job.id).first()
    if existing:
        return jsonify({'message': 'You have already applied for this job'}), 409

    application = Application(
        student_id=student.id,
        job_id=job.id,
        status='applied'
    )
    db.session.add(application)
    db.session.commit()

    return jsonify({'message': 'Application submitted', 'application': application.to_dict()}), 201



@student_bp.route('/interviews', methods=['GET'])
@token_required
@role_required('student')
def get_interviews(current_user):
    student = current_user.student
    interviews = Application.query.filter(
        Application.student_id == student.id,
        Application.status == 'interview',
        Application.interview_date.isnot(None)
    ).order_by(Application.interview_date.asc()).all()
    return jsonify({'interviews': [i.to_dict() for i in interviews]}), 200



@student_bp.route('/placements', methods=['GET'])
@token_required
@role_required('student')
def get_placements(current_user):
    student = current_user.student
    placements = Placement.query.filter_by(student_id=student.id).all()
    return jsonify({'placements': [p.to_dict() for p in placements]}), 200


@student_bp.route('/placements/<int:placement_id>/offer-letter', methods=['GET'])
@token_required
@role_required('student')
def download_offer_letter(current_user, placement_id):
    student = current_user.student
    placement = Placement.query.filter_by(id=placement_id, student_id=student.id).first_or_404()

    if not placement.offer_letter_path:
        return jsonify({'message': 'No offer letter available'}), 404

    from flask import current_app
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], placement.offer_letter_path)
    if not os.path.exists(filepath):
        return jsonify({'message': 'Offer letter file not found'}), 404

    return send_file(filepath, as_attachment=True)
