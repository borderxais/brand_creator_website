import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/api/auth/[...nextauth]/auth.config';

const PYTHON_API_URL = process.env.CAMPAIGNS_API_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const platform = searchParams.get('platform');
    const region = searchParams.get('region');
    const reward_model = searchParams.get('reward_model');
    const limit = searchParams.get('limit');

    // Build Python API URL with query parameters
    let pythonApiUrl = `${PYTHON_API_URL}/entertainment-live/`;
    const queryParams = new URLSearchParams();
    
    if (search) queryParams.append('search', search);
    if (platform) queryParams.append('platform', platform);
    if (region) queryParams.append('region', region);
    if (reward_model) queryParams.append('reward_model', reward_model);
    if (limit) queryParams.append('limit', limit);
    
    if (queryParams.toString()) {
      pythonApiUrl += `?${queryParams.toString()}`;
    }
    
    console.log('Fetching entertainment live missions from Python API:', pythonApiUrl);
    
    const response = await fetch(pythonApiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      console.error(`Python API returned status ${response.status}`);
      return NextResponse.json(
        { 
          error: `API Error: ${response.status}`,
          missions: [] 
        }, 
        { status: response.status === 500 ? 200 : response.status }
      );
    }
    
    const missions = await response.json();
    console.log('Python API entertainment live missions:', Array.isArray(missions) ? missions.length : 'not an array');
    
    return NextResponse.json(missions);
  } catch (error) {
    console.error('Error fetching entertainment live missions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch entertainment live missions',
      missions: [] 
    }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'BRAND') {
      return NextResponse.json({ error: 'Unauthorized - Brand access only' }, { status: 403 });
    }

    const body = await request.json();
    
    // Forward the request to the Python API
    const pythonApiUrl = `${PYTHON_API_URL}/entertainment-live/brand-missions/${session.user.id}/add_mission`;
    
    console.log('Creating entertainment live mission via Python API:', pythonApiUrl);
    
    const response = await fetch(pythonApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`Python API returned status ${response.status} for POST`);
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ 
        error: 'Failed to create entertainment live mission', 
        details: errorData 
      }, { status: response.status });
    }

    const mission = await response.json();
    return NextResponse.json(mission);
    
  } catch (error) {
    console.error('Error creating entertainment live mission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
