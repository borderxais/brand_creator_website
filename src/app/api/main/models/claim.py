from pydantic import BaseModel
from typing import Optional

class CampaignClaimCreate(BaseModel):
    campaign_id: str
    user_id: str  # Changed from creator_id to user_id
    sample_text: Optional[str] = None
    sample_video_url: Optional[str] = None

class CampaignClaimResponse(BaseModel):
    id: str
    campaign_id: str
    creator_id: str
    status: str
    sample_text: Optional[str] = None
    sample_video_url: Optional[str] = None
    created_at: str