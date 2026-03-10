import os
import sys
from dotenv import load_dotenv
load_dotenv()

_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_mail import Mail
from config import config
from models import db
from utils.cache import cache, init_cache


mail = Mail()


def create_app(config_name='default'):
    app = Flask(
        __name__,
        template_folder=os.path.join(os.path.dirname(__file__), '..', 'frontend'),
        static_folder=os.path.join(os.path.dirname(__file__), '..', 'frontend', 'static')
    )

    app.config.from_object(config[config_name])

    db.init_app(app)
    CORS(app)
    mail.init_app(app)

    try:
        init_cache(app)
    except Exception:
        pass 


    os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)
    os.makedirs(app.config.get('EXPORT_FOLDER', 'exports'), exist_ok=True)


    from routes.auth import auth_bp
    from routes.admin import admin_bp
    from routes.company import company_bp
    from routes.student import student_bp
    from routes.jobs import jobs_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(company_bp, url_prefix='/api/company')
    app.register_blueprint(student_bp, url_prefix='/api/student')
    app.register_blueprint(jobs_bp, url_prefix='/api/jobs')


    from routes.export import export_bp
    app.register_blueprint(export_bp, url_prefix='/api/export')

    with app.app_context():
        db.create_all()

        from models import User
        from werkzeug.security import generate_password_hash
        if not User.query.filter_by(role='admin').first():
            admin = User(
                email='admin@ppa.com',
                password_hash=generate_password_hash('admin123'),
                role='admin',
                is_active=True
            )
            db.session.add(admin)
            db.session.commit()
            print('Admin user created: admin@ppa.com / admin123')

    @app.route('/')
    def index():
        from flask import render_template
        return render_template('index.html')

    @app.route('/static/<path:filename>')
    def serve_static(filename):
        return send_from_directory(app.static_folder, filename)

    return app


if __name__ == '__main__':
    app = create_app('development')
    app.run(debug=True, port=5000)
