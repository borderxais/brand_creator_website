from fastapi import APIRouter, File, UploadFile, Form
from typing import Dict, Any
from ..models.upload import UploadResponse
from ..services.upload_service import UploadService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload a file (image) for campaigns - simplified version."""
    return await UploadService.upload_general_file(file)

@router.post("/upload-product-photo", response_model=UploadResponse)
async def upload_product_photo(
    brand_id: str = Form(...),
    campaign_id: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload product photo for a campaign with proper organization."""
    return await UploadService.upload_product_photo(brand_id, campaign_id, file)

@router.get("/setup-campaigns-storage")
async def setup_campaigns_storage():
    """Setup campaigns storage bucket"""
    return await UploadService.setup_storage_bucket()

@router.get("/test-upload")
async def test_upload_endpoint():
    """Test endpoint to verify the upload service is working"""
    return await UploadService.test_upload_service()

@router.get("/diagnose-campaigns-storage")
async def diagnose_campaigns_storage():
    """Diagnose storage bucket status"""
    return await UploadService.diagnose_storage()
