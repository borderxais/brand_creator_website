from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Campaign API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")

if not supabase_url or not supabase_key:
    logger.error("Missing Supabase environment variables")
    supabase = None
else:
    logger.info(f"Initializing Supabase client with URL: {supabase_url}")
    try:
        supabase = create_client(supabase_url, supabase_key)
        logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        supabase = None

# Mock data for when real data isn't available
MOCK_CAMPAIGNS = [
    {
        "id": "1",
        "brand_id": "123",
        "title": "Summer Collection Launch",
        "brief": "Looking for fashion influencers to showcase our new summer collection through creative posts and stories.",
        "requirements": "Fashion & Lifestyle creators with 10K+ followers",
        "budget_range": "$1,000-$2,000",
        "commission": "15% per sale",
        "platform": "instagram",
        "deadline": "2024-06-30",
        "max_creators": 5,
        "is_open": True,
        "created_at": "2024-01-01T00:00:00Z",
        "brand_name": "StyleCo"
    },
    {
        "id": "2",
        "brand_id": "456",
        "title": "Fitness Challenge",
        "brief": "30-day fitness challenge promotion featuring our supplements and workout gear.",
        "requirements": "Fitness & Wellness creators with 20K+ followers",
        "budget_range": "$500-$1,000",
        "commission": "20% per sale",
        "platform": "tiktok",
        "deadline": "2024-07-15",
        "max_creators": 10,
        "is_open": True,
        "created_at": "2024-01-15T00:00:00Z",
        "brand_name": "FitLife"
    }
]

# Define data models
class Campaign(BaseModel):
    id: str
    brand_id: Optional[str] = None
    title: str
    brief: Optional[str] = None
    requirements: Optional[str] = None
    budget_range: Optional[str] = None
    commission: Optional[str] = None
    platform: Optional[str] = None
    deadline: Optional[str] = None
    max_creators: Optional[int] = 10
    is_open: bool = True
    created_at: Optional[str] = None
    brand_name: Optional[str] = None

# Function to check if table exists
async def check_table_exists(supabase_client: Client, table_name: str) -> bool:
    """Check if a table exists in Supabase."""
    try:
        # Try to select a single row with limit 0 to check if table exists
        response = supabase_client.table(table_name).select('id').limit(1).execute()
        return True
    except Exception as e:
        logger.error(f"Error checking if table '{table_name}' exists: {str(e)}")
        return False

# Add SQL to create the table - this can be used in Supabase SQL Editor
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS public.campaigns (
  id             uuid primary key default gen_random_uuid(),
  brand_id       text,
  title          text          not null,
  brief          text,
  requirements   text,
  budget_range   text,
  commission     text,
  platform       text,
  deadline       date,
  max_creators   integer       default 10,
  is_open        boolean       default true,
  created_at     timestamptz   default now()
);

-- Grant permissions to service role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Make sure the RLS policy exists
DROP POLICY IF EXISTS "Service role can do everything" ON public.campaigns;
CREATE POLICY "Service role can do everything" 
  ON public.campaigns 
  USING (auth.role() = 'service_role') 
  WITH CHECK (auth.role() = 'service_role');

-- Enable row level security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
"""

# Add a function to validate Supabase credentials
async def validate_supabase_connection():
    """Test the Supabase connection and check permissions."""
    if not supabase:
        return False, "Supabase client not initialized"
    
    try:
        # Try a simpler query that should work with minimal permissions
        response = supabase.rpc('get_service_role').execute()
        logger.info(f"Supabase connection test response: {response}")
        return True, "Connection successful"
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Supabase connection test failed: {error_msg}")
        
        if "permission denied" in error_msg.lower():
            return False, "Permission denied. The service key may not have proper permissions."
        elif "not found" in error_msg.lower():
            return False, "Resource not found. The function or table may not exist."
        else:
            return False, f"Connection failed: {error_msg}"

@app.get("/", response_model=List[Campaign])
async def get_campaigns(
    request: Request,
    search: Optional[str] = Query(None, description="Search term for title or brand"),
    platform: Optional[str] = Query(None, description="Filter by platform"),
    category: Optional[str] = Query(None, description="Filter by category")
):
    logger.info(f"Received request with params: search={search}, platform={platform}, category={category}")
    
    # Return mock data if Supabase is not configured
    if not supabase:
        logger.warning("Supabase client not available, returning mock data")
        return filter_mock_data(MOCK_CAMPAIGNS, search, platform, category)
    
    try:
        # Check if campaigns table exists
        table_exists = await check_table_exists(supabase, 'campaigns')
        if not table_exists:
            logger.warning("Campaigns table does not exist or is inaccessible, returning mock data")
            return filter_mock_data(MOCK_CAMPAIGNS, search, platform, category)
            
        # Query campaigns from Supabase
        logger.info("Querying Supabase for campaigns")
        query = supabase.table('campaigns').select('*')
        
        # Apply filters at database level when possible
        if platform and platform != 'all':
            query = query.eq('platform', platform.lower())
        
        # Execute the query
        logger.info("Executing Supabase query")
        try:
            response = query.execute()
            campaigns = response.data or []
            logger.info(f"Retrieved {len(campaigns)} campaigns from Supabase")
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Database query error: {error_msg}")
            
            # Check for permission denied errors
            if "permission denied" in error_msg.lower():
                logger.error("Permission denied error. Check your Supabase RLS policies and service key permissions.")
                # Return mock data as fallback
                return filter_mock_data(MOCK_CAMPAIGNS, search, platform, category)
            raise HTTPException(status_code=500, detail=f"Database query error: {error_msg}")
        
        # Additional filtering that might need to be done client-side
        if search and campaigns:
            search_lower = search.lower()
            filtered_campaigns = []
            for c in campaigns:
                title = c.get('title', '').lower()
                brand_id = str(c.get('brand_id', '')).lower()
                if search_lower in title or search_lower in brand_id:
                    filtered_campaigns.append(c)
            campaigns = filtered_campaigns
            logger.info(f"Filtered to {len(campaigns)} campaigns after search")
        
        # If no campaigns found, return mock data for development
        if not campaigns:
            logger.warning("No campaigns found in database, returning mock data")
            return filter_mock_data(MOCK_CAMPAIGNS, search, platform, category)
        
        # Get brand details for each campaign
        try:
            for campaign in campaigns:
                if campaign.get('brand_id'):
                    brand_response = supabase.table('profiles').select('name').eq('id', campaign['brand_id']).execute()
                    if brand_response.data and len(brand_response.data) > 0:
                        campaign['brand_name'] = brand_response.data[0].get('name', 'Unknown Brand')
                    else:
                        campaign['brand_name'] = 'Unknown Brand'
                else:
                    campaign['brand_name'] = 'Unknown Brand'
        except Exception as e:
            logger.error(f"Error fetching brand details: {str(e)}")
            # Continue with the campaigns we have, just without brand names
        
        return campaigns
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return filter_mock_data(MOCK_CAMPAIGNS, search, platform, category)

def filter_mock_data(mock_data, search=None, platform=None, category=None):
    """Filter mock data based on search and platform filters."""
    filtered_data = mock_data
    
    if search:
        search_lower = search.lower()
        filtered_data = [c for c in filtered_data if 
                         search_lower in c['title'].lower() or 
                         search_lower in c['brand_name'].lower()]
    
    if platform and platform != 'all':
        platform_lower = platform.lower()
        filtered_data = [c for c in filtered_data if c['platform'].lower() == platform_lower]
    
    logger.info(f"Returning {len(filtered_data)} mock campaigns")
    return filtered_data

# Add an endpoint to get SQL for table creation
@app.get("/setup-sql")
async def get_setup_sql():
    """Return SQL that can be used to set up the necessary tables and permissions."""
    return {"sql": CREATE_TABLE_SQL}

# Add a health check endpoint
@app.get("/health")
async def health_check():
    connection_ok, connection_msg = await validate_supabase_connection()
    
    # Get environment variable details (hiding sensitive parts)
    env_vars = {
        "SUPABASE_URL": supabase_url if supabase_url else "Not set",
        "SUPABASE_SERVICE_KEY": "****" if supabase_key else "Not set"
    }
    
    return {
        "status": "ok",
        "supabase": {
            "configured": supabase is not None,
            "connection": connection_ok,
            "message": connection_msg
        },
        "environment": env_vars,
        "api_version": "1.0.0"
    }

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
