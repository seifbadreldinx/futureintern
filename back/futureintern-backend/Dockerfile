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

# Start the application
CMD ["python", "run.py"]
