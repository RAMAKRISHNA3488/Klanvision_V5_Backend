/**
 * src/handlers/exams.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Route handlers for online assessments and exams — Cloudflare D1 (SQLite).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

// --- Helpers to structure questions ---
const generateDefaultQuestions = (examId, roleName) => {
  return [
    {
      id: `${examId}-q1`,
      question_text: `In a production deployment of a ${roleName} project, which of the following is considered the best practice to maximize security and stability?`,
      option_a: "Implementing Principle of Least Privilege (PoLP) and auditing system logs regularly",
      option_b: "Disabling CORS settings completely to prevent connection timeouts",
      option_c: "Running database engines directly on publicly accessible subnets",
      option_d: "Swallowing exceptions globally to avoid showing stack traces to clients",
      correct_answer: "A",
      marks: 2,
      difficulty: "Medium",
      section_id: "sec-core",
      section_name: "Core Technical Concepts"
    },
    {
      id: `${examId}-q2`,
      question_text: `Which of the following standards, libraries, or methodologies is most closely associated with high-performance execution of ${roleName}?`,
      option_a: "Industry-standard caching structures and memory-optimized architectures",
      option_b: "Legacy synchronous polling algorithms",
      option_c: "Client-side graphical styling overrides",
      option_d: "Manual database transactions logging on physical tapes",
      correct_answer: "A",
      marks: 2,
      difficulty: "Easy",
      section_id: "sec-core",
      section_name: "Core Technical Concepts"
    },
    {
      id: `${examId}-q3`,
      question_text: `What is the most effective way to scale a ${roleName} pipeline when handling massive spikes in user traffic or computational workload?`,
      option_a: "Implementing horizontal scaling and asynchronous task queue handlers",
      option_b: "Blindly upgrading single-node memory allocations without indexing",
      option_c: "Enforcing synchronous thread locks on all active write queries",
      option_d: "Migrating the entire codebase to static storage assets",
      correct_answer: "A",
      marks: 3,
      difficulty: "Hard",
      section_id: "sec-adv",
      section_name: "Advanced Scenarios"
    },
    {
      id: `${examId}-q4`,
      question_text: `When designing the system architecture for a ${roleName} component, which design pattern is highly recommended to maintain decoupling?`,
      option_a: "Observer/Event-driven pub-sub systems with proper abstraction interfaces",
      option_b: "Monolithic single-file configurations utilizing global mutable states",
      option_c: "Hard-coding endpoint links directly inside layout controllers",
      option_d: "Synchronous REST calls nested within infinite polling loops",
      correct_answer: "A",
      marks: 2,
      difficulty: "Medium",
      section_id: "sec-adv",
      section_name: "Advanced Scenarios"
    },
    {
      id: `${examId}-q5`,
      question_text: `How should runtime exceptions and system crashes be logged and managed in a standard ${roleName} application?`,
      option_a: "Forwarding telemetry data securely to a centralized APM tool and degrading gracefully",
      option_b: "Printing variables to console standard output without log levels",
      option_c: "Terminating the parent process immediately and forcing a cold restart",
      option_d: "Redirecting users to the home index route silently",
      correct_answer: "A",
      marks: 1,
      difficulty: "Easy",
      section_id: "sec-adv",
      section_name: "Advanced Scenarios"
    }
  ];
};

// ─── 1. GET /exams ───────────────────────────────────────────────────────────
export async function getAllExams(request, env) {
  const { results } = await env.DB.prepare('SELECT * FROM exams ORDER BY created_at DESC').all();
  
  // Format to match Supabase nest pattern clients(name, logo_url)
  const formatted = results.map(exam => ({
    ...exam,
    shuffle: exam.shuffle === 1,
    negative_marking: exam.negative_marking === 1,
    clients: {
      name: exam.client_name,
      logo_url: exam.client_logo_url
    }
  }));

  return Response.json(formatted);
}

// ─── 2. GET /exams/:id ───────────────────────────────────────────────────────
export async function getExamById(request, env, { params }) {
  const { id } = params;
  const exam = await env.DB.prepare('SELECT * FROM exams WHERE id = ?').bind(id).first();
  if (!exam) {
    return Response.json({ error: 'Exam not found' }, { status: 404 });
  }

  const formatted = {
    ...exam,
    shuffle: exam.shuffle === 1,
    negative_marking: exam.negative_marking === 1,
    clients: {
      name: exam.client_name,
      logo_url: exam.client_logo_url
    }
  };

  return Response.json(formatted);
}

// ─── 3. POST /exams ──────────────────────────────────────────────────────────
export async function createExam(request, env) {
  const body = await request.json();
  const { test_name, role, timer, shuffle, negative_marking, negative_marks } = body;

  if (!test_name || !role) {
    return Response.json({ error: 'test_name and role are required' }, { status: 400 });
  }

  const id = slugify(role);
  const type = role.toLowerCase().includes('engineer') || role.toLowerCase().includes('developer') ? 'Full-Time' : 'Internship';

  // Check if exam already exists
  const existing = await env.DB.prepare('SELECT id FROM exams WHERE id = ?').bind(id).first();
  if (existing) {
    return Response.json({ error: 'An exam for this role already exists' }, { status: 400 });
  }

  // Insert Exam
  await env.DB.prepare(
    `INSERT INTO exams (id, test_name, role, type, timer, shuffle, negative_marking, negative_marks, total_questions, total_marks, status, client_id, client_name, client_logo_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 5, 10, 'Active', 'klanvision-tech', 'Klanvision Technologies', '/logo.png')`
  ).bind(
    id,
    test_name,
    role,
    type,
    timer ? parseInt(timer, 10) : 30,
    shuffle ? 1 : 0,
    negative_marking ? 1 : 0,
    negative_marks ? parseFloat(negative_marks) : 0.25
  ).run();

  // Create 5 default questions
  const questions = generateDefaultQuestions(id, role);
  const questionStmts = questions.map(q => 
    env.DB.prepare(
      `INSERT INTO exam_questions (id, exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, difficulty, section_id, section_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(q.id, id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.marks, q.difficulty, q.section_id, q.section_name)
  );
  await env.DB.batch(questionStmts);

  const exam = await env.DB.prepare('SELECT * FROM exams WHERE id = ?').bind(id).first();
  return Response.json({
    ...exam,
    shuffle: exam.shuffle === 1,
    negative_marking: exam.negative_marking === 1,
    clients: {
      name: exam.client_name,
      logo_url: exam.client_logo_url
    }
  }, { status: 201 });
}

// ─── 4. PUT /exams/:id ────────────────────────────────────────────────────────
export async function updateExam(request, env, { params }) {
  const { id } = params;
  const body = await request.json();
  const { test_name, role, timer, shuffle, negative_marking, negative_marks } = body;

  const exam = await env.DB.prepare('SELECT * FROM exams WHERE id = ?').bind(id).first();
  if (!exam) {
    return Response.json({ error: 'Exam not found' }, { status: 404 });
  }

  const newId = slugify(role);

  // Update exam
  await env.DB.prepare(
    `UPDATE exams 
     SET id = ?, test_name = ?, role = ?, timer = ?, shuffle = ?, negative_marking = ?, negative_marks = ? 
     WHERE id = ?`
  ).bind(
    newId,
    test_name,
    role,
    timer ? parseInt(timer, 10) : 30,
    shuffle ? 1 : 0,
    negative_marking ? 1 : 0,
    negative_marks ? parseFloat(negative_marks) : 0.25,
    id
  ).run();

  // If the ID changed, update questions association manually just in case
  if (newId !== id) {
    await env.DB.prepare('UPDATE exam_questions SET exam_id = ? WHERE exam_id = ?').bind(newId, id).run();
  }

  const updated = await env.DB.prepare('SELECT * FROM exams WHERE id = ?').bind(newId).first();
  return Response.json({
    ...updated,
    shuffle: updated.shuffle === 1,
    negative_marking: updated.negative_marking === 1,
    clients: {
      name: updated.client_name,
      logo_url: updated.client_logo_url
    }
  });
}

// ─── 5. DELETE /exams/:id ─────────────────────────────────────────────────────
export async function deleteExam(request, env, { params }) {
  const { id } = params;
  const exam = await env.DB.prepare('SELECT id FROM exams WHERE id = ?').bind(id).first();
  if (!exam) {
    return Response.json({ error: 'Exam not found' }, { status: 404 });
  }

  await env.DB.prepare('DELETE FROM exams WHERE id = ?').bind(id).run();
  return Response.json({ success: true });
}

// ─── 6. POST /exam-profiles ──────────────────────────────────────────────────
export async function upsertProfile(request, env) {
  const body = await request.json();
  const { id, name, email, phone, client_id } = body;

  if (!id || !name || !email) {
    return Response.json({ error: 'id, name and email are required' }, { status: 400 });
  }

  await env.DB.prepare(
    `INSERT INTO exam_profiles (id, name, email, phone, client_id)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       email = excluded.email,
       phone = excluded.phone,
       client_id = excluded.client_id`
  ).bind(id, name, email, phone || null, client_id || null).run();

  return Response.json({ success: true });
}

// ─── 7. GET /attempts ────────────────────────────────────────────────────────
export async function getAttempts(request, env) {
  const url = new URL(request.url);
  const testId = url.searchParams.get('testId');
  const studentId = url.searchParams.get('studentId');
  const status = url.searchParams.get('status');
  const countOnly = url.searchParams.get('count') === 'exact';

  let sql = 'SELECT * FROM exam_attempts WHERE 1=1';
  const bindings = [];

  if (testId) {
    sql += ' AND test_id = ?';
    bindings.push(testId);
  }
  if (studentId) {
    sql += ' AND student_id = ?';
    bindings.push(studentId);
  }
  if (status) {
    sql += ' AND status = ?';
    bindings.push(status);
  }

  if (countOnly) {
    const countSql = `SELECT COUNT(*) AS total FROM (${sql})`;
    const result = await env.DB.prepare(countSql).bind(...bindings).first();
    return Response.json({ count: result ? result.total : 0 });
  }

  const { results } = await env.DB.prepare(sql).bind(...bindings).all();
  return Response.json(results);
}

// ─── 8. POST /attempts ───────────────────────────────────────────────────────
export async function createAttempt(request, env) {
  const body = await request.json();
  const { student_id, test_id, status } = body;

  if (!student_id || !test_id) {
    return Response.json({ error: 'student_id and test_id are required' }, { status: 400 });
  }

  const attemptId = `attempt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  await env.DB.prepare(
    `INSERT INTO exam_attempts (id, student_id, test_id, status, time_taken, score, created_at)
     VALUES (?, ?, ?, ?, 0, 0, datetime('now'))`
  ).bind(attemptId, student_id, test_id, status || 'in_progress').run();

  const attempt = await env.DB.prepare('SELECT * FROM exam_attempts WHERE id = ?').bind(attemptId).first();
  return Response.json(attempt);
}

// ─── 9. GET /attempt-answers ─────────────────────────────────────────────────
export async function getAttemptAnswers(request, env) {
  const url = new URL(request.url);
  const attemptId = url.searchParams.get('attemptId');

  if (!attemptId) {
    return Response.json({ error: 'attemptId query param is required' }, { status: 400 });
  }

  const { results } = await env.DB.prepare('SELECT * FROM exam_attempt_answers WHERE attempt_id = ?').bind(attemptId).all();
  
  // Format for supabase mock client interface expectations
  const formatted = results.map(ans => ({
    ...ans,
    marked_for_review: ans.marked_for_review === 1,
    is_visited: ans.is_visited === 1
  }));

  return Response.json(formatted);
}

// ─── 10. POST /attempt-answers ───────────────────────────────────────────────
export async function upsertAttemptAnswers(request, env) {
  const body = await request.json();
  const rows = Array.isArray(body) ? body : [body];

  if (rows.length === 0) {
    return Response.json({ success: true });
  }

  const stmts = rows.map(r => env.DB.prepare(
    `INSERT INTO exam_attempt_answers (attempt_id, question_id, selected_option, marked_for_review, is_visited)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(attempt_id, question_id) DO UPDATE SET
       selected_option = excluded.selected_option,
       marked_for_review = excluded.marked_for_review,
       is_visited = excluded.is_visited`
  ).bind(
    r.attempt_id,
    r.question_id,
    r.selected_option || null,
    r.marked_for_review ? 1 : 0,
    r.is_visited ? 1 : 0
  ));

  await env.DB.batch(stmts);
  return Response.json({ success: true });
}

// ─── 11. GET /exams/:id/questions ────────────────────────────────────────────
export async function getQuestionsForExam(request, env, { params }) {
  const { id } = params;
  const { results } = await env.DB.prepare('SELECT * FROM exam_questions WHERE exam_id = ?').bind(id).all();
  return Response.json(results);
}

// ─── 12. POST /attempts/:id/submit ───────────────────────────────────────────
export async function submitAttempt(request, env, { params }) {
  const { id } = params; // attempt_id
  const body = await request.json();
  const { timeTaken } = body;

  // 1. Fetch attempt details
  const attempt = await env.DB.prepare('SELECT * FROM exam_attempts WHERE id = ?').bind(id).first();
  if (!attempt) {
    return Response.json({ error: 'Attempt not found' }, { status: 404 });
  }

  // 2. Fetch exam rules
  const exam = await env.DB.prepare('SELECT * FROM exams WHERE id = ?').bind(attempt.test_id).first();
  if (!exam) {
    return Response.json({ error: 'Exam configurations not found' }, { status: 404 });
  }

  // 3. Fetch questions
  const { results: questions } = await env.DB.prepare('SELECT id, correct_answer, marks FROM exam_questions WHERE exam_id = ?').bind(attempt.test_id).all();

  // 4. Fetch attempt answers
  const { results: answers } = await env.DB.prepare('SELECT question_id, selected_option FROM exam_attempt_answers WHERE attempt_id = ?').bind(id).all();

  const answersMap = {};
  answers.forEach(a => {
    answersMap[a.question_id] = a.selected_option;
  });

  // 5. Calculate Score
  let score = 0;
  questions.forEach(q => {
    const selected = answersMap[q.id];
    if (selected === q.correct_answer) {
      score += q.marks || 1;
    } else if (exam.negative_marking === 1 && selected && selected !== '') {
      score -= exam.negative_marks || 0;
    }
  });

  // Ensure score doesn't drop below 0
  const finalScore = Math.max(0, score);

  // 6. Update Attempt in D1
  await env.DB.prepare(
    `UPDATE exam_attempts
     SET status = 'submitted', time_taken = ?, score = ?, submitted_at = datetime('now')
     WHERE id = ?`
  ).bind(timeTaken || 0, finalScore, id).run();

  return Response.json({ success: true, score: finalScore });
}

// ─── 13. POST /exams/:id/questions ───────────────────────────────────────────
export async function createQuestion(request, env, { params }) {
  const { id: examId } = params;
  const body = await request.json();
  const { question_text, option_a, option_b, option_c, option_d, correct_answer, marks, difficulty, section_id, section_name } = body;

  if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
    return Response.json({ error: 'Missing required question fields' }, { status: 400 });
  }

  const questionId = `q-${Date.now()}-${Math.floor(Math.random() * 100)}`;

  await env.DB.prepare(
    `INSERT INTO exam_questions (id, exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, difficulty, section_id, section_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    questionId,
    examId,
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer,
    marks ? parseInt(marks, 10) : 2,
    difficulty || 'Medium',
    section_id || 'sec-core',
    section_name || 'Core Technical Concepts'
  ).run();

  // Recalculate stats for the exam
  const stats = await env.DB.prepare('SELECT COUNT(*) AS count, SUM(marks) AS total_marks FROM exam_questions WHERE exam_id = ?').bind(examId).first();
  await env.DB.prepare('UPDATE exams SET total_questions = ?, total_marks = ? WHERE id = ?').bind(stats.count, stats.total_marks || 0, examId).run();

  const created = await env.DB.prepare('SELECT * FROM exam_questions WHERE id = ?').bind(questionId).first();
  return Response.json(created, { status: 201 });
}

// ─── 14. PUT /questions/:id ──────────────────────────────────────────────────
export async function updateQuestion(request, env, { params }) {
  const { id } = params; // questionId
  const body = await request.json();
  const { question_text, option_a, option_b, option_c, option_d, correct_answer, marks, difficulty, section_id, section_name } = body;

  const existing = await env.DB.prepare('SELECT exam_id FROM exam_questions WHERE id = ?').bind(id).first();
  if (!existing) {
    return Response.json({ error: 'Question not found' }, { status: 404 });
  }

  await env.DB.prepare(
    `UPDATE exam_questions
     SET question_text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_answer = ?, marks = ?, difficulty = ?, section_id = ?, section_name = ?
     WHERE id = ?`
  ).bind(
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer,
    marks ? parseInt(marks, 10) : 2,
    difficulty || 'Medium',
    section_id || 'sec-core',
    section_name || 'Core Technical Concepts',
    id
  ).run();

  // Recalculate stats for the exam
  const examId = existing.exam_id;
  const stats = await env.DB.prepare('SELECT COUNT(*) AS count, SUM(marks) AS total_marks FROM exam_questions WHERE exam_id = ?').bind(examId).first();
  await env.DB.prepare('UPDATE exams SET total_questions = ?, total_marks = ? WHERE id = ?').bind(stats.count, stats.total_marks || 0, examId).run();

  const updated = await env.DB.prepare('SELECT * FROM exam_questions WHERE id = ?').bind(id).first();
  return Response.json(updated);
}

// ─── 15. DELETE /questions/:id ────────────────────────────────────────────────
export async function deleteQuestion(request, env, { params }) {
  const { id } = params; // questionId

  const existing = await env.DB.prepare('SELECT exam_id FROM exam_questions WHERE id = ?').bind(id).first();
  if (!existing) {
    return Response.json({ error: 'Question not found' }, { status: 404 });
  }

  const examId = existing.exam_id;

  await env.DB.prepare('DELETE FROM exam_questions WHERE id = ?').bind(id).run();

  // Recalculate stats for the exam
  const stats = await env.DB.prepare('SELECT COUNT(*) AS count, SUM(marks) AS total_marks FROM exam_questions WHERE exam_id = ?').bind(examId).first();
  await env.DB.prepare('UPDATE exams SET total_questions = ?, total_marks = ? WHERE id = ?').bind(stats.count, stats.total_marks || 0, examId).run();

  return Response.json({ success: true });
}
