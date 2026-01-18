FROM python:3.11-slim

WORKDIR /app

# Copy requirements from root
COPY ../../requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend application
COPY . .

# Initialize database
RUN python init_db.py

# Expose port
EXPOSE 5000

# Start the application with gunicorn
CMD gunicorn -w 4 -b 0.0.0.0:${PORT:-8080} run:app
