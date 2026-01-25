import { createClerkClient, verifyToken } from '@clerk/backend';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Extend Express Request type to include auth
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Token', message: 'No Authorization header found with Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  const key = process.env.CLERK_SECRET_KEY || "";

  if (!key) {
    console.error('SERVER ERROR: CLERK_SECRET_KEY is missing in environment variables.');
    return res.status(500).json({ error: 'Server Config Error', message: 'CLERK_SECRET_KEY is missing on server.' });
  }

  try {
    const verified = await verifyToken(token, {
        secretKey: key
    });
    
    req.auth = {
      userId: verified.sub
    };
    
    next();
  } catch (error) {
    console.error('Auth Verification Failed:', error);
    // Return the actual error message from Clerk for debugging
    return res.status(401).json({ 
      error: 'Invalid Token', 
      message: `Token verification failed: ${(error as Error).message}` 
    });
  }
};
