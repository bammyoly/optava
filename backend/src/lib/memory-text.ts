import type { Task, Decision, Note, Conversation, Standup } from "./types";

/* ─────────────────────────────────────────────────────────── */
/*  Text builders                                              */
/*  Each type gets a structured text representation that       */
/*  emphasizes searchable content.                             */
/* ─────────────────────────────────────────────────────────── */

export function decisionToText(decision: {
  title:        string;
  context:      string;
  rationale:    string;
  alternatives: string[] | any;
  category:     string | null;
}): string {
  const alts = Array.isArray(decision.alternatives)
    ? decision.alternatives.join(", ")
    : String(decision.alternatives || "");

  return [
    `DECISION: ${decision.title}`,
    decision.category ? `Category: ${decision.category}` : "",
    `Context: ${decision.context}`,
    `Rationale: ${decision.rationale}`,
    alts ? `Alternatives considered: ${alts}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function taskToText(task: {
  task_code:   string;
  title:       string;
  description: string | null;
  category:    string | null;
  status:      string;
  priority:    string;
}): string {
  return [
    `TASK ${task.task_code}: ${task.title}`,
    task.category ? `Category: ${task.category}` : "",
    `Status: ${task.status} | Priority: ${task.priority}`,
    task.description ? `Description: ${task.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function noteToText(note: {
  title:   string | null;
  content: string;
  tags:    string[] | any;
}): string {
  const tags = Array.isArray(note.tags)
    ? note.tags.join(", ")
    : String(note.tags || "");

  return [
    note.title ? `NOTE: ${note.title}` : "NOTE",
    tags ? `Tags: ${tags}` : "",
    note.content,
  ]
    .filter(Boolean)
    .join("\n");
}

export function conversationToText(conv: {
  role:    string;
  content: string;
}): string {
  return `CONVERSATION [${conv.role.toUpperCase()}]: ${conv.content}`;
}

export function standupToText(standup: {
  period_start: Date;
  period_end:   Date;
  done:         any[];
  in_progress:  any[];
  blockers:     any[];
  focus:        any[];
  highlights:   string[];
}): string {
  const items = (arr: any[]) =>
    Array.isArray(arr) ? arr.map((i) => `- ${i.text}`).join("\n") : "";

  return [
    `STANDUP (${standup.period_start.toISOString().split("T")[0]} to ${standup.period_end.toISOString().split("T")[0]})`,
    "",
    "Done:",
    items(standup.done),
    "",
    "In Progress:",
    items(standup.in_progress),
    "",
    "Blockers:",
    items(standup.blockers),
    "",
    "Focus:",
    items(standup.focus),
    "",
    "Highlights:",
    (standup.highlights || []).map((h) => `- ${h}`).join("\n"),
  ]
    .filter(Boolean)
    .join("\n");
}

/* ─────────────────────────────────────────────────────────── */
/*  Metadata builders                                          */
/*  Store rich metadata alongside embeddings for display       */
/* ─────────────────────────────────────────────────────────── */

export function decisionMetadata(decision: any) {
  return {
    title:    decision.title,
    category: decision.category,
    author:   decision.author,
    date:     decision.created_at,
  };
}

export function taskMetadata(task: any) {
  return {
    task_code: task.task_code,
    title:     task.title,
    category:  task.category,
    status:    task.status,
    priority:  task.priority,
    assignee:  task.assignee,
  };
}

export function noteMetadata(note: any) {
  return {
    title:  note.title,
    author: note.author,
    tags:   note.tags,
    date:   note.created_at,
  };
}

export function conversationMetadata(conv: any) {
  return {
    session_id: conv.session_id,
    role:       conv.role,
    date:       conv.created_at,
  };
}

export function standupMetadata(standup: any) {
  return {
    period_start: standup.period_start,
    period_end:   standup.period_end,
    confidence:   standup.confidence,
  };
}