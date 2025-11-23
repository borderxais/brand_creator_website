import { prisma } from '@/lib/prisma';

interface TikTokCreatorResponse {
  code: number;
  message: string;
  request_id: string;
  data: {
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

// Helper for converting to proper numeric types
const safeFloat = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? null : parsed;
};

// Helper for handling text fields
const safeText = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  return String(value);
};

export async function fetchTikTokCreatorData(access_token: string, tto_tcm_account_id: string, handle_name: string) {
  try {
    const url = "https://business-api.tiktok.com/open_api/v1.3/tto/tcm/creator/public/";
    
    const params = new URLSearchParams({
      tto_tcm_account_id,
      handle_name
    });
    
    const response = await fetch(`${url}?${params.toString()}`, {
      headers: {
        "Access-Token": access_token
      }
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    return await response.json() as TikTokCreatorResponse;
  } catch (error) {
    console.error('Error fetching TikTok creator data:', error);
    // Return a structured error response
    return {
      code: -1,
      message: error instanceof Error ? error.message : 'Unknown error',
      request_id: 'error',
      data: null
    } as any;
  }
}

export async function saveCreatorData(creatorData: TikTokCreatorResponse["data"]) {
  try {
    // Debug complete incoming data structure
    console.log("==================== INCOMING CREATOR DATA ====================");
    console.log(JSON.stringify(creatorData, null, 2));
    
    // Debug data types
    console.log("==================== DATA TYPES ====================");
    console.log({
      bio: typeof creatorData.bio,
      content_labels: typeof creatorData.content_labels,
      creator_id: typeof creatorData.creator_id,
      creator_price: typeof creatorData.creator_price,
      currency: typeof creatorData.currency,
      display_name: typeof creatorData.display_name,
      engagement_rate: typeof creatorData.engagement_rate,
      followers_count: typeof creatorData.followers_count,
      following_count: typeof creatorData.following_count,
      handle_name: typeof creatorData.handle_name,
      industry_labels: typeof creatorData.industry_labels,
      likes_count: typeof creatorData.likes_count,
      median_views: typeof creatorData.median_views,
      profile_image: typeof creatorData.profile_image,
      videos_count: typeof creatorData.videos_count
    });
    
    // Extract content label name and industry label name
    const contentLabelName = creatorData.content_labels?.length > 0 
      ? safeText(creatorData.content_labels[0].label_name) 
      : null;
    
    const industryLabelName = creatorData.industry_labels?.length > 0
      ? safeText(creatorData.industry_labels[0].label_name)
      : null;
    
    // Prepare the handle name - our unique key
    const handleName = safeText(creatorData.handle_name) || '';
    
    console.log("Attempting to save creator data for:", handleName);
    
    // Raw numeric values debug
    console.log("==================== NUMERIC VALUES (RAW) ====================");
    console.log({
      followers: creatorData.followers_count,
      following: creatorData.following_count,
      likes: creatorData.likes_count,
      views: creatorData.median_views,
      videos: creatorData.videos_count,
      engagement: creatorData.engagement_rate,
      creator_price: creatorData.creator_price
    });
    
    // Let's try a simplified insertion with fewer fields first
    const minimalData = {
      creator_handle_name: handleName,
      display_name: safeText(creatorData.display_name),
      bio: safeText(creatorData.bio),
      content_label_name: contentLabelName,
      industry_label_name: industryLabelName,
      // Fix: Directly use number values when available instead of processing through safeFloat
      follower_count: typeof creatorData.followers_count === 'number' ? Math.round(creatorData.followers_count) : null,
      creator_id: safeText(creatorData.creator_id),
      creator_price: typeof creatorData.creator_price === 'number' ? Math.round(creatorData.creator_price) : null,
      currency: safeText(creatorData.currency),
      following_count: typeof creatorData.following_count === 'number' ? Math.round(creatorData.following_count) : null,
      like_count: typeof creatorData.likes_count === 'number' ? Math.round(creatorData.likes_count) : null,
      median_views: typeof creatorData.median_views === 'number' ? Math.round(creatorData.median_views) : null,
      profile_image: safeText(creatorData.profile_image),
      videos_count: typeof creatorData.videos_count === 'number' ? Math.round(creatorData.videos_count) : null,
      engagement_rate: typeof creatorData.engagement_rate === 'number' ? creatorData.engagement_rate : null
    };
    
    // Debug processed data before saving
    console.log("==================== PROCESSED DATA (TO BE SAVED) ====================");
    console.log(JSON.stringify(minimalData, null, 2));
    
    // Try finding the creator first
    const existingCreator = await prisma.findCreator.findFirst({
      where: { creator_handle_name: handleName }
    });
    
    let result;
    
    // Use Prisma's type-safe operations instead of raw SQL
    if (existingCreator) {
      console.log(`Found existing creator: ${handleName}`);
      
      result = await prisma.findCreator.update({
        where: { id: existingCreator.id },
        data: minimalData
      });
      
      console.log("Updated creator:", result);
    } else {
      console.log(`Creating new creator: ${handleName}`);
      
      result = await prisma.findCreator.create({
        data: minimalData
      });
      
      console.log("Created creator:", result);
    }
    
    return result;
  } catch (error) {
    console.error('Error saving creator data to database:', error);
    console.error('Error details:', error instanceof Error ? error.stack : String(error));
    
    // Try creating a very minimal record as a last resort
    try {
      console.log("Attempting minimal insertion as fallback");
      
      const handleName = safeText(creatorData.handle_name) || '';
      const displayName = safeText(creatorData.display_name) || handleName;
      
      const existingMinimal = await prisma.findCreator.findFirst({
        where: { creator_handle_name: handleName }
      });
      
      if (!existingMinimal) {
        // Use Prisma create instead of raw SQL
        await prisma.findCreator.create({
          data: {
            creator_handle_name: handleName,
            display_name: displayName
          }
        });
        
        console.log("Created minimal record for:", handleName);
      }
      
      return await prisma.findCreator.findFirst({
        where: { creator_handle_name: handleName }
      });
    } catch (fallbackError) {
      console.error("Even fallback insertion failed:", fallbackError);
      throw new Error('Failed to save creator data to database');
    }
  }
}
