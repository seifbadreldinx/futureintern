"""
Migration script to add application_link column to internships table
Run this script to update existing database schema
Supports both PostgreSQL and SQLite
"""
from app import create_app, db
from sqlalchemy import text

def migrate_database():
    app = create_app()
    with app.app_context():
        try:
            # Detect database type
            db_uri = app.config['SQLALCHEMY_DATABASE_URI']
            is_postgres = 'postgresql' in db_uri
            
            # Check if column exists
            if is_postgres:
                # PostgreSQL
                result = db.session.execute(text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name='internships' AND column_name='application_link'"
                ))
            else:
                # SQLite
                result = db.session.execute(text("PRAGMA table_info(internships)"))
                columns = [row[1] for row in result.fetchall()]
                
            if is_postgres:
                if result.fetchone():
                    print("✓ Column 'application_link' already exists in internships table")
                    return
            else:
                if 'application_link' in columns:
                    print("✓ Column 'application_link' already exists in internships table")
                    return
            
            # Add the new column
            print(f"Adding 'application_link' column to internships table ({'PostgreSQL' if is_postgres else 'SQLite'})...")
            db.session.execute(text(
                "ALTER TABLE internships ADD COLUMN application_link VARCHAR(500)"
            ))
            db.session.commit()
            
            print("✓ Successfully added 'application_link' column to internships table")
            print("\nNext steps:")
            print("1. Run import_excel_data.py to re-import internships with application links")
            print("   python import_excel_data.py")
            
        except Exception as e:
            print(f"✗ Error during migration: {e}")
            db.session.rollback()

if __name__ == "__main__":
    migrate_database()
