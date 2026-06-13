import docker
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Optional
import traceback

router = APIRouter()

docker_init_error = None
try:
    client = docker.from_env()
    client.ping()
except Exception as e:
    # Handle environment without Docker
    client = None
    docker_init_error = str(e)

def get_docker_client():
    global client, docker_init_error
    try:
        if not client:
            client = docker.from_env()
            client.ping()
        return client
    except Exception as e:
        client = None
        docker_init_error = str(e)
        return None

@router.get("/containers")
async def list_containers(all: bool = True):
    d_client = get_docker_client()
    if not d_client:
        return []
    try:
        containers = d_client.containers.list(all=all)
        result = []
        for c in containers:
            result.append({
                "id": c.short_id,
                "name": c.name,
                "image": c.image.tags[0] if c.image.tags else c.image.id,
                "status": c.status,
                "ports": c.ports,
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/start/{container_id}")
async def start_container(container_id: str):
    d_client = get_docker_client()
    if not d_client:
        raise HTTPException(status_code=503, detail="Docker daemon is not accessible.")
    try:
        container = d_client.containers.get(container_id)
        container.start()
        return {"status": "success", "message": f"Container {container_id} started."}
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop/{container_id}")
async def stop_container(container_id: str):
    d_client = get_docker_client()
    if not d_client:
        raise HTTPException(status_code=503, detail="Docker daemon is not accessible.")
    try:
        container = d_client.containers.get(container_id)
        container.stop()
        return {"status": "success", "message": f"Container {container_id} stopped."}
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/restart/{container_id}")
async def restart_container(container_id: str):
    d_client = get_docker_client()
    if not d_client:
        raise HTTPException(status_code=503, detail="Docker daemon is not accessible.")
    try:
        container = d_client.containers.get(container_id)
        container.restart()
        return {"status": "success", "message": f"Container {container_id} restarted."}
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs/{container_id}")
async def get_container_logs(container_id: str, tail: int = 100):
    d_client = get_docker_client()
    if not d_client:
        raise HTTPException(status_code=503, detail="Docker daemon is not accessible.")
    try:
        container = d_client.containers.get(container_id)
        logs = container.logs(tail=tail).decode('utf-8')
        return {"logs": logs}
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
