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
    // 2. Seed Default Admin
    const { count: adminCount } = await env.DB.prepare('SELECT COUNT(*) AS count FROM admins').first();
    if (parseInt(adminCount) === 0) {
      // Create admin user
      const { meta } = await env.DB.prepare(
        `INSERT INTO admins (username, email, name, password, role, status, color, is_authorized, is2faenabled) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind('admin', 'admin@klanvision.com', 'Super Admin', 'KlanAdmin2026!', 'SUPER_ADMIN', 'Online', '#6366F1', 1, 0).run();
      
      const adminId = meta.last_row_id;

      // Grant all permissions
      const perms = ['ALL_ACCESS', 'MANAGE_USERS', 'MANAGE_JOBS', 'MANAGE_BLOGS'];
      const stmts = perms.map(p => 
        env.DB.prepare('INSERT INTO admin_user_permissions (admin_user_id, permission) VALUES (?, ?)')
        .bind(adminId, p)
      );
      await env.DB.batch(stmts);
      
      logs.push('Seeded default Super Admin account.');
    } else {
      logs.push('Admin accounts already exist, skipping admin seed.');
    }

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

    // 6. Seed Exams & Questions
    const { count: examCount } = await env.DB.prepare('SELECT COUNT(*) AS count FROM exams').first();
    if (parseInt(examCount) === 0) {
      const internshipRoles = [
        "Cyber Security & Ethical Hacking",
        "Internet of Things (IoT)",
        "Software Development",
        "Embedded Systems",
        "VLSI",
        "SQL",
        "Power BI",
        "Cloud Computing",
        "Blockchain Technology",
        "DevOps",
        "Software Testing",
        "Automation Testing",
        "Big Data",
        "C Programming",
        "C++ Programming",
        "Digital Marketing",
        "Data Science",
        "Android Development",
        "Frontend Web Development",
        "Python Programming",
        "Java Programming",
        "Machine Learning",
        "Artificial Intelligence",
        "UI/UX Design",
        "Data Analytics",
        "React.js Web Development",
        "MERN Stack Web Development",
        ".NET Web Development",
        "Figma Web Development",
        "Figma App Development",
        "Full Stack Web Development",
        "Backend Web Development"
      ];

      const jobsList = [
        "DevSecOps Engineer",
        "Data Engineer",
        "Frontend Developer",
        "Backend Developer",
        "Full Stack Developer",
        "Mobile Application Developer"
      ];

      const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const allRoles = [
        ...jobsList.map(j => ({ title: j, type: 'Full-Time' })),
        ...internshipRoles.map(i => ({ title: i, type: 'Internship' }))
      ];

      const examStmts = [];
      const questionStmts = [];

      for (const role of allRoles) {
        const id = slugify(role.title);
        const timer = role.type === 'Internship' ? 20 : 45;
        
        examStmts.push(
          env.DB.prepare(
            `INSERT INTO exams (id, test_name, role, type, timer, shuffle, negative_marking, negative_marks, total_questions, total_marks, status, client_id, client_name, client_logo_url)
             VALUES (?, ?, ?, ?, ?, 1, 1, 0.25, 5, 10, 'Active', 'klanvision-tech', 'Klanvision Technologies', '/logo.png')`
          ).bind(id, `${role.title} Assessment`, role.title, role.type, timer)
        );

        // Pre-generate 5 questions for this exam
        const questions = [
          {
            id: `${id}-q1`,
            question_text: `In a production deployment of a ${role.title} project, which of the following is considered the best practice to maximize security and stability?`,
            option_a: "Implementing Principle of Least Privilege (PoLP) and auditing system logs regularly",
            option_b: "Disabling CORS settings completely to prevent connection timeouts",
            option_c: "Running database engines directly on publicly accessible subnets",
            option_d: "Swallowing exceptions globally to avoid showing stack traces to clients",
            correct_answer: "A",
            marks: 2,
            difficulty: "Medium",
            section_id: "sec-core",
            section_name: "Core Technical Concepts"
          },
          {
            id: `${id}-q2`,
            question_text: `Which of the following standards, libraries, or methodologies is most closely associated with high-performance execution of ${role.title}?`,
            option_a: "Industry-standard caching structures and memory-optimized architectures",
            option_b: "Legacy synchronous polling algorithms",
            option_c: "Client-side graphical styling overrides",
            option_d: "Manual database transactions logging on physical tapes",
            correct_answer: "A",
            marks: 2,
            difficulty: "Easy",
            section_id: "sec-core",
            section_name: "Core Technical Concepts"
          },
          {
            id: `${id}-q3`,
            question_text: `What is the most effective way to scale a ${role.title} pipeline when handling massive spikes in user traffic or computational workload?`,
            option_a: "Implementing horizontal scaling and asynchronous task queue handlers",
            option_b: "Blindly upgrading single-node memory allocations without indexing",
            option_c: "Enforcing synchronous thread locks on all active write queries",
            option_d: "Migrating the entire codebase to static storage assets",
            correct_answer: "A",
            marks: 3,
            difficulty: "Hard",
            section_id: "sec-adv",
            section_name: "Advanced Scenarios"
          },
          {
            id: `${id}-q4`,
            question_text: `When designing the system architecture for a ${role.title} component, which design pattern is highly recommended to maintain decoupling?`,
            option_a: "Observer/Event-driven pub-sub systems with proper abstraction interfaces",
            option_b: "Monolithic single-file configurations utilizing global mutable states",
            option_c: "Hard-coding endpoint links directly inside layout controllers",
            option_d: "Synchronous REST calls nested within infinite polling loops",
            correct_answer: "A",
            marks: 2,
            difficulty: "Medium",
            section_id: "sec-adv",
            section_name: "Advanced Scenarios"
          },
          {
            id: `${id}-q5`,
            question_text: `How should runtime exceptions and system crashes be logged and managed in a standard ${role.title} application?`,
            option_a: "Forwarding telemetry data securely to a centralized APM tool and degrading gracefully",
            option_b: "Printing variables to console standard output without log levels",
            option_c: "Terminating the parent process immediately and forcing a cold restart",
            option_d: "Redirecting users to the home index route silently",
            correct_answer: "A",
            marks: 1,
            difficulty: "Easy",
            section_id: "sec-adv",
            section_name: "Advanced Scenarios"
          }
        ];

        for (const q of questions) {
          questionStmts.push(
            env.DB.prepare(
              `INSERT INTO exam_questions (id, exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, difficulty, section_id, section_name)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(q.id, id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.marks, q.difficulty, q.section_id, q.section_name)
          );
        }
      }

      await env.DB.batch(examStmts);

      const batchSize = 50;
      for (let i = 0; i < questionStmts.length; i += batchSize) {
        const slice = questionStmts.slice(i, i + batchSize);
        await env.DB.batch(slice);
      }

      logs.push(`Seeded ${allRoles.length} default exams and ${questionStmts.length} corresponding questions.`);
    } else {
      logs.push('Exams already exist, skipping exams/questions seed.');
    }

    // 7. Seed Email Templates
    const { count: templateCount } = await env.DB.prepare('SELECT COUNT(*) AS count FROM email_templates').first();
    if (parseInt(templateCount) === 0) {
      const templates = [
        ['offer_letter', 'Offer of Internship at Klanvision IT Solutions', 'Dear {name},\n\nWe are pleased to offer you an internship position as a {role} in our {domain} department at Klanvision IT Solutions. Your candidate ID is {candidate_id}.\n\nYour internship is scheduled to begin on {start_date} and end on {end_date}, for a duration of {duration}.\n\nPlease find your official Offer Letter and Internship Participation Letter attached.\n\nBest regards,\nKlanvision Team'],
        ['participation_letter', 'Internship Participation - Joining Details', 'Dear {name},\n\nWelcome to the Klanvision IT Solutions internship program!\n\nThis email confirms your participation as a {role} in the {domain} program under the mentorship of {mentor_name}.\n\nBest regards,\nKlanvision Team'],
        ['completion_certificate', 'Congratulations on Completing your Internship at Klanvision!', 'Dear {name},\n\nCongratulations on successfully completing your internship as a {role} in our {domain} department!\n\nYour certificate number is {certificate_number}.\n\nPlease find your Completion Certificate and Recommendation Letter attached to this email.\n\nBest regards,\nKlanvision Team'],
        ['recommendation_letter', 'Letter of Recommendation - Klanvision IT Solutions', 'Dear {name},\n\nPlease find your Letter of Recommendation attached, reflecting your performance and contributions during your internship at Klanvision IT Solutions.\n\nBest regards,\nKlanvision Team']
      ];

      const stmts = templates.map(t => 
        env.DB.prepare('INSERT INTO email_templates (template_key, subject, body) VALUES (?, ?, ?)')
        .bind(t[0], t[1], t[2])
      );
      await env.DB.batch(stmts);
      logs.push(`Seeded ${templates.length} email templates.`);
    } else {
      logs.push('Email templates already exist, skipping.');
    }

    return Response.json({ success: true, log: logs });
  } catch (error) {
    console.error('Seed Error:', error);
    return Response.json({ success: false, error: error.message, log: logs }, { status: 500 });
  }
}
