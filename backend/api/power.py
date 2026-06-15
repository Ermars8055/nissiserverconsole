import os
import subprocess
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.post("/shutdown/{node_ip}")
async def shutdown_node(node_ip: str):
    if node_ip == "127.0.0.1" or node_ip == "local":
        # Shutdown the leader itself!
        try:
            os.system("sudo shutdown -h now")
            return {"status": "success", "message": "Leader shutting down!"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        # Shutdown remote worker over SSH
        # Requires the manager to have passwordless SSH access to the worker
        try:
            subprocess.Popen(['/usr/bin/ssh', '-o', 'StrictHostKeyChecking=no', f"root@{node_ip}", 'shutdown -h now'])
            return {"status": "success", "message": f"Shutdown signal sent to {node_ip}."}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
