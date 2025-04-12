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
    
    // Let's try a simplified insertion with fewer fields first
    const minimalData = {
      creator_handle_name: handleName,
      display_name: safeText(creatorData.display_name),
      bio: safeText(creatorData.bio),
      content_label_name: contentLabelName,
      industry_label_name: industryLabelName,
      follower_count: safeFloat(creatorData.followers_count) !== null ? Math.round(safeFloat(creatorData.followers_count)!) : null,
      creator_id: safeText(creatorData.creator_id), // Now properly included as a string
      creator_price: safeFloat(creatorData.creator_price) !== null ? Math.round(safeFloat(creatorData.creator_price)!) : null,
      currency: safeText(creatorData.currency),
      following_count: safeFloat(creatorData.following_count) !== null ? Math.round(safeFloat(creatorData.following_count)!) : null,
      like_count: safeFloat(creatorData.likes_count) !== null ? Math.round(safeFloat(creatorData.likes_count)!) : null,
      median_views: safeFloat(creatorData.median_views) !== null ? Math.round(safeFloat(creatorData.median_views)!) : null,
      profile_image: safeText(creatorData.profile_image),
      videos_count: safeFloat(creatorData.videos_count) !== null ? Math.round(safeFloat(creatorData.videos_count)!) : null,
      engagement_rate: safeFloat(creatorData.engagement_rate)
    };
    
    // For debugging
    console.log("Using minimal data set with creator_id");
    
    // Try finding the creator first
    const existingCreator = await prisma.findCreator.findUnique({
      where: { creator_handle_name: handleName }
    });
    
    let result;
    
    // Use a direct SQL approach to avoid Prisma type conversion issues
    if (existingCreator) {
      console.log(`Found existing creator: ${handleName}`);
      
      // Update existing creator with raw SQL
      await prisma.$executeRaw`
        UPDATE "FindCreator" 
        SET 
          "display_name" = ${minimalData.display_name},
          "bio" = ${minimalData.bio},
          "content_label_name" = ${minimalData.content_label_name},
          "industry_label_name" = ${minimalData.industry_label_name},
          "follower_count" = ${minimalData.follower_count},
          "creator_id" = ${minimalData.creator_id},
          "creator_price" = ${minimalData.creator_price},
          "currency" = ${minimalData.currency},
          "following_count" = ${minimalData.following_count},
          "like_count" = ${minimalData.like_count},
          "median_views" = ${minimalData.median_views},
          "profile_image" = ${minimalData.profile_image},
          "videos_count" = ${minimalData.videos_count},
          "engagement_rate" = ${minimalData.engagement_rate}
        WHERE "id" = ${existingCreator.id}
      `;
      
      // Fetch updated record
      result = await prisma.findCreator.findUnique({
        where: { id: existingCreator.id }
      });
      
      console.log("Updated creator with SQL:", result);
    } else {
      console.log(`Creating new creator: ${handleName}`);
      
      // Insert with raw SQL - now including creator_id
      await prisma.$executeRaw`
        INSERT INTO "FindCreator" (
          "created_at", "creator_handle_name", "display_name", "bio",
          "content_label_name", "industry_label_name", "follower_count",
          "creator_id", "creator_price", "currency", "following_count", "like_count", 
          "median_views", "profile_image", "videos_count", "engagement_rate"
        ) VALUES (
          NOW(), ${minimalData.creator_handle_name}, ${minimalData.display_name}, ${minimalData.bio},
          ${minimalData.content_label_name}, ${minimalData.industry_label_name}, ${minimalData.follower_count},
          ${minimalData.creator_id}, ${minimalData.creator_price}, ${minimalData.currency}, ${minimalData.following_count}, ${minimalData.like_count},
          ${minimalData.median_views}, ${minimalData.profile_image}, ${minimalData.videos_count}, ${minimalData.engagement_rate}
        )
      `;
      
      // Fetch the created record
      result = await prisma.findCreator.findUnique({
        where: { creator_handle_name: handleName }
      });
      
      console.log("Created creator with SQL:", result);
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
      
      const existingMinimal = await prisma.findCreator.findUnique({
        where: { creator_handle_name: handleName }
      });
      
      if (!existingMinimal) {
        // Only create if doesn't exist, with absolute minimal fields
        await prisma.$executeRaw`
          INSERT INTO "FindCreator" (
            "created_at", "creator_handle_name", "display_name"
          ) VALUES (
            NOW(), ${handleName}, ${displayName}
          )
        `;
        
        console.log("Created minimal record for:", handleName);
      }
      
      return await prisma.findCreator.findUnique({
        where: { creator_handle_name: handleName }
      });
    } catch (fallbackError) {
      console.error("Even fallback insertion failed:", fallbackError);
      throw new Error('Failed to save creator data to database');
    }
  }
}
