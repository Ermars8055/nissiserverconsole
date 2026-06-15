from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random
import time
from typing import List

from .ce256 import ce256_hash

router = APIRouter()

# In-memory storage for demonstration
blocked_ips = ["192.168.1.100", "45.33.22.11"]
live_traffic_log = []

class BlockRequest(BaseModel):
    ip: str

class HashRequest(BaseModel):
    text: str

@router.get("/status")
def get_firewall_status():
    return {
        "status": "Active",
        "algorithm": "CE-256 (Collatz Engine)",
        "blocked_count": len(blocked_ips),
        "open_ports": [80, 443, 222, 3030, 5432],
        "active_connections": random.randint(12, 45)
    }

@router.get("/blocked")
def get_blocked_ips():
    return {"blocked_ips": blocked_ips}

@router.post("/block")
def block_ip(req: BlockRequest):
    if req.ip not in blocked_ips:
        blocked_ips.append(req.ip)
    return {"status": "success", "ip": req.ip}

@router.post("/unblock")
def unblock_ip(req: BlockRequest):
    if req.ip in blocked_ips:
        blocked_ips.remove(req.ip)
    return {"status": "success", "ip": req.ip}

@router.get("/traffic")
def get_live_traffic():
    # Simulate some realistic live traffic hits
    sources = ["10.0.0.5", "10.0.0.6", "192.168.0.12", "172.16.0.4", "45.33.22.11"]
    targets = ["/api/system/report_data", "/api/docker/swarm/nodes", "/api/storage/list", "/"]
    
    if random.random() > 0.3: # 70% chance of new traffic
        ip = random.choice(sources)
        action = "BLOCKED" if ip in blocked_ips else "ALLOWED"
        
        log_entry = {
            "id": int(time.time() * 1000) + random.randint(1, 1000),
            "timestamp": time.strftime('%H:%M:%S'),
            "source_ip": ip,
            "target": random.choice(targets),
            "action": action
        }
        live_traffic_log.insert(0, log_entry)
        
        # Keep only last 50
        if len(live_traffic_log) > 50:
            live_traffic_log.pop()
            
    return {"traffic": live_traffic_log}

@router.post("/hash")
def hash_text(req: HashRequest):
    try:
        hash_output = ce256_hash(req.text)
        return {"hash": hash_output, "algorithm": "CE-256"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
