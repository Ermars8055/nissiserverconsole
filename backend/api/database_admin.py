from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any, List, Dict
from database import get_db

router = APIRouter()

class SqlQuery(BaseModel):
    query: str

@router.get("/tables")
async def get_tables(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [row[0] for row in result.fetchall()]
        return {"tables": tables}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/table/{table_name}")
async def get_table_data(table_name: str, db: AsyncSession = Depends(get_db)):
    try:
        # Validate table name to prevent basic SQL injection on table name
        if not table_name.isidentifier():
            raise HTTPException(status_code=400, detail="Invalid table name")
            
        result = await db.execute(text(f"SELECT * FROM {table_name} LIMIT 100"))
        columns = list(result.keys())
        rows = [dict(zip(columns, row)) for row in result.fetchall()]
        return {"columns": columns, "rows": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def execute_query(req: SqlQuery, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(text(req.query))
        await db.commit()
        
        if result.returns_rows:
            columns = list(result.keys())
            rows = [dict(zip(columns, row)) for row in result.fetchall()]
            return {"columns": columns, "rows": rows, "message": "Query executed successfully"}
        else:
            return {"columns": [], "rows": [], "message": f"Query executed successfully. Rows affected: {result.rowcount}"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
