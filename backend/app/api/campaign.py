from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.core.db import get_session
from app.models.base import Campaign
from typing import List, Optional

router = APIRouter()

@router.get("/", response_model=Campaign)
async def read_campaign(
    session: AsyncSession = Depends(get_session)
):
    result = await session.execute(select(Campaign).where(Campaign.is_active == True))
    campaign = result.scalars().first()
    if not campaign:
        # Create a default campaign if none exists (Auto-init for MVP)
        campaign = Campaign(
            target_role="Product Manager",
            target_locations="Remote",
            tech_stack="Python, React, SQL",
            apply_mode="manual"
        )
        session.add(campaign)
        await session.commit()
        await session.refresh(campaign)
        
    return campaign

@router.post("/")
async def create_or_update_campaign(
    campaign_data: dict, # Using dict to allow partial updates
    session: AsyncSession = Depends(get_session)
):
    result = await session.execute(select(Campaign).where(Campaign.is_active == True))
    existing_campaign = result.scalars().first()
    
    if existing_campaign:
        for key, value in campaign_data.items():
            if hasattr(existing_campaign, key):
                setattr(existing_campaign, key, value)
        session.add(existing_campaign)
        await session.commit()
        await session.refresh(existing_campaign)
        return existing_campaign
    else:
        new_campaign = Campaign(**campaign_data)
        session.add(new_campaign)
        await session.commit()
        await session.refresh(new_campaign)
        return new_campaign
