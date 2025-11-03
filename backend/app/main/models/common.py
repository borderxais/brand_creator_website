from typing import Any, List, Optional
from pydantic import BaseModel, ConfigDict


class GenericStatusResponse(BaseModel):
    """Simple status/message envelope that tolerates additional keys."""
    model_config = ConfigDict(extra='allow')
    success: Optional[bool] = None
    status: Optional[str] = None
    message: Optional[str] = None
    detail: Optional[str] = None


class StorageBucketInfo(BaseModel):
    """Represents a storage bucket entry returned from Supabase."""
    model_config = ConfigDict(extra='allow')
    name: str
    public: Optional[Any] = None


class StorageDiagnosticsResponse(BaseModel):
    """Detailed diagnostics payload for the upload storage health check."""
    model_config = ConfigDict(extra='allow')
    storage_buckets: List[Any]
    campaigns_bucket_status: str
    supabase_url: Optional[str] = None
    has_service_key: Optional[bool] = None
    error: Optional[str] = None


class SQLScriptResponse(BaseModel):
    """Simple wrapper for SQL setup scripts."""
    model_config = ConfigDict(extra='allow')
    sql: str
