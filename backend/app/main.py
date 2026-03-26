import asyncio
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("startup")

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.core.db import init_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

@app.on_event("startup")
async def on_startup():
    try:
        await init_db()
        logger.info("✅ Database initialised successfully")
    except Exception as e:
        logger.error(f"❌ DB init failed: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

# Explicitly include V2 router for the new pipeline
from app.api.v2 import router as v2_router
app.include_router(v2_router, prefix="/api/v2")

@app.get("/")
def root():
    return {"message": "AI Job Automator API is running", "version": "2.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}
