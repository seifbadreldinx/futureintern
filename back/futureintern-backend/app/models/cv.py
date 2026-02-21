"""
CV Builder Models
- CV: main CV record per student
- CVSection: individual sections (education, experience, skills, projects)
"""
from app.models import db
from datetime import datetime


class CV(db.Model):
    __tablename__ = 'cvs'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'),
                           unique=True, nullable=False)  # one CV per student

    # Basic info that goes on the CV header
    headline = db.Column(db.String(200))       # e.g. "Computer Science Student @ Cairo U"
    summary = db.Column(db.Text)               # Personal summary paragraph
    phone = db.Column(db.String(20))
    linkedin = db.Column(db.String(300))
    github = db.Column(db.String(300))
    website = db.Column(db.String(300))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = db.relationship('User', backref=db.backref('cv', uselist=False))
    sections = db.relationship('CVSection', backref='cv', cascade='all, delete-orphan',
                               order_by='CVSection.order_index')

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'headline': self.headline,
            'summary': self.summary,
            'phone': self.phone,
            'linkedin': self.linkedin,
            'github': self.github,
            'website': self.website,
            'sections': [s.to_dict() for s in self.sections],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class CVSection(db.Model):
    __tablename__ = 'cv_sections'

    id = db.Column(db.Integer, primary_key=True)
    cv_id = db.Column(db.Integer, db.ForeignKey('cvs.id', ondelete='CASCADE'), nullable=False)

    # Section type: education | experience | skills | projects | certifications | other
    section_type = db.Column(db.String(50), nullable=False)

    title = db.Column(db.String(200))       # e.g. "Bachelor of Computer Science"
    subtitle = db.Column(db.String(200))    # e.g. "Cairo University"
    location = db.Column(db.String(200))
    start_date = db.Column(db.String(20))   # stored as string for flexibility: "2021-09" or "Sep 2021"
    end_date = db.Column(db.String(20))     # "Present" or a date string
    description = db.Column(db.Text)       # Bullet points or paragraph

    order_index = db.Column(db.Integer, default=0)  # for custom ordering within sections

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'cv_id': self.cv_id,
            'section_type': self.section_type,
            'title': self.title,
            'subtitle': self.subtitle,
            'location': self.location,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'description': self.description,
            'order_index': self.order_index,
        }
