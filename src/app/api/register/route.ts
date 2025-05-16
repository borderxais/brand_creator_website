import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createVerificationToken } from '@/lib/tokens' 
import { sendVerificationEmail } from '@/lib/email'
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    if (!request.body) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const { 
      email, 
      password, 
      name, 
      role = 'CREATOR', // Default to CREATOR if not specified
      creatorHandleName = null // New parameter for creator handle
    } = body;

    console.log('Registration attempt:', { email, name, role });

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For creators, validate handle name
    if (role === 'CREATOR') {
      if (!creatorHandleName) {
        return NextResponse.json(
          { error: 'Creator handle name is required' },
          { status: 400 }
        );
      }
      
      // Validate handle name length
      if (creatorHandleName.length < 3) {
        return NextResponse.json(
          { error: 'Creator handle name must be at least 3 characters long' },
          { status: 400 }
        );
      }
      
      // Check if handle name is already taken
      const existingHandleName = await prisma.user.findUnique({
        where: { creatorHandleName }
      });
      
      if (existingHandleName) {
        return NextResponse.json(
          { error: 'Creator handle name already taken' },
          { status: 400 }
        );
      }
    }

    // Check if user already exists by email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with transaction to ensure both user and profile are created
    const result = await prisma.$transaction(async (prisma) => {
      // Create user with emailVerified set to null
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          // Generate a placeholder handle for brands to satisfy NOT NULL constraint
          creatorHandleName: role === 'CREATOR' 
            ? creatorHandleName 
            : `brand-${randomUUID().slice(0, 8)}`,
          emailVerified: null // Explicitly set to null until verified
        }
      });

      // Create corresponding profile based on role
      if (role === 'CREATOR') {
        // Create basic creator profile
        const creatorProfile = await prisma.creatorProfile.create({
          data: {
            userId: user.id,
            bio: '',
            location: '',
            followers: 0,
            engagementRate: 0,
            categories: '[]'
          }
        });

        // Get all available platforms
        const platforms = await prisma.platform.findMany();
        
        // Create CreatorPlatform entries for each platform
        await Promise.all(platforms.map(platform => 
          prisma.creatorPlatform.create({
            data: {
              creatorId: creatorProfile.id,
              platformId: platform.id,
              followers: 0,
              engagementRate: 0,
              isVerified: false
            }
          })
        ));
      } else if (role === 'BRAND') {
        await prisma.brandProfile.create({
          data: {
            userId: user.id,
            companyName: name,
            industry: '',
            description: '',
            website: ''
          }
        });
      }

      return user;
    });

    // Generate verification token
    const verificationToken = await createVerificationToken(email);
    
    // Send verification email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    await sendVerificationEmail(email, verificationToken, baseUrl);

    console.log('Registration successful:', {
      id: result.id,
      email: result.email,
      role: result.role
    });

    return NextResponse.json({
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
