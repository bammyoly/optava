## README
# 🧠 Optava AI

> An AI project manager with persistent memory, built on
> CockroachDB and AWS Bedrock.

Optava AI is a full-stack agentic project management application
that never forgets. It maintains deep, persistent memory of
every decision, discussion, and task — enabling AI agents to
reason across your entire project history using CockroachDB's
distributed SQL, native vector indexing, and MCP tool calling.

Built for the **CockroachDB × AWS Hackathon**.

---

## 🎯 What It Does

Traditional PM tools store data. Optava **understands** it.

- **Chat with your project memory** — Claude queries CockroachDB
  directly via MCP tools AND via semantic vector search, then
  synthesizes grounded answers with real-time citations
- **Persistent decision log** — Every decision stored with
  rationale and semantically searchable via vector index
- **Context-aware task management** — Kanban board with status,
  priority, filtering, list view, and timeline
- **AI-generated briefings** — Automatic summaries synthesized
  from all memory sources with confidence scoring
- **Semantic memory search** — Powered by CockroachDB native
  VECTOR(1024) indexing and cosine similarity operator
- **Team intelligence** — Who knows what, owns what, and has
  done what — derived entirely from project memory
- **Workspace management** — Multi-project with organization
  structure and role-based context

---

## 🏗️ Architectural Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     USER  (Browser)                          │
│           http://localhost:3000  —  Next.js 15               │
│                                                              │
│  Landing → Setup → Dashboard → Chat → Tasks → Decisions →   │
│            Briefings → Team → Settings                       │
└─────────────────────────┬────────────────────────────────────┘
                          │ REST / HTTP
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              Express API  (Node.js 20+)                      │
│              http://localhost:3001/api                       │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              DUAL-PATH CHAT PIPELINE                   │   │
│  │                                                        │   │
│  │  User message                                          │   │
│  │       │                                                │   │
│  │       ├──────────────────────────────────────────────► │   │
│  │       │         PATH A: Vector Search (RAG)            │   │
│  │       │         Titan Embed → float[1024]              │   │
│  │       │         CockroachDB <=> cosine similarity      │   │
│  │       │         → top 5 memories                       │   │
│  │       │                                                │   │
│  │       └──────────────────────────────────────────────► │   │
│  │                 PATH B: MCP Tool Calling               │   │
│  │                 Claude decides which tools to call     │   │
│  │                 ├── query_project_memory               │   │
│  │                 ├── get_project_decisions              │   │
│  │                 ├── get_project_tasks                  │   │
│  │                 ├── get_memory_stats                   │   │
│  │                 └── run_sql_query                      │   │
│  │                 → direct CockroachDB results           │   │
│  │                                                        │   │
│  │  Both results injected into Claude system prompt       │   │
│  │       │                                                │   │
│  │       ▼                                                │   │
│  │  Claude Haiku 4.5 → grounded response + citations      │   │
│  │       │                                                │   │
│  │       ▼                                                │   │
│  │  Response + vector citations + MCP tools used → UI     │   │
│  │  New messages auto-embedded → memory_embeddings        │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────┬────────────────────────────┬──────────────────┘
               │                            │
               ▼                            ▼
┌──────────────────────────┐   ┌────────────────────────────┐
│    CockroachDB Cloud     │   │      Amazon Bedrock         │
│                          │   │                             │
│  Distributed SQL         │   │  Claude Haiku 4.5           │
│  ──────────────          │   │  ├─ MCP tool planner        │
│  16 tables               │   │  ├─ RAG chat responses      │
│  ACID transactions       │   │  └─ AI briefings            │
│  UUID PKs                │   │                             │
│  JSONB columns           │   │  Titan Embed v2             │
│  Cascade deletes         │   │  ├─ Query embedding         │
│                          │   │  ├─ Decision embedding      │
│  VECTOR(1024) Index      │   │  ├─ Note embedding          │
│  ──────────────          │   │  └─ Conversation embedding  │
│  memory_embeddings       │   └────────────────────────────┘
│  cosine similarity <=>   │
│  CREATE VECTOR INDEX     │
│                          │
│  MCP Tool Layer          │
│  ──────────────          │
│  5 read-only tools       │
│  Claude queries DB       │
│  directly per message    │
└──────────────────────────┘
```

### Memory Write Pipeline

```
Any write  (decision / note / conversation / task)
  │
  ▼
① Structured DB insert
  (decisions / notes / conversations / standups tables)
  │
  ▼
② memory-text.ts converts record → rich text string
  │
  ▼
③ POST to Bedrock Titan Embed v2
  returns float[1024]
  │
  ▼
④ INSERT INTO memory_embeddings
  (project_id, source_type, source_id, content, embedding, metadata)
  │
  ▼
⑤ Instantly queryable via <=> cosine similarity
  AND via MCP tools for direct structured access
```

### RAG + MCP Read Pipeline

```
User sends chat message
  │
  ├─── PATH A: Vector Search ──────────────────────────────────
  │    Embed query → Titan Embed v2 → float[1024]
  │    SELECT ... FROM memory_embeddings
  │    ORDER BY embedding <=> $query_vec::vector LIMIT 5
  │    → top 5 semantically similar memories
  │
  └─── PATH B: MCP Tool Calling ───────────────────────────────
       Claude Haiku (temperature=0) plans which tools to call
       executes in parallel against CockroachDB:
         query_project_memory  → memory_embeddings table
         get_project_decisions → decisions table
         get_project_tasks     → tasks table (real-time status)
         get_memory_stats      → aggregate counts
         run_sql_query         → any SELECT (read-only guard)
       → structured DB results

Both paths merged into Claude system prompt
  │
  ▼
Claude Haiku 4.5 generates grounded response
  │
  ▼
Response + vector citations (%) + MCP tool badges → UI
  │
  ▼
Both messages auto-embedded → memory_embeddings
```

---

## 🛠️ Tech Stack

### Frontend

| Layer     | Technology              | Purpose                      |
|-----------|--------------------------|------------------------------|
| Framework | Next.js 15 (App Router) | React framework with RSC     |
| Language  | TypeScript              | End-to-end type safety       |
| Styling   | Tailwind CSS v4         | Utility-first CSS            |
| State     | TanStack Query v5       | Data fetching + caching      |
| Icons     | Lucide React            | Icon library                 |
| Theming   | next-themes             | Dark / light mode            |

### Backend

| Layer     | Technology        | Purpose                          |
|-----------|--------------------|-----------------------------------|
| Runtime   | Node.js 20+       | Server runtime                   |
| Framework | Express           | HTTP server                      |
| Language  | TypeScript        | End-to-end type safety           |
| Database  | CockroachDB Cloud | Distributed SQL + Vector + MCP   |
| Driver    | pg                 | PostgreSQL-compatible client     |
| AI        | Amazon Bedrock     | Claude Haiku 4.5 + Titan Embed   |

---

## 📁 Project Structure

```
optava/
├── frontend/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── setup/page.tsx              # Create org + project
│   │   └── app/                        # Protected app pages
│   │       ├── layout.tsx              # DB context loader
│   │       ├── page.tsx                # Dashboard (Overview·Analytics·Memory)
│   │       ├── chat/page.tsx           # AI chat + MCP panel
│   │       ├── tasks/page.tsx          # Kanban (Board·Timeline·Backlog)
│   │       ├── decisions/page.tsx      # Log (Timeline·Categories·Insights)
│   │       ├── standup/page.tsx        # AI briefings
│   │       ├── team/page.tsx           # Team (Overview·Expertise·Activity)
│   │       └── settings/page.tsx       # Settings (General·Members·Danger)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx            # Tab-aware layout wrapper
│   │   │   ├── Sidebar.tsx             # Navigation + org context
│   │   │   └── Topbar.tsx              # Tabs + search
│   │   ├── OrgContext.tsx              # Organization React context
│   │   ├── QueryProvider.tsx           # TanStack Query setup
│   │   └── ThemeProvider.tsx           # Theme wrapper
│   ├── hooks/
│   │   └── useApi.ts                   # All typed data fetching hooks
│   ├── lib/
│   │   └── api.ts                      # Typed API client
│   └── middleware.ts                   # Public passthrough
│
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── projects.ts
│   │   │   │   ├── decisions.ts        # CRUD + auto-embed
│   │   │   │   ├── tasks.ts            # CRUD + status updates
│   │   │   │   ├── notes.ts            # CRUD + auto-embed
│   │   │   │   ├── conversations.ts    # Chat session history
│   │   │   │   ├── standups.ts         # AI briefing generation
│   │   │   │   ├── search.ts           # Semantic vector search
│   │   │   │   ├── chat.ts             # RAG + MCP pipeline
│   │   │   │   ├── team.ts             # Team member stats
│   │   │   │   ├── organizations.ts    # Org CRUD
│   │   │   │   ├── org-members.ts      # Member management
│   │   │   │   ├── invitations.ts      # Invite tokens
│   │   │   │   └── debug.ts            # Dev utilities
│   │   │   ├── services/
│   │   │   │   ├── chat.ts             # sendMessage() RAG + MCP
│   │   │   │   ├── standups.ts         # generateStandup()
│   │   │   │   └── ...                 # other service modules
│   │   │   ├── lib/
│   │   │   │   └── response.ts         # JSON envelope
│   │   │   ├── middleware/
│   │   │   │   ├── errorHandler.ts
│   │   │   │   └── logger.ts
│   │   │   └── index.ts                # Express entry point
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   │   └── 001_initial_schema.sql  # 16 tables
│   │   │   ├── migrate.ts
│   │   │   └── reset.ts
│   │   └── lib/
│   │       ├── db.ts                   # CockroachDB pool + tx helper
│   │       ├── bedrock.ts              # Claude + Titan clients
│   │       ├── embeddings.ts           # Vector search wrapper
│   │       ├── mcp-client.ts           # MCP tool definitions + executor
│   │       ├── memory-text.ts          # Record → embeddable text
│   │       └── types.ts                # Shared TypeScript types
│   └── package.json
└── README.md
```

---

## 🗄️ Database Schema (16 Tables)

### User Table

| Table   | Purpose                          |
|---------|-----------------------------------|
| `users` | Workspace members (name, email)  |

### Organization Tables

| Table             | Purpose                                         |
|--------------------|---------------------------------------------------|
| `organizations`   | Workspaces (name, slug, created_by)             |
| `org_members`     | Memberships with roles (owner/admin/member)     |
| `org_invitations` | Email invitation tokens with expiry             |

### Auth Tables (retained for future reintroduction)

| Table                 | Purpose                   |
|------------------------|-----------------------------|
| `accounts`            | OAuth provider links      |
| `sessions`            | Active database sessions  |
| `verification_tokens` | Email verification tokens |

### Project Tables

| Table               | Purpose                                               |
|----------------------|---------------------------------------------------------|
| `projects`          | Projects scoped to an org                             |
| `tasks`             | Kanban tasks — status, priority, assignee             |
| `decisions`         | Decision log — context, rationale, alternatives       |
| `conversations`     | Chat message history by session                       |
| `standups`          | AI-generated briefings with source counts             |
| `notes`             | Freeform memory notes                                 |
| `team_members`      | Named team members with roles and expertise           |
| `memory_embeddings` | **Vector store** — 1024d embeddings for all memory    |
| `agent_tasks`       | Multi-step agent execution state                      |

---

## 🧠 CockroachDB Features Used

### 1. Distributed SQL — 16 Tables

All structured data lives in CockroachDB Cloud. Every write
is ACID transactional. Every read is distributed.

### 2. Native VECTOR(1024) Indexing

```sql
CREATE TABLE memory_embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL,
  source_id   UUID NOT NULL,
  content     TEXT NOT NULL,
  embedding   VECTOR(1024),
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE VECTOR INDEX idx_embeddings_vector
  ON memory_embeddings (embedding)
  WITH (min_partition_size = 4);

-- Used in every chat and search query
SELECT source_type, content, metadata,
  1 - (embedding <=> $1::vector) AS similarity
FROM memory_embeddings
WHERE project_id = $2
ORDER BY embedding <=> $1::vector
LIMIT 5;
```

### 3. MCP Tool Calling (CockroachDB Distributed Vector Indexing)

Claude queries CockroachDB directly via five read-only MCP tools
defined in `mcp-client.ts`. On every chat message, a planner
call asks Claude which tools to use, then executes them in
parallel against CockroachDB before building the final prompt.

```typescript
// mcp-client.ts — tools Claude can call against CockroachDB
export const MCP_TOOLS = [
  "query_project_memory",   // SELECT from memory_embeddings
  "get_project_decisions",  // SELECT from decisions
  "get_project_tasks",      // SELECT from tasks (real-time)
  "get_memory_stats",       // COUNT aggregates across tables
  "run_sql_query",          // Any SELECT (read-only guard)
];

// In chat.ts — planner + executor runs on every message
const mcpResults = await runMCPPlanner(message, projectId);
// Results injected alongside vector search into Claude prompt
```

The UI shows which tools were called per message with blue
badges, and the Memory Context panel has a dedicated MCP
section showing tools used in real time.

### 4. ACID Transactions

Every memory write commits the structured record and its
1024d embedding together or not at all.

```typescript
await transaction(async (client) => {
  await client.query("INSERT INTO decisions ...");
  const { embedding } = await generateEmbedding(text);
  await client.query("INSERT INTO memory_embeddings ...");
  // COMMIT or ROLLBACK — both or neither
});
```

### 5. Additional Features

| Feature         | How Used                                          |
|------------------|-----------------------------------------------------|
| UUID PKs        | `gen_random_uuid()` on all 16 tables              |
| JSONB columns   | metadata, alternatives, tags, source_counts       |
| Cascade deletes | Clean org/project deletion across all child tables|

---

## 🤖 AI Features (Amazon Bedrock)

### RAG + MCP Chat — `POST /api/chat/message`

```
Step 1  Vector search
        Embed query via Titan v2 → float[1024]
        CockroachDB <=> cosine similarity → top 5 memories

Step 2  MCP planning
        Claude (temp=0) decides which tools to call
        Tools execute in parallel against CockroachDB
        Returns structured DB results

Step 3  Prompt assembly
        Vector memories + MCP results injected into
        Claude system prompt as separate labeled sections

Step 4  Response generation
        Claude Haiku 4.5 generates grounded answer
        UI shows vector citations (%) + MCP tool badges

Step 5  Persistence
        Both messages stored in conversations table
        Both re-embedded → memory_embeddings
        MCP tools used persisted in message metadata
```

### AI Briefing — `POST /api/standups/generate`

```
Step 1  Fetch tasks          → structured SQL
Step 2  Fetch decisions      → last 7 days
Step 3  Vector search        → "blocked risk dependency"
Step 4  Vector search        → "completed finished done"
Step 5  Build prompt         → all four sources merged
Step 6  Claude generates JSON → done/in_progress/blockers/focus
Step 7  Store briefing       → confidence score + source counts
```

---

## 🚀 User Flow

```
/ (landing)
  ↓ "Get Started"
/setup
  Step 1: Organization name  → organizations table
  Step 2: Project name       → projects table
  ↓ ACID transaction in CockroachDB
/app (dashboard)
  Overview  → stats · memory health · MCP status · activity
  Analytics → task breakdown · memory distribution
  Memory    → vector store · embedding coverage
  │
  ├── /app/chat       → RAG + MCP · citations · tool badges
  ├── /app/tasks      → Kanban · Timeline · Backlog · New Task
  ├── /app/decisions  → Timeline · Categories · Insights
  ├── /app/standup    → AI briefings · source counts
  ├── /app/team       → Overview · Expertise · Activity
  └── /app/settings   → General · Members · Danger Zone
```

---

## 🌐 API Reference

Base URL: `http://localhost:3001/api`

### Response Envelope

```json
{
  "success": true,
  "data":    {},
  "meta":    {}
}
```

### Key Endpoints

| Method | Path                              | Description                      |
|--------|-------------------------------------|-------------------------------------|
| GET    | `/health`                         | Server health check              |
| GET    | `/projects/:id/stats`             | Project stats + memory counts    |
| POST   | `/decisions`                      | Create + auto-embed decision     |
| POST   | `/tasks`                          | Create task                      |
| PATCH  | `/tasks/:id`                      | Update status / priority         |
| POST   | `/notes`                          | Create + auto-embed note         |
| POST   | `/standups/generate?projectId=X`  | Generate AI briefing             |
| POST   | `/search`                         | Semantic vector search           |
| POST   | `/chat/message`                   | RAG + MCP chat pipeline          |
| POST   | `/organizations`                  | Create org + first project       |
| GET    | `/debug/db-state`                 | Dev — table row counts           |
| POST   | `/debug/ensure-guest-user`        | Dev — seed guest user            |

---

## ⚙️ Setup

### Prerequisites

- Node.js 20+
- CockroachDB Cloud account (free tier)
- AWS account with Bedrock model access:
  - `us.anthropic.claude-haiku-4-5-20251001-v1:0`
  - `amazon.titan-embed-text-v2:0`

### Environment Variables

#### `backend/.env`

```env
COCKROACH_URL=postgresql://user:pass@host:26257/defaultdb?sslmode=verify-full

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
BEDROCK_MODEL_ID=us.anthropic.claude-haiku-4-5-20251001-v1:0
BEDROCK_EMBED_MODEL_ID=amazon.titan-embed-text-v2:0

PORT=3001
FRONTEND_URL=http://localhost:3000
```

#### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
DATABASE_URL=postgresql://user:pass@host:26257/defaultdb?sslmode=verify-full
```

### Installation

```bash
# Backend
cd backend
npm install
npm run db:migrate
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### First Run

```
1. Open http://localhost:3000
2. Click "Get Started"
3. Enter organization name → Continue
4. Enter project name → Create Workspace
5. Dashboard loads — memory layer is live
```

---

## 🏆 Hackathon Alignment

### Required Checklist

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Agentic app using CockroachDB as persistent memory | ✅ | RAG pipeline, 16 tables, vector search, MCP |
| Agent stores, retrieves, and acts on memory | ✅ | Auto-embed on write, retrieval on every chat, briefings from memory |
| CockroachDB Distributed Vector Indexing | ✅ | `VECTOR(1024)` + `CREATE VECTOR INDEX` + `<=>` operator |
| CockroachDB MCP tool calling | ✅ | 5 tools in mcp-client.ts, Claude plans + executes per message |
| Amazon Bedrock (AWS service) | ✅ | Claude Haiku 4.5 + Titan Embed v2 |

### CockroachDB Features

| Feature             | How Used                                              |
|----------------------|----------------------------------------------------------|
| Distributed SQL     | All 16 tables — structured project data               |
| Native VECTOR(1024) | `memory_embeddings` — 1024d per memory record         |
| Vector Index        | `CREATE VECTOR INDEX` — similarity search             |
| Cosine similarity   | `<=>` in every RAG and semantic search query          |
| MCP Tool Calling    | 5 tools — Claude queries DB directly per message      |
| ACID Transactions   | Write + embed atomically on every memory creation     |
| UUID PKs            | Distributed writes without coordination               |
| JSONB columns       | metadata, alternatives, tags, source_counts           |
| Cascade deletes     | Clean org/project deletion                            |

### AWS Services

| Service          | How Used                                              |
|-------------------|----------------------------------------------------------|
| Amazon Bedrock   | Managed model inference — zero infrastructure         |
| Claude Haiku 4.5 | MCP planner + RAG chat + AI briefings                 |
| Titan Embed v2   | 1024d embeddings for every memory write and query     |

### Judging Criteria

| Criterion              | Evidence                                                               |
|-------------------------|---------------------------------------------------------------------------|
| Agentic Memory Design  | RAG + MCP dual pipeline, citations, tool badges, briefing synthesis    |
| Technical Implementation | 16 tables, 30+ endpoints, ACID transactions, MCP, real-time embeddings |
| Real-World Impact      | Full PM workflow — tasks, decisions, chat, briefings, team             |
| Production Readiness   | Shimmer loading, empty states, error handling, retry logic             |
| Creativity             | Memory-first framing, dual-path retrieval, MCP transparency UI         |

---

## 🔮 Planned (Post-Hackathon)

- Google OAuth via Auth.js v5
- Multi-user workspaces with per-user isolation
- Email invitations via Resend
- Session-based org context
- Real-time memory updates via WebSocket

---

## 📄 License

MIT — see [LICENSE](./LICENSE)

---

## 🙏 Acknowledgements

Built for the **CockroachDB × AWS Hackathon**.
Powered by CockroachDB Cloud, Amazon Bedrock, and Next.js 15.
