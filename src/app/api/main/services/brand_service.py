import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import HTTPException
from ..database.connection import supabase
from ..utils.validators import validate_uuid

logger = logging.getLogger(__name__)

class BrandService:

    @staticmethod
    async def get_brand_campaigns(
        brand_id: str,
        status: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get all campaigns for a specific brand with optional filtering."""
        logger.info(f"Fetching campaigns for brand profile ID: {brand_id} with filters: status={status}, start_date={start_date}, end_date={end_date}, search={search}")
        
        try:
            if not supabase:
                logger.warning(f"No Supabase connection, returning empty list")
                return []

            logger.info(f"Using brand profile ID directly: {brand_id}")

            query = supabase.table('campaigns').select('*').eq('brand_id', brand_id)
            
            if status:
                query = query.eq('status', status.upper())
            
            if start_date:
                try:
                    parsed_date = datetime.strptime(start_date, "%Y-%m-%d").isoformat()
                    query = query.gte('start_date', parsed_date)
                except ValueError:
                    logger.warning(f"Invalid start_date format: {start_date}")
            
            if end_date:
                try:
                    parsed_date = datetime.strptime(end_date, "%Y-%m-%d").isoformat()
                    query = query.lte('end_date', parsed_date)
                except ValueError:
                    logger.warning(f"Invalid end_date format: {end_date}")
                    
            response = query.execute()
            
            if not response.data:
                logger.info(f"No campaigns found for brand profile ID: {brand_id}")
                return []
                
            campaigns = response.data
            logger.info(f"Found {len(campaigns)} campaigns for brand profile ID: {brand_id}")
            
            if search and search.strip():
                search_lower = search.lower()
                campaigns = [
                    c for c in campaigns 
                    if search_lower in c.get('title', '').lower() or 
                       search_lower in c.get('description', '').lower()
                ]
                logger.info(f"After search filter, found {len(campaigns)} campaigns")
            
            for campaign in campaigns:
                try:
                    claims_response = supabase.table('campaignclaims')\
                        .select('*')\
                        .eq('campaign_id', campaign['id'])\
                        .execute()
                    
                    campaign['applications'] = claims_response.data or []
                    logger.info(f"Found {len(campaign['applications'])} claims/applications for campaign ID: {campaign['id']}")
                    
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
                    if "invalid input syntax for type uuid" in str(e).lower():
                        logger.warning(f"UUID format issue for campaign {campaign['id']}")
                    campaign['applications'] = []
            
            try:
                brand_response = supabase.table('BrandProfile')\
                    .select('*')\
                    .eq('id', brand_id)\
                    .execute()
                
                if brand_response.data and len(brand_response.data) > 0:
                    brand_info = brand_response.data[0]
                    
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

    @staticmethod
    async def get_brand_campaign(brand_id: str, campaign_id: str) -> Dict[str, Any]:
        """Get a specific campaign by ID with all its applications."""
        logger.info(f"Fetching campaign {campaign_id} for brand ID: {brand_id}")
        
        try:
            if not supabase:
                return {"error": "Supabase connection not available"}

            if not validate_uuid(campaign_id):
                logger.error(f"Invalid UUID format for campaign_id: {campaign_id}")
                raise HTTPException(status_code=400, detail="Invalid campaign ID format")

            brand_profile_response = supabase.table('BrandProfile')\
                .select('id')\
                .eq('id', brand_id)\
                .execute()
                
            if brand_profile_response.data and len(brand_profile_response.data) > 0:
                actual_brand_id = brand_id
            else:
                user_brand_response = supabase.table('BrandProfile')\
                    .select('id')\
                    .eq('userId', brand_id)\
                    .execute()
                    
                if not user_brand_response.data or len(user_brand_response.data) == 0:
                    logger.warning(f"Brand profile not found for ID: {brand_id}")
                    raise HTTPException(status_code=404, detail="Brand profile not found")
                    
                actual_brand_id = user_brand_response.data[0]['id']

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
            
            try:
                claims_response = supabase.table('campaignclaims')\
                    .select('*')\
                    .eq('campaign_id', campaign_id)\
                    .execute()
                    
                applications = claims_response.data or []
                campaign['applications'] = applications
                
                for application in campaign['applications']:
                    try:
                        if application.get('creator_id'):
                            creator_response = supabase.table('CreatorProfile')\
                                .select('*')\
                                .eq('id', application['creator_id'])\
                                .execute()
                            
                            if creator_response.data and len(creator_response.data) > 0:
                                creator_data = creator_response.data[0]
                                application['creator'] = creator_data
                                
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
                                            application['creator']['user'] = user_data
                                    except Exception as user_error:
                                        logger.error(f"Error fetching user data: {str(user_error)}")
                                        
                    except Exception as e:
                        logger.error(f"Error fetching creator details: {str(e)}")
                        application['creator'] = {'id': application['creator_id']}
                
            except Exception as e:
                logger.error(f"Error fetching applications: {str(e)}")
                campaign['applications'] = []
            
            return campaign
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching campaign {campaign_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch campaign details: {str(e)}")