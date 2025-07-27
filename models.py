from datetime import datetime
from app import db
from flask_dance.consumer.storage.sqla import OAuthConsumerMixin
from flask_login import UserMixin
from sqlalchemy import UniqueConstraint

# (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=True)
    first_name = db.Column(db.String, nullable=True)
    last_name = db.Column(db.String, nullable=True)
    profile_image_url = db.Column(db.String, nullable=True)
    is_teacher = db.Column(db.Boolean, default=False, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationships
    students = db.relationship('Student', backref='teacher', lazy=True)

# (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
class OAuth(OAuthConsumerMixin, db.Model):
    user_id = db.Column(db.String, db.ForeignKey(User.id))
    browser_session_key = db.Column(db.String, nullable=False)
    user = db.relationship(User)

    __table_args__ = (UniqueConstraint(
        'user_id',
        'browser_session_key',
        'provider',
        name='uq_user_browser_session_key_provider',
    ),)

class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=True)
    teacher_id = db.Column(db.String, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # Relationships
    quiz_results = db.relationship('QuizResult', backref='student', lazy=True, cascade='all, delete-orphan')
    memory_scores = db.relationship('MemoryScore', backref='student', lazy=True, cascade='all, delete-orphan')

class QuizResult(db.Model):
    __tablename__ = 'quiz_results'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    visual_score = db.Column(db.Integer, default=0)
    auditory_score = db.Column(db.Integer, default=0)
    kinesthetic_score = db.Column(db.Integer, default=0)
    dominant_style = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

class MemoryScore(db.Model):
    __tablename__ = 'memory_scores'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    game_type = db.Column(db.String(20), nullable=False)  # 'basic', 'visual', 'audio'
    score = db.Column(db.Integer, nullable=False)
    time_taken = db.Column(db.Integer, nullable=False)  # in seconds
    difficulty = db.Column(db.String(10), default='easy')  # 'easy', 'medium', 'hard'
    created_at = db.Column(db.DateTime, default=datetime.now)
