import os
import time
import socket
import requests

LOG_FILE = "/host/var/log/auth.log"
API_URL = os.environ.get("NISSI_API_URL", "http://thematrix:8000/api/firewall/ingest")
HOSTNAME = os.environ.get("NODE_HOSTNAME", socket.gethostname())

def parse_line(line):
    if "Failed password" in line or "Invalid user" in line or "Disconnected from invalid user" in line:
        parts = line.split()
        if len(parts) < 4:
            return None
            
        timestamp = " ".join(parts[:3])
        ip = ""
        user = ""
        if "from" in parts:
            try:
                ip = parts[parts.index("from") + 1]
            except:
                pass
        
        if "invalid user" in line.lower() and "user" in parts:
            try:
                user = parts[parts.index("user") + 1]
                if user == "from": user = "Unknown"
            except:
                pass
        elif "Failed password for" in line and "for" in parts:
            try:
                user = parts[parts.index("for") + 1]
                if user == "invalid":
                    user = parts[parts.index("user") + 1]
            except:
                pass

        if ip and ip != "127.0.0.1":
            msg = line.split("sshd", 1)[-1].split(":", 1)[-1].strip() if "sshd" in line else line
            return {
                "timestamp": timestamp,
                "ip": ip,
                "user": user or "Unknown",
                "message": msg,
                "node": HOSTNAME
            }
    return None

def tail_f(file_path):
    while not os.path.exists(file_path):
        print(f"Waiting for {file_path} to exist...")
        time.sleep(5)
        
    with open(file_path, 'r') as f:
        f.seek(0, 2) # Go to the end of the file
        print(f"Started tailing {file_path} as {HOSTNAME}...")
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.5)
                continue
            
            payload = parse_line(line)
            if payload:
                try:
                    res = requests.post(API_URL, json=payload, timeout=2)
                    print(f"Sent log to mothership: {payload['ip']} - Status: {res.status_code}")
                except Exception as e:
                    print(f"Failed to send log: {e}")

if __name__ == "__main__":
    tail_f(LOG_FILE)
