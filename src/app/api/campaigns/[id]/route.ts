import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.CAMPAIGNS_API_URL || 'http://localhost:5000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;

    console.log(`Fetching campaign details for ID: ${campaignId}`);

    // Fetch from Python API
    const response = await fetch(`${PYTHON_API_URL}/campaigns/${campaignId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(
        `Python API returned status ${response.status} for campaign ${campaignId}`
      );

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const error = await response.json();
          return NextResponse.json(
            { error: error.detail || 'Campaign not found' },
            
            { status: response.status }
          );
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }
      } else {
        // Response is not JSON, likely HTML error page
        const errorText = await response.text();
        console.error('Non-JSON error response:', errorText.substring(0, 200));
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
    }

    try {
      const campaign = await response.json();
      return NextResponse.json(campaign);
    } catch (parseError) {
      console.error('Error parsing successful response JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid response format from server' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
