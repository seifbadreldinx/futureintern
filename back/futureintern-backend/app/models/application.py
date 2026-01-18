from app.models import db
from datetime import datetime

class Application(db.Model):
    __tablename__ = 'applications'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign keys
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    internship_id = db.Column(db.Integer, db.ForeignKey('internships.id'), nullable=False)
    
    # Application details
    cover_letter = db.Column(db.Text)
    resume_url = db.Column(db.String(500))
    status = db.Column(db.String(20), default='pending')  # pending, accepted, rejected, withdrawn
    
    # Timestamps
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Unique constraint: student can apply only once per internship
    __table_args__ = (
        db.UniqueConstraint('student_id', 'internship_id', name='unique_student_internship'),
    )
    
    # Relationships
    student = db.relationship('User', backref='applications', foreign_keys=[student_id])
    internship = db.relationship('Internship', backref='applications', foreign_keys=[internship_id])
    
    def to_dict(self, include_details=True):
        """Convert application to dictionary"""
        app_dict = {
            'id': self.id,
            'status': self.status,
            'applied_at': self.applied_at.isoformat() if self.applied_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'cover_letter': self.cover_letter,
            'resume_url': self.resume_url
        }
        
        if include_details:
            if self.student:
                app_dict['student'] = {
                    'id': self.student.id,
                    'name': self.student.name,
                    'email': self.student.email,
                    'university': self.student.university,
                    'major': self.student.major
                }
            
            if self.internship:
                app_dict['internship'] = {
                    'id': self.internship.id,
                    'title': self.internship.title,
                    'company_name': self.internship.company.company_name if self.internship.company else None
                }
        else:
            app_dict['student_id'] = self.student_id
            app_dict['internship_id'] = self.internship_id
            
        return app_dict
