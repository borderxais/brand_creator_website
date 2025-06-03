import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log("Contact form API route called");
    
    // Parse request body
    const data = await request.json();
    console.log("Contact form data received:", { 
      name: data.name, 
      email: data.email, 
      subject: data.subject,
      messageLength: data.message?.length 
    });
    
    // Call the Python contact API
    const apiUrl = process.env.CAMPAIGNS_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/contact/submit`, {
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
      throw new Error(errorData.detail || 'Failed to submit contact form');
    }

    const responseData = await response.json();
    console.log("Contact form submitted successfully:", responseData);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error in contact API route:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.message || 'Failed to submit contact form' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return contact form schema or info
  return NextResponse.json({
    message: "Contact API is available",
    methods: ["POST", "PUT"],
    endpoint: "/api/contact",
    fields: ["name", "email", "subject", "message"],
    features: [
      "Email notifications", 
      "Admin alerts", 
      "User confirmations",
      "Database storage",
      "Status tracking"
    ]
  });
}

// Add test endpoint for email configuration
export async function PUT(request: NextRequest) {
  try {
    console.log("Testing email configuration...");
    
    const apiUrl = process.env.CAMPAIGNS_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/contact/test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json();
    console.log("Email test result:", responseData);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error testing email configuration:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.message || 'Failed to test email configuration' 
      },
      { status: 500 }
    );
  }
}

// Add endpoint to get contact messages (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'get-messages') {
      const apiUrl = process.env.CAMPAIGNS_API_URL || 'http://localhost:5000';
      const status = url.searchParams.get('status');
      const limit = url.searchParams.get('limit') || '50';
      const offset = url.searchParams.get('offset') || '0';
      
      const queryParams = new URLSearchParams({
        limit,
        offset,
        ...(status && { status })
      });
      
      const response = await fetch(`${apiUrl}/contact/messages?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json();
      return NextResponse.json(responseData);
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in contact admin operations:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.message || 'Failed to perform admin operation' 
      },
      { status: 500 }
    );
  }
}
