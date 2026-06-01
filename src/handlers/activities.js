/**
 * src/handlers/activities.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Audit activity routes — mirrors activityController.js + activityRoutes.js.
 * The daily purge job is exported separately and called by the Worker's
 * `scheduled` handler (Cloudflare Cron Trigger) instead of setInterval.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDb } from '../db.js';

// ─── GET /api/activities ──────────────────────────────────────────────────────
export async function getAllActivities(request, env) {
  const url = new URL(request.url);
  const afterId = url.searchParams.get('afterId');
  const limit = url.searchParams.get('limit');

  const db = await getDb(env);
  try {
    let sql = 'SELECT * FROM audit_activities';
    const bindings = [];

    if (afterId) {
      const parsed = parseInt(afterId, 10);
      if (!isNaN(parsed)) {
        sql += ' WHERE id > ?';
        bindings.push(parsed);
      }
    }

    sql += ' ORDER BY id DESC LIMIT ?';
    bindings.push(limit ? Math.min(parseInt(limit, 10), 500) : 100);

    const [rows] = await db.execute(sql, bindings);
    return Response.json(rows);
  } finally {
    await db.end();
  }
}

// ─── POST /api/activities ─────────────────────────────────────────────────────
export async function addActivity(request, env) {
  const body = await request.json();
  const { user, action, type, status, details } = body;

  if (!user || !action) {
    return Response.json({ error: 'user and action are required' }, { status: 400 });
  }

  const db = await getDb(env);
  try {
    const [result] = await db.execute(
      `INSERT INTO audit_activities (user, action, type, status, details, timestamp)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        String(user).substring(0, 100),
        String(action).substring(0, 100),
        String(type || 'system').substring(0, 50),
        String(status || 'info').substring(0, 20),
        details ? String(details).substring(0, 500) : null,
      ]
    );

    const [rows] = await db.execute('SELECT * FROM audit_activities WHERE id = ?', [result.insertId]);
    return Response.json(rows[0], { status: 201 });
  } finally {
    await db.end();
  }
}

// ─── Cron job: purge activities older than 30 days ────────────────────────────
// Called by the Worker `scheduled` handler, NOT via HTTP.
export async function purgeOldActivities(env) {
  const db = await getDb(env);
  try {
    const [result] = await db.execute(
      `DELETE FROM audit_activities WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    if (result.affectedRows > 0) {
      console.log(`[Activity Purge] Deleted ${result.affectedRows} records older than 30 days.`);
    }
  } catch (error) {
    console.error('[Activity Purge] Failed:', error.message);
  } finally {
    await db.end();
  }
}
