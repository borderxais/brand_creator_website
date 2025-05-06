import { NextRequest, NextResponse } from 'next/server';

// Increase bodyParser size limit for this route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Set size limit to 10MB
    },
    responseLimit: '10mb',
  },
};

export async function POST(request: NextRequest) {
  try {
    // Get form data from the request
    const formData = await request.formData();
    
    // Log what we're sending for debugging
    console.log("Form data fields:", Array.from(formData.entries()).map(([key, value]) => {
      if (value instanceof File) {
        return `${key}: File (${value.name}, ${value.size} bytes)`;
      }
      return `${key}: ${String(value).substring(0, 100)}${String(value).length > 100 ? '...' : ''}`;
    }));
    
    // API URL from environment or fallback to default
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/verification`;
    console.log("Forwarding request to:", apiUrl);
    
    // Set a longer timeout for large files
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout
    
    try {
      // Forward the request to FastAPI with longer timeout
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Clear the timeout
      
      // Read response as text first (can only read once)
      const responseText = await response.text();
      console.log("Response status:", response.status);
      console.log("Response text:", responseText);
      
      // Check if request was successful
      if (!response.ok) {
        let errorDetail = 'Failed to submit verification';
        
        try {
          // Try to parse as JSON if the response looks like JSON
          if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            const errorData = JSON.parse(responseText);
            errorDetail = errorData.detail || errorDetail;
          } else {
            // Use the raw text if not JSON
            errorDetail = responseText || errorDetail;
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorDetail = responseText || errorDetail;
        }
        
        console.error('API error response:', errorDetail);
        
        return NextResponse.json(
          { detail: errorDetail },
          { status: response.status }
        );
      }
      
      // Parse successful response
      try {
        const data = JSON.parse(responseText);
        return NextResponse.json(data);
      } catch (parseError) {
        console.error('Error parsing success response:', parseError);
        return NextResponse.json({ message: responseText || 'Success' });
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        { detail: `Error connecting to API: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    // Detailed error logging
    console.error('API route error:', error);
    return NextResponse.json(
      { 
        detail: error instanceof Error ? error.message : 'Internal server error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
