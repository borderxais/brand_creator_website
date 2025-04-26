import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { emailVerificationLimiter } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Apply rate limiting based on IP address to prevent abuse
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `email-verification:${ip}`;
    
    if (emailVerificationLimiter.isRateLimited(rateLimitKey)) {
      const remainingTime = emailVerificationLimiter.getRemainingTime(rateLimitKey);
      return NextResponse.json(
        { 
          error: "Too many verification requests", 
          message: `Please try again in ${remainingTime} seconds.` 
        },
        { status: 429 }
      );
    }

    // For security, we always return the same success message
    // regardless of whether the email exists or not
    const successResponse = {
      success: true,
      message: "If your email exists in our system, a verification link has been sent."
    };

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // If user doesn't exist or is already verified, return the same success message
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json(successResponse);
    }

    if (user.emailVerified) {
      return NextResponse.json(successResponse);
    }

    // Generate a new verification token
    const verificationToken = await createVerificationToken(email);
    
    // Send verification email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    await sendVerificationEmail(email, verificationToken, baseUrl);

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Error resending verification email:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
