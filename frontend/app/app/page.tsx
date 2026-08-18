// frontend/app/app/page.tsx

"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useOrg } from "@/components/OrgContext";
import {
  useProjectStats,
  useProject,
  useDecisions,
  useTasks,
  useStandups,
} from "@/hooks/useApi";
import {
  CheckSquare,
  Lightbulb,
  Brain,
  MessageSquare,
  Database,
  Server,
  Activity,
  ArrowUpRight,
  Sparkles,
  Zap,
  BarChart2,
  PieChart,
  GitBranch,
  Hash,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────── */
/*  Shimmer primitives                                         */
/* ─────────────────────────────────────────────────────────── */

function LoadingShell({
  loading,
  children,
  className = "",
}: {
  loading:    boolean;
  children:   React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <div className={loading ? "skel-blur" : ""}>
        {children}
      </div>
      {loading && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
          <div className="absolute inset-0 skel-shimmer" />
        </div>
      )}
    </div>
  );
}

function SkeletonLine({
  width  = "100%",
  height = "14px",
}: {
  width?:  string;
  height?: string;
}) {
  return (
    <div
      className="rounded-md"
      style={{
        width,
        height,
        background: "var(--bg-subtle)",
        opacity: 0.7,
      }}
    />
  );
}

function StatCardSkeleton({ color }: { color: string }) {
  return (
    <div
      className="nx-card p-5 relative overflow-hidden"
    >
      <div className="absolute inset-0 skel-shimmer pointer-events-none" />
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-lg"
          style={{ background: `${color}20` }}
        />
        <SkeletonLine width="48px" height="12px" />
      </div>
      <SkeletonLine width="64px" height="32px" />
      <div className="mt-2">
        <SkeletonLine width="80px" height="12px" />
      </div>
    </div>
  );
}

function ActivityRowSkeleton({ index }: { index: number }) {
  const widths = ["75%", "60%", "85%", "55%", "70%"];
  return (
    <div
      className="flex items-start gap-3 py-3"
      style={{
        borderBottom: "1px solid var(--border-secondary)",
        opacity: 1 - index * 0.18,
      }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
        style={{ background: "var(--bg-subtle)" }}
      />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <SkeletonLine width="52px" height="11px" />
          <SkeletonLine width="36px" height="11px" />
        </div>
        <SkeletonLine width={widths[index % widths.length]} height="13px" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Dashboard                                                  */
/* ─────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const org = useOrg();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: project }                        = useProject();
  const { data: stats, isLoading: statsLoading } = useProjectStats();
  const { data: decisions, isLoading: decisionsLoading } = useDecisions();
  const { data: tasks,     isLoading: tasksLoading }     = useTasks();
  const { data: standups }                               = useStandups();

  const activity      = buildActivityFeed(decisions, tasks);
  const latestStandup = standups?.[0];
  const isLoading     = statsLoading || decisionsLoading || tasksLoading;

  return (
    <AppShell
      tabs={[
        { label: "Overview",  key: "overview"  },
        { label: "Analytics", key: "analytics" },
        { label: "Memory",    key: "memory"    },
      ]}
      defaultTab="overview"
      onTabChange={setActiveTab}
    >

      {/* ── Overview Tab ───────────────────────────────────── */}
      {activeTab === "overview" && (
        <>
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="nx-badge nx-badge-active">Active</span>
                <span
                  className="text-xs font-mono"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {org.orgSlug}
                </span>
              </div>
              <h1
                className="text-3xl font-bold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                {project?.name || org.orgName || "Dashboard"}
              </h1>
              <p
                className="text-sm max-w-2xl"
                style={{ color: "var(--text-secondary)" }}
              >
                {project?.description ||
                  "Your AI-powered project workspace with persistent memory"}
              </p>
            </div>

            {/* Progress card */}
            <LoadingShell loading={statsLoading} className="rounded-xl min-w-[220px]">
              <div
                className="rounded-xl px-5 py-4 min-w-[220px]"
                style={{
                  background: "var(--bg-card)",
                  border:     "1px solid var(--border-primary)",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Overall Progress
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {calculateProgress(stats)}%
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full mb-3 overflow-hidden"
                  style={{ background: "var(--border-primary)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width:      `${calculateProgress(stats)}%`,
                      background: "linear-gradient(90deg, #a78bfa 0%, #7c3aed 100%)",
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: "var(--text-tertiary)" }}>
                    {stats?.tasks?.by_status?.done || 0} done
                  </span>
                  <span style={{ color: "var(--text-tertiary)" }}>
                    {stats?.tasks?.total || 0} total
                  </span>
                </div>
              </div>
            </LoadingShell>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statsLoading ? (
              <>
                <StatCardSkeleton color="var(--color-info)"    />
                <StatCardSkeleton color="var(--color-warning)" />
                <StatCardSkeleton color="var(--accent-purple)" />
                <StatCardSkeleton color="var(--color-success)" />
              </>
            ) : (
              <>
                <StatCard
                  icon={CheckSquare}
                  label="Active Tasks"
                  value={String(stats?.tasks?.total || 0)}
                  change={`${stats?.tasks?.by_status?.done || 0} done`}
                  color="var(--color-info)"
                />
                <StatCard
                  icon={Lightbulb}
                  label="Decisions Logged"
                  value={String(stats?.decisions || 0)}
                  change="all embedded"
                  color="var(--color-warning)"
                />
                <StatCard
                  icon={Brain}
                  label="Memory Entries"
                  value={String(stats?.memory_entries || 0)}
                  change="searchable"
                  color="var(--accent-purple)"
                />
                <StatCard
                  icon={MessageSquare}
                  label="Conversations"
                  value={String(stats?.conversations || 0)}
                  change="sessions"
                  color="var(--color-success)"
                />
              </>
            )}
          </div>

          {/* Bento layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Recent activity */}
            <div className="nx-card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity
                    className="w-4 h-4"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Recent Memory Activity
                  </h3>
                </div>
                <Link
                  href="/app/chat"
                  className="text-xs font-medium flex items-center gap-1"
                  style={{ color: "var(--accent-purple)" }}
                >
                  View All
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-0">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <ActivityRowSkeleton key={i} index={i} />
                  ))
                ) : activity.length === 0 ? (
                  <div className="py-10 text-center">
                    <Activity
                      className="w-8 h-8 mx-auto mb-3 opacity-20"
                      style={{ color: "var(--text-tertiary)" }}
                    />
                    <p
                      className="text-sm font-medium mb-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      No activity yet
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Start by creating tasks or logging decisions
                    </p>
                  </div>
                ) : (
                  activity.map((item, i) => (
                    <ActivityItem
                      key={i}
                      {...item}
                      isLast={i === activity.length - 1}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Memory health */}
            <div className="nx-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Database
                    className="w-4 h-4"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Memory Health
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: "var(--color-success)" }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--color-success)" }}
                  >
                    Healthy
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <HealthRow
                  icon={Database}
                  label="CockroachDB"
                  value="Connected"
                  detail="us-east-1"
                  ok
                />
                <HealthRow
                  icon={Brain}
                  label="Vector Index"
                  value={statsLoading ? "—" : `${stats?.memory_entries || 0} entries`}
                  detail="1024d"
                  ok
                />
                <HealthRow
                  icon={Server}
                  label="Bedrock"
                  value="Claude 4.5"
                  detail="+ Titan v2"
                  ok
                />
                <HealthRow
                  icon={Database}
                  label="MCP Tools"
                  value="5 tools active"
                  detail="direct DB queries"
                  ok
                />    
                <HealthRow
                  icon={Zap}
                  label="API"
                  value="Live"
                  detail="port 3001"
                  ok
                />
              </div>
            </div>

            {/* Latest briefing summary */}
            <div
              className="rounded-2xl p-5 lg:col-span-2"
              style={{
                background:
                  "linear-gradient(135deg, rgba(167, 139, 250, 0.08) 0%, rgba(124, 58, 237, 0.03) 100%)",
                border: "1px solid rgba(167, 139, 250, 0.2)",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="w-4 h-4"
                    style={{ color: "var(--accent-purple)" }}
                  />
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    AI Summary — Latest Briefing
                  </h3>
                </div>
                {latestStandup && (
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {Math.round((latestStandup.confidence || 0) * 100)}%
                    confidence
                  </span>
                )}
              </div>

              {latestStandup?.highlights ? (
                <div className="space-y-3">
                  {(latestStandup.highlights as string[])
                    .slice(0, 3)
                    .map((highlight: string, i: number) => (
                      <SummaryItem
                        key={i}
                        icon={i === 0 ? "✓" : i === 1 ? "!" : "i"}
                        iconColor={
                          i === 0
                            ? "var(--color-success)"
                            : i === 1
                            ? "var(--color-warning)"
                            : "var(--accent-purple)"
                        }
                        title={`Highlight ${i + 1}`}
                        text={highlight}
                      />
                    ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <Sparkles
                    className="w-6 h-6 mx-auto mb-2 opacity-30"
                    style={{ color: "var(--accent-purple)" }}
                  />
                  <p
                    className="text-sm mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    No briefings yet
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Generate one from the Briefings page to see AI summaries here
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <Link
                  href="/app/standup"
                  className="nx-btn nx-btn-secondary text-xs"
                >
                  View Briefings
                </Link>
              </div>
            </div>

            {/* Quick actions */}
            <div className="nx-card p-5">
              <h3
                className="text-sm font-semibold mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Quick Actions
              </h3>
              <div className="flex flex-col gap-2">
                <QuickAction
                  icon={MessageSquare}
                  label="Ask Memory"
                  href="/app/chat"
                />
                <QuickAction
                  icon={Lightbulb}
                  label="Log Decision"
                  href="/app/decisions"
                />
                <QuickAction
                  icon={CheckSquare}
                  label="View Tasks"
                  href="/app/tasks"
                />
                <QuickAction
                  icon={Zap}
                  label="Run Briefing"
                  href="/app/standup"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Analytics Tab ──────────────────────────────────── */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Analytics
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Project health and activity breakdown
            </p>
          </div>

          {/* Task breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Task status breakdown */}
            <LoadingShell loading={statsLoading} className="nx-card p-5 rounded-2xl">
              <div className="nx-card p-5">
                <div className="flex items-center gap-2 mb-5">
                  <PieChart
                    className="w-4 h-4"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Task Status Breakdown
                  </h3>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Backlog",     key: "backlog",     color: "var(--text-tertiary)" },
                    { label: "To Do",       key: "todo",        color: "var(--color-info)"    },
                    { label: "In Progress", key: "in_progress", color: "var(--color-warning)" },
                    { label: "Done",        key: "done",        color: "var(--color-success)" },
                  ].map((s) => {
                    const count = stats?.tasks?.by_status?.[s.key] || 0;
                    const total = stats?.tasks?.total || 1;
                    const pct   = Math.round((count / total) * 100);
                    return (
                      <div key={s.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-xs font-medium"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {s.label}
                          </span>
                          <span
                            className="text-xs font-semibold tabular-nums"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--border-primary)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width:      `${pct}%`,
                              background: s.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </LoadingShell>

            {/* Memory breakdown */}
            <LoadingShell loading={statsLoading} className="nx-card p-5 rounded-2xl">
              <div className="nx-card p-5">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart2
                    className="w-4 h-4"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Memory Source Distribution
                  </h3>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      label: "Decisions",
                      value: stats?.decisions || 0,
                      color: "var(--color-warning)",
                      icon:  Lightbulb,
                    },
                    {
                      label: "Conversations",
                      value: stats?.conversations || 0,
                      color: "var(--color-info)",
                      icon:  MessageSquare,
                    },
                    {
                      label: "Notes",
                      value: stats?.notes || 0,
                      color: "var(--color-success)",
                      icon:  GitBranch,
                    },
                    {
                      label: "Tasks",
                      value: stats?.tasks?.total || 0,
                      color: "var(--accent-purple)",
                      icon:  CheckSquare,
                    },
                  ].map((src) => {
                    const total =
                      (stats?.decisions || 0) +
                      (stats?.conversations || 0) +
                      (stats?.notes || 0) +
                      (stats?.tasks?.total || 0) || 1;
                    const pct = Math.round((src.value / total) * 100);
                    const SrcIcon = src.icon;
                    return (
                      <div
                        key={src.label}
                        className="flex items-center gap-3"
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${src.color}20` }}
                        >
                          <SrcIcon
                            className="w-3.5 h-3.5"
                            style={{ color: src.color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="text-xs font-medium"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {src.label}
                            </span>
                            <span
                              className="text-xs font-semibold tabular-nums"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {src.value}
                            </span>
                          </div>
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ background: "var(--border-primary)" }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width:      `${pct}%`,
                                background: src.color,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </LoadingShell>
          </div>

          {/* Summary stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Memory Entries",
                value: stats?.memory_entries || 0,
                color: "var(--accent-purple)",
                icon:  Brain,
              },
              {
                label: "Completion Rate",
                value: `${calculateProgress(stats)}%`,
                color: "var(--color-success)",
                icon:  CheckSquare,
              },
              {
                label: "Briefings Generated",
                value: stats?.standups || 0,
                color: "var(--color-info)",
                icon:  Sparkles,
              },
              {
                label: "Notes Stored",
                value: stats?.notes || 0,
                color: "var(--color-warning)",
                icon:  Hash,
              },
            ].map((item) => {
              const ItemIcon = item.icon;
              return (
                <LoadingShell
                  key={item.label}
                  loading={statsLoading}
                  className="nx-card p-4 rounded-2xl"
                >
                  <div className="nx-card p-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                      style={{ background: `${item.color}20` }}
                    >
                      <ItemIcon
                        className="w-4 h-4"
                        style={{ color: item.color }}
                      />
                    </div>
                    <p
                      className="text-2xl font-bold mb-1 tabular-nums"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.value}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {item.label}
                    </p>
                  </div>
                </LoadingShell>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Memory Tab ─────────────────────────────────────── */}
      {activeTab === "memory" && (
        <div className="space-y-6">
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Memory Index
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              All project knowledge stored and semantically indexed in
              CockroachDB
            </p>
          </div>

          {/* Memory health cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Vector store status */}
            <LoadingShell loading={statsLoading} className="nx-card p-5 rounded-2xl">
              <div className="nx-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Brain
                    className="w-4 h-4"
                    style={{ color: "var(--accent-purple)" }}
                  />
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Vector Store
                  </h3>
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: "var(--color-success)" }}
                  />
                </div>

                <p
                  className="text-3xl font-bold mb-1 tabular-nums"
                  style={{ color: "var(--text-primary)" }}
                >
                  {stats?.memory_entries || 0}
                </p>
                <p
                  className="text-xs mb-4"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  embeddings stored
                </p>

                <div className="space-y-2 pt-3" style={{ borderTop: "1px solid var(--border-primary)" }}>
                  <MemoryMetaRow label="Dimensions"   value="1024d" />
                  <MemoryMetaRow label="Model"         value="Titan Embed v2" />
                  <MemoryMetaRow label="Index type"    value="Vector (cosine)" />
                  <MemoryMetaRow label="DB"             value="CockroachDB Cloud" />
                </div>
              </div>
            </LoadingShell>

            {/* Embedding coverage */}
            <LoadingShell loading={statsLoading} className="nx-card p-5 rounded-2xl lg:col-span-2">
              <div className="nx-card p-5">
                <div className="flex items-center gap-2 mb-5">
                  <Database
                    className="w-4 h-4"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Embedding Coverage
                  </h3>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      label:   "Decisions",
                      stored:  stats?.decisions || 0,
                      color:   "var(--color-warning)",
                      icon:    Lightbulb,
                      description: "Auto-embedded on creation",
                    },
                    {
                      label:   "Conversations",
                      stored:  stats?.conversations || 0,
                      color:   "var(--color-info)",
                      icon:    MessageSquare,
                      description: "Embedded after each message",
                    },
                    {
                      label:   "Notes",
                      stored:  stats?.notes || 0,
                      color:   "var(--color-success)",
                      icon:    GitBranch,
                      description: "Auto-embedded on creation",
                    },
                  ].map((src) => {
                    const SrcIcon = src.icon;
                    return (
                      <div
                        key={src.label}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ background: "var(--bg-subtle)" }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${src.color}20` }}
                        >
                          <SrcIcon
                            className="w-4 h-4"
                            style={{ color: src.color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span
                              className="text-sm font-semibold"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {src.label}
                            </span>
                            <span
                              className="text-sm font-bold tabular-nums"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {src.stored}
                            </span>
                          </div>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {src.description}
                          </p>
                        </div>
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
                          style={{
                            background:
                              src.stored > 0
                                ? "var(--color-success)"
                                : "var(--text-tertiary)",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </LoadingShell>
          </div>

          {/* Semantic search CTA */}
          <div
            className="rounded-2xl p-6 flex items-center justify-between"
            style={{
              background:
                "linear-gradient(135deg, rgba(167, 139, 250, 0.08) 0%, rgba(124, 58, 237, 0.03) 100%)",
              border: "1px solid rgba(167, 139, 250, 0.2)",
            }}
          >
            <div>
              <h3
                className="text-base font-semibold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                Search the memory index
              </h3>
              <p
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Use natural language to find any decision, conversation, or
                note across your entire project history.
              </p>
            </div>
            <Link
              href="/app/chat"
              className="nx-btn nx-btn-primary flex-shrink-0 ml-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Helpers                                                    */
/* ─────────────────────────────────────────────────────────── */

function calculateProgress(stats: any): number {
  if (!stats?.tasks) return 0;
  const total = stats.tasks.total || 1;
  const done  = stats.tasks.by_status?.done || 0;
  return Math.round((done / total) * 100);
}

function buildActivityFeed(decisions: any[] = [], tasks: any[] = []) {
  const items: Array<{
    type: "decision" | "task" | "memory";
    text: string;
    time: string;
  }> = [];

  decisions?.slice(0, 3).forEach((d: any) => {
    items.push({
      type: "decision",
      text: `Decision: ${d.title}`,
      time: formatRelativeTime(d.created_at),
    });
  });

  tasks
    ?.filter((t: any) => t.status === "done")
    .slice(0, 2)
    .forEach((t: any) => {
      items.push({
        type: "task",
        text: `Completed: ${t.title}`,
        time: formatRelativeTime(t.updated_at || t.created_at),
      });
    });

  return items.slice(0, 6);
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "";
  const date     = new Date(dateStr);
  const now      = new Date();
  const diffMs   = now.getTime() - date.getTime();
  const diffMin  = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay  = Math.floor(diffHour / 24);

  if (diffMin  < 1)  return "just now";
  if (diffMin  < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
}

/* ─────────────────────────────────────────────────────────── */
/*  Sub-components                                             */
/* ─────────────────────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  change,
  color,
}: {
  icon:   React.ElementType;
  label:  string;
  value:  string;
  change: string;
  color:  string;
}) {
  return (
    <div className="nx-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div
          className="flex items-center text-xs font-medium"
          style={{ color: "var(--text-tertiary)" }}
        >
          {change}
        </div>
      </div>
      <p
        className="text-2xl font-bold leading-none mb-1 tabular-nums"
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

function ActivityItem({
  type,
  text,
  time,
  isLast,
}: {
  type:   "decision" | "task" | "memory";
  text:   string;
  time:   string;
  isLast: boolean;
}) {
  const typeMap = {
    decision: { color: "var(--color-warning)", label: "Decision" },
    task:     { color: "var(--color-info)",    label: "Task"     },
    memory:   { color: "var(--accent-purple)", label: "Memory"   },
  };
  const cfg = typeMap[type];

  return (
    <div
      className="flex items-start gap-3 py-3"
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--border-secondary)",
      }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
        style={{ background: cfg.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            · {time}
          </span>
        </div>
        <p
          className="text-sm truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

function HealthRow({
  icon: Icon,
  label,
  value,
  detail,
  ok,
}: {
  icon:   React.ElementType;
  label:  string;
  value:  string;
  detail: string;
  ok:     boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--bg-subtle)" }}
      >
        <Icon
          className="w-3.5 h-3.5"
          style={{ color: "var(--text-secondary)" }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </p>
        <p
          className="text-xs leading-tight mt-0.5 truncate"
          style={{ color: "var(--text-tertiary)" }}
        >
          {value} · {detail}
        </p>
      </div>
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: ok ? "var(--color-success)" : "var(--color-error)",
        }}
      />
    </div>
  );
}

function SummaryItem({
  icon,
  iconColor,
  title,
  text,
}: {
  icon:      string;
  iconColor: string;
  title:     string;
  text:      string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
        style={{ background: `${iconColor}20`, color: iconColor }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold mb-0.5"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </p>
        <p
          className="text-xs leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
}: {
  icon:  React.ElementType;
  label: string;
  href:  string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150"
      style={{ background: "var(--bg-subtle)", border: "1px solid transparent" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      <Icon
        className="w-4 h-4 flex-shrink-0"
        style={{ color: "var(--text-secondary)" }}
      />
      <span
        className="text-sm font-medium flex-1"
        style={{ color: "var(--text-primary)" }}
      >
        {label}
      </span>
    </Link>
  );
}

function MemoryMetaRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
      <span
        className="text-xs font-medium font-mono"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}