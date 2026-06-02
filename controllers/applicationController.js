import nodemailer from 'nodemailer';
import { Application } from '../models/Application.js';

// ── Nodemailer transporter (Gmail SMTP) ─────────────────────────────────────
const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Send application notification email ─────────────────────────────────────
const sendApplicationEmail = async ({ jobTitle, name, dob, email, phone, gender, qualification, experience, skills, linkedin, portfolio, resumeBuffer, resumeFileName, resumeContentType }) => {
  const transporter = createTransporter();

  const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
    .wrapper { max-width: 640px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #7C3AED, #4F46E5); padding: 36px 40px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); color: #fff; font-size: 13px; font-weight: 700; padding: 6px 18px; border-radius: 50px; margin-top: 14px; border: 1px solid rgba(255,255,255,0.3); }
    .body { padding: 36px 40px; }
    .section-title { font-size: 13px; font-weight: 800; color: #7C3AED; text-transform: uppercase; letter-spacing: 1px; margin: 28px 0 14px; border-bottom: 2px solid #EDE9FE; padding-bottom: 6px; }
    .info-table { width: 100%; border-collapse: collapse; }
    .info-table tr td { padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 14px; }
    .info-table tr td:first-child { color: #6B7280; font-weight: 600; width: 42%; }
    .info-table tr td:last-child { color: #111827; font-weight: 500; }
    .skills-box { background: #F5F3FF; border-radius: 10px; padding: 14px 18px; font-size: 14px; color: #4C1D95; font-weight: 500; margin-top: 4px; line-height: 1.7; }
    .link-btn { display: inline-block; color: #7C3AED; font-weight: 700; font-size: 13px; text-decoration: none; background: #F5F3FF; padding: 6px 14px; border-radius: 8px; }
    .footer { background: #F9FAFB; padding: 20px 40px; text-align: center; font-size: 12px; color: #9CA3AF; }
    .footer strong { color: #6B7280; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>📋 New Job Application Received</h1>
      <p>Submitted on ${submittedAt} (IST)</p>
      <span class="badge">🎯 ${jobTitle}</span>
    </div>

    <div class="body">
      <div class="section-title">👤 Personal Information</div>
      <table class="info-table">
        <tr><td>Full Name</td><td>${name}</td></tr>
        <tr><td>Date of Birth</td><td>${dob || '—'}</td></tr>
        <tr><td>Email Address</td><td><a href="mailto:${email}" style="color:#7C3AED;">${email}</a></td></tr>
        <tr><td>Phone Number</td><td>${phone}</td></tr>
        <tr><td>Gender</td><td>${gender || '—'}</td></tr>
      </table>

      <div class="section-title">💼 Professional Details</div>
      <table class="info-table">
        <tr><td>Qualification</td><td>${qualification || '—'}</td></tr>
        <tr><td>Experience</td><td>${experience || '—'}</td></tr>
      </table>

      <div class="section-title">🛠 Key Skills</div>
      <div class="skills-box">${skills || '—'}</div>

      ${linkedin || portfolio ? `
      <div class="section-title">🔗 Online Profiles</div>
      <table class="info-table">
        ${linkedin ? `<tr><td>LinkedIn</td><td><a href="${linkedin}" class="link-btn" target="_blank">View Profile →</a></td></tr>` : ''}
        ${portfolio ? `<tr><td>Portfolio / GitHub</td><td><a href="${portfolio}" class="link-btn" target="_blank">View Portfolio →</a></td></tr>` : ''}
      </table>
      ` : ''}

      ${resumeFileName ? `
      <div class="section-title">📄 Resume</div>
      <p style="font-size:14px;color:#374151;">The resume has been attached to this email as <strong>${resumeFileName}</strong>.</p>
      ` : '<p style="font-size:13px;color:#9CA3AF;margin-top:20px;">No resume was attached with this application.</p>'}
    </div>

    <div class="footer">
      <strong>Klanvision IT Solutions</strong> · Careers Portal<br />
      This is an automated notification. Do not reply to this email.
    </div>
  </div>
</body>
</html>
  `.trim();

  const mailOptions = {
    from: `"Klanvision Careers" <${process.env.SMTP_USER}>`,
    to: 'klanphs.solutions@gmail.com',
    subject: `New Application: ${name} – ${jobTitle}`,
    html: htmlBody,
    attachments: resumeBuffer
      ? [{ filename: resumeFileName, content: resumeBuffer, contentType: resumeContentType }]
      : [],
  };

  await transporter.sendMail(mailOptions);
};

// ── Controller: Submit Application ──────────────────────────────────────────
export const submitApplication = async (req, res) => {
  try {
    const { jobTitle, name, dob, email, phone, gender, qualification, experience, skills, linkedin, portfolio } = req.body;
    
    let resumeData = null;
    let resumeFileName = null;
    let resumeContentType = null;
    
    if (req.file) {
      resumeData = req.file.buffer;
      resumeFileName = req.file.originalname;
      resumeContentType = req.file.mimetype;
    }
    
    // 1. Save application to database
    await Application.create({
      jobTitle,
      name,
      dob,
      email,
      phone,
      gender,
      qualification,
      experience,
      skills,
      linkedin,
      portfolio,
      resumeData,
      resumeFileName,
      resumeContentType,
      submittedAt: new Date()
    });

    // 2. Send email notification (non-blocking – log error but don't fail the response)
    sendApplicationEmail({
      jobTitle, name, dob, email, phone, gender, qualification, experience, skills, linkedin, portfolio,
      resumeBuffer: resumeData,
      resumeFileName,
      resumeContentType,
    }).catch(err => {
      console.error('[Email Error] Failed to send application notification email:', err.message);
    });
    
    res.send('Application submitted successfully');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllApplications = async (req, res) => {
  try {
    const apps = await Application.findAll({
      attributes: { exclude: ['resumeData'] } // Don't fetch binary blobs in bulk list, optimizes memory load
    });
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getResume = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await Application.findByPk(id);
    if (!app || !app.resumeData) {
      return res.status(404).send('Resume not found');
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${app.resumeFileName}"`);
    res.setHeader('Content-Type', app.resumeContentType);
    res.send(app.resumeData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await Application.findByPk(id);
    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }
    await app.destroy();
    res.send('Application deleted');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
