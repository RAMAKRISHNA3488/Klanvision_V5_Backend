-- schema.sql
-- SQLite Schema for Klanvision Backend (Cloudflare D1)

DROP TABLE IF EXISTS admin_user_permissions;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS candidates;
DROP TABLE IF EXISTS job_applications;
DROP TABLE IF EXISTS blog_posts;
DROP TABLE IF EXISTS job_listings;
DROP TABLE IF EXISTS project_assigned_teams;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS seo_data;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS exam_attempt_answers;
DROP TABLE IF EXISTS exam_attempts;
DROP TABLE IF EXISTS exam_profiles;
DROP TABLE IF EXISTS exam_questions;
DROP TABLE IF EXISTS exams;

CREATE TABLE admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'ADMIN',
  status TEXT DEFAULT 'Offline',
  color TEXT DEFAULT '#6366F1',
  last_active TEXT DEFAULT 'Never',
  is_authorized INTEGER DEFAULT 1,
  is2faenabled INTEGER DEFAULT 1,
  is2faconfigured INTEGER DEFAULT 0,
  secret2fa TEXT,
  failed2faattempts INTEGER DEFAULT 0
);

CREATE TABLE admin_user_permissions (
  admin_user_id INTEGER,
  permission TEXT,
  PRIMARY KEY (admin_user_id, permission),
  FOREIGN KEY (admin_user_id) REFERENCES admins(id) ON DELETE CASCADE
);

CREATE TABLE activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user TEXT,
  action TEXT,
  type TEXT,
  status TEXT,
  details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  dob TEXT,
  gender TEXT,
  qualification TEXT,
  experience TEXT,
  skills TEXT,
  linkedin TEXT,
  portfolio TEXT,
  resume_data BLOB,
  resume_file_name TEXT,
  resume_content_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_title TEXT,
  name TEXT,
  dob TEXT,
  email TEXT,
  phone TEXT,
  gender TEXT,
  qualification TEXT,
  experience TEXT,
  skills TEXT,
  linkedin TEXT,
  portfolio TEXT,
  resume_data BLOB,
  resume_file_name TEXT,
  resume_content_type TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  category TEXT,
  author TEXT,
  date TEXT,
  read_time TEXT,
  views INTEGER DEFAULT 0,
  image TEXT,
  excerpt TEXT,
  content TEXT,
  status TEXT,
  author_link TEXT
);

CREATE TABLE job_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  department TEXT,
  location TEXT,
  type TEXT,
  description TEXT,
  requirements TEXT,
  active INTEGER DEFAULT 1
);

CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  client TEXT,
  status TEXT,
  progress INTEGER,
  start_date TEXT,
  deadline TEXT,
  color TEXT,
  priority TEXT,
  description TEXT,
  comments TEXT
);

CREATE TABLE project_assigned_teams (
  project_id INTEGER,
  assigned_team TEXT,
  PRIMARY KEY (project_id, assigned_team),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE seo_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_title TEXT,
  meta_description TEXT,
  keywords TEXT,
  sitemap_url TEXT,
  google_console_id TEXT,
  robots_txt TEXT
);

CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE,
  setting_value TEXT
);

CREATE TABLE exams (
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

CREATE TABLE exam_questions (
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

CREATE TABLE exam_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  client_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exam_attempts (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress',
  time_taken INTEGER DEFAULT 0,
  score REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at TEXT
);

CREATE TABLE exam_attempt_answers (
  attempt_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_option TEXT,
  marked_for_review INTEGER DEFAULT 0,
  is_visited INTEGER DEFAULT 0,
  PRIMARY KEY (attempt_id, question_id),
  FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES exam_questions(id) ON DELETE CASCADE
);
