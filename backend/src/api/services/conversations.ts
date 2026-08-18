import { query } from "../../lib/db";

export async function listSessions(projectId: string) {
  const result = await query(
    `SELECT
       session_id,
       COUNT(*)::int    AS message_count,
       MIN(created_at)  AS started_at,
       MAX(created_at)  AS last_message_at,
       (
         SELECT content FROM conversations c2
         WHERE c2.session_id = c.session_id
         ORDER BY created_at ASC LIMIT 1
       ) AS first_message
     FROM conversations c
     WHERE project_id = $1
     GROUP BY session_id
     ORDER BY last_message_at DESC`,
    [projectId]
  );
  return result.rows;
}

export async function getSession(sessionId: string) {
  const result = await query(
    `SELECT * FROM conversations
     WHERE session_id = $1
     ORDER BY created_at ASC`,
    [sessionId]
  );
  return result.rows;
}