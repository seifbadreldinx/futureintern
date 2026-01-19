from app import create_app

app = create_app()


import sqlite3
import os

def check_and_migrate_db():
    try:
        base_dir = os.path.abspath(os.path.dirname(__file__))
        db_path = os.path.join(base_dir, 'futureintern.db')
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check users table
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'location' not in columns:
            print("Running Auto-Migration: Adding 'location' column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN location TEXT")
            conn.commit()
            print("Migration successful: 'location' column added.")
            
        conn.close()
    except Exception as e:
        print(f"Migration skipped/failed: {e}")

if __name__ == "__main__":
    # Run migration check on startup
    # check_and_migrate_db()

    # Get port from environment variable (for Railway/Heroku) or default to 5000
    port = int(os.environ.get('PORT', 5000))
    
    # Disable debug mode in production
    debug_mode = os.environ.get('FLASK_ENV', 'development') == 'development'
    
    # Run on the specified port
    # Make sure this port matches your frontend API configuration
    app.run(debug=debug_mode, host='0.0.0.0', port=port)
