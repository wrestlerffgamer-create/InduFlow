-- FlowForge development schema. Run once against an empty PostgreSQL database:
-- psql -U postgres -d flowforge -f database/schema.sql

CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE CHECK (code IN ('design', 'production', 'quality', 'dispatch')),
  name TEXT NOT NULL UNIQUE
);

INSERT INTO departments (id, code, name) VALUES
  (1, 'design', 'Design'),
  (2, 'production', 'Production'),
  (3, 'quality', 'Quality Checking'),
  (4, 'dispatch', 'Dispatch')
ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name;

SELECT setval(pg_get_serial_sequence('departments', 'id'), (SELECT MAX(id) FROM departments));

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'ceo', 'worker', 'design_head', 'production_head', 'quality_head', 'dispatch_head')),
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (role IN ('worker', 'design_head', 'production_head', 'quality_head', 'dispatch_head') AND department_id IS NOT NULL)
    OR role IN ('admin', 'ceo')
  )
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
  durations JSONB NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS workflow_stages (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  stage_position SMALLINT NOT NULL CHECK (stage_position BETWEEN 1 AND 4),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
  expected_duration NUMERIC(10,2) NOT NULL CHECK (expected_duration > 0),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE (order_id, department_id),
  UNIQUE (order_id, stage_position)
);

CREATE TABLE IF NOT EXISTS stage_progress (
  id SERIAL PRIMARY KEY,
  workflow_stage_id INTEGER NOT NULL REFERENCES workflow_stages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMPTZ,
  UNIQUE (workflow_stage_id, user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  type TEXT NOT NULL CHECK (type IN ('suggestion', 'grievance')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_requests (
  id SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('add_worker', 'remove_worker')),
  worker_name TEXT,
  worker_email TEXT,
  target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (request_type = 'add_worker' AND worker_name IS NOT NULL AND worker_email IS NOT NULL)
    OR (request_type = 'remove_worker' AND target_user_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS workflow_stages_active_idx ON workflow_stages (status, started_at);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stage_progress_stage_idx ON stage_progress (workflow_stage_id, status);
