/**
 * src/utils/seed.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Database seeder — mirrors the seedDatabase() function in the original server.js.
 *
 * Since Workers have no startup hook, seeding is triggered via:
 *   POST /api/admin/seed   (protected by a SEED_SECRET env var)
 *
 * Run once after first deploy:
 *   curl -X POST https://your-worker.workers.dev/api/admin/seed \
 *        -H "X-Seed-Secret: <your-secret>"
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDb } from '../db.js';

export async function runSeed(request, env) {
  // Simple secret check so the endpoint can't be called by anyone
  const secret = request.headers.get('x-seed-secret');
  if (!env.SEED_SECRET || secret !== env.SEED_SECRET) {
    return new Response('Forbidden', { status: 403 });
  }

  const db = await getDb(env);
  const log = [];

  try {
    // ── 1. Remove specific admin accounts ──────────────────────────────────
    const emailsToDelete = [
      'kirankumarmoopuri@klanvision.com',
      'alex@klanvision.com',
      'marcus@dev.io',
      'ram@klanvision.com',
      'admin@klanvision.com'
    ];
    for (const email of emailsToDelete) {
      await db.execute('DELETE FROM admins WHERE email = ?', [email]);
    }
    log.push('Cleared old admin accounts.');

    // ── 2. Seed Job Listings ────────────────────────────────────────────────
    await db.execute('DELETE FROM job_listings');
    const jobs = [
      ['DevSecOps Engineer', 'Engineering', 'Remote / On-site', 'Full-Time',
       'Implement and manage security practices within the DevOps pipeline, ensuring secure CI/CD workflows.',
       'Experience with CI/CD pipelines, security orchestration, vulnerability management, and cloud architecture.', 1],
      ['Data Engineer', 'Data & Analytics', 'Remote', 'Full-Time',
       'Design and build robust data pipelines and architectures to support large-scale data processing.',
       'Experience with Python, SQL, ETL pipelines, big data technologies (Spark/Hadoop), and database modeling.', 1],
      ['Frontend Developer', 'Engineering', 'Remote / On-site', 'Full-Time',
       'Craft pixel-perfect, responsive user interfaces using modern frameworks like React and Next.js.',
       'Proficiency in React.js, Next.js, CSS variables, state management, and modern responsive design.', 1],
      ['Backend Developer', 'Engineering', 'Remote', 'Full-Time',
       'Develop high-performance server-side logic and integrate with various data storage solutions.',
       'Strong experience with Node.js, Express, databases (SQL/NoSQL), and secure RESTful API development.', 1],
      ['Full Stack Developer', 'Engineering', 'On-site', 'Full-Time',
       'Bridge the gap between frontend and backend while specializing in database optimization and management.',
       'Experience with both React/frontend and Node/backend stacks, database optimization, and cloud hosting.', 1],
      ['Mobile Application Developer', 'Engineering', 'Remote / On-site', 'Full-Time',
       'Create seamless mobile experiences across iOS and Android platforms using React Native or Flutter.',
       'Proven experience building and publishing cross-platform apps with React Native or Flutter.', 1],
    ];
    for (const j of jobs) {
      await db.execute(
        'INSERT INTO job_listings (title, department, location, type, description, requirements, active) VALUES (?,?,?,?,?,?,?)',
        j
      );
    }
    log.push(`Seeded ${jobs.length} job listings.`);

    // ── 3. Seed SEO Data (only if empty) ───────────────────────────────────
    const [[{ seoCount }]] = await db.execute('SELECT COUNT(*) AS seoCount FROM seo_data');
    if (parseInt(seoCount) === 0) {
      await db.execute(
        `INSERT INTO seo_data (site_title, meta_description, keywords, sitemap_url, google_console_id, robots_txt)
         VALUES (?,?,?,?,?,?)`,
        ['Klanvision IT Solutions',
         'Professional and Expert Engineers. Certified IT products trusted by enterprise clients worldwide.',
         'Engineering, Design, Software Development, IT Consulting, API Integration',
         'https://klanvision.com/sitemap.xml', 'G-KLANVISION', 'User-agent: *\nAllow: /']
      );
      log.push('Seeded SEO data.');
    } else {
      log.push('SEO data already exists, skipped.');
    }

    // ── 4. Seed Blog Posts ──────────────────────────────────────────────────
    await db.execute('DELETE FROM blog_posts');
    const posts = [
      ['The Future of Cloud Computing: Serverless and Beyond', 'Cloud', 'Klanvision Tech Team',
       'June 01, 2026', '5 min read', 124,
       'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
       'Explore how serverless architectures and multi-cloud strategies are transforming enterprise IT operations.',
       'Cloud computing continues to evolve at a breakneck pace...',
       'Published', 'https://github.com/klanvision'],
      ['Mastering Modern UI/UX: Design Patterns for Scaling Web Applications', 'Design', 'Alex Rivera',
       'May 28, 2026', '7 min read', 98,
       'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
       'Learn premium visual guidelines and micro-animation systems to build responsive interfaces.',
       'Modern web applications require more than just technical efficiency...',
       'Published', 'https://linkedin.com/in/alex-rivera-ui'],
      ['Securing the DevSecOps Pipeline: Continuous Integration Audits', 'Security', 'Marcus Chen',
       'May 15, 2026', '6 min read', 142,
       'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800',
       'Integrate automated threat modeling and security scans into your continuous delivery pipeline.',
       'Security should never be an afterthought...',
       'Published', 'https://linkedin.com/in/marcus-chen-secops'],
    ];
    for (const p of posts) {
      await db.execute(
        `INSERT INTO blog_posts (title, category, author, date, read_time, views, image, excerpt, content, status, author_link)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        p
      );
    }
    log.push(`Seeded ${posts.length} blog posts.`);

    return Response.json({ success: true, log });
  } catch (error) {
    console.error('[Seeder Error]', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await db.end();
  }
}
