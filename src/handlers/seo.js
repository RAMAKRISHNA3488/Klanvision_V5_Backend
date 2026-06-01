/**
 * src/handlers/seo.js
 * ─────────────────────────────────────────────────────────────────────────────
 * SEO data routes — ported to Cloudflare D1 (SQLite).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── GET /api/seo ─────────────────────────────────────────────────────────────
export async function getSeoSettings(_request, env) {
  const seo = await env.DB.prepare(
    `SELECT site_title AS siteTitle, meta_description AS metaDescription,
            keywords, sitemap_url AS sitemapUrl, google_console_id AS googleConsoleId, robots_txt AS robotsTxt
     FROM seo_data WHERE id = 1`
  ).first();

  if (seo) return Response.json(seo);

  return Response.json({
    siteTitle: '',
    metaDescription: '',
    keywords: '',
    sitemapUrl: '',
    googleConsoleId: '',
    robotsTxt: ''
  });
}

// ─── PUT /api/seo ─────────────────────────────────────────────────────────────
export async function updateSeoSettings(request, env) {
  const { siteTitle, metaDescription, keywords, sitemapUrl, googleConsoleId, robotsTxt } = await request.json();

  const { meta } = await env.DB.prepare(
    `UPDATE seo_data
     SET site_title=?, meta_description=?, keywords=?, sitemap_url=?, google_console_id=?, robots_txt=?
     WHERE id=1`
  ).bind(siteTitle, metaDescription, keywords, sitemapUrl, googleConsoleId, robotsTxt).run();

  if (meta.changes === 0) {
    // Row 1 doesn't exist, insert it
    await env.DB.prepare(
      `INSERT INTO seo_data (id, site_title, meta_description, keywords, sitemap_url, google_console_id, robots_txt)
       VALUES (1, ?, ?, ?, ?, ?, ?)`
    ).bind(siteTitle, metaDescription, keywords, sitemapUrl, googleConsoleId, robotsTxt).run();
  }

  return Response.json({ message: 'SEO settings updated successfully' });
}
