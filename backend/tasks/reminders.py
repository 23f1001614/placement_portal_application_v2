import json
import sys
import os
from datetime import date, timedelta

_this_file = os.path.abspath(__file__)
_tasks_dir = os.path.dirname(_this_file)
_backend_dir = os.path.dirname(_tasks_dir)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from tasks.celery_config import celery_app
from app import create_app

def send_email_notification(to_email, subject, body):
    from flask_mail import Message
    from flask import current_app
    if current_app.config.get('FLASK_ENV') == 'development':
        print(f"[EMAIL] To: {to_email}")
        print(f"        Subject: {subject}")
        print(f"        Body: {body}")
        return True
    try:
        from app import mail
        msg = Message(
            subject=subject,
            recipients=[to_email],
            body=body,
            sender=current_app.config.get('MAIL_DEFAULT_SENDER')
        )
        mail.send(msg)
        print(f"[EMAIL] Sent to: {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL] Failed to send to {to_email}: {e}")
        return False


def _build_reminder_message(student_name, job_title, company_name, day_label, interview_time):
    return (
        f"Hi {student_name}, this is a reminder that you have an interview "
        f"{day_label} for the '{job_title}' position at {company_name}. "
        f"Time: {interview_time or 'TBD'}. Good luck!"
    )


def _notify_student(user, message, subject):
    return send_email_notification(user.email, subject, message)



@celery_app.task(name='tasks.reminders.send_interview_reminders')
def send_interview_reminders():
    from models import Application, Student, User, JobPosition

    app = create_app()
    with app.app_context():
        today = date.today()
        tomorrow = today + timedelta(days=1)

        upcoming = Application.query.filter(
            Application.status == 'interview',
            Application.interview_date.in_([today, tomorrow])
        ).all()

        reminders_sent = 0
        for application in upcoming:
            student = Student.query.get(application.student_id)
            job = JobPosition.query.get(application.job_id)
            user = User.query.get(student.user_id) if student else None

            if not student or not job or not user:
                continue

            day_label = 'today' if application.interview_date == today else 'tomorrow'
            company_name = job.company.name if job.company else 'Unknown'

            message = _build_reminder_message(
                student.name, job.title, company_name,
                day_label, application.interview_time
            )
            subject = f"Interview Reminder – {job.title} at {company_name} ({day_label})"

            _notify_student(user, message, subject)
            reminders_sent += 1

        return {
            'status': 'completed',
            'reminders_sent': reminders_sent,
            'date': str(today)
        }


@celery_app.task(name='tasks.reminders.send_single_reminder')
def send_single_reminder(application_id):
    from models import Application, Student, User, JobPosition
    app = create_app()
    with app.app_context():
        application = Application.query.get(application_id)
        if not application:
            return {'status': 'error', 'message': 'Application not found'}
        student = Student.query.get(application.student_id)
        job = JobPosition.query.get(application.job_id)
        user = User.query.get(student.user_id) if student else None
        if not all([student, job, user]):
            return {'status': 'error', 'message': 'Missing data'}
        company_name = job.company.name if job.company else 'Unknown'
        day_label = str(application.interview_date) if application.interview_date else 'TBD'
        message = _build_reminder_message(
            student.name, job.title, company_name,
            day_label, application.interview_time
        )
        subject = f"Interview Reminder – {job.title} at {company_name}"
        _notify_student(user, message, subject)
        return {'status': 'sent', 'to': user.email, 'message': message}
