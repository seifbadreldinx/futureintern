FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for python-magic (libmagic)
RUN apt-get update && apt-get install -y \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend application
COPY . .

# Remove any stale local SQLite DB (DB will be initialized at runtime)
RUN rm -f futureintern.db

# Expose port
EXPOSE 5000

# Initialize DB then start the application
CMD ["bash", "start.sh"]
