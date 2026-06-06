#!/bin/bash
# Railway Startup Script - Handles PORT variable properly

# Get PORT from environment or use default
PORT=${PORT:-5000}

echo "Starting FutureIntern Backend on port $PORT..."

# Initialize database tables
echo "Initializing database tables..."
python init_db.py

# Seed internship data if database is empty (safe to run on every restart)
echo "Checking if internship data needs to be seeded..."
python -c "
from app import create_app, db
from app.models.intern import Internship
app = create_app()
with app.app_context():
    count = Internship.query.count()
    if count == 0:
        print('Database is empty — importing internship data from CSV...')
        import subprocess, sys
        result = subprocess.run([sys.executable, 'import_excel_data.py'], capture_output=False)
        if result.returncode != 0:
            print('Warning: Seeding script exited with errors.')
    else:
        print(f'Database already has {count} internships — skipping seed.')
"

# Start Gunicorn with the PORT variable
exec gunicorn -w 2 -b "0.0.0.0:$PORT" --timeout 120 --access-logfile - --error-logfile - run:app
