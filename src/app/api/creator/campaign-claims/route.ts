import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/api/auth/[...nextauth]/auth.config';

export async function GET(request: NextRequest) {
  try {
    console.log("API route /api/creator/campaign-claims called");
    // Check authentication
    const session = await getServerSession(authConfig);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CREATOR') {
      return NextResponse.json(
        { error: 'Only creators can view their campaign claims' },
        { status: 403 }
      );
    }
    
    // Get creator ID from session
    const user = session.user as any;
    const userId = user.id;
    
    console.log("Creator userId from session:", userId);
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 404 }
      );
    }
    
    // Get limit from query params or use default
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    
    // Forward to the FastAPI backend - we'll pass the userId and let the FastAPI backend
    // handle looking up the actual creator_id from CreatorProfile
    const apiUrl = process.env.CAMPAIGNS_API_URL || 'http://localhost:5000';
    console.log(`Forwarding request to: ${apiUrl}/creator/${userId}/campaign-claims?limit=${limit}`);
    
    const response = await fetch(`${apiUrl}/creator/${userId}/campaign-claims?limit=${limit}`);
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error from backend:", errorData);
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch campaign claims' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Retrieved ${data.length} campaign claims`);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching campaign claims:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
