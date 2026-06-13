from fastapi import APIRouter, HTTPException
import subprocess
import os
from .files import BASE_DIR, safe_join

router = APIRouter()

@router.get("/status")
async def get_printer_status():
    try:
        # lpstat -p returns printer statuses
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
        # lpstat -o returns queued jobs
        result = subprocess.run(['lpstat', '-o'], capture_output=True, text=True)
        return {"jobs": result.stdout.strip().split('\n') if result.stdout.strip() else []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/print")
async def print_document(filename: str, printer_name: str = None):
    try:
        file_path = safe_join(BASE_DIR, filename)
        if not os.path.isfile(file_path):
            raise HTTPException(status_code=404, detail="File not found in storage")
            
        cmd = ['lp']
        if printer_name:
            cmd.extend(['-d', printer_name])
        cmd.append(file_path)
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(result.stderr)
            
        return {"status": "success", "message": result.stdout.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
