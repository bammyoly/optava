// backend/src/lib/mcp-client.ts

import { pool } from "./db";
import dotenv from "dotenv";
dotenv.config();

/* ─────────────────────────────────────────────────────────── */
/*  CockroachDB MCP Tool Definitions                           */
/*  These are the tools exposed to Claude for direct DB access */
/* ─────────────────────────────────────────────────────────── */

export interface MCPTool {
  name:        string;
  description: string;
  input_schema: {
    type:       "object";
    properties: Record<string, {
      type:        string;
      description: string;
      enum?:       string[];
    }>;
    required: string[];
  };
}

export interface MCPToolResult {
  tool:    string;
  input:   Record<string, any>;
  output:  any;
  error?:  string;
  rows?:   number;
}

/* ─────────────────────────────────────────────────────────── */
/*  Tool Definitions                                           */
/*  Claude will choose which tools to call based on the query  */
/* ─────────────────────────────────────────────────────────── */

export const MCP_TOOLS: MCPTool[] = [
  {
    name:        "query_project_memory",
    description: `Search the project memory database using semantic similarity.
Returns the most relevant memories for a given concept or question.
Use this when the user asks about past decisions, project history,
or anything that might be stored in project memory.`,
    input_schema: {
      type: "object",
      properties: {
        project_id: {
          type:        "string",
          description: "The UUID of the project to search",
        },
        concept: {
          type:        "string",
          description: "The concept or question to search for semantically",
        },
        source_type: {
          type:        "string",
          description: "Filter by memory type (optional)",
          enum:        ["decision", "task", "note", "conversation", "standup"],
        },
        limit: {
          type:        "string",
          description: "Number of results to return (default 5, max 10)",
        },
      },
      required: ["project_id", "concept"],
    },
  },
  {
    name:        "get_project_decisions",
    description: `Retrieve all logged decisions for a project from CockroachDB.
Use this when the user asks about specific decisions, architectural choices,
or wants to understand why something was decided.`,
    input_schema: {
      type: "object",
      properties: {
        project_id: {
          type:        "string",
          description: "The UUID of the project",
        },
        category: {
          type:        "string",
          description: "Filter by category (Architecture, Backend, Frontend, Design, Product, DevOps, AI)",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name:        "get_project_tasks",
    description: `Retrieve tasks and their current status from CockroachDB.
Use this when the user asks about what work is in progress, blocked,
completed, or planned. Returns real-time task data.`,
    input_schema: {
      type: "object",
      properties: {
        project_id: {
          type:        "string",
          description: "The UUID of the project",
        },
        status: {
          type:        "string",
          description: "Filter by status",
          enum:        ["backlog", "todo", "in_progress", "done"],
        },
      },
      required: ["project_id"],
    },
  },
  {
    name:        "get_memory_stats",
    description: `Get statistics about the project memory stored in CockroachDB.
Use this when the user asks how much has been stored, what types of
memory exist, or wants an overview of the project knowledge base.`,
    input_schema: {
      type: "object",
      properties: {
        project_id: {
          type:        "string",
          description: "The UUID of the project",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name:        "run_sql_query",
    description: `Execute a read-only SQL query directly against CockroachDB.
Use this for specific lookups, aggregations, or joins that other
tools do not cover. Only SELECT statements are permitted.`,
    input_schema: {
      type: "object",
      properties: {
        sql: {
          type:        "string",
          description: "A SELECT SQL query to run. Must start with SELECT.",
        },
        params: {
          type:        "string",
          description: "JSON array of query parameters e.g. [\"uuid-here\"]",
        },
      },
      required: ["sql"],
    },
  },
];

/* ─────────────────────────────────────────────────────────── */
/*  Tool Executor                                              */
/*  Runs the SQL that backs each tool Claude calls             */
/* ─────────────────────────────────────────────────────────── */

export async function executeMCPTool(
  toolName: string,
  input:    Record<string, any>
): Promise<MCPToolResult> {
  const base: MCPToolResult = { tool: toolName, input, output: null };

  try {
    switch (toolName) {

      // ── Tool 1: Semantic memory search ──────────────────
      case "query_project_memory": {
        const limit = Math.min(parseInt(input.limit || "5"), 10);

        let sql = `
          SELECT
            me.id,
            me.source_type,
            me.source_id,
            me.content,
            me.metadata,
            me.created_at
          FROM memory_embeddings me
          WHERE me.project_id = $1
        `;
        const params: any[] = [input.project_id];

        if (input.source_type) {
          params.push(input.source_type);
          sql += ` AND me.source_type = $${params.length}`;
        }

        sql += ` ORDER BY me.created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await pool.query(sql, params);

        return {
          ...base,
          output: result.rows,
          rows:   result.rows.length,
        };
      }

      // ── Tool 2: Get decisions ────────────────────────────
      case "get_project_decisions": {
        let sql = `
          SELECT
            id,
            title,
            context,
            rationale,
            alternatives,
            category,
            author,
            created_at
          FROM decisions
          WHERE project_id = $1
        `;
        const params: any[] = [input.project_id];

        if (input.category) {
          params.push(input.category);
          sql += ` AND category = $${params.length}`;
        }

        sql += ` ORDER BY created_at DESC LIMIT 20`;

        const result = await pool.query(sql, params);

        return {
          ...base,
          output: result.rows,
          rows:   result.rows.length,
        };
      }

      // ── Tool 3: Get tasks ────────────────────────────────
      case "get_project_tasks": {
        let sql = `
          SELECT
            id,
            task_code,
            title,
            description,
            status,
            priority,
            assignee,
            due_date,
            progress,
            created_at,
            updated_at
          FROM tasks
          WHERE project_id = $1
        `;
        const params: any[] = [input.project_id];

        if (input.status) {
          params.push(input.status);
          sql += ` AND status = $${params.length}`;
        }

        sql += ` ORDER BY
          CASE status
            WHEN 'in_progress' THEN 1
            WHEN 'todo'        THEN 2
            WHEN 'backlog'     THEN 3
            WHEN 'done'        THEN 4
          END,
          priority DESC
          LIMIT 30`;

        const result = await pool.query(sql, params);

        return {
          ...base,
          output: result.rows,
          rows:   result.rows.length,
        };
      }

      // ── Tool 4: Memory stats ─────────────────────────────
      case "get_memory_stats": {
        const result = await pool.query(
          `SELECT
             source_type,
             COUNT(*) AS count
           FROM memory_embeddings
           WHERE project_id = $1
           GROUP BY source_type
           ORDER BY count DESC`,
          [input.project_id]
        );

        const totals = await pool.query(
          `SELECT
             (SELECT COUNT(*) FROM decisions    WHERE project_id = $1) AS decisions,
             (SELECT COUNT(*) FROM tasks        WHERE project_id = $1) AS tasks,
             (SELECT COUNT(*) FROM notes        WHERE project_id = $1) AS notes,
             (SELECT COUNT(*) FROM conversations WHERE project_id = $1) AS conversations,
             (SELECT COUNT(*) FROM memory_embeddings WHERE project_id = $1) AS embeddings`,
          [input.project_id]
        );

        return {
          ...base,
          output: {
            by_source_type: result.rows,
            totals:         totals.rows[0],
          },
          rows: result.rows.length,
        };
      }

      // ── Tool 5: Raw SQL (read-only guard) ────────────────
      case "run_sql_query": {
        const sql = (input.sql || "").trim();

        // Safety: only allow SELECT
        if (!sql.toUpperCase().startsWith("SELECT")) {
          return {
            ...base,
            error: "Only SELECT queries are permitted via MCP tools",
          };
        }

        let params: any[] = [];
        try {
          params = input.params ? JSON.parse(input.params) : [];
        } catch {
          params = [];
        }

        const result = await pool.query(sql, params);

        return {
          ...base,
          output: result.rows,
          rows:   result.rows.length,
        };
      }

      default:
        return {
          ...base,
          error: `Unknown tool: ${toolName}`,
        };
    }
  } catch (err: any) {
    console.error(`[MCP] Tool ${toolName} failed:`, err.message);
    return {
      ...base,
      error: err.message,
    };
  }
}

/* ─────────────────────────────────────────────────────────── */
/*  Format MCP tool results for Claude's system prompt         */
/* ─────────────────────────────────────────────────────────── */

export function formatMCPResults(results: MCPToolResult[]): string {
  if (results.length === 0) return "";

  return results
    .map((r) => {
      if (r.error) {
        return `[MCP Tool: ${r.tool}]\nError: ${r.error}`;
      }

      const outputStr = Array.isArray(r.output)
        ? r.output.map((row: any, i: number) =>
            `  [${i + 1}] ${JSON.stringify(row, null, 0)}`
          ).join("\n")
        : JSON.stringify(r.output, null, 2);

      return `[MCP Tool: ${r.tool}]\nQuery: ${JSON.stringify(r.input)}\nRows returned: ${r.rows ?? "N/A"}\nResults:\n${outputStr}`;
    })
    .join("\n\n---\n\n");
}