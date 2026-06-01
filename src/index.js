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

import { AutoRouter, json } from 'itty-router';

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
import { requireAuth } from './utils/auth.js';

const withAuth = (module) => (req, env) => requireAuth(req, env, module);

// ─── Allowed origins ──────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://www.klanvision.com',
  'https://klanvision.com',
];

// ─── CORS header builder ──────────────────────────────────────────────────────
/**
 * Returns CORS headers for a given request origin.
 * Reflects the exact origin back when it is on the allow-list
 * (browsers require the reflected origin when credentials:true).
 */
function getCorsHeaders(requestOrigin) {
  const origin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : null;
  if (!origin) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Seed-Secret',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

// ─── Router (no itty-router cors plugin — we handle CORS manually) ────────────
const router = AutoRouter({
  finally: [json],                      // Auto-serialize JSON responses
  catch: (err) => Response.json(        // Unified error handler
    { error: err.message || 'Internal Server Error' },
    { status: err.status || 500 }
  ),
});

// ── Admin routes ──────────────────────────────────────────────────────────────
router.post('/admin/login', (req, env) => adminLogin(req, env));
router.post('/admin/verify-2fa', (req, env) => verify2FA(req, env));
router.get('/admin/generate-2fa', (req, env) => generate2FA(req, env));
router.post('/admin/setup', (req, env) => setupAdmin(req, env));
router.post('/admin/seed', (req, env) => runSeed(req, env));

router.get('/admin/users', withAuth('Users'), (req, env) => getAllUsers(req, env));
router.post('/admin/users', withAuth('Users'), (req, env) => createUser(req, env));
router.put('/admin/users/:id', withAuth('Users'), (req, env) => updateUser(req, env, { params: req.params }));
router.delete('/admin/users/:id', withAuth('Users'), (req, env) => deleteUser(req, env, { params: req.params }));

// ── Candidate routes ──────────────────────────────────────────────────────────
router.post('/candidates/register', (req, env) => candidateRegister(req, env));
router.post('/candidates/login', (req, env) => candidateLogin(req, env));
router.get('/candidates/:id', (req, env) => getProfile(req, env, { params: req.params }));
router.get('/candidates/:id/resume', (req, env) => downloadResume(req, env, { params: req.params }));

// ── Application routes ────────────────────────────────────────────────────────
router.post('/applications', (req, env) => submitApplication(req, env));
router.get('/applications', (req, env) => getAllApplications(req, env));
router.get('/applications/:id/resume', (req, env) => getResume(req, env, { params: req.params }));
router.delete('/applications/:id', (req, env) => deleteApplication(req, env, { params: req.params }));

// ── Activity routes ───────────────────────────────────────────────────────────
router.get('/activities', withAuth('Activity Log'), (req, env) => getAllActivities(req, env));
router.post('/activities', withAuth('Activity Log'), (req, env) => addActivity(req, env));

// ── Blog routes ───────────────────────────────────────────────────────────────
router.get('/blogs', withAuth('Blogs'), (req, env) => getAllPosts(req, env));
router.post('/blogs', withAuth('Blogs'), (req, env) => createPost(req, env));
router.put('/blogs/:id', withAuth('Blogs'), (req, env) => updatePost(req, env, { params: req.params }));
router.delete('/blogs/:id', withAuth('Blogs'), (req, env) => deletePost(req, env, { params: req.params }));

// ── Job routes ────────────────────────────────────────────────────────────────
router.get('/jobs/active', (req, env) => getActiveJobs(req, env));
router.get('/jobs', withAuth('Projects'), (req, env) => getAllJobs(req, env));
router.post('/jobs', withAuth('Projects'), (req, env) => createJob(req, env));
router.put('/jobs/:id', withAuth('Projects'), (req, env) => updateJob(req, env, { params: req.params }));
router.delete('/jobs/:id', withAuth('Projects'), (req, env) => deleteJob(req, env, { params: req.params }));

// ── Project routes ────────────────────────────────────────────────────────────
router.get('/projects', (req, env) => getAllProjects(req, env));
router.post('/projects', withAuth('Projects'), (req, env) => createProject(req, env));
router.put('/projects/:id', withAuth('Projects'), (req, env) => updateProject(req, env, { params: req.params }));
router.delete('/projects/:id', withAuth('Projects'), (req, env) => deleteProject(req, env, { params: req.params }));

// ── SEO routes ────────────────────────────────────────────────────────────────
router.get('/seo', withAuth('Settings'), (req, env) => getSeoSettings(req, env));
router.put('/seo', withAuth('Settings'), (req, env) => updateSeoSettings(req, env));

// ── Health check ──────────────────────────────────────────────────────────────
router.get('/', () => Response.json({ status: 'ok', service: 'Klanvision API', runtime: 'Cloudflare Workers' }));
router.get('/health', () => Response.json({ status: 'ok' }));

// ── Catch-All 404 (Ensures CORS headers are attached to 404s) ─────────────────
router.all('*', () => new Response('Not Found', { status: 404 }));

// ─── Worker Exports ───────────────────────────────────────────────────────────
export default {
  /**
   * HTTP fetch handler — called for every incoming HTTP request.
   *
   * CORS is handled entirely here so that EVERY response — including 401, 403,
   * 404, and 500 error responses — carries the correct Access-Control-Allow-Origin
   * header. Without this, the browser reports "No 'Access-Control-Allow-Origin'
   * header is present" even when the server does produce a response body.
   */
  async fetch(request, env, ctx) {
    request.env = env;

    const requestOrigin = request.headers.get('Origin') || '';
    const corsHeaders = getCorsHeaders(requestOrigin);

    // ── 1. Handle CORS preflight (OPTIONS) immediately ─────────────────────────
    // Must respond before routing so preflight never hits application logic.
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ── 2. Strip optional /api prefix ─────────────────────────────────────────
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      url.pathname = url.pathname.substring(4); // '/api/foo' → '/foo'
      request = new Request(url.toString(), request);
    }

    // ── 3. Route the request ───────────────────────────────────────────────────
    let response;
    try {
      response = await router.fetch(request, env, ctx);
    } catch (err) {
      response = Response.json(
        { error: err.message || 'Internal Server Error' },
        { status: err.status || 500 }
      );
    }

    // ── 4. Inject CORS headers into EVERY response ─────────────────────────────
    // Even error responses (401, 403, 500) need Access-Control-Allow-Origin so
    // the browser can read the response body and surface the error message.
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      newHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },

  /**
   * Scheduled handler — called by Cloudflare Cron Trigger.
   * Configured in wrangler.toml as: crons = ["0 0 * * *"]
   */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(purgeOldActivities(env));
  },
};
