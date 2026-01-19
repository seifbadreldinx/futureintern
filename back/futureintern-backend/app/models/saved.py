"""
Saved Internships Model - Association table for bookmarking internships
"""
from app.models import db
from datetime import datetime

# Many-to-many relationship table for saved internships
saved_internships = db.Table('saved_internships',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('internship_id', db.Integer, db.ForeignKey('internships.id'), primary_key=True),
    db.Column('saved_at', db.DateTime, default=datetime.utcnow)
)
