from flask import Flask, jsonify, request
from config import Config
from app.models import db
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from datetime import datetime
from flask_mail import Mail

# Initialize extensions
mail = Mail()

# Import AuditLog model so SQLAlchemy knows about it when creating tables
from app.models.audit_log import AuditLog  # noqa: F401
# Import CV models so SQLAlchemy creates the tables
from app.models.cv import CV, CVSection  # noqa: F401
# Import points system models so SQLAlchemy creates the tables
from app.models.points import PointsTransaction, PointsPackage, ServicePricing, PurchaseRequest  # noqa: F401
# Import security models so SQLAlchemy creates the tables
from app.models.token_blacklist import TokenBlacklist  # noqa: F401
from app.models.push_token import UserPushToken  # noqa: F401
from app.models.two_factor import TwoFactorCode  # noqa: F401
# Import auth token models so SQLAlchemy creates the tables
from app.models.password_reset import PasswordResetToken  # noqa: F401
from app.models.email_verification import EmailVerificationToken  # noqa: F401

def add_security_headers(response):
    """Add security headers to all responses"""
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    
    # Prevent MIME type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    
    # Enable XSS protection
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # Strict transport security (HTTPS only)
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    # Content security policy
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    
    # Referrer policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Permissions policy
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'

    # Prevent browser from caching authenticated pages (back-button protection)
    # After logout the browser must re-fetch from the server instead of
    # showing a cached copy of the authenticated page.
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    return response

# Try to import Swagger, but make it optional
try:
    from flasgger import Swagger
    SWAGGER_AVAILABLE = True
except ImportError:
    SWAGGER_AVAILABLE = False
    print("Warning: flasgger not available. API documentation will be disabled.")

# Blueprints
from app.auth.routes import auth_bp
from app.users.routes import users_bp
from app.internships.routes import internships_bp
from app.applications.routes import applications_bp
from app.matching.routes import matching_bp
from app.admin.routes import admin_bp
from app.chatbot.routes import chatbot_bp
from app.cv.routes import cv_bp
from app.auth.security_routes import security_bp
from app.points import points_bp
from app.notifications.routes import notifications_bp

# TEMPORARY - Optional imports (won't break app if they fail)
try:
    from app.migration_endpoint import migration_bp
    MIGRATION_BP_AVAILABLE = True
except ImportError:
    MIGRATION_BP_AVAILABLE = False
    print("Warning: migration_endpoint not available")

try:
    from app.bulk_upload import bulk_upload_bp
    BULK_UPLOAD_BP_AVAILABLE = True
except ImportError:
    BULK_UPLOAD_BP_AVAILABLE = False
    print("Warning: bulk_upload not available")

# Error handlers (global)
from app.error_handlers import register_error_handlers

def create_app():
    app = Flask(__name__)
    # Disable strict slashes to avoid automatic redirects (prevents CORS preflight redirect failures)
    app.url_map.strict_slashes = False
    app.config.from_object(Config)

    # تهيئة قاعدة البيانات
    db.init_app(app)
    
    # Create all database tables if they don't exist and run column migrations
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database tables verified/created successfully")
        except Exception as e:
            print(f"⚠️ Warning: Could not create tables: {e}")

        # Add missing columns to existing tables (safe for both SQLite and PostgreSQL)
        try:
            import sqlalchemy as sa
            with db.engine.connect() as conn:
                # Detect database dialect
                dialect = db.engine.dialect.name  # 'sqlite' or 'postgresql'

                # Get existing columns in users table
                if dialect == 'sqlite':
                    result = conn.execute(sa.text("PRAGMA table_info(users)"))
                    existing_columns = {row[1] for row in result.fetchall()}
                else:
                    result = conn.execute(sa.text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_name = 'users'"
                    ))
                    existing_columns = {row[0] for row in result.fetchall()}

                # Migrations: column_name -> ALTER TABLE SQL
                migrations = {
                    'points': "ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0 NOT NULL",
                    'last_login_date': "ALTER TABLE users ADD COLUMN last_login_date DATE",
                    'login_streak': "ALTER TABLE users ADD COLUMN login_streak INTEGER DEFAULT 0",
                    # Default TRUE so existing users are not locked out
                    'email_verified': "ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 1",
                }

                for col, sql in migrations.items():
                    if col not in existing_columns:
                        print(f"🔧 Migration: adding column '{col}' to users table...")
                        conn.execute(sa.text(sql))
                        conn.commit()
                        print(f"✅ Column '{col}' added.")
        except Exception as e:
            print(f"⚠️ Column migration skipped: {e}")
    
    # تهيئة CORS (للسماح بطلبات من المتصفح)
    # Allow frontend origin from environment variable or default to wildcard for development
    cors_origins = app.config.get('CORS_ORIGINS', ['*'])
    CORS(app, resources={r"/api/*": {"origins": cors_origins}},
         supports_credentials=False,
         allow_headers=["Content-Type", "Authorization"],
         expose_headers=["Content-Type", "Authorization"])
    
    # تهيئة JWT
    jwt = JWTManager(app)

    # Initialize Mail
    mail.init_app(app)
    
    # Register JWT token blacklist checker
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload.get('jti')
        if not jti:
            return False
        return db.session.query(
            TokenBlacklist.query.filter_by(jti=jti).exists()
        ).scalar()

    # JWT Error Handlers
    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return jsonify({'error': 'Missing Authorization Header'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        print(f"Invalid token error: {callback}")
        return jsonify({'error': f'Invalid token: {callback}'}), 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401

    # Register global error handlers
    register_error_handlers(app)
    
    # Register security headers middleware
    app.after_request(add_security_headers)

    # Setup structured request logger
    from app.utils.logger import setup_request_logger
    setup_request_logger(app)

    # Swagger for API documentation (optional)
    if SWAGGER_AVAILABLE:
        try:
            swagger_config = {
                "headers": [],
                "specs": [
                    {
                        "endpoint": 'apispec',
                        "route": '/apispec.json',
                        "rule_filter": lambda rule: True,
                        "model_filter": lambda tag: True,
                    }
                ],
                "static_url_path": "/flasgger_static",
                "swagger_ui": True,
                "specs_route": "/apidocs/",
                "title": "FutureIntern API",
                "version": "1.0.0",
                "description": "Complete Backend API for FutureIntern Platform"
            }
            Swagger(app, config=swagger_config)
        except Exception as e:
            print(f"Warning: Could not initialize Swagger: {e}")
            print("API will work without documentation.")

    # Root endpoint
    @app.route("/")
    def index():
        return jsonify({
            "message": "🚀 FutureIntern Backend API",
            "status": "running",
            "endpoints": {
                "auth": "/api/auth/",
                "users": "/api/users/",
                "internships": "/api/internships/",
                "applications": "/api/applications/",
                "recommendations": "/api/recommendations",
                "admin": "/api/admin/",
                "chatbot": "/api/chatbot/"
            }
        })

    # Development helper: Seed dev data - PROTECTED (requires secret token, disabled in production)
    @app.route('/api/debug/seed', methods=['POST'])
    def dev_seed():
        """Create sample company, student, and internship if missing (development use only).
        Optional query param `count` controls how many sample internships to create (default 1).
        Example: POST /api/debug/seed?count=5
        PROTECTED: Disabled in production. Requires X-Seed-Token header matching SEED_SECRET env var.
        """
        import os
        # Block entirely in production
        if os.environ.get('FLASK_ENV') == 'production' or os.environ.get('RAILWAY_ENVIRONMENT'):
            return jsonify({'error': 'This endpoint is disabled in production'}), 403

        # Require a secret token passed as header
        seed_secret = os.environ.get('SEED_SECRET', 'dev-seed-secret-change-me')
        provided_token = request.headers.get('X-Seed-Token', '')
        if provided_token != seed_secret:
            return jsonify({'error': 'Unauthorized: invalid seed token'}), 403

        try:
            from app.models.user import User
            from app.models.intern import Internship

            # Number of internships to create (defaults to 1)
            try:
                count_param = int(request.args.get('count', '1'))
            except Exception:
                count_param = 1

            # Ensure sample company exists
            company_email = 'hr@techcorp.com'
            company = User.query.filter_by(email=company_email).first()
            if not company:
                company = User(
                    name='Tech Corp HR',
                    email=company_email,
                    role='company',
                    company_name='Tech Corp Egypt',
                    company_location='Cairo'
                )
                company.set_password('password123')
                db.session.add(company)
                db.session.commit()

            # Ensure sample student exists
            student_email = 'ahmed@student.com'
            student = User.query.filter_by(email=student_email).first()
            if not student:
                student = User(
                    name='Ahmed Hassan',
                    email=student_email,
                    role='student',
                    university='Cairo University',
                    major='Computer Science'
                )
                student.set_password('student123')
                db.session.add(student)
                db.session.commit()

            # Create the requested number of sample internships
            created = []
            base_location = ['Cairo', 'Alexandria', 'Giza', 'Remote']
            for i in range(max(1, count_param)):
                internship = Internship(
                    title=f'Backend Developer Intern #{i+1}',
                    description='Work on Flask APIs, database design, and backend systems. Great opportunity to learn modern web development.',
                    requirements='Python, Flask, MySQL, Git',
                    location=base_location[i % len(base_location)],
                    duration='3 months',
                    stipend='3000 EGP/month',
                    application_deadline=datetime(2025, 12, 31).date(),
                    start_date=datetime(2026, 1, 15).date(),
                    company_id=company.id,
                    is_active=True
                )
                db.session.add(internship)
                created.append(internship.title)

            db.session.commit()

            # Return how many internships now exist and what was created
            total = Internship.query.count()
            return jsonify({'message': 'Dev seed applied', 'created': created, 'internship_count': total}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    # Serve uploaded files (e.g. CVs)
    @app.route('/uploads/<path:filename>')
    def serve_uploads(filename):
        from flask import send_from_directory
        import os
        uploads_dir = os.path.join(app.root_path, '..', 'uploads')
        return send_from_directory(uploads_dir, filename)

    # تسجيل كل الـ Blueprints مع الـ URL prefix الخاص بكل واحد
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(internships_bp, url_prefix="/api/internships")
    app.register_blueprint(applications_bp, url_prefix="/api/applications")
    app.register_blueprint(matching_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(chatbot_bp, url_prefix="/api/chatbot")
    app.register_blueprint(cv_bp, url_prefix="/api/cv")
    app.register_blueprint(security_bp, url_prefix="/api/auth")
    app.register_blueprint(points_bp, url_prefix="/api/points")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")

    # Seed default points pricing & packages on first run
    with app.app_context():
        try:
            from app.utils.points import seed_default_pricing, seed_default_packages
            seed_default_pricing()
            seed_default_packages()
        except Exception as e:
            print(f"\u26a0\ufe0f Points seeding skipped: {e}")
    
    # TEMPORARY - Register optional blueprints if available
    if MIGRATION_BP_AVAILABLE:
        app.register_blueprint(migration_bp, url_prefix="/api/migration")
    if BULK_UPLOAD_BP_AVAILABLE:
        app.register_blueprint(bulk_upload_bp, url_prefix="/api/admin")

    return app
