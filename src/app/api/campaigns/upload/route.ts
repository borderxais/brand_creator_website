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
    
    // Validate required fields for upload
    const file = formData.get('file') as File;
    const brandId = formData.get('brand_id') as string;
    const campaignId = formData.get('campaign_id') as string;
    
    if (!file || !brandId || !campaignId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, brand_id, or campaign_id' },
        { status: 400 }
      );
    }
    
    // Forward to the consolidated campaigns API
    const apiUrl = `${process.env.CAMPAIGNS_API_URL || 'http://localhost:5000'}/upload`;
    
    // Create new FormData for the Python API with proper field mapping
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('brand_id', brandId);
    uploadFormData.append('campaign_id', campaignId);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: uploadFormData,
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
    console.log('Upload successful:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in upload route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
