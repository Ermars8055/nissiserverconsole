import os
import pty
import json
import asyncio
import struct
import fcntl
import termios
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

@router.websocket("/ws")
async def terminal_websocket(websocket: WebSocket, target_ip: str = None, ssh_user: str = None):
    await websocket.accept()
    
    try:
        pid, fd = os.forkpty()
        if pid == 0:
            env = os.environ.copy()
            env['TERM'] = 'xterm-256color'
            
            if target_ip and ssh_user and target_ip != "local" and target_ip != "127.0.0.1":
                # Launch SSH client
                # Using StrictHostKeyChecking=no makes it seamless for internal swarm nodes
                os.execve('/usr/bin/ssh', ['/usr/bin/ssh', '-o', 'StrictHostKeyChecking=no', f"{ssh_user}@{target_ip}"], env)
            else:
                # Local bash shell
                env['HOME'] = '/root'
                env['USER'] = 'root'
                os.execve('/bin/bash', ['/bin/bash', '-l', '-i'], env)
    except Exception as e:
        await websocket.close(code=1011, reason=f"Could not spawn shell: {str(e)}")
        return

    # Background loop to read data coming out of the bash shell
    async def read_from_pty():
        loop = asyncio.get_running_loop()
        try:
            while True:
                # Read asynchronously from the master file descriptor
                data = await loop.run_in_executor(None, os.read, fd, 1024)
                if not data:
                    break
                text = data.decode('utf-8', errors='replace')
                await websocket.send_text(json.dumps({"type": "output", "data": text}))
        except OSError:
            # Expected when the pty is closed or child process dies (Input/output error)
            pass
        except Exception as e:
            print(f"PTY read error: {e}")
        finally:
            try:
                os.kill(pid, 9)
            except OSError:
                pass

    read_task = asyncio.create_task(read_from_pty())

    try:
        # Loop to listen for incoming messages from the frontend WebSocket
        while True:
            message = await websocket.receive_text()
            data = json.loads(message)
            
            if data["type"] == "input":
                # Write directly into the master file descriptor
                os.write(fd, data["data"].encode('utf-8'))
                
            elif data["type"] == "resize":
                # Resize the real PTY using ioctl
                cols = data.get("cols", 80)
                rows = data.get("rows", 24)
                winsize = struct.pack("HHHH", rows, cols, 0, 0)
                fcntl.ioctl(fd, termios.TIOCSWINSZ, winsize)
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        read_task.cancel()
        try:
            os.kill(pid, 9)
            os.waitpid(pid, 0)
        except OSError:
            pass
        try:
            os.close(fd)
        except OSError:
            pass
