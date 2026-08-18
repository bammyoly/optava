//backend/src/api/services/standups.ts

import { query } from "../../lib/db";
import { generateChat } from "../../lib/bedrock";
import { semanticSearch } from "../../lib/embeddings";

export async function listStandups(projectId: string) {
  const result = await query(
    `SELECT * FROM standups
     WHERE project_id = $1
     ORDER BY created_at DESC`,
    [projectId]
  );
  return result.rows;
}

export async function getStandup(id: string) {
  const result = await query(
    `SELECT * FROM standups WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/* ─────────────────────────────────────────────────────────── */
/*  Everything below is NEW                                    */
/* ─────────────────────────────────────────────────────────── */

interface StandupItem {
  text:      string;
  taskId?:   string;
  priority?: "high" | "medium" | "low";
  source?:   string;
}

interface GeneratedContent {
  done:        StandupItem[];
  in_progress: StandupItem[];
  blockers:    StandupItem[];
  focus:       StandupItem[];
  highlights:  string[];
  confidence:  number;
}

function buildStandupPrompt(
  tasks:             Record<string, unknown>[],
  decisions:         Record<string, unknown>[],
  blockerMemories:   { source_type: string; content: string; similarity: number }[],
  completedMemories: { source_type: string; content: string; similarity: number }[]
): string {
  const taskLines = tasks.map((t) =>
    `- [${t.status}] ${t.task_code}: ${t.title} (${t.priority} priority, ${t.progress ?? 0}% done${t.assignee ? `, assigned: ${t.assignee}` : ""})`
  ).join("\n");

  const decisionLines = decisions.length > 0
    ? decisions.map((d) => `- ${d.title}: ${d.rationale}`).join("\n")
    : "None in last 7 days";

  const blockerLines = blockerMemories.length > 0
    ? blockerMemories.map((m) => `- [${m.source_type}] ${m.content.substring(0, 200)}`).join("\n")
    : "None found";

  const completedLines = completedMemories.length > 0
    ? completedMemories.map((m) => `- [${m.source_type}] ${m.content.substring(0, 200)}`).join("\n")
    : "None found";

  return `You are an AI project manager generating a daily standup report.
Analyze the following real project data and produce a structured standup.

CURRENT TASKS (all statuses):
${taskLines}

RECENT DECISIONS (last 7 days):
${decisionLines}

MEMORY — POTENTIAL BLOCKERS (semantic search results):
${blockerLines}

MEMORY — COMPLETED WORK (semantic search results):
${completedLines}

Respond ONLY with valid JSON matching this exact structure. No explanation, no markdown fences:
{
  "done": [
    { "text": "what was completed", "taskId": "MB-XXX or omit", "priority": "high|medium|low", "source": "task" }
  ],
  "in_progress": [
    { "text": "what is actively being worked on", "taskId": "MB-XXX or omit", "priority": "high|medium|low" }
  ],
  "blockers": [
    { "text": "specific blocker or risk", "priority": "high|medium|low" }
  ],
  "focus": [
    { "text": "what to work on next", "taskId": "MB-XXX or omit", "priority": "high|medium|low" }
  ],
  "highlights": [
    "key insight about project patterns (string)"
  ],
  "confidence": 0.94
}

Rules:
- done: tasks with status=done, plus recently completed work from memory
- in_progress: tasks with status=in_progress only
- blockers: real risks, stalled items, missing dependencies — be specific
- focus: backlog and todo tasks most likely to be started next, ordered by priority
- highlights: 2-3 genuine observations about patterns, velocity, or risks
- confidence: float 0.0-1.0 reflecting how complete the data picture is
- taskId: use the task_code field value (e.g. "MB-101"), omit if not applicable
- Keep each text field under 120 characters`;
}

function buildFallback(tasks: Record<string, unknown>[]): GeneratedContent {
  return {
    done: tasks
      .filter((t) => t.status === "done")
      .slice(0, 4)
      .map((t) => ({
        text:     t.title as string,
        taskId:   t.task_code as string,
        priority: t.priority as "high" | "medium" | "low",
        source:   "task",
      })),
    in_progress: tasks
      .filter((t) => t.status === "in_progress")
      .slice(0, 3)
      .map((t) => ({
        text:     t.title as string,
        taskId:   t.task_code as string,
        priority: t.priority as "high" | "medium" | "low",
      })),
    blockers: [],
    focus: tasks
      .filter((t) => t.status === "backlog" || t.status === "todo")
      .slice(0, 3)
      .map((t) => ({
        text:     t.title as string,
        taskId:   t.task_code as string,
        priority: t.priority as "high" | "medium" | "low",
      })),
    highlights: [
      `${tasks.filter((t) => t.status === "done").length} tasks completed`,
      `${tasks.filter((t) => t.status === "in_progress").length} tasks active`,
      "Generated from task data",
    ],
    confidence: 0.70,
  };
}

export async function generateStandup(projectId: string) {
  const start = Date.now();

  // 1. Pull tasks
  const tasksResult = await query(
    `SELECT id, task_code, title, description, status, priority, progress, assignee, category
     FROM tasks WHERE project_id = $1
     ORDER BY CASE status
       WHEN 'in_progress' THEN 1 WHEN 'todo' THEN 2 WHEN 'backlog' THEN 3 WHEN 'done' THEN 4
     END, priority DESC`,
    [projectId]
  );
  const tasks = tasksResult.rows;

  // 2. Pull recent decisions
  const decisionsResult = await query(
    `SELECT title, rationale, category FROM decisions
     WHERE project_id = $1 AND created_at > now() - INTERVAL '7 days'
     ORDER BY created_at DESC LIMIT 8`,
    [projectId]
  );
  const decisions = decisionsResult.rows;

  // 3. Counts
  const notesCount = parseInt((await query(
    `SELECT COUNT(*) as count FROM notes WHERE project_id = $1`, [projectId]
  )).rows[0].count);

  const convsCount = parseInt((await query(
    `SELECT COUNT(DISTINCT session_id) as count FROM conversations WHERE project_id = $1`, [projectId]
  )).rows[0].count);

  // 4. Semantic searches
  const [blockerMemories, completedMemories] = await Promise.all([
    semanticSearch("blocked risk dependency delay problem", { projectId, limit: 5, threshold: 0.35 }),
    semanticSearch("completed finished done shipped", { projectId, limit: 5, threshold: 0.35 }),
  ]);

  // 5. Call Claude
  const prompt = buildStandupPrompt(tasks, decisions, blockerMemories, completedMemories);
  const chatResult = await generateChat(
    [{ role: "user", content: prompt }],
    { system: "You are an AI project manager. Respond only with valid JSON.", maxTokens: 2000, temperature: 0.3 }
  );

  // 6. Parse response
  let generated: GeneratedContent;
  try {
    const cleaned = chatResult.content
      .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    generated = JSON.parse(cleaned);
    if (!generated.done || !generated.in_progress || !generated.blockers || !generated.focus) {
      throw new Error("Missing keys");
    }
  } catch {
    generated = buildFallback(tasks);
  }

  const genTimeMs = Date.now() - start;

  // 7. Store
  const now = new Date();
  const periodStart = new Date(now); periodStart.setHours(0, 0, 0, 0);
  const periodEnd = new Date(now); periodEnd.setHours(23, 59, 59, 999);

  const insertResult = await query(
    `INSERT INTO standups
       (project_id, period_start, period_end, done, in_progress, blockers, focus,
        highlights, confidence, gen_time_ms, source_counts)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      projectId,
      periodStart.toISOString(),
      periodEnd.toISOString(),
      JSON.stringify(generated.done),
      JSON.stringify(generated.in_progress),
      JSON.stringify(generated.blockers),
      JSON.stringify(generated.focus),
      JSON.stringify(generated.highlights),
      generated.confidence,
      genTimeMs,
      JSON.stringify({ conversations: convsCount, tasks: tasks.length, decisions: decisions.length, notes: notesCount }),
    ]
  );

  return insertResult.rows[0];
}