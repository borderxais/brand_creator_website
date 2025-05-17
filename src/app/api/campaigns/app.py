from fastapi import FastAPI, Query, HTTPException, Request, Path, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import logging
from datetime import datetime

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

# Update the model for campaign claims
class CampaignClaimCreate(BaseModel):
    campaign_id: str
    user_id: str  # Changed from creator_id to user_id
    sample_text: Optional[str] = None
    sample_video_url: Optional[str] = None

class CampaignClaimResponse(BaseModel):
    id: str
    campaign_id: str
    creator_id: str
    status: str
    sample_text: Optional[str] = None
    sample_video_url: Optional[str] = None
    created_at: str

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
        for campaign in campaigns:
            if campaign.get('brand_id'):
                try:
                    # Updated to use companyName instead of name
                    brand_response = supabase.table('BrandProfile').select('companyName').eq('id', campaign['brand_id']).execute()
                    if brand_response.data and len(brand_response.data) > 0:
                        campaign['brand_name'] = brand_response.data[0].get('companyName', 'Unknown Brand')
                    else:
                        campaign['brand_name'] = 'Unknown Brand'
                except Exception as e:
                    logger.error(f"Error fetching brand details: {str(e)}")
                    campaign['brand_name'] = f"Brand {campaign['brand_id']}"
            else:
                campaign['brand_name'] = 'Unknown Brand'
        
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

# Update the endpoint to check if a claim exists
@app.get("/campaign-claims/check")
async def check_campaign_claim(
    creatorId: str = Query(..., description="Creator ID"),
    campaignId: str = Query(..., description="Campaign ID")
):
    """Check if a creator has already applied to a campaign."""
    try:
        if not supabase:
            # Mock response for development
            return {"exists": False}
            
        logger.info(f"Looking up creator profile for userId: {creatorId}")
        
        # First get creator id from the profile
        creator_profile = supabase.table('CreatorProfile')\
            .select('id')\
            .eq('userId', creatorId)\
            .execute()
            
        if not creator_profile.data or len(creator_profile.data) == 0:
            logger.warning(f"Creator profile not found for userId {creatorId}")
            return {"exists": False}
            
        creator_id = creator_profile.data[0]['id']
        logger.info(f"Found creator ID: {creator_id} for userId: {creatorId}")
        
        # Query to check if claim exists using the actual creator ID
        response = supabase.table('campaignclaims')\
            .select('id')\
            .eq('campaign_id', campaignId)\
            .eq('creator_id', creator_id)\
            .execute()
        
        claim_exists = len(response.data) > 0
        logger.info(f"Checking if claim exists for creator {creator_id} and campaign {campaignId}: {claim_exists}")
        return {"exists": claim_exists}
    
    except Exception as e:
        logger.error(f"Error checking campaign claim: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to check campaign claim: {str(e)}")

# Update the endpoint to create a campaign claim
@app.post("/campaign-claims", status_code=201)
async def create_campaign_claim(
    request: Request,
    campaign_claim: CampaignClaimCreate
):
    """Create a new campaign claim (application) from a creator."""
    try:
        logger.info(f"Creating campaign claim for user {campaign_claim.user_id} and campaign {campaign_claim.campaign_id}")
        
        if not supabase:
            # Return mock response for development
            logger.warning("Supabase not available, returning mock response")
            return {
                "status": "success", 
                "claim_id": "mock-claim-id-12345"
            }
        
        # First, look up the creator's profile to get the actual creator ID
        creator_profile = supabase.table('CreatorProfile')\
            .select('id')\
            .eq('userId', campaign_claim.user_id)\
            .execute()
            
        if not creator_profile.data or len(creator_profile.data) == 0:
            logger.error(f"Creator with userId {campaign_claim.user_id} not found in CreatorProfile table")
            raise HTTPException(status_code=404, detail="Creator not found")
        
        # Get the actual creator ID from CreatorProfile
        creator_id = creator_profile.data[0]['id']
        logger.info(f"Found creator ID: {creator_id} for user ID: {campaign_claim.user_id}")
        
        # Check if creator has already applied to this campaign
        existing_claim = supabase.table('campaignclaims')\
            .select('id')\
            .eq('campaign_id', campaign_claim.campaign_id)\
            .eq('creator_id', creator_id)\
            .execute()
        
        if existing_claim.data and len(existing_claim.data) > 0:
            logger.info(f"Creator {creator_id} has already applied to campaign {campaign_claim.campaign_id}")
            return {"status": "already_applied", "claim_id": existing_claim.data[0]['id']}

        # Validate campaign exists
        campaign = supabase.table('campaigns')\
            .select('id')\
            .eq('id', campaign_claim.campaign_id)\
            .execute()
            
        if not campaign.data or len(campaign.data) == 0:
            logger.error(f"Campaign {campaign_claim.campaign_id} not found")
            raise HTTPException(status_code=404, detail="Campaign not found")
            
        # Validate creator exists in CreatorProfile table
        creator = supabase.table('CreatorProfile')\
            .select('id')\
            .eq('userId', campaign_claim.user_id)\
            .execute()
            
        if not creator.data or len(creator.data) == 0:
            logger.error(f"Creator with userId {campaign_claim.user_id} not found in CreatorProfile table")
            raise HTTPException(status_code=404, detail="Creator not found")

        # Insert claim with the creator ID that's already in the correct format
        response = supabase.table('campaignclaims').insert({
            'campaign_id': campaign_claim.campaign_id,
            'creator_id': creator_id,
            'status': 'pending',
            'sample_text': campaign_claim.sample_text,
            'sample_video_url': campaign_claim.sample_video_url
        }).execute()

        if not response.data or len(response.data) == 0:
            logger.error("Failed to create campaign claim, no data returned from database")
            raise HTTPException(status_code=500, detail="Failed to create campaign claim")

        logger.info(f"Successfully created campaign claim with ID {response.data[0]['id']}")
        return {"status": "success", "claim_id": response.data[0]['id']}
    
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        logger.error(f"Error creating campaign claim: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create campaign claim: {str(e)}")

# Update the endpoint to get claims for a creator using userId
@app.get("/creator/{creator_id}/campaign-claims", response_model=List[dict])
async def get_creator_campaign_claims(
    request: Request,
    creator_id: str,
    limit: int = Query(10, ge=1, le=100)
):
    """Get campaign claims for a specific creator using database function."""
    try:
        logger.info(f"Fetching campaign claims for creator with userId: {creator_id}")
        
        if not supabase:
            # Return mock data for development
            logger.warning("Supabase not available, returning mock data")
            return [
                {
                    "id": "mock-claim-id-1",
                    "campaign_id": "mock-campaign-id-1",
                    "creator_id": creator_id,
                    "status": "pending",
                    "sample_text": "This is a sample script for the campaign",
                    "sample_video_url": "https://example.com/video",
                    "created_at": "2023-01-01T00:00:00Z",
                    "campaign_title": "Mock Campaign 1",
                    "campaign_brand_name": "MockBrand",
                    "campaign_deadline": "2023-12-31",
                    "campaign_budget_range": "$100-$200"
                }
            ]
        
        # First look up the creator's actual ID from CreatorProfile using userId
        creator_profile = supabase.table('CreatorProfile')\
            .select('id')\
            .eq('userId', creator_id)\
            .execute()
            
        if not creator_profile.data or len(creator_profile.data) == 0:
            logger.warning(f"Creator with userId {creator_id} not found")
            return []
            
        # Get the actual creator ID to use in queries
        actual_creator_id = creator_profile.data[0]['id']
        logger.info(f"Found actual creator ID: {actual_creator_id} for userId: {creator_id}")
        
        # Rest of the function remains the same, but use actual_creator_id
        try:
            # Try the RPC function first
            response = supabase.rpc(
                'get_creator_claims',
                {'creator_id_param': actual_creator_id, 'limit_param': limit}
            ).execute()
            
            if not response.data:
                logger.info(f"No campaign claims found for creator {creator_id}")
                return []
                
            result = response.data
            
            # Enrich with brand information
            for item in result:
                # Get the campaign to find the brand_id
                campaign_response = supabase.table('campaigns')\
                    .select('brand_id')\
                    .eq('id', item.get('campaign_id'))\
                    .execute()
                    
                brand_id = None
                if campaign_response.data and len(campaign_response.data) > 0:
                    brand_id = campaign_response.data[0].get('brand_id')
                
                # Add brand name if available
                if brand_id:
                    try:
                        brand_response = supabase.table('BrandProfile')\
                            .select('companyName')\
                            .eq('id', brand_id)\
                            .execute()
                            
                        if brand_response.data and len(brand_response.data) > 0:
                            item['campaign_brand_name'] = brand_response.data[0].get('companyName', 'Unknown Brand')
                        else:
                            item['campaign_brand_name'] = f"Brand {brand_id}"
                    except Exception as e:
                        logger.error(f"Error fetching brand details: {str(e)}")
                        item['campaign_brand_name'] = f"Brand {brand_id}"
                else:
                    item['campaign_brand_name'] = 'Unknown Brand'
            
            logger.info(f"Retrieved {len(result)} campaign claims for creator {creator_id}")
            return result
            
        except Exception as db_error:
            # If RPC fails (function doesn't exist), fall back to the old method
            logger.warning(f"Error using RPC function: {str(db_error)}")
            logger.warning("Falling back to manual query method")
            
            # Fallback to existing implementation
            claims_response = supabase.table('campaignclaims')\
                .select('*')\
                .eq('creator_id', actual_creator_id)\
                .order('created_at', desc=True)\
                .limit(limit)\
                .execute()
            
            if not claims_response.data:
                logger.info(f"No campaign claims found for creator {creator_id}")
                return []
            
            # Process and format the results with campaign details
            result = []
            for claim in claims_response.data:
                campaign_response = supabase.table('campaigns')\
                    .select('*')\
                    .eq('id', claim.get('campaign_id'))\
                    .execute()
                
                campaign_data = {}
                if campaign_response.data and len(campaign_response.data) > 0:
                    campaign_data = campaign_response.data[0]
                
                result.append({
                    "id": claim.get('id'),
                    "campaign_id": claim.get('campaign_id'),
                    "creator_id": claim.get('creator_id'),
                    "status": claim.get('status'),
                    "sample_text": claim.get('sample_text'),
                    "sample_video_url": claim.get('sample_video_url'),
                    "created_at": claim.get('created_at'),
                    "campaign_title": campaign_data.get('title', 'Unknown Campaign'),
                    "campaign_brand_name": "Unknown Brand",  # We'll look up the brand name
                    "campaign_deadline": campaign_data.get('deadline'),
                    "campaign_budget_range": campaign_data.get('budget_range')
                })
                
                # Try to get the brand name if brand_id exists - updated field to companyName
                for result_item in result:
                    campaign_data = campaign_response.data[0] if campaign_response.data else {}
                    if campaign_data.get('brand_id'):
                        try:
                            brand_response = supabase.table('BrandProfile').select('companyName').eq('id', campaign_data['brand_id']).execute()
                            if brand_response.data and len(brand_response.data) > 0:
                                result_item['campaign_brand_name'] = brand_response.data[0].get('companyName', 'Unknown Brand')
                        except Exception as brand_error:
                            logger.error(f"Error fetching brand name: {str(brand_error)}")
                            result_item['campaign_brand_name'] = f"Brand {campaign_data['brand_id']}"
            
            logger.info(f"Retrieved {len(result)} campaign claims for creator {creator_id}")
            return result
    
    except Exception as e:
        logger.error(f"Error fetching creator campaign claims: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch campaign claims: {str(e)}")

@app.get("/brand-campaigns/{brand_id}", response_model=List[dict])
async def get_brand_campaigns(
    brand_id: str = Path(..., description="The ID of the brand"),
    status: Optional[str] = Query(None, description="Filter by campaign status (e.g., DRAFT, ACTIVE, COMPLETED, CANCELLED)"),
    start_date: Optional[str] = Query(None, description="Filter by start date (format: YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (format: YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Search in campaign title or description")
):
    """
    Get all campaigns for a specific brand with optional filtering.
    """
    logger.info(f"Fetching campaigns for brand ID: {brand_id} with filters: status={status}, start_date={start_date}, end_date={end_date}, search={search}")
    
    try:
        if not supabase:
            # Return mock data for development if no Supabase connection
            mock_campaigns = [c for c in MOCK_CAMPAIGNS if c['brand_id'] == brand_id]
            logger.warning(f"No Supabase connection, returning {len(mock_campaigns)} mock campaigns")
            return mock_campaigns

        # Based on your clarification: users.id = BrandProfile.userId = campaigns.brand_id
        # So we can directly use the brand_id (user's ID) to query campaigns
        query = supabase.table('campaigns').select('*').eq('brand_id', brand_id)
        
        # Apply filters
        if status:
            query = query.eq('status', status.upper())
        
        if start_date:
            try:
                # Convert to ISO format for database query
                parsed_date = datetime.strptime(start_date, "%Y-%m-%d").isoformat()
                query = query.gte('start_date', parsed_date)
            except ValueError:
                logger.warning(f"Invalid start_date format: {start_date}")
        
        if end_date:
            try:
                # Convert to ISO format for database query
                parsed_date = datetime.strptime(end_date, "%Y-%m-%d").isoformat()
                query = query.lte('end_date', parsed_date)
            except ValueError:
                logger.warning(f"Invalid end_date format: {end_date}")
                
        # Execute query
        response = query.execute()
        
        if not response.data:
            logger.info(f"No campaigns found for brand ID: {brand_id}")
            return []
            
        campaigns = response.data
        logger.info(f"Found {len(campaigns)} campaigns for brand ID: {brand_id}")
        
        # If search parameter is provided, filter results
        if search and search.strip():
            search_lower = search.lower()
            campaigns = [
                c for c in campaigns 
                if search_lower in c.get('title', '').lower() or 
                   search_lower in c.get('description', '').lower()
            ]
            logger.info(f"After search filter, found {len(campaigns)} campaigns")
        
        # Fetch claims (applications) for each campaign - Updated to use campaignclaims table
        for campaign in campaigns:
            try:
                # Use campaignclaims table instead of applications
                claims_response = supabase.table('campaignclaims')\
                    .select('*')\
                    .eq('campaign_id', campaign['id'])\
                    .execute()
                
                # Store the claims as applications in the campaign object
                campaign['applications'] = claims_response.data or []
                logger.info(f"Found {len(campaign['applications'])} claims/applications for campaign ID: {campaign['id']}")
                
                # Optionally, fetch creator details for each claim
                for claim in campaign['applications']:
                    try:
                        if claim.get('creator_id'):
                            creator_response = supabase.table('CreatorProfile')\
                                .select('*')\
                                .eq('id', claim['creator_id'])\
                                .execute()
                            
                            if creator_response.data and len(creator_response.data) > 0:
                                claim['creator'] = creator_response.data[0]
                    except Exception as e:
                        logger.error(f"Error fetching creator details for claim {claim.get('id')}: {str(e)}")
                
            except Exception as e:
                logger.error(f"Error fetching claims for campaign ID {campaign['id']}: {str(e)}")
                campaign['applications'] = []
        
        # Get brand information - using simpler query that doesn't need relationships
        try:
            brand_response = supabase.table('BrandProfile')\
                .select('*')\
                .eq('id', brand_id)\
                .execute()
            
            if brand_response.data and len(brand_response.data) > 0:
                brand_info = brand_response.data[0]
                
                # Add brand info to each campaign
                for campaign in campaigns:
                    campaign['brand'] = brand_info
            else:
                logger.warning(f"Brand profile not found for user ID: {brand_id}")
        except Exception as e:
            logger.error(f"Error fetching brand information for user ID {brand_id}: {str(e)}")
        
        return campaigns
        
    except Exception as e:
        logger.error(f"Error fetching campaigns for brand ID {brand_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch brand campaigns: {str(e)}")

# Add this new endpoint

@app.get("/brand-campaigns/{brand_id}/campaign/{campaign_id}", response_model=dict)
async def get_brand_campaign(
    brand_id: str = Path(..., description="The ID of the brand"),
    campaign_id: str = Path(..., description="The ID of the campaign")
):
    """
    Get a specific campaign by ID with all its applications
    """
    logger.info(f"Fetching campaign {campaign_id} for brand ID: {brand_id}")
    
    try:
        if not supabase:
            # Return mock data for development if no Supabase connection
            return {"error": "Supabase connection not available"}

        # Verify the campaign belongs to the brand
        campaign_response = supabase.table('campaigns')\
            .select('*')\
            .eq('id', campaign_id)\
            .eq('brand_id', brand_id)\
            .execute()
            
        if not campaign_response.data or len(campaign_response.data) == 0:
            logger.warning(f"Campaign {campaign_id} not found for brand {brand_id}")
            raise HTTPException(status_code=404, detail="Campaign not found")
            
        campaign = campaign_response.data[0]
        
        # Fetch all claims/applications for this campaign
        try:
            claims_response = supabase.table('campaignclaims')\
                .select('*')\
                .eq('campaign_id', campaign_id)\
                .execute()
                
            applications = claims_response.data or []
            campaign['applications'] = applications
            logger.info(f"Found {len(applications)} applications for campaign {campaign_id}")
            
            # Enhanced: Fetch creator details including user information
            for application in campaign['applications']:
                try:
                    if application.get('creator_id'):
                        # Get creator profile without trying to join with User
                        creator_response = supabase.table('CreatorProfile')\
                            .select('*')\
                            .eq('id', application['creator_id'])\
                            .execute()
                        
                        if creator_response.data and len(creator_response.data) > 0:
                            creator_data = creator_response.data[0]
                            application['creator'] = creator_data
                            
                            # Separate query to get user data if userId exists
                            if creator_data.get('userId'):
                                try:
                                    user_response = supabase.table('User')\
                                        .select('id, name, email, image')\
                                        .eq('id', creator_data['userId'])\
                                        .execute()
                                        
                                    if user_response.data and len(user_response.data) > 0:
                                        user_data = user_response.data[0]
                                        application['creator']['username'] = user_data.get('name')
                                        application['creator']['email'] = user_data.get('email')
                                        application['creator']['image'] = user_data.get('image')
                                        application['creator']['user'] = user_data  # Include full user data
                                except Exception as user_error:
                                    logger.error(f"Error fetching user data for creator {creator_data['userId']}: {str(user_error)}")
                                    
                except Exception as e:
                    logger.error(f"Error fetching creator details for application {application.get('id')}: {str(e)}")
                    # Still include the creator_id even if we can't get the details
                    application['creator'] = {'id': application['creator_id']}
            
        except Exception as e:
            logger.error(f"Error fetching applications for campaign {campaign_id}: {str(e)}")
            campaign['applications'] = []
        
        return campaign
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error fetching campaign {campaign_id} for brand {brand_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch campaign details: {str(e)}")

# Add this new endpoint for updating application status

@app.patch("/campaign-claims/{claim_id}/status")
async def update_campaign_claim_status(
    claim_id: str = Path(..., description="The ID of the claim/application"),
    status_update: dict = Body(..., description="Status update details")
):
    """Update the status of a campaign claim (application)."""
    try:
        status = status_update.get('status')
        brand_id = status_update.get('brand_id')
        
        if not status or status not in ['pending', 'approved', 'rejected']:
            raise HTTPException(status_code=400, detail="Invalid status value")
        
        logger.info(f"Updating campaign claim {claim_id} status to {status}")
        
        # Validate that the claim exists
        claim_response = supabase.table('campaignclaims')\
            .select('*')\
            .eq('id', claim_id)\
            .execute()
            
        if not claim_response.data or len(claim_response.data) == 0:
            logger.error(f"Claim {claim_id} not found")
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Get the campaign to verify ownership
        claim = claim_response.data[0]
        campaign_id = claim.get('campaign_id')
        
        campaign_response = supabase.table('campaigns')\
            .select('brand_id')\
            .eq('id', campaign_id)\
            .execute()
            
        if not campaign_response.data or len(campaign_response.data) == 0:
            logger.error(f"Campaign {campaign_id} not found for claim {claim_id}")
            raise HTTPException(status_code=404, detail="Campaign not found")
            
        # Verify the campaign is owned by the brand
        campaign = campaign_response.data[0]
        if campaign.get('brand_id') != brand_id:
            logger.error(f"Brand {brand_id} does not own campaign {campaign_id}")
            raise HTTPException(status_code=403, detail="You do not have permission to update this application")
            
        # Update the claim status
        update_response = supabase.table('campaignclaims')\
            .update({'status': status})\
            .eq('id', claim_id)\
            .execute()
            
        if not update_response.data:
            logger.error(f"Failed to update claim {claim_id} status")
            raise HTTPException(status_code=500, detail="Failed to update application status")
            
        logger.info(f"Successfully updated claim {claim_id} status to {status}")
        return {"success": True, "claim_id": claim_id, "status": status}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating campaign claim status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update application status: {str(e)}")

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
