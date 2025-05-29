import { NextRequest, NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    console.log("Photo upload request received");
    console.log("Form data fields:", Array.from(formData.entries()).map(([key, value]) => {
      if (value instanceof File) {
        return `${key}: File (${value.name}, ${value.size} bytes)`;
      }
      return `${key}: ${String(value)}`;
    }));
    
    // API URL for the upload service
    const apiUrl = `${process.env.UPLOAD_API_URL || 'http://localhost:8001'}/api/upload-product-photo`;
    console.log("Forwarding upload request to:", apiUrl);
    
    // Set timeout for upload
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout
    
    try {
      // Forward the request to the Python upload service
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const responseText = await response.text();
      console.log("Upload response status:", response.status);
      console.log("Upload response text:", responseText);
      
      if (!response.ok) {
        let errorDetail = 'Failed to upload photo';
        
        try {
          if (responseText.trim().startsWith('{')) {
            const errorData = JSON.parse(responseText);
            errorDetail = errorData.detail || errorDetail;
          } else {
            errorDetail = responseText || errorDetail;
          }
        } catch (parseError) {
          console.error('Error parsing upload response:', parseError);
          errorDetail = responseText || errorDetail;
        }
        
        console.error('Upload API error response:', errorDetail);
        
        return NextResponse.json(
          { error: errorDetail },
          { status: response.status }
        );
      }
      
      // Parse successful response
      try {
        const data = JSON.parse(responseText);
        return NextResponse.json(data);
      } catch (parseError) {
        console.error('Error parsing upload success response:', parseError);
        return NextResponse.json({ success: true, message: responseText || 'Upload successful' });
      }
      
    } catch (fetchError) {
      console.error('Upload fetch error:', fetchError);
      return NextResponse.json(
        { error: `Error connecting to upload API: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Upload API route error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
