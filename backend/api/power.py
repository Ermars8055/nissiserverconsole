import os
import subprocess
import socket
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

class WakeRequest(BaseModel):
    mac_address: str

router = APIRouter()

@router.post("/shutdown/{node_ip}")
async def shutdown_node(node_ip: str, user: str = "root"):
    if node_ip == "127.0.0.1" or node_ip == "local":
        # Shutdown the leader itself!
        try:
            os.system("sudo shutdown -h now")
            return {"status": "success", "message": "Leader shutting down!"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        # Shutdown remote worker over SSH
        try:
            result = subprocess.run(['/usr/bin/ssh', '-o', 'StrictHostKeyChecking=no', f"{user}@{node_ip}", 'sudo shutdown -h now'], capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(f"SSH Failed: {result.stderr}")
            return {"status": "success", "message": f"Shutdown signal sent to {node_ip}."}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.post("/wake")
async def wake_node(req: WakeRequest):
    mac = req.mac_address.replace(':', '').replace('-', '')
    if len(mac) != 12:
        raise HTTPException(status_code=400, detail="Invalid MAC address format")
    
    try:
        # Build magic packet: 6 bytes of 0xFF followed by 16 repetitions of the MAC address
        data = bytes.fromhex('FF' * 6 + mac * 16)
        
        # Broadcast UDP packet on port 9
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        sock.sendto(data, ('255.255.255.255', 9))
        sock.close()
        
        return {"status": "success", "message": f"Wake-on-LAN magic packet sent to {req.mac_address}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
