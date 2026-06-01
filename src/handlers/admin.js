/**
 * src/handlers/admin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin user routes — ported to Cloudflare D1 (SQLite).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { generateSecret, verifyTOTP, buildOtpauthUri } from '../utils/totp.js';
import { generateToken } from '../utils/auth.js';
import QRCode from 'qrcode-svg';

// ─── QR code generation ────────────────────────────────────────────────────────
async function makeQRDataURL(text) {
  const svg = new QRCode({ content: text, width: 256, height: 256, color: '#000', background: '#fff', ecl: 'M' }).svg();
  // Return as a data URL (SVG) — frontend renders it as <img src="...">
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// ─── POST /api/admin/login ────────────────────────────────────────────────────
export async function login(request, env) {
  const { usernameOrEmail, password } = await request.json();
  
  const admin = await env.DB.prepare(
    'SELECT * FROM admins WHERE username = ? OR email = ? LIMIT 1'
  ).bind(usernameOrEmail, usernameOrEmail).first();

  if (admin && admin.password === password) {
    const is2FAEnabled = !!admin.is2faenabled;
    let token = null;

    // Fetch permissions
    const { results: perms } = await env.DB.prepare(
      'SELECT permission FROM admin_user_permissions WHERE admin_user_id = ?'
    ).bind(admin.id).all();
    
    const mappedPerms = perms.map(p => p.permission);

    if (!is2FAEnabled) {
      const secret = env.JWT_SECRET || 'klanvision_super_secret_key_2026';
      token = await generateToken({
        id: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: mappedPerms
      }, secret);
    }

    const adminData = { ...admin };
    adminData.permissions = mappedPerms;
    adminData.token = token;
    adminData.is2FAEnabled = is2FAEnabled;
    adminData.is2FAConfigured = !!admin.is2faconfigured;
    adminData.failed2FAAttempts = admin.failed2faattempts;
    adminData.lastActive = admin.last_active;
    adminData.isAuthorized = !!admin.is_authorized;

    return Response.json({
      ...adminData,
      message: 'Login successful'
    });
  }
  return new Response('Invalid credentials', { status: 401 });
}

// ─── POST /api/admin/verify-2fa ──────────────────────────────────────────────
export async function verify2FA(request, env) {
  const url = new URL(request.url);
  const usernameOrEmail = url.searchParams.get('usernameOrEmail');
  const code = url.searchParams.get('code');

  const admin = await env.DB.prepare(
    'SELECT * FROM admins WHERE username = ? OR email = ? LIMIT 1'
  ).bind(usernameOrEmail, usernameOrEmail).first();

  if (!admin) return new Response('User not found', { status: 404 });

  if (admin.is_authorized === 0) {
    return new Response('Account BLOCKED due to security violations.', { status: 403 });
  }

  const isValid = await verifyTOTP(code, admin.secret2fa || '');
  if (!isValid) {
    const newFailCount = (admin.failed2faattempts || 0) + 1;
    const isAuthorized = newFailCount >= 10 ? 0 : 1;
    await env.DB.prepare(
      'UPDATE admins SET failed2faattempts = ?, is_authorized = ? WHERE id = ?'
    ).bind(newFailCount, isAuthorized, admin.id).run();

    if (newFailCount >= 10) {
      return new Response('Account BLOCKED due to security violations.', { status: 403 });
    }
    return new Response(`Invalid 2FA code. ${10 - newFailCount} attempts remaining.`, { status: 401 });
  }

  // If valid, reset failed attempts and set is2faconfigured if not set
  if ((admin.failed2faattempts || 0) > 0 || !admin.is2faconfigured) {
    await env.DB.prepare(
      'UPDATE admins SET failed2faattempts = 0, is2faconfigured = 1 WHERE id = ?'
    ).bind(admin.id).run();
    admin.is2faconfigured = 1;
    admin.failed2faattempts = 0;
  }

  // Fetch permissions
  const { results: perms } = await env.DB.prepare(
    'SELECT permission FROM admin_user_permissions WHERE admin_user_id = ?'
  ).bind(admin.id).all();
  
  const adminData = { ...admin };
  const mappedPerms = perms.map(p => p.permission);
  adminData.permissions = mappedPerms;
  
  const secret = env.JWT_SECRET || 'klanvision_super_secret_key_2026';
  const token = await generateToken({
    id: admin.id,
    email: admin.email,
    role: admin.role,
    permissions: mappedPerms
  }, secret);
  adminData.token = token;

  // Normalise field names to camelCase for frontend compatibility
  adminData.is2FAEnabled = !!adminData.is2faenabled;
  adminData.is2FAConfigured = !!adminData.is2faconfigured;
  adminData.failed2FAAttempts = adminData.failed2faattempts;
  adminData.lastActive = adminData.last_active;
  adminData.isAuthorized = !!adminData.is_authorized;
  return Response.json(adminData);
}

// ─── GET /api/admin/generate-2fa ─────────────────────────────────────────────
export async function generate2FA(request, env) {
  const url = new URL(request.url);
  const usernameOrEmail = url.searchParams.get('usernameOrEmail');

  const admin = await env.DB.prepare(
    'SELECT * FROM admins WHERE username = ? OR email = ? LIMIT 1'
  ).bind(usernameOrEmail, usernameOrEmail).first();

  if (!admin) return new Response('User not found', { status: 404 });

  const secret = generateSecret();
  await env.DB.prepare('UPDATE admins SET secret2fa = ? WHERE id = ?').bind(secret, admin.id).run();

  const otpauthUrl = buildOtpauthUri(admin.email, secret);
  const qrCodeImage = await makeQRDataURL(otpauthUrl);

  return Response.json({ secret, qrCodeImage });
}

// ─── POST /api/admin/setup ────────────────────────────────────────────────────
export async function setupAdmin(request, env) {
  const { count } = await env.DB.prepare('SELECT COUNT(*) AS count FROM admins').first();
  if (parseInt(count) > 0) {
    return new Response('Admin already exists or setup failed', { status: 403 });
  }

  const { username, email, name, password, role, status, color, permissions } = await request.json();
  const { meta } = await env.DB.prepare(
    `INSERT INTO admins (username, email, name, password, role, status, color, is2faenabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
  ).bind(username, email, name, password, role || 'ADMIN', status || 'Offline', color || '#6366F1').run();
  
  const adminId = meta.last_row_id;

  if (permissions && Array.isArray(permissions)) {
    const stmts = permissions.map(p => 
      env.DB.prepare('INSERT INTO admin_user_permissions (admin_user_id, permission) VALUES (?, ?)')
      .bind(adminId, p)
    );
    await env.DB.batch(stmts);
  }

  return Response.json({ id: adminId, username, email, name, role, status, color, permissions: permissions || [] });
}

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
export async function getAllUsers(_request, env) {
  const { results: admins } = await env.DB.prepare('SELECT * FROM admins').all();
  const { results: perms } = await env.DB.prepare('SELECT * FROM admin_user_permissions').all();

  const permMap = {};
  for (const p of perms) {
    if (!permMap[p.admin_user_id]) permMap[p.admin_user_id] = [];
    permMap[p.admin_user_id].push(p.permission);
  }

  const mapped = admins.map(a => ({
    ...a,
    permissions: permMap[a.id] || [],
    is2FAEnabled: !!a.is2faenabled,
    is2FAConfigured: !!a.is2faconfigured,
    failed2FAAttempts: a.failed2faattempts,
    lastActive: a.last_active,
    isAuthorized: !!a.is_authorized
  }));

  return Response.json(mapped);
}

// ─── POST /api/admin/users ────────────────────────────────────────────────────
export async function createUser(request, env) {
  const { username, email, name, password, role, status, color, permissions } = await request.json();
  
  const { meta } = await env.DB.prepare(
    `INSERT INTO admins (username, email, name, password, role, status, color, is2faenabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
  ).bind(username, email, name, password, role || 'ADMIN', status || 'Offline', color || '#6366F1').run();
  
  const userId = meta.last_row_id;

  if (permissions && Array.isArray(permissions)) {
    const stmts = permissions.map(p => 
      env.DB.prepare('INSERT INTO admin_user_permissions (admin_user_id, permission) VALUES (?, ?)')
      .bind(userId, p)
    );
    await env.DB.batch(stmts);
  }

  return Response.json({ id: userId, username, email, name, role, status, color, permissions: permissions || [] });
}

// ─── PUT /api/admin/users/:id ────────────────────────────────────────────────
export async function updateUser(request, env, { params }) {
  const { id } = params;
  const body = await request.json();
  const {
    username, email, name, password, role, status, color,
    permissions, isAuthorized, is2FAConfigured, secret2FA, failed2FAAttempts
  } = body;

  const user = await env.DB.prepare('SELECT id FROM admins WHERE id = ?').bind(id).first();
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  await env.DB.prepare(
    `UPDATE admins SET username=?, email=?, name=?, password=?, role=?, status=?, color=?,
     is_authorized=?, is2faenabled=1, is2faconfigured=?, secret2fa=?, failed2faattempts=?
     WHERE id=?`
  ).bind(username, email, name, password, role, status, color,
     isAuthorized ? 1 : 0, is2FAConfigured ? 1 : 0, secret2FA || null, failed2FAAttempts || 0,
     id).run();

  if (permissions && Array.isArray(permissions)) {
    await env.DB.prepare('DELETE FROM admin_user_permissions WHERE admin_user_id = ?').bind(id).run();
    const stmts = permissions.map(p => 
      env.DB.prepare('INSERT INTO admin_user_permissions (admin_user_id, permission) VALUES (?, ?)')
      .bind(id, p)
    );
    await env.DB.batch(stmts);
  }

  return Response.json({ id, username, email, name, role, status, color, permissions: permissions || [] });
}

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
export async function deleteUser(request, env, { params }) {
  const { id } = params;
  
  const user = await env.DB.prepare('SELECT id FROM admins WHERE id = ?').bind(id).first();
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  await env.DB.prepare('DELETE FROM admins WHERE id = ?').bind(id).run();
  return new Response(null, { status: 200 });
}
