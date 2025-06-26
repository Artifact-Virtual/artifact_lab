FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy the requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the core and modules directories
COPY core/ ./core/
COPY modules/ ./modules/

# Expose the necessary ports (adjust as needed)
EXPOSE 5000

# Command to run the application (adjust as needed)
CMD ["python", "-m", "core.interfaces.rest"]