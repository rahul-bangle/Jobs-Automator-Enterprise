import asyncio
from app.core.db import async_session_maker
from app.models.base import Job
from sqlalchemy import select

async def run():
    async with async_session_maker() as db:
        res = await db.execute(select(Job).limit(1))
        j = res.scalar_one_or_none()
        if j:
            print(f"ID: {j.id}")
            print(f"TITLE: {j.job_title}")
            print(f"DESC: {j.description[:500]}...")
        else:
            print("NO JOBS FOUND")

if __name__ == "__main__":
    asyncio.run(run())
