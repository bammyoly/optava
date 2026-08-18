import { query } from "../../lib/db";

export async function getProject(id: string) {
  const result = await query(
    `SELECT * FROM projects WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getProjectStats(id: string) {
  const [tasksResult, decisionsResult, notesResult, convResult, standupsResult, embResult] =
    await Promise.all([
      query(
        `SELECT status, COUNT(*)::int AS count
         FROM tasks WHERE project_id = $1
         GROUP BY status`,
        [id]
      ),
      query(
        `SELECT COUNT(*)::int AS count FROM decisions WHERE project_id = $1`,
        [id]
      ),
      query(
        `SELECT COUNT(*)::int AS count FROM notes WHERE project_id = $1`,
        [id]
      ),
      query(
        `SELECT COUNT(DISTINCT session_id)::int AS count
         FROM conversations WHERE project_id = $1`,
        [id]
      ),
      query(
        `SELECT COUNT(*)::int AS count FROM standups WHERE project_id = $1`,
        [id]
      ),
      query(
        `SELECT COUNT(*)::int AS count FROM memory_embeddings WHERE project_id = $1`,
        [id]
      ),
    ]);

  const taskCounts: Record<string, number> = {};
  tasksResult.rows.forEach((row) => {
    taskCounts[row.status] = row.count;
  });

  return {
    tasks: {
      total:       Object.values(taskCounts).reduce((a: number, b: number) => a + b, 0),
      by_status:   taskCounts,
    },
    decisions:      decisionsResult.rows[0].count,
    notes:          notesResult.rows[0].count,
    conversations:  convResult.rows[0].count,
    standups:       standupsResult.rows[0].count,
    memory_entries: embResult.rows[0].count,
  };
}