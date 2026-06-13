import psutil
import platform
from datetime import datetime
from fastapi import APIRouter, Depends

router = APIRouter()

def get_size(bytes, suffix="B"):
    factor = 1024
    for unit in ["", "K", "M", "G", "T", "P"]:
        if bytes < factor:
            return f"{bytes:.2f}{unit}{suffix}"
        bytes /= factor

@router.get("/overview")
async def get_system_overview():
    uname = platform.uname()
    boot_time_timestamp = psutil.boot_time()
    bt = datetime.fromtimestamp(boot_time_timestamp)
    
    # CPU
    cpu_usage = psutil.cpu_percent(interval=0.1)
    
    # Memory
    svmem = psutil.virtual_memory()
    
    # Disk
    disk_usage = None
    try:
        partition_usage = psutil.disk_usage('/')
        disk_usage = {
            "total": get_size(partition_usage.total),
            "used": get_size(partition_usage.used),
            "free": get_size(partition_usage.free),
            "percentage": partition_usage.percent
        }
    except Exception:
        pass

    return {
        "system": {
            "os": uname.system,
            "node": uname.node,
            "release": uname.release,
            "version": uname.version,
            "machine": uname.machine,
            "processor": uname.processor,
            "boot_time": f"{bt.year}/{bt.month}/{bt.day} {bt.hour}:{bt.minute}:{bt.second}"
        },
        "cpu": {
            "physical_cores": psutil.cpu_count(logical=False),
            "total_cores": psutil.cpu_count(logical=True),
            "usage_percent": cpu_usage
        },
        "memory": {
            "total": get_size(svmem.total),
            "available": get_size(svmem.available),
            "used": get_size(svmem.used),
            "percentage": svmem.percent
        },
        "disk": disk_usage
    }

@router.get("/cpu")
async def get_cpu():
    return {"cpu_percent": psutil.cpu_percent(interval=1, percpu=True)}

@router.get("/memory")
async def get_memory():
    svmem = psutil.virtual_memory()
    return {
        "total": svmem.total,
        "available": svmem.available,
        "used": svmem.used,
        "percent": svmem.percent
    }

@router.get("/disk")
async def get_disk():
    disk_usage = psutil.disk_usage('/')
    return {
        "total": disk_usage.total,
        "used": disk_usage.used,
        "free": disk_usage.free,
        "percent": disk_usage.percent
    }

@router.get("/network")
async def get_network():
    net_io = psutil.net_io_counters()
    return {
        "bytes_sent": net_io.bytes_sent,
        "bytes_recv": net_io.bytes_recv
    }
