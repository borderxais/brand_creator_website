import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, creatorHandleName } = body;

    // Validate input
    if (!email || !password || !name || !creatorHandleName) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Add validation for creatorHandleName
    if (!creatorHandleName || creatorHandleName.length < 3) {
      return NextResponse.json(
        { message: "Creator handle name must be at least 3 characters long" },
        { status: 400 }
      );
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already taken" },
        { status: 400 }
      );
    }

    // Check if handle name is already taken - FIX THE FIELD NAME HERE
    const existingHandleName = await prisma.user.findUnique({
      where: { creatorHandleName: creatorHandleName },
    });

    if (existingHandleName) {
      return NextResponse.json(
        { message: "Creator handle name already taken" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user - ALSO UPDATE THE FIELD NAME HERE
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "CREATOR",
        creatorHandleName: creatorHandleName, // Use camelCase here too
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}