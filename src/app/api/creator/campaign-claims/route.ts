import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/api/auth/[...nextauth]/auth.config';

export async function GET(request: NextRequest) {
  try {
    console.log("Getting creator campaign claims...");
    
    // Check authentication
    const session = await getServerSession(authConfig);
    if (!session || !session.user) {
      console.error("Authentication required");
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CREATOR') {
      console.error("Only creators can view campaign claims");
      return NextResponse.json(
        { error: 'Only creators can view campaign claims' },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    console.log("Fetching claims for user ID:", userId);

    // Call the Python API
    const apiUrl = process.env.CAMPAIGNS_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/creator/${userId}/campaign-claims`);

    if (!response.ok) {
      console.error("Failed to fetch from Python API:", response.status);
      throw new Error('Failed to fetch campaign claims');
    }

    const data = await response.json();
    console.log(`Retrieved ${data.length} campaign claims from API`);
    
    // Log the first item to verify all fields are present
    if (data.length > 0) {
      console.log("Sample claim data fields:", Object.keys(data[0]));
      console.log("Sample product_photo:", data[0].product_photo);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching creator campaign claims:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaign claims' },
      { status: 500 }
    );
  }
}
