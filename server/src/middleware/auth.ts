import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../services/prisma';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        email: string;
        name?: string;
      };
    }
  }
}

export interface AuthOptions {
  optional?: boolean;
}

export const authenticate = (options: AuthOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const apiKey = req.headers['x-api-key'] as string;

      let userId: string | null = null;

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        userId = await verifyToken(token);
      } else if (apiKey) {
        userId = await verifyApiKey(apiKey);
      } else if (!options.optional) {
        userId = await getOrCreateGuestUser();
      }

      if (!userId && !options.optional) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, name: true },
        });

        if (user) {
          req.userId = user.id;
          req.user = {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
          };
        }
      }

      next();
    } catch (error) {
      console.error('Auth error:', error);
      if (!options.optional) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      next();
    }
  };
};

async function verifyToken(token: string): Promise<string | null> {
  const session = await prisma.session.findFirst({
    where: {
      userId: token,
      status: 'active',
    },
    select: { userId: true },
  });
  return session?.userId || null;
}

async function verifyApiKey(apiKey: string): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: {
      id: apiKey,
    },
    select: { id: true },
  });
  return user?.id || null;
}

async function getOrCreateGuestUser(): Promise<string> {
  const guestEmail = `guest_${uuidv4()}@guest.local`;
  
  const existingGuest = await prisma.user.findFirst({
    where: { email: guestEmail },
    select: { id: true },
  });

  if (existingGuest) {
    return existingGuest.id;
  }

  const guest = await prisma.user.create({
    data: {
      email: guestEmail,
      name: 'Guest User',
    },
    select: { id: true },
  });

  return guest.id;
}

export const generateApiKey = (userId: string): string => {
  return userId;
};

export const generateSessionToken = (): string => {
  return uuidv4();
};
