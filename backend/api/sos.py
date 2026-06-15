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

import smtplib
from email.message import EmailMessage

@router.post("/test")
async def test_email():
    config = load_config()
    if not config.get("enabled") or not config.get("email") or not config.get("smtp_password"):
        raise HTTPException(status_code=400, detail="SOS Config is missing or disabled.")
        
    try:
        msg = EmailMessage()
        msg.set_content("This is a test of the Nissi Server Thermal SOS System. If you are receiving this, your SMTP configuration is perfect!\n\nIf a real fire occurs, you will receive an alert with the exact temperature and PC name.")
        msg['Subject'] = "🟢 TEST: Nissi Server SOS System"
        msg['From'] = config['email']
        msg['To'] = config['email']

        # Ensure no spaces or hidden characters in the app password
        clean_password = config['smtp_password'].replace(" ", "").replace("\xa0", "").strip()

        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(config['email'], clean_password)
        server.send_message(msg)
        server.quit()
        return {"status": "success", "message": "Test email sent successfully!"}
    except Exception as e:
        print(f"SMTP Test Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
