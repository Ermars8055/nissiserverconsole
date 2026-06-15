from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random
import time
import psutil
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

@router.get("/nodes")
def get_trusted_nodes():
    nodes = []
    try:
        import docker
        client = docker.DockerClient(base_url='unix://var/run/docker.sock')
        nodes_data = client.nodes.list()
        for n in nodes_data:
            ip = n.attrs.get("Status", {}).get("Addr")
            if ip:
                nodes.append({
                    "hostname": n.attrs.get("Description", {}).get("Hostname"),
                    "ip": ip,
                    "role": n.attrs.get("Spec", {}).get("Role")
                })
    except Exception:
        pass
    return {"nodes": nodes}

@router.get("/traffic")
def get_live_traffic():
    traffic = []
    try:
        conns = psutil.net_connections(kind='inet')
        for c in conns:
            if not c.raddr:
                continue
                
            r_ip = c.raddr.ip
            if r_ip == '127.0.0.1' or r_ip == '::1':
                continue
                
            laddr = f"{c.laddr.ip}:{c.laddr.port}" if c.laddr else "Unknown"
            
            action = "BLOCKED" if r_ip in blocked_ips else "ALLOWED"
            
            traffic.append({
                "id": f"{r_ip}:{c.raddr.port}-{laddr}-{c.status}-{time.time()}",
                "timestamp": time.strftime('%H:%M:%S'),
                "source_ip": r_ip,
                "target": laddr,
                "action": action,
                "status": c.status
            })
    except Exception as e:
        print("Error fetching connections:", e)
        
    return {"traffic": traffic[:100]}

@router.post("/hash")
def hash_text(req: HashRequest):
    try:
        hash_output = ce256_hash(req.text)
        return {"hash": hash_output, "algorithm": "CE-256"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
