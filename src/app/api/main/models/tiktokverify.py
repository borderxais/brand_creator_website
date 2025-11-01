from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class TikTokVerification(BaseModel):
    model_config = ConfigDict(extra='allow')
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
    model_config = ConfigDict(extra='forbid')
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

class TikTokVerificationWithPaths(BaseModel):
    model_config = ConfigDict(extra='allow')
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
    file_paths: Dict[str, Any]  # Contains the file paths from direct uploads

class TikTokVerificationResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[dict] = None

class TikTokVerificationListResponse(BaseModel):
    success: bool
    data: List[Dict[str, Any]]
    pagination: Dict[str, Any]

class UploadUrlEntry(BaseModel):
    model_config = ConfigDict(extra='allow')
    upload_url: str
    file_path: str
    token: Optional[str] = None

class UploadUrlsResponse(BaseModel):
    success: bool
    upload_urls: Dict[str, UploadUrlEntry]

class TikTokHealthResponse(BaseModel):
    model_config = ConfigDict(extra='allow')
    status: str
    timestamp: str
    service: str
    version: str
    checks: Dict[str, Dict[str, Any]]
    error: Optional[str] = None

class TikTokDiagnosticsResponse(BaseModel):
    model_config = ConfigDict(extra='allow')
    database_connected: bool
    table_exists: Optional[bool] = None
    table_structure: Optional[Any] = None
    storage_buckets: Optional[Any] = None
    error: Optional[str] = None

class TikTokSetupResponse(BaseModel):
    model_config = ConfigDict(extra='allow')
    message: str
    status: Optional[str] = None
    response: Optional[str] = None
    error: Optional[str] = None
