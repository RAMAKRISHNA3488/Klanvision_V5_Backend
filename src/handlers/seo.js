/**
 * src/handlers/seo.js
 * ─────────────────────────────────────────────────────────────────────────────
 * SEO data routes — mirrors seoController.js + seoRoutes.js.
 * Only a single row is ever stored (upsert pattern).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDb } from '../db.js';

const DEFAULT_SEO = {
  siteTitle: 'Klanvision IT Solutions',
  metaDescription: 'Professional and Expert Engineers. Certified IT products trusted by enterprise clients worldwide.',
  keywords: 'Engineering, Design, Software Development, IT Consulting, API Integration',
  sitemapUrl: 'https://klanvision.com/sitemap.xml',
  googleConsoleId: 'G-KLANVISION',
  robotsTxt: 'User-agent: *\nAllow: /'
};

function rowToApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    siteTitle: row.site_title,
    metaDescription: row.meta_description,
    keywords: row.keywords,
    sitemapUrl: row.sitemap_url,
    googleConsoleId: row.google_console_id,
    robotsTxt: row.robots_txt,
  };
}

// ─── GET /api/seo ─────────────────────────────────────────────────────────────
export async function getSEOData(_request, env) {
  const db = await getDb(env);
  try {
    const [rows] = await db.execute('SELECT * FROM seo_data LIMIT 1');
    if (rows[0]) return Response.json(rowToApi(rows[0]));

    // Auto-create defaults if table is empty
    const [result] = await db.execute(
      `INSERT INTO seo_data (site_title, meta_description, keywords, sitemap_url, google_console_id, robots_txt)
       VALUES (?,?,?,?,?,?)`,
      [DEFAULT_SEO.siteTitle, DEFAULT_SEO.metaDescription, DEFAULT_SEO.keywords,
       DEFAULT_SEO.sitemapUrl, DEFAULT_SEO.googleConsoleId, DEFAULT_SEO.robotsTxt]
    );
    return Response.json({ id: result.insertId, ...DEFAULT_SEO });
  } finally {
    await db.end();
  }
}

// ─── PUT /api/seo ─────────────────────────────────────────────────────────────
export async function updateSEOData(request, env) {
  const { siteTitle, metaDescription, keywords, sitemapUrl, googleConsoleId, robotsTxt } = await request.json();
  const db = await getDb(env);
  try {
    const [rows] = await db.execute('SELECT id FROM seo_data LIMIT 1');

    if (rows[0]) {
      await db.execute(
        `UPDATE seo_data SET site_title=?, meta_description=?, keywords=?, sitemap_url=?, google_console_id=?, robots_txt=? WHERE id=?`,
        [siteTitle, metaDescription, keywords, sitemapUrl, googleConsoleId, robotsTxt, rows[0].id]
      );
      const [updated] = await db.execute('SELECT * FROM seo_data WHERE id = ?', [rows[0].id]);
      return Response.json(rowToApi(updated[0]));
    }

    const [result] = await db.execute(
      `INSERT INTO seo_data (site_title, meta_description, keywords, sitemap_url, google_console_id, robots_txt)
       VALUES (?,?,?,?,?,?)`,
      [siteTitle, metaDescription, keywords, sitemapUrl, googleConsoleId, robotsTxt]
    );
    return Response.json({ id: result.insertId, siteTitle, metaDescription, keywords, sitemapUrl, googleConsoleId, robotsTxt });
  } finally {
    await db.end();
  }
}
