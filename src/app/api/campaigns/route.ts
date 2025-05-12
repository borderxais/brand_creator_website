import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get API URL from environment variable or use default
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // Determine if we're calling the main API or a utility endpoint
    const path = searchParams.get('path') || '/';
    
    // Create the URL to forward to the FastAPI app
    const url = new URL(`${apiBaseUrl}${path}`);
    
    // Forward all query parameters except 'path'
    searchParams.forEach((value, key) => {
      if (key !== 'path') {
        url.searchParams.append(key, value);
      }
    });
    
    console.log(`Forwarding request to: ${url.toString()}`);
    
    // Make the request to the FastAPI app
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    
    // Even if status is not OK, we want to return the data as it may contain error details
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
