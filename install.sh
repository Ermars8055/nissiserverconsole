#!/bin/bash

echo "🚀 Starting Nissi Server Console Installation..."

# 1. Update system and install prerequisites
echo "📦 Installing prerequisites..."
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nodejs npm postgresql postgresql-contrib curl

# 2. Setup PostgreSQL Database
echo "🗄️ Setting up PostgreSQL Database..."
sudo -u postgres psql -c "CREATE USER admin WITH PASSWORD 'adminpassword';"
sudo -u postgres psql -c "CREATE DATABASE server_admin OWNER admin;"

# 3. Setup Backend
echo "⚙️ Setting up the Python Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run migrations (create tables) and create admin user
echo "🔑 Initializing database and admin user..."
python3 -c "
import asyncio
from database import Base, engine
async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
asyncio.run(init())
"
python3 create_admin.py
cd ..

# 4. Build Frontend
echo "🎨 Building the React Frontend..."
npm install
npm run build

echo "✅ Installation Complete!"
echo ""
echo "To run the application for production:"
echo "1. Start the backend: cd backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000"
echo "2. Serve the frontend: You can use 'npx serve -s dist' or configure Nginx/Caddy to serve the 'dist' folder and reverse proxy /api to port 8000."
