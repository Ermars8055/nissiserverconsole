import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from database import AsyncSessionLocal
from models.user import User
from services.auth_service import get_password_hash

async def create_admin():
    async with AsyncSessionLocal() as db:
        admin_email = "admin@system.local"
        hashed_pw = get_password_hash("admin")
        
        # Check if exists
        from sqlalchemy.future import select
        result = await db.execute(select(User).filter(User.email == admin_email))
        user = result.scalars().first()
        
        if not user:
            new_user = User(
                email=admin_email,
                hashed_password=hashed_pw,
                full_name="System Admin",
                role="admin"
            )
            db.add(new_user)
            await db.commit()
            print(f"Admin user created: {admin_email} / admin")
        else:
            print("Admin user already exists.")

if __name__ == "__main__":
    asyncio.run(create_admin())
