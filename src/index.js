/**
 * src/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Cloudflare Workers entry point for the Klanvision backend.
 *
 * Replaces the Node.js Express server (server.js) completely.
 * Uses itty-router for lightweight, Workers-compatible routing.
 *
 * Exports:
 *   fetch     – handles all HTTP requests
 *   scheduled – handles Cloudflare Cron Triggers (daily activity purge)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { AutoRouter, cors, error, json } from 'itty-router';

// ── Route handlers ────────────────────────────────────────────────────────────
import { login as adminLogin, verify2FA, generate2FA, setupAdmin, getAllUsers, createUser, updateUser, deleteUser } from './handlers/admin.js';
import { register as candidateRegister, login as candidateLogin, getProfile, downloadResume } from './handlers/candidates.js';
import { submitApplication, getAllApplications, getResume, deleteApplication } from './handlers/applications.js';
import { getAllActivities, addActivity, purgeOldActivities } from './handlers/activities.js';
import { getAllPosts, createPost, updatePost, deletePost } from './handlers/blogs.js';
import { getActiveJobs, getAllJobs, createJob, updateJob, deleteJob } from './handlers/jobs.js';
import { getAllProjects, createProject, updateProject, deleteProject } from './handlers/projects.js';
import { getSeoSettings, updateSeoSettings } from './handlers/seo.js';
import { runSeed } from './utils/seed.js';

// ─── CORS configuration (matches original Express cors() setup) ───────────────
const { preflight, corsify } = cors({
  origin: (origin, request) => {
    // Read CORS_ORIGIN from env at request time
    const env = request.env;
    const allowed = (env?.CORS_ORIGIN || '*').split(',').map(s => s.trim());
    if (allowed.includes('*')) return '*';
    return allowed.includes(origin) ? origin : undefined;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Seed-Secret'],
  credentials: true,
});

// ─── Router ───────────────────────────────────────────────────────────────────
const router = AutoRouter({
  before: [preflight],          // Handle OPTION preflight before any route
  finally: [corsify, json],     // Add CORS headers + auto-serialize JSON responses
  catch: (err) => error(err),   // Unified error handler
});

// ── Admin routes ──────────────────────────────────────────────────────────────
router.post('/api/admin/login',       (req, env) => adminLogin(req, env));
router.post('/api/admin/verify-2fa',  (req, env) => verify2FA(req, env));
router.get( '/api/admin/generate-2fa',(req, env) => generate2FA(req, env));
router.post('/api/admin/setup',       (req, env) => setupAdmin(req, env));
router.post('/api/admin/seed',        (req, env) => runSeed(req, env));   // One-time seeder

router.get(   '/api/admin/users',       (req, env) => getAllUsers(req, env));
router.post(  '/api/admin/users',       (req, env) => createUser(req, env));
router.put(   '/api/admin/users/:id',   (req, env, ctx) => updateUser(req, env, ctx));
router.delete('/api/admin/users/:id',   (req, env, ctx) => deleteUser(req, env, ctx));

// ── Candidate routes ──────────────────────────────────────────────────────────
router.post('/api/candidates/register',          (req, env) => candidateRegister(req, env));
router.post('/api/candidates/login',             (req, env) => candidateLogin(req, env));
router.get( '/api/candidates/:id',               (req, env, ctx) => getProfile(req, env, ctx));
router.get( '/api/candidates/:id/resume',        (req, env, ctx) => downloadResume(req, env, ctx));

// ── Application routes ────────────────────────────────────────────────────────
router.post(  '/api/applications',           (req, env) => submitApplication(req, env));
router.get(   '/api/applications',           (req, env) => getAllApplications(req, env));
router.get(   '/api/applications/:id/resume',(req, env, ctx) => getResume(req, env, ctx));
router.delete('/api/applications/:id',       (req, env, ctx) => deleteApplication(req, env, ctx));

// ── Activity routes ───────────────────────────────────────────────────────────
router.get( '/api/activities', (req, env) => getAllActivities(req, env));
router.post('/api/activities', (req, env) => addActivity(req, env));

// ── Blog routes ───────────────────────────────────────────────────────────────
router.get(   '/api/blogs',     (req, env) => getAllPosts(req, env));
router.post(  '/api/blogs',     (req, env) => createPost(req, env));
router.put(   '/api/blogs/:id', (req, env, ctx) => updatePost(req, env, ctx));
router.delete('/api/blogs/:id', (req, env, ctx) => deletePost(req, env, ctx));

// ── Job routes ────────────────────────────────────────────────────────────────
router.get(   '/api/jobs/active', (req, env) => getActiveJobs(req, env));
router.get(   '/api/jobs',        (req, env) => getAllJobs(req, env));
router.post(  '/api/jobs',        (req, env) => createJob(req, env));
router.put(   '/api/jobs/:id',    (req, env, ctx) => updateJob(req, env, ctx));
router.delete('/api/jobs/:id',    (req, env, ctx) => deleteJob(req, env, ctx));

// ── Project routes ────────────────────────────────────────────────────────────
router.get(   '/api/projects',     (req, env) => getAllProjects(req, env));
router.post(  '/api/projects',     (req, env) => createProject(req, env));
router.put(   '/api/projects/:id', (req, env, ctx) => updateProject(req, env, ctx));
router.delete('/api/projects/:id', (req, env, ctx) => deleteProject(req, env, ctx));

// ── SEO routes ────────────────────────────────────────────────────────────────
router.get('/api/seo', (req, env) => getSeoSettings(req, env));
router.put('/api/seo', (req, env) => updateSeoSettings(req, env));

// ── Health check ──────────────────────────────────────────────────────────────
router.get('/', () => Response.json({ status: 'ok', service: 'Klanvision API', runtime: 'Cloudflare Workers' }));
router.get('/health', () => Response.json({ status: 'ok' }));

// ─── Worker Exports ───────────────────────────────────────────────────────────
export default {
  /**
   * HTTP fetch handler — called for every incoming HTTP request.
   * Attaches `env` to `request.env` so CORS origin helper can read it.
   */
  async fetch(request, env, ctx) {
    request.env = env; // Make env available inside CORS origin callback
    return router.fetch(request, env, ctx);
  },

  /**
   * Scheduled handler — called by Cloudflare Cron Trigger.
   * Configured in wrangler.toml as: crons = ["0 0 * * *"]
   * Replaces the original setInterval(purgeOldActivities, 24h) in server.js
   */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(purgeOldActivities(env));
  },
};
