from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import subprocess
import os

router = APIRouter()
PRINT_DIR = "/mnt/swarm_storage"

def safe_join(base: str, filename: str) -> str:
    target = os.path.abspath(os.path.join(base, os.path.basename(filename)))
    if not target.startswith(os.path.abspath(base)):
        raise HTTPException(status_code=403, detail="Access denied")
    return target

@router.get("/status")
async def get_printer_status():
    try:
        result = subprocess.run(['lpstat', '-p'], capture_output=True, text=True)
        if result.returncode != 0:
            return {"status": "Error", "message": result.stderr}
        printers = []
        for line in result.stdout.strip().split('\n'):
            if line:
                printers.append({"info": line})
        return {"printers": printers, "raw": result.stdout}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get printer status: {str(e)}")

@router.get("/queue")
async def get_printer_queue():
    try:
        result = subprocess.run(['lpstat', '-o'], capture_output=True, text=True)
        return {"jobs": result.stdout.strip().split('\n') if result.stdout.strip() else []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/print")
async def print_document(filename: str, printer_name: str = None):
    try:
        file_path = safe_join(PRINT_DIR, filename)
        if not os.path.isfile(file_path):
            raise HTTPException(status_code=404, detail="File not found in Storage Vault")
        cmd = ['lp', '-o', 'media=A4', '-o', 'fit-to-page']
        if printer_name:
            cmd.extend(['-d', printer_name])
        cmd.append(file_path)
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(result.stderr)
        return {"status": "success", "message": result.stdout.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/devices")
async def get_printer_devices():
    try:
        result = subprocess.run(['lpinfo', '-v'], capture_output=True, text=True)
        devices = []
        for line in result.stdout.strip().split('\n'):
            if line:
                parts = line.split(' ', 1)
                if len(parts) == 2:
                    conn_type = parts[0]
                    uri = parts[1]
                    name = uri.split('://')[-1].split('?')[0].replace('%20', ' ')
                    devices.append({"type": conn_type, "uri": uri, "name": name})
        return {"devices": devices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to scan devices: {str(e)}")

class AddPrinterRequest(BaseModel):
    name: str
    uri: str
    driver: str = "everywhere"

@router.post("/add")
async def add_printer(req: AddPrinterRequest):
    try:
        cmd = ['lpadmin', '-p', req.name.replace(' ', '_'), '-E', '-v', req.uri, '-m', req.driver]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(result.stderr)
        return {"status": "success", "message": f"Printer {req.name} added successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
