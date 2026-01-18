FROM python:3.11-slim

WORKDIR /app

# Copy the entire project
COPY . .

# Install dependencies from backend folder
RUN pip install --no-cache-dir -r requirements.txt

# Set working directory to backend
WORKDIR /app/back/futureintern-backend

# Initialize database
RUN python init_db.py

# Expose port
EXPOSE 5000

# Start the application
CMD ["python", "run.py"]
