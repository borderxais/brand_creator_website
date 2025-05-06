import io, uuid, os
from datetime import datetime
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import asyncio
from supabase.lib.client_options import ClientOptions
import psycopg2
from psycopg2 import sql

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))), '.env')
print(f"Looking for .env file at: {env_path}")
print(f"File exists: {os.path.exists(env_path)}")

load_dotenv(dotenv_path=env_path)

# After loading, print the values (with partial masking for security)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
print(f"SUPABASE_URL loaded: {SUPABASE_URL}")
if SUPABASE_SERVICE_KEY:
    masked_key = SUPABASE_SERVICE_KEY[:10] + "..." + SUPABASE_SERVICE_KEY[-10:]
    print(f"SUPABASE_SERVICE_KEY loaded: {masked_key}")
else:
    print("SUPABASE_SERVICE_KEY not loaded")

# Check if environment variables are loaded
if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file")

# Update the Supabase client creation with additional options
supabase: Client = create_client(
    SUPABASE_URL, 
    SUPABASE_SERVICE_KEY,
    options=ClientOptions(
        schema="public",
        headers={"X-Client-Info": "supabase-py/0.0.0"},
        postgrest_client_timeout=60,
    )
)

app = FastAPI()

# Add CORS middleware to allow requests from your Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Update these functions to fix the storage and bucket issues

def _upload_to_bucket(path: str, file: UploadFile):
    try:
        print(f"Uploading file to path: {path}")
        content = io.BytesIO(file.file.read())
        
        # Try to upload with correct parameter format
        try:
            # Combine file options into a single parameter
            file_options = {
                "content-type": file.content_type,
                "upsert": True
            }
            
            # Use file_options as the third argument (not both positional and keyword)
            resp = supabase.storage.from_("verification-assets").upload(
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
                # First remove the file if it exists
                try:
                    supabase.storage.from_("verification-assets").remove([path])
                    print(f"Removed existing file at {path}")
                except Exception:
                    # Ignore removal errors
                    pass
                
                # Then try simpler upload without upsert option
                resp = supabase.storage.from_("verification-assets").upload(
                    path, 
                    content.getvalue()
                )
                print(f"Second upload response: {resp}")
                return True
            except Exception as second_err:
                print(f"Second upload attempt failed: {str(second_err)}")
                raise HTTPException(500, f"File upload error after second attempt: {str(second_err)}")
    except Exception as e:
        print(f"Upload error: {str(e)}")
        raise HTTPException(500, f"Storage upload error: {str(e)}")

@app.get("/api/setup-storage")
async def setup_storage():
    try:
        # First check if the bucket already exists by listing all buckets
        buckets_response = supabase.storage.list_buckets()
        print(f"Buckets response: {buckets_response}")
        
        # Check if our bucket is in the list
        bucket_exists = False
        for bucket in buckets_response:
            if bucket.name == "verification-assets":
                bucket_exists = True
                break
        
        if bucket_exists:
            # Bucket already exists, so we can proceed
            return {
                "message": "Storage bucket 'verification-assets' already exists",
                "status": "ready"
            }
        else:
            # Need to create the bucket
            try:
                # Make sure to pass the name as a string
                bucket_name = "verification-assets"
                resp = supabase.storage.create_bucket(bucket_name, {"public": False})
                return {
                    "message": "Storage bucket 'verification-assets' created successfully",
                    "response": str(resp)
                }
            except Exception as create_err:
                return {
                    "message": "Error creating bucket",
                    "error": str(create_err)
                }
    except Exception as e:
        print(f"Error in setup-storage: {str(e)}")
        raise HTTPException(500, f"Failed to set up storage: {str(e)}")

@app.post("/api/verification")
async def upload_verification(
    # ------------ plain fields ------------
    passport_name: str           = Form(...),
    real_name: str               = Form(...),
    id_type: str                 = Form(...),
    gender: str                  = Form(...),
    nationality: str             = Form(...),
    stage_name: str | None       = Form(None),
    id_number: str               = Form(...),
    date_of_birth: str           = Form(...),  # mm/dd/yy on the form
    account_intro: str           = Form(...),
    overseas_platform_url: str   = Form(...),
    follower_count: int          = Form(...),
    other_platforms: str | None  = Form(None),
    agent_email: str             = Form(...),
    # ------------ files ------------
    id_front_file: UploadFile    = File(...),
    handheld_id_file: UploadFile = File(...),
    backend_ss_file: UploadFile  = File(...),
    signed_auth_file: UploadFile = File(...),
    identity_video_file: UploadFile | None = File(None),
):
    try:
        print("Starting verification process...")
        
        # First try direct DB access to check if record exists
        try:
            print(f"Checking if ID {id_number} already exists...")
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Use SQL parameterization to avoid injection
            query = sql.SQL("SELECT id FROM influencer_verifications WHERE id_number = %s")
            cur.execute(query, (id_number,))
            existing_record = cur.fetchone()
            
            if existing_record:
                print(f"ID {id_number} already exists in database")
                cur.close()
                conn.close()
                raise HTTPException(400, "This ID number has already been submitted.")
                
            cur.close()
            conn.close()
            print("ID check completed successfully")
        except Exception as db_error:
            print(f"Direct database access error: {str(db_error)}")
            # Try Supabase API as fallback
            try:
                existing = supabase.table("influencer_verifications") \
                    .select("id") \
                    .eq("id_number", id_number) \
                    .execute()
                if existing.data:
                    raise HTTPException(400, "This ID number has already been submitted.")
            except Exception as supabase_error:
                print(f"Supabase API error: {str(supabase_error)}")
                # Continue anyway since we'll attempt to insert the record later
        
        # Upload files
        folder = f"{id_number}"
        file_paths = {}
        
        try:
            # Upload each file with better error handling
            file_paths["id_front_path"] = f"{folder}/id_front.{id_front_file.filename.split('.')[-1]}"
            _upload_to_bucket(file_paths["id_front_path"], id_front_file)
            
            file_paths["handheld_id_path"] = f"{folder}/id_handheld.{handheld_id_file.filename.split('.')[-1]}"
            _upload_to_bucket(file_paths["handheld_id_path"], handheld_id_file)
            
            file_paths["backend_ss_path"] = f"{folder}/backend_ss.{backend_ss_file.filename.split('.')[-1]}"
            _upload_to_bucket(file_paths["backend_ss_path"], backend_ss_file)
            
            file_paths["authorization_path"] = f"{folder}/authorization.{signed_auth_file.filename.split('.')[-1]}"
            _upload_to_bucket(file_paths["authorization_path"], signed_auth_file)
            
            if identity_video_file:
                file_paths["identity_video_path"] = f"{folder}/identity_video.{identity_video_file.filename.split('.')[-1]}"
                _upload_to_bucket(file_paths["identity_video_path"], identity_video_file)
            else:
                file_paths["identity_video_path"] = None
                
            print("All files uploaded successfully")
        except Exception as upload_error:
            print(f"File upload error: {str(upload_error)}")
            raise HTTPException(500, f"File upload error: {str(upload_error)}")
            
        try:
            print("Inserting record into database...")
            # Format date of birth
            dob = datetime.strptime(date_of_birth, "%m/%d/%y").date()
            dob_iso = dob.isoformat()
            
            # Try direct database insertion first
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Build the insert query
            columns = [
                "passport_name", "real_name", "id_type", "gender", "nationality",
                "stage_name", "id_number", "date_of_birth", "account_intro",
                "overseas_platform_url", "follower_count", "other_platforms",
                "agent_email", "id_front_path", "handheld_id_path", "backend_ss_path",
                "authorization_path", "identity_video_path"
            ]
            
            values = [
                passport_name, real_name, id_type, gender, nationality,
                stage_name, id_number, dob_iso, account_intro,
                overseas_platform_url, follower_count, other_platforms,
                agent_email, file_paths.get("id_front_path"), file_paths.get("handheld_id_path"),
                file_paths.get("backend_ss_path"), file_paths.get("authorization_path"),
                file_paths.get("identity_video_path")
            ]
            
            # Create placeholders for SQL parameters
            placeholders = ", ".join(["%s"] * len(columns))
            column_names = ", ".join(columns)
            
            # Build and execute the query
            query = f"INSERT INTO influencer_verifications ({column_names}) VALUES ({placeholders})"
            cur.execute(query, values)
            conn.commit()
            cur.close()
            conn.close()
            print("Record inserted successfully via direct database connection")
            
        except Exception as insert_db_error:
            print(f"Direct database insert error: {str(insert_db_error)}")
            
            # Try Supabase API as fallback
            try:
                record = {
                    "passport_name": passport_name,
                    "real_name": real_name,
                    "id_type": id_type,
                    "gender": gender,
                    "nationality": nationality,
                    "stage_name": stage_name,
                    "id_number": id_number,
                    "date_of_birth": dob,
                    "account_intro": account_intro,
                    "overseas_platform_url": overseas_platform_url,
                    "follower_count": follower_count,
                    "other_platforms": other_platforms,
                    "agent_email": agent_email,
                    **file_paths
                }
                
                insert_response = supabase.table("influencer_verifications").insert(record).execute()
                print(f"Record inserted successfully via Supabase API: {insert_response}")
            except Exception as supabase_insert_error:
                print(f"Supabase API insert error: {str(supabase_insert_error)}")
                raise HTTPException(500, f"Failed to save verification data: {str(supabase_insert_error)}")

        return {"success": True, "msg": "Verification submitted"}
    except HTTPException:
        # Re-raise HTTP exceptions to preserve status codes
        raise
    except Exception as e:
        # Catch-all for unexpected errors
        print(f"Unexpected error in upload_verification: {str(e)}")
        raise HTTPException(500, f"An unexpected error occurred: {str(e)}")

# Add this function to check and initialize the database table
@app.get("/api/setup-database")
async def setup_database():
    try:
        # Check if table exists by trying a simple query
        try:
            supabase.table("influencer_verifications").select("id").limit(1).execute()
            return {"message": "Table 'influencer_verifications' exists"}
        except Exception as table_error:
            # If the table doesn't exist, create it
            # Warning: this is a simplified approach, proper SQL should be executed through SQL editor
            print(f"Table check error: {str(table_error)}")
            return {"message": "Table may not exist. Please create it manually in the Supabase dashboard."}
    except Exception as e:
        print(f"Error setting up database: {str(e)}")
        raise HTTPException(500, f"Failed to set up database: {str(e)}")

@app.get("/api/test")
async def test_endpoint():
    return {"status": "ok", "message": "API is working"}

# Add a function to get direct database connection using the credentials from your .env
def get_db_connection():
    try:
        # Extract connection details from the DATABASE_URL or DIRECT_URL
        db_url = os.getenv("DIRECT_URL")
        if not db_url:
            print("DIRECT_URL not found, using DATABASE_URL")
            db_url = os.getenv("DATABASE_URL")
        
        if not db_url:
            raise ValueError("No database URL found in environment variables")
            
        print(f"Connecting to database with URL: {db_url[:20]}...")
        conn = psycopg2.connect(db_url)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {str(e)}")
        raise

# Add a function to directly check table structure
@app.get("/api/diagnose-database")
async def diagnose_database():
    try:
        # Check connection and table structure
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if table exists
        cur.execute("""
            SELECT EXISTS (
               SELECT FROM information_schema.tables 
               WHERE table_schema = 'public'
               AND table_name = 'influencer_verifications'
            );
        """)
        table_exists = cur.fetchone()[0]
        
        # Get table structure if it exists
        table_structure = []
        if table_exists:
            cur.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'influencer_verifications';
            """)
            table_structure = cur.fetchall()
        
        # Check storage buckets
        storage_buckets = []
        try:
            buckets_response = supabase.storage.list_buckets()
            for bucket in buckets_response:
                storage_buckets.append(bucket.name)
        except Exception as bucket_err:
            storage_buckets = [f"Error listing buckets: {str(bucket_err)}"]
        
        cur.close()
        conn.close()
        
        return {
            "database_connected": True,
            "table_exists": table_exists,
            "table_structure": table_structure,
            "storage_buckets": storage_buckets
        }
    except Exception as e:
        return {
            "database_connected": False,
            "error": str(e)
        }