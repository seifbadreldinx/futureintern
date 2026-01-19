"""
Script to fix broken applications with invalid internship IDs
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from app.models.application import Application
from app.models.intern import Internship

def fix_broken_applications():
    """Fix applications that point to non-existent internships"""
    
    app = create_app()
    
    with app.app_context():
        print("🔧 Checking for broken applications...\n")
        
        # Get all applications
        all_applications = Application.query.all()
        print(f"📊 Total applications: {len(all_applications)}")
        
        # Get all internships
        all_internships = Internship.query.all()
        print(f"📊 Total internships: {len(all_internships)}")
        
        if len(all_internships) == 0:
            print("\n❌ No internships found in database!")
            print("Please create internships first before fixing applications.")
            return False
        
        # Check each application
        broken_apps = []
        for app_record in all_applications:
            internship = Internship.query.get(app_record.internship_id)
            if not internship:
                broken_apps.append(app_record)
                print(f"\n⚠️  Broken application found:")
                print(f"   - Application ID: {app_record.id}")
                print(f"   - Student ID: {app_record.student_id}")
                print(f"   - Broken Internship ID: {app_record.internship_id}")
                print(f"   - Status: {app_record.status}")
        
        if len(broken_apps) == 0:
            print("\n✅ No broken applications found!")
            return True
        
        print(f"\n🔧 Found {len(broken_apps)} broken application(s)")
        print("\n📋 Available internships to reassign to:")
        for i, internship in enumerate(all_internships[:5], 1):
            print(f"   {i}. {internship.title} (ID: {internship.id})")
        
        # Fix by assigning to the first available internship
        first_internship = all_internships[0]
        print(f"\n🔄 Fixing broken applications by assigning them to:")
        print(f"   '{first_internship.title}' (ID: {first_internship.id})")
        
        for app_record in broken_apps:
            old_id = app_record.internship_id
            app_record.internship_id = first_internship.id
            print(f"   ✅ Updated application {app_record.id}: {old_id} → {first_internship.id}")
        
        db.session.commit()
        
        print(f"\n✅ Fixed {len(broken_apps)} application(s)!")
        print("🌐 Applications should now work correctly in the dashboard!")
        
        return True

if __name__ == '__main__':
    print("="*50)
    print("  Application Fixer Tool")
    print("="*50 + "\n")
    
    success = fix_broken_applications()
    
    if success:
        print("\n" + "="*50)
        print("✅ Done! Refresh your dashboard to see the fix.")
        print("="*50)
    else:
        print("\n" + "="*50)
        print("❌ Could not fix applications.")
        print("="*50)
        sys.exit(1)
