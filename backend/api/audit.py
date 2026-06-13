from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc

from database import get_db
from models.audit import AuditLog

router = APIRouter()

@router.get("/")
async def get_audit_logs(limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit)
    )
    logs = result.scalars().all()
    return logs

# Utility function to be used by other endpoints to log actions
async def log_action(db: AsyncSession, user_email: str, action: str, target: str = None):
    log_entry = AuditLog(user_email=user_email, action=action, target=target)
    db.add(log_entry)
    await db.commit()
    return log_entry
