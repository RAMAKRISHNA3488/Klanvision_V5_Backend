/**
 * src/handlers/candidates.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Candidate routes — ported to Cloudflare D1 (SQLite).
 * Resume files are stored as BLOB in SQLite.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── POST /api/candidates/register ───────────────────────────────────────────
export async function register(request, env) {
  const contentType = request.headers.get('content-type') || '';

  let fields = {};
  let resumeData = null;
  let resumeFileName = null;
  let resumeContentType = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        resumeData = await value.arrayBuffer(); // D1 natively supports ArrayBuffer for BLOB
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
  const existing = await env.DB.prepare('SELECT id FROM candidates WHERE email = ? LIMIT 1').bind(email).first();
  if (existing) return new Response('Email already registered', { status: 400 });

  const { meta } = await env.DB.prepare(
    `INSERT INTO candidates
     (name, email, password, phone, dob, gender, qualification, experience, skills,
      linkedin, portfolio, resume_data, resume_file_name, resume_content_type)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    name, email, password, phone||null, dob||null, gender||null,
    qualification||null, experience||null, skills||null,
    linkedin||null, portfolio||null,
    resumeData, resumeFileName, resumeContentType
  ).run();

  return Response.json(
    { id: meta.last_row_id, name, email, phone, dob, gender, qualification, experience, skills, linkedin, portfolio },
    { status: 201 }
  );
}

// ─── POST /api/candidates/login ───────────────────────────────────────────────
export async function login(request, env) {
  const { email, password } = await request.json();
  
  const candidate = await env.DB.prepare(
    'SELECT id, name, email, phone, dob, gender, qualification, experience, skills, linkedin, portfolio, created_at FROM candidates WHERE email = ? LIMIT 1'
  ).bind(email).first();

  // Fetch password separately for verification (avoid returning it)
  const pwdRow = await env.DB.prepare('SELECT password FROM candidates WHERE email = ? LIMIT 1').bind(email).first();
  
  if (!pwdRow || pwdRow.password !== password) {
    return new Response('Invalid credentials', { status: 401 });
  }

  return Response.json({
    token: `mock-candidate-token-${candidate.id}`,
    candidate
  });
}

// ─── GET /api/candidates/:id ──────────────────────────────────────────────────
export async function getProfile(request, env, { params }) {
  const { id } = params;
  
  const candidate = await env.DB.prepare(
    'SELECT id, name, email, phone, dob, gender, qualification, experience, skills, linkedin, portfolio, created_at FROM candidates WHERE id = ? LIMIT 1'
  ).bind(id).first();
  
  if (!candidate) return new Response('Candidate not found', { status: 404 });
  return Response.json(candidate);
}

// ─── GET /api/candidates/:id/resume ──────────────────────────────────────────
export async function downloadResume(request, env, { params }) {
  const { id } = params;
  
  const candidate = await env.DB.prepare(
    'SELECT resume_data, resume_file_name, resume_content_type FROM candidates WHERE id = ? LIMIT 1'
  ).bind(id).first();
  
  if (!candidate || !candidate.resume_data) {
    return new Response('Resume not found', { status: 404 });
  }
  
  return new Response(candidate.resume_data, {
    headers: {
      'Content-Disposition': `attachment; filename="${candidate.resume_file_name}"`,
      'Content-Type': candidate.resume_content_type || 'application/octet-stream',
    }
  });
}
