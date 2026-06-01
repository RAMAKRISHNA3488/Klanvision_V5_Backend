/**
 * src/handlers/jobs.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Job listing routes — mirrors jobController.js + jobRoutes.js.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDb } from '../db.js';

// ─── GET /api/jobs/active ─────────────────────────────────────────────────────
export async function getActiveJobs(_request, env) {
  const db = await getDb(env);
  try {
    const [rows] = await db.execute(
      'SELECT * FROM job_listings WHERE active = 1 ORDER BY id'
    );
    return Response.json(rows);
  } finally {
    await db.end();
  }
}

// ─── GET /api/jobs ────────────────────────────────────────────────────────────
export async function getAllJobs(_request, env) {
  const db = await getDb(env);
  try {
    const [rows] = await db.execute('SELECT * FROM job_listings ORDER BY id');
    return Response.json(rows);
  } finally {
    await db.end();
  }
}

// ─── POST /api/jobs ───────────────────────────────────────────────────────────
export async function createJob(request, env) {
  const { title, department, location, type, description, requirements, active } = await request.json();
  const db = await getDb(env);
  try {
    const [result] = await db.execute(
      `INSERT INTO job_listings (title, department, location, type, description, requirements, active)
       VALUES (?,?,?,?,?,?,?)`,
      [title, department, location, type, description, requirements, active !== false ? 1 : 0]
    );
    const [rows] = await db.execute('SELECT * FROM job_listings WHERE id = ?', [result.insertId]);
    return Response.json(rows[0]);
  } finally {
    await db.end();
  }
}

// ─── PUT /api/jobs/:id ────────────────────────────────────────────────────────
export async function updateJob(request, env, { params }) {
  const { id } = params;
  const { title, department, location, type, description, requirements, active } = await request.json();
  const db = await getDb(env);
  try {
    const [[job]] = await db.execute('SELECT id FROM job_listings WHERE id = ? LIMIT 1', [id]);
    if (!job) return Response.json({ error: 'Job listing not found' }, { status: 404 });

    await db.execute(
      `UPDATE job_listings SET title=?, department=?, location=?, type=?, description=?, requirements=?, active=? WHERE id=?`,
      [title, department, location, type, description, requirements, active ? 1 : 0, id]
    );
    const [rows] = await db.execute('SELECT * FROM job_listings WHERE id = ?', [id]);
    return Response.json(rows[0]);
  } finally {
    await db.end();
  }
}

// ─── DELETE /api/jobs/:id ─────────────────────────────────────────────────────
export async function deleteJob(request, env, { params }) {
  const { id } = params;
  const db = await getDb(env);
  try {
    const [[job]] = await db.execute('SELECT id FROM job_listings WHERE id = ? LIMIT 1', [id]);
    if (!job) return Response.json({ error: 'Job listing not found' }, { status: 404 });

    await db.execute('DELETE FROM job_listings WHERE id = ?', [id]);
    return Response.json({ message: 'Job listing deleted successfully' });
  } finally {
    await db.end();
  }
}
