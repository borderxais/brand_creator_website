import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/api/auth/[...nextauth]/auth.config';
import { prisma } from '@/lib/prisma';

// Define the Python API URL
const PYTHON_API_URL = process.env.CAMPAIGNS_API_URL || 'http://localhost:5000';

export async function PATCH(request: Request) {
  try {
    // Extract ID from URL path segments
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const applicationId = pathSegments[pathSegments.length - 2]; // Get the ID from URL
    
    console.log(`Processing application ID from URL: ${applicationId}`);
    
    if (!applicationId) {
      return NextResponse.json({ error: 'Missing application ID' }, { status: 400 });
    }

    // Get the authenticated user's session
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user and ensure they are a brand
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'BRAND') {
      return NextResponse.json({ error: 'Unauthorized - Brand access only' }, { status: 403 });
    }

    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!brandProfile) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 403 });
    }

    // Parse the request body to get the status
    const { status } = await request.json();

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }
    
    // Update application status via Python API
    const pythonApiUrl = `${PYTHON_API_URL}/campaign-claims/${applicationId}/status`;
    
    console.log(`Updating application ${applicationId} status to ${status}`);
    
    const response = await fetch(pythonApiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        status,
        brand_id: brandProfile.id
      }),
    });
    
    if (!response.ok) {
      console.error(`Python API returned status ${response.status}`);
      return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 });
    }
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
