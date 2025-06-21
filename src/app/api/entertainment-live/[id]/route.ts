import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.CAMPAIGNS_API_URL || 'http://localhost:5000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before accessing properties
    const resolvedParams = await params;
    const missionId = resolvedParams.id;

    console.log('Fetching entertainment live mission from Python API:', missionId);
    
    const response = await fetch(`${PYTHON_API_URL}/entertainment-live/${missionId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      console.error(`Python API returned status ${response.status} for mission ${missionId}`);
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Mission not found' }, 
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: `API Error: ${response.status}` }, 
        { status: response.status }
      );
    }
    
    const mission = await response.json();
    console.log('Python API entertainment live mission:', mission);
    
    return NextResponse.json(mission);
  } catch (error) {
    console.error('Error fetching entertainment live mission:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch entertainment live mission'
    }, { status: 500 });
  }
}
