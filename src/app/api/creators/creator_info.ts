import axios from 'axios';

interface TikTokCreatorResponse {
  code: number;
  message: string;
  request_id: string;
  data?: {
    bio: string;
    content_labels: { label_id: string; label_name: string }[];
    creator_id: string;
    creator_price: number;
    currency: string;
    display_name: string;
    engagement_rate: number;
    followers_count: number;
    following_count: number;
    handle_name: string;
    industry_labels: { label_id: string; label_name: string }[];
    likes_count: number;
    median_views: number;
    profile_image: string;
    videos_count: number;
  };
}

/**
 * Retrieves the public insights for a TikTok creator using the v1.3 API.
 * 
 * @param access_token The access token authorized by TikTok Creator Marketplace
 * @param tto_tcm_account_id Your TikTok Creator Marketplace account ID (string in v1.3)
 * @param handle_name The handle name of the creator you want to search
 * @returns JSON response from the API
 */
export async function getPublicAccountInsights(
  access_token: string, 
  tto_tcm_account_id: string, 
  handle_name: string
): Promise<TikTokCreatorResponse> {
  try {
    const url = "https://business-api.tiktok.com/open_api/v1.3/tto/tcm/creator/public/";
    
    const headers = {
      "Access-Token": access_token
    };
    
    const params = {
      tto_tcm_account_id,
      handle_name
    };
    
    const response = await axios.get<TikTokCreatorResponse>(url, { 
      headers, 
      params 
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('TikTok API error:', error.response.data);
      return {
        code: error.response.status,
        message: `API Error: ${error.message}`,
        request_id: 'error'
      };
    }
    
    console.error('Error fetching TikTok creator data:', error);
    return {
      code: 500,
      message: 'Internal server error while fetching TikTok creator data',
      request_id: 'error'
    };
  }
}
