import { query, transaction } from "../../lib/db";
import { generateEmbedding } from "../../lib/bedrock";
import { decisionToText, decisionMetadata } from "../../lib/memory-text";
import { toVectorString } from "../../lib/embeddings";

export async function listDecisions(projectId: string, category?: string) {
  let sql = `SELECT * FROM decisions WHERE project_id = $1`;
  const params: any[] = [projectId];

  if (category) {
    sql += ` AND category = $2`;
    params.push(category);
  }

  sql += ` ORDER BY created_at DESC`;

  const result = await query(sql, params);
  return result.rows;
}

export async function getDecision(id: string) {
  const result = await query(
    `SELECT * FROM decisions WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createDecision(input: {
  project_id:    string;
  title:         string;
  context:       string;
  rationale:     string;
  alternatives:  string[];
  category?:     string;
  author?:       string;
}) {
  return transaction(async (client) => {
    // Insert decision
    const decisionResult = await client.query(
      `INSERT INTO decisions
        (project_id, title, context, rationale, alternatives, category, author)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.project_id,
        input.title,
        input.context,
        input.rationale,
        JSON.stringify(input.alternatives),
        input.category  || null,
        input.author    || null,
      ]
    );

    const decision = decisionResult.rows[0];

    // Generate + store embedding
    const text = decisionToText(decision);
    const { embedding } = await generateEmbedding(text);
    const vectorStr = toVectorString(embedding);

    await client.query(
      `INSERT INTO memory_embeddings
        (project_id, source_type, source_id, content, embedding, metadata)
       VALUES ($1, $2, $3, $4, $5::vector, $6)`,
      [
        decision.project_id,
        "decision",
        decision.id,
        text,
        vectorStr,
        JSON.stringify(decisionMetadata(decision)),
      ]
    );

    return decision;
  });
}