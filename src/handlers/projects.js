/**
 * src/handlers/projects.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Project routes — mirrors projectController.js + projectRoutes.js.
 * assignedTeam is stored in the project_assigned_teams join table.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDb } from '../db.js';

const COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#7C3AED'];

// ─── GET /api/projects ────────────────────────────────────────────────────────
export async function getAllProjects(_request, env) {
  const db = await getDb(env);
  try {
    const [projects] = await db.execute(
      `SELECT id, title, client, status, progress, start_date AS startDate, deadline,
              color, priority, description, comments FROM projects ORDER BY id`
    );
    const [teams] = await db.execute('SELECT project_id, assigned_team FROM project_assigned_teams');

    const teamMap = {};
    for (const t of teams) {
      if (!teamMap[t.project_id]) teamMap[t.project_id] = [];
      teamMap[t.project_id].push(t.assigned_team);
    }

    const mapped = projects.map(p => ({ ...p, assignedTeam: teamMap[p.id] || [] }));
    return Response.json(mapped);
  } finally {
    await db.end();
  }
}

// ─── POST /api/projects ───────────────────────────────────────────────────────
export async function createProject(request, env) {
  const { title, client, status, progress, startDate, deadline, assignedTeam, color, priority, description, comments } = await request.json();
  const db = await getDb(env);
  try {
    const resolvedColor = color || COLORS[Math.floor(Math.random() * COLORS.length)];
    const [result] = await db.execute(
      `INSERT INTO projects (title, client, status, progress, start_date, deadline, color, priority, description, comments)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [title, client, status, progress ?? 0, startDate, deadline, resolvedColor, priority, description, comments]
    );
    const projectId = result.insertId;

    if (assignedTeam && Array.isArray(assignedTeam)) {
      for (const member of assignedTeam) {
        await db.execute(
          'INSERT INTO project_assigned_teams (project_id, assigned_team) VALUES (?,?)',
          [projectId, member]
        );
      }
    }

    return Response.json({ id: projectId, title, client, status, progress, startDate, deadline, color: resolvedColor, priority, description, comments, assignedTeam: assignedTeam || [] });
  } finally {
    await db.end();
  }
}

// ─── PUT /api/projects/:id ────────────────────────────────────────────────────
export async function updateProject(request, env, { params }) {
  const { id } = params;
  const { title, client, status, progress, startDate, deadline, assignedTeam, color, priority, description, comments } = await request.json();
  const db = await getDb(env);
  try {
    const [[project]] = await db.execute('SELECT id FROM projects WHERE id = ? LIMIT 1', [id]);
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

    await db.execute(
      `UPDATE projects SET title=?, client=?, status=?, progress=?, start_date=?, deadline=?,
       color=?, priority=?, description=?, comments=? WHERE id=?`,
      [title, client, status, progress, startDate, deadline, color, priority, description, comments, id]
    );

    if (assignedTeam && Array.isArray(assignedTeam)) {
      await db.execute('DELETE FROM project_assigned_teams WHERE project_id = ?', [id]);
      for (const member of assignedTeam) {
        await db.execute(
          'INSERT INTO project_assigned_teams (project_id, assigned_team) VALUES (?,?)',
          [id, member]
        );
      }
    }

    return Response.json({ id: parseInt(id), title, client, status, progress, startDate, deadline, color, priority, description, comments, assignedTeam: assignedTeam || [] });
  } finally {
    await db.end();
  }
}

// ─── DELETE /api/projects/:id ─────────────────────────────────────────────────
export async function deleteProject(request, env, { params }) {
  const { id } = params;
  const db = await getDb(env);
  try {
    const [[project]] = await db.execute('SELECT id FROM projects WHERE id = ? LIMIT 1', [id]);
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

    await db.execute('DELETE FROM projects WHERE id = ?', [id]);
    return Response.json({ message: 'Project deleted successfully' });
  } finally {
    await db.end();
  }
}
