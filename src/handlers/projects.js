/**
 * src/handlers/projects.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Project routes — ported to Cloudflare D1 (SQLite).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── GET /api/projects ────────────────────────────────────────────────────────
export async function getAllProjects(_request, env) {
  const { results: projects } = await env.DB.prepare(
    `SELECT id, title, client, status, progress, start_date AS startDate, deadline,
            color, priority, description, comments
     FROM projects
     ORDER BY id DESC`
  ).all();

  const { results: teams } = await env.DB.prepare(
    `SELECT project_id, assigned_team FROM project_assigned_teams`
  ).all();

  const teamMap = {};
  for (const row of teams) {
    if (!teamMap[row.project_id]) teamMap[row.project_id] = [];
    teamMap[row.project_id].push(row.assigned_team);
  }

  const mapped = projects.map(p => ({
    ...p,
    assignedTeam: teamMap[p.id] || []
  }));

  return Response.json(mapped);
}

// ─── POST /api/projects ───────────────────────────────────────────────────────
export async function createProject(request, env) {
  const body = await request.json();
  const { title, client, status, progress, startDate, deadline, assignedTeam, color, priority, description, comments } = body;
  
  const { meta } = await env.DB.prepare(
    `INSERT INTO projects (title, client, status, progress, start_date, deadline, color, priority, description, comments)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    title, client, status, progress || 0, startDate, deadline, color, priority, description, comments
  ).run();

  const projectId = meta.last_row_id;

  if (assignedTeam && Array.isArray(assignedTeam)) {
    const stmts = assignedTeam.map(team => 
      env.DB.prepare('INSERT INTO project_assigned_teams (project_id, assigned_team) VALUES (?, ?)')
      .bind(projectId, team)
    );
    await env.DB.batch(stmts);
  }

  const row = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first();
  return Response.json({
    id: row.id, title: row.title, client: row.client, status: row.status, progress: row.progress,
    startDate: row.start_date, deadline: row.deadline, color: row.color, priority: row.priority,
    description: row.description, comments: row.comments, assignedTeam: assignedTeam || []
  });
}

// ─── PUT /api/projects/:id ────────────────────────────────────────────────────
export async function updateProject(request, env, { params }) {
  const { id } = params;
  const body = await request.json();
  const { title, client, status, progress, startDate, deadline, assignedTeam, color, priority, description, comments } = body;
  
  const proj = await env.DB.prepare('SELECT id FROM projects WHERE id = ?').bind(id).first();
  if (!proj) return Response.json({ error: 'Project not found' }, { status: 404 });

  await env.DB.prepare(
    `UPDATE projects SET title=?, client=?, status=?, progress=?, start_date=?, deadline=?, color=?, priority=?, description=?, comments=?
     WHERE id=?`
  ).bind(
    title, client, status, progress, startDate, deadline, color, priority, description, comments, id
  ).run();

  if (assignedTeam && Array.isArray(assignedTeam)) {
    await env.DB.prepare('DELETE FROM project_assigned_teams WHERE project_id = ?').bind(id).run();
    const stmts = assignedTeam.map(team => 
      env.DB.prepare('INSERT INTO project_assigned_teams (project_id, assigned_team) VALUES (?, ?)')
      .bind(id, team)
    );
    await env.DB.batch(stmts);
  }

  const row = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
  return Response.json({
    id: row.id, title: row.title, client: row.client, status: row.status, progress: row.progress,
    startDate: row.start_date, deadline: row.deadline, color: row.color, priority: row.priority,
    description: row.description, comments: row.comments, assignedTeam: assignedTeam || []
  });
}

// ─── DELETE /api/projects/:id ─────────────────────────────────────────────────
export async function deleteProject(request, env, { params }) {
  const { id } = params;
  
  const proj = await env.DB.prepare('SELECT id FROM projects WHERE id = ?').bind(id).first();
  if (!proj) return Response.json({ error: 'Project not found' }, { status: 404 });

  await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
  return Response.json({ message: 'Project deleted successfully' });
}
