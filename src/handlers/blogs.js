/**
 * src/handlers/blogs.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Blog post routes — ported to Cloudflare D1 (SQLite).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── GET /api/blogs ───────────────────────────────────────────────────────────
export async function getAllPosts(_request, env) {
  const { results } = await env.DB.prepare(
    `SELECT id, title, category, author, date, read_time AS readTime, views, image,
            excerpt, content, status, author_link AS authorLink
     FROM blog_posts
     ORDER BY id DESC`
  ).all();
  return Response.json(results);
}

// ─── POST /api/blogs ──────────────────────────────────────────────────────────
export async function createPost(request, env) {
  const { title, category, author, date, readTime, views, image, excerpt, content, status, authorLink } = await request.json();
  
  const { meta } = await env.DB.prepare(
    `INSERT INTO blog_posts (title, category, author, date, read_time, views, image, excerpt, content, status, author_link)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    title, category, author, date, readTime, views ?? 0,
    image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
    excerpt, content, status, authorLink
  ).run();

  const row = await env.DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(meta.last_row_id).first();
  return Response.json({ ...row, readTime: row.read_time, authorLink: row.author_link });
}

// ─── PUT /api/blogs/:id ───────────────────────────────────────────────────────
export async function updatePost(request, env, { params }) {
  const { id } = params;
  const { title, category, author, date, readTime, views, image, excerpt, content, status, authorLink } = await request.json();
  
  const post = await env.DB.prepare('SELECT id FROM blog_posts WHERE id = ? LIMIT 1').bind(id).first();
  if (!post) return Response.json({ error: 'Blog post not found' }, { status: 404 });

  await env.DB.prepare(
    `UPDATE blog_posts SET title=?, category=?, author=?, date=?, read_time=?, views=?, image=?,
     excerpt=?, content=?, status=?, author_link=? WHERE id=?`
  ).bind(title, category, author, date, readTime, views, image, excerpt, content, status, authorLink, id).run();

  const row = await env.DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first();
  return Response.json({ ...row, readTime: row.read_time, authorLink: row.author_link });
}

// ─── DELETE /api/blogs/:id ────────────────────────────────────────────────────
export async function deletePost(request, env, { params }) {
  const { id } = params;
  
  const post = await env.DB.prepare('SELECT id FROM blog_posts WHERE id = ? LIMIT 1').bind(id).first();
  if (!post) return Response.json({ error: 'Blog post not found' }, { status: 404 });

  await env.DB.prepare('DELETE FROM blog_posts WHERE id = ?').bind(id).run();
  return Response.json({ message: 'Blog post deleted successfully' });
}
