import { query, transaction } from "./db";
import { generateEmbedding } from "./bedrock";
import {
  decisionToText,
  taskToText,
  noteToText,
  conversationToText,
  standupToText,
  decisionMetadata,
  taskMetadata,
  noteMetadata,
  conversationMetadata,
  standupMetadata,
} from "./memory-text";
import type { SourceType } from "./types";

/* ─────────────────────────────────────────────────────────── */
/*  Types                                                      */
/* ─────────────────────────────────────────────────────────── */

export interface EmbedItem {
  project_id:  string;
  source_type: SourceType;
  source_id:   string;
  content:     string;
  metadata:    Record<string, any>;
}

export interface EmbedResult {
  source_type: SourceType;
  source_id:   string;
  success:     boolean;
  error?:      string;
}

export interface EmbedStats {
  total:      number;
  succeeded:  number;
  failed:     number;
  duration_ms: number;
}

/* ─────────────────────────────────────────────────────────── */
/*  Vector formatting                                          */
/*  CockroachDB expects vectors as '[1.0, 2.0, ...]'::vector  */
/* ─────────────────────────────────────────────────────────── */

export function toVectorString(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/* ─────────────────────────────────────────────────────────── */
/*  Fetch memory items ready to embed                          */
/* ─────────────────────────────────────────────────────────── */

export async function collectEmbedItems(projectId: string): Promise<EmbedItem[]> {
  const items: EmbedItem[] = [];

  // ── Decisions ──
  const decisions = await query(
    `SELECT * FROM decisions WHERE project_id = $1`,
    [projectId]
  );
  for (const row of decisions.rows) {
    items.push({
      project_id:  projectId,
      source_type: "decision",
      source_id:   row.id,
      content:     decisionToText(row),
      metadata:    decisionMetadata(row),
    });
  }

  // ── Tasks ──
  const tasks = await query(
    `SELECT * FROM tasks WHERE project_id = $1`,
    [projectId]
  );
  for (const row of tasks.rows) {
    items.push({
      project_id:  projectId,
      source_type: "task",
      source_id:   row.id,
      content:     taskToText(row),
      metadata:    taskMetadata(row),
    });
  }

  // ── Notes ──
  const notes = await query(
    `SELECT * FROM notes WHERE project_id = $1`,
    [projectId]
  );
  for (const row of notes.rows) {
    items.push({
      project_id:  projectId,
      source_type: "note",
      source_id:   row.id,
      content:     noteToText(row),
      metadata:    noteMetadata(row),
    });
  }

  // ── Conversations ──
  const conversations = await query(
    `SELECT * FROM conversations WHERE project_id = $1`,
    [projectId]
  );
  for (const row of conversations.rows) {
    items.push({
      project_id:  projectId,
      source_type: "conversation",
      source_id:   row.id,
      content:     conversationToText(row),
      metadata:    conversationMetadata(row),
    });
  }

  // ── Standups ──
  const standups = await query(
    `SELECT * FROM standups WHERE project_id = $1`,
    [projectId]
  );
  for (const row of standups.rows) {
    items.push({
      project_id:  projectId,
      source_type: "standup",
      source_id:   row.id,
      content:     standupToText(row),
      metadata:    standupMetadata(row),
    });
  }

  return items;
}

/* ─────────────────────────────────────────────────────────── */
/*  Insert or update a single embedding                        */
/* ─────────────────────────────────────────────────────────── */

export async function upsertEmbedding(
  item:      EmbedItem,
  embedding: number[]
): Promise<void> {
  const vectorStr = toVectorString(embedding);

  // Delete existing embedding for this source to avoid duplicates
  await query(
    `DELETE FROM memory_embeddings
     WHERE source_type = $1 AND source_id = $2`,
    [item.source_type, item.source_id]
  );

  // Insert fresh embedding
  await query(
    `INSERT INTO memory_embeddings
      (project_id, source_type, source_id, content, embedding, metadata)
     VALUES ($1, $2, $3, $4, $5::vector, $6)`,
    [
      item.project_id,
      item.source_type,
      item.source_id,
      item.content,
      vectorStr,
      JSON.stringify(item.metadata),
    ]
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Embed a single item                                        */
/* ─────────────────────────────────────────────────────────── */

export async function embedItem(item: EmbedItem): Promise<EmbedResult> {
  try {
    const { embedding } = await generateEmbedding(item.content);
    await upsertEmbedding(item, embedding);

    return {
      source_type: item.source_type,
      source_id:   item.source_id,
      success:     true,
    };
  } catch (error: any) {
    return {
      source_type: item.source_type,
      source_id:   item.source_id,
      success:     false,
      error:       error.message,
    };
  }
}

/* ─────────────────────────────────────────────────────────── */
/*  Embed all items for a project (with progress)              */
/* ─────────────────────────────────────────────────────────── */

export async function embedAll(
  projectId:  string,
  onProgress?: (current: number, total: number, item: EmbedItem) => void
): Promise<EmbedStats> {
  const start = Date.now();

  const items = await collectEmbedItems(projectId);

  let succeeded = 0;
  let failed    = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (onProgress) {
      onProgress(i + 1, items.length, item);
    }

    const result = await embedItem(item);

    if (result.success) succeeded++;
    else                failed++;

    // Small delay to be polite to Bedrock
    if (i < items.length - 1) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  return {
    total:       items.length,
    succeeded,
    failed,
    duration_ms: Date.now() - start,
  };
}

/* ─────────────────────────────────────────────────────────── */
/*  Semantic search                                            */
/* ─────────────────────────────────────────────────────────── */

export interface SearchOptions {
  projectId:    string;
  limit?:       number;
  sourceTypes?: SourceType[];
  minSimilarity?: number;
}

export interface SearchResult {
  id:          string;
  source_type: SourceType;
  source_id:   string;
  content:     string;
  metadata:    Record<string, any>;
  similarity:  number;
}

export async function semanticSearch(
  queryText: string,
  options:   SearchOptions
): Promise<SearchResult[]> {
  const {
    projectId,
    limit         = 5,
    sourceTypes,
    minSimilarity = 0,
  } = options;

  // Generate embedding for the query
  const { embedding } = await generateEmbedding(queryText);
  const vectorStr = toVectorString(embedding);

  // Build the SQL query
  let sql = `
    SELECT
      id,
      source_type,
      source_id,
      content,
      metadata,
      1 - (embedding <=> $1::vector) AS similarity
    FROM memory_embeddings
    WHERE project_id = $2
  `;

  const params: any[] = [vectorStr, projectId];

  if (sourceTypes && sourceTypes.length > 0) {
    sql += ` AND source_type = ANY($${params.length + 1})`;
    params.push(sourceTypes);
  }

  sql += `
    ORDER BY embedding <=> $1::vector
    LIMIT $${params.length + 1}
  `;
  params.push(limit);

  const result = await query(sql, params);

  return result.rows
    .filter((row) => row.similarity >= minSimilarity)
    .map((row) => ({
      id:          row.id,
      source_type: row.source_type,
      source_id:   row.source_id,
      content:     row.content,
      metadata:    row.metadata,
      similarity:  parseFloat(row.similarity),
    }));
}