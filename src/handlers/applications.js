/**
 * src/handlers/applications.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Job application routes — mirrors applicationController.js + applicationRoutes.js.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDb } from '../db.js';

// ─── POST /api/applications ───────────────────────────────────────────────────
export async function submitApplication(request, env) {
  const db = await getDb(env);
  try {
    const contentType = request.headers.get('content-type') || '';

    let fields = {};
    let resumeData = null;
    let resumeFileName = null;
    let resumeContentType = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          const buf = await value.arrayBuffer();
          resumeData = Buffer.from(buf);
          resumeFileName = value.name;
          resumeContentType = value.type;
        } else {
          fields[key] = value;
        }
      }
    } else {
      fields = await request.json();
    }

    const { jobTitle, name, dob, email, phone, gender, qualification, experience, skills, linkedin, portfolio } = fields;

    await db.execute(
      `INSERT INTO job_applications
       (job_title, name, dob, email, phone, gender, qualification, experience, skills,
        linkedin, portfolio, resume_data, resume_file_name, resume_content_type, submitted_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
      [jobTitle||null, name||null, dob||null, email||null, phone||null, gender||null,
       qualification||null, experience||null, skills||null,
       linkedin||null, portfolio||null,
       resumeData, resumeFileName, resumeContentType]
    );

    return new Response('Application submitted successfully');
  } finally {
    await db.end();
  }
}

// ─── GET /api/applications ────────────────────────────────────────────────────
export async function getAllApplications(_request, env) {
  const db = await getDb(env);
  try {
    const [rows] = await db.execute(
      `SELECT id, job_title AS jobTitle, name, dob, email, phone, gender, qualification,
              experience, skills, linkedin, portfolio, resume_file_name AS resumeFileName,
              resume_content_type AS resumeContentType, submitted_at AS submittedAt
       FROM job_applications
       ORDER BY id DESC`
    );
    return Response.json(rows);
  } finally {
    await db.end();
  }
}

// ─── GET /api/applications/:id/resume ─────────────────────────────────────────
export async function getResume(request, env, { params }) {
  const { id } = params;
  const db = await getDb(env);
  try {
    const [rows] = await db.execute(
      'SELECT resume_data, resume_file_name, resume_content_type FROM job_applications WHERE id = ? LIMIT 1',
      [id]
    );
    const app = rows[0];
    if (!app || !app.resume_data) return new Response('Resume not found', { status: 404 });

    return new Response(app.resume_data, {
      headers: {
        'Content-Disposition': `attachment; filename="${app.resume_file_name}"`,
        'Content-Type': app.resume_content_type || 'application/octet-stream',
      }
    });
  } finally {
    await db.end();
  }
}

// ─── DELETE /api/applications/:id ─────────────────────────────────────────────
export async function deleteApplication(request, env, { params }) {
  const { id } = params;
  const db = await getDb(env);
  try {
    const [[app]] = await db.execute('SELECT id FROM job_applications WHERE id = ? LIMIT 1', [id]);
    if (!app) return Response.json({ error: 'Application not found' }, { status: 404 });

    await db.execute('DELETE FROM job_applications WHERE id = ?', [id]);
    return new Response('Application deleted');
  } finally {
    await db.end();
  }
}
