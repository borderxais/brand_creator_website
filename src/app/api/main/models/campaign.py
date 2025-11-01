from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict

class Campaign(BaseModel):
    model_config = ConfigDict(extra='allow')
    id: str
    brand_id: Optional[str] = None
    title: str
    brief: Optional[str] = None
    requirements: Optional[str] = None
    budget_range: Optional[str] = None
    budget_unit: Optional[str] = "total"
    commission: Optional[str] = None
    platform: Optional[str] = None
    deadline: Optional[str] = None
    max_creators: Optional[int] = 10
    is_open: bool = True
    created_at: Optional[str] = None
    brand_name: Optional[str] = None
    sample_video_url: Optional[str] = None
    # Add new fields
    industry_category: Optional[str] = None
    primary_promotion_objectives: Optional[List[str] | str] = None
    ad_placement: Optional[str] = "disable"
    campaign_execution_mode: Optional[str] = "direct"
    creator_profile_preferences_gender: Optional[List[str] | str] = None
    creator_profile_preference_ethnicity: Optional[List[str] | str] = None
    creator_profile_preference_content_niche: Optional[List[str] | str] = None
    preferred_creator_location: Optional[List[str] | str] = None
    language_requirement_for_creators: Optional[str] = "english"
    creator_tier_requirement: Optional[List[str] | str] = None
    send_to_creator: Optional[str] = "yes"
    approved_by_brand: Optional[str] = "yes"
    kpi_reference_target: Optional[str] = None
    prohibited_content_warnings: Optional[str] = None
    posting_requirements: Optional[str] = None
    product_photo: Optional[str] = None
    # New frontend fields
    script_required: Optional[str] = "no"
    product_name: Optional[str] = None
    product_highlight: Optional[str] = None
    product_price: Optional[str] = None
    product_sold_number: Optional[str] = None
    paid_promotion_type: Optional[str] = "commission_based"
    video_buyout_budget_range: Optional[str] = None
    base_fee_budget_range: Optional[str] = None

class CampaignCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    brand_id: str
    title: str
    brief: Optional[str] = None
    requirements: Optional[str] = None
    budget_range: Optional[str] = None
    budget_unit: Optional[str] = "total"
    commission: Optional[str] = None
    platform: Optional[str] = None
    deadline: Optional[str] = None
    max_creators: Optional[int] = 10
    is_open: Optional[bool] = True
    sample_video_url: Optional[str] = None
    # Add new fields
    industry_category: Optional[str] = None
    primary_promotion_objectives: Optional[List[str] | str] = None
    ad_placement: Optional[str] = "disable"
    campaign_execution_mode: Optional[str] = "direct"
    creator_profile_preferences_gender: Optional[List[str] | str] = None
    creator_profile_preference_ethnicity: Optional[List[str] | str] = None
    creator_profile_preference_content_niche: Optional[List[str] | str] = None
    preferred_creator_location: Optional[List[str] | str] = None
    language_requirement_for_creators: Optional[str] = "english"
    creator_tier_requirement: Optional[List[str] | str] = None
    send_to_creator: Optional[str] = "yes"
    approved_by_brand: Optional[str] = "yes"
    kpi_reference_target: Optional[str] = None
    prohibited_content_warnings: Optional[str] = None
    posting_requirements: Optional[str] = None
    product_photo: Optional[str] = None
    # New frontend fields
    script_required: Optional[str] = "no"
    product_name: Optional[str] = None
    product_highlight: Optional[str] = None
    product_price: Optional[str] = None
    product_sold_number: Optional[str] = None
    paid_promotion_type: Optional[str] = "commission_based"
    video_buyout_budget_range: Optional[str] = None
    base_fee_budget_range: Optional[str] = None

class CampaignApplication(BaseModel):
    """Represents a campaign application along with optional creator metadata."""
    model_config = ConfigDict(extra='allow')
    id: Optional[str] = None
    campaign_id: Optional[str] = None
    creator_id: Optional[str] = None
    status: Optional[str] = None
    sample_text: Optional[str] = None
    sample_video_url: Optional[str] = None
    created_at: Optional[str] = None
    creator: Optional[Dict[str, Any]] = None

class CampaignWithApplications(Campaign):
    applications: List[CampaignApplication] = []
    brand: Optional[Dict[str, Any]] = None

class CampaignMutationResponse(BaseModel):
    """Standard response envelope for campaign create/update/delete operations."""
    success: bool
    message: str
    campaign_id: Optional[str] = None
    campaign_title: Optional[str] = None

class BrandProfileStatus(BaseModel):
    """Represents the result of ensuring a brand profile exists."""
    exists: bool
    created: Optional[bool] = None
    brand_profile: Optional[Dict[str, Any]] = None
    message: str
