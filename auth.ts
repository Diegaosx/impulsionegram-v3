import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

// Admin authentication for the API. The admin panel logs in with credentials
// and receives a signed JWT; protected routes require that token.

// Signing secret. Prefer JWT_SECRETS (the configured Railway variable), fall
// back to JWT_SECRET. A random dev secret is generated if neither is set, which
// means tokens won't survive a restart — fine for local dev, flagged in prod.
function resolveSecret(): string {
  const fromEnv = process.env.JWT_SECRETS || process.env.JWT_SECRET;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  if (process.env.NODE_ENV !== 'development') {
    console.warn(
      'WARNING: JWT_SECRETS is not set. Using an ephemeral secret — admin sessions will not survive restarts. Set JWT_SECRETS in production.'
    );
  }
  return `dev-ephemeral-${Math.random().toString(36).slice(2)}${Date.now()}`;
}

const SECRET = resolveSecret();
const TOKEN_TTL = '7d';

export function getAdminCredentials(): { username: string; password: string } {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin'
  };
}

export function signAdminToken(username: string): string {
  return jwt.sign({ sub: username, role: 'admin' }, SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyAdminToken(token: string): { sub: string; role: string } | null {
  try {
    const payload = jwt.verify(token, SECRET) as any;
    if (payload && payload.role === 'admin') return payload;
    return null;
  } catch {
    return null;
  }
}

// Extract a Bearer token from the Authorization header.
export function bearerFromRequest(req: Request): string {
  const header = String(req.headers['authorization'] || '');
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

export function isAuthenticated(req: Request): boolean {
  return verifyAdminToken(bearerFromRequest(req)) !== null;
}

// Middleware that blocks the request unless a valid admin token is present.
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (isAuthenticated(req)) return next();
  return res.status(401).json({ error: 'Não autorizado. Faça login como administrador.' });
}
