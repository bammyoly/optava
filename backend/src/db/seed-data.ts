import { v4 as uuid } from "uuid";
import type {
  Task,
  Decision,
  Conversation,
  Note,
  Standup,
} from "../lib/types";

/* ═══════════════════════════════════════════════════════════
   PROJECT
   ═══════════════════════════════════════════════════════════ */

export const PROJECT_ID = "11111111-1111-1111-1111-111111111111";

export const project = {
  id:          PROJECT_ID,
  name:        "MemoryBoard Hackathon",
  description: "Building an AI project manager with persistent memory on CockroachDB and AWS Bedrock for the CockroachDB × AWS Hackathon.",
  status:      "active",
};

/* ═══════════════════════════════════════════════════════════
   TASKS
   ═══════════════════════════════════════════════════════════ */

export const tasks: Omit<Task, "created_at" | "updated_at">[] = [

  // ─── Done ───────────────────────────────────────────
  {
    id:          uuid(),
    project_id:  PROJECT_ID,
    task_code:   "MB-001",
    category:    "FRONTEND",
    title:       "Next.js project setup with Tailwind v4",
    description: "Bootstrap Next.js 15 with App Router, TypeScript, and Tailwind CSS v4",
    status:      "done",
    priority:    "high",
    progress:    100,
    assignee:    "Bammy",
    due_date:    null,
  },
  {
    id:          uuid(),
    project_id:  PROJECT_ID,
    task_code:   "MB-002",
    category:    "FRONTEND",
    title:       "Sidebar and layout shell components",
    description: "Build responsive sidebar with navigation and AppShell wrapper",
    status:      "done",
    priority:    "high",
    progress:    100,
    assignee:    "Bammy",
    due_date:    null,
  },
  {
    id:          uuid(),
    project_id:  PROJECT_ID,
    task_code:   "MB-003",
    category:    "FRONTEND",
    title:       "Dark/light theme system with next-themes",
    description: "Implement full theme system with CSS variables and toggle",
    status:      "done",
    priority:    "medium",
    progress:    100,
    assignee:    "Bammy",
    due_date:    null,
  },
  {
    id:          uuid(),
    project_id:  PROJECT_ID,
    task_code:   "MB-004",
    category:    "FRONTEND",
    title:       "Dashboard page with memory health panel",
    description: "Build dashboard with stats, activity feed, and memory status",
    status:      "done",
    priority:    "high",
    progress:    100,
    assignee:    "Bammy",
    due_date:    null,
  },
  {
    id:          uuid(),
    project_id:  PROJECT_ID,
    task_code:   "MB-005",
    category:    "FRONTEND",
    title:       "Chat page with retrieved memory sidebar",
    description: "Core demo page with RAG interface showing retrieved memories",
    status:      "done",
    priority:    "high",
    progress:    100,
    assignee:    "Bammy",
    due_date:    null,
  },

  // ─── In Progress ─────────────────────────────────────
  {
    id:          uuid(),
    project_id:  PROJECT_ID,
    task_code:   "MB-006",
    category:    "BACKEND",
    title:       "Set up CockroachDB Cloud cluster and schema",
    description: "Provision serverless cluster and create initial database schema",
    status:      "in_progress",
    priority:    "high",
    progress:    75,
    assignee:    "Bammy",
    due_date:    new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
  },
  {
    id:          uuid(),
    project_id:  PROJECT_ID,
    task_code:   "MB-007",
    category:    "FRONTEND",
    title:       "Enhanced task board with realistic data",
    description: "Kanban with 4 columns, AI context banners, sprint stats",
    status:      "in_progress",
    priority:    "medium",
    progress:    90,
    assignee:    "Bammy",
    due_date:    null,
  },
  {
    id:          uuid(),
    project_id:  PROJECT_ID,
    task_code:   "MB-105",
    category:    "AI",
    title:       "Draft prompt templates for chat agent",
    description: "System prompts that include retrieved memory context for RAG",
    status:      "in_progress",
    priority:    "high",
    progress:    40,
    assignee:    "Sarah",
    due_date:    null,
  },

  // ─── To Do ───────────────────────────────────────────
  {
    id:          uuid(),
    project_id:  PROJECT_ID,
    task_code:   "MB-101",
    category:    "BACKEND",
    title:       "Enable Amazon Bedrock models access",
    description: "Request access to Claude Haiku and Titan Embed v2 in us-east-1",
    status:      "todo",
    priority:    "high",
    progress:    0,
    assignee:    "Bammy",
    due_date:    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    id:          uuid(),
    project_id:  PROJECT_ID,
    task_code:   "MB-102",
    category:    "BACKEND",
    title:       "Implement Bedrock embedding function",
    description: "Wrapper for Titan Embed v2 to generate 1024-dim vectors",
    status:      "todo",
    priority:    "high",
    progress:    0,
    assignee:    null,
    due_date:    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    id:          uuid(),
    project_id:  PROJECT_ID,
    task_code:   "MB-103",
    category:    "AI",
    title:       "Build vector similarity search helper",
    description: "SQL wrapper for CockroachDB vector operators with cosine distance",
    status:      "todo",
    priority:    "medium",
    progress:    0,
    assignee:    null,
    due_date:    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    id:          uuid(),
    project_id:  PROJECT_ID,
    task_code:   "MB-104",
    category:    "AI",
    title:       "Implement chat agent RAG pipeline",
    description: "Embed query → vector search → context injection → Claude generation",
    status:      "todo",
    priority:    "high",
    progress:    0,
    assignee:    null,
    due_date:    new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
  },

  // ─── Backlog ─────────────────────────────────────────
  {
    id:          uuid(),
    project_id:  PROJECT_ID,
    task_code:   "MB-201",
    category:    "BACKEND",
    title:       "Design agent state machine for multi-step workflows",
    description: "Model state transitions for standup generator using agent_tasks table",
    status:      "backlog",
    priority:    "medium",
    progress:    0,
    assignee:    null,
    due_date:    null,
  },
  {
    id:          uuid(),
    project_id:  PROJECT_ID,
    task_code:   "MB-202",
    category:    "DEVOPS",
    title:       "Set up AWS SAM template for Lambda deployment",
    description: "Package all agents as Lambda functions with API Gateway routes",
    status:      "backlog",
    priority:    "low",
    progress:    0,
    assignee:    "Bammy",
    due_date:    null,
  },
  {
    id:          uuid(),
    project_id:  PROJECT_ID,
    task_code:   "MB-203",
    category:    "AI",
    title:       "Record demo video for hackathon submission",
    description: "3-minute video showcasing memory-first workflow",
    status:      "backlog",
    priority:    "high",
    progress:    0,
    assignee:    "Bammy",
    due_date:    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
];

/* ═══════════════════════════════════════════════════════════
   DECISIONS
   ═══════════════════════════════════════════════════════════ */

export const decisions: Omit<Decision, "created_at">[] = [
  {
    id:           uuid(),
    project_id:   PROJECT_ID,
    title:        "Chose CockroachDB for persistent memory layer",
    context:      "Agents need a memory system that never goes down. Traditional databases have maintenance windows and don't scale well for concurrent agent writes. We evaluated PostgreSQL, MongoDB, and Supabase for the memory backend.",
    rationale:    "CockroachDB provides distributed, always-on architecture with native vector indexing, PostgreSQL compatibility, and zero-downtime scaling — perfect for agentic workloads. Its serverless free tier makes it ideal for a hackathon.",
    alternatives: ["PostgreSQL + Pinecone", "MongoDB + Weaviate", "Supabase + pgvector"],
    category:     "Architecture",
    author:       "Bammy",
  },
  {
    id:           uuid(),
    project_id:   PROJECT_ID,
    title:        "Use Amazon Bedrock Claude Haiku for reasoning",
    context:      "Need a foundation model for agent reasoning that balances cost, latency, and quality for a $0 hackathon build. Considered self-hosted vs. managed inference.",
    rationale:    "Claude Haiku via Bedrock offers the best price-performance for our use case. Bedrock gives us managed inference with no infrastructure to run and native IAM integration.",
    alternatives: ["OpenAI GPT-4", "Anthropic direct API", "AWS Titan Text"],
    category:     "Backend",
    author:       "Bammy",
  },
  {
    id:           uuid(),
    project_id:   PROJECT_ID,
    title:        "Consolidate vector store into CockroachDB",
    context:      "Considered maintaining a separate vector database like Pinecone alongside CockroachDB for structured data. This would give us specialized vector performance but require managing two systems.",
    rationale:    "CockroachDB's native vector indexing eliminates the need for a separate store, preventing consistency gaps and reducing operational complexity. One system of record for all memory.",
    alternatives: ["Pinecone", "Weaviate", "Qdrant", "Milvus"],
    category:     "Architecture",
    author:       "Bammy",
  },
  {
    id:           uuid(),
    project_id:   PROJECT_ID,
    title:        "Adopt Nexus-style dark UI over claymorphism",
    context:      "Initial design used claymorphism but felt too playful for a serious dev tool demo. Judges need to immediately understand this is a production-grade tool.",
    rationale:    "Nexus AI style dark theme with purple accents feels more professional and demo-friendly for hackathon judging. Modern AI command center aesthetic.",
    alternatives: ["Claymorphism", "Glassmorphism", "Neumorphism", "Flat design"],
    category:     "Design",
    author:       "Bammy",
  },
  {
    id:           uuid(),
    project_id:   PROJECT_ID,
    title:        "Serverless Lambda over containerized ECS",
    context:      "Agents can be triggered via API Gateway or scheduled events. Container orchestration adds infrastructure overhead and cost.",
    rationale:    "Lambda gives us $0 cost at hackathon scale, zero infra maintenance, and instant scaling. ECS would be overkill for the demo and add cost.",
    alternatives: ["Amazon ECS", "AWS EKS", "AWS Fargate", "EC2"],
    category:     "Backend",
    author:       "Bammy",
  },
  {
    id:           uuid(),
    project_id:   PROJECT_ID,
    title:        "Next.js 15 App Router for frontend",
    context:      "Need a modern React framework with SSR, easy deployment, and good developer experience for the hackathon timeline.",
    rationale:    "App Router provides better data fetching patterns and Vercel deployment is free. TypeScript out of the box and file-based routing speeds up development.",
    alternatives: ["Vite + React", "Remix", "Astro", "SvelteKit"],
    category:     "Frontend",
    author:       "Bammy",
  },
  {
    id:           uuid(),
    project_id:   PROJECT_ID,
    title:        "Use Tailwind CSS v4 with CSS variables",
    context:      "Need a styling approach that supports dark/light themes elegantly and scales as the design system grows.",
    rationale:    "Tailwind v4's @theme directive with CSS variables gives us true theme switching without duplicating styles. Component classes stay clean and semantic.",
    alternatives: ["CSS Modules", "Styled Components", "Emotion", "Vanilla CSS"],
    category:     "Frontend",
    author:       "Bammy",
  },
  {
    id:           uuid(),
    project_id:   PROJECT_ID,
    title:        "Titan Embed v2 with 1024 dimensions",
    context:      "Choosing embedding model for the vector store. Options ranged from 384 to 3072 dimensions across various providers.",
    rationale:    "Titan Embed v2 at 1024 dimensions balances quality and storage cost. Available in Bedrock alongside Claude, keeping everything in AWS. Much cheaper than OpenAI embeddings.",
    alternatives: ["OpenAI text-embedding-3-large", "Cohere Embed v3", "Titan Embed v1"],
    category:     "AI",
    author:       "Bammy",
  },
];

/* ═══════════════════════════════════════════════════════════
   NOTES
   ═══════════════════════════════════════════════════════════ */

export const notes: Omit<Note, "created_at">[] = [
  {
    id:         uuid(),
    project_id: PROJECT_ID,
    title:      "Architecture discussion — memory layer",
    content:    "Key insight from initial planning: The memory layer isn't just storage, it's the product. If we treat CockroachDB as 'the database' we miss the story. Frame it as 'the memory' throughout the UI and demo. Every judge should walk away thinking about memory as a first-class concern for agentic systems.",
    author:     "Bammy",
    tags:       ["architecture", "positioning", "demo"],
  },
  {
    id:         uuid(),
    project_id: PROJECT_ID,
    title:      "Hackathon judging criteria breakdown",
    content:    "Five judging axes: (1) Agentic Memory Design, (2) Technical Implementation, (3) Real-World Impact, (4) Production Readiness, (5) Creativity. Focus most on #1 and #5 since those differentiate us. Every UI element should reinforce 'memory matters'.",
    author:     "Bammy",
    tags:       ["hackathon", "strategy"],
  },
  {
    id:         uuid(),
    project_id: PROJECT_ID,
    title:      "RAG UI transparency insight",
    content:    "Most RAG apps hide the retrieval step. We should make it visible — show similarity scores, retrieved sources, which memories were used. This is both a great demo moment AND a genuine trust-building UX pattern for production.",
    author:     "Bammy",
    tags:       ["ux", "rag", "differentiation"],
  },
  {
    id:         uuid(),
    project_id: PROJECT_ID,
    title:      "CockroachDB cluster configuration",
    content:    "Provisioned serverless cluster in us-east-1 to match Bedrock region. IP allowlist configured. SQL user memoryboard_admin has full permissions (dev only). Production should use scoped RBAC roles.",
    author:     "Bammy",
    tags:       ["infrastructure", "security"],
  },
  {
    id:         uuid(),
    project_id: PROJECT_ID,
    title:      "Vector dimensions decision",
    content:    "Titan Embed v2 uses 1024 dimensions. This affects our memory_embeddings.embedding column definition and index configuration. Storage per embedding: ~4KB. At 10k memories: ~40MB. Well within free tier.",
    author:     "Bammy",
    tags:       ["ai", "storage", "planning"],
  },
];

/* ═══════════════════════════════════════════════════════════
   CONVERSATIONS
   ═══════════════════════════════════════════════════════════ */

const SESSION_1 = uuid();
const SESSION_2 = uuid();

export const conversations: Omit<Conversation, "created_at">[] = [

  // ─── Session 1: Architecture discussion ──────────────
  {
    id:         uuid(),
    project_id: PROJECT_ID,
    session_id: SESSION_1,
    role:       "user",
    content:    "Why did we choose CockroachDB for the memory layer?",
    metadata:   null,
  },
  {
    id:         uuid(),
    project_id: PROJECT_ID,
    session_id: SESSION_1,
    role:       "assistant",
    content:    "Based on the project memory, CockroachDB was chosen for three key reasons:\n\n1. Always-on availability — critical for agentic systems where memory can't go down.\n2. Native vector indexing — eliminates need for a separate vector store.\n3. PostgreSQL compatibility — reduces integration friction with AWS ecosystem.\n\nThis was documented in the initial architecture decision.",
    metadata:   { retrieved_memories: 3, tokens_used: 156 },
  },
  {
    id:         uuid(),
    project_id: PROJECT_ID,
    session_id: SESSION_1,
    role:       "user",
    content:    "What alternatives did we consider?",
    metadata:   null,
  },
  {
    id:         uuid(),
    project_id: PROJECT_ID,
    session_id: SESSION_1,
    role:       "assistant",
    content:    "We evaluated three main alternatives before choosing CockroachDB:\n\n1. PostgreSQL + Pinecone — Two systems to manage, consistency gaps.\n2. MongoDB + Weaviate — Similar dual-system issues.\n3. Supabase + pgvector — Good option, but not as strong on distributed writes.\n\nThe consolidation of structured and vector data into a single system was the deciding factor.",
    metadata:   { retrieved_memories: 2, tokens_used: 142 },
  },

  // ─── Session 2: Design decisions ─────────────────────
  {
    id:         uuid(),
    project_id: PROJECT_ID,
    session_id: SESSION_2,
    role:       "user",
    content:    "Why did we switch from claymorphism to the Nexus style?",
    metadata:   null,
  },
  {
    id:         uuid(),
    project_id: PROJECT_ID,
    session_id: SESSION_2,
    role:       "assistant",
    content:    "The initial claymorphism design felt too playful for a serious dev tool demo. We switched to a Nexus-inspired dark theme with purple accents because it feels more professional and demo-friendly for hackathon judging. Modern AI command center aesthetic reinforces our positioning.",
    metadata:   { retrieved_memories: 1, tokens_used: 98 },
  },
];

/* ═══════════════════════════════════════════════════════════
   STANDUPS
   ═══════════════════════════════════════════════════════════ */

export const standups: Omit<Standup, "created_at">[] = [
  {
    id:            uuid(),
    project_id:    PROJECT_ID,
    period_start:  new Date(Date.now() - 24 * 60 * 60 * 1000),
    period_end:    new Date(),
    done: [
      { text: "Completed Next.js frontend shell with sidebar and topbar", taskId: "MB-001", source: "task" },
      { text: "Built dashboard with memory health panel",                  taskId: "MB-004", source: "task" },
      { text: "Implemented dark/light theme system",                        taskId: "MB-003", source: "task" },
      { text: "Chat UI with retrieved memory panel finished",              taskId: "MB-005", source: "task" },
    ],
    in_progress: [
      { text: "CockroachDB Cloud cluster and schema setup", taskId: "MB-006", priority: "high" },
      { text: "Chat agent prompt templates",                 taskId: "MB-105", priority: "high" },
    ],
    blockers: [
      { text: "Amazon Bedrock model access requires manual approval — request pending", priority: "high" },
    ],
    focus: [
      { text: "Complete database schema and seed data",       priority: "high" },
      { text: "Enable Bedrock models in AWS Console",         priority: "high" },
      { text: "Implement embedding generation function",       priority: "medium" },
      { text: "Wire chat page to real backend",                priority: "medium" },
    ],
    highlights: [
      "Frontend is 80% complete — well ahead of schedule",
      "Memory-first UI design is unique and demo-friendly",
      "Vector search transparency in chat sets us apart from competitors",
    ],
    confidence:    0.94,
    gen_time_ms:   2300,
    source_counts: { conversations: 12, tasks: 8, decisions: 3, notes: 5 },
  },
];

/* ═══════════════════════════════════════════════════════════
   TEAM MEMBERS
   ═══════════════════════════════════════════════════════════ */

export const teamMembers = [
  {
    id:           uuid(),
    project_id:   PROJECT_ID,
    name:         "Bammy",
    role:         "Full Stack Lead",
    avatar_color: "linear-gradient(135deg, #a78bfa, #7c3aed)",
  },
  {
    id:           uuid(),
    project_id:   PROJECT_ID,
    name:         "Sarah",
    role:         "AI Engineer",
    avatar_color: "linear-gradient(135deg, #60a5fa, #3b82f6)",
  },
  {
    id:           uuid(),
    project_id:   PROJECT_ID,
    name:         "James",
    role:         "DevOps Engineer",
    avatar_color: "linear-gradient(135deg, #34d399, #10b981)",
  },
  {
    id:           uuid(),
    project_id:   PROJECT_ID,
    name:         "Alex",
    role:         "Product Designer",
    avatar_color: "linear-gradient(135deg, #fbbf24, #f59e0b)",
  },
];