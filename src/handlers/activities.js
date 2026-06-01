/**
 * src/handlers/activities.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Audit activity routes — ported to Cloudflare D1 (SQLite).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── GET /api/activities ──────────────────────────────────────────────────────
export async function getAllActivities(request, env) {
  const url = new URL(request.url);
  const afterId = url.searchParams.get('afterId');
  const limit = url.searchParams.get('limit');

  let sql = 'SELECT * FROM activities';
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

  const { results } = await env.DB.prepare(sql).bind(...bindings).all();
  return Response.json(results);
}

// ─── POST /api/activities ─────────────────────────────────────────────────────
export async function addActivity(request, env) {
  const body = await request.json();
  const { user, action, type, status, details } = body;

  if (!user || !action) {
    return Response.json({ error: 'user and action are required' }, { status: 400 });
  }

  const { meta } = await env.DB.prepare(
    `INSERT INTO activities (user, action, type, status, details)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    String(user).substring(0, 100),
    String(action).substring(0, 100),
    String(type || 'system').substring(0, 50),
    String(status || 'info').substring(0, 20),
    details ? String(details).substring(0, 500) : null
  ).run();

  const activity = await env.DB.prepare('SELECT * FROM activities WHERE id = ?').bind(meta.last_row_id).first();
  return Response.json(activity, { status: 201 });
}

// ─── Cron job: purge activities older than 30 days ────────────────────────────
export async function purgeOldActivities(env) {
  try {
    const { meta } = await env.DB.prepare(
      `DELETE FROM activities WHERE timestamp < datetime('now', '-30 days')`
    ).run();
    
    if (meta.changes > 0) {
      console.log(`[Activity Purge] Deleted ${meta.changes} records older than 30 days.`);
    }
  } catch (error) {
    console.error('[Activity Purge] Failed:', error.message);
  }
}
