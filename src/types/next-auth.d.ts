import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      creatorId?: string
      brandId?: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    id: string
    role: string
    creatorId?: string
    brandId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: UserRole
    creatorId?: string
    brandId?: string
  }
}
