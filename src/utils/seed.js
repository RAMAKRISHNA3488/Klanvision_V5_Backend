/**
 * src/utils/seed.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seed endpoint — ported to Cloudflare D1 (SQLite).
 * Used to populate the database with initial data after creating the D1 schema.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function runSeed(request, env) {
  // 1. Verify Secret
  const providedSecret = request.headers.get('X-Seed-Secret');
  const expectedSecret = env.SEED_SECRET;
  
  if (!expectedSecret) {
    return new Response('SEED_SECRET is not configured in environment variables.', { status: 500 });
  }
  if (providedSecret !== expectedSecret) {
    return new Response('Unauthorized seed request. Invalid X-Seed-Secret.', { status: 403 });
  }

  const logs = [];

  try {
    // 2. Clear old admins (just in case)
    await env.DB.prepare('DELETE FROM admins').run();
    logs.push('Cleared old admin accounts.');

    // 3. Seed Jobs
    const { count: jobCount } = await env.DB.prepare('SELECT COUNT(*) AS count FROM job_listings').first();
    if (parseInt(jobCount) === 0) {
      const jobs = [
        ['Senior Frontend Developer', 'Engineering', 'Remote', 'Full-time', 'We are looking for an experienced Frontend Developer...', '["React", "TypeScript", "Tailwind CSS"]', 1],
        ['Backend Engineer', 'Engineering', 'New York, NY', 'Full-time', 'Join our core infrastructure team...', '["Node.js", "PostgreSQL", "AWS"]', 1],
        ['Product Manager', 'Product', 'San Francisco, CA', 'Full-time', 'Lead product strategy and execution...', '["Product Strategy", "Agile", "User Research"]', 1],
        ['UX Designer', 'Design', 'Remote', 'Contract', 'Help us design beautiful and intuitive interfaces...', '["Figma", "Prototyping", "User Testing"]', 1],
        ['DevOps Engineer', 'Engineering', 'London, UK', 'Full-time', 'Scale our infrastructure and deployment pipelines...', '["Kubernetes", "Terraform", "CI/CD"]', 1],
        ['Marketing Manager', 'Marketing', 'Remote', 'Full-time', 'Drive our growth and marketing initiatives...', '["Digital Marketing", "SEO", "Content Strategy"]', 1]
      ];

      const stmts = jobs.map(j => 
        env.DB.prepare(`INSERT INTO job_listings (title, department, location, type, description, requirements, active) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(j[0], j[1], j[2], j[3], j[4], j[5], j[6])
      );
      await env.DB.batch(stmts);
      logs.push(`Seeded ${jobs.length} job listings.`);
    } else {
      logs.push('Job listings already exist, skipping.');
    }

    // 4. Seed SEO Data
    const { count: seoCount } = await env.DB.prepare('SELECT COUNT(*) AS count FROM seo_data').first();
    if (parseInt(seoCount) === 0) {
      await env.DB.prepare(
        `INSERT INTO seo_data (id, site_title, meta_description, keywords, sitemap_url, google_console_id, robots_txt)
         VALUES (1, 'Klanvision - Tech Solutions', 'Leading tech solutions provider', 'tech, software, web development', '/sitemap.xml', '', 'User-agent: *\\nAllow: /')`
      ).run();
      logs.push('Seeded SEO data.');
    } else {
      logs.push('SEO data already exists, skipping.');
    }

    // 5. Seed Blogs
    const { count: blogCount } = await env.DB.prepare('SELECT COUNT(*) AS count FROM blog_posts').first();
    if (parseInt(blogCount) === 0) {
      const blogs = [
        ['The Future of Web Development', 'Technology', 'John Doe', '2023-10-01', '5 min read', 120, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085', 'Explore the latest trends in web development...', '<p>Full content here...</p>', 'published', 'https://linkedin.com/in/johndoe'],
        ['Mastering React Hooks', 'Tutorial', 'Jane Smith', '2023-10-05', '8 min read', 340, 'https://images.unsplash.com/photo-1555066931-4365d14bab8c', 'A deep dive into React Hooks...', '<p>Full content here...</p>', 'published', 'https://linkedin.com/in/janesmith'],
        ['Why UI/UX Matters', 'Design', 'Alice Johnson', '2023-10-10', '4 min read', 210, 'https://images.unsplash.com/photo-1561070791-2526d30994b5', 'The impact of good design on user retention...', '<p>Full content here...</p>', 'draft', '']
      ];

      const stmts = blogs.map(b => 
        env.DB.prepare(`INSERT INTO blog_posts (title, category, author, date, read_time, views, image, excerpt, content, status, author_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[8], b[9], b[10])
      );
      await env.DB.batch(stmts);
      logs.push(`Seeded ${blogs.length} blog posts.`);
    } else {
      logs.push('Blog posts already exist, skipping.');
    }

    return Response.json({ success: true, log: logs });
  } catch (error) {
    console.error('Seed Error:', error);
    return Response.json({ success: false, error: error.message, log: logs }, { status: 500 });
  }
}
