import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Use the same URL pattern as the working route
const PYTHON_API_URL = process.env.CAMPAIGNS_API_URL || 'http://localhost:5000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'BRAND') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before accessing properties
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;
    const brandId = session.user.id;

    // Use the same URL structure as the working route
    const response = await fetch(`${PYTHON_API_URL}/campaigns/brand/${brandId}/campaign/${campaignId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout like the working route
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      console.error(`Python API returned status ${response.status} for campaign ${campaignId}`);
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const error = await response.json();
          return NextResponse.json({ error: error.detail || 'Failed to fetch campaign' }, { status: response.status });
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          return NextResponse.json({ error: 'Failed to fetch campaign - invalid response format' }, { status: response.status });
        }
      } else {
        // Response is not JSON, likely HTML error page
        const errorText = await response.text();
        console.error('Non-JSON error response:', errorText.substring(0, 200));
        return NextResponse.json({ error: 'Campaign not found or server error' }, { status: 404 });
      }
    }

    try {
      const campaign = await response.json();
      return NextResponse.json(campaign);
    } catch (parseError) {
      console.error('Error parsing successful response JSON:', parseError);
      return NextResponse.json({ error: 'Invalid response format from server' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'BRAND') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before accessing properties
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;
    const brandId = session.user.id;
    const body = await request.json();

    const followerRequirement = body.follower_requirement || body.followerRequirement;
    const orderRequirement = body.order_requirement || body.orderRequirement;
    const combinedTier =
      body.creator_tier_requirement && (body.creator_tier_requirement as any[]).length
        ? body.creator_tier_requirement
        : (followerRequirement || orderRequirement)
          ? [[followerRequirement, orderRequirement].filter(Boolean).join('; ')]
          : undefined;

    const {
      follower_requirement: _formFollowerRequirement,
      followerRequirement: _followerRequirement,
      order_requirement: _formOrderRequirement,
      orderRequirement: _orderRequirement,
      ...rest
    } = body;
    const sanitizedBody = {
      ...rest,
      brand_id: brandId,
      ...(combinedTier !== undefined ? { creator_tier_requirement: combinedTier } : {})
    };

    console.log('Updating campaign:', campaignId, 'for brand:', brandId);

    const response = await fetch(`${PYTHON_API_URL}/campaigns/brand/${brandId}/campaign/${campaignId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitizedBody),
      signal: AbortSignal.timeout(10000) // 10 second timeout for updates
    });

    if (!response.ok) {
      console.error(`Python API returned status ${response.status} for PUT`);
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const error = await response.json();
          return NextResponse.json({ error: error.detail || 'Failed to update campaign' }, { status: response.status });
        } catch (parseError) {
          console.error('Error parsing JSON error response:', parseError);
          return NextResponse.json({ error: 'Failed to update campaign - invalid response format' }, { status: response.status });
        }
      } else {
        const errorText = await response.text();
        console.error('Non-JSON error response:', errorText.substring(0, 200));
        return NextResponse.json({ error: 'Failed to update campaign - server error' }, { status: response.status });
      }
    }

    try {
      const result = await response.json();
      return NextResponse.json(result);
    } catch (parseError) {
      console.error('Error parsing successful update response JSON:', parseError);
      return NextResponse.json({ error: 'Invalid response format from server' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'BRAND') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before accessing properties
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;
    const brandId = session.user.id;

    console.log('Deleting campaign:', campaignId, 'for brand:', brandId);

    const response = await fetch(`${PYTHON_API_URL}/campaigns/brand/${brandId}/campaign/${campaignId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout for deletes
    });

    if (!response.ok) {
      console.error(`Python API returned status ${response.status} for DELETE`);
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const error = await response.json();
          return NextResponse.json({ error: error.detail || 'Failed to delete campaign' }, { status: response.status });
        } catch (parseError) {
          console.error('Error parsing JSON error response:', parseError);
          return NextResponse.json({ error: 'Failed to delete campaign - invalid response format' }, { status: response.status });
        }
      } else {
        const errorText = await response.text();
        console.error('Non-JSON error response:', errorText.substring(0, 200));
        return NextResponse.json({ error: 'Failed to delete campaign - server error' }, { status: response.status });
      }
    }

    try {
      const result = await response.json();
      return NextResponse.json(result);
    } catch (parseError) {
      console.error('Error parsing successful delete response JSON:', parseError);
      return NextResponse.json({ error: 'Invalid response format from server' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
