#!/usr/bin/env python
"""
Railway Deployment Build Script
Runs database migrations and imports initial data on deployment
"""
import os
import sys

def run_migrations():
    """Run database migrations"""
    print("=" * 50)
    print("Running database migrations...")
    print("=" * 50)
    
    # Add application link column
    try:
        from add_application_link import migrate_database
        migrate_database()
        print("✅ Migration completed successfully")
    except Exception as e:
        print(f"⚠️ Migration warning: {e}")
        # Don't fail if column already exists
    
def import_data():
    """Import internship data from CSV"""
    print("\n" + "=" * 50)
    print("Importing internship data...")
    print("=" * 50)
    
    # Check if we should skip import (data already exists)
    from app import create_app, db
    from app.models.intern import Internship
    
    app = create_app()
    with app.app_context():
        count = Internship.query.count()
        
        if count > 0:
            print(f"✅ Database already has {count} internships - skipping import")
            return
        
        # Import data
        try:
            from import_excel_data import seed_database
            seed_database()
            print("✅ Data import completed successfully")
        except Exception as e:
            print(f"❌ Data import failed: {e}")
            sys.exit(1)

def main():
    """Main deployment script"""
    print("\n" + "=" * 50)
    print("🚀 Railway Deployment Script")
    print("=" * 50)
    
    # Only run if DATABASE_URL is set (production)
    if not os.environ.get('DATABASE_URL'):
        print("⚠️ DATABASE_URL not set - skipping deployment tasks")
        print("This is normal for local development")
        sys.exit(0)
    
    try:
        run_migrations()
        import_data()
        print("\n" + "=" * 50)
        print("✅ Deployment build completed successfully!")
        print("=" * 50 + "\n")
    except Exception as e:
        print(f"\n❌ Deployment build failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
