import { NextRequest, NextResponse } from "next/server";
import { loginAttemptsLimiter } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    // Use IP + email as key to prevent email enumeration while still limiting by IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const key = `login-attempt:${ip}`;
    
    const isLimited = loginAttemptsLimiter.isRateLimited(key);
    const remainingTime = loginAttemptsLimiter.getRemainingTime(key);
    
    return NextResponse.json({
      limited: isLimited,
      remainingTime: isLimited ? remainingTime : 0
    });
  } catch (error) {
    console.error("Rate limit check error:", error);
    return NextResponse.json(
      { limited: false, error: "An error occurred" },
      { status: 500 }
    );
  }
}
