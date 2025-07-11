from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from typing import Optional, Union
from ..services.tiktokverify import TikTokVerificationService
from ..models.tiktokverify import TikTokVerificationCreate, TikTokVerificationResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize service
verification_service = TikTokVerificationService()

@router.post("/verification", response_model=TikTokVerificationResponse)
async def upload_verification(
    # ------------ plain fields ------------
    passport_name: str = Form(...),
    real_name: str = Form(...),
    id_type: str = Form(...),
    gender: str = Form(...),
    nationality: str = Form(...),
    stage_name: Optional[str] = Form(None),
    id_number: str = Form(...),
    date_of_birth: str = Form(...),  # mm/dd/yy format
    account_intro: str = Form(...),
    overseas_platform_url: str = Form(...),
    follower_count: int = Form(...),
    other_platforms: Optional[str] = Form(None),
    agent_email: str = Form(...),
    # ------------ files ------------
    id_front_file: UploadFile = File(...),
    handheld_id_file: UploadFile = File(...),
    backend_ss_file: UploadFile = File(...),
    signed_auth_file: UploadFile = File(...),
    identity_video_file: Optional[UploadFile] = File(None),
):
    """Submit TikTok verification application"""
    try:
        logger.info("Starting verification process...")
        
        # Check if ID number already exists
        if verification_service.check_id_exists(id_number):
            raise HTTPException(400, "This ID number has already been submitted.")
        
        # Create verification data object
        verification_data = TikTokVerificationCreate(
            passport_name=passport_name,
            real_name=real_name,
            id_type=id_type,
            gender=gender,
            nationality=nationality,
            stage_name=stage_name,
            id_number=id_number,
            date_of_birth=date_of_birth,
            account_intro=account_intro,
            overseas_platform_url=overseas_platform_url,
            follower_count=follower_count,
            other_platforms=other_platforms,
            agent_email=agent_email
        )
        
        # Prepare files dictionary
        files = {
            "id_front_file": id_front_file,
            "handheld_id_file": handheld_id_file,
            "backend_ss_file": backend_ss_file,
            "signed_auth_file": signed_auth_file,
            "identity_video_file": identity_video_file
        }
        
        # Upload files and get paths
        file_paths = verification_service.upload_files(id_number, files)
        
        # Create verification record
        result = verification_service.create_verification(verification_data, file_paths)
        
        return TikTokVerificationResponse(
            success=True,
            message="Verification submitted successfully",
            data=result.get("data")
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions to preserve status codes
        raise
    except Exception as e:
        # Catch-all for unexpected errors
        logger.error(f"Unexpected error in upload_verification: {str(e)}")
        raise HTTPException(500, f"An unexpected error occurred: {str(e)}")

@router.get("/verification/{verification_id}")
async def get_verification(verification_id: str):
    """Get verification by ID"""
    try:
        verification = verification_service.get_verification_by_id(verification_id)
        if not verification:
            raise HTTPException(404, "Verification not found")
        
        return {
            "success": True,
            "data": verification
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching verification: {str(e)}")
        raise HTTPException(500, f"Failed to fetch verification: {str(e)}")

@router.get("/verifications")
async def get_verifications(limit: int = 50, offset: int = 0):
    """Get all verifications with pagination"""
    try:
        verifications = verification_service.get_verifications(limit, offset)
        return {
            "success": True,
            "data": verifications,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "count": len(verifications)
            }
        }
    except Exception as e:
        logger.error(f"Error fetching verifications: {str(e)}")
        raise HTTPException(500, f"Failed to fetch verifications: {str(e)}")

@router.get("/setup-storage")
async def setup_storage():
    """Setup storage bucket for verification assets"""
    try:
        result = verification_service.setup_storage()
        return result
    except Exception as e:
        logger.error(f"Error setting up storage: {str(e)}")
        raise HTTPException(500, f"Failed to set up storage: {str(e)}")

@router.get("/setup-database")
async def setup_database():
    """Check database table status"""
    try:
        # Check if table exists by trying a simple query
        try:
            verification_service.supabase.table("influencer_verifications").select("id").limit(1).execute()
            return {"message": "Table 'influencer_verifications' exists and is accessible"}
        except Exception as table_error:
            logger.error(f"Table check error: {str(table_error)}")
            return {"message": "Table may not exist. Please create it manually in the Supabase dashboard."}
    except Exception as e:
        logger.error(f"Error setting up database: {str(e)}")
        raise HTTPException(500, f"Failed to set up database: {str(e)}")

@router.get("/diagnose-database")
async def diagnose_database():
    """Diagnose database and storage status"""
    try:
        result = verification_service.diagnose_database()
        return result
    except Exception as e:
        logger.error(f"Error diagnosing database: {str(e)}")
        raise HTTPException(500, f"Failed to diagnose database: {str(e)}")

@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify API is working"""
    return {"status": "ok", "message": "TikTok Verification API is working"}
