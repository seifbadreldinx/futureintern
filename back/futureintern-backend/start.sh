#!/bin/bash
# Railway Startup Script - Handles PORT variable properly

# Get PORT from environment or use default
PORT=${PORT:-5000}

echo "Starting FutureIntern Backend on port $PORT..."

# Initialize database tables
echo "Initializing database tables..."
python init_db.py

# Seed internship data if database is empty — uses lightweight psycopg2 check
# to avoid triggering the heavy SBERT model loading before Gunicorn starts.
echo "Checking if internship data needs to be seeded..."
python -c "
import os, sys

db_url = os.environ.get('DATABASE_URL', '')
if not db_url:
    print('No DATABASE_URL — skipping seed check.')
    sys.exit(0)

try:
    import psycopg2
    # Railway uses postgresql://, psycopg2 accepts that directly
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) FROM internships')
    count = cur.fetchone()[0]
    cur.close()
    conn.close()

    if count == 0:
        print('Database is empty — importing internship data from CSV...')
        import subprocess
        result = subprocess.run([sys.executable, 'import_excel_data.py'], capture_output=False)
        if result.returncode != 0:
            print('Warning: Seeding script exited with errors.')
        else:
            print('Seeding complete!')
    else:
        print(f'Database already has {count} internships — skipping seed.')
except Exception as e:
    print(f'Seed check error (non-fatal): {e}')
"

# Force-verify admin and seeded users directly in DB (no email required for built-in accounts)
echo "Verifying built-in admin account..."
python -c "
import os
db_url = os.environ.get('DATABASE_URL', '')
if not db_url:
    print('No DATABASE_URL — skipping admin verification.')
else:
    try:
        import psycopg2
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute(\"\"\"
            UPDATE users
            SET email_verified = TRUE, is_verified = TRUE
            WHERE email IN ('admin@futureintern.com', 'ahmed@student.com')
        \"\"\")
        updated = cur.rowcount
        conn.commit()
        cur.close()
        conn.close()
        print(f'✅ Force-verified {updated} built-in account(s).')
    except Exception as e:
        print(f'Admin verify error (non-fatal): {e}')
"

# Start Gunicorn with the PORT variable
exec gunicorn -w 2 -b "0.0.0.0:$PORT" --timeout 120 --access-logfile - --error-logfile - run:app

