"""
Initialize the database with tables
Run this once to create the database schema
"""
from app import create_app
from app.models import db
from app.models.user import User
from app.models.intern import Internship
from datetime import datetime

def init_database():
    app = create_app()
    
    with app.app_context():
        # Create all tables
        print("Creating database tables...")
        db.create_all()
        print("✅ Database tables created successfully!")
        print(f"Database file location: {app.config['SQLALCHEMY_DATABASE_URI']}")

        # ---- DEV SEEDS: create sample company, student, and internship if missing ----
        # Create sample company user
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
            print(f"✅ Created sample company user: {company_email} (password: password123)")
        else:
            print(f"ℹ️ Sample company user already exists: {company_email}")

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

        # Create a sample internship if none exist
        if Internship.query.count() == 0:
            internship = Internship(
                title='Backend Developer Intern',
                description='Work on Flask APIs, database design, and backend systems. Great opportunity to learn modern web development.',
                requirements='Python, Flask, MySQL, Git',
                location='Cairo',
                duration='3 months',
                stipend='3000 EGP/month',
                application_deadline=datetime(2025, 12, 31).date(),
                start_date=datetime(2026, 1, 15).date(),
                company_id=company.id,
                is_active=True
            )
            db.session.add(internship)
            db.session.commit()
            print(f"✅ Created sample internship (id: {internship.id})")
        else:
            print("ℹ️ Internships already exist in the database; skipping sample create")

        # Optional: Create a test admin user
        # Uncomment if you want a default admin user
        # admin = User(
        #     name="Admin",
        #     email="admin@futureintern.com",
        #     role="admin"
        # )
        # admin.set_password("admin123")
        # db.session.add(admin)
        # db.session.commit()
        # print("✅ Default admin user created (admin@futureintern.com / admin123)")

if __name__ == "__main__":
    init_database()

