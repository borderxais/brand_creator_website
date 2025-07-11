from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TikTokVerification(BaseModel):
    id: Optional[str] = None
    created_at: Optional[datetime] = None
    passport_name: str
    real_name: str
    id_type: str
    gender: str
    nationality: str
    stage_name: Optional[str] = None
    id_number: str
    date_of_birth: str
    account_intro: str
    overseas_platform_url: str
    follower_count: int
    other_platforms: Optional[str] = None
    agent_email: str
    id_front_path: Optional[str] = None
    handheld_id_path: Optional[str] = None
    backend_ss_path: Optional[str] = None
    authorization_path: Optional[str] = None
    identity_video_path: Optional[str] = None

class TikTokVerificationCreate(BaseModel):
    passport_name: str
    real_name: str
    id_type: str
    gender: str
    nationality: str
    stage_name: Optional[str] = None
    id_number: str
    date_of_birth: str
    account_intro: str
    overseas_platform_url: str
    follower_count: int
    other_platforms: Optional[str] = None
    agent_email: str

class TikTokVerificationResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
