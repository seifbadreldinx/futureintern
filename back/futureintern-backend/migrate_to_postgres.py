"""
Migration script to transfer data from SQLite to PostgreSQL
Run this script to migrate all your real internships, companies, and users
"""
import sys
import os

# Add the parent directory to path to import app
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from app.models.user import User
from app.models.intern import Internship
from app.models.application import Application
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def migrate_data():
    """Migrate data from SQLite to PostgreSQL"""
    
    # Create Flask app
    app = create_app()
    
    with app.app_context():
        print("🔄 Starting data migration from SQLite to PostgreSQL...")
        
        # Get PostgreSQL database URL from config
        postgres_url = app.config['SQLALCHEMY_DATABASE_URI']
        
        # Create SQLite connection
        sqlite_path = os.path.join(os.path.dirname(__file__), 'futureintern.db')
        sqlite_url = f'sqlite:///{sqlite_path}'
        
        print(f"📂 Source (SQLite): {sqlite_url}")
        print(f"📂 Target (PostgreSQL): {postgres_url[:50]}...")
        
        # Create engine for SQLite
        sqlite_engine = create_engine(sqlite_url)
        SqliteSession = sessionmaker(bind=sqlite_engine)
        sqlite_session = SqliteSession()
        
        try:
            # Import models with SQLite session
            from app.models.user import User as SqliteUser
            from app.models.intern import Internship as SqliteInternship
            from app.models.application import Application as SqliteApplication
            
            # Migrate Users
            print("\n👥 Migrating Users...")
            sqlite_users = sqlite_session.query(SqliteUser).all()
            user_id_map = {}  # Map old IDs to new IDs
            
            for old_user in sqlite_users:
                # Check if user already exists in PostgreSQL
                existing_user = User.query.filter_by(email=old_user.email).first()
                if existing_user:
                    print(f"  ⚠️  User {old_user.email} already exists, skipping...")
                    user_id_map[old_user.id] = existing_user.id
                    continue
                
                new_user = User(
                    name=old_user.name,
                    email=old_user.email,
                    password_hash=old_user.password_hash,
                    role=old_user.role,
                    university=old_user.university,
                    major=old_user.major,
                    skills=old_user.skills,
                    interests=old_user.interests,
                    bio=old_user.bio,
                    phone=old_user.phone,
                    location=old_user.location,
                    resume_url=old_user.resume_url,
                    profile_image=old_user.profile_image,
                    company_name=old_user.company_name,
                    company_description=old_user.company_description,
                    company_website=old_user.company_website,
                    company_location=old_user.company_location,
                    is_verified=old_user.is_verified,
                    created_at=old_user.created_at
                )
                db.session.add(new_user)
                db.session.flush()  # Get the new ID
                user_id_map[old_user.id] = new_user.id
                print(f"  ✅ Migrated user: {old_user.email} ({old_user.role})")
            
            db.session.commit()
            print(f"✅ Migrated {len(sqlite_users)} users")
            
            # Migrate Internships
            print("\n💼 Migrating Internships...")
            sqlite_internships = sqlite_session.query(SqliteInternship).all()
            internship_id_map = {}
            
            for old_internship in sqlite_internships:
                new_company_id = user_id_map.get(old_internship.company_id)
                if not new_company_id:
                    print(f"  ⚠️  Warning: Company not found for internship '{old_internship.title}', skipping...")
                    continue
                
                new_internship = Internship(
                    title=old_internship.title,
                    description=old_internship.description,
                    requirements=old_internship.requirements,
                    location=old_internship.location,
                    duration=old_internship.duration,
                    stipend=old_internship.stipend,
                    application_deadline=old_internship.application_deadline,
                    start_date=old_internship.start_date,
                    major=old_internship.major,
                    required_skills=old_internship.required_skills,
                    company_id=new_company_id,
                    is_active=old_internship.is_active,
                    created_at=old_internship.created_at,
                    updated_at=old_internship.updated_at
                )
                db.session.add(new_internship)
                db.session.flush()
                internship_id_map[old_internship.id] = new_internship.id
                print(f"  ✅ Migrated internship: {old_internship.title}")
            
            db.session.commit()
            print(f"✅ Migrated {len(sqlite_internships)} internships")
            
            # Migrate Applications
            print("\n📝 Migrating Applications...")
            sqlite_applications = sqlite_session.query(SqliteApplication).all()
            
            for old_app in sqlite_applications:
                new_student_id = user_id_map.get(old_app.student_id)
                new_internship_id = internship_id_map.get(old_app.internship_id)
                
                if not new_student_id or not new_internship_id:
                    print(f"  ⚠️  Warning: Missing student or internship for application, skipping...")
                    continue
                
                new_app = Application(
                    student_id=new_student_id,
                    internship_id=new_internship_id,
                    cover_letter=old_app.cover_letter,
                    status=old_app.status,
                    applied_at=old_app.applied_at
                )
                db.session.add(new_app)
                print(f"  ✅ Migrated application")
            
            db.session.commit()
            print(f"✅ Migrated {len(sqlite_applications)} applications")
            
            print("\n" + "="*50)
            print("🎉 Migration completed successfully!")
            print("="*50)
            print(f"\n📊 Summary:")
            print(f"  - Users: {len(sqlite_users)}")
            print(f"  - Internships: {len(sqlite_internships)}")
            print(f"  - Applications: {len(sqlite_applications)}")
            
        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            db.session.rollback()
            import traceback
            traceback.print_exc()
            return False
        finally:
            sqlite_session.close()
        
        return True

if __name__ == '__main__':
    print("="*50)
    print("  SQLite → PostgreSQL Migration Tool")
    print("="*50)
    
    success = migrate_data()
    
    if success:
        print("\n✅ All data has been migrated to PostgreSQL!")
        print("🌐 Your website should now show all your real internships and companies!")
    else:
        print("\n❌ Migration failed. Please check the errors above.")
        sys.exit(1)
