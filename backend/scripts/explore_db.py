import asyncio
from app.core.db import async_session_maker
from app.models.base import Job
from sqlalchemy import select

async def run():
    async with async_session_maker() as db:
        res = await db.execute(select(Job).limit(3))
        jobs = res.scalars().all()
        for j in jobs:
            print(f"ID: {j.id} | COMPANY: {j.company_name} | TITLE: {j.job_title}")

if __name__ == "__main__":
    asyncio.run(run())
