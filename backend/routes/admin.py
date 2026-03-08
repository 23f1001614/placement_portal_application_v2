from flask import Blueprint, request, jsonify
from models import db, User, Company, Student, JobPosition, Application, Placement
from utils.auth_utils import token_required, role_required

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/dashboard', methods=['GET'])
@token_required
@role_required('admin')
def dashboard(current_user):
    stats = {
        'total_students': Student.query.count(),
        'total_companies': Company.query.count(),
        'total_jobs': JobPosition.query.count(),
        'total_applications': Application.query.count(),
        'total_placements': Placement.query.count(),
        'pending_companies': Company.query.filter_by(is_approved=False).count(),
        'pending_jobs': JobPosition.query.filter_by(is_approved=False).count(),
        'active_jobs': JobPosition.query.filter_by(status='active', is_approved=True).count()
    }
    return jsonify({'stats': stats}), 200


@admin_bp.route('/companies', methods=['GET'])
@token_required
@role_required('admin')
def get_companies(current_user):
    search = request.args.get('search', '')
    industry = request.args.get('industry', '')
    status = request.args.get('status', '')

    query = Company.query

    if search:
        query = query.filter(Company.name.ilike(f'%{search}%'))
    if industry:
        query = query.filter(Company.industry.ilike(f'%{industry}%'))
    if status == 'approved':
        query = query.filter_by(is_approved=True, is_blacklisted=False)
    elif status == 'pending':
        query = query.filter_by(is_approved=False)
    elif status == 'blacklisted':
        query = query.filter_by(is_blacklisted=True)

    companies = query.order_by(Company.created_at.desc()).all()
    return jsonify({'companies': [c.to_dict() for c in companies]}), 200


@admin_bp.route('/companies/<int:company_id>/approve', methods=['PUT'])
@token_required
@role_required('admin')
def approve_company(current_user, company_id):
    company = Company.query.get_or_404(company_id)
    company.is_approved = True
    db.session.commit()
    return jsonify({'message': f'Company "{company.name}" approved', 'company': company.to_dict()}), 200


@admin_bp.route('/companies/<int:company_id>', methods=['DELETE'])
@token_required
@role_required('admin')
def remove_company(current_user, company_id):
    company = Company.query.get_or_404(company_id)
    user = User.query.get(company.user_id)
    db.session.delete(company)
    if user:
        db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Company removed'}), 200


@admin_bp.route('/companies/<int:company_id>/blacklist', methods=['PUT'])
@token_required
@role_required('admin')
def blacklist_company(current_user, company_id):
    company = Company.query.get_or_404(company_id)
    company.is_blacklisted = not company.is_blacklisted
    db.session.commit()
    status = 'blacklisted' if company.is_blacklisted else 'unblacklisted'
    return jsonify({'message': f'Company {status}', 'company': company.to_dict()}), 200


@admin_bp.route('/students', methods=['GET'])
@token_required
@role_required('admin')
def get_students(current_user):
    search = request.args.get('search', '')
    status = request.args.get('status', '')

    query = Student.query

    if search:
        query = query.filter(
            db.or_(
                Student.name.ilike(f'%{search}%'),
                Student.phone.ilike(f'%{search}%'),
                Student.id.like(f'%{search}%')
            )
        )
    if status == 'blacklisted':
        query = query.filter_by(is_blacklisted=True)
    elif status == 'active':
        query = query.filter_by(is_blacklisted=False)

    students = query.order_by(Student.created_at.desc()).all()
    return jsonify({'students': [s.to_dict() for s in students]}), 200


@admin_bp.route('/students/<int:student_id>/blacklist', methods=['PUT'])
@token_required
@role_required('admin')
def blacklist_student(current_user, student_id):
    student = Student.query.get_or_404(student_id)
    student.is_blacklisted = not student.is_blacklisted
    db.session.commit()
    status = 'blacklisted' if student.is_blacklisted else 'unblacklisted'
    return jsonify({'message': f'Student {status}', 'student': student.to_dict()}), 200


@admin_bp.route('/jobs', methods=['GET'])
@token_required
@role_required('admin')
def get_all_jobs(current_user):
    search = request.args.get('search', '')
    status = request.args.get('status', '')

    query = JobPosition.query

    if search:
        query = query.filter(JobPosition.title.ilike(f'%{search}%'))
    if status == 'pending':
        query = query.filter_by(is_approved=False)
    elif status == 'approved':
        query = query.filter_by(is_approved=True)
    elif status == 'active':
        query = query.filter_by(status='active', is_approved=True)
    elif status == 'closed':
        query = query.filter_by(status='closed')

    jobs = query.order_by(JobPosition.created_at.desc()).all()
    return jsonify({'jobs': [j.to_dict() for j in jobs]}), 200


@admin_bp.route('/jobs/<int:job_id>/approve', methods=['PUT'])
@token_required
@role_required('admin')
def approve_job(current_user, job_id):
    job = JobPosition.query.get_or_404(job_id)
    job.is_approved = True
    db.session.commit()
    return jsonify({'message': f'Job "{job.title}" approved', 'job': job.to_dict()}), 200


@admin_bp.route('/jobs/<int:job_id>', methods=['DELETE'])
@token_required
@role_required('admin')
def remove_job(current_user, job_id):
    job = JobPosition.query.get_or_404(job_id)
    db.session.delete(job)
    db.session.commit()
    return jsonify({'message': 'Job posting removed'}), 200


@admin_bp.route('/applications', methods=['GET'])
@token_required
@role_required('admin')
def get_all_applications(current_user):
    applications = Application.query.order_by(Application.applied_date.desc()).all()
    return jsonify({'applications': [a.to_dict() for a in applications]}), 200
