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


# ────────────────────────────────────────────────────────
# Earning mechanisms
# ────────────────────────────────────────────────────────

DAILY_LOGIN_REWARD = 5
STREAK_BONUSES = {3: 5, 7: 15, 14: 25, 30: 50}   # streak_day -> bonus pts
APPLICATION_REWARD = 3
PROFILE_FIELD_REWARD = 5   # per new field filled
PROFILE_FIELDS = ['university', 'major', 'skills', 'interests', 'bio', 'location']


def _next_streak_info(current_streak):
    """Find the next streak milestone the user hasn't reached yet."""
    for day in sorted(STREAK_BONUSES.keys()):
        if current_streak < day:
            return {'days_needed': day, 'bonus': STREAK_BONUSES[day],
                    'days_remaining': day - current_streak}
    return None


def process_daily_login(user):
    """
    Call on every successful login.
    Awards daily points (once per calendar day) and updates streak.
    Returns dict with reward info or None if already claimed today.
    """
    from datetime import date, timedelta

    today = date.today()
    last = user.last_login_date

    # Already logged in today
    if last == today:
        return None

    reward = DAILY_LOGIN_REWARD
    streak = user.login_streak or 0

    # Check streak continuity
    if last == today - timedelta(days=1):
        streak += 1
    else:
        streak = 1  # reset

    user.last_login_date = today
    user.login_streak = streak

    # Daily login reward
    record_transaction(user, reward, 'daily_login',
                       description=f'Daily login reward (day {streak})')

    # Streak milestone bonus
    streak_bonus = 0
    if streak in STREAK_BONUSES:
        streak_bonus = STREAK_BONUSES[streak]
        record_transaction(user, streak_bonus, 'streak_bonus',
                           description=f'{streak}-day login streak bonus!')

    return {
        'daily_reward': reward,
        'streak': streak,
        'streak_bonus': streak_bonus,
        'total_earned': reward + streak_bonus,
    }


def reward_application(user):
    """Award points for submitting an internship application."""
    record_transaction(user, APPLICATION_REWARD, 'application_reward',
                       description='Points for submitting an application')
    return APPLICATION_REWARD


def reward_profile_field(user, field_name):
    """Award points for filling in a profile field for the first time."""
    record_transaction(user, PROFILE_FIELD_REWARD, 'profile_completion',
                       service_name=field_name,
                       description=f'Completed profile field: {field_name}')
    return PROFILE_FIELD_REWARD


def get_earning_activities(user):
    """Return a list of all earning activities with completion status for the user."""
    from datetime import date

    today = date.today()
    daily_claimed = user.last_login_date == today

    # Profile completion progress
    filled = sum(1 for f in PROFILE_FIELDS if getattr(user, f, None))
    profile_pct = int(filled / len(PROFILE_FIELDS) * 100) if PROFILE_FIELDS else 0

    # Application count
    app_count = PointsTransaction.query.filter_by(
        user_id=user.id, transaction_type='application_reward').count()

    return {
        'daily_login': {
            'name': 'Daily Login',
            'description': f'Log in each day to earn {DAILY_LOGIN_REWARD} points',
            'points': DAILY_LOGIN_REWARD,
            'claimed_today': daily_claimed,
            'streak': user.login_streak or 0,
            'next_streak_bonus': _next_streak_info(user.login_streak or 0),
        },
        'profile_completion': {
            'name': 'Complete Your Profile',
            'description': f'Earn {PROFILE_FIELD_REWARD} pts for each new field you fill in',
            'points_per_field': PROFILE_FIELD_REWARD,
            'filled': filled,
            'total_fields': len(PROFILE_FIELDS),
            'percentage': profile_pct,
            'fields': {f: bool(getattr(user, f, None)) for f in PROFILE_FIELDS},
        },
        'applications': {
            'name': 'Apply for Internships',
            'description': f'Earn {APPLICATION_REWARD} pts each time you apply',
            'points': APPLICATION_REWARD,
            'total_applications': app_count,
        },
        'streak_milestones': {
            'name': 'Login Streak Milestones',
            'description': 'Bonus points for consecutive daily logins',
            'milestones': {str(k): v for k, v in STREAK_BONUSES.items()},
            'current_streak': user.login_streak or 0,
        },
    }
