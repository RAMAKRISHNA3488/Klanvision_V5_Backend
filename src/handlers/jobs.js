/**
 * src/handlers/jobs.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Job listings routes — ported to Cloudflare D1 (SQLite).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── GET /api/jobs/active ─────────────────────────────────────────────────────
export async function getActiveJobs(_request, env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM job_listings WHERE active = 1 ORDER BY id DESC'
  ).all();
  
  return Response.json(results.map(j => ({ ...j, active: !!j.active })));
}

// ─── GET /api/jobs ────────────────────────────────────────────────────────────
export async function getAllJobs(_request, env) {
  const { results } = await env.DB.prepare('SELECT * FROM job_listings ORDER BY id DESC').all();
  return Response.json(results.map(j => ({ ...j, active: !!j.active })));
}

// ─── POST /api/jobs ───────────────────────────────────────────────────────────
export async function createJob(request, env) {
  const { title, department, location, type, description, requirements, active } = await request.json();
  
  const { meta } = await env.DB.prepare(
    `INSERT INTO job_listings (title, department, location, type, description, requirements, active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    title, department, location, type, description,
    Array.isArray(requirements) ? JSON.stringify(requirements) : requirements,
    active ? 1 : 0
  ).run();

  const row = await env.DB.prepare('SELECT * FROM job_listings WHERE id = ?').bind(meta.last_row_id).first();
  return Response.json({ ...row, active: !!row.active });
}

// ─── PUT /api/jobs/:id ────────────────────────────────────────────────────────
export async function updateJob(request, env, { params }) {
  const { id } = params;
  const { title, department, location, type, description, requirements, active } = await request.json();
  
  const job = await env.DB.prepare('SELECT id FROM job_listings WHERE id = ?').bind(id).first();
  if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

  await env.DB.prepare(
    `UPDATE job_listings SET title=?, department=?, location=?, type=?, description=?, requirements=?, active=?
     WHERE id=?`
  ).bind(
    title, department, location, type, description,
    Array.isArray(requirements) ? JSON.stringify(requirements) : requirements,
    active ? 1 : 0, id
  ).run();

  const row = await env.DB.prepare('SELECT * FROM job_listings WHERE id = ?').bind(id).first();
  return Response.json({ ...row, active: !!row.active });
}

// ─── DELETE /api/jobs/:id ─────────────────────────────────────────────────────
export async function deleteJob(request, env, { params }) {
  const { id } = params;
  
  const job = await env.DB.prepare('SELECT id FROM job_listings WHERE id = ?').bind(id).first();
  if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

  await env.DB.prepare('DELETE FROM job_listings WHERE id = ?').bind(id).run();
  return Response.json({ message: 'Job deleted successfully' });
}
