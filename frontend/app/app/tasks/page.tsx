// frontend/app/app/tasks/page.tsx

"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { useTasks } from "@/hooks/useApi";
import type { Task as ApiTask } from "@/lib/api";
import {
  Plus,
  User,
  Calendar,
  MoreHorizontal,
  Filter,
  LayoutGrid,
  List,
  TrendingUp,
  Clock,
  CheckCircle2,
  Sparkles,
  Loader2,
  X,
  ChevronDown,
  Search,
  AlertCircle,
  ArrowUpDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { useOrg } from "@/components/OrgContext";

/* ─────────────────────────────────────────────────────────── */
/*  Types                                                      */
/* ─────────────────────────────────────────────────────────── */

interface DisplayTask {
  id:           string;
  taskCode:     string;
  category:     string;
  title:        string;
  description?: string;
  priority?:    "High" | "Medium" | "Low";
  progress?:    number;
  assignee?:    Assignee;
  dueDate?:     string;
  status:       ApiTask["status"];
}

interface Assignee {
  initials: string;
  color:    string;
}

/* ─────────────────────────────────────────────────────────── */
/*  Helpers                                                    */
/* ─────────────────────────────────────────────────────────── */

const ASSIGNEE_COLORS = [
  "linear-gradient(135deg, #a78bfa, #7c3aed)",
  "linear-gradient(135deg, #60a5fa, #3b82f6)",
  "linear-gradient(135deg, #34d399, #10b981)",
  "linear-gradient(135deg, #fbbf24, #f59e0b)",
  "linear-gradient(135deg, #fb7185, #ef4444)",
];

function nameToAssignee(name: string): Assignee {
  const parts    = name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
  const hash  = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const color = ASSIGNEE_COLORS[hash % ASSIGNEE_COLORS.length];
  return { initials, color };
}

function capitalizePriority(p: ApiTask["priority"]): "High" | "Medium" | "Low" {
  return (p.charAt(0).toUpperCase() + p.slice(1)) as "High" | "Medium" | "Low";
}

function formatDueDate(iso: string | null): string | undefined {
  if (!iso) return undefined;
  const date  = new Date(iso);
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff  = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0)  return "Today";
  if (diff === 1)  return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toDisplayTask(t: ApiTask): DisplayTask {
  return {
    id:          t.id,
    taskCode:    t.task_code || t.id.substring(0, 8).toUpperCase(),
    category:    (t.category || "GENERAL").toUpperCase(),
    title:       t.title,
    description: t.description ?? undefined,
    priority:    t.priority ? capitalizePriority(t.priority) : undefined,
    progress:    t.progress > 0 ? t.progress : undefined,
    assignee:    t.assignee ? nameToAssignee(t.assignee) : undefined,
    dueDate:     formatDueDate(t.due_date),
    status:      t.status,
  };
}

function groupByStatus(tasks: DisplayTask[]): Record<ApiTask["status"], DisplayTask[]> {
  return {
    backlog:     tasks.filter((t) => t.status === "backlog"),
    todo:        tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    done:        tasks.filter((t) => t.status === "done"),
  };
}

/* ─────────────────────────────────────────────────────────── */
/*  Tasks Page                                                 */
/* ─────────────────────────────────────────────────────────── */

export default function TasksPage() {
  const { data: apiTasks = [], isLoading, refetch } = useTasks();
  const { projectId } = useOrg();

  const [selectedTask,    setSelectedTask]    = useState<DisplayTask | null>(null);
  const [activeTab,       setActiveTab]       = useState("board");
  const [showFilter,      setShowFilter]      = useState(false);
  const [showNewTask,     setShowNewTask]     = useState(false);
  const [filterPriority,  setFilterPriority]  = useState<string>("all");
  const [filterAssignee,  setFilterAssignee]  = useState<string>("all");
  const [searchQuery,     setSearchQuery]     = useState("");
  const [viewMode,        setViewMode]        = useState<"board" | "list">("board");

  const displayTasks = useMemo(() => apiTasks.map(toDisplayTask), [apiTasks]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    let tasks = displayTasks;
    if (filterPriority !== "all") {
      tasks = tasks.filter(
        (t) => t.priority?.toLowerCase() === filterPriority
      );
    }
    if (filterAssignee !== "all") {
      tasks = tasks.filter((t) =>
        filterAssignee === "unassigned"
          ? !t.assignee
          : t.assignee?.initials === filterAssignee
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.taskCode.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    return tasks;
  }, [displayTasks, filterPriority, filterAssignee, searchQuery]);

  const groups = useMemo(
    () => groupByStatus(filteredTasks),
    [filteredTasks]
  );

  // All unique assignees for filter dropdown
  const assignees = useMemo(() => {
    const seen = new Set<string>();
    const list: { initials: string; color: string }[] = [];
    displayTasks.forEach((t) => {
      if (t.assignee && !seen.has(t.assignee.initials)) {
        seen.add(t.assignee.initials);
        list.push(t.assignee);
      }
    });
    return list;
  }, [displayTasks]);

  const activeFilterCount =
    (filterPriority !== "all" ? 1 : 0) +
    (filterAssignee !== "all" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  if (isLoading) {
    return (
      <AppShell
        tabs={[
          { label: "Board",    key: "board"    },
          { label: "Timeline", key: "timeline" },
          { label: "Backlog",  key: "backlog"  },
        ]}
        defaultTab="board"
      >
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: "var(--accent-purple)" }}
            />
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Loading tasks...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      tabs={[
        { label: "Board",    key: "board"    },
        { label: "Timeline", key: "timeline" },
        { label: "Backlog",  key: "backlog"  },
      ]}
      defaultTab="board"
      onTabChange={setActiveTab}
    >
      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => { refetch(); setSelectedTask(null); }}
        />
      )}

      {/* New task modal */}
      {showNewTask && (
        <NewTaskPanel
          projectId={projectId}
          onClose={() => setShowNewTask(false)}
          onCreated={() => { refetch(); setShowNewTask(false); }}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="nx-badge nx-badge-active">Sprint 1 · Active</span>
            <span
              className="text-xs font-mono"
              style={{ color: "var(--text-tertiary)" }}
            >
              SPRINT-001
            </span>
          </div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Task Board
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {filteredTasks.length} of {displayTasks.length} tasks
            {activeFilterCount > 0 && (
              <span style={{ color: "var(--accent-purple)" }}>
                {" "}· {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--border-primary)" }}
          >
            <button
              onClick={() => setViewMode("board")}
              className="px-3 py-2 transition-all"
              style={{
                background:
                  viewMode === "board"
                    ? "var(--accent-purple)"
                    : "var(--bg-card)",
                color:
                  viewMode === "board" ? "#0b1020" : "var(--text-secondary)",
              }}
              title="Board view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="px-3 py-2 transition-all"
              style={{
                background:
                  viewMode === "list"
                    ? "var(--accent-purple)"
                    : "var(--bg-card)",
                color:
                  viewMode === "list" ? "#0b1020" : "var(--text-secondary)",
              }}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="nx-btn nx-btn-secondary"
            style={
              activeFilterCount > 0
                ? {
                    borderColor: "var(--accent-purple)",
                    color:       "var(--accent-purple)",
                  }
                : {}
            }
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
            {activeFilterCount > 0 && (
              <span
                className="w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
                style={{
                  background: "var(--accent-purple)",
                  color:      "#0b1020",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* New Task */}
          <button
            onClick={() => setShowNewTask(true)}
            className="nx-btn nx-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            New Task
          </button>
        </div>
      </div>

      {/* ── Filter panel ── */}
      {showFilter && (
        <div
          className="rounded-xl p-4 mb-4 flex flex-wrap items-end gap-4"
          style={{
            background: "var(--bg-card)",
            border:     "1px solid var(--border-primary)",
          }}
        >
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label
              className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
              style={{ color: "var(--text-tertiary)" }}
            >
              Search
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                style={{ color: "var(--text-tertiary)" }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background:  "var(--bg-elevated)",
                  border:      "1px solid var(--border-primary)",
                  color:       "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {/* Priority filter */}
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
              style={{ color: "var(--text-tertiary)" }}
            >
              Priority
            </label>
            <div className="flex gap-1.5">
              {["all", "high", "medium", "low"].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                  style={{
                    background:
                      filterPriority === p
                        ? "var(--accent-purple)"
                        : "var(--bg-elevated)",
                    color:
                      filterPriority === p
                        ? "#0b1020"
                        : "var(--text-secondary)",
                    border:
                      filterPriority === p
                        ? "1px solid var(--accent-purple)"
                        : "1px solid var(--border-primary)",
                  }}
                >
                  {p === "all" ? "All" : p}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee filter */}
          {assignees.length > 0 && (
            <div>
              <label
                className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
                style={{ color: "var(--text-tertiary)" }}
              >
                Assignee
              </label>
              <div className="flex gap-1.5 items-center">
                <button
                  onClick={() => setFilterAssignee("all")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background:
                      filterAssignee === "all"
                        ? "var(--accent-purple)"
                        : "var(--bg-elevated)",
                    color:
                      filterAssignee === "all"
                        ? "#0b1020"
                        : "var(--text-secondary)",
                    border:
                      filterAssignee === "all"
                        ? "1px solid var(--accent-purple)"
                        : "1px solid var(--border-primary)",
                  }}
                >
                  All
                </button>
                {assignees.map((a) => (
                  <button
                    key={a.initials}
                    onClick={() => setFilterAssignee(a.initials)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all"
                    style={{
                      background:  a.color,
                      outline:
                        filterAssignee === a.initials
                          ? "2px solid var(--accent-purple)"
                          : "none",
                      outlineOffset: "2px",
                    }}
                    title={a.initials}
                  >
                    {a.initials}
                  </button>
                ))}
                <button
                  onClick={() => setFilterAssignee("unassigned")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background:
                      filterAssignee === "unassigned"
                        ? "var(--accent-purple)"
                        : "var(--bg-elevated)",
                    color:
                      filterAssignee === "unassigned"
                        ? "#0b1020"
                        : "var(--text-secondary)",
                    border:
                      filterAssignee === "unassigned"
                        ? "1px solid var(--accent-purple)"
                        : "1px solid var(--border-primary)",
                  }}
                >
                  Unassigned
                </button>
              </div>
            </div>
          )}

          {/* Clear */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setFilterPriority("all");
                setFilterAssignee("all");
                setSearchQuery("");
              }}
              className="nx-btn nx-btn-ghost text-xs"
              style={{ color: "var(--color-error)" }}
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>
      )}

      {/* ── Board Tab ── */}
      {activeTab === "board" && (
        <>
          {/* Sprint stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <SprintStat
              icon={LayoutGrid}
              label="Total"
              value={filteredTasks.length}
              color="var(--text-secondary)"
            />
            <SprintStat
              icon={Clock}
              label="In Progress"
              value={groups.in_progress.length}
              color="var(--color-info)"
            />
            <SprintStat
              icon={CheckCircle2}
              label="Completed"
              value={groups.done.length}
              color="var(--color-success)"
              trend={groups.done.length > 0 ? `+${groups.done.length}` : undefined}
            />
            <SprintStat
              icon={Sparkles}
              label="Remaining"
              value={groups.backlog.length + groups.todo.length}
              color="var(--accent-purple)"
            />
          </div>

          {/* Kanban board */}
          {viewMode === "board" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <BoardColumn
                title="Backlog"
                count={groups.backlog.length}
                dotColor="var(--text-tertiary)"
                onAdd={() => setShowNewTask(true)}
              >
                {groups.backlog.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelect={setSelectedTask}
                  />
                ))}
              </BoardColumn>

              <BoardColumn
                title="To Do"
                count={groups.todo.length}
                dotColor="var(--color-warning)"
                onAdd={() => setShowNewTask(true)}
              >
                {groups.todo.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelect={setSelectedTask}
                  />
                ))}
              </BoardColumn>

              <BoardColumn
                title="In Progress"
                count={groups.in_progress.length}
                dotColor="var(--color-info)"
                onAdd={() => setShowNewTask(true)}
              >
                {groups.in_progress.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelect={setSelectedTask}
                  />
                ))}
              </BoardColumn>

              <BoardColumn
                title="Done"
                count={groups.done.length}
                dotColor="var(--color-success)"
                onAdd={() => setShowNewTask(true)}
              >
                <DoneColumn
                  tasks={groups.done}
                  onSelect={setSelectedTask}
                />
              </BoardColumn>
            </div>
          ) : (
            /* List view */
            <ListView
              tasks={filteredTasks}
              onSelect={setSelectedTask}
            />
          )}
        </>
      )}

      {/* ── Timeline Tab ── */}
      {activeTab === "timeline" && (
        <div className="space-y-6">
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Timeline
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Tasks ordered by due date
            </p>
          </div>

          {filteredTasks.filter((t) => t.dueDate).length === 0 ? (
            <div className="nx-card p-12 text-center">
              <Calendar
                className="w-10 h-10 mx-auto mb-4 opacity-20"
                style={{ color: "var(--text-tertiary)" }}
              />
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                No due dates set
              </h3>
              <p
                className="text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                Tasks with due dates will appear here in chronological order
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks
                .filter((t) => t.dueDate)
                .sort((a, b) => {
                  if (!a.dueDate) return 1;
                  if (!b.dueDate) return -1;
                  return a.dueDate.localeCompare(b.dueDate);
                })
                .map((task) => (
                  <div
                    key={task.id}
                    className="nx-card p-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background:
                          task.status === "done"
                            ? "var(--color-success)"
                            : task.status === "in_progress"
                            ? "var(--color-info)"
                            : "var(--text-tertiary)",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {task.title}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {task.taskCode} · {task.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {task.priority && (
                        <span
                          className={`nx-badge ${
                            task.priority === "High"
                              ? "nx-badge-high"
                              : task.priority === "Medium"
                              ? "nx-badge-medium"
                              : "nx-badge-low"
                          }`}
                        >
                          {task.priority}
                        </span>
                      )}
                      <div
                        className="flex items-center gap-1.5 text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <Calendar className="w-3 h-3" />
                        {task.dueDate}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ── Backlog Tab ── */}
      {activeTab === "backlog" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                Backlog
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {groups.backlog.length + groups.todo.length} tasks not yet
                started
              </p>
            </div>
            <button
              onClick={() => setShowNewTask(true)}
              className="nx-btn nx-btn-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              New Task
            </button>
          </div>

          {groups.backlog.length + groups.todo.length === 0 ? (
            <div className="nx-card p-12 text-center">
              <Sparkles
                className="w-10 h-10 mx-auto mb-4 opacity-20"
                style={{ color: "var(--accent-purple)" }}
              />
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Backlog is clear
              </h3>
              <p
                className="text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                All tasks are in progress or completed
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...groups.backlog, ...groups.todo].map((task) => (
                <div
                  key={task.id}
                  className="nx-card p-4 flex items-center gap-4 cursor-pointer"
                  onClick={() => setSelectedTask(task)}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background:
                        task.status === "todo"
                          ? "var(--color-warning)"
                          : "var(--text-tertiary)",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {task.title}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {task.taskCode} · {task.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className="text-xs px-2 py-0.5 rounded-md capitalize"
                      style={{
                        background: "var(--bg-subtle)",
                        color:      "var(--text-secondary)",
                      }}
                    >
                      {task.status === "todo" ? "To Do" : "Backlog"}
                    </span>
                    {task.priority && (
                      <span
                        className={`nx-badge ${
                          task.priority === "High"
                            ? "nx-badge-high"
                            : task.priority === "Medium"
                            ? "nx-badge-medium"
                            : "nx-badge-low"
                        }`}
                      >
                        {task.priority}
                      </span>
                    )}
                    {task.assignee ? (
                      <Avatar assignee={task.assignee} size="sm" />
                    ) : (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "var(--bg-subtle)" }}
                      >
                        <User
                          className="w-2.5 h-2.5"
                          style={{ color: "var(--text-tertiary)" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  List View                                                  */
/* ─────────────────────────────────────────────────────────── */

function ListView({
  tasks,
  onSelect,
}: {
  tasks:    DisplayTask[];
  onSelect: (task: DisplayTask) => void;
}) {
  const [sortBy, setSortBy] = useState<"status" | "priority" | "title">("status");

  const sorted = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (sortBy === "priority") {
        const order = { High: 0, Medium: 1, Low: 2, undefined: 3 };
        return (order[a.priority ?? "undefined"] ?? 3) -
               (order[b.priority ?? "undefined"] ?? 3);
      }
      if (sortBy === "title") return a.title.localeCompare(b.title);
      const statusOrder = { in_progress: 0, todo: 1, backlog: 2, done: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [tasks, sortBy]);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--border-primary)" }}
    >
      {/* List header */}
      <div
        className="flex items-center gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
        style={{
          background:  "var(--bg-subtle)",
          borderBottom: "1px solid var(--border-primary)",
          color:        "var(--text-tertiary)",
        }}
      >
        <span className="flex-1">Task</span>
        <button
          className="flex items-center gap-1 hover:opacity-80"
          onClick={() => setSortBy("status")}
          style={{ color: sortBy === "status" ? "var(--accent-purple)" : undefined }}
        >
          Status <ArrowUpDown className="w-3 h-3" />
        </button>
        <button
          className="flex items-center gap-1 hover:opacity-80 w-20"
          onClick={() => setSortBy("priority")}
          style={{ color: sortBy === "priority" ? "var(--accent-purple)" : undefined }}
        >
          Priority <ArrowUpDown className="w-3 h-3" />
        </button>
        <span className="w-16 text-right">Assignee</span>
      </div>

      {sorted.length === 0 ? (
        <div
          className="py-12 text-center text-sm"
          style={{ color: "var(--text-tertiary)" }}
        >
          No tasks match the current filters
        </div>
      ) : (
        sorted.map((task, i) => (
          <div
            key={task.id}
            className="flex items-center gap-4 px-4 py-3 cursor-pointer transition-all"
            style={{
              borderBottom:
                i < sorted.length - 1
                  ? "1px solid var(--border-secondary)"
                  : "none",
              background: "var(--bg-card)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-card-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-card)";
            }}
            onClick={() => onSelect(task)}
          >
            {/* Status dot */}
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background:
                  task.status === "done"
                    ? "var(--color-success)"
                    : task.status === "in_progress"
                    ? "var(--color-info)"
                    : task.status === "todo"
                    ? "var(--color-warning)"
                    : "var(--text-tertiary)",
              }}
            />

            {/* Title */}
            <div className="flex-1 min-w-0">
              <span
                className="text-sm font-medium truncate block"
                style={{ color: "var(--text-primary)" }}
              >
                {task.title}
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                {task.taskCode} · {task.category}
              </span>
            </div>

            {/* Status */}
            <span
              className="text-xs px-2 py-0.5 rounded-md capitalize w-24 text-center"
              style={{
                background: "var(--bg-subtle)",
                color:      "var(--text-secondary)",
              }}
            >
              {task.status === "in_progress"
                ? "In Progress"
                : task.status === "todo"
                ? "To Do"
                : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </span>

            {/* Priority */}
            <div className="w-20 flex justify-center">
              {task.priority ? (
                <span
                  className={`nx-badge ${
                    task.priority === "High"
                      ? "nx-badge-high"
                      : task.priority === "Medium"
                      ? "nx-badge-medium"
                      : "nx-badge-low"
                  }`}
                >
                  {task.priority}
                </span>
              ) : (
                <span style={{ color: "var(--text-tertiary)" }}>—</span>
              )}
            </div>

            {/* Assignee */}
            <div className="w-16 flex justify-end">
              {task.assignee ? (
                <Avatar assignee={task.assignee} size="sm" />
              ) : (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "var(--bg-subtle)" }}
                >
                  <User
                    className="w-2.5 h-2.5"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Done Column                                                */
/* ─────────────────────────────────────────────────────────── */

function DoneColumn({
  tasks,
  onSelect,
}: {
  tasks:    DisplayTask[];
  onSelect: (task: DisplayTask) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_SHOW = 3;
  const visible   = showAll ? tasks : tasks.slice(0, INITIAL_SHOW);
  const remaining = tasks.length - INITIAL_SHOW;

  return (
    <>
      {visible.map((task) => (
        <TaskCard key={task.id} task={task} compact onSelect={onSelect} />
      ))}
      {!showAll && remaining > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs font-medium py-2 px-3 rounded-lg w-full text-left transition-all"
          style={{ color: "var(--text-tertiary)", background: "transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-subtle)";
            e.currentTarget.style.color      = "var(--text-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color      = "var(--text-tertiary)";
          }}
        >
          + Show {remaining} more completed
        </button>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Sprint Stat                                                */
/* ─────────────────────────────────────────────────────────── */

function SprintStat({
  icon: Icon,
  label,
  value,
  color,
  trend,
}: {
  icon:   React.ElementType;
  label:  string;
  value:  number;
  color:  string;
  trend?: string;
}) {
  return (
    <div className="nx-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {trend && (
          <span
            className="text-xs font-medium flex items-center gap-0.5"
            style={{ color: "var(--color-success)" }}
          >
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <p
        className="text-xl font-bold leading-none tabular-nums"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Board Column                                               */
/* ─────────────────────────────────────────────────────────── */

function BoardColumn({
  title,
  count,
  dotColor,
  children,
  onAdd,
}: {
  title:    string;
  count:    number;
  dotColor: string;
  children: React.ReactNode;
  onAdd:    () => void;
}) {
  return (
    <div
      className="rounded-2xl p-3 min-h-[600px] flex flex-col"
      style={{
        background: "var(--bg-card)",
        border:     "1px solid var(--border-primary)",
      }}
    >
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: dotColor }}
          />
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h3>
          <span
            className="text-xs px-1.5 py-0.5 rounded-md tabular-nums"
            style={{
              background: "var(--bg-subtle)",
              color:      "var(--text-tertiary)",
            }}
          >
            {count}
          </span>
        </div>
        <button
          onClick={onAdd}
          className="nx-btn nx-btn-ghost p-1 rounded-md"
          title="Add task"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex flex-col gap-2.5 flex-1">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Task Card                                                  */
/* ─────────────────────────────────────────────────────────── */

function TaskCard({
  task,
  compact,
  onSelect,
}: {
  task:      DisplayTask;
  compact?:  boolean;
  onSelect?: (task: DisplayTask) => void;
}) {
  const priorityClass =
    task.priority === "High"
      ? "nx-badge-high"
      : task.priority === "Medium"
      ? "nx-badge-medium"
      : "nx-badge-low";

  if (compact) {
    return (
      <div
        className="rounded-lg p-3 cursor-pointer transition-all group"
        style={{
          background: "var(--bg-subtle)",
          border:     "1px solid transparent",
        }}
        onClick={() => onSelect?.(task)}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--border-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "transparent";
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2
            className="w-3.5 h-3.5 flex-shrink-0"
            style={{ color: "var(--color-success)" }}
          />
          <p
            className="text-sm line-through leading-tight flex-1 min-w-0 truncate"
            style={{ color: "var(--text-tertiary)" }}
          >
            {task.title}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-5">
          <span className="nx-task-id text-[10px]">{task.taskCode}</span>
          {task.assignee && <Avatar assignee={task.assignee} size="xs" />}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-3.5 cursor-pointer transition-all duration-150 group"
      style={{
        background: "var(--bg-elevated)",
        border:     "1px solid var(--border-primary)",
      }}
      onClick={() => onSelect?.(task)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-primary)";
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="nx-category">{task.category}</p>
        <button
          className="nx-btn nx-btn-ghost p-0.5 rounded-md opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(task);
          }}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      <h4
        className="text-sm font-semibold leading-snug mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        {task.title}
      </h4>

      {task.description && (
        <p
          className="text-xs leading-relaxed mb-3 line-clamp-2"
          style={{ color: "var(--text-secondary)" }}
        >
          {task.description}
        </p>
      )}

      {task.progress !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Progress
            </span>
            <span
              className="text-xs font-medium tabular-nums"
              style={{ color: "var(--text-secondary)" }}
            >
              {task.progress}%
            </span>
          </div>
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: "var(--border-primary)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width:      `${task.progress}%`,
                background: "linear-gradient(90deg, #a78bfa 0%, #7c3aed 100%)",
              }}
            />
          </div>
        </div>
      )}

      {task.dueDate && (
        <div className="flex items-center gap-1.5 mb-3">
          <Calendar className="w-3 h-3" style={{ color: "var(--text-tertiary)" }} />
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {task.dueDate}
          </span>
        </div>
      )}

      <div
        className="flex items-center justify-between pt-2 border-t"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div className="flex items-center gap-2">
          <span className="nx-task-id">{task.taskCode}</span>
          {task.priority && (
            <span className={`nx-badge ${priorityClass}`}>{task.priority}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <Avatar assignee={task.assignee} size="sm" />
          ) : (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg-subtle)" }}
            >
              <User
                className="w-2.5 h-2.5"
                style={{ color: "var(--text-tertiary)" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Avatar                                                     */
/* ─────────────────────────────────────────────────────────── */

function Avatar({
  assignee,
  size = "sm",
}: {
  assignee: Assignee;
  size?:    "xs" | "sm";
}) {
  const dim = size === "xs" ? "w-4 h-4 text-[8px]" : "w-5 h-5 text-[9px]";
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-semibold text-white border-2`}
      style={{ background: assignee.color, borderColor: "var(--bg-elevated)" }}
    >
      {assignee.initials}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  New Task Panel                                             */
/* ─────────────────────────────────────────────────────────── */

function NewTaskPanel({
  projectId,
  onClose,
  onCreated,
}: {
  projectId: string;
  onClose:   () => void;
  onCreated: () => void;
}) {
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [status,      setStatus]      = useState<ApiTask["status"]>("todo");
  const [priority,    setPriority]    = useState<ApiTask["priority"]>("medium");
  const [category,    setCategory]    = useState("GENERAL");
  const [assignee,    setAssignee]    = useState("");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      // Generate a task code
      const taskCode = `MB-${Date.now().toString().slice(-4)}`;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          project_id:  projectId,
          task_code:   taskCode,
          title:       title.trim(),
          description: description.trim() || null,
          status,
          priority,
          category:    category || "GENERAL",
          assignee:    assignee.trim() || null,
          progress:    0,
        }),
      });

      onCreated();
    } catch (err: any) {
      setError(err.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const statusOptions: { value: ApiTask["status"]; label: string; color: string }[] = [
    { value: "backlog",     label: "Backlog",     color: "var(--text-tertiary)" },
    { value: "todo",        label: "To Do",       color: "var(--color-warning)" },
    { value: "in_progress", label: "In Progress", color: "var(--color-info)"    },
    { value: "done",        label: "Done",        color: "var(--color-success)"  },
  ];

  const priorityOptions: { value: ApiTask["priority"]; label: string; color: string }[] = [
    { value: "high",   label: "High",   color: "var(--color-error)"   },
    { value: "medium", label: "Medium", color: "var(--color-warning)" },
    { value: "low",    label: "Low",    color: "var(--color-info)"    },
  ];

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{
          background: "var(--bg-card)",
          border:     "1px solid var(--border-primary)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            New Task
          </h3>
          <button
            onClick={onClose}
            className="nx-btn nx-btn-ghost p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {error && (
            <div
              className="rounded-lg p-3 text-sm flex items-center gap-2"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border:     "1px solid rgba(239, 68, 68, 0.2)",
                color:      "var(--color-error)",
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
              style={{ color: "var(--text-tertiary)" }}
            >
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                background: "var(--bg-elevated)",
                border:     "1px solid var(--border-primary)",
                color:      "var(--text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-purple)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-primary)";
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
              style={{ color: "var(--text-tertiary)" }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{
                background: "var(--bg-elevated)",
                border:     "1px solid var(--border-primary)",
                color:      "var(--text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-purple)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-primary)";
              }}
            />
          </div>

          {/* Category + Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
                style={{ color: "var(--text-tertiary)" }}
              >
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value.toUpperCase())}
                placeholder="GENERAL"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  border:     "1px solid var(--border-primary)",
                  color:      "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-purple)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-primary)";
                }}
              />
            </div>
            <div>
              <label
                className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
                style={{ color: "var(--text-tertiary)" }}
              >
                Assignee
              </label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Name..."
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  border:     "1px solid var(--border-primary)",
                  color:      "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-purple)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-primary)";
                }}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wider mb-2 block"
              style={{ color: "var(--text-tertiary)" }}
            >
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background:
                      status === opt.value
                        ? `${opt.color}20`
                        : "var(--bg-elevated)",
                    border: `1px solid ${
                      status === opt.value
                        ? opt.color
                        : "var(--border-primary)"
                    }`,
                    color:
                      status === opt.value ? opt.color : "var(--text-secondary)",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: opt.color }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wider mb-2 block"
              style={{ color: "var(--text-tertiary)" }}
            >
              Priority
            </label>
            <div className="flex gap-2">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className="flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background:
                      priority === opt.value
                        ? `${opt.color}20`
                        : "var(--bg-elevated)",
                    border: `1px solid ${
                      priority === opt.value
                        ? opt.color
                        : "var(--border-primary)"
                    }`,
                    color:
                      priority === opt.value
                        ? opt.color
                        : "var(--text-secondary)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-end gap-2"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <button onClick={onClose} className="nx-btn nx-btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !title.trim()}
            className="nx-btn nx-btn-primary disabled:opacity-40"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> Create Task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Task Detail Panel                                          */
/* ─────────────────────────────────────────────────────────── */

function TaskDetailPanel({
  task,
  onClose,
  onUpdate,
}: {
  task:     DisplayTask;
  onClose:  () => void;
  onUpdate: () => void;
}) {
  const [status,   setStatus]   = useState<ApiTask["status"]>(task.status);
  const [priority, setPriority] = useState<ApiTask["priority"]>(
    (task.priority?.toLowerCase() as ApiTask["priority"]) || "medium"
  );
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await api.tasks.update(task.id, { status, priority });
      setSuccess(true);
      onUpdate();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      setError((err as Error).message || "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const statusOptions: { value: ApiTask["status"]; label: string; color: string }[] = [
    { value: "backlog",     label: "Backlog",     color: "var(--text-tertiary)" },
    { value: "todo",        label: "To Do",       color: "var(--color-warning)" },
    { value: "in_progress", label: "In Progress", color: "var(--color-info)"    },
    { value: "done",        label: "Done",        color: "var(--color-success)"  },
  ];

  const priorityOptions: { value: ApiTask["priority"]; label: string; color: string }[] = [
    { value: "high",   label: "High",   color: "var(--color-error)"   },
    { value: "medium", label: "Medium", color: "var(--color-warning)" },
    { value: "low",    label: "Low",    color: "var(--color-info)"    },
  ];

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{
          background: "var(--bg-card)",
          border:     "1px solid var(--border-primary)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <div className="flex items-center gap-2">
            <span className="nx-task-id">{task.taskCode}</span>
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-tertiary)" }}
            >
              {task.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="nx-btn nx-btn-ghost p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <h3
            className="text-base font-semibold leading-snug"
            style={{ color: "var(--text-primary)" }}
          >
            {task.title}
          </h3>

          {task.description && (
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {task.description}
            </p>
          )}

          {error && (
            <div
              className="rounded-lg p-3 text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border:     "1px solid rgba(239, 68, 68, 0.2)",
                color:      "var(--color-error)",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="rounded-lg p-3 text-sm flex items-center gap-2"
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                border:     "1px solid rgba(16, 185, 129, 0.2)",
                color:      "var(--color-success)",
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Task updated
            </div>
          )}

          {/* Status */}
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wider mb-2 block"
              style={{ color: "var(--text-tertiary)" }}
            >
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background:
                      status === opt.value
                        ? `${opt.color}20`
                        : "var(--bg-elevated)",
                    border: `1px solid ${
                      status === opt.value
                        ? opt.color
                        : "var(--border-primary)"
                    }`,
                    color:
                      status === opt.value ? opt.color : "var(--text-secondary)",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: opt.color }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wider mb-2 block"
              style={{ color: "var(--text-tertiary)" }}
            >
              Priority
            </label>
            <div className="flex gap-2">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className="flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background:
                      priority === opt.value
                        ? `${opt.color}20`
                        : "var(--bg-elevated)",
                    border: `1px solid ${
                      priority === opt.value
                        ? opt.color
                        : "var(--border-primary)"
                    }`,
                    color:
                      priority === opt.value
                        ? opt.color
                        : "var(--text-secondary)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-end gap-2"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <button onClick={onClose} className="nx-btn nx-btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="nx-btn nx-btn-primary disabled:opacity-40"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}