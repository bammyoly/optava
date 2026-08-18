-- ═══════════════════════════════════════════════════════════
-- MemoryBoard Schema
-- CockroachDB × AWS Hackathon
-- ═══════════════════════════════════════════════════════════


-- ───────────────────────────────────────────
-- NEXTAUTH: USERS
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(255),
  email          VARCHAR(255) UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email
  ON users (email);


-- ───────────────────────────────────────────
-- NEXTAUTH: ACCOUNTS
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  "userId"            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                VARCHAR(255) NOT NULL,
  provider            VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          INT,
  token_type          VARCHAR(255),
  scope               TEXT,
  id_token            TEXT,
  session_state       TEXT,

  PRIMARY KEY (provider, "providerAccountId")
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_provider
  ON accounts (provider, "providerAccountId");

CREATE INDEX IF NOT EXISTS idx_accounts_user
  ON accounts ("userId");


-- ───────────────────────────────────────────
-- NEXTAUTH: SESSIONS
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  "sessionToken" VARCHAR(255) PRIMARY KEY,
  "userId"       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires        TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user
  ON sessions ("userId");


-- ───────────────────────────────────────────
-- NEXTAUTH: VERIFICATION TOKENS
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token      VARCHAR(255) NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,

  PRIMARY KEY (identifier, token)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_tokens
  ON verification_tokens (identifier, token);


-- ═══════════════════════════════════════════════════════════
-- APP: ORGANIZATIONS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) UNIQUE NOT NULL,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orgs_slug
  ON organizations (slug);

CREATE INDEX IF NOT EXISTS idx_orgs_created_by
  ON organizations (created_by);


-- ───────────────────────────────────────────
-- ORG MEMBERS
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(50) DEFAULT 'member',  -- owner, admin, member
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org
  ON org_members (org_id);

CREATE INDEX IF NOT EXISTS idx_org_members_user
  ON org_members (user_id);


-- ───────────────────────────────────────────
-- ORG INVITATIONS
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       VARCHAR(255) NOT NULL,
  role        VARCHAR(50)  DEFAULT 'member',
  token       UUID         DEFAULT gen_random_uuid(),
  invited_by  UUID         REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ  NOT NULL DEFAULT now() + INTERVAL '7 days',
  created_at  TIMESTAMPTZ  DEFAULT now(),

  UNIQUE (org_id, email)
);

CREATE INDEX IF NOT EXISTS idx_invitations_token
  ON org_invitations (token);

CREATE INDEX IF NOT EXISTS idx_invitations_org
  ON org_invitations (org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invitations_email
  ON org_invitations (email);


-- ═══════════════════════════════════════════════════════════
-- APP: PROJECTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(50)  DEFAULT 'active',
  created_at  TIMESTAMPTZ  DEFAULT now(),
  updated_at  TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_org
  ON projects (org_id);

CREATE INDEX IF NOT EXISTS idx_projects_status
  ON projects (status);


-- ───────────────────────────────────────────
-- TASKS
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_code    VARCHAR(50)  NOT NULL,
  category     VARCHAR(50),
  title        VARCHAR(500) NOT NULL,
  description  TEXT,
  status       VARCHAR(50)  DEFAULT 'backlog',
  priority     VARCHAR(20)  DEFAULT 'medium',
  progress     INT          DEFAULT 0,
  assignee     VARCHAR(255),
  due_date     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  DEFAULT now(),
  updated_at   TIMESTAMPTZ  DEFAULT now(),

  UNIQUE (project_id, task_code)
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_status
  ON tasks (project_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_priority
  ON tasks (priority);


-- ───────────────────────────────────────────
-- DECISIONS
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS decisions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        VARCHAR(500) NOT NULL,
  context      TEXT NOT NULL,
  rationale    TEXT NOT NULL,
  alternatives JSONB,
  category     VARCHAR(50),
  author       VARCHAR(255),
  created_at   TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decisions_project_created
  ON decisions (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_decisions_category
  ON decisions (category);


-- ───────────────────────────────────────────
-- CONVERSATIONS
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id  UUID NOT NULL,
  role        VARCHAR(20)  NOT NULL,
  content     TEXT NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_session
  ON conversations (session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_conversations_project
  ON conversations (project_id, created_at DESC);


-- ───────────────────────────────────────────
-- STANDUPS
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS standups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  period_start   TIMESTAMPTZ  NOT NULL,
  period_end     TIMESTAMPTZ  NOT NULL,
  done           JSONB,
  in_progress    JSONB,
  blockers       JSONB,
  focus          JSONB,
  highlights     JSONB,
  confidence     FLOAT,
  gen_time_ms    INT,
  source_counts  JSONB,
  created_at     TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_standups_project_created
  ON standups (project_id, created_at DESC);


-- ───────────────────────────────────────────
-- NOTES
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       VARCHAR(500),
  content     TEXT NOT NULL,
  author      VARCHAR(255),
  tags        JSONB,
  created_at  TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_project_created
  ON notes (project_id, created_at DESC);


-- ═══════════════════════════════════════════════════════════
-- MEMORY EMBEDDINGS — The Vector Store
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS memory_embeddings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_type  VARCHAR(50)  NOT NULL,
  source_id    UUID NOT NULL,
  content      TEXT NOT NULL,
  embedding    VECTOR(1024),
  metadata     JSONB,
  created_at   TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_project_source
  ON memory_embeddings (project_id, source_type);

CREATE INDEX IF NOT EXISTS idx_embeddings_source
  ON memory_embeddings (source_type, source_id);

CREATE VECTOR INDEX IF NOT EXISTS idx_embeddings_vector
  ON memory_embeddings (embedding)
  WITH (min_partition_size = 4);


-- ───────────────────────────────────────────
-- TEAM MEMBERS
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  role         VARCHAR(255),
  avatar_color VARCHAR(100),
  created_at   TIMESTAMPTZ  DEFAULT now(),

  UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_team_project
  ON team_members (project_id);


-- ───────────────────────────────────────────
-- AGENT TASKS
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_type    VARCHAR(100) NOT NULL,
  status       VARCHAR(50)  DEFAULT 'pending',
  input        JSONB,
  output       JSONB,
  current_step VARCHAR(100),
  error        TEXT,
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_status
  ON agent_tasks (status, created_at DESC);