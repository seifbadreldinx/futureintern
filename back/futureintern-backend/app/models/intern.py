from app.models import db
from datetime import datetime

import re

class Internship(db.Model):
    __tablename__ = 'internships'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    requirements = db.Column(db.Text)
    location = db.Column(db.String(200))
    duration = db.Column(db.String(100))  # e.g., "3 months", "6 weeks"
    stipend = db.Column(db.String(100))  # e.g., "Paid", "Unpaid", "5000 EGP/month"
    application_deadline = db.Column(db.Date)
    start_date = db.Column(db.Date)
    
    # Matching fields
    major = db.Column(db.String(100)) # e.g. "Computer Science"
    required_skills = db.Column(db.Text) # JSON string of skills e.g. ["Python", "React"]
    
    # Foreign key to company
    company_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = db.relationship('User', backref='internships', foreign_keys=[company_id])
    
    def to_dict(self, include_company=True):
        """Convert internship to dictionary"""
        # Clean title by removing leading numbers (e.g. "1. title" -> "title")
        clean_title = re.sub(r'^\d+\.\s*', '', self.title) if self.title else ''
        
        internship_dict = {
            'id': self.id,
            'title': clean_title,
            'description': self.description,
            'requirements': self.requirements,
            'location': self.location,
            'duration': self.duration,
            'stipend': self.stipend,
            'type': 'Remote' if (self.location and 'remote' in self.location.lower()) else ('Part-time' if (self.duration and 'part' in self.duration.lower()) else 'Full-time'),
            'application_deadline': self.application_deadline.isoformat() if self.application_deadline else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'is_active': self.is_active,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'major': self.major,
            'required_skills': self.required_skills
        }
        
        if include_company:
            if self.company:
                company_name = self.company.company_name or self.company.name or ''
                internship_dict['company'] = {
                    'id': self.company.id,
                    'name': company_name,
                    'location': self.company.company_location or '',
                    'profile_image': self.company.profile_image
                }
            else:
                internship_dict['company'] = {
                    'id': self.company_id,
                    'name': '',
                    'location': ''
                }
        else:
            internship_dict['company_id'] = self.company_id
            
        return internship_dict
