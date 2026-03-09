import os
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file, current_app
from models import db, Company, JobPosition, Application, Student, Placement
from utils.auth_utils import token_required, role_required

company_bp = Blueprint('company', __name__)


@company_bp.route('/dashboard', methods=['GET'])
@token_required
@role_required('company')
def dashboard(current_user):
    company = current_user.company
    if not company:
        return jsonify({'message': 'Company profile not found'}), 404

    total_jobs = JobPosition.query.filter_by(company_id=company.id).count()
    active_jobs = JobPosition.query.filter_by(company_id=company.id, status='active').count()
    total_applications = Application.query.join(JobPosition).filter(
        JobPosition.company_id == company.id
    ).count()
    shortlisted = Application.query.join(JobPosition).filter(
        JobPosition.company_id == company.id,
        Application.status == 'shortlisted'
    ).count()

    return jsonify({
        'company': company.to_dict(),
        'stats': {
            'total_jobs': total_jobs,
            'active_jobs': active_jobs,
            'total_applications': total_applications,
            'shortlisted_candidates': shortlisted
        }
    }), 200


@company_bp.route('/profile', methods=['PUT'])
@token_required
@role_required('company')
def update_profile(current_user):
    company = current_user.company
    if not company:
        return jsonify({'message': 'Company profile not found'}), 404

    data = request.get_json()
    if data.get('name'):
        company.name = data['name']
    if data.get('industry'):
        company.industry = data['industry']
    if data.get('location'):
        company.location = data['location']
    if data.get('website'):
        company.website = data['website']
    if data.get('description'):
        company.description = data['description']

    db.session.commit()
    return jsonify({'message': 'Profile updated', 'company': company.to_dict()}), 200



@company_bp.route('/jobs', methods=['GET'])
@token_required
@role_required('company')
def get_jobs(current_user):
    company = current_user.company
    jobs = JobPosition.query.filter_by(company_id=company.id).order_by(
        JobPosition.created_at.desc()
    ).all()
    return jsonify({'jobs': [j.to_dict() for j in jobs]}), 200


@company_bp.route('/jobs', methods=['POST'])
@token_required
@role_required('company')
def create_job(current_user):
    company = current_user.company
    if not company or not company.is_approved:
        return jsonify({'message': 'Company must be approved to post jobs'}), 403
    if company.is_blacklisted:
        return jsonify({'message': 'Company is blacklisted'}), 403

    data = request.get_json()
    if not data or not data.get('title'):
        return jsonify({'message': 'Job title is required'}), 400

    job = JobPosition(
        company_id=company.id,
        title=data['title'],
        description=data.get('description', ''),
        salary_min=data.get('salary_min'),
        salary_max=data.get('salary_max'),
        skills_required=data.get('skills_required', ''),
        experience_required=data.get('experience_required', ''),
        benefits=data.get('benefits', ''),
        location=data.get('location', ''),
        status='active',
        is_approved=False,
        deadline=datetime.fromisoformat(data['deadline']) if data.get('deadline') else None
    )
    db.session.add(job)
    db.session.commit()

    return jsonify({'message': 'Job posted. Awaiting admin approval.', 'job': job.to_dict()}), 201


@company_bp.route('/jobs/<int:job_id>', methods=['PUT'])
@token_required
@role_required('company')
def update_job(current_user, job_id):
    company = current_user.company
    job = JobPosition.query.filter_by(id=job_id, company_id=company.id).first_or_404()

    data = request.get_json()
    for field in ['title', 'description', 'salary_min', 'salary_max', 'skills_required',
                  'experience_required', 'benefits', 'location', 'status']:
        if field in data:
            setattr(job, field, data[field])
    if 'deadline' in data and data['deadline']:
        job.deadline = datetime.fromisoformat(data['deadline'])

    db.session.commit()
    return jsonify({'message': 'Job updated', 'job': job.to_dict()}), 200



@company_bp.route('/jobs/<int:job_id>/applications', methods=['GET'])
@token_required
@role_required('company')
def get_applicants(current_user, job_id):
    company = current_user.company
    job = JobPosition.query.filter_by(id=job_id, company_id=company.id).first_or_404()

    applications = Application.query.filter_by(job_id=job.id).order_by(
        Application.applied_date.desc()
    ).all()

    result = []
    for app in applications:
        app_data = app.to_dict()
        if app.student:
            app_data['student'] = app.student.to_dict()
        result.append(app_data)

    return jsonify({'applications': result, 'job': job.to_dict()}), 200


@company_bp.route('/applications/<int:app_id>/status', methods=['PUT'])
@token_required
@role_required('company')
def update_application_status(current_user, app_id):
    company = current_user.company
    application = Application.query.get_or_404(app_id)

    # Verify the application belongs to this company's job
    job = JobPosition.query.get(application.job_id)
    if not job or job.company_id != company.id:
        return jsonify({'message': 'Access denied'}), 403

    data = request.get_json()
    valid_statuses = ['applied', 'shortlisted', 'interview', 'offer', 'rejected', 'placed']

    if data.get('status') not in valid_statuses:
        return jsonify({'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400

    application.status = data['status']
    if data.get('feedback'):
        application.feedback = data['feedback']
    if data.get('interview_date'):
        application.interview_date = datetime.strptime(data['interview_date'], '%Y-%m-%d').date()
    if data.get('interview_time'):
        application.interview_time = data['interview_time']
    if data['status'] == 'offer':
        existing_placement = Placement.query.filter_by(application_id=application.id).first()
        if not existing_placement:
            student = application.student
            offer_html = _generate_offer_letter(
                student_name=student.name,
                company_name=company.name,
                job_title=job.title,
                salary=job.salary_max or job.salary_min,
                location=job.location
            )
            upload_folder = current_app.config['UPLOAD_FOLDER']
            os.makedirs(upload_folder, exist_ok=True)
            filename = f"offer_letter_{application.id}_{student.id}.html"
            filepath = os.path.join(upload_folder, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(offer_html)

            placement = Placement(
                student_id=student.id,
                company_id=company.id,
                job_id=job.id,
                application_id=application.id,
                position=job.title,
                salary=job.salary_max or job.salary_min,
                offer_letter_path=filename
            )
            db.session.add(placement)

    db.session.commit()
    return jsonify({'message': 'Application status updated', 'application': application.to_dict()}), 200


def _generate_offer_letter(student_name, company_name, job_title, salary, location):
    today = datetime.now().strftime('%B %d, %Y')
    salary_text = f"₹{salary:,.0f} LPA" if salary else "as discussed"
    location_text = location or "our office"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Offer Letter - {company_name}</title>
<style>
  body {{ font-family: Georgia, 'Times New Roman', serif; max-width: 700px; margin: 40px auto; padding: 40px; color: #333; line-height: 1.8; }}
  .header {{ text-align: center; border-bottom: 3px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px; }}
  .header h1 {{ color: #2c3e50; margin: 0; font-size: 28px; }}
  .header p {{ color: #7f8c8d; margin: 5px 0; }}
  .date {{ text-align: right; color: #555; margin-bottom: 20px; }}
  .body-text {{ margin: 15px 0; text-align: justify; }}
  .highlight {{ background: #eaf4fc; padding: 15px 20px; border-left: 4px solid #2980b9; margin: 20px 0; border-radius: 0 8px 8px 0; }}
  .highlight p {{ margin: 5px 0; }}
  .signature {{ margin-top: 50px; }}
  .signature .line {{ border-top: 1px solid #333; width: 200px; margin-top: 40px; padding-top: 5px; }}
  .footer {{ text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }}
  @media print {{ body {{ margin: 0; padding: 20px; }} }}
</style>
</head>
<body>
<div class="header">
  <h1>{company_name}</h1>
  <p>Official Offer of Employment</p>
</div>

<div class="date">{today}</div>

<p class="body-text">Dear <strong>{student_name}</strong>,</p>

<p class="body-text">
  We are pleased to inform you that after careful consideration of your application and interview performance,
  we are delighted to extend an offer of employment at <strong>{company_name}</strong>.
</p>

<div class="highlight">
  <p><strong>Position:</strong> {job_title}</p>
  <p><strong>Compensation:</strong> {salary_text}</p>
  <p><strong>Location:</strong> {location_text}</p>
  <p><strong>Start Date:</strong> To be mutually decided</p>
  <p><strong>Type:</strong> Full-Time Employment</p>
</div>

<p class="body-text">
  This offer is contingent upon the successful completion of your academic requirements and any
  background verification process as per company policy.
</p>

<p class="body-text">
  We believe your skills and enthusiasm will be a valuable addition to our team, and we look forward
  to welcoming you aboard. Please confirm your acceptance of this offer within 7 days of receiving this letter.
</p>

<p class="body-text">Congratulations once again, and welcome to the <strong>{company_name}</strong> family!</p>

<div class="signature">
  <p>Warm regards,</p>
  <div class="line">
    <p><strong>HR Department</strong></p>
    <p>{company_name}</p>
    <p>[EMAIL_ADDRESS]</p>
  </div>
</div>

<div class="footer">
  <p>This is an auto-generated offer letter from the Placement Portal Application.</p>
</div>
</body>
</html>"""



@company_bp.route('/applications/<int:app_id>/resume', methods=['GET'])
@token_required
@role_required('company')
def download_resume(current_user, app_id):
    company = current_user.company
    application = Application.query.get_or_404(app_id)
    job = JobPosition.query.get(application.job_id)
    if not job or job.company_id != company.id:
        return jsonify({'message': 'Access denied'}), 403

    student = application.student
    if not student or not student.resume_path:
        return jsonify({'message': 'No resume available for this student'}), 404

    upload_folder = current_app.config['UPLOAD_FOLDER']
    filepath = os.path.join(upload_folder, student.resume_path)
    if not os.path.exists(filepath):
        return jsonify({'message': 'Resume file not found on server'}), 404

    return send_file(filepath, as_attachment=False)
