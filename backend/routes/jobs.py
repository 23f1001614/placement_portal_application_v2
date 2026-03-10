from flask import Blueprint, request, jsonify
from models import JobPosition, Company
from utils.auth_utils import token_required
from utils.cache import cache

jobs_bp = Blueprint('jobs', __name__)


@jobs_bp.route('/', methods=['GET'])
@token_required
@cache.cached(timeout=300, query_string=True)
def list_jobs(current_user):
    search = request.args.get('search', '')
    company = request.args.get('company', '')
    skills = request.args.get('skills', '')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = JobPosition.query.filter_by(is_approved=True, status='active', is_deleted=False)

    if search:
        query = query.filter(
            JobPosition.title.ilike(f'%{search}%') |
            JobPosition.description.ilike(f'%{search}%')
        )
    if company:
        query = query.join(Company).filter(Company.name.ilike(f'%{company}%'))
    if skills:
        query = query.filter(JobPosition.skills_required.ilike(f'%{skills}%'))

    total = query.count()
    jobs = query.order_by(JobPosition.created_at.desc()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    return jsonify({
        'jobs': [j.to_dict() for j in jobs],
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page
    }), 200


@jobs_bp.route('/<int:job_id>', methods=['GET'])
@token_required
@cache.cached(timeout=600)
def get_job(current_user, job_id):
    job = JobPosition.query.filter_by(id=job_id, is_deleted=False).first_or_404()
    job_data = job.to_dict()
    if job.company:
        job_data['company'] = job.company.to_dict()
    return jsonify({'job': job_data}), 200
