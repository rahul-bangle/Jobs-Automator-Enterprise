from fastapi import APIRouter
from app.api import jobs, campaign, imports, intelligence, trust, packets, dlq, learning

api_router = APIRouter()

api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(campaign.router, prefix="/campaign", tags=["campaign"])
api_router.include_router(imports.router, prefix="/import", tags=["import"])
api_router.include_router(intelligence.router, prefix="/intelligence", tags=["intelligence"])
api_router.include_router(trust.router, prefix="/trust", tags=["trust"])
api_router.include_router(packets.router, prefix="/packets", tags=["packets"])
api_router.include_router(dlq.router, prefix="/dlq", tags=["dlq"])
api_router.include_router(learning.router, prefix="/learning", tags=["learning"])
