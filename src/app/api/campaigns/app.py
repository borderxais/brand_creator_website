from fastapi import FastAPI, Query, HTTPException, Request, Path, Body, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime
from typing import Dict, Any
import os
import logging
import json
import platform
import uuid

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
    allow_origins=[
        "https://borderx.net",
        "https://www.borderx.net", 
        "http://localhost:3000",  # For local development
        "http://127.0.0.1:3000"   # Alternative localhost
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")

# Add more detailed logging for Supabase initialization
if not supabase_url or not supabase_key:
    logger.error(f"Missing Supabase environment variables. URL present: {bool(supabase_url)}, Key present: {bool(supabase_key)}")
    supabase = None
else:
    logger.info(f"Initializing Supabase client with URL: {supabase_url[:20]}...")
    try:
        supabase = create_client(supabase_url, supabase_key)
        logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")
        supabase = None

# Update the data models
class Campaign(BaseModel):
    id: str
    brand_id: Optional[str] = None
    title: str
    brief: Optional[str] = None
    requirements: Optional[str] = None
    budget_range: Optional[str] = None
    budget_unit: Optional[str] = "total"
    commission: Optional[str] = None
    platform: Optional[str] = None
    deadline: Optional[str] = None
    max_creators: Optional[int] = 10
    is_open: bool = True
    created_at: Optional[str] = None
    brand_name: Optional[str] = None
    sample_video_url: Optional[str] = None
    # Add new fields
    industry_category: Optional[str] = None
    primary_promotion_objectives: Optional[List[str] | str] = None
    ad_placement: Optional[str] = "disable"
    campaign_execution_mode: Optional[str] = "direct"
    creator_profile_preferences_gender: Optional[List[str] | str] = None
    creator_profile_preference_ethnicity: Optional[List[str] | str] = None
    creator_profile_preference_content_niche: Optional[List[str] | str] = None
    preferred_creator_location: Optional[List[str] | str] = None
    language_requirement_for_creators: Optional[str] = "english"
    creator_tier_requirement: Optional[List[str] | str] = None
    send_to_creator: Optional[str] = "yes"
    approved_by_brand: Optional[str] = "yes"
    kpi_reference_target: Optional[str] = None
    prohibited_content_warnings: Optional[str] = None
    posting_requirements: Optional[str] = None
    product_photo: Optional[str] = None
    # New frontend fields
    script_required: Optional[str] = "no"
    product_name: Optional[str] = None
    product_highlight: Optional[str] = None
    product_price: Optional[str] = None
    product_sold_number: Optional[str] = None
    paid_promotion_type: Optional[str] = "commission_based"
    video_buyout_budget_range: Optional[str] = None
    base_fee_budget_range: Optional[str] = None

# Model for campaign creation - update with new fields
class CampaignCreate(BaseModel):
    brand_id: str
    title: str
    brief: Optional[str] = None
    requirements: Optional[str] = None
    budget_range: Optional[str] = None
    budget_unit: Optional[str] = "total"
    commission: Optional[str] = None
    platform: Optional[str] = None
    deadline: Optional[str] = None
    max_creators: Optional[int] = 10
    is_open: Optional[bool] = True
    sample_video_url: Optional[str] = None
    # Add new fields
    industry_category: Optional[str] = None
    primary_promotion_objectives: Optional[List[str] | str] = None
    ad_placement: Optional[str] = "disable"
    campaign_execution_mode: Optional[str] = "direct"
    creator_profile_preferences_gender: Optional[List[str] | str] = None
    creator_profile_preference_ethnicity: Optional[List[str] | str] = None
    creator_profile_preference_content_niche: Optional[List[str] | str] = None
    preferred_creator_location: Optional[List[str] | str] = None
    language_requirement_for_creators: Optional[str] = "english"
    creator_tier_requirement: Optional[List[str] | str] = None
    send_to_creator: Optional[str] = "yes"
    approved_by_brand: Optional[str] = "yes"
    kpi_reference_target: Optional[str] = None
    prohibited_content_warnings: Optional[str] = None
    posting_requirements: Optional[str] = None
    product_photo: Optional[str] = None
    # New frontend fields
    script_required: Optional[str] = "no"
    product_name: Optional[str] = None
    product_highlight: Optional[str] = None
    product_price: Optional[str] = None
    product_sold_number: Optional[str] = None
    paid_promotion_type: Optional[str] = "commission_based"
    video_buyout_budget_range: Optional[str] = None
    base_fee_budget_range: Optional[str] = None

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

# Update the SQL for table creation to include new fields
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS public.campaigns (
  id             uuid primary key default gen_random_uuid(),
  brand_id       text,
  title          text          not null,
  brief          text,
  requirements   text,
  budget_range   text,
  budget_unit    text          default 'total',
  commission     text,
  platform       text,
  deadline       date,
  max_creators   integer       default 10,
  is_open        boolean       default true,
  created_at     timestamptz   default now(),
  sample_video_url text,
  -- Existing new fields
  industry_category text,
  primary_promotion_objectives text,
  ad_placement text default 'disable',
  campaign_execution_mode text default 'direct',
  creator_profile_preferences_gender text,
  creator_profile_preference_ethnicity text,
  creator_profile_preference_content_niche text,
  preferred_creator_location text,
  language_requirement_for_creators text default 'english',
  creator_tier_requirement text,
  send_to_creator text default 'yes',
  approved_by_brand text default 'yes',
  kpi_reference_target text,
  prohibited_content_warnings text,
  posting_requirements text,
  product_photo text,
  -- New frontend fields
  script_required text default 'no',
  product_name text,
  product_highlight text,
  product_price text,
  product_sold_number text,
  paid_promotion_type text default 'commission_based',
  video_buyout_budget_range text,
  base_fee_budget_range text
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
    
    # Return empty list if Supabase is not configured
    if not supabase:
        logger.warning("Supabase client not available, returning empty list")
        return []
    
    try:
        # Check if campaigns table exists
        table_exists = await check_table_exists(supabase, 'campaigns')
        if not table_exists:
            logger.warning("Campaigns table does not exist or is inaccessible, returning empty list")
            return []
            
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
                return []
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
        
        # If no campaigns found, return empty list
        if not campaigns:
            logger.info("No campaigns found in database, returning empty list")
            return []
        
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
        return []

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
            # Return no existing claim for development
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
        
        # Query to check if claim exists using UUID campaign_id
        try:
            response = supabase.table('campaignclaims')\
                .select('id')\
                .eq('campaign_id', campaignId)\
                .eq('creator_id', creator_id)\
                .execute()
        except Exception as db_error:
            logger.error(f"Database error checking claim: {str(db_error)}")
            # If it's a UUID format error, return false
            if "invalid input syntax for type uuid" in str(db_error).lower():
                logger.warning(f"Invalid UUID format for campaign_id: {campaignId}")
                return {"exists": False}
            raise
        
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
            # Cannot create claim without database
            logger.error("Supabase not available, cannot create campaign claim")
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Validate campaign_id is a valid UUID format
        try:
            import uuid
            uuid.UUID(campaign_claim.campaign_id)
        except ValueError:
            logger.error(f"Invalid UUID format for campaign_id: {campaign_claim.campaign_id}")
            raise HTTPException(status_code=400, detail="Invalid campaign ID format")
        
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
        try:
            existing_claim = supabase.table('campaignclaims')\
                .select('id')\
                .eq('campaign_id', campaign_claim.campaign_id)\
                .eq('creator_id', creator_id)\
                .execute()
        except Exception as db_error:
            logger.error(f"Database error checking existing claim: {str(db_error)}")
            if "invalid input syntax for type uuid" in str(db_error).lower():
                raise HTTPException(status_code=400, detail="Invalid campaign ID format")
            raise HTTPException(status_code=500, detail="Database error checking existing claim")
        
        if existing_claim.data and len(existing_claim.data) > 0:
            logger.info(f"Creator {creator_id} has already applied to campaign {campaign_claim.campaign_id}")
            return {"status": "already_applied", "claim_id": existing_claim.data[0]['id']}

        # Validate campaign exists using UUID
        try:
            campaign = supabase.table('campaigns')\
                .select('id')\
                .eq('id', campaign_claim.campaign_id)\
                .execute()
        except Exception as db_error:
            logger.error(f"Database error validating campaign: {str(db_error)}")
            if "invalid input syntax for type uuid" in str(db_error).lower():
                raise HTTPException(status_code=400, detail="Invalid campaign ID format")
            raise HTTPException(status_code=500, detail="Database error validating campaign")
            
        if not campaign.data or len(campaign.data) == 0:
            logger.error(f"Campaign {campaign_claim.campaign_id} not found")
            raise HTTPException(status_code=404, detail="Campaign not found")

        # Insert claim with UUID campaign_id
        try:
            response = supabase.table('campaignclaims').insert({
                'campaign_id': campaign_claim.campaign_id,  # Now expects UUID
                'creator_id': creator_id,
                'status': 'pending',
                'sample_text': campaign_claim.sample_text,
                'sample_video_url': campaign_claim.sample_video_url
            }).execute()
        except Exception as db_error:
            logger.error(f"Database error creating claim: {str(db_error)}")
            if "invalid input syntax for type uuid" in str(db_error).lower():
                raise HTTPException(status_code=400, detail="Invalid campaign ID format")
            raise HTTPException(status_code=500, detail="Database error creating claim")

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
            # Return empty list if no database
            logger.warning("Supabase not available, returning empty list")
            return []
        
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
        
        # Use direct query with UUID campaign_id handling
        try:
            logger.info(f"Using direct query for creator claims with ID: {actual_creator_id}")
            claims_response = supabase.table('campaignclaims')\
                .select('*')\
                .eq('creator_id', actual_creator_id)\
                .order('created_at', desc=True)\
                .limit(limit)\
                .execute()
            
            if not claims_response.data:
                logger.info(f"No campaign claims found for creator {creator_id}")
                return []
            
            # Process and format the results with campaign details including new fields
            result = []
            for claim in claims_response.data:
                # Query campaigns table using UUID campaign_id
                try:
                    campaign_response = supabase.table('campaigns')\
                        .select('*')\
                        .eq('id', claim.get('campaign_id'))\
                        .execute()
                except Exception as db_error:
                    logger.error(f"Error fetching campaign for claim {claim.get('id')}: {str(db_error)}")
                    campaign_response = None
                
                campaign_data = {}
                if campaign_response and campaign_response.data and len(campaign_response.data) > 0:
                    campaign_data = campaign_response.data[0]
                
                # Create result item with all relevant fields including the new ones
                result_item = {
                    "id": claim.get('id'),
                    "campaign_id": str(claim.get('campaign_id')),  # Convert UUID to string for JSON
                    "creator_id": claim.get('creator_id'),
                    "status": claim.get('status'),
                    "sample_text": claim.get('sample_text'),
                    "sample_video_url": claim.get('sample_video_url'),
                    "created_at": claim.get('created_at'),
                    # Basic campaign fields
                    "campaign_title": campaign_data.get('title', 'Unknown Campaign'),
                    "campaign_brand_name": "Unknown Brand",  # Will be updated below
                    "campaign_deadline": campaign_data.get('deadline'),
                    "campaign_budget_range": campaign_data.get('budget_range'),
                    "campaign_budget_unit": campaign_data.get('budget_unit', 'total'),
                    "campaign_brief": campaign_data.get('brief'),
                    "campaign_sample_video_url": campaign_data.get('sample_video_url'),
                    # Existing campaign fields
                    "industry_category": campaign_data.get('industry_category'),
                    "primary_promotion_objectives": campaign_data.get('primary_promotion_objectives'),
                    "ad_placement": campaign_data.get('ad_placement'),
                    "campaign_execution_mode": campaign_data.get('campaign_execution_mode'),
                    "creator_profile_preferences_gender": campaign_data.get('creator_profile_preferences_gender'),
                    "creator_profile_preference_ethnicity": campaign_data.get('creator_profile_preference_ethnicity'),
                    "creator_profile_preference_content_niche": campaign_data.get('creator_profile_preference_content_niche'),
                    "preferred_creator_location": campaign_data.get('preferred_creator_location'),
                    "language_requirement_for_creators": campaign_data.get('language_requirement_for_creators'),
                    "creator_tier_requirement": campaign_data.get('creator_tier_requirement'),
                    "send_to_creator": campaign_data.get('send_to_creator'),
                    "approved_by_brand": campaign_data.get('approved_by_brand'),
                    "kpi_reference_target": campaign_data.get('kpi_reference_target'),
                    "prohibited_content_warnings": campaign_data.get('prohibited_content_warnings'),
                    "posting_requirements": campaign_data.get('posting_requirements'),
                    "product_photo": campaign_data.get('product_photo'),
                    # New frontend fields
                    "script_required": campaign_data.get('script_required'),
                    "product_name": campaign_data.get('product_name'),
                    "product_highlight": campaign_data.get('product_highlight'),
                    "product_price": campaign_data.get('product_price'),
                    "product_sold_number": campaign_data.get('product_sold_number'),
                    "paid_promotion_type": campaign_data.get('paid_promotion_type'),
                    "video_buyout_budget_range": campaign_data.get('video_buyout_budget_range'),
                    "base_fee_budget_range": campaign_data.get('base_fee_budget_range')
                }
                
                result.append(result_item)
                
                # Try to get the brand name if brand_id exists
                if campaign_data.get('brand_id'):
                    try:
                        brand_response = supabase.table('BrandProfile').select('companyName').eq('id', campaign_data['brand_id']).execute()
                        if brand_response.data and len(brand_response.data) > 0:
                            result_item['campaign_brand_name'] = brand_response.data[0].get('companyName', 'Unknown Brand')
                        else:
                            result_item['campaign_brand_name'] = f"Brand {campaign_data['brand_id']}"
                    except Exception as brand_error:
                        logger.error(f"Error fetching brand name: {str(brand_error)}")
                        result_item['campaign_brand_name'] = f"Brand {campaign_data['brand_id']}"
            
            logger.info(f"Retrieved {len(result)} campaign claims for creator {creator_id}")
            return result
            
        except Exception as db_error:
            logger.error(f"Error fetching claims manually: {str(db_error)}")
            return []
    
    except Exception as e:
        logger.error(f"Error fetching creator campaign claims: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch campaign claims: {str(e)}")

@app.get("/brand-campaigns/{brand_id}", response_model=List[dict])
async def get_brand_campaigns(
    brand_id: str = Path(..., description="The brand profile ID (not user ID)"),
    status: Optional[str] = Query(None, description="Filter by campaign status (e.g., DRAFT, ACTIVE, COMPLETED, CANCELLED)"),
    start_date: Optional[str] = Query(None, description="Filter by start date (format: YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (format: YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Search in campaign title or description")
):
    """
    Get all campaigns for a specific brand with optional filtering.
    """
    logger.info(f"Fetching campaigns for brand profile ID: {brand_id} with filters: status={status}, start_date={start_date}, end_date={end_date}, search={search}")
    
    try:
        if not supabase:
            # Return empty list if no database connection
            logger.warning(f"No Supabase connection, returning empty list")
            return []

        # The brand_id passed here is already the actual brand profile ID, not user ID
        # No need to look it up again
        logger.info(f"Using brand profile ID directly: {brand_id}")

        # Query campaigns using the brand profile ID
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
            logger.info(f"No campaigns found for brand profile ID: {brand_id}")
            return []
            
        campaigns = response.data
        logger.info(f"Found {len(campaigns)} campaigns for brand profile ID: {brand_id}")
        
        # If search parameter is provided, filter results
        if search and search.strip():
            search_lower = search.lower()
            campaigns = [
                c for c in campaigns 
                if search_lower in c.get('title', '').lower() or 
                   search_lower in c.get('description', '').lower()
            ]
            logger.info(f"After search filter, found {len(campaigns)} campaigns")
        
        # Fetch claims (applications) for each campaign - Updated to handle UUID campaign_id
        for campaign in campaigns:
            try:
                # Use campaignclaims table with UUID campaign_id
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
                            creator_response = supabase.table('CreatorProfile').select('*').eq('id', claim['creator_id']).execute()
                            if creator_response.data and len(creator_response.data) > 0:
                                claim['creator'] = creator_response.data[0]
                    except Exception as e:
                        logger.error(f"Error fetching creator details for claim {claim.get('id')}: {str(e)}")
                
            except Exception as e:
                logger.error(f"Error fetching claims for campaign ID {campaign['id']}: {str(e)}")
                # If it's a UUID error, log it but continue
                if "invalid input syntax for type uuid" in str(e).lower():
                    logger.warning(f"UUID format issue for campaign {campaign['id']}")
                campaign['applications'] = []
        
        # Get brand information - use the brand profile ID directly
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
                logger.warning(f"Brand profile not found for ID: {brand_id}")
        except Exception as e:
            logger.error(f"Error fetching brand information for ID {brand_id}: {str(e)}")
        
        return campaigns
        
    except Exception as e:
        logger.error(f"Error fetching campaigns for brand profile ID {brand_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch brand campaigns: {str(e)}")

# Update get_brand_campaign endpoint - keep the user ID lookup for backward compatibility
@app.get("/brand-campaigns/{brand_id}/campaign/{campaign_id}", response_model=dict)
async def get_brand_campaign(
    brand_id: str = Path(..., description="The brand profile ID or user ID"),
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

        # Validate campaign_id is a valid UUID format
        try:
            import uuid
            uuid.UUID(campaign_id)
        except ValueError:
            logger.error(f"Invalid UUID format for campaign_id: {campaign_id}")
            raise HTTPException(status_code=400, detail="Invalid campaign ID format")

        # Try to determine if brand_id is a user ID or brand profile ID
        # First, check if it's a brand profile ID by querying BrandProfile directly
        brand_profile_response = supabase.table('BrandProfile')\
            .select('id')\
            .eq('id', brand_id)\
            .execute()
            
        if brand_profile_response.data and len(brand_profile_response.data) > 0:
            # It's a brand profile ID
            actual_brand_id = brand_id
            logger.info(f"Using brand profile ID directly: {actual_brand_id}")
        else:
            # It might be a user ID, try to look it up
            user_brand_response = supabase.table('BrandProfile')\
                .select('id')\
                .eq('userId', brand_id)\
                .execute()
                
            if not user_brand_response.data or len(user_brand_response.data) == 0:
                logger.warning(f"Brand profile not found for ID: {brand_id}")
                raise HTTPException(status_code=404, detail="Brand profile not found")
                
            actual_brand_id = user_brand_response.data[0]['id']
            logger.info(f"Found brand profile ID: {actual_brand_id} for user ID: {brand_id}")

        # Verify the campaign belongs to the brand using actual brand_id
        try:
            campaign_response = supabase.table('campaigns')\
                .select('*')\
                .eq('id', campaign_id)\
                .eq('brand_id', actual_brand_id)\
                .execute()
        except Exception as db_error:
            logger.error(f"Database error fetching campaign: {str(db_error)}")
            if "invalid input syntax for type uuid" in str(db_error).lower():
                raise HTTPException(status_code=400, detail="Invalid campaign ID format")
            raise HTTPException(status_code=500, detail="Database error fetching campaign")
            
        if not campaign_response.data or len(campaign_response.data) == 0:
            logger.warning(f"Campaign {campaign_id} not found for brand profile {actual_brand_id}")
            raise HTTPException(status_code=404, detail="Campaign not found")
            
        campaign = campaign_response.data[0]
        
        # Fetch all claims/applications for this campaign with UUID handling
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
            if "invalid input syntax for type uuid" in str(e).lower():
                logger.warning(f"UUID format issue fetching applications for campaign {campaign_id}")
            campaign['applications'] = []
        
        return campaign
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error fetching campaign {campaign_id} for brand ID {brand_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch campaign details: {str(e)}")

# Update campaign creation endpoint - keep user ID lookup
@app.post("/brand-campaigns/{brand_id}/add_campaign", response_model=dict)
async def add_campaign(
    brand_id: str = Path(..., description="The user ID of the brand"),
    campaign: CampaignCreate = Body(..., description="Campaign details to create")
):
    """
    Create a new campaign for a specific brand
    """
    try:
        logger.info(f"Creating campaign for user ID {brand_id}: {campaign.title}")
        
        if not supabase:
            logger.warning("Supabase not configured, cannot create campaign")
            raise HTTPException(500, "Database not configured")
        
        # For creation, we expect user ID, so look up the brand profile
        brand_profile_response = supabase.table('BrandProfile')\
            .select('id')\
            .eq('userId', brand_id)\
            .execute()
            
        if not brand_profile_response.data or len(brand_profile_response.data) == 0:
            logger.warning(f"Brand profile not found for user ID: {brand_id}")
            raise HTTPException(status_code=404, detail="Brand profile not found")
            
        actual_brand_id = brand_profile_response.data[0]['id']
        logger.info(f"Found brand profile ID: {actual_brand_id} for user ID: {brand_id}")
        
        # Convert the campaign data to a dictionary for database insertion
        campaign_data = campaign.dict()
        campaign_data['brand_id'] = actual_brand_id  # Use the actual brand profile ID
        campaign_data['created_at'] = datetime.now().isoformat()
        
        # Handle array fields - convert lists to JSON strings for storage
        array_fields = [
            'primary_promotion_objectives',
            'creator_profile_preferences_gender',
            'creator_profile_preference_ethnicity',
            'creator_profile_preference_content_niche',
            'preferred_creator_location',
            'creator_tier_requirement'
        ]
        
        for field in array_fields:
            if field in campaign_data and isinstance(campaign_data[field], list):
                campaign_data[field] = json.dumps(campaign_data[field])
        
        # Remove None values to avoid database issues
        campaign_data = {k: v for k, v in campaign_data.items() if v is not None and v != ''}
        
        logger.info(f"Processed campaign data for database: {campaign_data}")
        logger.info(f"New fields - script_required: {campaign_data.get('script_required')}, product_name: {campaign_data.get('product_name')}, paid_promotion_type: {campaign_data.get('paid_promotion_type')}")
        
        try:
            # Insert the campaign into the database
            response = supabase.table("campaigns").insert(campaign_data).execute()
            logger.info(f"Campaign created successfully: {response}")
            
            if response.data:
                campaign_id = response.data[0]['id']
                
                # Verify the new fields were saved
                verification_response = supabase.table("campaigns").select(
                    "script_required, product_name, product_highlight, product_price, product_sold_number, paid_promotion_type, video_buyout_budget_range, base_fee_budget_range"
                ).eq("id", campaign_id).execute()
                
                if verification_response.data:
                    saved_data = verification_response.data[0]
                    logger.info(f"Verification - new fields saved: {saved_data}")
                
                return {
                    "success": True,
                    "campaign_id": campaign_id,
                    "message": "Campaign created successfully",
                    "saved_fields": saved_data if verification_response.data else None
                }
            else:
                raise HTTPException(500, "Failed to create campaign - no data returned")
                
        except Exception as db_error:
            logger.error(f"Database error creating campaign: {str(db_error)}")
            raise HTTPException(500, f"Database error: {str(db_error)}")
            
    except HTTPException as he:
        logger.error(f"HTTP error creating campaign: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error creating campaign: {str(e)}")
        raise HTTPException(500, f"An unexpected error occurred: {str(e)}")

# Update campaign update endpoint - keep user ID lookup
@app.put("/brand-campaigns/{brand_id}/campaign/{campaign_id}", response_model=dict)
async def update_campaign(
    brand_id: str = Path(..., description="The user ID of the brand"),
    campaign_id: str = Path(..., description="The ID of the campaign"),
    campaign_update: CampaignCreate = Body(..., description="Updated campaign details")
):
    """
    Update an existing campaign for a specific brand
    """
    try:
        logger.info(f"Updating campaign {campaign_id} for user ID {brand_id}")
        
        if not supabase:
            logger.warning("Supabase not configured, cannot update campaign")
            raise HTTPException(500, "Database not configured")
        
        # For updates, we expect user ID, so look up the brand profile
        brand_profile_response = supabase.table('BrandProfile')\
            .select('id')\
            .eq('userId', brand_id)\
            .execute()
            
        if not brand_profile_response.data or len(brand_profile_response.data) == 0:
            logger.warning(f"Brand profile not found for user ID: {brand_id}")
            raise HTTPException(status_code=404, detail="Brand profile not found")
            
        actual_brand_id = brand_profile_response.data[0]['id']
        logger.info(f"Found brand profile ID: {actual_brand_id} for user ID: {brand_id}")
        
        # Verify the campaign exists and belongs to the brand using actual brand_id
        existing_campaign = supabase.table('campaigns')\
            .select('*')\
            .eq('id', campaign_id)\
            .eq('brand_id', actual_brand_id)\
            .execute()
            
        if not existing_campaign.data or len(existing_campaign.data) == 0:
            raise HTTPException(404, "Campaign not found or access denied")
        
        # Convert the campaign data to a dictionary for database update
        campaign_data = campaign_update.dict()
        
        # Remove updated_at since it doesn't exist in the table
        # Handle array fields - convert lists to JSON strings for storage
        array_fields = [
            'primary_promotion_objectives',
            'creator_profile_preferences_gender',
            'creator_profile_preference_ethnicity',
            'creator_profile_preference_content_niche',
            'preferred_creator_location',
            'creator_tier_requirement'
        ]
        
        for field in array_fields:
            if field in campaign_data and isinstance(campaign_data[field], list):
                campaign_data[field] = json.dumps(campaign_data[field])
        
        # Remove None values and brand_id (shouldn't be updated)
        campaign_data = {k: v for k, v in campaign_data.items() if v is not None and v != '' and k != 'brand_id'}
        
        logger.info(f"Updating campaign with data: {campaign_data}")
        
        # Update the campaign in the database
        response = supabase.table("campaigns")\
            .update(campaign_data)\
            .eq('id', campaign_id)\
            .eq('brand_id', actual_brand_id)\
            .execute()
        
        if response.data:
            logger.info(f"Campaign {campaign_id} updated successfully")
            return {
                "success": True,
                "campaign_id": campaign_id,
                "message": "Campaign updated successfully"
            }
        else:
            logger.error(f"No data returned from update operation for campaign {campaign_id}")
            raise HTTPException(500, "Failed to update campaign - no data returned")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating campaign: {str(e)}")
        raise HTTPException(500, f"Failed to update campaign: {str(e)}")

# Update campaign delete endpoint - keep user ID lookup
@app.delete("/brand-campaigns/{brand_id}/campaign/{campaign_id}", response_model=dict)
async def delete_campaign(
    brand_id: str = Path(..., description="The user ID of the brand"),
    campaign_id: str = Path(..., description="The ID of the campaign")
):
    """
    Delete a campaign for a specific brand
    """
    try:
        logger.info(f"Deleting campaign {campaign_id} for user ID {brand_id}")
        
        if not supabase:
            logger.warning("Supabase not configured, cannot delete campaign")
            raise HTTPException(500, "Database not configured")
        
        # For deletes, we expect user ID, so look up the brand profile
        brand_profile_response = supabase.table('BrandProfile')\
            .select('id')\
            .eq('userId', brand_id)\
            .execute()
            
        if not brand_profile_response.data or len(brand_profile_response.data) == 0:
            logger.warning(f"Brand profile not found for user ID: {brand_id}")
            raise HTTPException(status_code=404, detail="Brand profile not found")
            
        actual_brand_id = brand_profile_response.data[0]['id']
        logger.info(f"Found brand profile ID: {actual_brand_id} for user ID: {brand_id}")
        
        # Verify the campaign exists and belongs to the brand using actual brand_id
        existing_campaign = supabase.table('campaigns')\
            .select('id')\
            .eq('id', campaign_id)\
            .eq('brand_id', actual_brand_id)\
            .execute()
            
        if not existing_campaign.data or len(existing_campaign.data) == 0:
            raise HTTPException(404, "Campaign not found or access denied")
        
        # Delete associated campaign claims first (to maintain referential integrity)
        try:
            supabase.table('campaignclaims')\
                .delete()\
                .eq('campaign_id', campaign_id)\
                .execute()
        except Exception as e:
            logger.warning(f"Error deleting campaign claims: {str(e)}")
        
        # Delete the campaign using actual brand_id
        response = supabase.table("campaigns")\
            .delete()\
            .eq('id', campaign_id)\
            .eq('brand_id', actual_brand_id)\
            .execute()
        
        return {
            "success": True,
            "campaign_id": campaign_id,
            "message": "Campaign deleted successfully"
        }
            
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error deleting campaign: {str(e)}")
        raise HTTPException(500, f"Failed to delete campaign: {str(e)}")

# Add import for contact app - fix the import path conflict
try:
    # Save the current module reference to avoid conflicts
    current_app = app
    
    # Try to import the contact app using absolute path
    import importlib.util
    
    # Get the contact app file path
    contact_app_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'contact', 'app.py')
    logger.info(f"Looking for contact app at: {contact_app_path}")
    
    if os.path.exists(contact_app_path):
        # Load the module from the file path
        spec = importlib.util.spec_from_file_location("contact_app_module", contact_app_path)
        contact_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(contact_module)
        
        # Get the contact app instance
        contact_app = contact_module.contact_app
        logger.info("Successfully imported contact app from file path")
    else:
        raise ImportError(f"Contact app file not found at {contact_app_path}")
    
except ImportError as e:
    logger.warning(f"Could not import contact app: {e}")
    
    # Create a minimal contact app as fallback
    from fastapi import FastAPI
    contact_app = FastAPI(title="Contact API Fallback")
    
    @contact_app.get("/health")
    async def contact_fallback_health():
        return {"status": "fallback", "message": "Contact app not available"}
    
    @contact_app.post("/submit")
    async def contact_fallback_submit():
        return {"success": False, "message": "Contact API not available"}

# Mount the contact API under /contact
app.mount("/contact", contact_app)

# Add a redirect endpoint for easier access
@app.get("/contact/")
async def contact_redirect():
    """Redirect to contact API documentation."""
    return {
        "message": "Contact API mounted at /contact/",
        "endpoints": {
            "submit": "/contact/submit",
            "health": "/contact/health", 
            "schema": "/contact/schema"
        }
    }

@app.get("/campaigns/{campaign_id}", response_model=dict)
async def get_campaign_by_id(
    campaign_id: str = Path(..., description="The ID of the campaign")
):
    """
    Get a specific campaign by ID for public viewing
    """
    logger.info(f"Fetching public campaign details for ID: {campaign_id}")
    
    try:
        if not supabase:
            return {"error": "Supabase connection not available"}

        # Validate campaign_id is a valid UUID format
        try:
            import uuid
            uuid.UUID(campaign_id)
        except ValueError:
            logger.error(f"Invalid UUID format for campaign_id: {campaign_id}")
            raise HTTPException(status_code=400, detail="Invalid campaign ID format")

        # Fetch the campaign from database
        try:
            campaign_response = supabase.table('campaigns')\
                .select('*')\
                .eq('id', campaign_id)\
                .eq('is_open', True)\
                .execute()
        except Exception as db_error:
            logger.error(f"Database error fetching campaign: {str(db_error)}")
            if "invalid input syntax for type uuid" in str(db_error).lower():
                raise HTTPException(status_code=400, detail="Invalid campaign ID format")
            raise HTTPException(status_code=500, detail="Database error fetching campaign")
            
        if not campaign_response.data or len(campaign_response.data) == 0:
            logger.warning(f"Campaign {campaign_id} not found or not open")
            raise HTTPException(status_code=404, detail="Campaign not found")
            
        campaign = campaign_response.data[0]
        
        # Get brand information
        try:
            brand_response = supabase.table('BrandProfile')\
                .select('companyName')\
                .eq('id', campaign['brand_id'])\
                .execute()
            
            if brand_response.data and len(brand_response.data) > 0:
                campaign['brand_name'] = brand_response.data[0].get('companyName', 'Unknown Brand')
            else:
                campaign['brand_name'] = 'Unknown Brand'
        except Exception as e:
            logger.error(f"Error fetching brand information: {str(e)}")
            campaign['brand_name'] = 'Unknown Brand'
        
        return campaign
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error fetching campaign {campaign_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch campaign details: {str(e)}")

