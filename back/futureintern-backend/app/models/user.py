from app.models import db
from app.models.saved import saved_internships
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # student, company, admin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Student fields (Task 3.1)
    university = db.Column(db.String(100))
    major = db.Column(db.String(100))
    skills = db.Column(db.Text)  # JSON string or comma-separated
    interests = db.Column(db.Text)  # JSON string or comma-separated
    bio = db.Column(db.Text)
    phone = db.Column(db.String(20))
    location = db.Column(db.String(100)) # Added for student location
    resume_url = db.Column(db.String(500))  # CV file path (Task 5.1)
    profile_image = db.Column(db.String(500)) # Logo or Avatar URL
    
    # Company fields (Task 3.2)
    company_name = db.Column(db.String(100))
    company_description = db.Column(db.Text)
    company_website = db.Column(db.String(200))
    company_location = db.Column(db.String(200))
    is_verified = db.Column(db.Boolean, default=False)  # Verification flag
    
    # Relationships
    saved_internships_rel = db.relationship('Internship', secondary=saved_internships, 
                                           backref=db.backref('saved_by_users', lazy='dynamic'),
                                           lazy='dynamic')
    
    def set_password(self, password):
        """Hash password before saving"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user to dictionary"""
        user_dict = {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'profile_image': self.profile_image,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if self.role == 'student':
            user_dict.update({
                'university': self.university,
                'major': self.major,
                'skills': self.skills,
                'interests': self.interests,
                'bio': self.bio,
                'phone': self.phone,
                'location': self.location,
                'resume_url': self.resume_url
            })
        elif self.role == 'company':
            user_dict.update({
                'company_name': self.company_name,
                'company_description': self.company_description,
                'company_website': self.company_website,
                'company_location': self.company_location,
                'is_verified': self.is_verified
            })
            
        return user_dict
