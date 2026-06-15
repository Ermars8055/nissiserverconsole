import docker
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Optional
import traceback
import requests

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

@router.get("/swarm/info")
async def swarm_info():
    d_client = get_docker_client()
    if not d_client:
        return {"swarm_active": False, "is_manager": False}
    try:
        info = d_client.info()
        swarm = info.get('Swarm', {})
        active = swarm.get('LocalNodeState') == 'active'
        is_manager = swarm.get('ControlAvailable', False)
        return {"swarm_active": active, "is_manager": is_manager, "node_id": swarm.get('NodeID')}
    except Exception as e:
        return {"swarm_active": False, "is_manager": False, "error": str(e)}

@router.get("/swarm/tokens")
async def swarm_tokens():
    d_client = get_docker_client()
    if not d_client:
        raise HTTPException(status_code=503, detail="Docker daemon not accessible.")
    try:
        swarm = d_client.swarm.attrs
        tokens = swarm.get("JoinTokens", {})
        manager_ip = "127.0.0.1" # Fallback
        info = d_client.info()
        node_addr = info.get('Swarm', {}).get('NodeAddr')
        if node_addr:
            manager_ip = node_addr
            
        return {
            "worker": f"docker swarm join --token {tokens.get('Worker')} {manager_ip}:2377" if tokens.get('Worker') else None,
            "manager": f"docker swarm join --token {tokens.get('Manager')} {manager_ip}:2377" if tokens.get('Manager') else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/swarm/nodes")
async def swarm_nodes():
    d_client = get_docker_client()
    if not d_client:
        raise HTTPException(status_code=503, detail="Docker daemon not accessible.")
    try:
        nodes = d_client.nodes.list()
        result = []
        for n in nodes:
            status = n.attrs.get('Status', {})
            spec = n.attrs.get('Spec', {})
            desc = n.attrs.get('Description', {})
            
            ip_addr = status.get('Addr')
            
            # Fetch real-time hardware stats from the Glances global agent
            hardware_stats = {"cpu_percent": 0.0, "mem_percent": 0.0, "disk_percent": 0.0, "temperature": None}
            if ip_addr:
                try:
                    # Ping Glances API on port 61208
                    res = requests.get(f"http://{ip_addr}:61208/api/4/all", timeout=1.5)
                    if res.status_code == 200:
                        data = res.json()
                        hardware_stats["cpu_percent"] = data.get("cpu", {}).get("total", 0.0)
                        hardware_stats["mem_percent"] = data.get("mem", {}).get("percent", 0.0)
                        # Find the root filesystem or biggest filesystem for disk usage
                        fs_list = data.get("fs", [])
                        if fs_list:
                            root_fs = next((f for f in fs_list if f.get("mnt_point") == "/"), fs_list[0])
                            hardware_stats["disk_percent"] = root_fs.get("percent", 0.0)
                        
                        # Extract the highest CPU temperature
                        sensors = data.get("sensors", [])
                        max_temp = 0
                        for s in sensors:
                            if s.get("type") == "temperature_core" or "core" in s.get("label", "").lower():
                                val = s.get("value", 0)
                                if val > max_temp:
                                    max_temp = val
                        if max_temp > 0:
                            hardware_stats["temperature"] = max_temp
                except:
                    pass

            result.append({
                "id": n.short_id,
                "hostname": desc.get('Hostname'),
                "role": spec.get('Role'),
                "availability": spec.get('Availability'),
                "state": status.get('State'),
                "ip": ip_addr,
                "engine": desc.get('Engine', {}).get('EngineVersion'),
                "cpus": desc.get('Resources', {}).get('NanoCPUs', 0) / 1e9,
                "memory_bytes": desc.get('Resources', {}).get('MemoryBytes', 0),
                "hardware": hardware_stats
            })
        return result
    except docker.errors.APIError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/swarm/services")
async def swarm_services():
    d_client = get_docker_client()
    if not d_client:
        raise HTTPException(status_code=503, detail="Docker daemon not accessible.")
    try:
        services = d_client.services.list()
        result = []
        for s in services:
            attrs = s.attrs
            spec = attrs.get('Spec', {})
            mode = spec.get('Mode', {})
            is_global = 'Global' in mode
            is_replicated = 'Replicated' in mode
            
            replicas = mode.get('Replicated', {}).get('Replicas', 0) if is_replicated else 'Global'
            
            result.append({
                "id": s.short_id,
                "name": spec.get('Name'),
                "image": spec.get('TaskTemplate', {}).get('ContainerSpec', {}).get('Image', '').split('@')[0],
                "mode": "Global" if is_global else "Replicated",
                "replicas": replicas,
                "created_at": attrs.get('CreatedAt'),
                "updated_at": attrs.get('UpdatedAt')
            })
        return result
    except docker.errors.APIError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
