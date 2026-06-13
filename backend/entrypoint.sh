#!/bin/bash
set -e

echo "Running migrations / creating tables..."
python -c "
import asyncio
from database import Base, engine
async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
asyncio.run(init())
"

echo "Creating admin user if it doesn't exist..."
python create_admin.py

echo "Starting FastAPI Server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
