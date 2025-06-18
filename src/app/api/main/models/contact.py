from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ContactFormData(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str
    timestamp: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ContactResponse(BaseModel):
    success: bool
    message: str
    contact_id: Optional[str] = None
    stored_in_database: Optional[bool] = None
