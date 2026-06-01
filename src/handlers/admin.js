/**
 * src/handlers/admin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin user routes — mirrors adminController.js + adminRoutes.js exactly.
 * All Sequelize ORM calls replaced with raw mysql2 SQL queries.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDb } from '../db.js';
import { generateSecret, verifyTOTP, buildOtpauthUri } from '../utils/totp.js';

// ─── QR code generation using qrcode-svg ──────────────────────────────────────
// We import dynamically so the Worker only loads it when needed.
async function makeQRDataURL(text) {
  const { default: QRCode } = await import('qrcode-svg');
  const svg = new QRCode({ content: text, width: 256, height: 256, color: '#000', background: '#fff', ecl: 'M' }).svg();
  // Return as a data URL (SVG) — frontend can render it directly
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// ─── POST /api/admin/login ────────────────────────────────────────────────────
export async function login(request, env) {
  const { usernameOrEmail, password } = await request.json();
  const db = await getDb(env);
  try {
    const [rows] = await db.execute(
      'SELECT * FROM admins WHERE username = ? OR email = ? LIMIT 1',
      [usernameOrEmail, usernameOrEmail]
    );
    const admin = rows[0];
    if (admin && admin.password === password) {
      return Response.json({
        email: admin.email,
        role: admin.role,
        is2FAEnabled: !!admin.is2faenabled,
        message: 'Login successful'
      });
    }
    return new Response('Invalid credentials', { status: 401 });
  } finally {
    await db.end();
  }
}

// ─── POST /api/admin/verify-2fa ──────────────────────────────────────────────
export async function verify2FA(request, env) {
  const url = new URL(request.url);
  const usernameOrEmail = url.searchParams.get('usernameOrEmail');
  const code = url.searchParams.get('code');

  const db = await getDb(env);
  try {
    const [rows] = await db.execute(
      'SELECT * FROM admins WHERE username = ? OR email = ? LIMIT 1',
      [usernameOrEmail, usernameOrEmail]
    );
    const admin = rows[0];
    if (!admin) return new Response('User not found', { status: 404 });

    const isValid = await verifyTOTP(code, admin.secret2fa || '');
    if (!isValid) return new Response('Invalid 2FA code', { status: 401 });

    // Fetch permissions
    const [perms] = await db.execute(
      'SELECT permission FROM admin_user_permissions WHERE admin_user_id = ?',
      [admin.id]
    );
    const adminData = { ...admin };
    adminData.permissions = perms.map(p => p.permission);
    // Normalise field names to camelCase for frontend compatibility
    adminData.is2FAEnabled = !!adminData.is2faenabled;
    adminData.is2FAConfigured = !!adminData.is2faconfigured;
    adminData.failed2FAAttempts = adminData.failed2faattempts;
    adminData.lastActive = adminData.last_active;
    adminData.isAuthorized = !!adminData.is_authorized;
    return Response.json(adminData);
  } finally {
    await db.end();
  }
}

// ─── GET /api/admin/generate-2fa ─────────────────────────────────────────────
export async function generate2FA(request, env) {
  const url = new URL(request.url);
  const usernameOrEmail = url.searchParams.get('usernameOrEmail');

  const db = await getDb(env);
  try {
    const [rows] = await db.execute(
      'SELECT * FROM admins WHERE username = ? OR email = ? LIMIT 1',
      [usernameOrEmail, usernameOrEmail]
    );
    const admin = rows[0];
    if (!admin) return new Response('User not found', { status: 404 });

    const secret = generateSecret();
    await db.execute('UPDATE admins SET secret2fa = ? WHERE id = ?', [secret, admin.id]);

    const otpauthUrl = buildOtpauthUri(admin.email, secret);
    const qrCodeImage = await makeQRDataURL(otpauthUrl);

    return Response.json({ secret, qrCodeImage });
  } finally {
    await db.end();
  }
}

// ─── POST /api/admin/setup ────────────────────────────────────────────────────
export async function setupAdmin(request, env) {
  const db = await getDb(env);
  try {
    const [[{ count }]] = await db.execute('SELECT COUNT(*) AS count FROM admins');
    if (parseInt(count) > 0) {
      return new Response('Admin already exists or setup failed', { status: 403 });
    }

    const { username, email, name, password, role, status, color, permissions } = await request.json();
    const [result] = await db.execute(
      `INSERT INTO admins (username, email, name, password, role, status, color, is2faenabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [username, email, name, password, role || 'ADMIN', status || 'Offline', color || '#6366F1']
    );
    const adminId = result.insertId;

    if (permissions && Array.isArray(permissions)) {
      for (const p of permissions) {
        await db.execute(
          'INSERT INTO admin_user_permissions (admin_user_id, permission) VALUES (?, ?)',
          [adminId, p]
        );
      }
    }

    return Response.json({ id: adminId, username, email, name, role, status, color, permissions: permissions || [] });
  } finally {
    await db.end();
  }
}

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
export async function getAllUsers(_request, env) {
  const db = await getDb(env);
  try {
    const [admins] = await db.execute('SELECT * FROM admins');
    const [perms] = await db.execute('SELECT * FROM admin_user_permissions');

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
  } finally {
    await db.end();
  }
}

// ─── POST /api/admin/users ────────────────────────────────────────────────────
export async function createUser(request, env) {
  const { username, email, name, password, role, status, color, permissions } = await request.json();
  const db = await getDb(env);
  try {
    const [result] = await db.execute(
      `INSERT INTO admins (username, email, name, password, role, status, color, is2faenabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [username, email, name, password, role || 'ADMIN', status || 'Offline', color || '#6366F1']
    );
    const userId = result.insertId;

    if (permissions && Array.isArray(permissions)) {
      for (const p of permissions) {
        await db.execute(
          'INSERT INTO admin_user_permissions (admin_user_id, permission) VALUES (?, ?)',
          [userId, p]
        );
      }
    }

    return Response.json({ id: userId, username, email, name, role, status, color, permissions: permissions || [] });
  } finally {
    await db.end();
  }
}

// ─── PUT /api/admin/users/:id ────────────────────────────────────────────────
export async function updateUser(request, env, { params }) {
  const { id } = params;
  const body = await request.json();
  const {
    username, email, name, password, role, status, color,
    permissions, isAuthorized, is2FAConfigured, secret2FA, failed2FAAttempts
  } = body;

  const db = await getDb(env);
  try {
    const [[user]] = await db.execute('SELECT id FROM admins WHERE id = ?', [id]);
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    await db.execute(
      `UPDATE admins SET username=?, email=?, name=?, password=?, role=?, status=?, color=?,
       is_authorized=?, is2faenabled=1, is2faconfigured=?, secret2fa=?, failed2faattempts=?
       WHERE id=?`,
      [username, email, name, password, role, status, color,
       isAuthorized ? 1 : 0, is2FAConfigured ? 1 : 0, secret2FA || null, failed2FAAttempts || 0,
       id]
    );

    if (permissions && Array.isArray(permissions)) {
      await db.execute('DELETE FROM admin_user_permissions WHERE admin_user_id = ?', [id]);
      for (const p of permissions) {
        await db.execute(
          'INSERT INTO admin_user_permissions (admin_user_id, permission) VALUES (?, ?)',
          [id, p]
        );
      }
    }

    return Response.json({ id, username, email, name, role, status, color, permissions: permissions || [] });
  } finally {
    await db.end();
  }
}

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
export async function deleteUser(request, env, { params }) {
  const { id } = params;
  const db = await getDb(env);
  try {
    const [[user]] = await db.execute('SELECT id FROM admins WHERE id = ?', [id]);
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    await db.execute('DELETE FROM admins WHERE id = ?', [id]);
    return new Response(null, { status: 200 });
  } finally {
    await db.end();
  }
}
