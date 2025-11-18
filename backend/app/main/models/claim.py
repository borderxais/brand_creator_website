from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class CampaignClaimCreate(BaseModel):
    campaign_id: str
    user_id: str  # Changed from creator_id to user_id
    sample_text: Optional[str] = None
    sample_video_url: Optional[str] = None

class CampaignClaimResponse(BaseModel):
    model_config = ConfigDict(extra='allow')
    id: str
    campaign_id: str
    creator_id: str
    status: str
    sample_text: Optional[str] = None
    sample_video_url: Optional[str] = None
    created_at: str

class CampaignClaimExistsResponse(BaseModel):
    exists: bool

class CampaignClaimOperationResponse(BaseModel):
    success: Optional[bool] = None
    status: str
    claim_id: Optional[str] = None
    message: Optional[str] = None

class CreatorCampaignClaim(BaseModel):
    """Creator-facing claim item enriched with campaign data."""
    model_config = ConfigDict(extra='allow')
    id: Optional[str] = None
    creator_id: Optional[str] = None
    campaign_id: Optional[str] = None
    status: Optional[str] = None
    sample_text: Optional[str] = None
    sample_video_url: Optional[str] = None
    created_at: Optional[str] = None
    campaign_title: Optional[str] = None
    campaign_brand_name: Optional[str] = None
