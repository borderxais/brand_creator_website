import { PrismaClient } from "@prisma/client";

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with logging
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
};

// Use existing instance or create new one
const prisma = globalThis.prisma ?? prismaClientSingleton();

// In development, keep prisma instance across hot-reloads
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export { prisma };
export default prisma;
