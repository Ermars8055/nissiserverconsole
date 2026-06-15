from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from api import auth, system, docker_api, terminal, files, ssh, printer, audit, storage, sos, power, firewall
from config import settings

app = FastAPI(title=settings.PROJECT_NAME)

# Set up CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Should be restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to create tables for now
# In production, use Alembic migrations instead
@app.on_event("startup")
async def init_tables():
    async with engine.begin() as conn:
        # Create all tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)
        
    # Start Thermal Watchdog
    asyncio.create_task(thermal_watchdog())

import asyncio
import requests
import smtplib
from email.message import EmailMessage
from api.sos import load_config

async def thermal_watchdog():
    while True:
        try:
            config = load_config()
            if config.get("enabled") and config.get("email") and config.get("smtp_password"):
                # Get all nodes
                client = docker_api.get_docker_client()
                if client:
                    nodes = client.nodes.list()
                    for node in nodes:
                        ip_addr = node.attrs.get('Status', {}).get('Addr')
                        hostname = node.attrs.get('Description', {}).get('Hostname', 'Unknown')
                        
                        if ip_addr:
                            # Ping Glances for temperatures
                            try:
                                res = requests.get(f"http://{ip_addr}:61208/api/4/sensors", timeout=2.0)
                                if res.status_code == 200:
                                    sensors = res.json()
                                    # Find max CPU temp
                                    max_temp = 0
                                    for s in sensors:
                                        if s.get("type") == "temperature_core" or "core" in s.get("label", "").lower():
                                            val = s.get("value", 0)
                                            if val > max_temp:
                                                max_temp = val
                                                
                                    if max_temp >= config["threshold"]:
                                        # FIRE ALARM!
                                        send_sos_email(config, hostname, max_temp, ip_addr)
                            except Exception:
                                pass
        except Exception as e:
            print(f"Watchdog error: {e}")
            
        await asyncio.sleep(30) # Check every 30 seconds

def send_sos_email(config, hostname, temp, ip):
    try:
        msg = EmailMessage()
        msg.set_content(f"EMERGENCY ALARM!\n\nNode '{hostname}' ({ip}) has exceeded the critical thermal threshold!\nCurrent Temp: {temp}°C\nThreshold: {config['threshold']}°C\n\nImmediate physical inspection is required! Use the Web Console to issue an emergency shutdown if necessary.")
        msg['Subject'] = f"🔥 CRITICAL: {hostname} THERMAL ALARM ({temp}°C)"
        msg['From'] = config['email']
        msg['To'] = config['email']

        api_key = config['mailjet_api_key'].replace(" ", "").replace("\xa0", "").strip()
        secret = config['mailjet_secret'].replace(" ", "").replace("\xa0", "").strip()

        server = smtplib.SMTP_SSL('in-v3.mailjet.com', 465)
        server.login(api_key, secret)
        server.send_message(msg)
        server.quit()
        print(f"SOS Email dispatched for {hostname} via Mailjet!")
    except Exception as e:
        print(f"Failed to send SOS email: {e}")

# Include Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(system.router, prefix="/api/system", tags=["System Monitoring"])
app.include_router(docker_api.router, prefix="/api/docker", tags=["Docker Management"])
app.include_router(terminal.router, prefix="/api/terminal", tags=["Terminal Service"])
app.include_router(files.router, prefix="/api/files", tags=["File Manager"])
app.include_router(ssh.router, prefix="/api/ssh", tags=["SSH Management"])
app.include_router(printer.router, prefix="/api/printer", tags=["Printer Management"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit Logs"])
app.include_router(storage.router, prefix="/api/storage", tags=["Storage Management"])
app.include_router(sos.router, prefix="/api/sos", tags=["SOS Configuration"])
app.include_router(firewall.router, prefix="/api/firewall", tags=["Firewall Management"])
app.include_router(power.router, prefix="/api/power", tags=["Power Controls"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Server Admin API"}
