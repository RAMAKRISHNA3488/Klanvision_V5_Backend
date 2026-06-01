/**
 * src/utils/auth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight JWT implementation for Cloudflare Workers using Web Crypto API.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const textEncoder = new TextEncoder();

const base64UrlEncode = (input) => {
  let base64 = btoa(String.fromCharCode(...new Uint8Array(input)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64UrlDecode = (input) => {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const decoded = atob(base64);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return bytes;
};

export const generateToken = async (payload, secret) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(textEncoder.encode(JSON.stringify(header)));
  
  // Add expiration time (24 hours)
  payload.exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
  const encodedPayload = base64UrlEncode(textEncoder.encode(JSON.stringify(payload)));
  
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(dataToSign));
  const encodedSignature = base64UrlEncode(signature);
  
  return `${dataToSign}.${encodedSignature}`;
};

export const verifyToken = async (token, secret) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    
    const key = await crypto.subtle.importKey(
      'raw',
      textEncoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = base64UrlDecode(encodedSignature);
    const isValid = await crypto.subtle.verify('HMAC', key, signature, textEncoder.encode(dataToSign));
    
    if (!isValid) return null;
    
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload)));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    
    return payload;
  } catch (error) {
    return null;
  }
};

const normalizePermission = (p) => {
  if (p === 'MANAGE_USERS') return 'Users';
  if (p === 'MANAGE_PROJECTS' || p === 'MANAGE_JOBS') return 'Projects';
  if (p === 'MANAGE_BLOGS') return 'Blogs';
  if (p === 'MANAGE_SEO') return 'Settings';
  if (p === 'MANAGE_ACTIVITIES') return 'Activity Log';
  return p;
};

export const requireAuth = async (request, env, requiredModule = null) => {
  if (request.method === 'OPTIONS') return; // Allow preflight

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  // We'll use a secret stored in env, fallback for dev
  const secret = env.JWT_SECRET || 'klanvision_super_secret_key_2026';
  
  const user = await verifyToken(token, secret);
  if (!user) {
    return Response.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
  }

  // Attach user to request for downstream handlers
  request.user = user;

  // Wait, if no requiredModule specified, just requiring valid auth is enough
  if (!requiredModule) return;
  
  // Method Check: If it's a destructive/write operation, perform stricter checks
  const isWrite = ['POST', 'PUT', 'DELETE'].includes(request.method);

  const role = (user.role || '').toUpperCase();
  const perms = (user.permissions || []).map(normalizePermission);

  // Super Admin / Admin have full access
  if (['SUPER_ADMIN', 'SUPER ADMIN', 'ADMIN', 'ADMINISTRATOR', 'SUPERADMIN'].includes(role)) {
    return; // Authorized
  }

  // VIEWER never has write access
  if (isWrite && role === 'VIEWER') {
    return Response.json({ error: 'Forbidden: Viewer cannot perform write operations' }, { status: 403 });
  }

  // If user has 'ALL_ACCESS', authorized
  if (perms.includes('ALL_ACCESS') || perms.includes('SUPER_ADMIN')) {
    return;
  }

  // Check explicit permissions
  if (perms.includes(requiredModule)) {
    return; // Authorized by explicit permission
  }

  // Check Base Role access if NO explicit permission match
  if (role === 'DEVELOPER') {
    if (requiredModule === 'Projects' || requiredModule === 'Settings') return;
  }
  if (role === 'EDITOR') {
    if (requiredModule === 'Blogs') return;
  }

  return Response.json({ error: `Forbidden: Missing required permission for ${requiredModule}` }, { status: 403 });
};
