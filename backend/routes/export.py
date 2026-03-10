from flask import Blueprint, request, jsonify, send_file
from utils.auth_utils import token_required, role_required
import os

export_bp = Blueprint('export', __name__)


@export_bp.route('/applications', methods=['POST'])
@token_required
def export_applications(current_user):
    try:
        from tasks.exports import export_student_applications, export_company_applications

        if current_user.role == 'student' and current_user.student:
            task = export_student_applications.delay(current_user.student.id)
            return jsonify({
                'message': 'Export started. You will be notified when complete.',
                'task_id': task.id
            }), 202

        elif current_user.role == 'company' and current_user.company:
            task = export_company_applications.delay(current_user.company.id)
            return jsonify({
                'message': 'Export started. You will be notified when complete.',
                'task_id': task.id
            }), 202

        return jsonify({'message': 'Export not available for your role'}), 400

    except Exception as e:
        return export_sync(current_user)


@export_bp.route('/placements', methods=['POST'])
@token_required
def export_placements(current_user):
    try:
        from tasks.exports import export_placement_history

        if current_user.role == 'student' and current_user.student:
            task = export_placement_history.delay('student', current_user.student.id)
        elif current_user.role == 'company' and current_user.company:
            task = export_placement_history.delay('company', current_user.company.id)
        elif current_user.role == 'admin':
            task = export_placement_history.delay('admin', 0)
        else:
            return jsonify({'message': 'Export not available'}), 400

        return jsonify({
            'message': 'Placement export started.',
            'task_id': task.id
        }), 202

    except Exception as e:
        return jsonify({'message': 'Export failed', 'error': str(e)}), 500


@export_bp.route('/report/<int:company_id>', methods=['POST'])
@token_required
@role_required('admin', 'company')
def generate_report(current_user, company_id):
    if current_user.role == 'company' and current_user.company:
        company_id = current_user.company.id

    try:
        from tasks.reports import generate_company_report_task
        task = generate_company_report_task.delay(company_id)
        return jsonify({
            'message': 'Report generation started.',
            'task_id': task.id
        }), 202

    except Exception as e:
        return generate_report_sync(company_id)


@export_bp.route('/task-status/<task_id>', methods=['GET'])
@token_required
def check_task_status(current_user, task_id):
    try:
        from tasks.celery_config import celery_app
        task = celery_app.AsyncResult(task_id)

        response = {
            'task_id': task_id,
            'status': task.status,
        }

        if task.ready():
            response['result'] = task.result
        elif task.failed():
            response['error'] = str(task.result)

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'message': 'Cannot check task status', 'error': str(e)}), 503


@export_bp.route('/download/<filename>', methods=['GET'])
@token_required
def download_export(current_user, filename):
    from flask import current_app
    export_folder = current_app.config.get('EXPORT_FOLDER', 'exports')
    filepath = os.path.join(export_folder, filename)

    if not os.path.exists(filepath):
        return jsonify({'message': 'File not found'}), 404

    return send_file(filepath, as_attachment=True)


def export_sync(current_user):
    """Synchronous fallback export (when Celery is not available)."""
    import csv
    import io
    from models import Application, JobPosition
    from flask import Response

    if current_user.role == 'student' and current_user.student:
        applications = Application.query.filter_by(student_id=current_user.student.id).all()
    elif current_user.role == 'company' and current_user.company:
        jobs = JobPosition.query.filter_by(company_id=current_user.company.id).all()
        job_ids = [j.id for j in jobs]
        applications = Application.query.filter(Application.job_id.in_(job_ids)).all()
    else:
        return jsonify({'message': 'No data to export'}), 400

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Job Title', 'Company', 'Status', 'Applied Date', 'Feedback'])

    for app in applications:
        job = JobPosition.query.get(app.job_id)
        writer.writerow([
            job.title if job else 'N/A',
            job.company.name if job and job.company else 'N/A',
            app.status,
            app.applied_date.strftime('%Y-%m-%d') if app.applied_date else '',
            app.feedback or ''
        ])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=applications_export.csv'}
    )


def generate_report_sync(company_id):
    from models import Company, JobPosition, Application
    from flask import current_app
    from datetime import datetime, date

    company = Company.query.get(company_id)
    if not company:
        return jsonify({'message': 'Company not found'}), 404

    jobs = JobPosition.query.filter_by(company_id=company.id, is_deleted=False).all()
    total_applications = 0
    total_shortlisted = 0
    total_placed = 0
    job_stats = []

    for job in jobs:
        apps = Application.query.filter_by(job_id=job.id).all()
        applied = len(apps)
        shortlisted = len([a for a in apps if a.status in ('shortlisted', 'interview', 'offer', 'placed')])
        placed = len([a for a in apps if a.status == 'placed'])
        total_applications += applied
        total_shortlisted += shortlisted
        total_placed += placed
        job_stats.append({'title': job.title, 'status': job.status,
                          'applied': applied, 'shortlisted': shortlisted, 'placed': placed})

    report_html = f"""
    <html>
    <head><title>Placement Report - {company.name}</title>
    <style>
        body {{ font-family: 'Inter', sans-serif; margin: 40px; color: #1e293b; }}
        h1 {{ color: #4f46e5; }}
        table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
        th, td {{ border: 1px solid #e2e8f0; padding: 10px; text-align: left; }}
        th {{ background: #4f46e5; color: white; }}
        .stat {{ display: inline-block; margin: 10px 20px 10px 0; padding: 15px 25px;
                 background: #f1f5f9; border-radius: 10px; }}
        .stat-value {{ font-size: 24px; font-weight: 700; color: #4f46e5; }}
        .stat-label {{ font-size: 14px; color: #64748b; }}
    </style>
    </head>
    <body>
        <h1>Placement Report</h1>
        <h2>{company.name}</h2>
        <p>Generated: {datetime.now().strftime('%B %d, %Y')}</p>
        <div>
            <div class="stat"><div class="stat-value">{total_applications}</div><div class="stat-label">Total Applications</div></div>
            <div class="stat"><div class="stat-value">{total_shortlisted}</div><div class="stat-label">Shortlisted</div></div>
            <div class="stat"><div class="stat-value">{total_placed}</div><div class="stat-label">Placed</div></div>
        </div>
        <table>
            <tr><th>Job Title</th><th>Status</th><th>Applications</th><th>Shortlisted</th><th>Placed</th></tr>
    """
    for js in job_stats:
        report_html += f"<tr><td>{js['title']}</td><td>{js['status']}</td><td>{js['applied']}</td><td>{js['shortlisted']}</td><td>{js['placed']}</td></tr>"
    report_html += "</table></body></html>"

    export_folder = current_app.config.get('EXPORT_FOLDER', 'exports')
    os.makedirs(export_folder, exist_ok=True)
    filename = f"report_{company.id}_{date.today().strftime('%Y%m')}.html"
    filepath = os.path.join(export_folder, filename)

    with open(filepath, 'w') as f:
        f.write(report_html)

    return jsonify({
        'message': 'Report generated successfully.',
        'result': {
            'status': 'completed',
            'file': filename,
            'company': company.name,
            'total_applications': total_applications,
            'total_shortlisted': total_shortlisted,
            'total_placed': total_placed
        }
    }), 200


def export_placements_sync(current_user):
    import csv
    import io
    from datetime import datetime
    from models import Placement, Student, Company
    from flask import Response

    if current_user.role == 'student' and current_user.student:
        placements = Placement.query.filter_by(student_id=current_user.student.id).all()
    elif current_user.role == 'company' and current_user.company:
        placements = Placement.query.filter_by(company_id=current_user.company.id).all()
    elif current_user.role == 'admin':
        placements = Placement.query.all()
    else:
        return jsonify({'message': 'No data to export'}), 400

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Student', 'Company', 'Position', 'Salary', 'Joining Date'])

    for p in placements:
        student = Student.query.get(p.student_id)
        company = Company.query.get(p.company_id)
        writer.writerow([
            student.name if student else 'N/A',
            company.name if company else 'N/A',
            p.position or '',
            p.salary or '',
            str(p.joining_date) if p.joining_date else ''
        ])

    output.seek(0)
    filename = f"placements_{current_user.role}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename={filename}'}
    )
