#!/bin/bash

# Ensure script is run with sudo
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo)"
  exit 1
fi

echo "Setting up native Nissi Server Console Backend..."

# Install required system packages
apt-get update
apt-get install -y python3 python3-venv python3-dev gcc cups-client

# Create a virtual environment if it doesn't exist
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Run migrations (ensure database tables exist)
echo "Initializing database..."
python -c "
import asyncio
from database import Base, engine
from models.user import User
from models.audit import AuditLog

async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
asyncio.run(init())
"

# Create default admin
echo "Ensuring default admin exists..."
python create_admin.py

echo "Starting backend natively on port 8000..."
# Run the backend natively
uvicorn main:app --host 0.0.0.0 --port 8000
