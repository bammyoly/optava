//frontend/lib/api.ts

/* ─────────────────────────────────────────────────────────── */
/*  Config                                                     */
/* ─────────────────────────────────────────────────────────── */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Project ID is now dynamic — set by OrgContext, consumed by hooks
let _projectId: string = "";

export function setProjectId(id: string) {
  _projectId = id;
}

export function getProjectId(): string {
  if (!_projectId) {
    console.warn("[api] projectId not set — call setProjectId first");
  }
  return _projectId;
}

/* ─────────────────────────────────────────────────────────── */
/*  Types (mirror backend)                                     */
/* ─────────────────────────────────────────────────────────── */

export interface ApiResponse<T> {
  success: boolean;
  data?:   T;
  error?:  string;
  meta?:   Record<string, any>;
}

export type SourceType   = "decision" | "task" | "note" | "conversation" | "standup";
export type TaskStatus   = "backlog" | "todo" | "in_progress" | "done";
export type TaskPriority = "high" | "medium" | "low";
export type TeamWorkload = "overloaded" | "active" | "available" | "idle";

export type Category =
  | "Architecture"
  | "Backend"
  | "Frontend"
  | "Design"
  | "Product"
  | "DevOps"
  | "AI";

export interface Project {
  id:          string;
  name:        string;
  description: string;
  status:      string;
  created_at:  string;
  updated_at:  string;
}

export interface ProjectStats {
  tasks: {
    total:     number;
    by_status: Record<string, number>;
  };
  decisions:      number;
  notes:          number;
  conversations:  number;
  standups:       number;
  memory_entries: number;
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
  created_at:   string;
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
  due_date:    string | null;
  created_at:  string;
  updated_at:  string;
}

export interface Note {
  id:         string;
  project_id: string;
  title:      string | null;
  content:    string;
  author:     string | null;
  tags:       string[] | null;
  created_at: string;
}

export interface StandupItem {
  text:      string;
  taskId?:   string;
  priority?: TaskPriority;
  source?:   string;
}

export interface Standup {
  id:            string;
  project_id:    string;
  period_start:  string;
  period_end:    string;
  done:          StandupItem[];
  in_progress:   StandupItem[];
  blockers:      StandupItem[];
  focus:         StandupItem[];
  highlights:    string[];
  confidence:    number;
  gen_time_ms:   number;
  source_counts: {
    conversations: number;
    tasks:         number;
    decisions:     number;
    notes:         number;
  };
  created_at:    string;
}

export interface SearchResult {
  id:          string;
  source_type: SourceType;
  source_id:   string;
  content:     string;
  metadata:    Record<string, any>;
  similarity:  number;
}

export interface ChatResult {
  sessionId:         string;
  response:          string;
  retrievedMemories: SearchResult[];
  tokens: {
    input:  number;
    output: number;
  };
  duration_ms: number;
}

export interface ChatSession {
  session_id:      string;
  message_count:   number;
  started_at:      string;
  last_message_at: string;
  first_message:   string;
}

export interface ChatMessage {
  id:         string;
  project_id: string;
  session_id: string;
  role:       "user" | "assistant" | "system";
  content:    string;
  metadata:   Record<string, any> | null;
  created_at: string;
}

export interface TeamMember {
  id:           string;
  name:         string;
  initials:     string;
  role:         string;
  avatar_color: string;
  workload:     TeamWorkload;
  expertise:    string[];
  summary:      string;
  created_at:   string;
  stats: {
    tasks_assigned:     number;
    tasks_completed:    number;
    tasks_in_progress:  number;
    decisions_authored: number;
    notes_authored:     number;
  };
}

export interface TeamMemberDetail extends TeamMember {
  recent_tasks: Array<{
    id:         string;
    task_code:  string;
    title:      string;
    status:     string;
    priority:   string;
    updated_at: string;
  }>;
  recent_decisions: Array<{
    id:         string;
    title:      string;
    category:   string | null;
    created_at: string;
  }>;
  recent_notes: Array<{
    id:         string;
    title:      string | null;
    created_at: string;
  }>;
}

/* ─────────────────────────────────────────────────────────── */
/*  Fetch wrapper                                              */
/* ─────────────────────────────────────────────────────────── */

async function request<T>(
  path:    string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(json.error || "Request failed");
  }

  return json.data as T;
}

/* ─────────────────────────────────────────────────────────── */
/*  API Methods                                                */
/* ─────────────────────────────────────────────────────────── */

export const api = {

  // ── Health ────────────────────────────────
  health: () => request<{ status: string; timestamp: string }>("/health"),

  // ── Projects ──────────────────────────────
  projects: {
    get:      (id: string) => request<Project>(`/projects/${id}`),
    getStats: (id: string) => request<ProjectStats>(`/projects/${id}/stats`),
  },

  // ── Decisions ─────────────────────────────
  decisions: {
    list: (projectId: string, category?: string) => {
      const params = new URLSearchParams({ projectId });
      if (category) params.append("category", category);
      return request<Decision[]>(`/decisions?${params}`);
    },

    get: (id: string) => request<Decision>(`/decisions/${id}`),

    create: (input: {
      project_id:   string;
      title:        string;
      context:      string;
      rationale:    string;
      alternatives: string[];
      category?:    string;
      author?:      string;
    }) =>
      request<Decision>("/decisions", {
        method: "POST",
        body:   JSON.stringify(input),
      }),
  },

  // ── Tasks ─────────────────────────────────
  tasks: {
    list: (projectId: string, status?: string) => {
      const params = new URLSearchParams({ projectId });
      if (status) params.append("status", status);
      return request<Task[]>(`/tasks?${params}`);
    },

    get: (id: string) => request<Task>(`/tasks/${id}`),

    update: (id: string, updates: Partial<Task>) =>
      request<Task>(`/tasks/${id}`, {
        method: "PATCH",
        body:   JSON.stringify(updates),
      }),
  },

  // ── Notes ─────────────────────────────────
  notes: {
    list: (projectId: string) =>
      request<Note[]>(`/notes?projectId=${projectId}`),
  },

  // ── Conversations ─────────────────────────
  conversations: {
    listSessions: (projectId: string) =>
      request<ChatSession[]>(`/conversations/sessions?projectId=${projectId}`),

    getSession: (sessionId: string) =>
      request<ChatMessage[]>(`/conversations/${sessionId}`),
  },

  // ── Standups ──────────────────────────────
  standups: {
    list: (projectId: string) =>
      request<Standup[]>(`/standups?projectId=${projectId}`),

    get: (id: string) =>
      request<Standup>(`/standups/${id}`),

    generate: (projectId: string) =>
      request<Standup>(`/standups/generate?projectId=${projectId}`, {
        method: "POST",
      }),
  },

    team: {
    list: (projectId: string) =>
      request<TeamMember[]>(`/team?projectId=${projectId}`),

    get: (id: string) =>
      request<TeamMemberDetail>(`/team/${id}`),

    create: (input: {
      project_id:    string;
      name:          string;
      role?:         string;
      avatar_color?: string;
    }) =>
      request<TeamMember>("/team", {
        method: "POST",
        body:   JSON.stringify(input),
      }),
  },

  // ── Search ────────────────────────────────
  search: {
    query: (input: {
      projectId:     string;
      query:         string;
      limit?:        number;
      sourceTypes?:  SourceType[];
      minSimilarity?: number;
    }) =>
      request<SearchResult[]>("/search", {
        method: "POST",
        body:   JSON.stringify(input),
      }),
  },

  // ── Chat ──────────────────────────────────
  chat: {
    send: (input: {
      projectId:  string;
      sessionId?: string;
      message:    string;
      history?:   Array<{ role: "user" | "assistant"; content: string }>;
    }) =>
      request<ChatResult>("/chat/message", {
        method: "POST",
        body:   JSON.stringify(input),
      }),
  },


    // ── Organizations ────────────────────────
  organizations: {
    create: (input: {
      name:               string;
      slug:               string;
      userId:             string;
      projectName:        string;
      projectDescription?: string;
    }) =>
      request<{ org: any; project: any }>("/organizations", {
        method: "POST",
        body:   JSON.stringify(input),
      }),

    checkSlug: (slug: string) =>
      request<{ slug: string; available: boolean }>(
        `/organizations/check-slug?slug=${encodeURIComponent(slug)}`
      ),

    get: (id: string) =>
      request<any>(`/organizations/${id}`),

    getByUser: (userId: string) =>
      request<any>(`/organizations/by-user/${userId}`),

    update: (id: string, data: { name?: string }) =>
      request<any>(`/organizations/${id}`, {
        method: "PATCH",
        body:   JSON.stringify(data),
      }),
  },

  // ── Org Members ──────────────────────────
  orgMembers: {
    list: (orgId: string) =>
      request<any[]>(`/org-members?orgId=${orgId}`),

    invite: (input: {
      orgId:     string;
      email:     string;
      role:      string;
      invitedBy: string;
    }) =>
      request<any>("/org-members/invite", {
        method: "POST",
        body:   JSON.stringify(input),
      }),

    updateRole: (userId: string, orgId: string, role: string) =>
      request<any>(`/org-members/${userId}`, {
        method: "PATCH",
        body:   JSON.stringify({ orgId, role }),
      }),

    remove: (userId: string, orgId: string) =>
      request<any>(`/org-members/${userId}?orgId=${orgId}`, {
        method: "DELETE",
      }),
  },

  // ── Invitations ──────────────────────────
  invitations: {
    get: (token: string) =>
      request<any>(`/invitations/${token}`),

    accept: (token: string, userId: string, userEmail: string) =>
      request<any>(`/invitations/${token}/accept`, {
        method: "POST",
        body:   JSON.stringify({ userId, userEmail }),
      }),

    list: (orgId: string) =>
      request<any[]>(`/invitations?orgId=${orgId}`),

    revoke: (id: string) =>
      request<any>(`/invitations/${id}`, {
        method: "DELETE",
      }),
  },

};