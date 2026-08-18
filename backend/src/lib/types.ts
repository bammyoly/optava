// ─── Enums ──────────────────────────────────────────────────

export type TaskStatus   = "backlog" | "todo" | "in_progress" | "done";
export type TaskPriority = "high" | "medium" | "low";
export type MessageRole  = "user" | "assistant" | "system";
export type SourceType   = "decision" | "task" | "conversation" | "note" | "standup";

export type Category =
  | "Architecture"
  | "Backend"
  | "Frontend"
  | "Design"
  | "Product"
  | "DevOps"
  | "AI";

// ─── Core Entities ──────────────────────────────────────────

export interface Project {
  id:          string;
  name:        string;
  description: string | null;
  status:      string;
  created_at:  Date;
  updated_at:  Date;
}

export interface Task {
  id:          string;
  project_id:  string;
  task_code:   string;
  category:    string | null;
  title:       string;
  description: string | null;
  status:      TaskStatus;
  priority:    TaskPriority;
  progress:    number;
  assignee:    string | null;
  due_date:    Date | null;
  created_at:  Date;
  updated_at:  Date;
}

export interface Decision {
  id:           string;
  project_id:   string;
  title:        string;
  context:      string;
  rationale:    string;
  alternatives: string[];
  category:     Category | null;
  author:       string | null;
  created_at:   Date;
}

export interface Conversation {
  id:         string;
  project_id: string;
  session_id: string;
  role:       MessageRole;
  content:    string;
  metadata:   Record<string, any> | null;
  created_at: Date;
}

export interface Standup {
  id:            string;
  project_id:    string;
  period_start:  Date;
  period_end:    Date;
  done:          StandupItem[];
  in_progress:   StandupItem[];
  blockers:      StandupItem[];
  focus:         StandupItem[];
  highlights:    string[];
  confidence:    number;
  gen_time_ms:   number;
  source_counts: SourceCounts;
  created_at:    Date;
}

export interface StandupItem {
  text:      string;
  taskId?:   string;
  priority?: TaskPriority;
  source?:   string;
}

export interface SourceCounts {
  conversations: number;
  tasks:         number;
  decisions:     number;
  notes:         number;
}

export interface Note {
  id:         string;
  project_id: string;
  title:      string | null;
  content:    string;
  author:     string | null;
  tags:       string[] | null;
  created_at: Date;
}

export interface MemoryEmbedding {
  id:          string;
  project_id:  string;
  source_type: SourceType;
  source_id:   string;
  content:     string;
  embedding:   number[] | null;
  metadata:    Record<string, any> | null;
  created_at:  Date;
}