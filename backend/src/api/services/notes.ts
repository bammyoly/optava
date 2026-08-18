import { query, transaction } from "../../lib/db";
import { generateEmbedding } from "../../lib/bedrock";
import { noteToText, noteMetadata } from "../../lib/memory-text";
import { toVectorString } from "../../lib/embeddings";

export async function listNotes(projectId: string) {
  const result = await query(
    `SELECT * FROM notes
     WHERE project_id = $1
     ORDER BY created_at DESC`,
    [projectId]
  );
  return result.rows;
}

export async function createNote(input: {
  project_id: string;
  title?:     string;
  content:    string;
  author?:    string;
  tags?:      string[];
}) {
  return transaction(async (client) => {
    const noteResult = await client.query(
      `INSERT INTO notes (project_id, title, content, author, tags)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.project_id,
        input.title  || null,
        input.content,
        input.author || null,
        input.tags   ? JSON.stringify(input.tags) : null,
      ]
    );

    const note = noteResult.rows[0];

    const text = noteToText(note);
    const { embedding } = await generateEmbedding(text);
    const vectorStr = toVectorString(embedding);

    await client.query(
      `INSERT INTO memory_embeddings
        (project_id, source_type, source_id, content, embedding, metadata)
       VALUES ($1, $2, $3, $4, $5::vector, $6)`,
      [
        note.project_id,
        "note",
        note.id,
        text,
        vectorStr,
        JSON.stringify(noteMetadata(note)),
      ]
    );

    return note;
  });
}