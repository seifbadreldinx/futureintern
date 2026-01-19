"""
Migration script to add application_link column to internships table
Run this script to update existing database schema
"""
from app import create_app, db
from sqlalchemy import text

def migrate_database():
    app = create_app()
    with app.app_context():
        try:
            # For SQLite, check if column exists by querying table info
            result = db.session.execute(text("PRAGMA table_info(internships)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'application_link' in columns:
                print("✓ Column 'application_link' already exists in internships table")
                return
            
            # Add the new column
            print("Adding 'application_link' column to internships table...")
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
