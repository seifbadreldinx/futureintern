
import sqlite3

# Path to your database file
# Assuming it's in instance/futureintern.db or similar based on typical Flask setup
# Or app.db in root. I need to find where the DB is.
# Checking typical locations.
DB_PATH = 'futureintern.db'

def add_column():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'location' not in columns:
            print("Adding location column...")
            cursor.execute("ALTER TABLE users ADD COLUMN location TEXT")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column 'location' already exists.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    add_column()
