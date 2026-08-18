# 🧠 MemoryBoard Backend

The backend for MemoryBoard — an AI project manager with persistent memory built on **CockroachDB** and **AWS Bedrock**.

---

## 📋 Overview

This backend provides:

- **Persistent memory storage** via CockroachDB Cloud
- **Vector semantic search** using CockroachDB's native `VECTOR` type
- **AI-powered reasoning** via Amazon Bedrock (Claude Haiku 4.5)
- **Text embeddings** via Amazon Bedrock (Titan Embed v2)
- **Full RAG pipeline** — retrieve relevant memory + augment prompts

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Backend Services                     │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐    │
│  │ Chat Agent │  │ Task Agent │  │ Standup Agent  │    │
│  │  (Lambda)  │  │  (Lambda)  │  │   (Lambda)     │    │
│  └──────┬─────┘  └──────┬─────┘  └────────┬───────┘    │
│         │               │                  │            │
│         └───────────────┼──────────────────┘            │
│                         │                                │
│         ┌───────────────┼───────────────┐               │
│         ▼               ▼               ▼               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  Bedrock   │  │  Memory    │  │  Vector    │        │
│  │  Client    │  │  Storage   │  │  Search    │        │
│  │  (Claude   │  │            │  │            │        │
│  │   + Titan) │  │            │  │            │        │
│  └─────┬──────┘  └──────┬─────┘  └──────┬─────┘        │
│        │                │                │              │
│        └────────────────┼────────────────┘              │
│                         ▼                                │
│              ┌──────────────────────┐                    │
│              │   CockroachDB Cloud   │                   │
│              │   (us-east-1)         │                   │
│              │                       │                   │
│              │  · Structured tables  │                   │
│              │  · VECTOR(1024) index │                   │
│              │  · Cascade deletes    │                   │
│              └──────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer            | Technology                             |
| ---------------- | -------------------------------------- |
| Runtime          | Node.js 20+                            |
| Language         | TypeScript 5.7                         |
| Database         | CockroachDB Cloud (v26.2.1)            |
| Database Driver  | `pg` 8.13                              |
| Vector Type      | Native `VECTOR(1024)`                  |
| Env Management   | `dotenv`                               |
| Dev Runner       | `tsx`                                  |
| Foundation Model | Amazon Bedrock **Claude Haiku 4.5**    |
| Embeddings       | Amazon Bedrock **Titan Embed v2**      |
| AWS SDK          | `@aws-sdk/client-bedrock-runtime`      |
| Compute          | AWS Lambda *(planned)*                 |
| API              | AWS API Gateway *(planned)*            |

---

## 📁 Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── migrations/
│   │   │   └── 001_initial_schema.sql   # All table definitions + vector index
│   │   ├── migrate.ts                    # Migration runner
│   │   ├── reset.ts                      # Drop all tables
│   │   ├── seed.ts                       # Seed demo data
│   │   ├── seed-data.ts                  # Realistic hackathon dataset
│   │   ├── verify.ts                     # Verify seeded data
│   │   ├── embed.ts                      # Generate embeddings for all memory
│   │   ├── search.ts                     # CLI semantic search
│   │   ├── test-connection.ts            # Verify DB connectivity
│   │   ├── test-vector.ts                # Verify vector support
│   │   └── test-bedrock.ts               # Verify Bedrock access
│   ├── lib/
│   │   ├── db.ts                         # Connection pool + query helpers
│   │   ├── bedrock.ts                    # Bedrock client (embeddings + chat)
│   │   ├── embeddings.ts                 # Embedding pipeline + semantic search
│   │   ├── memory-text.ts                # Memory → text conversion
│   │   └── types.ts                      # Shared TypeScript types
│   └── (API layer coming next)
├── .env                                  # Local secrets (gitignored)
├── .env.example                          # Template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🗄️ Database Schema

### Tables Created

| Table                | Purpose                                                  | Row Type          |
| -------------------- | -------------------------------------------------------- | ----------------- |
| `projects`           | Root entity — every memory belongs to a project          | Structured        |
| `tasks`              | Task board data (title, status, priority, assignee)      | Structured        |
| `decisions`          | Decision log (context, rationale, alternatives)          | Structured + JSONB|
| `conversations`      | Chat message history per session                         | Structured + JSONB|
| `standups`           | Generated standups with source counts and confidence     | JSONB-heavy       |
| `notes`              | Freeform notes and observations                          | Structured + JSONB|
| `memory_embeddings`  | **The vector store** — 1024-dim embeddings              | Vector + JSONB    |
| `agent_tasks`        | Execution state for multi-step agent workflows           | JSONB-heavy       |

### Key Design Decisions

**1. Central Embeddings Table**
Instead of putting an `embedding` column on every table, we have a single `memory_embeddings` table with:
- `source_type` (decision, task, conversation, note, standup)
- `source_id` (foreign key to the original record)
- `content` (the text that was embedded)
- `embedding` (1024-dim vector from Titan Embed v2)
- `metadata` (JSONB for flexible display info)

This enables **cross-type semantic search** — a query can retrieve related decisions, tasks, AND conversations in one operation.

**2. UUID Primary Keys**
Every table uses `UUID PRIMARY KEY DEFAULT gen_random_uuid()`.

**3. Cascade Deletes**
All child tables use `ON DELETE CASCADE` from `projects`.

**4. Rich Indexes**
- `(project_id, status)` on tasks
- `(project_id, created_at DESC)` on decisions, notes, standups
- `(session_id, created_at)` on conversations
- **Vector index** on `embedding` for fast similarity search

---

## 🧠 Memory Pipeline

### How It Works

```
┌──────────────────────────────────────────────────────────┐
│  1. Data flows into structured tables                    │
│     (decisions, tasks, notes, conversations, standups)   │
└─────────────────────┬────────────────────────────────────┘
                      ▼
┌──────────────────────────────────────────────────────────┐
│  2. memory-text.ts converts each type to rich text       │
│                                                           │
│     Decision → "DECISION: Chose CockroachDB              │
│                 Category: Architecture                    │
│                 Context: ...                              │
│                 Rationale: ...                            │
│                 Alternatives: ..."                        │
└─────────────────────┬────────────────────────────────────┘
                      ▼
┌──────────────────────────────────────────────────────────┐
│  3. Bedrock Titan Embed v2 generates 1024-dim vector     │
└─────────────────────┬────────────────────────────────────┘
                      ▼
┌──────────────────────────────────────────────────────────┐
│  4. Stored in memory_embeddings with:                    │
│     - source_type + source_id (traceability)             │
│     - content (the embedded text)                         │
│     - embedding (the vector)                              │
│     - metadata (for display in UI)                        │
└─────────────────────┬────────────────────────────────────┘
                      ▼
┌──────────────────────────────────────────────────────────┐
│  5. Query time:                                          │
│     - Embed user query                                    │
│     - Cosine similarity search against all memory        │
│     - Return top matches with similarity scores          │
└──────────────────────────────────────────────────────────┘
```

### Example semantic search query

```sql
SELECT
  source_type,
  content,
  metadata,
  1 - (embedding <=> $1::vector) AS similarity
FROM memory_embeddings
WHERE project_id = $2
ORDER BY embedding <=> $1::vector
LIMIT 5;
```

---

## 🎮 Available Commands

### Database Management
```bash
# Test database connection
npm run db:test

# Verify vector support in your CockroachDB cluster
npm run db:test-vector

# Verify Bedrock model access (Claude + Titan)
npm run db:test-bedrock

# Run all pending migrations
npm run db:migrate

# Drop all tables (destructive!)
npm run db:reset

# Seed demo data
npm run db:seed

# Force reseed (deletes existing project data)
npm run db:seed -- --force

# Verify seeded data
npm run db:verify
```

### Memory Operations
```bash
# Generate embeddings for all seeded memory
npm run db:embed

# Test semantic search with built-in queries
npm run db:search

# Test semantic search with a custom query
npm run db:search -- "why did we choose CockroachDB"
```

---

## ⚙️ Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Create `.env`

Copy the template:

```bash
cp .env.example .env
```

Fill in your credentials:

```env
COCKROACH_URL=postgresql://user:password@host:26257/defaultdb?sslmode=verify-full

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your_secret

BEDROCK_MODEL_ID=us.anthropic.claude-haiku-4-5-20251001-v1:0
BEDROCK_EMBED_MODEL_ID=amazon.titan-embed-text-v2:0
```

### 3. Get Your CockroachDB Connection String

1. Sign up at [cockroachlabs.cloud](https://cockroachlabs.cloud/signup)
2. Create a **Serverless** cluster (free tier) in `us-east-1`
3. Add your IP to the **Networking** allowlist
4. Click **Connect** → copy the connection string

### 4. Enable AWS Bedrock Models

1. Sign in to AWS Console → Bedrock → **Model access**
2. Enable:
   - ✅ **Claude Haiku 4.5** (or Claude 3.5 Haiku)
   - ✅ **Titan Text Embeddings V2**
3. Complete the Anthropic use case form (instant approval)
4. Create IAM user with `AmazonBedrockFullAccess` policy
5. Generate access keys and add to `.env`

**Important:** Claude Haiku 4.5 requires cross-region inference. Use the `us.` prefix:
```
BEDROCK_MODEL_ID=us.anthropic.claude-haiku-4-5-20251001-v1:0
```

### 5. Full Setup Flow

```bash
# Verify connections
npm run db:test              # ✓ CockroachDB
npm run db:test-vector       # ✓ Vector support
npm run db:test-bedrock      # ✓ Bedrock models

# Set up database
npm run db:migrate           # Create all tables
npm run db:seed              # Insert demo data
npm run db:verify            # Confirm data seeded

# Generate memory
npm run db:embed             # Generate embeddings

# Test semantic search
npm run db:search
```

---

## ✅ Backend Progress

### ✅ Phase 1: Infrastructure (COMPLETE)
- [x] CockroachDB Cloud cluster provisioned (`memoryboard-dev`)
- [x] Serverless free tier in `us-east-1`
- [x] IP allowlist configured
- [x] Backend project initialized with TypeScript
- [x] Environment configuration (`.env` with `dotenv`)
- [x] Database connection pool with error handling
- [x] Query and transaction helpers
- [x] Migration runner with intelligent SQL splitting
- [x] Reset command for clean rebuilds
- [x] Connection test utility
- [x] Vector support verification utility
- [x] **8 tables created** with proper indexes
- [x] **Vector index** on `memory_embeddings.embedding`
- [x] Cascade deletes wired via foreign keys

### ✅ Phase 2: Seed Data (COMPLETE)
- [x] TypeScript type definitions for all entities
- [x] Realistic seed data matching frontend demo
- [x] Transaction-safe batch inserts
- [x] Idempotent seed (safe to re-run with `--force`)
- [x] Verification script with breakdown by status/category
- [x] Cascade cleanup on reseed
- [x] Seeded: **15 tasks, 8 decisions, 5 notes, 6 conversations, 1 standup**

### ✅ Phase 3: AWS Bedrock (COMPLETE)
- [x] AWS account and IAM user created
- [x] Bedrock model access enabled:
  - ✅ **Claude Haiku 4.5** (cross-region inference)
  - ✅ **Titan Text Embeddings V2**
- [x] AWS credentials stored securely in `.env`
- [x] AWS SDK installed
- [x] Bedrock client wrapper (`generateEmbedding` + `generateChat`)
- [x] Batch embedding helper with rate limiting
- [x] End-to-end test script verifying both models

### ✅ Phase 4: Embedding Pipeline (COMPLETE)
- [x] Memory-to-text conversion for all 5 source types
- [x] Rich metadata storage alongside embeddings
- [x] Batch embedding pipeline with progress tracking
- [x] Upsert logic (safe to re-run)
- [x] Semantic search with cosine similarity
- [x] Source type filtering
- [x] Similarity threshold filtering
- [x] Command-line search tool with visual similarity bars
- [x] All **35 memory items embedded** and searchable
- [x] Real semantic search working over project data

### ⏳ Phase 5: REST API Layer (UP NEXT)
- [ ] Express server with proper middleware
- [ ] Routes for `/api/decisions`, `/api/tasks`, `/api/chat`, `/api/standup`, `/api/search`
- [ ] CORS setup for frontend
- [ ] Error handling and validation
- [ ] Type-safe response formats
- [ ] Request logging

### ⏳ Phase 6: AI Agents
- [ ] Chat agent (RAG pipeline: query → retrieve → augment → generate)
- [ ] Standup agent (multi-source synthesis over time windows)
- [ ] Task agent (structured extraction from natural language)
- [ ] Prompt templates with retrieved context

### ⏳ Phase 7: Frontend Integration
- [ ] Replace hardcoded chat data with real API calls
- [ ] Wire decisions page to `/api/decisions`
- [ ] Wire tasks board to `/api/tasks`
- [ ] Wire standup generator to `/api/standup`
- [ ] Real-time semantic search in decisions page

### ⏳ Phase 8: Production Deployment
- [ ] AWS SAM template
- [ ] Lambda function packaging
- [ ] API Gateway routes
- [ ] Environment variable management
- [ ] MCP Server configuration
- [ ] End-to-end deployment

---

## 🔒 Security Notes

- **Never commit `.env`** — it's in `.gitignore`
- Connection uses `sslmode=verify-full` (TLS with cert verification)
- CockroachDB Cloud enforces IP allowlisting
- Database user has full DDL/DML permissions (dev only — production should use scoped roles)
- AWS IAM user has `AmazonBedrockFullAccess` (dev only — production should use scoped policies)

---

## 🐛 Troubleshooting

### Connection timeout to CockroachDB
- Check IP allowlist in CockroachDB Cloud → Networking
- Verify port 26257 isn't blocked: `Test-NetConnection host -Port 26257`
- Ensure `sslmode=verify-full` is in your connection string

### Vector type not supported
- Verify CockroachDB version is v24.2 or newer
- Run `npm run db:test-vector` to confirm

### Migration fails halfway
- Run `npm run db:reset` to drop all tables
- Fix the SQL issue
- Run `npm run db:migrate` again

### Bedrock: "Invocation of model ID ... with on-demand throughput isn't supported"
- Claude Haiku 4.5 requires cross-region inference profiles
- Use `us.anthropic.claude-haiku-4-5-...` prefix in `BEDROCK_MODEL_ID`

### Bedrock: "AccessDeniedException"
- Ensure model is enabled in Bedrock → Model access
- Verify IAM user has `AmazonBedrockFullAccess`
- Complete Anthropic's use case form if prompted

### Embeddings running slow
- Titan takes ~500ms per item; 35 items = ~20s total
- Normal for first run; batch has 100ms rate-limit delay
- To speed up, reduce delay in `embeddings.ts` (may hit rate limits)

---

## 📊 Schema Reference

### memory_embeddings (the star table)

```sql
CREATE TABLE memory_embeddings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_type  VARCHAR(50)  NOT NULL,     -- decision, task, conversation, note, standup
  source_id    UUID NOT NULL,
  content      TEXT NOT NULL,
  embedding    VECTOR(1024),               -- Titan Embed v2 dimensions
  metadata     JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE VECTOR INDEX idx_embeddings_vector
  ON memory_embeddings (embedding)
  WITH (min_partition_size = 4);
```

---

## 💡 Example Semantic Search Results

Query: **"Why did we choose our database?"**

```
[1] 💡 decision      ████████████████░░░░ 82.4%
    Chose CockroachDB for persistent memory layer

[2] 💡 decision      █████████████░░░░░░░ 68.1%
    Consolidate vector store into CockroachDB

[3] 💬 conversation  ████████████░░░░░░░░ 63.5%
    Why did we choose CockroachDB for the memory layer?

Retrieved in 512ms
```

Query: **"What UI framework are we using?"**

```
[1] 💡 decision  ██████████████░░░░░░ 71.2%
    Next.js 15 App Router for frontend

[2] 💡 decision  █████████████░░░░░░░ 66.4%
    Use Tailwind CSS v4 with CSS variables

[3] 💡 decision  ████████████░░░░░░░░ 62.1%
    Adopt Nexus-style dark UI over claymorphism

Retrieved in 489ms
```

---

## 🏆 Hackathon Alignment

### CockroachDB Tools Used
- ✅ **Distributed Vector Indexing** — Native `VECTOR(1024)` with dedicated vector index and cosine similarity search
- ⏳ **MCP Server** — To be configured for direct agent access during API build
- ⏳ **ccloud CLI** — For automated backup and cluster management
- ⏳ **Agent Skills Repo** — For query optimization skills

### AWS Services Used
- ✅ **Amazon Bedrock** — Claude Haiku 4.5 (chat) + Titan Embed v2 (embeddings)
- ⏳ **AWS Lambda** — Serverless agent execution (Phase 8)
- ⏳ **API Gateway** — REST endpoints (Phase 8)
- ⏳ **S3** — Document/artifact storage

---

## 📄 License

MIT — see root [LICENSE](../LICENSE)