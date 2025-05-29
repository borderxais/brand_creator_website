import io, uuid, os
from datetime import datetime
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase.lib.client_options import ClientOptions
from pydantic import BaseModel
from typing import Optional

# Load environment variables - look in project root
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../'))
env_path = os.path.join(project_root, '.env')
print(f"Looking for .env file at: {env_path}")
print(f"File exists: {os.path.exists(env_path)}")

load_dotenv(dotenv_path=env_path)

# Environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

print(f"SUPABASE_URL: {SUPABASE_URL}")
print(f"SUPABASE_SERVICE_KEY: {'***' if SUPABASE_SERVICE_KEY else 'Not found'}")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file")

# Initialize Supabase client
supabase: Client = create_client(
    SUPABASE_URL, 
    SUPABASE_SERVICE_KEY,
    options=ClientOptions(
        schema="public",
        headers={"X-Client-Info": "supabase-py/0.0.0"},
        postgrest_client_timeout=60,
    )
)

app = FastAPI(title="Campaign Upload API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://borderx.net",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UploadResponse(BaseModel):
    success: bool
    url: str
    path: str
    message: str

def _upload_to_campaigns_bucket(path: str, file: UploadFile):
    """Upload file to campaigns bucket in Supabase storage"""
    try:
        print(f"Uploading file to campaigns bucket at path: {path}")
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if file.content_type not in allowed_types:
            raise HTTPException(400, f"Invalid file type. Allowed types: {', '.join(allowed_types)}")
        
        # Validate file size (5MB limit)
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        max_size = 5 * 1024 * 1024  # 5MB
        if file_size > max_size:
            raise HTTPException(400, f"File too large. Maximum size is {max_size // (1024*1024)}MB")
        
        # Read file content
        content = io.BytesIO(file.file.read())
        
        try:
            # Upload with file options
            file_options = {
                "content-type": file.content_type,
                "upsert": True
            }
            
            resp = supabase.storage.from_("campaigns").upload(
                path, 
                content.getvalue(),
                file_options
            )
            print(f"Upload response: {resp}")
            return True
            
        except Exception as upload_err:
            print(f"Upload error details: {str(upload_err)}")
            
            # Try alternate approach if first one fails
            try:
                # Remove existing file if it exists
                try:
                    supabase.storage.from_("campaigns").remove([path])
                    print(f"Removed existing file at {path}")
                except Exception:
                    pass
                
                # Try simpler upload
                resp = supabase.storage.from_("campaigns").upload(
                    path, 
                    content.getvalue()
                )
                print(f"Second upload response: {resp}")
                return True
                
            except Exception as second_err:
                print(f"Second upload attempt failed: {str(second_err)}")
                raise HTTPException(500, f"File upload failed: {str(second_err)}")
                
    except Exception as e:
        print(f"Upload error: {str(e)}")
        raise HTTPException(500, f"Storage upload error: {str(e)}")

@app.get("/api/setup-campaigns-storage")
async def setup_campaigns_storage():
    """Setup campaigns storage bucket"""
    try:
        # Check if bucket exists
        buckets_response = supabase.storage.list_buckets()
        print(f"Buckets response: {buckets_response}")
        
        bucket_exists = False
        for bucket in buckets_response:
            if bucket.name == "campaigns":
                bucket_exists = True
                break
        
        if bucket_exists:
            return {
                "message": "Storage bucket 'campaigns' already exists",
                "status": "ready"
            }
        else:
            # Create the bucket as public since product photos need to be publicly accessible
            try:
                bucket_name = "campaigns"
                resp = supabase.storage.create_bucket(bucket_name, {"public": True})
                return {
                    "message": "Storage bucket 'campaigns' created successfully",
                    "response": str(resp)
                }
            except Exception as create_err:
                return {
                    "message": "Error creating bucket",
                    "error": str(create_err)
                }
                
    except Exception as e:
        print(f"Error in setup-campaigns-storage: {str(e)}")
        raise HTTPException(500, f"Failed to set up storage: {str(e)}")

@app.post("/api/upload-product-photo", response_model=UploadResponse)
async def upload_product_photo(
    brand_id: str = Form(...),
    campaign_id: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload product photo for a campaign"""
    try:
        print(f"Starting product photo upload for brand {brand_id}, campaign {campaign_id}")
        
        # Validate required fields
        if not brand_id or not campaign_id:
            raise HTTPException(400, "brand_id and campaign_id are required")
        
        if not file:
            raise HTTPException(400, "No file provided")
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if file.filename else 'jpg'
        unique_filename = f"product_photo_{uuid.uuid4().hex}.{file_extension}"
        
        # Create folder structure: campaigns/{brand_id}/{campaign_id}/{filename}
        file_path = f"{brand_id}/{campaign_id}/{unique_filename}"
        
        # Upload file
        _upload_to_campaigns_bucket(file_path, file)
        
        # Get public URL
        try:
            public_url_response = supabase.storage.from_("campaigns").get_public_url(file_path)
            public_url = public_url_response
            print(f"Generated public URL: {public_url}")
        except Exception as url_err:
            print(f"Error getting public URL: {str(url_err)}")
            # Construct URL manually if needed
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/campaigns/{file_path}"
        
        return UploadResponse(
            success=True,
            url=public_url,
            path=file_path,
            message="Product photo uploaded successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in upload_product_photo: {str(e)}")
        raise HTTPException(500, f"An unexpected error occurred: {str(e)}")

@app.get("/api/test-upload")
async def test_upload_endpoint():
    """Test endpoint to verify the upload service is working"""
    return {
        "status": "ok", 
        "message": "Campaign upload API is working",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/diagnose-campaigns-storage")
async def diagnose_campaigns_storage():
    """Diagnose storage bucket status"""
    try:
        # Check storage buckets
        storage_buckets = []
        try:
            buckets_response = supabase.storage.list_buckets()
            for bucket in buckets_response:
                storage_buckets.append({
                    "name": bucket.name,
                    "public": getattr(bucket, 'public', 'unknown')
                })
        except Exception as bucket_err:
            storage_buckets = [f"Error listing buckets: {str(bucket_err)}"]
        
        # Check if campaigns bucket exists and is accessible
        campaigns_bucket_status = "not_found"
        try:
            # Try to list files in campaigns bucket
            files_response = supabase.storage.from_("campaigns").list()
            campaigns_bucket_status = "accessible"
        except Exception as access_err:
            campaigns_bucket_status = f"error: {str(access_err)}"
        
        return {
            "storage_buckets": storage_buckets,
            "campaigns_bucket_status": campaigns_bucket_status,
            "supabase_url": SUPABASE_URL,
            "has_service_key": bool(SUPABASE_SERVICE_KEY)
        }
        
    except Exception as e:
        return {
            "error": str(e)
        }
