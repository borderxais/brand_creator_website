from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class PearBrand(BaseModel):
    model_config = ConfigDict(extra='allow')
    id: UUID
    created_at: Optional[datetime] = None
    store_name: str
    store_link: str
    store_intro: str
    store_logo: Optional[str] = None

class PearBrandCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    store_name: str
    store_link: str
    store_intro: str
    store_logo: Optional[str] = None

class PearBrandResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
