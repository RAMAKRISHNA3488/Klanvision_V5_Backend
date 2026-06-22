-- exams_migration.sql
-- Safely creates the missing exam-related tables in Cloudflare D1

CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  test_name TEXT NOT NULL,
  role TEXT NOT NULL,
  type TEXT NOT NULL,
  timer INTEGER DEFAULT 30,
  shuffle INTEGER DEFAULT 1,
  negative_marking INTEGER DEFAULT 1,
  negative_marks REAL DEFAULT 0.25,
  total_questions INTEGER DEFAULT 5,
  total_marks INTEGER DEFAULT 10,
  status TEXT DEFAULT 'Active',
  client_id TEXT DEFAULT 'klanvision-tech',
  client_name TEXT DEFAULT 'Klanvision Technologies',
  client_logo_url TEXT DEFAULT '/logo.png',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  marks INTEGER DEFAULT 2,
  difficulty TEXT DEFAULT 'Medium',
  section_id TEXT DEFAULT 'sec-core',
  section_name TEXT DEFAULT 'Core Technical Concepts',
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  client_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress',
  time_taken INTEGER DEFAULT 0,
  score REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at TEXT
);

CREATE TABLE IF NOT EXISTS exam_attempt_answers (
  attempt_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_option TEXT,
  marked_for_review INTEGER DEFAULT 0,
  is_visited INTEGER DEFAULT 0,
  PRIMARY KEY (attempt_id, question_id),
  FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES exam_questions(id) ON DELETE CASCADE
);
