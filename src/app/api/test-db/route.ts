import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Attempt to connect by executing a simple query
    const userCount = await prisma.user.count();
    
    // Get some basic database metadata
    const platforms = await prisma.platform.findMany({
      select: { name: true },
      take: 5
    });

    // Return success response
    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      data: {
        userCount,
        platforms,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Database connection error:", error);
    
    // Return detailed error information
    return NextResponse.json({
      status: "error",
      message: "Database connection failed",
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      } : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
