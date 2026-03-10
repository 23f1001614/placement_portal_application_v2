import os
import sys
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from celery import Celery
from celery.schedules import crontab

try:
    import routes.auth
    import routes.admin
    import routes.company
    import routes.student
    import routes.jobs
    import routes.export
except ImportError:
    pass


def make_celery(app=None):
    celery = Celery(
        'ppa_tasks',
        broker='redis://localhost:6379/1',
        backend='redis://localhost:6379/1'
    )
    celery.conf.include = [
        'tasks.reminders',
        'tasks.reports',
        'tasks.exports',
    ]

    if app:
        celery.conf.update(
            broker_url=app.config.get('CELERY_BROKER_URL', 'redis://localhost:6379/1'),
            result_backend=app.config.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/1'),
        )

        class ContextTask(celery.Task):
            def __call__(self, *args, **kwargs):
                with app.app_context():
                    return self.run(*args, **kwargs)

        celery.Task = ContextTask


    celery.conf.beat_schedule = {
        'interview-reminders-daily': {
            'task': 'tasks.reminders.send_interview_reminders',
            'schedule': crontab(hour=8, minute=0), 
        },
        'monthly-placement-report': {
            'task': 'tasks.reports.generate_monthly_report',
            'schedule': crontab(day_of_month=1, hour=6, minute=0),
        },
    }

    celery.conf.timezone = 'Asia/Kolkata'

    return celery


celery_app = make_celery()
