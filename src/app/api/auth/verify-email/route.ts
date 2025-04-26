import { NextRequest, NextResponse } from "next/server";
import { consumeToken } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get token from query parameters
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return new Response(
        createErrorHtml("Missing verification token", "The verification link is invalid."),
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    // Verify and consume the token
    const email = await consumeToken(token);

    if (!email) {
      return new Response(
        createErrorHtml(
          "Verification Failed", 
          "Your verification link is invalid or has expired. Please request a new verification email."
        ),
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new Response(
        createErrorHtml("User Not Found", "We couldn't find an account associated with this email."),
        { status: 404, headers: { "Content-Type": "text/html" } }
      );
    }

    // Check if the email is already verified
    if (user.emailVerified) {
      return new Response(
        createSuccessHtml(
          "Already Verified",
          "Your email has already been verified. You can log in to your account."
        ),
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    // Update user's emailVerified status
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Redirect to login page with success message
    return new Response(
      createSuccessHtml(
        "Email Verified Successfully!",
        "Your email has been verified. You can now log in to your account."
      ),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      createErrorHtml(
        "Verification Error",
        "An error occurred during email verification. Please try again later."
      ),
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}

// Helper function to create error HTML
function createErrorHtml(title: string, message: string): string {
  return `
    <html>
      <head>
        <title>${title}</title>
        <meta http-equiv="refresh" content="5;url=/login" />
        <style>
          body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            flex-direction: column; 
            background-color: #f9fafb;
            color: #1f2937;
            line-height: 1.5;
          }
          .container {
            max-width: 500px;
            padding: 2rem;
            background-color: white;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            text-align: center;
          }
          h1 { color: #dc2626; margin-bottom: 1rem; }
          p { margin-bottom: 1.5rem; }
          a { 
            color: #6d28d9; 
            text-decoration: none; 
            font-weight: 500; 
            padding: 0.5rem 1rem;
            border: 1px solid #6d28d9;
            border-radius: 0.25rem;
            transition: all 0.2s;
          }
          a:hover { background-color: #6d28d9; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${title}</h1>
          <p>${message}</p>
          <p>Redirecting to login page in 5 seconds...</p>
          <a href="/login">Go to Login</a>
        </div>
      </body>
    </html>
  `;
}

// Helper function to create success HTML
function createSuccessHtml(title: string, message: string): string {
  return `
    <html>
      <head>
        <title>${title}</title>
        <meta http-equiv="refresh" content="3;url=/login?verified=true" />
        <style>
          body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            flex-direction: column; 
            background-color: #f9fafb;
            color: #1f2937;
            line-height: 1.5;
          }
          .container {
            max-width: 500px;
            padding: 2rem;
            background-color: white;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            text-align: center;
          }
          h1 { color: #059669; margin-bottom: 1rem; }
          p { margin-bottom: 1.5rem; }
          a { 
            color: #6d28d9; 
            text-decoration: none; 
            font-weight: 500; 
            padding: 0.5rem 1rem;
            border: 1px solid #6d28d9;
            border-radius: 0.25rem;
            transition: all 0.2s;
          }
          a:hover { background-color: #6d28d9; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${title}</h1>
          <p>${message}</p>
          <p>Redirecting to login page in 3 seconds...</p>
          <a href="/login?verified=true">Go to Login</a>
        </div>
      </body>
    </html>
  `;
}
