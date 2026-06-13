import paramiko
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

router = APIRouter()

class SSHConnectionRequest(BaseModel):
    host: str
    port: int = 22
    username: str
    password: str = None
    key_filename: str = None

# In a real app, connections would be stored in the DB (ssh_connections table).
# For now, we simulate an active sessions dictionary.
active_sessions = {}

@router.get("/connections")
async def list_connections():
    # Return mock saved connections for Phase 2
    return [
        {"id": 1, "name": "Production DB", "host": "10.0.0.45", "user": "postgres"},
        {"id": 2, "name": "Web Server 01", "host": "10.0.0.12", "user": "ubuntu"},
    ]

@router.post("/connect")
async def connect_ssh(request: SSHConnectionRequest):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            hostname=request.host,
            port=request.port,
            username=request.username,
            password=request.password,
            key_filename=request.key_filename,
            timeout=5.0
        )
        session_id = f"{request.username}@{request.host}:{request.port}"
        active_sessions[session_id] = client
        return {"status": "success", "session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SSH Connection failed: {str(e)}")

@router.post("/disconnect/{session_id}")
async def disconnect_ssh(session_id: str):
    if session_id in active_sessions:
        client = active_sessions[session_id]
        client.close()
        del active_sessions[session_id]
        return {"status": "success", "message": "Disconnected"}
    else:
        raise HTTPException(status_code=404, detail="Session not found")
