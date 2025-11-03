from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, field_serializer


class ContactFormData(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
    )
    name: str
    email: EmailStr
    subject: str
    message: str
    timestamp: Optional[datetime] = None

    @field_serializer("timestamp")
    def serialize_timestamp(cls, value: Optional[datetime]) -> Optional[str]:
        if value is None:
            return None
        return value.isoformat()

class ContactResponse(BaseModel):
    success: bool
    message: str
    contact_id: Optional[str] = None
    stored_in_database: Optional[bool] = None

class ContactHealthStatus(BaseModel):
    status: str
    service: str
    timestamp: str
    database: str
    email_configured: bool

class ContactFormSchema(BaseModel):
    model_config = ConfigDict(extra='allow')
    fields: Dict[str, Dict[str, Any]]
    validation_rules: Dict[str, Any]

class EmailTestResponse(BaseModel):
    success: bool
    message: str
    smtp_configured: bool
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None

class ContactMessagesResponse(BaseModel):
    model_config = ConfigDict(extra='allow')
    success: Optional[bool] = None
    messages: Optional[List[Dict[str, Any]]] = None
    count: Optional[int] = None
    error: Optional[str] = None

class ContactMessageStatusResponse(BaseModel):
    model_config = ConfigDict(extra='allow')
    success: Optional[bool] = None
    message_id: Optional[int] = None
    status: Optional[str] = None
