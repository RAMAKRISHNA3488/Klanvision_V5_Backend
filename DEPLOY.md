# Klanvision Backend — Cloudflare D1 Deploy Guide

We have successfully migrated the application from MySQL (Hyperdrive) to a **100% serverless Cloudflare D1 (SQLite)** architecture.

## Step 1 — Login to Cloudflare

```bash
npx wrangler login
```

## Step 2 — Create the D1 Database

Since D1 runs on Cloudflare's edge, you need to create the database using Wrangler:

```bash
npx wrangler d1 create klanvision-db
```

This will output something like:
```text
✅ Created your new D1 database.

[[d1_databases]]
binding = "DB"
database_name = "klanvision-db"
database_id = "abc123def456..."
```

## Step 3 — Update `wrangler.toml`

Open your `wrangler.toml` file and find this block:
```toml
[[d1_databases]]
binding = "DB"
database_name = "klanvision-db"
database_id = "YOUR_D1_DATABASE_ID_HERE"
```
**Replace `YOUR_D1_DATABASE_ID_HERE` with the actual ID returned from Step 2.**

## Step 4 — Initialize the Database Schema

Run this command to create all the tables inside your new D1 database:

```bash
npx wrangler d1 execute klanvision-db --file=schema.sql --remote
```

## Step 5 — Set Production Secrets

Store your security keys directly in Cloudflare (never in code):

```bash
npx wrangler secret put CORS_ORIGIN
# Enter: https://www.klanvision.com,https://admin.klanvision.com

npx wrangler secret put SEED_SECRET
# Enter: a strong random string (used to protect the /api/admin/seed endpoint)
```

## Step 6 — Deploy to Production

```bash
npm run deploy
```

Your API is now live at:
`https://klanvision-v5-backend.klanphs-solutions.workers.dev`

## Step 7 — Run the Database Seeder (Once)

After deployment, populate the database with default SEO settings, jobs, and blogs:

```bash
curl -X POST https://klanvision-v5-backend.klanphs-solutions.workers.dev/api/admin/seed \
     -H "X-Seed-Secret: <your-SEED_SECRET>"
```
