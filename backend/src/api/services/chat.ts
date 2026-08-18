// backend/src/api/services/chat.ts

import { v4 as uuid } from "uuid";
import { query, transaction } from "../../lib/db";
import { generateChat, generateEmbedding } from "../../lib/bedrock";
import { semanticSearch, toVectorString } from "../../lib/embeddings";
import { conversationToText, conversationMetadata } from "../../lib/memory-text";
import type { ChatMessage } from "../../lib/bedrock";

// ── NEW: MCP imports ──────────────────────────────────────────
import {
  MCP_TOOLS,
  executeMCPTool,
  formatMCPResults,
  type MCPToolResult,
} from "../../lib/mcp-client";

/* ─────────────────────────────────────────────────────────── */
/*  System prompt template                                     */
/* ─────────────────────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are the Memory Agent for a project management tool called Optava.

Your role is to answer questions about a user's project by referencing:
1. Retrieved memory context (semantic vector search results from CockroachDB)
2. Direct database query results from CockroachDB via MCP tools

Guidelines:
- Ground every answer in the retrieved memory and MCP tool results.
- If the answer isn't in the context, say so honestly.
- When citing information, reference the source type and content.
- Be concise but complete. Use markdown for structure.
- Never make up project details that aren't in the context.

You are talking to a member of this project. Be direct and useful.`;

/* ─────────────────────────────────────────────────────────── */
/*  MCP tool selection prompt                                  */
/*  Sent to Claude BEFORE the main chat to decide what to query*/
/* ─────────────────────────────────────────────────────────── */

const MCP_SELECTION_PROMPT = `You are a database query planner for a project management tool.

Given a user's question, decide which CockroachDB query tools to call
to retrieve the most relevant data. You must respond with a valid JSON array.

Respond ONLY with a JSON array of tool calls like this:
[
  {
    "tool": "tool_name_here",
    "input": { "key": "value" }
  }
]

If no tools are needed (e.g. for greetings), respond with: []

Available tools and when to use them:
- query_project_memory: general memory search, history questions
- get_project_decisions: questions about why/how decisions were made
- get_project_tasks: questions about task status, blockers, progress
- get_memory_stats: questions about what is stored, counts, overview
- run_sql_query: specific lookups not covered by other tools`;

/* ─────────────────────────────────────────────────────────── */
/*  Format retrieved memory into a prompt-friendly block       */
/* ─────────────────────────────────────────────────────────── */

function formatMemoryContext(memories: Array<{
  source_type: string;
  content:     string;
  metadata:    any;
  similarity:  number;
}>): string {
  if (memories.length === 0) {
    return "No relevant memory found for this query.";
  }

  return memories
    .map((mem, i) => {
      const pct = Math.round(mem.similarity * 100);
      return `[Memory ${i + 1}] (${mem.source_type} · ${pct}% match)\n${mem.content}`;
    })
    .join("\n\n---\n\n");
}

/* ─────────────────────────────────────────────────────────── */
/*  MCP Tool Planner                                           */
/*  Ask Claude which tools to call, then execute them          */
/* ─────────────────────────────────────────────────────────── */

async function runMCPPlanner(
  userMessage: string,
  projectId:   string
): Promise<MCPToolResult[]> {
  try {
    // Ask Claude which tools to call
    const plannerResponse = await generateChat(
      [{ role: "user", content: `User question: "${userMessage}"\nProject ID: ${projectId}` }],
      {
        system:      MCP_SELECTION_PROMPT,
        maxTokens:   512,
        temperature: 0,  // deterministic tool selection
      }
    );

    // Parse Claude's tool selection
    const responseText = plannerResponse.content.trim();
    let toolCalls: Array<{ tool: string; input: Record<string, any> }> = [];

    try {
      // Extract JSON from response (Claude sometimes adds explanation text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        toolCalls = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.warn("[MCP] Could not parse tool selection, skipping MCP");
      return [];
    }

    if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
      return [];
    }

    // Always inject the projectId into every tool call
    const injected = toolCalls.map((call) => ({
      ...call,
      input: { ...call.input, project_id: projectId },
    }));

    console.log(`[MCP] Executing ${injected.length} tool(s):`,
      injected.map((c) => c.tool).join(", ")
    );

    // Execute all selected tools in parallel
    const results = await Promise.all(
      injected.map((call) => executeMCPTool(call.tool, call.input))
    );

    return results;

  } catch (err: any) {
    console.error("[MCP] Planner failed:", err.message);
    return [];  // graceful degradation — fall back to vector search only
  }
}

/* ─────────────────────────────────────────────────────────── */
/*  Send a chat message with RAG + MCP                         */
/* ─────────────────────────────────────────────────────────── */

export interface ChatInput {
  projectId:   string;
  sessionId?:  string;
  message:     string;
  history?:    ChatMessage[];
}

export interface ChatOutput {
  sessionId:         string;
  response:          string;
  retrievedMemories: Array<{
    id:          string;
    source_type: string;
    source_id:   string;
    content:     string;
    metadata:    any;
    similarity:  number;
  }>;
  mcpToolsUsed: string[];  // ← NEW: which MCP tools were called
  tokens: {
    input:  number;
    output: number;
  };
  duration_ms: number;
}

export async function sendMessage(input: ChatInput): Promise<ChatOutput> {
  const start     = Date.now();
  const sessionId = input.sessionId || uuid();

  // ── 1. Vector search (existing RAG pipeline — unchanged) ──
  const memories = await semanticSearch(input.message, {
    projectId: input.projectId,
    limit:     5,
  });

  // ── 2. MCP tool calls (NEW — Claude queries CockroachDB directly) ──
  const mcpResults = await runMCPPlanner(input.message, input.projectId);
  const mcpToolsUsed = mcpResults.map((r) => r.tool);

  // ── 3. Build augmented system prompt with both sources ──
  const vectorContext = formatMemoryContext(memories);
  const mcpContext    = formatMCPResults(mcpResults);

  const augmentedSystemPrompt = `${SYSTEM_PROMPT}

=== VECTOR SEARCH RESULTS (CockroachDB semantic search) ===

${vectorContext}

=== END VECTOR RESULTS ===

${mcpContext.length > 0 ? `
=== MCP DIRECT DATABASE QUERY RESULTS (CockroachDB) ===

${mcpContext}

=== END MCP RESULTS ===
` : ""}`;

  // ── 4. Build message history ──
  const messages: ChatMessage[] = [
    ...(input.history || []),
    { role: "user", content: input.message },
  ];

  // ── 5. Generate response with Claude (unchanged) ──
  const chatResult = await generateChat(messages, {
    system:      augmentedSystemPrompt,
    maxTokens:   1024,
    temperature: 0.7,
  });

  // ── 6. Persist messages + embed (unchanged) ──
  await transaction(async (client) => {
    const userMsgResult = await client.query(
      `INSERT INTO conversations
        (project_id, session_id, role, content, metadata)
       VALUES ($1, $2, 'user', $3, $4)
       RETURNING *`,
      [input.projectId, sessionId, input.message, null]
    );

    const assistantMsgResult = await client.query(
      `INSERT INTO conversations
        (project_id, session_id, role, content, metadata)
       VALUES ($1, $2, 'assistant', $3, $4)
       RETURNING *`,
      [
        input.projectId,
        sessionId,
        chatResult.content,
        JSON.stringify({
          retrieved_memories: memories.map((m) => ({
            id:          m.id,
            source_type: m.source_type,
            source_id:   m.source_id,
            similarity:  m.similarity,
          })),
          mcp_tools_used: mcpToolsUsed,  // ← persisted to DB
          tokens: {
            input:  chatResult.inputTokens,
            output: chatResult.outputTokens,
          },
        }),
      ]
    );

    for (const msg of [userMsgResult.rows[0], assistantMsgResult.rows[0]]) {
      const text = conversationToText(msg);
      const { embedding } = await generateEmbedding(text);
      const vectorStr = toVectorString(embedding);

      await client.query(
        `INSERT INTO memory_embeddings
          (project_id, source_type, source_id, content, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5::vector, $6)`,
        [
          msg.project_id,
          "conversation",
          msg.id,
          text,
          vectorStr,
          JSON.stringify(conversationMetadata(msg)),
        ]
      );
    }
  });

  return {
    sessionId,
    response:          chatResult.content,
    retrievedMemories: memories,
    mcpToolsUsed,       // ← returned to frontend
    tokens: {
      input:  chatResult.inputTokens,
      output: chatResult.outputTokens,
    },
    duration_ms: Date.now() - start,
  };
}