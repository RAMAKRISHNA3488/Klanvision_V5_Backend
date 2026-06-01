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
