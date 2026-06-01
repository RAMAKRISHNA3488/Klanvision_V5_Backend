import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load .env before anything else so all env vars are available
dotenv.config();

import sequelize from './config/db.js';

// Models
import { AdminUser } from './models/AdminUser.js';
import { AdminUserPermission } from './models/AdminUserPermission.js';
import { JobListing } from './models/JobListing.js';
import { SEOData } from './models/SEOData.js';
import { BlogPost } from './models/BlogPost.js';

// Routes
import adminRoutes from './routes/adminRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import seoRoutes from './routes/seoRoutes.js';

// Controller actions for interval jobs
import { purgeOldActivities } from './controllers/activityController.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Parse CORS_ORIGIN from .env: supports multiple comma-separated origins
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : '*';

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


// Bind routes
app.use('/api/admin', adminRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/seo', seoRoutes);

// Seeding logic matching original parameters
const seedDatabase = async () => {
  try {
    // 1. Seed Admin Users
    // Ensure Kiran Kumar Moopuri is deleted from the system
    await AdminUser.destroy({ where: { email: 'kirankumarmoopuri@klanvision.com' } });

    // Ensure Alex Rivera is deleted from the system
    await AdminUser.destroy({ where: { email: 'alex@klanvision.com' } });

    // Ensure Marcus Chen is deleted from the system
    await AdminUser.destroy({ where: { email: 'marcus@dev.io' } });
    await AdminUser.destroy({ where: { email: 'ram@klanvision.com' } });

    await AdminUser.destroy({ where: { email: 'admin@klanvision.com' } });


    // 2. Seed Job Listings
    // Truncate the table and bulk create exactly the 6 requested listings to ensure they display
    await JobListing.destroy({ truncate: true, cascade: true });
    await JobListing.bulkCreate([
      {
        title: 'DevSecOps Engineer',
        department: 'Engineering',
        location: 'Remote / On-site',
        type: 'Full-Time',
        description: 'Implement and manage security practices within the DevOps pipeline, ensuring secure CI/CD workflows.',
        requirements: 'Experience with CI/CD pipelines, security orchestration, vulnerability management, and cloud architecture.',
        active: true
      },
      {
        title: 'Data Engineer',
        department: 'Data & Analytics',
        location: 'Remote',
        type: 'Full-Time',
        description: 'Design and build robust data pipelines and architectures to support large-scale data processing.',
        requirements: 'Experience with Python, SQL, ETL pipelines, big data technologies (Spark/Hadoop), and database modeling.',
        active: true
      },
      {
        title: 'Frontend Developer',
        department: 'Engineering',
        location: 'Remote / On-site',
        type: 'Full-Time',
        description: 'Craft pixel-perfect, responsive user interfaces using modern frameworks like React and Next.js.',
        requirements: 'Proficiency in React.js, Next.js, CSS variables, state management, and modern responsive design.',
        active: true
      },
      {
        title: 'Backend Developer',
        department: 'Engineering',
        location: 'Remote',
        type: 'Full-Time',
        description: 'Develop high-performance server-side logic and integrate with various data storage solutions.',
        requirements: 'Strong experience with Node.js, Express, databases (SQL/NoSQL), and secure RESTful API development.',
        active: true
      },
      {
        title: 'Full Stack Developer',
        department: 'Engineering',
        location: 'On-site',
        type: 'Full-Time',
        description: 'Bridge the gap between frontend and backend while specializing in database optimization and management.',
        requirements: 'Experience with both React/frontend and Node/backend stacks, database optimization, and cloud hosting.',
        active: true
      },
      {
        title: 'Mobile Application Developer',
        department: 'Engineering',
        location: 'Remote / On-site',
        type: 'Full-Time',
        description: 'Create seamless mobile experiences across iOS and Android platforms using React Native or Flutter.',
        requirements: 'Proven experience building and publishing cross-platform apps with React Native or Flutter.',
        active: true
      }
    ]);




    // 5. Seed SEO Data
    const seoCount = await SEOData.count();
    if (seoCount === 0) {
      await SEOData.create({
        siteTitle: 'Klanvision IT Solutions',
        metaDescription: 'Professional and Expert Engineers. Certified IT products trusted by enterprise clients worldwide.',
        keywords: 'Engineering, Design, Software Development, IT Consulting, API Integration',
        sitemapUrl: 'https://klanvision.com/sitemap.xml',
        googleConsoleId: 'G-KLANVISION',
        robotsTxt: 'User-agent: *\nAllow: /'
      });
    }

    // 6. Seed Blog Posts
    // Truncate and seed default blog posts with dynamic authorLink
    await BlogPost.destroy({ truncate: true, cascade: true });
    await BlogPost.bulkCreate([
      {
        title: 'The Future of Cloud Computing: Serverless and Beyond',
        category: 'Cloud',
        author: 'Klanvision Tech Team',
        date: 'June 01, 2026',
        readTime: '5 min read',
        views: 124,
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
        excerpt: 'Explore how serverless architectures and multi-cloud strategies are transforming enterprise IT operations.',
        content: 'Cloud computing continues to evolve at a breakneck pace. Serverless architectures represent the next major shift, allowing businesses to run application logic without managing underlying physical or virtual servers.\n\nKey takeaways from this shift include:\n- **No Server Management**: Developers focus entirely on code, leaving provisioning and maintenance to the cloud provider.\n- **Sub-second Scaling**: Resources automatically scale down to zero and scale up instantly with request loads.\n- **Pay-per-use Billing**: Invoices are calculated to the millisecond of execution time rather than idle VM hours.\n\nAs we look beyond simple serverless functions, multi-cloud and edge computing integrations are becoming standard, offering businesses enhanced performance, resilience, and geographic coverage.',
        status: 'Published',
        authorLink: 'https://github.com/klanvision'
      },
      {
        title: 'Mastering Modern UI/UX: Design Patterns for Scaling Web Applications',
        category: 'Design',
        author: 'Alex Rivera',
        date: 'May 28, 2026',
        readTime: '7 min read',
        views: 98,
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
        excerpt: 'Learn premium visual guidelines and micro-animation systems to build responsive interfaces that keep users engaged.',
        content: 'Modern web applications require more than just technical efficiency; they must provide exceptional visual layouts and transitions that captivate users.\n\nDesigning elegant interfaces involves:\n- **Fluid Grid Architecture**: Utilizing adaptive CSS layouts and HSL color variables to support flawless light/dark mode transitions.\n- **Dynamic Micro-animations**: Adding subtle transitions (such as card rises and sliding drawers) that guide user attention naturally.\n- **Consistent Typography Systems**: Creating clear typographic hierarchies using premium fonts (like Poppins and Roboto) to maximize scannability.\n\nBy combining these layout structures with structured state management, developers build intuitive, fast websites that keep visitors engaged longer.',
        status: 'Published',
        authorLink: 'https://linkedin.com/in/alex-rivera-ui'
      },
      {
        title: 'Securing the DevSecOps Pipeline: Continuous Integration Audits',
        category: 'Security',
        author: 'Marcus Chen',
        date: 'May 15, 2026',
        readTime: '6 min read',
        views: 142,
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800',
        excerpt: 'Integrate automated threat modeling and security scans into your continuous delivery pipeline for zero-vulnerability releases.',
        content: 'Security should never be an afterthought. Integrating DevSecOps practices within continuous integration and continuous delivery (CI/CD) pipelines ensures secure, high-quality software releases.\n\nWe recommend implementing these active checks:\n- **Static Application Security Testing (SAST)**: Scanning codebases automatically on every commit to flag syntax vulnerabilities and insecure packages.\n- **Secret Auditing**: Utilizing security keys scanners to block any secrets, passwords, or private environment tokens from being committed to Git.\n- **Strict Identity Management**: Applying the principle of least privilege to automated CI/CD runners and deployment scripts.\n\nEstablishing automated remediation pipelines allows development teams to move fast without compromising on safety.',
        status: 'Published',
        authorLink: 'https://linkedin.com/in/marcus-chen-secops'
      }
    ]);

    console.log('[Seeder] Database seeding successfully validated.');
  } catch (error) {
    console.error('[Seeder Error] Database seeding failed:', error);
  }
};

// Sync database and start server
sequelize.sync({ alter: true }) // Automatically updates database schema safely to match Sequelize definitions
  .then(async () => {
    console.log('[Database] MySQL tables synchronized successfully.');
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`[Server] Node.js Express server listening on http://localhost:${PORT}`);
    });

    // Schedule purging jobs to run once every 24 hours
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    setInterval(purgeOldActivities, TWENTY_FOUR_HOURS);
    // Run purge immediately on startup to clean any stale records
    purgeOldActivities();
  })
  .catch((error) => {
    console.error('[Startup Error] Database connection failed:', error);
  });
