import os
import shutil
from typing import Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from fastapi.responses import FileResponse

router = APIRouter()

# Restrict base directory to prevent arbitrary file system access
BASE_DIR = os.path.abspath(os.environ.get("SERVER_ADMIN_FS_ROOT", "/tmp/server_admin_files"))

if not os.path.exists(BASE_DIR):
    os.makedirs(BASE_DIR, exist_ok=True)

def safe_join(base, path):
    new_path = os.path.abspath(os.path.join(base, path.lstrip('/')))
    if not new_path.startswith(base):
        raise HTTPException(status_code=403, detail="Access denied")
    return new_path

@router.get("/list")
async def list_files(path: str = ""):
    target_dir = safe_join(BASE_DIR, path)
    if not os.path.isdir(target_dir):
        raise HTTPException(status_code=404, detail="Directory not found")
        
    items = []
    for entry in os.scandir(target_dir):
        items.append({
            "name": entry.name,
            "is_dir": entry.is_dir(),
            "size": entry.stat().st_size,
            "modified": entry.stat().st_mtime
        })
    return items

@router.post("/upload")
async def upload_file(path: str = "", file: UploadFile = File(...)):
    target_dir = safe_join(BASE_DIR, path)
    if not os.path.isdir(target_dir):
        raise HTTPException(status_code=404, detail="Directory not found")
        
    file_path = safe_join(target_dir, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"status": "success", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download")
async def download_file(path: str = Query(...)):
    target_file = safe_join(BASE_DIR, path)
    if not os.path.isfile(target_file):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(target_file, filename=os.path.basename(target_file))

@router.delete("/delete")
async def delete_item(path: str = Query(...)):
    target_item = safe_join(BASE_DIR, path)
    if target_item == BASE_DIR:
        raise HTTPException(status_code=403, detail="Cannot delete base directory")
        
    if not os.path.exists(target_item):
        raise HTTPException(status_code=404, detail="Item not found")
        
    try:
        if os.path.isdir(target_item):
            shutil.rmtree(target_item)
        else:
            os.remove(target_item)
        return {"status": "success", "message": f"{os.path.basename(target_item)} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
