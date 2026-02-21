"""
Initialize the database with tables
Run this once to create the database schema
"""
from app import create_app
from app.models import db
from app.models.user import User
from app.models.intern import Internship
from datetime import datetime

def run_migrations(engine):
    """Add any missing columns to existing tables."""
    import sqlalchemy as sa
    with engine.connect() as conn:
        # Get existing columns in users table
        result = conn.execute(sa.text("PRAGMA table_info(users)"))
        existing_columns = {row[1] for row in result.fetchall()}

        # Map of column_name -> ALTER TABLE statement
        migrations = {
            'google_id':             "ALTER TABLE users ADD COLUMN google_id TEXT",
            'auth_provider':         "ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local'",
            'location':              "ALTER TABLE users ADD COLUMN location TEXT",
            'two_factor_enabled':    "ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0",
            'failed_login_attempts': "ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0",
            'locked_until':          "ALTER TABLE users ADD COLUMN locked_until DATETIME",
            'is_verified':           "ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0",
        }

        for col, sql in migrations.items():
            if col not in existing_columns:
                print(f"🔧 Migration: adding column '{col}' to users table...")
                conn.execute(sa.text(sql))
                conn.commit()
                print(f"✅ Column '{col}' added.")


def init_database():
    app = create_app()
    
    with app.app_context():
        # Create all tables
        print("Creating database tables...")
        db.create_all()
        print("✅ Database tables created successfully!")
        print(f"Database file location: {app.config['SQLALCHEMY_DATABASE_URI']}")

        # Run migrations to add any missing columns
        run_migrations(db.engine)


        # ---- DEV SEEDS: create sample company, student, and internship if missing ----
        # Create sample student user
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
            print(f"✅ Created sample student user: {student_email} (password: student123)")
        else:
            print(f"ℹ️ Sample student user already exists: {student_email}")

        # Default admin user
        admin_email = "admin@futureintern.com"
        admin = User.query.filter_by(email=admin_email).first()
        if not admin:
            admin = User(
                name="Admin",
                email=admin_email,
                role="admin"
            )
            admin.set_password("admin123")
            db.session.add(admin)
            db.session.commit()
            print(f"✅ Default admin user created ({admin_email} / admin123)")
        else:
            # Ensure it has the admin role
            admin.role = "admin"
            db.session.commit()
            print(f"ℹ️ Admin user already exists: {admin_email}")

if __name__ == "__main__":
    init_database()

