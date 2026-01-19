#!/usr/bin/env python
"""
Railway Post-Deploy Script
Run this manually after first deployment to import data:
railway run python init_railway.py
"""
import os
import sys

def main():
    """Initialize Railway deployment with data"""
    print("\n" + "=" * 50)
    print("🚀 Railway Initialization Script")
    print("=" * 50)
    
    # Only run if DATABASE_URL is set (production)
    if not os.environ.get('DATABASE_URL'):
        print("❌ DATABASE_URL not set - this is for Railway only")
        sys.exit(1)
    
    print("\n1. Running database migration...")
    try:
        from add_application_link import migrate_database
        migrate_database()
    except Exception as e:
        print(f"⚠️ Migration: {e}")
    
    print("\n2. Importing internship data...")
    try:
        from app import create_app, db
        from app.models.intern import Internship
        
        app = create_app()
        with app.app_context():
            count = Internship.query.count()
            
            if count > 0:
                print(f"✅ Database already has {count} internships")
            else:
                from import_excel_data import seed_database
                seed_database()
                print("✅ Data imported successfully")
    except Exception as e:
        print(f"❌ Data import failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("✅ Railway initialization completed!")
    print("=" * 50 + "\n")

if __name__ == "__main__":
    main()
