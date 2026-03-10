"""
Points System Models
- PointsTransaction: logs every point earn/spend/purchase
- PointsPackage: store items users can buy (admin-configurable)
- ServicePricing: per-service cost configuration (admin-configurable)
"""
from app.models import db
from datetime import datetime


class PointsTransaction(db.Model):
    """Audit trail for every point balance change."""
    __tablename__ = 'points_transactions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    amount = db.Column(db.Integer, nullable=False)           # positive = earned, negative = spent
    balance_after = db.Column(db.Integer, nullable=False)     # snapshot after this txn
    transaction_type = db.Column(db.String(30), nullable=False)  # signup_bonus, service_charge, purchase, admin_grant, refund
    service_name = db.Column(db.String(50), nullable=True)    # e.g. cv_export, chatbot, matching
    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('points_transactions', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': self.amount,
            'balance_after': self.balance_after,
            'transaction_type': self.transaction_type,
            'service_name': self.service_name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class PointsPackage(db.Model):
    """Purchasable points packages displayed in the Points Store."""
    __tablename__ = 'points_packages'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)          # e.g. "Starter Pack"
    points = db.Column(db.Integer, nullable=False)             # how many points the user gets
    price = db.Column(db.Float, nullable=False)                # price in USD (or local currency)
    discount_percent = db.Column(db.Float, default=0)          # 0-100
    is_active = db.Column(db.Boolean, default=True)
    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def effective_price(self):
        if self.discount_percent and self.discount_percent > 0:
            return round(self.price * (1 - self.discount_percent / 100), 2)
        return self.price

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'points': self.points,
            'price': self.price,
            'discount_percent': self.discount_percent,
            'effective_price': self.effective_price(),
            'is_active': self.is_active,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class PurchaseRequest(db.Model):
    """Pending points purchase requests awaiting admin approval."""
    __tablename__ = 'purchase_requests'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    package_id = db.Column(db.Integer, db.ForeignKey('points_packages.id', ondelete='SET NULL'), nullable=True)
    package_name = db.Column(db.String(100), nullable=False)
    points = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, approved, rejected
    admin_note = db.Column(db.String(255), nullable=True)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('purchase_requests', lazy='dynamic'))
    package = db.relationship('PointsPackage', backref=db.backref('purchase_requests', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'user_email': self.user.email if self.user else None,
            'package_id': self.package_id,
            'package_name': self.package_name,
            'points': self.points,
            'price': self.price,
            'status': self.status,
            'admin_note': self.admin_note,
            'reviewed_by': self.reviewed_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
        }


class ServicePricing(db.Model):
    """Admin-configurable cost (in points) for each platform service."""
    __tablename__ = 'service_pricing'

    id = db.Column(db.Integer, primary_key=True)
    service_key = db.Column(db.String(50), unique=True, nullable=False)  # e.g. cv_export, chatbot
    display_name = db.Column(db.String(100), nullable=False)
    points_cost = db.Column(db.Integer, nullable=False, default=0)
    first_time_free = db.Column(db.Boolean, default=False)
    description = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'service_key': self.service_key,
            'display_name': self.display_name,
            'points_cost': self.points_cost,
            'first_time_free': self.first_time_free,
            'description': self.description,
            'is_active': self.is_active,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
