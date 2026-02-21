"""
JWT Token Blacklist Model
Stores invalidated (logged-out) tokens so they cannot be reused.
Also stores used refresh tokens for rotation enforcement.
"""
from app.models import db
from datetime import datetime


class TokenBlacklist(db.Model):
    __tablename__ = 'token_blacklist'

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(64), unique=True, nullable=False, index=True)  # JWT ID
    token_type = db.Column(db.String(10), nullable=False)  # "access" or "refresh"
    user_id = db.Column(db.Integer, nullable=True)
    revoked_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)  # optional: for cleanup jobs

    @staticmethod
    def is_revoked(jti):
        return db.session.query(
            TokenBlacklist.query.filter_by(jti=jti).exists()
        ).scalar()
