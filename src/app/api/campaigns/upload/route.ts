import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    
    console.log("Upload request received:", Array.from(formData.entries()).map(([key, value]) => {
      if (value instanceof File) {
        return `${key}: File (${value.name}, ${value.size} bytes)`;
      }
      return `${key}: ${String(value)}`;
    }));
    
    // Forward to the consolidated campaigns API
    const apiUrl = `${process.env.CAMPAIGNS_API_URL || 'http://localhost:5000'}/upload`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Upload API error:', errorData);
      return NextResponse.json(
        { error: errorData.detail || 'Failed to upload file' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in upload route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
