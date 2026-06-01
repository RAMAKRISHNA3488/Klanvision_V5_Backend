/**
 * src/handlers/applications.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Job application routes — ported to Cloudflare D1 (SQLite).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── POST /api/applications ───────────────────────────────────────────────────
export async function submitApplication(request, env) {
  const contentType = request.headers.get('content-type') || '';

  let fields = {};
  let resumeData = null;
  let resumeFileName = null;
  let resumeContentType = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        resumeData = await value.arrayBuffer();
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

  await env.DB.prepare(
    `INSERT INTO job_applications
     (job_title, name, dob, email, phone, gender, qualification, experience, skills,
      linkedin, portfolio, resume_data, resume_file_name, resume_content_type)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    jobTitle||null, name||null, dob||null, email||null, phone||null, gender||null,
    qualification||null, experience||null, skills||null,
    linkedin||null, portfolio||null,
    resumeData, resumeFileName, resumeContentType
  ).run();

  return new Response('Application submitted successfully');
}

// ─── GET /api/applications ────────────────────────────────────────────────────
export async function getAllApplications(_request, env) {
  const { results } = await env.DB.prepare(
    `SELECT id, job_title AS jobTitle, name, dob, email, phone, gender, qualification,
            experience, skills, linkedin, portfolio, resume_file_name AS resumeFileName,
            resume_content_type AS resumeContentType, submitted_at AS submittedAt
     FROM job_applications
     ORDER BY id DESC`
  ).all();
  
  return Response.json(results);
}

// ─── GET /api/applications/:id/resume ─────────────────────────────────────────
export async function getResume(request, env, { params }) {
  const { id } = params;
  
  const app = await env.DB.prepare(
    'SELECT resume_data, resume_file_name, resume_content_type FROM job_applications WHERE id = ? LIMIT 1'
  ).bind(id).first();
  
  if (!app || !app.resume_data) return new Response('Resume not found', { status: 404 });

  return new Response(app.resume_data, {
    headers: {
      'Content-Disposition': `attachment; filename="${app.resume_file_name}"`,
      'Content-Type': app.resume_content_type || 'application/octet-stream',
    }
  });
}

// ─── DELETE /api/applications/:id ─────────────────────────────────────────────
export async function deleteApplication(request, env, { params }) {
  const { id } = params;
  
  const app = await env.DB.prepare('SELECT id FROM job_applications WHERE id = ? LIMIT 1').bind(id).first();
  if (!app) return Response.json({ error: 'Application not found' }, { status: 404 });

  await env.DB.prepare('DELETE FROM job_applications WHERE id = ?').bind(id).run();
  return new Response('Application deleted');
}
