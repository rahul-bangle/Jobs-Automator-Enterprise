from fastapi import APIRouter
from app.api import jobs, imports, intelligence, trust, packets, v2

api_router = APIRouter()

api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(imports.router, prefix="/imports", tags=["imports"])
api_router.include_router(intelligence.router, prefix="/intelligence", tags=["intelligence"])
api_router.include_router(trust.router, prefix="/trust", tags=["trust"])
api_router.include_router(packets.router, prefix="/packets", tags=["packets"])
api_router.include_router(v2.router, prefix="/v2", tags=["v2"])
