#!/usr/bin/env python3
"""
Security Configuration Validator
Checks if all security configurations are properly set before deployment
"""

import os
import sys
from pathlib import Path

def check_env_variable(name, required=True, secure_check=False):
    """Check if environment variable is set and optionally validate security"""
    value = os.getenv(name)
    
    if not value:
        if required:
            print(f"❌ {name}: NOT SET (REQUIRED)")
            return False
        else:
            print(f"⚠️  {name}: Not set (optional)")
            return True
    
    # Check for default/weak values
    if secure_check:
        weak_values = [
            'change-me',
            'your-secret-key',
            'password123',
            'admin123',
            'test',
            'development',
            'localhost'
        ]
        
        if any(weak in value.lower() for weak in weak_values):
            print(f"❌ {name}: WEAK VALUE DETECTED - Please use a strong value")
            return False
    
    print(f"✅ {name}: Set")
    return True

def check_password_config():
    """Check password policy configuration"""
    min_length = int(os.getenv('MIN_PASSWORD_LENGTH', 8))
    require_complexity = os.getenv('REQUIRE_PASSWORD_COMPLEXITY', 'true').lower() == 'true'
    
    if min_length < 8:
        print(f"⚠️  Password min length ({min_length}) is less than recommended (8)")
        return False
    
    if not require_complexity:
        print("⚠️  Password complexity requirements are disabled")
        return False
    
    print("✅ Password policy: Configured securely")
    return True

def check_flask_config():
    """Check Flask security settings"""
    flask_env = os.getenv('FLASK_ENV', 'production')
    flask_debug = os.getenv('FLASK_DEBUG', '0')
    
    issues = []
    
    if flask_env != 'production':
        issues.append(f"FLASK_ENV={flask_env} (should be 'production')")
    
    if flask_debug != '0' and flask_debug.lower() != 'false':
        issues.append(f"FLASK_DEBUG={flask_debug} (should be '0' or 'false')")
    
    if issues:
        print(f"❌ Flask config issues: {', '.join(issues)}")
        return False
    
    print("✅ Flask configuration: Secure")
    return True

def check_database_config():
    """Check database configuration"""
    db_url = os.getenv('DATABASE_URL', '')
    
    if not db_url:
        print("⚠️  DATABASE_URL not set - will use SQLite (not recommended for production)")
        return False
    
    if db_url.startswith('sqlite'):
        print("❌ Using SQLite - PostgreSQL recommended for production")
        return False
    
    if db_url.startswith('postgresql') or db_url.startswith('postgres'):
        print("✅ Database: PostgreSQL configured")
        return True
    
    print(f"⚠️  Unknown database type: {db_url.split(':')[0]}")
    return False

def check_cors_config():
    """Check CORS configuration"""
    frontend_url = os.getenv('FRONTEND_URL', '')
    
    if not frontend_url:
        print("❌ FRONTEND_URL not set - CORS will be wide open")
        return False
    
    if 'localhost' in frontend_url.lower():
        print("⚠️  FRONTEND_URL contains 'localhost' - update for production")
        return False
    
    if frontend_url == '*':
        print("❌ FRONTEND_URL is '*' - this allows any origin (security risk)")
        return False
    
    print(f"✅ CORS: Configured for {frontend_url}")
    return True

def check_email_config():
    """Check email configuration"""
    required_vars = ['MAIL_SERVER', 'MAIL_USERNAME', 'MAIL_PASSWORD']
    all_set = all(os.getenv(var) for var in required_vars)
    
    if not all_set:
        print("⚠️  Email not fully configured - password reset will not work")
        return False
    
    print("✅ Email: Configured")
    return True

def check_file_exists(path, description):
    """Check if required file exists"""
    if Path(path).exists():
        print(f"✅ {description}: Found")
        return True
    else:
        print(f"❌ {description}: NOT FOUND at {path}")
        return False

def main():
    """Run all security checks"""
    print("=" * 60)
    print("FutureIntern Security Configuration Validator")
    print("=" * 60)
    print()
    
    checks = []
    
    # Environment variables
    print("Checking Environment Variables...")
    print("-" * 60)
    checks.append(check_env_variable('JWT_SECRET_KEY', required=True, secure_check=True))
    checks.append(check_env_variable('DATABASE_URL', required=False))
    checks.append(check_env_variable('FRONTEND_URL', required=True))
    checks.append(check_env_variable('MAIL_SERVER', required=False))
    checks.append(check_env_variable('MAIL_USERNAME', required=False))
    checks.append(check_env_variable('MAIL_PASSWORD', required=False))
    print()
    
    # Configuration checks
    print("Checking Security Configurations...")
    print("-" * 60)
    checks.append(check_password_config())
    checks.append(check_flask_config())
    checks.append(check_database_config())
    checks.append(check_cors_config())
    checks.append(check_email_config())
    print()
    
    # File checks
    print("Checking Required Files...")
    print("-" * 60)
    checks.append(check_file_exists('.env', '.env file'))
    checks.append(check_file_exists('requirements.txt', 'requirements.txt'))
    checks.append(check_file_exists('app/__init__.py', 'Flask app'))
    print()
    
    # Summary
    print("=" * 60)
    passed = sum(checks)
    total = len(checks)
    
    if passed == total:
        print(f"✅ All checks passed! ({passed}/{total})")
        print("=" * 60)
        print("Your application is ready for deployment.")
        return 0
    elif passed >= total * 0.8:
        print(f"⚠️  Most checks passed ({passed}/{total})")
        print("=" * 60)
        print("Please review warnings above before deploying.")
        return 1
    else:
        print(f"❌ Security checks failed ({passed}/{total})")
        print("=" * 60)
        print("CRITICAL: Fix all errors before deploying to production!")
        return 2

if __name__ == '__main__':
    sys.exit(main())
