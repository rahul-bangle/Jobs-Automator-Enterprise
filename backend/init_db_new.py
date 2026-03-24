import asyncio
from app.core.db import init_db

async def main():
    print("Initializing Database with new models...")
    await init_db()
    print("Database Initialized Successfully.")

if __name__ == "__main__":
    asyncio.run(main())
