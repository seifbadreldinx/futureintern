"""
Cleanup script to remove fake test data from the database
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from app.models.user import User
from app.models.intern import Internship
from app.models.application import Application

def cleanup_fake_data():
    """Remove fake test data (Tech Corp Egypt and test student)"""
    
    app = create_app()
    
    with app.app_context():
        print("🧹 Cleaning up fake test data...\n")
        
        try:
            # Delete Tech Corp Egypt and its internships
            tech_corp = User.query.filter_by(company_name='Tech Corp Egypt').first()
            if tech_corp:
                # Find and delete all internships by this company
                internships = Internship.query.filter_by(company_id=tech_corp.id).all()
                for internship in internships:
                    # Delete applications for this internship
                    Application.query.filter_by(internship_id=internship.id).delete()
                    db.session.delete(internship)
                    print(f"  🗑️  Deleted internship: {internship.title}")
                
                # Delete the company user
                db.session.delete(tech_corp)
                print(f"  🗑️  Deleted company: {tech_corp.company_name} ({tech_corp.email})")
            else:
                print("  ℹ️  Tech Corp Egypt not found (may have been already deleted)")
            
            # Delete test student account
            test_student = User.query.filter_by(email='ahmed@student.com').first()
            if test_student:
                # Delete applications by this student
                Application.query.filter_by(student_id=test_student.id).delete()
                db.session.delete(test_student)
                print(f"  🗑️  Deleted test student: {test_student.email}")
            else:
                print("  ℹ️  Test student not found (may have been already deleted)")
            
            db.session.commit()
            
            print("\n✅ Cleanup completed successfully!")
            print("\n📊 Summary:")
            print(f"  - Total users now: {User.query.count()}")
            print(f"  - Total companies now: {User.query.filter_by(role='company').count()}")
            print(f"  - Total internships now: {Internship.query.count()}")
            
            return True
            
        except Exception as e:
            print(f"\n❌ Cleanup failed: {e}")
            db.session.rollback()
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    print("="*50)
    print("  Fake Data Cleanup Tool")
    print("="*50 + "\n")
    
    success = cleanup_fake_data()
    
    if success:
        print("\n✅ All fake data has been removed!")
        print("🌐 Refresh your website to see only real data!")
    else:
        print("\n❌ Cleanup failed. Please check the errors above.")
        sys.exit(1)
