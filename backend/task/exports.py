"""CSV export tasks – async export for students and companies."""
import os
import sys
import csv
from datetime import datetime
_this_file = os.path.abspath(__file__)
_tasks_dir = os.path.dirname(_this_file)
_backend_dir = os.path.dirname(_tasks_dir)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from tasks.celery_config import celery_app
from app import create_app


@celery_app.task(name='tasks.exports.export_student_applications')
def export_student_applications(student_id):
    from models import Application, JobPosition, Student

    app = create_app()
    with app.app_context():
        student = Student.query.get(student_id)
        if not student:
            return {'status': 'error', 'message': 'Student not found'}

        applications = Application.query.filter_by(student_id=student_id).order_by(
            Application.applied_date.desc()
        ).all()

        export_folder = app.config.get('EXPORT_FOLDER', 'exports')
        os.makedirs(export_folder, exist_ok=True)
        filename = f"applications_{student_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        filepath = os.path.join(export_folder, filename)

        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Job Title', 'Company', 'Status', 'Applied Date',
                             'Interview Date', 'Interview Time', 'Feedback'])

            for application in applications:
                job = JobPosition.query.get(application.job_id)
                writer.writerow([
                    job.title if job else 'N/A',
                    job.company.name if job and job.company else 'N/A',
                    application.status,
                    application.applied_date.strftime('%Y-%m-%d') if application.applied_date else '',
                    str(application.interview_date) if application.interview_date else '',
                    application.interview_time or '',
                    application.feedback or ''
                ])

        print(f"[EXPORT] Student applications CSV: {filepath}")
        return {
            'status': 'completed',
            'file': filename,
            'records': len(applications),
            'student': student.name
        }


@celery_app.task(name='tasks.exports.export_company_applications')
def export_company_applications(company_id):
    from models import Application, JobPosition, Student, Company, User

    app = create_app()
    with app.app_context():
        company = Company.query.get(company_id)
        if not company:
            return {'status': 'error', 'message': 'Company not found'}

        jobs = JobPosition.query.filter_by(company_id=company_id, is_deleted=False).all()
        job_ids = [j.id for j in jobs]

        applications = Application.query.filter(
            Application.job_id.in_(job_ids)
        ).order_by(Application.applied_date.desc()).all()

        export_folder = app.config.get('EXPORT_FOLDER', 'exports')
        os.makedirs(export_folder, exist_ok=True)
        filename = f"company_apps_{company_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        filepath = os.path.join(export_folder, filename)

        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Student Name', 'Student Email', 'Job Title', 'Status',
                             'Applied Date', 'CGPA', 'Skills', 'Feedback'])

            for application in applications:
                student = Student.query.get(application.student_id)
                job = JobPosition.query.get(application.job_id)
                user = User.query.get(student.user_id) if student else None

                writer.writerow([
                    student.name if student else 'N/A',
                    user.email if user else 'N/A',
                    job.title if job else 'N/A',
                    application.status,
                    application.applied_date.strftime('%Y-%m-%d') if application.applied_date else '',
                    student.cgpa if student else '',
                    student.skills if student else '',
                    application.feedback or ''
                ])

        print(f"[EXPORT] Company applications CSV: {filepath}")
        return {
            'status': 'completed',
            'file': filename,
            'records': len(applications),
            'company': company.name
        }


@celery_app.task(name='tasks.exports.export_placement_history')
def export_placement_history(user_role, user_id):
    from models import Placement, Student, Company, JobPosition

    app = create_app()
    with app.app_context():
        if user_role == 'student':
            placements = Placement.query.filter_by(student_id=user_id).all()
        elif user_role == 'company':
            placements = Placement.query.filter_by(company_id=user_id).all()
        else:
            placements = Placement.query.all()

        export_folder = app.config.get('EXPORT_FOLDER', 'exports')
        os.makedirs(export_folder, exist_ok=True)
        filename = f"placements_{user_role}_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        filepath = os.path.join(export_folder, filename)

        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
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

        return {
            'status': 'completed',
            'file': filename,
            'records': len(placements)
        }
