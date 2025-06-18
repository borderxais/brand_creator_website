from fastapi import APIRouter, Query, HTTPException, Request, Body, Path
from typing import List, Dict, Any
from ..models.claim import CampaignClaimCreate
from ..services.claim_service import ClaimService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/check")
async def check_campaign_claim(
    creatorId: str = Query(..., description="Creator ID"),
    campaignId: str = Query(..., description="Campaign ID")
):
    """Check if a creator has already applied to a campaign."""
    return await ClaimService.check_campaign_claim(creatorId, campaignId)

# Add explicit route for campaign-claims (what your frontend expects)
@router.get("/campaign-claims/check")
async def check_campaign_claim_alt(
    creatorId: str = Query(..., description="Creator ID"),
    campaignId: str = Query(..., description="Campaign ID")
):
    """Check if a creator has already applied to a campaign - alternative endpoint."""
    return await ClaimService.check_campaign_claim(creatorId, campaignId)

@router.post("/", status_code=201)
async def create_campaign_claim(
    request: Request,
    campaign_claim: CampaignClaimCreate
):
    """Create a new campaign claim (application) from a creator."""
    return await ClaimService.create_campaign_claim(campaign_claim)

# Add explicit route for campaign-claims POST (what your frontend expects)
@router.post("/campaign-claims", status_code=201)
async def create_campaign_claim_alt(
    request: Request,
    campaign_claim: CampaignClaimCreate
):
    """Create a new campaign claim (application) from a creator - alternative endpoint."""
    return await ClaimService.create_campaign_claim(campaign_claim)

@router.get("/creator/{creator_id}/campaign-claims", response_model=List[Dict[str, Any]])
async def get_creator_campaign_claims(
    request: Request,
    creator_id: str = Path(..., description="Creator user ID"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of claims to return")
):
    """Get campaign claims for a specific creator using userId."""
    return await ClaimService.get_creator_campaign_claims(creator_id, limit)

@router.patch("/{claim_id}/status")
async def update_claim_status(
    request: Request,
    claim_id: str = Path(..., description="Campaign claim ID")
):
    """Update the status of a campaign claim."""
    try:
        body = await request.json()
        status = body.get('status')
        brand_id = body.get('brand_id')  # Optional brand verification
        
        if not status:
            raise HTTPException(status_code=400, detail="Status is required")
        
        return await ClaimService.update_claim_status(claim_id, status, brand_id)
    except Exception as e:
        logger.error(f"Error in update_claim_status endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update claim status")

@router.patch("/campaign-claims/{claim_id}/status") 
async def update_claim_status_alt(
    request: Request,
    claim_id: str = Path(..., description="Campaign claim ID")
):
    """Update the status of a campaign claim - alternative endpoint."""
    try:
        body = await request.json()
        status = body.get('status')
        brand_id = body.get('brand_id')  # Optional brand verification
        
        if not status:
            raise HTTPException(status_code=400, detail="Status is required")
        
        return await ClaimService.update_claim_status(claim_id, status, brand_id)
    except Exception as e:
        logger.error(f"Error in update_claim_status_alt endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update claim status")