from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class EntertainmentLive(BaseModel):
    id: str
    created_at: Optional[datetime] = None
    task_title: str
    brand_id: str
    campaign_objective: Optional[str] = None
    platform: Optional[str] = None
    task_start_at: Optional[datetime] = None
    task_end_at: Optional[datetime] = None
    follower_min: Optional[int] = None
    follower_max: Optional[int] = None
    niche_tags: Optional[List[str] | str] = None
    region_priority: Optional[str] = None
    content_quality_floor: Optional[str] = None
    deliverables: Optional[str] = None
    mandatory_elements: Optional[str] = None
    creative_guidelines: Optional[str] = None
    prohibited_elements: Optional[str] = None
    reward_model: Optional[str] = None
    fixed_reward: Optional[float] = None
    tiered_table: Optional[str] = None
    cps_rate: Optional[float] = None
    kpi_baseline: Optional[str] = None
    updated_at: Optional[datetime] = None
    brand_name: Optional[str] = None  # For joined data

class EntertainmentLiveCreate(BaseModel):
    task_title: str
    brand_id: str
    campaign_objective: Optional[str] = None
    platform: Optional[str] = None
    task_start_at: Optional[datetime] = None
    task_end_at: Optional[datetime] = None
    follower_min: Optional[int] = None
    follower_max: Optional[int] = None
    niche_tags: Optional[List[str] | str] = None
    region_priority: Optional[str] = None
    content_quality_floor: Optional[str] = None
    deliverables: Optional[str] = None
    mandatory_elements: Optional[str] = None
    creative_guidelines: Optional[str] = None
    prohibited_elements: Optional[str] = None
    reward_model: Optional[str] = None
    fixed_reward: Optional[float] = None
    tiered_table: Optional[str] = None
    cps_rate: Optional[float] = None
    kpi_baseline: Optional[str] = None

class EntertainmentLiveResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
