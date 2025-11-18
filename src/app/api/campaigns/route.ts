import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.CAMPAIGNS_API_URL || 'http://0.0.0.0:5000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build query string from search params
    const queryString = searchParams.toString();
    
    // Forward to the correct campaigns endpoint with /campaigns prefix
    const apiUrl = `${PYTHON_API_URL}/campaigns/${queryString ? `?${queryString}` : ''}`;
    
    console.log('Forwarding request to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(`Python API returned status ${response.status}`);
      return NextResponse.json(
        { error: `API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const campaigns = await response.json();
    console.log('Retrieved campaigns:', Array.isArray(campaigns) ? campaigns.length : 'not an array');
    
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
