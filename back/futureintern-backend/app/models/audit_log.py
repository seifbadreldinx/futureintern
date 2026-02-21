"""
AuditLog Model — records sensitive actions for the audit trail.
Tracks: login attempts, password changes, role changes, application status updates.
"""
from app.models import db
from datetime import datetime


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)

    # Who did the action (null = unauthenticated)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    # What action was performed
    action = db.Column(db.String(100), nullable=False)   # e.g. "login_success", "password_change"
    resource = db.Column(db.String(100), nullable=True)  # e.g. "user", "internship", "application"
    resource_id = db.Column(db.Integer, nullable=True)   # ID of affected resource

    # Extra context (JSON string)
    details = db.Column(db.Text, nullable=True)

    # Request metadata
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(300), nullable=True)

    # When
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    user = db.relationship('User', backref='audit_logs', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'resource': self.resource,
            'resource_id': self.resource_id,
            'details': self.details,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
