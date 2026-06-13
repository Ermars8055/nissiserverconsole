from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True, nullable=False)
    action = Column(String, nullable=False)
    target = Column(String, nullable=True) # e.g., container_id, file_path, etc.
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
