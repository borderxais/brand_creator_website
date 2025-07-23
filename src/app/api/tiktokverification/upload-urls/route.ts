import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log("=== GENERATING UPLOAD URLS ===");
    
    const { id_number, files } = await request.json();
    
    if (!id_number || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'Missing id_number or files array' },
        { status: 400 }
      );
    }

    console.log("Requesting upload URLs for:", { id_number, files });

    // Forward request to FastAPI backend
    const baseUrl = process.env.CAMPAIGNS_API_URL || process.env.PYTHON_API_URL || 'http://127.0.0.1:5000';
    const apiUrl = `${baseUrl}/tiktokverification/upload-urls`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_number, files }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate upload URLs' },
        { status: response.status }
      );
    }

    const uploadUrls = await response.json();
    console.log("Generated upload URLs successfully");
    
    return NextResponse.json(uploadUrls);
  } catch (error) {
    console.error('Upload URLs generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
