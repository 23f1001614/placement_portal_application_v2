from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    company = db.relationship('Company', backref='user', uselist=False, lazy=True)
    student = db.relationship('Student', backref='user', uselist=False, lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }



class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    industry = db.Column(db.String(100))
    location = db.Column(db.String(200))
    website = db.Column(db.String(300))
    description = db.Column(db.Text)
    logo_path = db.Column(db.String(300))
    is_approved = db.Column(db.Boolean, default=False)
    is_blacklisted = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    job_positions = db.relationship('JobPosition', backref='company', lazy=True)
    placements = db.relationship('Placement', backref='company', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'industry': self.industry,
            'location': self.location,
            'website': self.website,
            'description': self.description,
            'logo_path': self.logo_path,
            'is_approved': self.is_approved,
            'is_blacklisted': self.is_blacklisted,
            'is_deleted': self.is_deleted,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    name = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20))
    education = db.Column(db.Text)                
    skills = db.Column(db.Text)                   
    resume_path = db.Column(db.String(300))
    experience = db.Column(db.Text)
    cgpa = db.Column(db.Float)
    graduation_year = db.Column(db.Integer)
    is_blacklisted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    applications = db.relationship('Application', backref='student', lazy=True)
    placements = db.relationship('Placement', backref='student', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'phone': self.phone,
            'education': self.education,
            'skills': self.skills,
            'resume_path': self.resume_path,
            'experience': self.experience,
            'cgpa': self.cgpa,
            'graduation_year': self.graduation_year,
            'is_blacklisted': self.is_blacklisted,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class JobPosition(db.Model):
    __tablename__ = 'job_positions'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    salary_min = db.Column(db.Float)
    salary_max = db.Column(db.Float)
    skills_required = db.Column(db.Text)      
    experience_required = db.Column(db.String(50))
    benefits = db.Column(db.Text)
    location = db.Column(db.String(200))
    status = db.Column(db.String(20), default='active')
    is_approved = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)
    deadline = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    applications = db.relationship('Application', backref='job_position', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'company_name': self.company.name if self.company else None,
            'title': self.title,
            'description': self.description,
            'salary_min': self.salary_min,
            'salary_max': self.salary_max,
            'skills_required': self.skills_required,
            'experience_required': self.experience_required,
            'benefits': self.benefits,
            'location': self.location,
            'status': self.status,
            'is_approved': self.is_approved,
            'is_deleted': self.is_deleted,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Application(db.Model):
    __tablename__ = 'applications'
    __table_args__ = (
        db.UniqueConstraint('student_id', 'job_id', name='uq_student_job'),
    )

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('job_positions.id'), nullable=False)
    status = db.Column(db.String(30), default='applied')
    applied_date = db.Column(db.DateTime, default=datetime.utcnow)
    feedback = db.Column(db.Text)
    interview_date = db.Column(db.Date)
    interview_time = db.Column(db.String(10))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    placement = db.relationship('Placement', backref='application', uselist=False, lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': self.student.name if self.student else None,
            'job_id': self.job_id,
            'job_title': self.job_position.title if self.job_position else None,
            'company_name': self.job_position.company.name if self.job_position and self.job_position.company else None,
            'status': self.status,
            'applied_date': self.applied_date.isoformat() if self.applied_date else None,
            'feedback': self.feedback,
            'interview_date': self.interview_date.isoformat() if self.interview_date else None,
            'interview_time': self.interview_time,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Placement(db.Model):
    __tablename__ = 'placements'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('job_positions.id'), nullable=False)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False, unique=True)
    position = db.Column(db.String(200))
    salary = db.Column(db.Float)
    joining_date = db.Column(db.Date)
    offer_letter_path = db.Column(db.String(300))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': self.student.name if self.student else None,
            'company_id': self.company_id,
            'company_name': self.company.name if self.company else None,
            'job_id': self.job_id,
            'application_id': self.application_id,
            'position': self.position,
            'salary': self.salary,
            'joining_date': self.joining_date.isoformat() if self.joining_date else None,
            'offer_letter_path': self.offer_letter_path,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
