-- ─── Klanvision D1 Database Seed ─────────────────────────────────────────────
-- Run with: npx wrangler d1 execute klanvision-db --remote --file seed_data.sql

-- ─── Job Listings ─────────────────────────────────────────────────────────────
INSERT INTO job_listings (title, department, location, type, description, requirements, active) VALUES
('Senior Frontend Developer', 'Engineering', 'Remote', 'Full-time', 'We are looking for an experienced Frontend Developer to join our growing team. You will build and maintain high-quality web applications using modern technologies.', '["React","TypeScript","Tailwind CSS","Next.js"]', 1),
('Backend Engineer', 'Engineering', 'Hyderabad, India', 'Full-time', 'Join our core infrastructure team to build scalable backend services and APIs that power our platform.', '["Node.js","PostgreSQL","REST APIs","Docker"]', 1),
('Product Manager', 'Product', 'Bangalore, India', 'Full-time', 'Lead product strategy and execution. Work closely with engineering and design to deliver world-class products.', '["Product Strategy","Agile","User Research","Roadmapping"]', 1),
('UX Designer', 'Design', 'Remote', 'Contract', 'Help us design beautiful and intuitive interfaces that delight our users. You will own the full design process from wireframes to final handoff.', '["Figma","Prototyping","User Testing","Design Systems"]', 1),
('DevOps Engineer', 'Engineering', 'Remote', 'Full-time', 'Scale our infrastructure and deployment pipelines. Own reliability, monitoring and CI/CD across our cloud environments.', '["Kubernetes","Terraform","CI/CD","AWS"]', 1),
('Digital Marketing Manager', 'Marketing', 'Remote', 'Full-time', 'Drive our growth and marketing initiatives across digital channels. Own SEO, content and paid campaigns.', '["Digital Marketing","SEO","Content Strategy","Analytics"]', 1);

-- ─── Blog Posts ───────────────────────────────────────────────────────────────
INSERT INTO blog_posts (title, category, author, date, read_time, views, image, excerpt, content, status, author_link) VALUES
('The Future of Web Development', 'Technology', 'Moopuri Kiran Kumar', '2024-01-15', '5 min read', 1240, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800', 'Explore the latest trends shaping the future of web development, from AI-assisted coding to edge computing and beyond.', '<p>The web development landscape is evolving at an unprecedented pace. From AI-assisted coding tools to edge-native architectures, developers are navigating a rapidly changing ecosystem. In this article, we explore the key trends that will define the next era of web development.</p><h2>AI-Assisted Development</h2><p>Tools like GitHub Copilot and ChatGPT are already transforming how developers write code. The next step is fully agentic coding environments that can autonomously scaffold, test, and deploy features.</p><h2>Edge Computing</h2><p>Platforms like Cloudflare Workers are pushing computation closer to the user, reducing latency and improving performance globally.</p>', 'published', 'https://linkedin.com/in/klanvision'),
('Mastering React Hooks in 2024', 'Tutorial', 'Klanvision Team', '2024-02-10', '8 min read', 3420, 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800', 'A deep dive into advanced React Hooks patterns — custom hooks, performance optimization, and common pitfalls to avoid.', '<p>React Hooks have fundamentally changed how we write React components. In this comprehensive guide, we cover advanced patterns that will take your hook game to the next level.</p><h2>Custom Hooks</h2><p>Custom hooks let you extract stateful logic from components and reuse it across your application. A well-crafted custom hook is one of the most powerful tools in a React developer arsenal.</p><h2>Performance with useMemo and useCallback</h2><p>Understanding when to memoize is critical. Over-memoization can actually hurt performance, while under-memoization causes unnecessary re-renders.</p>', 'published', 'https://linkedin.com/in/klanvision'),
('Why UI/UX Matters for Business Growth', 'Design', 'Klanvision Team', '2024-03-05', '4 min read', 2100, 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800', 'The measurable impact of good design on user retention, conversion rates, and brand perception for B2B and B2C companies.', '<p>Good design is not just about aesthetics — it is a business multiplier. Companies that invest in UX see up to 400% higher conversion rates and significantly lower churn.</p><h2>First Impressions Count</h2><p>Users form an opinion about your product within 50 milliseconds. A cluttered, confusing interface immediately signals low quality, regardless of the underlying product.</p><h2>Reducing Friction</h2><p>Every extra click, every unclear label, every slow loading screen is a potential drop-off point. Great UX systematically eliminates friction from user journeys.</p>', 'published', ''),
('Building Scalable APIs with Cloudflare Workers', 'Technology', 'Moopuri Kiran Kumar', '2024-04-20', '6 min read', 890, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800', 'A practical guide to building production-ready, globally distributed APIs using Cloudflare Workers and D1 SQLite database.', '<p>Cloudflare Workers offer a compelling serverless platform for building APIs that run at the edge, close to your users worldwide. In this guide we walk through building a complete REST API backed by D1.</p>', 'published', 'https://linkedin.com/in/klanvision'),
('Top 10 Cybersecurity Practices for Startups', 'Security', 'Klanvision Team', '2024-05-12', '7 min read', 560, 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800', 'Security does not have to be expensive. These 10 foundational practices protect your startup from the most common attack vectors.', '<p>Startups often deprioritize security in the rush to ship features. This is a costly mistake. The average cost of a data breach is $4.45M — far more than the cost of prevention.</p>', 'draft', '');

-- ─── Projects ─────────────────────────────────────────────────────────────────
INSERT INTO projects (title, client, status, progress, start_date, deadline, color, priority, description, comments) VALUES
('Klanvision Website Redesign', 'Klanvision Internal', 'In Progress', 75, '2024-01-10', '2024-06-30', '#6366F1', 'High', 'Complete redesign of the Klanvision corporate website with modern UI, improved SEO and CMS integration.', '[]'),
('E-Commerce Platform', 'RetailCo Ltd', 'Completed', 100, '2023-09-01', '2024-02-28', '#10B981', 'High', 'Full-stack e-commerce solution with payment gateway, inventory management, and admin dashboard.', '[]'),
('Mobile Banking App', 'FinTech Partners', 'In Progress', 40, '2024-03-01', '2024-09-30', '#F59E0B', 'High', 'Cross-platform mobile banking application with biometric authentication, real-time transactions and spending analytics.', '[]'),
('HR Management System', 'GlobalCorp Inc', 'Planning', 10, '2024-06-01', '2024-12-31', '#8B5CF6', 'Medium', 'Comprehensive HR management system covering recruitment, payroll, leave management, and performance reviews.', '[]'),
('AI Chatbot Integration', 'TechStartup XYZ', 'In Progress', 60, '2024-02-15', '2024-07-31', '#EC4899', 'Medium', 'Custom AI-powered customer support chatbot integrated into the client existing platform with CRM sync.', '[]'),
('Logistics Tracking Dashboard', 'ShipFast Logistics', 'Completed', 100, '2023-11-01', '2024-03-15', '#14B8A6', 'Low', 'Real-time shipment tracking dashboard with live map, delivery status updates, and analytics reporting.', '[]');

-- ─── Project Teams ─────────────────────────────────────────────────────────────
INSERT INTO project_assigned_teams (project_id, assigned_team) VALUES
(1, 'Frontend Team'), (1, 'Design Team'),
(2, 'Full Stack Team'), (2, 'QA Team'),
(3, 'Mobile Team'), (3, 'Backend Team'),
(4, 'Backend Team'), (4, 'Frontend Team'),
(5, 'AI/ML Team'), (5, 'Backend Team'),
(6, 'Frontend Team'), (6, 'DevOps Team');

-- ─── SEO Data ─────────────────────────────────────────────────────────────────
INSERT INTO seo_data (id, site_title, meta_description, keywords, sitemap_url, google_console_id, robots_txt) VALUES
(1, 'Klanvision - Innovative Tech Solutions', 'Klanvision delivers cutting-edge software solutions, web development, mobile apps, and digital transformation services for businesses worldwide.', 'tech solutions, web development, mobile app, software company, digital transformation, Klanvision', '/sitemap.xml', '', 'User-agent: *
Allow: /
Disallow: /admin/
Sitemap: https://www.klanvision.com/sitemap.xml');
