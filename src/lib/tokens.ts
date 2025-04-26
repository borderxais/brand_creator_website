import { randomBytes } from 'crypto';
import { prisma } from './prisma';

/**
 * Generate a secure random token
 * @param length Length of the token in bytes (default: 32 bytes = 64 hex chars)
 * @returns A random hex string
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Create an expiration date for tokens
 * @param hours Number of hours from now when the token expires
 * @returns Date object set to the future expiration time
 */
export function generateExpirationDate(hours: number = 24): Date {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

/**
 * Create a verification token for a user
 * @param email User's email to associate with the token
 * @param expiresInHours Hours until the token expires
 * @returns The generated token string
 */
export async function createVerificationToken(email: string, expiresInHours: number = 24): Promise<string> {
  // Delete any existing tokens for this email to prevent duplicate tokens
  await prisma.verificationToken.deleteMany({
    where: { identifier: email }
  });
  
  // Generate a new token and expiration date
  const token = generateToken();
  const expires = generateExpirationDate(expiresInHours);
  
  // Store the token in the database
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    }
  });
  
  return token;
}

/**
 * Verify a token against the database
 * @param token Token string to verify
 * @returns The email associated with the token if valid, null otherwise
 */
export async function verifyToken(token: string): Promise<string | null> {
  // Find the token in the database
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token }
  });
  
  // If token doesn't exist or is expired, return null
  if (!verificationToken || verificationToken.expires < new Date()) {
    return null;
  }
  
  return verificationToken.identifier; // Return the email
}

/**
 * Consume a verification token (use once and delete)
 * @param token Token string to consume
 * @returns The email associated with the token if valid, null otherwise
 */
export async function consumeToken(token: string): Promise<string | null> {
  // Verify the token first
  const email = await verifyToken(token);
  
  if (!email) {
    return null;
  }
  
  // Delete the token to prevent reuse
  await prisma.verificationToken.delete({
    where: { token }
  });
  
  return email;
}
