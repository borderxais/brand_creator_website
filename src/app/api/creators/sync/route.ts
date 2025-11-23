import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchTikTokCreatorData, saveCreatorData } from '../tiktok-service';

// TikTok API credentials - should be moved to environment variables
const TIK_TOK_ACCESS_TOKEN = "501451aac8e52709146ce1791efe81b15c26cbfe";
const TIK_TOK_TCM_ACCOUNT_ID = "7491077961832202247";

export async function GET(request: NextRequest) {
  try {
    // Get specific handle name from query params or sync all creators
    const searchParams = request.nextUrl.searchParams;
    const handleName = searchParams.get('handle_name');
    
    if (handleName) {
      // Sync just one creator
      const tikTokData = await fetchTikTokCreatorData(
        TIK_TOK_ACCESS_TOKEN,
        TIK_TOK_TCM_ACCOUNT_ID,
        handleName
      );
      
      if (tikTokData.code !== 0 || !tikTokData.data) {
        return NextResponse.json(
          { error: `TikTok API error: ${tikTokData.message}` }, 
          { status: 400 }
        );
      }
      
      try {
        const savedCreator = await saveCreatorData(tikTokData.data);
        return NextResponse.json({ success: true, creator: savedCreator });
      } catch (saveError) {
        console.error("Failed to save creator:", saveError);
        return NextResponse.json(
          { error: `Failed to save creator: ${saveError}` },
          { status: 500 }
        );
      }
    } 
    else {
      // Sync all creators - get all user handle names from the database
      const users = await prisma.user.findMany({
        where: {
          creatorHandleName: {
            not: ''
          }
        },
        select: {
          creatorHandleName: true
        }
      });
      
      const results = [];
      const errors = [];
      
      // Process each creator sequentially
      for (const user of users) {
        if (!user.creatorHandleName) continue;
        
        try {
          const tikTokData = await fetchTikTokCreatorData(
            TIK_TOK_ACCESS_TOKEN,
            TIK_TOK_TCM_ACCOUNT_ID,
            user.creatorHandleName
          );
          
          if (tikTokData.code === 0 && tikTokData.data) {
            const savedCreator = await saveCreatorData(tikTokData.data);
            results.push(savedCreator);
          } else {
            errors.push({
              handle_name: user.creatorHandleName,
              error: tikTokData.message
            });
          }
        } catch (error) {
          errors.push({
            handle_name: user.creatorHandleName,
            error: 'Failed to fetch or save creator data'
          });
        }
      }
      
      // If no users with handle names found, sync some default creators
      if (users.length === 0) {
        const defaultHandles = ["noahandlori", "charlidamelio", "bellapoarch"];
        
        for (const handle of defaultHandles) {
          try {
            const tikTokData = await fetchTikTokCreatorData(
              TIK_TOK_ACCESS_TOKEN,
              TIK_TOK_TCM_ACCOUNT_ID,
              handle
            );
            
            if (tikTokData.code === 0 && tikTokData.data) {
              const savedCreator = await saveCreatorData(tikTokData.data);
              results.push(savedCreator);
            } else {
              errors.push({
                handle_name: handle,
                error: tikTokData.message
              });
            }
          } catch (error) {
            errors.push({
              handle_name: handle,
              error: 'Failed to fetch or save creator data'
            });
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        synced: results.length,
        errors: errors.length,
        errorDetails: errors
      });
    }
  } catch (error) {
    console.error('Error in creator sync route:', error);
    return NextResponse.json(
      { error: 'Failed to sync creator data' },
      { status: 500 }
    );
  }
}
