from typing import List, Optional

from pydantic import BaseModel


class AiVideoGenerateResponse(BaseModel):
    request_id: str
    creator_id: str
    prompt: str
    voice_sample_url: Optional[str] = None
    image_url: Optional[str] = None
    storage_path: str
    status: str
    message: str


class AiVideoLibraryItem(BaseModel):
    id: str
    creator_id: str
    generated_time: str
    video_url: str
    tags: List[str]
    created_at: Optional[str] = None
    thumbnail_url: Optional[str] = None
