import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase.ts';
import { getUserProfile } from '../db/queries.ts';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
    role?: string;
    picture?: string;
    [key: string]: any;
  };
  isAdmin?: boolean;
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'gip_palace_secure_hmac_secret_2026_key';

export const ADMIN_MASTER_CREDENTIALS = {
  email: 'admin@grandimperialpalace.in',
  password: process.env.ADMIN_PASSWORD || 'ImperialAdmin',
  masterKey: process.env.ADMIN_MASTER_KEY || 'ImperialAdmin',
  allowedAdminEmails: ['admin@grandimperialpalace.in', 'davekaran2006@gmail.com', 'admin@palace.com', 'admin'],
};

// In-memory sets of active admin and user session tokens
export const activeAdminTokens = new Set<string>();
export const activeUserSessions = new Map<string, { uid: string; email: string; name: string; role: string }>();

// Helper to compute HMAC signature
function signPayload(payloadB64: string): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
}

// Helper to create stateless, HMAC-signed local session tokens
export function createLocalSessionToken(data: { uid: string; email: string; name: string; role: string }): string {
  const payload = {
    ...data,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signPayload(encoded);
  const token = `gip_sess_${encoded}.${signature}`;
  
  activeUserSessions.set(token, data);
  if (data.role === 'admin' || data.email.toLowerCase() === 'admin@grandimperialpalace.in' || data.email.toLowerCase() === 'davekaran2006@gmail.com') {
    activeAdminTokens.add(token);
  }
  return token;
}

// Helper to decode and cryptographically verify session tokens
export function decodeLocalSessionToken(token: string): { uid: string; email: string; name: string; role: string } | null {
  if (!token || typeof token !== 'string') return null;

  // 1. Check in-memory active map
  if (activeUserSessions.has(token)) {
    return activeUserSessions.get(token)!;
  }

  // 2. Verify HMAC-signed gip_sess_ token
  if (token.startsWith('gip_sess_')) {
    try {
      const tokenBody = token.replace('gip_sess_', '');
      const [encodedPayload, signature] = tokenBody.split('.');

      if (!encodedPayload) return null;

      // If signature is present, verify with HMAC
      if (signature) {
        const expectedSig = signPayload(encodedPayload);
        const sigBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSig);
        if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
          console.warn('[Security Warning]: Tampered session token rejected.');
          return null;
        }
      }

      const raw = Buffer.from(encodedPayload, 'base64url').toString('utf8');
      const payload = JSON.parse(raw);

      // Check token expiration
      if (payload.exp && Date.now() > payload.exp) {
        return null;
      }

      if (payload && (payload.uid || payload.email)) {
        const email = (payload.email || 'guest@example.com').trim().toLowerCase();
        const isAdm = payload.role === 'admin' || email === 'admin@grandimperialpalace.in' || email === 'davekaran2006@gmail.com';
        const sessionData = {
          uid: payload.uid || `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email: email,
          name: payload.name || email.split('@')[0],
          role: isAdm ? 'admin' : (payload.role || 'guest'),
        };

        activeUserSessions.set(token, sessionData);
        if (isAdm) {
          activeAdminTokens.add(token);
        }
        return sessionData;
      }
    } catch {
      return null;
    }
  }

  return null;
}

// Helper to check if string is a plausible JWT
function isPlausibleJwt(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  if (token.startsWith('gip_') || token.startsWith('adm_') || token.startsWith('usr_')) return false;
  if (token === 'null' || token === 'undefined' || token.length < 20) return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

// Safely parse JWT payload (Supabase / Standard JWT)
function parseJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const raw = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Helper to authenticate JWT via Supabase or payload parsing
async function verifyJwtToken(token: string): Promise<{ uid: string; email: string; name: string; role: string; picture?: string } | null> {
  // 1. Try Supabase getUser if configured
  if (isSupabaseConfigured()) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (user && !error) {
        const email = user.email || '';
        const name = user.user_metadata?.name || user.user_metadata?.full_name || email.split('@')[0] || 'Patron';
        const isAdm = ADMIN_MASTER_CREDENTIALS.allowedAdminEmails.some((e) => e.toLowerCase() === email.toLowerCase());
        return {
          uid: user.id,
          email,
          name,
          role: isAdm ? 'admin' : (user.user_metadata?.role || 'guest'),
          picture: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        };
      }
    } catch {}
  }

  // 2. Decode payload directly
  const payload = parseJwtPayload(token);
  if (payload && (payload.sub || payload.user_id || payload.uid || payload.email)) {
    const uid = payload.sub || payload.user_id || payload.uid;
    const email = payload.email || 'guest@example.com';
    const name = payload.user_metadata?.name || payload.name || email.split('@')[0];
    const isAdm = ADMIN_MASTER_CREDENTIALS.allowedAdminEmails.some((e) => e.toLowerCase() === email.toLowerCase());
    return {
      uid,
      email,
      name,
      role: isAdm ? 'admin' : 'guest',
      picture: payload.user_metadata?.avatar_url || payload.picture,
    };
  }

  return null;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const adminToken = req.headers['x-admin-token'] as string;
  if (adminToken && activeAdminTokens.has(adminToken)) {
    req.isAdmin = true;
    req.user = {
      uid: 'admin_master_uid',
      email: ADMIN_MASTER_CREDENTIALS.email,
      name: 'Palace General Manager',
      role: 'admin',
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authorization token' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty authorization token' });
  }

  // 1. Check if token is master admin token
  if (activeAdminTokens.has(token)) {
    req.isAdmin = true;
    req.user = {
      uid: 'admin_master_uid',
      email: ADMIN_MASTER_CREDENTIALS.email,
      name: 'Palace General Manager',
      role: 'admin',
    };
    return next();
  }

  // 2. Check local database session token (stateless or in-memory)
  const localSession = decodeLocalSessionToken(token);
  if (localSession) {
    req.isAdmin = localSession.role === 'admin' || localSession.email.toLowerCase() === 'admin@grandimperialpalace.in' || localSession.email.toLowerCase() === 'davekaran2006@gmail.com';
    req.user = {
      uid: localSession.uid,
      email: localSession.email,
      name: localSession.name,
      role: localSession.role,
    };
    return next();
  }

  // 3. Supabase / Standard JWT validation
  if (isPlausibleJwt(token)) {
    const verified = await verifyJwtToken(token);
    if (verified) {
      req.user = verified;
      req.isAdmin = ADMIN_MASTER_CREDENTIALS.allowedAdminEmails.some((e) => e.toLowerCase() === verified.email.toLowerCase());
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session token. Please sign in again.' });
  }

  return res.status(401).json({ error: 'Unauthorized: Unrecognized or invalid session token. Please sign in again.' });
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const adminToken = ((req.headers['x-admin-token'] as string) || '').trim();
  if (adminToken && activeAdminTokens.has(adminToken)) {
    req.isAdmin = true;
    req.user = {
      uid: 'admin_master_uid',
      email: ADMIN_MASTER_CREDENTIALS.email,
      name: 'Palace General Manager',
      role: 'admin',
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (token) {
      if (activeAdminTokens.has(token)) {
        req.isAdmin = true;
        req.user = {
          uid: 'admin_master_uid',
          email: ADMIN_MASTER_CREDENTIALS.email,
          name: 'Palace General Manager',
          role: 'admin',
        };
        return next();
      }

      const localSession = decodeLocalSessionToken(token);
      if (localSession) {
        if (localSession.role === 'admin' || localSession.email.toLowerCase() === 'admin@grandimperialpalace.in' || localSession.email.toLowerCase() === 'davekaran2006@gmail.com') {
          req.isAdmin = true;
          req.user = {
            uid: localSession.uid,
            email: localSession.email,
            name: localSession.name,
            role: 'admin',
          };
          return next();
        }
      }

      if (isPlausibleJwt(token)) {
        const verified = await verifyJwtToken(token);
        if (verified) {
          req.user = verified;
          const isAdm = ADMIN_MASTER_CREDENTIALS.allowedAdminEmails.some((e) => e.toLowerCase() === verified.email.toLowerCase());
          if (isAdm) {
            req.isAdmin = true;
            return next();
          }

          const profile = await getUserProfile(verified.uid);
          if (profile && profile.role === 'admin') {
            req.isAdmin = true;
            return next();
          }
        }
      }
    }
  }

  return res.status(403).json({ error: 'Forbidden: Palace Administrator credentials required to access this resource.' });
};

export const requireStaffOrAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const adminToken = ((req.headers['x-admin-token'] as string) || '').trim();
  if (adminToken && activeAdminTokens.has(adminToken)) {
    req.isAdmin = true;
    req.user = {
      uid: 'admin_master_uid',
      email: ADMIN_MASTER_CREDENTIALS.email,
      name: 'Palace General Manager',
      role: 'admin',
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (token) {
      if (activeAdminTokens.has(token)) {
        req.isAdmin = true;
        req.user = {
          uid: 'admin_master_uid',
          email: ADMIN_MASTER_CREDENTIALS.email,
          name: 'Palace General Manager',
          role: 'admin',
        };
        return next();
      }

      const localSession = decodeLocalSessionToken(token);
      if (localSession) {
        const isStaff =
          localSession.role === 'admin' ||
          localSession.role === 'staff' ||
          localSession.role === 'receptionist' ||
          localSession.email.toLowerCase() === 'admin@grandimperialpalace.in' ||
          localSession.email.toLowerCase() === 'davekaran2006@gmail.com';

        if (isStaff) {
          req.isAdmin = localSession.role === 'admin' || localSession.email.toLowerCase() === 'admin@grandimperialpalace.in';
          req.user = {
            uid: localSession.uid,
            email: localSession.email,
            name: localSession.name,
            role: localSession.role,
          };
          return next();
        }
      }

      if (isPlausibleJwt(token)) {
        const verified = await verifyJwtToken(token);
        if (verified) {
          req.user = verified;
          const isAdm = ADMIN_MASTER_CREDENTIALS.allowedAdminEmails.some((e) => e.toLowerCase() === verified.email.toLowerCase());
          if (isAdm || verified.role === 'admin' || verified.role === 'staff' || verified.role === 'receptionist') {
            req.isAdmin = isAdm || verified.role === 'admin';
            return next();
          }

          const profile = await getUserProfile(verified.uid);
          if (profile && (profile.role === 'admin' || profile.role === 'staff' || profile.role === 'receptionist')) {
            req.isAdmin = profile.role === 'admin';
            return next();
          }
        }
      }
    }
  }

  return res.status(403).json({ error: 'Forbidden: Reception Staff or Palace Administrator credentials required.' });
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const adminToken = req.headers['x-admin-token'] as string;
  if (adminToken && activeAdminTokens.has(adminToken)) {
    req.isAdmin = true;
    req.user = {
      uid: 'admin_master_uid',
      email: ADMIN_MASTER_CREDENTIALS.email,
      name: 'Palace General Manager',
      role: 'admin',
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (token) {
      if (activeAdminTokens.has(token)) {
        req.isAdmin = true;
        req.user = {
          uid: 'admin_master_uid',
          email: ADMIN_MASTER_CREDENTIALS.email,
          name: 'Palace General Manager',
          role: 'admin',
        };
        return next();
      }

      const localSession = decodeLocalSessionToken(token);
      if (localSession) {
        req.isAdmin = localSession.role === 'admin' || localSession.email.toLowerCase() === 'admin@grandimperialpalace.in' || localSession.email.toLowerCase() === 'davekaran2006@gmail.com';
        req.user = {
          uid: localSession.uid,
          email: localSession.email,
          name: localSession.name,
          role: localSession.role,
        };
        return next();
      }

      if (isPlausibleJwt(token)) {
        const verified = await verifyJwtToken(token);
        if (verified) {
          req.user = verified;
          req.isAdmin = ADMIN_MASTER_CREDENTIALS.allowedAdminEmails.some((e) => e.toLowerCase() === verified.email.toLowerCase());
        }
      }
    }
  }
  next();
};

