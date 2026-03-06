import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from models import db



def create_app(config_name='default'):
    app = Flask(
        __name__,
        template_folder=os.path.join(os.path.dirname(__file__), '..', 'frontend'),
        static_folder=os.path.join(os.path.dirname(__file__), '..', 'frontend', 'static')
    )

    app.config.from_object(config[config_name])

    
    db.init_app(app)

    with app.app_context():
        db.create_all()

        # Auto-create admin user if not exists
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

    # Serve frontend
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
