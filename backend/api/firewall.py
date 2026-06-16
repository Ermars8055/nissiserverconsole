from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random
import time
import psutil
from typing import List

from .ce256 import ce256_hash

router = APIRouter()

import subprocess
import os

def get_iptables_blocks():
    try:
        res = subprocess.run(['sudo', 'iptables', '-L', 'INPUT', '-n'], capture_output=True, text=True)
        blocks = []
        for line in res.stdout.splitlines():
            if line.startswith('DROP') or line.startswith('REJECT'):
                parts = line.split()
                if len(parts) >= 4:
                    ip = parts[3]
                    if ip != "0.0.0.0/0":
                        blocks.append(ip)
        return blocks
    except Exception as e:
        print("iptables err:", e)
        return []

class BlockRequest(BaseModel):
    ip: str

class HashRequest(BaseModel):
    text: str

@router.get("/status")
def get_firewall_status():
    blocks = get_iptables_blocks()
    return {
        "status": "Active",
        "algorithm": "CE-256 (Collatz Engine)",
        "blocked_count": len(blocks),
        "open_ports": [80, 443, 222, 3030, 5432],
        "active_connections": random.randint(12, 45)
    }

@router.get("/blocked")
def get_blocked_ips():
    return {"blocked_ips": get_iptables_blocks()}

@router.post("/block")
def block_ip(req: BlockRequest):
    try:
        subprocess.run(['sudo', 'iptables', '-I', 'INPUT', '1', '-s', req.ip, '-j', 'DROP'], check=True)
        return {"status": "success", "ip": req.ip}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to block IP: {str(e)}")

@router.post("/unblock")
def unblock_ip(req: BlockRequest):
    try:
        subprocess.run(['sudo', 'iptables', '-D', 'INPUT', '-s', req.ip, '-j', 'DROP'], check=True)
        return {"status": "success", "ip": req.ip}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to unblock IP: {str(e)}")

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
            
            action = "BLOCKED" if r_ip in get_iptables_blocks() else "ALLOWED"
            
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

@router.get("/ssh-logs")
def get_ssh_logs():
    try:
        # Check /var/log/auth.log primarily, fallback to journalctl
        log_lines = []
        if os.path.exists('/var/log/auth.log'):
            res = subprocess.run(['tail', '-n', '500', '/var/log/auth.log'], capture_output=True, text=True)
            log_lines = res.stdout.splitlines()
        else:
            res = subprocess.run(['journalctl', '-u', 'ssh', '-n', '500', '--no-pager'], capture_output=True, text=True)
            log_lines = res.stdout.splitlines()
            
        logs = []
        for line in log_lines:
            if "Failed password" in line or "Invalid user" in line or "Disconnected from invalid user" in line:
                parts = line.split()
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
                    logs.append({
                        "id": f"{timestamp}-{ip}-{len(logs)}",
                        "timestamp": timestamp,
                        "ip": ip,
                        "user": user or "Unknown",
                        "message": msg
                    })
        return {"logs": list(reversed(logs))[:50]}
    except Exception as e:
        print("SSH Log error:", e)
        return {"logs": []}

@router.get("/metrics")
def get_metrics():
    try:
        conns = psutil.net_connections(kind='inet')
        established = len([c for c in conns if c.status == 'ESTABLISHED'])
        return {"active_connections": established, "timestamp": time.strftime('%H:%M:%S')}
    except Exception:
        return {"active_connections": 0, "timestamp": time.strftime('%H:%M:%S')}
