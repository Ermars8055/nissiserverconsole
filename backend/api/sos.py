import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()
CONFIG_FILE = "sos_config.json"

class SOSConfig(BaseModel):
    enabled: bool
    email: str
    smtp_password: str
    threshold: int

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {"enabled": False, "email": "", "smtp_password": "", "threshold": 90}

@router.get("/config")
async def get_config():
    config = load_config()
    # Mask the password when returning to the frontend
    if config.get("smtp_password"):
        config["smtp_password"] = "********"
    return config

@router.post("/config")
async def save_config(config: SOSConfig):
    # If the user sends the masked password, ignore the password update
    current = load_config()
    data = config.dict()
    if data["smtp_password"] == "********":
        data["smtp_password"] = current.get("smtp_password", "")
        
    with open(CONFIG_FILE, "w") as f:
        json.dump(data, f)
    return {"status": "success"}
