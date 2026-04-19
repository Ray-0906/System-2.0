FROM python:3.11-slim

WORKDIR /app

# Install dependencies first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose required port
EXPOSE 8100

# Start FastAPI/Uvicorn server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8100"]
