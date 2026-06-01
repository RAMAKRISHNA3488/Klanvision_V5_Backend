# Klanvision Backend — Cloudflare Workers Deploy Guide

## Project Structure (After Migration)

```
Klanvision_backend_node/
├── src/
│   ├── index.js                 ← Main Worker entry (replaces server.js)
│   ├── db.js                    ← MySQL connection via Hyperdrive
│   ├── handlers/
│   │   ├── admin.js             ← /api/admin/*
│   │   ├── candidates.js        ← /api/candidates/*
│   │   ├── applications.js      ← /api/applications/*
│   │   ├── activities.js        ← /api/activities/*
│   │   ├── blogs.js             ← /api/blogs/*
│   │   ├── jobs.js              ← /api/jobs/*
│   │   ├── projects.js          ← /api/projects/*
│   │   └── seo.js               ← /api/seo/*
│   └── utils/
│       ├── totp.js              ← 2FA (Web Crypto, replaces otplib)
│       └── seed.js              ← One-time DB seeder
├── wrangler.toml                ← Cloudflare Workers config
├── package.json                 ← Updated (wrangler + itty-router)
├── .dev.vars                    ← Local dev secrets (git-ignored!)
└── .gitignore
```

---

## Step 1 — Prerequisites

```bash
# Install Wrangler globally (optional, already in devDependencies)
npm install

# Login to Cloudflare
npx wrangler login
```

---

## Step 2 — Create a Hyperdrive Config

Hyperdrive acts as a connection pool between your Worker and MySQL.

```bash
npx wrangler hyperdrive create klanvision-mysql \
  --connection-string="mysql://DB_USER:DB_PASS@DB_HOST:DB_PORT/DB_NAME"
```

This outputs something like:

```
✅ Created Hyperdrive config: klanvision-mysql
ID: abc123def456...
```

**Paste the ID into `wrangler.toml`:**

```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "abc123def456..."   # ← your actual ID
```

> [!IMPORTANT]
> Your MySQL server **must be publicly accessible** from the internet.
> Hyperdrive supports: PlanetScale, Aiven, Railway, Neon (MySQL), or any VPS with a public IP.

---

## Step 3 — Set Production Secrets

These are stored encrypted in Cloudflare, never in code:

```bash
npx wrangler secret put CORS_ORIGIN
# Enter: https://www.klanvision.com,https://admin.klanvision.com

npx wrangler secret put SEED_SECRET
# Enter: a strong random string (used to protect the /api/admin/seed endpoint)
```

> [!NOTE]
> DB credentials are handled via Hyperdrive (baked into the connection string).
> You do NOT need to set DB_HOST, DB_USER etc. as secrets when using Hyperdrive.

---

## Step 4 — Local Development

```bash
# Copy and fill .dev.vars with your local MySQL details (already pre-filled from .env)
npm run dev
# → http://localhost:8787
```

---

## Step 5 — Deploy

```bash
npm run deploy
```

Your Worker will be live at:
`https://klanvision-backend.<your-account>.workers.dev`

---

## Step 6 — Run the Database Seeder (Once)

After first deploy, trigger the seeder to populate jobs, blogs, and SEO defaults:

```bash
curl -X POST https://klanvision-backend.<account>.workers.dev/api/admin/seed \
     -H "X-Seed-Secret: <your-SEED_SECRET>"
```

Expected response:
```json
{
  "success": true,
  "log": [
    "Cleared old admin accounts.",
    "Seeded 6 job listings.",
    "Seeded SEO data.",
    "Seeded 3 blog posts."
  ]
}
```

---

## API Endpoints (unchanged from original)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/verify-2fa` | Verify TOTP code |
| GET | `/api/admin/generate-2fa` | Generate 2FA secret + QR |
| POST | `/api/admin/setup` | First-time admin setup |
| GET | `/api/admin/users` | List all admin users |
| POST | `/api/admin/users` | Create admin user |
| PUT | `/api/admin/users/:id` | Update admin user |
| DELETE | `/api/admin/users/:id` | Delete admin user |
| POST | `/api/candidates/register` | Register candidate |
| POST | `/api/candidates/login` | Candidate login |
| GET | `/api/candidates/:id` | Get candidate profile |
| GET | `/api/candidates/:id/resume` | Download resume |
| POST | `/api/applications` | Submit job application |
| GET | `/api/applications` | Get all applications |
| GET | `/api/applications/:id/resume` | Download application resume |
| DELETE | `/api/applications/:id` | Delete application |
| GET | `/api/activities` | Get audit activities |
| POST | `/api/activities` | Log an activity |
| GET | `/api/blogs` | Get all blog posts |
| POST | `/api/blogs` | Create blog post |
| PUT | `/api/blogs/:id` | Update blog post |
| DELETE | `/api/blogs/:id` | Delete blog post |
| GET | `/api/jobs/active` | Get active job listings |
| GET | `/api/jobs` | Get all job listings |
| POST | `/api/jobs` | Create job listing |
| PUT | `/api/jobs/:id` | Update job listing |
| DELETE | `/api/jobs/:id` | Delete job listing |
| GET | `/api/projects` | Get all projects |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/seo` | Get SEO settings |
| PUT | `/api/seo` | Update SEO settings |
| GET | `/health` | Health check |

---

## Cron Trigger

The activity purge job runs daily at midnight UTC (replaces `setInterval`):
- Configured in `wrangler.toml`: `crons = ["0 0 * * *"]`
- Monitor in Cloudflare Dashboard → Workers → your worker → Triggers

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `HYPERDRIVE is not defined` | Replace `YOUR_HYPERDRIVE_ID_HERE` in `wrangler.toml` with your actual Hyperdrive ID |
| `Cannot connect to DB locally` | Check `.dev.vars` values match your local MySQL |
| `403 on /api/admin/seed` | Set `SEED_SECRET` via `wrangler secret put` and pass in `X-Seed-Secret` header |
| CORS errors from frontend | Update `CORS_ORIGIN` via `wrangler secret put CORS_ORIGIN` |
| QR code not rendering | The QR code is now returned as `data:image/svg+xml;base64,...` — ensure your frontend renders it as an `<img src="...">` tag |
