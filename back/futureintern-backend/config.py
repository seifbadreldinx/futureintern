import os
from datetime import timedelta
import secrets

class Config:
    # SQLite database (no server needed) - Easy setup, no MySQL required
    basedir = os.path.abspath(os.path.dirname(__file__))
    # Database Configuration: reads from environment variable ONLY (never hardcode credentials!)
    database_url = os.environ.get('DATABASE_URL', f'sqlite:///{os.path.join(basedir, "futureintern.db")}')
    if database_url and database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_DATABASE_URI = database_url
    
    # MySQL database (XAMPP) - Uncomment if you have MySQL/XAMPP running
    # SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:@localhost:3306/futureintern"
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration - SECURITY: Generate strong secret if not provided
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or secrets.token_urlsafe(32)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Disable CSRF for API (we're using Bearer tokens, not cookies)
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_CSRF_CHECK_FORM = False
    
    # CORS Configuration - Allow frontend domain(s)
    # FRONTEND_URL can be a comma-separated list of allowed origins
    _frontend_url = os.environ.get('FRONTEND_URL', 'https://futureintern-two.vercel.app')
    CORS_ORIGINS = [origin.strip() for origin in _frontend_url.split(',') if origin.strip()]

    # Mail Configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 465))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'false').lower() in ['true', 'on', '1']
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', MAIL_USERNAME)
    MAIL_TIMEOUT = 30  # seconds – prevent SMTP hangs

    # Resend (HTTP email API — works on Railway where SMTP is blocked)
    RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
    RESEND_FROM = os.environ.get('RESEND_FROM', '')

    # Mailjet (RECOMMENDED — 200 emails/day free, sends to any email, no domain needed)
    # Sign up at https://app.mailjet.com → Account → API Keys
    MAILJET_API_KEY = os.environ.get('MAILJET_API_KEY')
    MAILJET_API_SECRET = os.environ.get('MAILJET_API_SECRET')
    MAILJET_SENDER_EMAIL = os.environ.get('MAILJET_SENDER_EMAIL')
    MAILJET_SENDER_NAME = os.environ.get('MAILJET_SENDER_NAME', 'FutureIntern')

    # Brevo / Sendinblue (preferred — no domain verification needed, just verify sender email)
    BREVO_API_KEY = os.environ.get('BREVO_API_KEY')
    BREVO_SENDER_EMAIL = os.environ.get('BREVO_SENDER_EMAIL', os.environ.get('MAIL_USERNAME', ''))
    BREVO_SENDER_NAME = os.environ.get('BREVO_SENDER_NAME', 'FutureIntern')

    # Security Configuration
    # Maximum file upload size (5MB)
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024
    
    # Session security
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() in ['true', '1']  # True in production (HTTPS), False for localhost
    SESSION_COOKIE_HTTPONLY = True  # Prevent JavaScript access to session cookie
    SESSION_COOKIE_SAMESITE = 'Lax'  # CSRF protection
    
    # Security headers
    SEND_FILE_MAX_AGE_DEFAULT = 31536000  # Cache static files for 1 year
    
    # Password policy
    MIN_PASSWORD_LENGTH = 8
    REQUIRE_PASSWORD_COMPLEXITY = True  # Require letters, numbers, special chars
    
    # Google OAuth
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')

    # OpenAI (optional, fallback AI)
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    OPENAI_MODEL = os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')

    # Hugging Face (primary AI chatbot)
    # Phi-3-mini is free, fast, and confirmed available on the HF Inference API
    HUGGINGFACE_API_KEY = os.environ.get('HUGGINGFACE_API_KEY')
    HUGGINGFACE_MODEL = os.environ.get('HUGGINGFACE_MODEL', 'Qwen/Qwen2.5-72B-Instruct')
