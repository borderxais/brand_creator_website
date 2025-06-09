import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/api/auth/[...nextauth]/auth.config';

export async function POST(request: NextRequest) {
  console.log("Campaign application API route called");
  try {
    // Check authentication 
    const session = await getServerSession(authConfig);
    console.log("Session in apply API:", session?.user);
    
    if (!session || !session.user) {
      console.error("Authentication required");
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CREATOR') {
      console.error("Only creators can apply");
      return NextResponse.json(
        { error: 'Only creators can apply to campaigns' },
        { status: 403 }
      );
    }
    
    // Get user ID directly from session
    const userId = session.user.id;
    
    console.log("User ID in API:", userId);
    if (!userId) {
      console.error("User ID not found");
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const data = await request.json();
    console.log("Request data:", data);
    const { campaignId, sampleText, sampleVideoUrl } = data;
    
    if (!campaignId) {
      console.error("Campaign ID is required");
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }
    
    // Check if creator has already applied to this campaign
    const apiUrl = process.env.CAMPAIGNS_API_URL || 'http://localhost:5000';
    
    // Create new campaign claim with user ID
    console.log("Creating new campaign claim with user ID:", userId);
    
    const createResponse = await fetch(`${apiUrl}/campaign-claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        user_id: userId,
        sample_text: sampleText || null,
        sample_video_url: sampleVideoUrl || null,
      }),
    });
    
    console.log("Create response status:", createResponse.status);
    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error("Error creating campaign claim:", errorData);
      throw new Error(errorData.detail || 'Failed to apply for campaign');
    }
    
    const responseData = await createResponse.json();
    console.log("Create response data:", responseData);
    
    return NextResponse.json({
      status: 'success',
      message: 'Application submitted successfully!',
      claimId: responseData.claim_id
    });
  } catch (error: any) {
    console.error('Error applying for campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to apply for campaign' },
      { status: 500 }
    );
  }
}
