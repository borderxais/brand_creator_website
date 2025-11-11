from typing import Optional

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
