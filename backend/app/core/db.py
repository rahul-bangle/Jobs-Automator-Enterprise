from sqlmodel import SQLModel
from app.core.database import engine, get_session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

# Alias — some files may import get_db
get_db = get_session
