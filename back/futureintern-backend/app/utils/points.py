"""
Points System Utilities
Central helpers for earning, spending, and checking points.
All point mutations go through these functions to ensure consistency and audit logging.
"""
from app.models import db
from app.models.points import PointsTransaction, ServicePricing


def record_transaction(user, amount, transaction_type, service_name=None, description=None):
    """Create a PointsTransaction and update the user's balance atomically."""
    user.points = (user.points or 0) + amount
    txn = PointsTransaction(
        user_id=user.id,
        amount=amount,
        balance_after=user.points,
        transaction_type=transaction_type,
        service_name=service_name,
        description=description,
    )
    db.session.add(txn)
    return txn


def check_and_charge(user, service_key):
    """
    Check if user can afford the service and charge them.
    Returns (success: bool, message: str, charged_points: int).
    Handles first-time-free logic automatically.
    """
    pricing = ServicePricing.query.filter_by(service_key=service_key, is_active=True).first()

    if not pricing:
        # No pricing configured → free
        return True, 'Service is free', 0

    cost = pricing.points_cost

    # First-time-free check
    if pricing.first_time_free:
        used_before = PointsTransaction.query.filter_by(
            user_id=user.id,
            service_name=service_key,
            transaction_type='service_charge',
        ).first()
        if not used_before:
            # Record a 0-cost transaction so we know they used it once
            record_transaction(
                user, 0, 'service_charge', service_name=service_key,
                description=f'First-time free usage of {pricing.display_name}',
            )
            return True, 'First time free', 0

    # Insufficient balance
    if (user.points or 0) < cost:
        return False, f'Insufficient points. You need {cost} points for {pricing.display_name}, but you have {user.points or 0}.', cost

    # Charge
    record_transaction(
        user, -cost, 'service_charge', service_name=service_key,
        description=f'Used {pricing.display_name}',
    )
    return True, f'Charged {cost} points', cost


def grant_signup_bonus(user, bonus=50):
    """Grant the signup bonus points to a newly registered user."""
    user.points = bonus
    record_transaction(
        user, bonus, 'signup_bonus',
        description='Welcome bonus on registration',
    )


def get_service_pricing_map():
    """Return a dict of all active service pricing configs keyed by service_key."""
    rows = ServicePricing.query.filter_by(is_active=True).all()
    return {r.service_key: r for r in rows}


def seed_default_pricing():
    """Insert default service pricing rows if they don't exist yet."""
    defaults = [
        {
            'service_key': 'cv_export',
            'display_name': 'CV PDF Export',
            'points_cost': 15,
            'first_time_free': True,
            'description': 'Export your CV as a professional PDF',
        },
        {
            'service_key': 'chatbot',
            'display_name': 'AI Chatbot Message',
            'points_cost': 1,
            'first_time_free': False,
            'description': 'Send a message to the AI assistant',
        },
        {
            'service_key': 'ai_matching',
            'display_name': 'AI Internship Matching',
            'points_cost': 5,
            'first_time_free': True,
            'description': 'Get AI-powered internship recommendations',
        },
    ]
    for d in defaults:
        existing = ServicePricing.query.filter_by(service_key=d['service_key']).first()
        if not existing:
            db.session.add(ServicePricing(**d))
    db.session.commit()


def seed_default_packages():
    """Insert default points packages if table is empty."""
    from app.models.points import PointsPackage
    if PointsPackage.query.count() > 0:
        return
    packages = [
        {'name': 'Starter Pack', 'points': 50, 'price': 2.99, 'discount_percent': 0,
         'description': 'Great for getting started'},
        {'name': 'Standard Pack', 'points': 150, 'price': 7.99, 'discount_percent': 10,
         'description': 'Most popular choice'},
        {'name': 'Premium Pack', 'points': 500, 'price': 19.99, 'discount_percent': 20,
         'description': 'Best value for power users'},
        {'name': 'Ultimate Pack', 'points': 1200, 'price': 39.99, 'discount_percent': 30,
         'description': 'Maximum points at the best discount'},
    ]
    for p in packages:
        db.session.add(PointsPackage(**p))
    db.session.commit()
