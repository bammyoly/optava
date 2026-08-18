import { query } from "../../lib/db";

/* ─────────────────────────────────────────────────────────── */
/*  Helpers                                                    */
/* ─────────────────────────────────────────────────────────── */

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function deriveWorkload(inProgress: number, totalAssigned: number): string {
  if (inProgress >= 4) return "overloaded";
  if (inProgress >= 1) return "active";
  if (totalAssigned >= 1) return "available";
  return "idle";
}

/* ─────────────────────────────────────────────────────────── */
/*  Stats for a single member                                  */
/* ─────────────────────────────────────────────────────────── */

async function getStats(projectId: string, name: string) {
  const tasksResult = await query(
    `SELECT
       COUNT(*)::int AS tasks_assigned,
       COUNT(*) FILTER (WHERE status = 'done')::int AS tasks_completed,
       COUNT(*) FILTER (WHERE status = 'in_progress')::int AS tasks_in_progress
     FROM tasks
     WHERE project_id = $1 AND assignee = $2`,
    [projectId, name]
  );

  const decisionsResult = await query(
    `SELECT COUNT(*)::int AS count
     FROM decisions
     WHERE project_id = $1 AND author = $2`,
    [projectId, name]
  );

  const notesResult = await query(
    `SELECT COUNT(*)::int AS count
     FROM notes
     WHERE project_id = $1 AND author = $2`,
    [projectId, name]
  );

  const t = tasksResult.rows[0];

  return {
    tasks_assigned:    Number(t.tasks_assigned    || 0),
    tasks_completed:   Number(t.tasks_completed   || 0),
    tasks_in_progress: Number(t.tasks_in_progress || 0),
    decisions_authored: Number(decisionsResult.rows[0].count || 0),
    notes_authored:    Number(notesResult.rows[0].count     || 0),
  };
}

/* ─────────────────────────────────────────────────────────── */
/*  Expertise — derived from task + decision categories        */
/* ─────────────────────────────────────────────────────────── */

async function getExpertise(projectId: string, name: string): Promise<string[]> {
  const result = await query(
    `SELECT category, COUNT(*)::int AS count
     FROM (
       SELECT category FROM tasks
       WHERE project_id = $1 AND assignee = $2 AND category IS NOT NULL
       UNION ALL
       SELECT category FROM decisions
       WHERE project_id = $1 AND author = $2 AND category IS NOT NULL
     ) categories
     GROUP BY category
     ORDER BY count DESC, category ASC
     LIMIT 5`,
    [projectId, name]
  );

  return result.rows.map((r) => r.category as string);
}

/* ─────────────────────────────────────────────────────────── */
/*  Build a full member object                                 */
/* ─────────────────────────────────────────────────────────── */

async function buildMember(row: Record<string, unknown>) {
  const projectId = row.project_id as string;
  const name      = row.name as string;

  const [stats, expertise] = await Promise.all([
    getStats(projectId, name),
    getExpertise(projectId, name),
  ]);

  const workload = deriveWorkload(stats.tasks_in_progress, stats.tasks_assigned);

  const topAreas = expertise.slice(0, 3).join(", ") || "general project work";
  const summary  = `${name} is the ${(row.role as string || "contributor").toLowerCase()}, contributing primarily in ${topAreas}. Currently owns ${stats.tasks_assigned} tasks (${stats.tasks_completed} completed) and has authored ${stats.decisions_authored} decisions.`;

  return {
    id:           row.id,
    name,
    initials:     initialsFromName(name),
    role:         row.role         || "Contributor",
    avatar_color: row.avatar_color || "linear-gradient(135deg, #a78bfa, #7c3aed)",
    stats,
    expertise,
    workload,
    summary,
    created_at:   row.created_at,
  };
}

/* ─────────────────────────────────────────────────────────── */
/*  List all team members with computed stats                  */
/* ─────────────────────────────────────────────────────────── */

export async function listTeam(projectId: string) {
  const result = await query(
    `SELECT * FROM team_members
     WHERE project_id = $1
     ORDER BY created_at ASC`,
    [projectId]
  );

  const members = await Promise.all(result.rows.map(buildMember));

  // Sort by total contribution descending
  return members.sort((a, b) => {
    const scoreA = a.stats.tasks_assigned + a.stats.decisions_authored + a.stats.notes_authored;
    const scoreB = b.stats.tasks_assigned + b.stats.decisions_authored + b.stats.notes_authored;
    return scoreB - scoreA;
  });
}

/* ─────────────────────────────────────────────────────────── */
/*  Get one member with recent activity                        */
/* ─────────────────────────────────────────────────────────── */

export async function getTeamMember(id: string) {
  const result = await query(
    `SELECT * FROM team_members WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) return null;

  const row       = result.rows[0];
  const projectId = row.project_id as string;
  const name      = row.name as string;
  const member    = await buildMember(row);

  const [recentTasks, recentDecisions, recentNotes] = await Promise.all([
    query(
      `SELECT id, task_code, title, status, priority, updated_at
       FROM tasks
       WHERE project_id = $1 AND assignee = $2
       ORDER BY updated_at DESC
       LIMIT 5`,
      [projectId, name]
    ),
    query(
      `SELECT id, title, category, created_at
       FROM decisions
       WHERE project_id = $1 AND author = $2
       ORDER BY created_at DESC
       LIMIT 5`,
      [projectId, name]
    ),
    query(
      `SELECT id, title, created_at
       FROM notes
       WHERE project_id = $1 AND author = $2
       ORDER BY created_at DESC
       LIMIT 5`,
      [projectId, name]
    ),
  ]);

  return {
    ...member,
    recent_tasks:     recentTasks.rows,
    recent_decisions: recentDecisions.rows,
    recent_notes:     recentNotes.rows,
  };
}

/* ─────────────────────────────────────────────────────────── */
/*  Add a team member                                          */
/* ─────────────────────────────────────────────────────────── */

export async function createTeamMember(input: {
  project_id:   string;
  name:         string;
  role?:        string;
  avatar_color?: string;
}) {
  const result = await query(
    `INSERT INTO team_members (project_id, name, role, avatar_color)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      input.project_id,
      input.name,
      input.role || null,
      input.avatar_color || null,
    ]
  );

  return result.rows[0];
}