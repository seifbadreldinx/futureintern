#!/bin/bash
# Railway Startup Script - Handles PORT variable properly

# Get PORT from environment or use default
PORT=${PORT:-5000}

echo "Starting FutureIntern Backend on port $PORT..."

# Initialize database
echo "Initializing database..."
python init_db.py

# Start Gunicorn with the PORT variable
exec gunicorn -w 4 -b "0.0.0.0:$PORT" run:app
