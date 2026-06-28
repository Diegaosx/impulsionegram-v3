import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

// Authentication for the API. Users (admin or cliente) log in and receive a
// signed JWT; protected routes verify that token and, where needed, the role.

// Signing secret. Prefer JWT_SECRETS (the configured Railway variable), fall
// back to JWT_SECRET. A random dev secret is generated if neither is set, which
// means tokens won't survive a restart — fine for local dev, flagged in prod.
function resolveSecret(): string {
  const fromEnv = process.env.JWT_SECRETS || process.env.JWT_SECRET;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  if (process.env.NODE_ENV !== 'development') {
    console.warn(
      'WARNING: JWT_SECRETS is not set. Using an ephemeral secret — sessions will not survive restarts. Set JWT_SECRETS in production.'
    );
  }
  return `dev-ephemeral-${Math.random().toString(36).slice(2)}${Date.now()}`;
}

const SECRET = resolveSecret();
const TOKEN_TTL = '7d';

export interface TokenPayload {
  sub: string;
  role: 'admin' | 'cliente';
  name?: string;
  email?: string;
}

export function getAdminCredentials(): { username: string; password: string } {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin'
  };
}

// Sign a token for a logged-in account.
export function signAccountToken(account: { id: string; role: 'admin' | 'cliente'; name?: string; email?: string }): string {
  return jwt.sign(
    { sub: account.id, role: account.role, name: account.name, email: account.email },
    SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

// Backwards-compatible helper for the env-admin login path.
export function signAdminToken(subject: string): string {
  return jwt.sign({ sub: subject, role: 'admin' }, SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, SECRET) as any;
    if (payload && (payload.role === 'admin' || payload.role === 'cliente')) {
      return payload as TokenPayload;
    }
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

export function getPayload(req: Request): TokenPayload | null {
  return verifyToken(bearerFromRequest(req));
}

export function isAuthenticated(req: Request): boolean {
  return getPayload(req) !== null;
}

export function isAdmin(req: Request): boolean {
  return getPayload(req)?.role === 'admin';
}

// Middleware: require any authenticated user (admin or cliente).
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (getPayload(req)) return next();
  return res.status(401).json({ error: 'Não autorizado. Faça login para continuar.' });
}

// Middleware: require an admin token.
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const payload = getPayload(req);
  if (!payload) return res.status(401).json({ error: 'Não autorizado. Faça login como administrador.' });
  if (payload.role !== 'admin') return res.status(403).json({ error: 'Acesso restrito a administradores.' });
  return next();
}
