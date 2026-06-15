import os
import shutil
from fastapi import APIRouter, HTTPException, UploadFile, File
from datetime import datetime

router = APIRouter()
STORAGE_DIR = "/mnt/swarm_storage"

def get_safe_path(filename: str):
    base = os.path.abspath(STORAGE_DIR)
    target = os.path.abspath(os.path.join(base, filename))
    if not target.startswith(base):
        raise HTTPException(status_code=403, detail="Invalid path")
    return target

@router.get("/list")
async def list_files():
    if not os.path.exists(STORAGE_DIR):
        try:
            os.makedirs(STORAGE_DIR, exist_ok=True)
        except Exception:
            return []
            
    files = []
    try:
        for item in os.listdir(STORAGE_DIR):
            item_path = os.path.join(STORAGE_DIR, item)
            if os.path.isfile(item_path):
                stat = os.stat(item_path)
                files.append({
                    "name": item,
                    "size": stat.st_size,
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "type": "file"
                })
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not os.path.exists(STORAGE_DIR):
        try:
            os.makedirs(STORAGE_DIR, exist_ok=True)
        except Exception:
            pass
        
    target_path = get_safe_path(file.filename)
    try:
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"status": "success", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete/{filename}")
async def delete_file(filename: str):
    target_path = get_safe_path(filename)
    if os.path.exists(target_path) and os.path.isfile(target_path):
        try:
            os.remove(target_path)
            return {"status": "success"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=404, detail="File not found")

from fastapi.responses import FileResponse
import tempfile
import asyncio

@router.get("/backup")
async def download_backup():
    if not os.path.exists(STORAGE_DIR) or not os.listdir(STORAGE_DIR):
        raise HTTPException(status_code=404, detail="Vault is empty, nothing to backup.")
        
    try:
        # Create a temporary directory to store the zip file
        temp_dir = tempfile.gettempdir()
        zip_path = os.path.join(temp_dir, "swarm_vault_backup")
        
        # Run shutil.make_archive in a background thread to avoid blocking the API
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, shutil.make_archive, zip_path, 'zip', STORAGE_DIR)
        
        final_zip = f"{zip_path}.zip"
        
        return FileResponse(
            path=final_zip, 
            filename=f"nissi_swarm_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip",
            media_type="application/zip"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create backup: {str(e)}")
