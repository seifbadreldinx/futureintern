from flask import Flask, jsonify, request
from config import Config
from app.models import db
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from datetime import datetime
from flask_mail import Mail

# Initialize extensions
mail = Mail()

# Try to import Swagger, but make it optional
try:
    from flasgger import Swagger
    SWAGGER_AVAILABLE = True
except ImportError:
    SWAGGER_AVAILABLE = False
    print("Warning: flasgger not available. API documentation will be disabled.")

# استدعاء Blueprints
from app.auth.routes import auth_bp
from app.users.routes import users_bp
from app.internships.routes import internships_bp
from app.applications.routes import applications_bp
from app.matching.routes import matching_bp
from app.admin.routes import admin_bp
from app.chatbot.routes import chatbot_bp

# Error handlers (global)
from app.error_handlers import register_error_handlers

def create_app():
    app = Flask(__name__)
    # Disable strict slashes to avoid automatic redirects (prevents CORS preflight redirect failures)
    app.url_map.strict_slashes = False
    app.config.from_object(Config)

    # تهيئة قاعدة البيانات
    db.init_app(app)
    
    # تهيئة CORS (للسماح بطلبات من المتصفح)
    # Allow frontend origin from environment variable or default to wildcard for development
    cors_origins = app.config.get('CORS_ORIGINS', ['*'])
    CORS(app, resources={r"/api/*": {"origins": cors_origins}},
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
         expose_headers=["Content-Type", "Authorization"])
    
    # تهيئة JWT
    jwt = JWTManager(app)

    # Initialize Mail
    mail.init_app(app)
    
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

    # Development helper: Seed dev data via HTTP so you can populate the DB from the browser or curl
    @app.route('/api/debug/seed', methods=['POST'])
    def dev_seed():
        """Create sample company, student, and internship if missing (development use only).
        Optional query param `count` controls how many sample internships to create (default 1).
        Example: POST /api/debug/seed?count=5
        """
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

    # تسجيل كل الـ Blueprints مع الـ URL prefix الخاص بكل واحد
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(internships_bp, url_prefix="/api/internships")
    app.register_blueprint(applications_bp, url_prefix="/api/applications")
    app.register_blueprint(matching_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(chatbot_bp, url_prefix="/api/chatbot")

    return app
