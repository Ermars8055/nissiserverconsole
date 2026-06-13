from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from api import auth, system, docker_api, terminal, files, ssh, printer, audit
from config import settings

app = FastAPI(title=settings.PROJECT_NAME)

# Set up CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Should be restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to create tables for now
# In production, use Alembic migrations instead
@app.on_event("startup")
async def init_tables():
    async with engine.begin() as conn:
        # Create all tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)

# Include Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(system.router, prefix="/api/system", tags=["System Monitoring"])
app.include_router(docker_api.router, prefix="/api/docker", tags=["Docker Management"])
app.include_router(terminal.router, prefix="/api/terminal", tags=["Terminal Service"])
app.include_router(files.router, prefix="/api/files", tags=["File Manager"])
app.include_router(ssh.router, prefix="/api/ssh", tags=["SSH Management"])
app.include_router(printer.router, prefix="/api/printer", tags=["Printer Management"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit Logs"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Server Admin API"}
