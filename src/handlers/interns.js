import { 
  generateOfferLetter, 
  generateParticipationLetter, 
  generateCompletionCertificate, 
  generateRecommendationLetter 
} from '../utils/pdf.js';

// Helper to log activities
async function logActivity(env, user, action, type, status, details, request) {
  const ipAddress = request ? request.headers.get('CF-Connecting-IP') || '127.0.0.1' : '127.0.0.1';
  await env.DB.prepare(
    `INSERT INTO activities (user, action, type, status, details, ip_address) 
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(user || 'System', action, type, status, details, ipAddress).run();
}

// Helper to get email templates and replace variables
async function simulateEmail(env, templateKey, intern, request) {
  try {
    const template = await env.DB.prepare('SELECT subject, body FROM email_templates WHERE template_key = ? LIMIT 1')
      .bind(templateKey)
      .first();

    if (!template) return;

    let subject = template.subject;
    let body = template.body;

    const replacements = {
      '{name}': intern.name || '',
      '{role}': intern.role || '',
      '{domain}': intern.domain || '',
      '{candidate_id}': intern.candidateId || intern.candidate_id || '',
      '{start_date}': intern.startDate || intern.start_date || '',
      '{end_date}': intern.endDate || intern.end_date || '',
      '{duration}': intern.duration || '',
      '{mentor_name}': intern.mentorName || intern.mentor_name || 'Senior Project Manager',
      '{certificate_number}': intern.certificateNumber || intern.certificate_number || ''
    };

    for (const [key, value] of Object.entries(replacements)) {
      subject = subject.replace(new RegExp(key, 'g'), value);
      body = body.replace(new RegExp(key, 'g'), value);
    }

    await logActivity(
      env, 
      'Mail Automation', 
      'Email Dispatched', 
      'mail', 
      'success', 
      `Subject: ${subject}\nTo: ${intern.email}\n\nBody:\n${body}`, 
      request
    );
  } catch (err) {
    console.error('Email simulation failed:', err);
  }
}

// ─── POST /api/interns (Create Candidate) ──────────────────────────────────────
export async function createIntern(request, env) {
  const body = await request.json();
  const { 
    name, email, phone, dob, gender, address, 
    collegeName, university, degree, branch, graduationYear, cgpa,
    domain, role, startDate, endDate, duration, mentorName 
  } = body;

  if (!name || !email || !domain || !role || !startDate || !endDate || !duration) {
    return Response.json({ error: 'Missing required candidate information' }, { status: 400 });
  }

  // Check if candidate email already registered for internship
  const existing = await env.DB.prepare(
    'SELECT id FROM internship_candidates WHERE email = ? AND is_deleted = 0 LIMIT 1'
  ).bind(email).first();
  if (existing) {
    return Response.json({ error: 'Intern email already registered' }, { status: 400 });
  }

  // Generate unique Candidate ID: KVI-CAN-YYYY-000001
  const year = new Date().getFullYear();
  const maxRow = await env.DB.prepare('SELECT MAX(id) AS maxId FROM internship_candidates').first();
  const nextSerial = (maxRow.maxId || 0) + 1;
  const candidateId = `KVI-CAN-${year}-${String(nextSerial).padStart(6, '0')}`;

  const { meta } = await env.DB.prepare(
    `INSERT INTO internship_candidates 
     (candidate_id, name, email, phone, dob, gender, address, 
      college_name, university, degree, branch, graduation_year, cgpa,
      domain, role, start_date, end_date, duration, mentor_name, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`
  ).bind(
    candidateId, name, email, phone || null, dob || null, gender || null, address || null,
    collegeName || null, university || null, degree || null, branch || null, graduationYear || null, cgpa || null,
    domain, role, startDate, endDate, duration, mentorName || null
  ).run();

  const newIntern = await env.DB.prepare('SELECT * FROM internship_candidates WHERE id = ?')
    .bind(meta.last_row_id)
    .first();

  // Log activity
  await logActivity(env, 'Admin', 'Candidate Created', 'project', 'success', `Created candidate ${name} (${candidateId})`, request);

  // Send Offer Letter and Participation Letter email simulations
  await simulateEmail(env, 'offer_letter', newIntern, request);
  await simulateEmail(env, 'participation_letter', newIntern, request);

  return Response.json(newIntern, { status: 201 });
}

// ─── GET /api/interns (List Candidates with Search & Filters) ────────────────
export async function getAllInterns(request, env) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || '';
  const domain = url.searchParams.get('domain') || '';
  const startDate = url.searchParams.get('startDate') || '';
  const endDate = url.searchParams.get('endDate') || '';

  let query = 'SELECT * FROM internship_candidates WHERE is_deleted = 0';
  const binds = [];

  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR college_name LIKE ? OR candidate_id LIKE ?)';
    const searchVal = `%${search}%`;
    binds.push(searchVal, searchVal, searchVal, searchVal, searchVal);
  }
  if (status) {
    query += ' AND status = ?';
    binds.push(status);
  }
  if (domain) {
    query += ' AND domain = ?';
    binds.push(domain);
  }
  if (startDate) {
    query += ' AND start_date >= ?';
    binds.push(startDate);
  }
  if (endDate) {
    query += ' AND end_date <= ?';
    binds.push(endDate);
  }

  query += ' ORDER BY id DESC';

  const { results } = await env.DB.prepare(query).bind(...binds).all();
  return Response.json(results);
}

// ─── GET /api/interns/:id (Get Specific Profile) ──────────────────────────────
export async function getInternById(request, env, { params }) {
  const { id } = params;
  const intern = await env.DB.prepare('SELECT * FROM internship_candidates WHERE id = ? AND is_deleted = 0')
    .bind(id)
    .first();
  
  if (!intern) {
    return Response.json({ error: 'Candidate profile not found' }, { status: 404 });
  }
  return Response.json(intern);
}

// ─── PUT /api/interns/:id (Update Candidate / Process Completion) ────────────
export async function updateIntern(request, env, { params }) {
  const { id } = params;
  const body = await request.json();
  
  const existing = await env.DB.prepare('SELECT * FROM internship_candidates WHERE id = ? AND is_deleted = 0')
    .bind(id)
    .first();
  if (!existing) {
    return Response.json({ error: 'Candidate profile not found' }, { status: 404 });
  }

  const { 
    name, email, phone, dob, gender, address, 
    collegeName, university, degree, branch, graduationYear, cgpa,
    domain, role, startDate, endDate, duration, mentorName, status,
    performanceRemarks
  } = body;

  let certificateNumber = existing.certificate_number;
  let certificateDate = existing.certificate_date;

  // Generate certificate if status transitioning to Completed
  if (status === 'Completed' && existing.status !== 'Completed') {
    const year = new Date().getFullYear();
    const countRow = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM internship_candidates WHERE status = 'Completed'"
    ).first();
    const certSerial = (countRow.count || 0) + 1;
    certificateNumber = `KVI-${year}-${String(certSerial).padStart(6, '0')}`;
    certificateDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  await env.DB.prepare(
    `UPDATE internship_candidates SET 
      name = ?, email = ?, phone = ?, dob = ?, gender = ?, address = ?, 
      college_name = ?, university = ?, degree = ?, branch = ?, graduation_year = ?, cgpa = ?,
      domain = ?, role = ?, start_date = ?, end_date = ?, duration = ?, mentor_name = ?, status = ?,
      certificate_number = ?, certificate_date = ?, performance_remarks = ?, recommendation_text = ?
     WHERE id = ?`
  ).bind(
    name, email, phone, dob, gender, address,
    collegeName, university, degree, branch, graduationYear, cgpa,
    domain, role, startDate, endDate, duration, mentorName, status,
    certificateNumber, certificateDate, performanceRemarks || null, 
    performanceRemarks ? `High recommendation for ${name}` : null,
    id
  ).run();

  const updatedIntern = await env.DB.prepare('SELECT * FROM internship_candidates WHERE id = ?').bind(id).first();

  // Log activity
  await logActivity(env, 'Admin', 'Candidate Updated', 'project', 'info', `Updated candidate ${name} (${existing.candidate_id})`, request);

  // If newly completed, log certificate activity and trigger completion email automation
  if (status === 'Completed' && existing.status !== 'Completed') {
    await logActivity(
      env, 
      'System', 
      'Certificate Generated', 
      'security', 
      'success', 
      `Certificate ${certificateNumber} issued to ${name}`, 
      request
    );
    await simulateEmail(env, 'completion_certificate', updatedIntern, request);
    await simulateEmail(env, 'recommendation_letter', updatedIntern, request);
  }

  return Response.json(updatedIntern);
}

// ─── DELETE /api/interns/:id (Soft Delete Candidate) ──────────────────────────
export async function deleteIntern(request, env, { params }) {
  const { id } = params;
  const existing = await env.DB.prepare('SELECT name, candidate_id FROM internship_candidates WHERE id = ? AND is_deleted = 0')
    .bind(id)
    .first();
  if (!existing) {
    return Response.json({ error: 'Candidate not found' }, { status: 404 });
  }

  await env.DB.prepare('UPDATE internship_candidates SET is_deleted = 1 WHERE id = ?').bind(id).run();
  
  await logActivity(
    env, 
    'Admin', 
    'Candidate Deleted', 
    'project', 
    'warning', 
    `Soft deleted candidate ${existing.name} (${existing.candidate_id})`, 
    request
  );

  return Response.json({ success: true, message: 'Candidate soft deleted successfully' });
}

// ─── GET /api/certificates (Certificates List) ───────────────────────────────
export async function getAllCertificates(_request, env) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM internship_candidates 
     WHERE status = 'Completed' AND certificate_number IS NOT NULL AND is_deleted = 0 
     ORDER BY id DESC`
  ).all();
  return Response.json(results);
}

// ─── GET /api/certificates/:id ────────────────────────────────────────────────
export async function getCertificateById(_request, env, { params }) {
  const { id } = params;
  const cert = await env.DB.prepare(
    `SELECT * FROM internship_candidates 
     WHERE id = ? AND status = 'Completed' AND certificate_number IS NOT NULL AND is_deleted = 0`
  ).bind(id).first();
  if (!cert) {
    return Response.json({ error: 'Certificate record not found' }, { status: 404 });
  }
  return Response.json(cert);
}

// ─── POST /api/certificates/regenerate/:id (Regenerate QR / Reissue) ─────────
export async function regenerateCertificate(request, env, { params }) {
  const { id } = params;
  const cert = await env.DB.prepare(
    `SELECT * FROM internship_candidates 
     WHERE id = ? AND status = 'Completed' AND certificate_number IS NOT NULL AND is_deleted = 0`
  ).bind(id).first();
  if (!cert) {
    return Response.json({ error: 'Certificate record not found' }, { status: 404 });
  }

  const certificateDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  await env.DB.prepare(
    'UPDATE internship_candidates SET certificate_date = ? WHERE id = ?'
  ).bind(certificateDate, id).run();

  await logActivity(
    env, 
    'Admin', 
    'Certificate Regenerated', 
    'security', 
    'success', 
    `Reissued certificate ${cert.certificate_number} for ${cert.name}`, 
    request
  );

  return Response.json({ success: true, message: 'Certificate QR / date regenerated successfully' });
}

// ─── GET /api/verify/:certificateNumber (Public Certificate Verification) ─────
export async function verifyCertificate(request, env, { params }) {
  const { certificateNumber } = params;
  const cert = await env.DB.prepare(
    `SELECT name, candidate_id, role, domain, start_date, end_date, certificate_number, certificate_date, status 
     FROM internship_candidates 
     WHERE certificate_number = ? AND is_deleted = 0 LIMIT 1`
  ).bind(certificateNumber).first();

  if (!cert) {
    await logActivity(
      env, 
      'Public Portal', 
      'Verification Request', 
      'security', 
      'warning', 
      `Verification failed for non-existent certificate: ${certificateNumber}`, 
      request
    );
    return Response.json({ verified: false, error: 'Certificate not found' }, { status: 404 });
  }

  await logActivity(
    env, 
    'Public Portal', 
    'Verification Request', 
    'security', 
    'success', 
    `Successfully verified certificate ${certificateNumber} issued to ${cert.name}`, 
    request
  );

  return Response.json({ verified: true, certificate: cert });
}

// ─── Document Downloads ────────────────────────────────────────────────────────

export async function downloadOfferLetter(request, env, { params }) {
  const { id } = params;
  const intern = await env.DB.prepare('SELECT * FROM internship_candidates WHERE id = ? AND is_deleted = 0')
    .bind(id)
    .first();
  if (!intern) return new Response('Candidate not found', { status: 404 });

  const pdfBytes = await generateOfferLetter({
    name: intern.name,
    candidateId: intern.candidate_id,
    role: intern.role,
    domain: intern.domain,
    duration: intern.duration,
    startDate: intern.start_date,
    endDate: intern.end_date,
    mentorName: intern.mentor_name
  });

  await logActivity(env, 'Admin', 'Certificate Downloaded', 'project', 'info', `Downloaded Offer Letter for ${intern.name}`, request);

  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Offer_Letter_${intern.candidate_id}.pdf"`,
    }
  });
}

export async function downloadParticipationLetter(request, env, { params }) {
  const { id } = params;
  const intern = await env.DB.prepare('SELECT * FROM internship_candidates WHERE id = ? AND is_deleted = 0')
    .bind(id)
    .first();
  if (!intern) return new Response('Candidate not found', { status: 404 });

  const pdfBytes = await generateParticipationLetter({
    name: intern.name,
    candidateId: intern.candidate_id,
    role: intern.role,
    domain: intern.domain,
    duration: intern.duration,
    startDate: intern.start_date,
    endDate: intern.end_date,
    mentorName: intern.mentor_name
  });

  await logActivity(env, 'Admin', 'Certificate Downloaded', 'project', 'info', `Downloaded Participation Letter for ${intern.name}`, request);

  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Participation_Letter_${intern.candidate_id}.pdf"`,
    }
  });
}

export async function downloadCompletionCertificate(request, env, { params }) {
  const { id } = params;
  const intern = await env.DB.prepare('SELECT * FROM internship_candidates WHERE id = ? AND status = "Completed" AND is_deleted = 0')
    .bind(id)
    .first();
  if (!intern) return new Response('Completed internship record not found', { status: 404 });

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const pdfBytes = await generateCompletionCertificate({
    name: intern.name,
    candidateId: intern.candidate_id,
    role: intern.role,
    domain: intern.domain,
    duration: intern.duration,
    startDate: intern.start_date,
    endDate: intern.end_date,
    certificateDate: intern.certificate_date,
    certificateNumber: intern.certificate_number
  }, baseUrl);

  await logActivity(env, 'Admin', 'Certificate Downloaded', 'security', 'success', `Downloaded Completion Certificate for ${intern.name}`, request);

  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Internship_Certificate_${intern.certificate_number}.pdf"`,
    }
  });
}

export async function downloadRecommendationLetter(request, env, { params }) {
  const { id } = params;
  const intern = await env.DB.prepare('SELECT * FROM internship_candidates WHERE id = ? AND status = "Completed" AND is_deleted = 0')
    .bind(id)
    .first();
  if (!intern) return new Response('Completed internship record not found', { status: 404 });

  const pdfBytes = await generateRecommendationLetter({
    name: intern.name,
    candidateId: intern.candidate_id,
    role: intern.role,
    domain: intern.domain,
    duration: intern.duration,
    startDate: intern.start_date,
    endDate: intern.end_date,
    performanceRemarks: intern.performance_remarks
  });

  await logActivity(env, 'Admin', 'Certificate Downloaded', 'project', 'info', `Downloaded Recommendation Letter for ${intern.name}`, request);

  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Recommendation_Letter_${intern.candidate_id}.pdf"`,
    }
  });
}

// ─── Configurable Email Templates API ──────────────────────────────────────────

export async function getEmailTemplates(_request, env) {
  const { results } = await env.DB.prepare('SELECT * FROM email_templates ORDER BY id ASC').all();
  return Response.json(results);
}

export async function updateEmailTemplate(request, env, { params }) {
  const { key } = params;
  const { subject, body } = await request.json();

  if (!subject || !body) {
    return Response.json({ error: 'Missing subject or body' }, { status: 400 });
  }

  const existing = await env.DB.prepare('SELECT id FROM email_templates WHERE template_key = ? LIMIT 1')
    .bind(key)
    .first();

  if (!existing) {
    return Response.json({ error: 'Email template not found' }, { status: 404 });
  }

  await env.DB.prepare(
    'UPDATE email_templates SET subject = ?, body = ? WHERE template_key = ?'
  ).bind(subject, body, key).run();

  await logActivity(env, 'Admin', 'Email Template Updated', 'settings', 'info', `Updated email template: ${key}`);

  return Response.json({ success: true, key, subject, body });
}
