import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'e9f8c4719b486d38e244cb0168b5a8e0f11c79802095f3c9597793a02798e';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: 'customer' | 'admin';
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: 'Access denied: No authorization token provided.',
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      message: 'Access denied: Token must follow Bearer format.',
    });
    return;
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Session expired: Please log in again.',
      });
      return;
    }
    res.status(401).json({
      success: false,
      message: 'Access denied: Invalid or malformed token.',
    });
    return;
  }
}

export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next();
  }
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    try {
      const decoded = jwt.verify(parts[1], JWT_SECRET) as AuthUserPayload;
      req.user = decoded;
    } catch {
      // Ignore token validation failure in optionalAuth
    }
  }
  next();
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Forbidden: Administrative authorization required.',
    });
    return;
  }

  next();
}
