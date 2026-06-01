/**
 * src/handlers/candidates.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Candidate routes — mirrors candidateController.js + candidateRoutes.js.
 * Resume files are stored as LONGBLOB in MySQL (same as original).
 *
 * NOTE: File upload via multipart/form-data is handled here using the
 * Workers FormData API (no multer required).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDb } from '../db.js';

// ─── POST /api/candidates/register ───────────────────────────────────────────
export async function register(request, env) {
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

    const { name, email, password, phone, dob, gender, qualification, experience, skills, linkedin, portfolio } = fields;

    // Check for duplicate email
    const [existing] = await db.execute('SELECT id FROM candidates WHERE email = ? LIMIT 1', [email]);
    if (existing.length > 0) return new Response('Email already registered', { status: 400 });

    const [result] = await db.execute(
      `INSERT INTO candidates
       (name, email, password, phone, dob, gender, qualification, experience, skills,
        linkedin, portfolio, resume_data, resume_file_name, resume_content_type, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
      [name, email, password, phone||null, dob||null, gender||null,
       qualification||null, experience||null, skills||null,
       linkedin||null, portfolio||null,
       resumeData, resumeFileName, resumeContentType]
    );

    return Response.json(
      { id: result.insertId, name, email, phone, dob, gender, qualification, experience, skills, linkedin, portfolio },
      { status: 201 }
    );
  } finally {
    await db.end();
  }
}

// ─── POST /api/candidates/login ───────────────────────────────────────────────
export async function login(request, env) {
  const { email, password } = await request.json();
  const db = await getDb(env);
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, phone, dob, gender, qualification, experience, skills, linkedin, portfolio, created_at FROM candidates WHERE email = ? LIMIT 1',
      [email]
    );
    const candidate = rows[0];

    // Fetch password separately for verification (avoid returning it)
    const [pwdRow] = await db.execute('SELECT password FROM candidates WHERE email = ? LIMIT 1', [email]);
    if (!pwdRow[0] || pwdRow[0].password !== password) {
      return new Response('Invalid credentials', { status: 401 });
    }

    return Response.json({
      token: `mock-candidate-token-${candidate.id}`,
      candidate
    });
  } finally {
    await db.end();
  }
}

// ─── GET /api/candidates/:id ──────────────────────────────────────────────────
export async function getProfile(request, env, { params }) {
  const { id } = params;
  const db = await getDb(env);
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, phone, dob, gender, qualification, experience, skills, linkedin, portfolio, created_at FROM candidates WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows[0]) return new Response('Candidate not found', { status: 404 });
    return Response.json(rows[0]);
  } finally {
    await db.end();
  }
}

// ─── GET /api/candidates/:id/resume ──────────────────────────────────────────
export async function downloadResume(request, env, { params }) {
  const { id } = params;
  const db = await getDb(env);
  try {
    const [rows] = await db.execute(
      'SELECT resume_data, resume_file_name, resume_content_type FROM candidates WHERE id = ? LIMIT 1',
      [id]
    );
    const candidate = rows[0];
    if (!candidate || !candidate.resume_data) {
      return new Response('Resume not found', { status: 404 });
    }
    return new Response(candidate.resume_data, {
      headers: {
        'Content-Disposition': `attachment; filename="${candidate.resume_file_name}"`,
        'Content-Type': candidate.resume_content_type || 'application/octet-stream',
      }
    });
  } finally {
    await db.end();
  }
}
