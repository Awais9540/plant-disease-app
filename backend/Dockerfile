FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies needed for OpenCV (cv2)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create cache directory for Hugging Face and give permissions
RUN mkdir -p /app/.cache && chmod -R 777 /app

# Copy the entire backend into the container
COPY . .

# Hugging Face Spaces automatically route traffic to port 7860
EXPOSE 7860

# Start the FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
