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
    console.log("=== TIKTOK VERIFICATION ROUTE START ===");
    console.log("Request URL:", request.url);
    console.log("Request method:", request.method);
    console.log("Request headers:", Object.fromEntries(request.headers.entries()));
    
    const contentType = request.headers.get('content-type') || '';
    let requestBody: FormData | any;
    let isJsonRequest = false;
    
    if (contentType.includes('application/json')) {
      // New JSON format with file paths
      requestBody = await request.json();
      isJsonRequest = true;
      console.log("JSON data received successfully");
      console.log("Submission data:", {
        ...requestBody,
        file_paths: Object.keys(requestBody.file_paths || {})
      });
    } else {
      // Legacy FormData format
      requestBody = await request.formData();
      console.log("Form data received successfully");
      const formDataEntries = Array.from(requestBody.entries()) as [string, FormDataEntryValue][];
      console.log("Form data fields:", formDataEntries.map(([key, value]) => {
        if (value instanceof File) {
          return `${key}: File (${value.name}, ${value.size} bytes)`;
        }
        return `${key}: ${String(value).substring(0, 100)}${String(value).length > 100 ? '...' : ''}`;
      }));
    }
    
    // API URL - use environment variable or fallback
    const baseUrl = process.env.CAMPAIGNS_API_URL || process.env.PYTHON_API_URL || 'http://127.0.0.1:5000';
    const apiUrl = isJsonRequest 
      ? `${baseUrl}/tiktokverification/verification-with-paths`
      : `${baseUrl}/tiktokverification/verification`;
    console.log("Environment variables:");
    console.log("- CAMPAIGNS_API_URL:", process.env.CAMPAIGNS_API_URL);
    console.log("- PYTHON_API_URL:", process.env.PYTHON_API_URL);
    console.log("- Final API URL:", apiUrl);
    
    // Set a longer timeout for large files
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout for cloud
    
    try {
      // Forward the request to FastAPI with longer timeout
      const fetchOptions: RequestInit = {
        method: 'POST',
        body: isJsonRequest ? JSON.stringify(requestBody) : requestBody as FormData,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          ...(isJsonRequest ? { 'Content-Type': 'application/json' } : {})
        }
      };
      
      const response = await fetch(apiUrl, fetchOptions);
      
      clearTimeout(timeoutId);
      
      // Read response as text first
      const responseText = await response.text();
      console.log("Response status:", response.status);
      console.log("Response text (first 200 chars):", responseText.substring(0, 200));
      
      // Check if request was successful
      if (!response.ok) {
        let errorDetail = 'Failed to submit verification';
        
        try {
          // Try to parse as JSON
          if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            const errorData = JSON.parse(responseText);
            errorDetail = errorData.detail || errorData.message || errorDetail;
          } else {
            // Handle HTML error pages from cloud services
            if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
              errorDetail = `Server error: ${response.status} - HTML response received (likely infrastructure error)`;
            } else {
              errorDetail = responseText.substring(0, 200) || errorDetail;
            }
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorDetail = `Server error: ${response.status} - ${responseText.substring(0, 100)}`;
        }
        
        console.error('API error response:', errorDetail);
        
        return NextResponse.json(
          { 
            success: false,
            detail: errorDetail,
            status: response.status
          },
          { status: response.status >= 500 ? 500 : response.status }
        );
      }
      
      // Parse successful response
      try {
        const data = JSON.parse(responseText);
        return NextResponse.json(data);
      } catch (parseError) {
        console.error('Error parsing success response:', parseError);
        // Return a valid JSON response even if parsing fails
        return NextResponse.json({ 
          success: true,
          message: responseText || 'Verification submitted successfully' 
        });
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      
      // Handle different types of fetch errors
      let errorMessage = 'Error connecting to API';
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          errorMessage = 'Request timeout - please try again';
        } else if (fetchError.message.includes('ECONNREFUSED')) {
          errorMessage = 'API service is not available';
        } else {
          errorMessage = fetchError.message;
        }
      }
      
      return NextResponse.json(
        { 
          success: false,
          detail: errorMessage,
          error_type: 'connection_error'
        },
        { status: 503 } // Service Unavailable
      );
    }
  } catch (error) {
    console.error('=== ROUTE ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('=== END ROUTE ERROR ===');
    
    return NextResponse.json(
      { 
        success: false,
        detail: error instanceof Error ? error.message : 'Internal server error',
        error_type: 'internal_error'
      },
      { status: 500 }
    );
  }
}
