import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log("Career application API route called");
    
    // Parse request body
    const data = await request.json();
    console.log("Career application data received:", { 
      position: data.position,
      positionId: data.positionId,
      applicantEmail: data.applicantEmail
    });
    
    // Call the Python career API
    const apiUrl = process.env.CAMPAIGNS_API_URL || 'http://0.0.0.0:5000';
    const response = await fetch(`${apiUrl}/api/career/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log("Python API response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Python API error:", errorData);
      throw new Error(errorData.detail || 'Failed to submit career application');
    }

    const responseData = await response.json();
    console.log("Career application submitted successfully:", responseData);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error in career application API route:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.message || 'Failed to submit career application' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return career application API info
  return NextResponse.json({
    message: "Career Application API is available",
    methods: ["POST"],
    endpoint: "/api/career/apply",
    features: [
      "Email confirmations", 
      "Database storage",
      "Application tracking"
    ]
  });
}
