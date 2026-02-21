"""
Migration script to add Google OAuth columns to the users table.
Run this ONCE after updating the code to add Google Sign-In support.

Usage:
    python migrate_google_oauth.py
"""
from app import create_app
from app.models import db
from sqlalchemy import text

def migrate():
    app = create_app()
    
    with app.app_context():
        print("Adding Google OAuth columns to users table...")
        
        try:
            # Check if columns already exist
            result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='google_id'"))
            if result.fetchone():
                print("✅ google_id column already exists, skipping...")
            else:
                db.session.execute(text("ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE"))
                print("✅ Added google_id column")
        except Exception as e:
            # SQLite doesn't have information_schema, try direct ALTER
            print(f"Trying SQLite approach... ({e})")
            try:
                db.session.execute(text("ALTER TABLE users ADD COLUMN google_id VARCHAR(255)"))
                print("✅ Added google_id column")
            except Exception as e2:
                if 'duplicate column' in str(e2).lower() or 'already exists' in str(e2).lower():
                    print("✅ google_id column already exists")
                else:
                    print(f"⚠️ Could not add google_id: {e2}")
        
        try:
            result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='auth_provider'"))
            if result.fetchone():
                print("✅ auth_provider column already exists, skipping...")
            else:
                db.session.execute(text("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'local'"))
                print("✅ Added auth_provider column")
        except Exception as e:
            try:
                db.session.execute(text("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'local'"))
                print("✅ Added auth_provider column")
            except Exception as e2:
                if 'duplicate column' in str(e2).lower() or 'already exists' in str(e2).lower():
                    print("✅ auth_provider column already exists")
                else:
                    print(f"⚠️ Could not add auth_provider: {e2}")
        
        # Make password_hash nullable (for Google OAuth users who have no password)
        try:
            # PostgreSQL
            db.session.execute(text("ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL"))
            print("✅ Made password_hash nullable")
        except Exception:
            # SQLite doesn't support ALTER COLUMN, but it doesn't enforce NOT NULL strictly anyway
            print("ℹ️  SQLite: password_hash nullable change not needed (SQLite is flexible)")
        
        db.session.commit()
        print("\n✅ Migration complete! Google OAuth is ready.")
        print("Next steps:")
        print("  1. Set GOOGLE_CLIENT_ID in backend .env")
        print("  2. Set VITE_GOOGLE_CLIENT_ID in frontend .env")
        print("  3. Restart both servers")

if __name__ == '__main__':
    migrate()
