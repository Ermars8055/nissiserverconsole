import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()
CONFIG_FILE = "sos_config.json"

class SOSConfig(BaseModel):
    enabled: bool
    email: str
    mailjet_api_key: str
    mailjet_secret: str
    threshold: int

def get_default_config():
    return {
        "enabled": False,
        "email": "",
        "mailjet_api_key": "",
        "mailjet_secret": "",
        "threshold": 90
    }

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return get_default_config()

@router.get("/config")
async def get_config():
    config = load_config()
    # Mask the secret key when returning to the frontend
    if config.get("mailjet_secret"):
        config["mailjet_secret"] = "********"
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
    if not config.get("enabled") or not config.get("email") or not config.get("mailjet_api_key") or not config.get("mailjet_secret"):
        raise HTTPException(status_code=400, detail="SOS Config is missing Mailjet credentials.")
        
    try:
        msg = EmailMessage()
        msg.set_content("This is a test of the Nissi Server Thermal SOS System. If you are receiving this, your Mailjet configuration is perfect!\n\nIf a real fire occurs, you will receive an alert with the exact temperature and PC name.")
        msg['Subject'] = "🟢 TEST: Nissi Server SOS System"
        msg['From'] = config['email']
        msg['To'] = config['email']

        # Ensure no spaces or hidden characters
        api_key = config['mailjet_api_key'].replace(" ", "").replace("\xa0", "").strip()
        secret = config['mailjet_secret'].replace(" ", "").replace("\xa0", "").strip()

        server = smtplib.SMTP_SSL('in-v3.mailjet.com', 465)
        server.login(api_key, secret)
        server.send_message(msg)
        server.quit()
        return {"status": "success", "message": "Test email sent successfully via Mailjet!"}
    except Exception as e:
        print(f"SMTP Test Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
