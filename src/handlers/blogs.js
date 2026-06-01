/**
 * src/handlers/blogs.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Blog post routes — mirrors blogController.js + blogRoutes.js.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDb } from '../db.js';

// ─── GET /api/blogs ───────────────────────────────────────────────────────────
export async function getAllPosts(_request, env) {
  const db = await getDb(env);
  try {
    const [rows] = await db.execute(
      `SELECT id, title, category, author, date, read_time AS readTime, views, image,
              excerpt, content, status, author_link AS authorLink
       FROM blog_posts
       ORDER BY id DESC`
    );
    return Response.json(rows);
  } finally {
    await db.end();
  }
}

// ─── POST /api/blogs ──────────────────────────────────────────────────────────
export async function createPost(request, env) {
  const { title, category, author, date, readTime, views, image, excerpt, content, status, authorLink } = await request.json();
  const db = await getDb(env);
  try {
    const [result] = await db.execute(
      `INSERT INTO blog_posts (title, category, author, date, read_time, views, image, excerpt, content, status, author_link)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        title, category, author, date, readTime, views ?? 0,
        image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
        excerpt, content, status, authorLink
      ]
    );

    const [rows] = await db.execute('SELECT * FROM blog_posts WHERE id = ?', [result.insertId]);
    const row = rows[0];
    return Response.json({ ...row, readTime: row.read_time, authorLink: row.author_link });
  } finally {
    await db.end();
  }
}

// ─── PUT /api/blogs/:id ───────────────────────────────────────────────────────
export async function updatePost(request, env, { params }) {
  const { id } = params;
  const { title, category, author, date, readTime, views, image, excerpt, content, status, authorLink } = await request.json();
  const db = await getDb(env);
  try {
    const [[post]] = await db.execute('SELECT id FROM blog_posts WHERE id = ? LIMIT 1', [id]);
    if (!post) return Response.json({ error: 'Blog post not found' }, { status: 404 });

    await db.execute(
      `UPDATE blog_posts SET title=?, category=?, author=?, date=?, read_time=?, views=?, image=?,
       excerpt=?, content=?, status=?, author_link=? WHERE id=?`,
      [title, category, author, date, readTime, views, image, excerpt, content, status, authorLink, id]
    );

    const [rows] = await db.execute('SELECT * FROM blog_posts WHERE id = ?', [id]);
    const row = rows[0];
    return Response.json({ ...row, readTime: row.read_time, authorLink: row.author_link });
  } finally {
    await db.end();
  }
}

// ─── DELETE /api/blogs/:id ────────────────────────────────────────────────────
export async function deletePost(request, env, { params }) {
  const { id } = params;
  const db = await getDb(env);
  try {
    const [[post]] = await db.execute('SELECT id FROM blog_posts WHERE id = ? LIMIT 1', [id]);
    if (!post) return Response.json({ error: 'Blog post not found' }, { status: 404 });

    await db.execute('DELETE FROM blog_posts WHERE id = ?', [id]);
    return Response.json({ message: 'Blog post deleted successfully' });
  } finally {
    await db.end();
  }
}
