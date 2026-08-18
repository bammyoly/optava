import { query, transaction } from "../../lib/db";
import { generateEmbedding } from "../../lib/bedrock";
import { taskToText, taskMetadata } from "../../lib/memory-text";
import { toVectorString } from "../../lib/embeddings";

export async function listTasks(projectId: string, status?: string) {
  let sql = `SELECT * FROM tasks WHERE project_id = $1`;
  const params: any[] = [projectId];

  if (status) {
    sql += ` AND status = $2`;
    params.push(status);
  }

  sql += ` ORDER BY created_at ASC`;

  const result = await query(sql, params);
  return result.rows;
}

export async function getTask(id: string) {
  const result = await query(
    `SELECT * FROM tasks WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createTask(input: {
  project_id:    string;
  task_code:     string;
  title:         string;
  description?:  string;
  category?:     string;
  status?:       string;
  priority?:     string;
  assignee?:     string;
  due_date?:     string;
}) {
  return transaction(async (client) => {
    const taskResult = await client.query(
      `INSERT INTO tasks
        (project_id, task_code, category, title, description,
         status, priority, assignee, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        input.project_id,
        input.task_code,
        input.category    || null,
        input.title,
        input.description || null,
        input.status      || "backlog",
        input.priority    || "medium",
        input.assignee    || null,
        input.due_date    || null,
      ]
    );

    const task = taskResult.rows[0];

    // Generate + store embedding
    const text = taskToText(task);
    const { embedding } = await generateEmbedding(text);
    const vectorStr = toVectorString(embedding);

    await client.query(
      `INSERT INTO memory_embeddings
        (project_id, source_type, source_id, content, embedding, metadata)
       VALUES ($1, $2, $3, $4, $5::vector, $6)`,
      [
        task.project_id,
        "task",
        task.id,
        text,
        vectorStr,
        JSON.stringify(taskMetadata(task)),
      ]
    );

    return task;
  });
}

export async function updateTask(id: string, updates: {
  title?:       string;
  description?: string;
  status?:      string;
  priority?:    string;
  progress?:    number;
  assignee?:    string;
  due_date?:    string;
}) {
  const setParts: string[] = [];
  const params:   any[]    = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      setParts.push(`${key} = $${idx}`);
      params.push(value);
      idx++;
    }
  }

  if (setParts.length === 0) {
    return getTask(id);
  }

  setParts.push(`updated_at = now()`);
  params.push(id);

  const result = await query(
    `UPDATE tasks SET ${setParts.join(", ")}
     WHERE id = $${idx}
     RETURNING *`,
    params
  );

  return result.rows[0] || null;
}