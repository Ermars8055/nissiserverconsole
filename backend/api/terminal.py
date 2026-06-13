import os
import pty
import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import ptyprocess

router = APIRouter()

@router.websocket("/ws")
async def terminal_websocket(websocket: WebSocket):
    await websocket.accept()
    
    # Spawn a new bash shell
    try:
        # Use ptyprocess to spawn bash
        child = ptyprocess.PtyProcessUnicode.spawn(['/bin/bash', '-i'])
    except Exception as e:
        await websocket.close(code=1011, reason=f"Could not spawn shell: {str(e)}")
        return

    async def read_from_pty():
        try:
            while True:
                # Need to read asynchronously, but ptyprocess.read is synchronous
                # So we run it in an executor
                loop = asyncio.get_running_loop()
                data = await loop.run_in_executor(None, child.read, 1024)
                if not data:
                    break
                await websocket.send_text(json.dumps({"type": "output", "data": data}))
        except EOFError:
            pass
        except Exception as e:
            print(f"PTY read error: {e}")
        finally:
            child.terminate(force=True)

    read_task = asyncio.create_task(read_from_pty())

    try:
        while True:
            # Receive text from WebSocket (Frontend sends JSON)
            message = await websocket.receive_text()
            data = json.loads(message)
            
            if data["type"] == "input":
                # Write to PTY
                child.write(data["data"])
            elif data["type"] == "resize":
                # Resize PTY
                cols = data.get("cols", 80)
                rows = data.get("rows", 24)
                child.setwinsize(rows, cols)
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        read_task.cancel()
        child.terminate(force=True)
