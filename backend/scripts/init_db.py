import asyncio
import sys
from pathlib import Path

# Add backend to sys.path
sys.path.append(str(Path(__file__).parent.parent))

from app.core.db import init_db

async def main():
    print("🚀 Initializing Database...")
    await init_db()
    print("✅ Database Initialized Successfully!")

if __name__ == "__main__":
    asyncio.run(main())
