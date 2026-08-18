// frontend/app/app/team/page.tsx

"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import AppShell from "@/components/layout/AppShell";
import { useTeam, useTeamMember, useInviteMember } from "@/hooks/useApi";
import type { TeamMember, TeamMemberDetail } from "@/lib/api";
import {
  Users, Activity, CheckSquare, Lightbulb, FileText, Brain,
  Loader2, ChevronRight, Sparkles, X, CheckCircle2,
  BarChart2, TrendingUp, Star, Zap,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────── */
/*  Shimmer helpers                                            */
/* ─────────────────────────────────────────────────────────── */

function SkeletonLine({
  width  = "100%",
  height = "13px",
}: {
  width?:  string;
  height?: string;
}) {
  return (
    <div
      className="rounded-md"
      style={{ width, height, background: "var(--bg-subtle)", opacity: 0.7 }}
    />
  );
}

function MemberCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{
        background:  "var(--bg-elevated)",
        border:      "1px solid var(--border-primary)",
        opacity:     1 - index * 0.2,
      }}
    >
      <div className="absolute inset-0 skel-shimmer pointer-events-none" />
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex-shrink-0"
          style={{ background: "var(--bg-subtle)" }}
        />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="120px" height="14px" />
          <SkeletonLine width="80px"  height="11px" />
          <SkeletonLine width="160px" height="11px" />
          <div className="flex gap-1.5 pt-1">
            <SkeletonLine width="50px" height="20px" />
            <SkeletonLine width="60px" height="20px" />
            <SkeletonLine width="45px" height="20px" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="nx-card p-4 relative overflow-hidden">
      <div className="absolute inset-0 skel-shimmer pointer-events-none" />
      <div
        className="w-8 h-8 rounded-lg mb-3"
        style={{ background: "var(--bg-subtle)" }}
      />
      <SkeletonLine width="60px"  height="24px" />
      <div className="mt-1">
        <SkeletonLine width="80px" height="11px" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Helpers                                                    */
/* ─────────────────────────────────────────────────────────── */

function workloadConfig(workload: string) {
  switch (workload) {
    case "overloaded": return { label: "Overloaded", color: "var(--color-error)"   };
    case "active":     return { label: "Active",     color: "var(--color-info)"    };
    case "available":  return { label: "Available",  color: "var(--color-success)" };
    default:           return { label: "Idle",       color: "var(--text-tertiary)" };
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
  });
}

/* ─────────────────────────────────────────────────────────── */
/*  Team Page                                                  */
/* ─────────────────────────────────────────────────────────── */

export default function TeamPage() {
  const { data: members = [], isLoading } = useTeam();
  const [selectedId,      setSelectedId]      = useState<string | undefined>();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab,       setActiveTab]       = useState("overview");

  // Auto-select first member
  useEffect(() => {
    if (!selectedId && members.length > 0) {
      setSelectedId(members[0].id);
    }
  }, [members, selectedId]);

  const { data: selectedMember, isLoading: detailLoading } =
    useTeamMember(selectedId);

  const stats = useMemo(() => {
    const activeCount = members.filter(
      (m) => m.workload === "active" || m.workload === "overloaded"
    ).length;

    const sorted = [...members].sort(
      (a, b) =>
        b.stats.tasks_assigned +
        b.stats.decisions_authored +
        b.stats.notes_authored -
        (a.stats.tasks_assigned +
          a.stats.decisions_authored +
          a.stats.notes_authored)
    );

    const topDecisionAuthor = [...members].sort(
      (a, b) => b.stats.decisions_authored - a.stats.decisions_authored
    );

    const totalTasks = members.reduce(
      (sum, m) => sum + m.stats.tasks_assigned,
      0
    );
    const totalDecisions = members.reduce(
      (sum, m) => sum + m.stats.decisions_authored,
      0
    );

    return {
      totalMembers:      members.length,
      activeCount,
      topContributor:    sorted[0]?.name        || "—",
      topDecisionAuthor: topDecisionAuthor[0]?.name || "—",
      totalTasks,
      totalDecisions,
    };
  }, [members]);

  // Collect all expertise tags across team
  const allExpertise = useMemo(() => {
    const tagCounts: Record<string, { count: number; members: string[] }> = {};
    members.forEach((m) => {
      m.expertise.forEach((tag) => {
        if (!tagCounts[tag]) tagCounts[tag] = { count: 0, members: [] };
        tagCounts[tag].count++;
        tagCounts[tag].members.push(m.name);
      });
    });
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([tag, data]) => ({ tag, ...data }));
  }, [members]);

  return (
    <AppShell
      tabs={[
        { label: "Overview",  key: "overview"  },
        { label: "Expertise", key: "expertise" },
        { label: "Activity",  key: "activity"  },
      ]}
      defaultTab="overview"
      onTabChange={setActiveTab}
    >
      {showInviteModal && (
        <InviteMemberModal onClose={() => setShowInviteModal(false)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Team
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Who knows what, owns what, and has done what
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="nx-btn nx-btn-primary"
        >
          <Users className="w-3.5 h-3.5" />
          Invite Member
        </button>
      </div>

      {/* ── Overview Tab ─────────────────────────────────── */}
      {activeTab === "overview" && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))
            ) : (
              <>
                <TopStatCard
                  icon={Users}
                  label="Members"
                  value={String(stats.totalMembers)}
                />
                <TopStatCard
                  icon={Activity}
                  label="Active Contributors"
                  value={String(stats.activeCount)}
                />
                <TopStatCard
                  icon={CheckSquare}
                  label="Top Contributor"
                  value={stats.topContributor}
                />
                <TopStatCard
                  icon={Lightbulb}
                  label="Top Decision Author"
                  value={stats.topDecisionAuthor}
                />
              </>
            )}
          </div>

          {/* Members + detail */}
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 h-[calc(100vh-20rem)]">

            {/* Member list */}
            <div className="nx-card p-4 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <Users
                  className="w-4 h-4"
                  style={{ color: "var(--text-secondary)" }}
                />
                <h2
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Members
                </h2>
                {!isLoading && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-md ml-auto tabular-nums"
                    style={{
                      background: "var(--bg-subtle)",
                      color:      "var(--text-tertiary)",
                    }}
                  >
                    {members.length}
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <MemberCardSkeleton key={i} index={i} />
                  ))}
                </div>
              ) : members.length === 0 ? (
                <div className="py-16 text-center">
                  <Brain
                    className="w-8 h-8 mx-auto mb-3 opacity-20"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    No team members yet
                  </p>
                  <p
                    className="text-xs mb-4"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Team members are created automatically from task assignees
                    and decision authors
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      active={selectedId === member.id}
                      onClick={() => setSelectedId(member.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Detail panel */}
            <div className="nx-card overflow-hidden flex flex-col">
              {!selectedId ? (
                <div className="flex-1 flex items-center justify-center">
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Select a team member
                  </p>
                </div>
              ) : detailLoading || !selectedMember ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: "var(--accent-purple)" }}
                  />
                </div>
              ) : (
                <MemberDetail member={selectedMember} />
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Expertise Tab ────────────────────────────────── */}
      {activeTab === "expertise" && (
        <div className="space-y-6">
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Team Expertise
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Skills and knowledge areas across your team
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="nx-card p-4 relative overflow-hidden"
                  style={{ opacity: 1 - i * 0.1 }}
                >
                  <div className="absolute inset-0 skel-shimmer pointer-events-none" />
                  <SkeletonLine width="100px" height="14px" />
                  <div className="mt-3 space-y-2">
                    <SkeletonLine width="80%" height="12px" />
                    <SkeletonLine width="60%" height="12px" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="nx-card p-12 text-center">
              <Star
                className="w-10 h-10 mx-auto mb-4 opacity-20"
                style={{ color: "var(--text-tertiary)" }}
              />
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                No expertise data yet
              </h3>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Expertise tags appear as team members are added to the project
              </p>
            </div>
          ) : (
            <>
              {/* Expertise tag cloud */}
              {allExpertise.length > 0 && (
                <div className="nx-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles
                      className="w-4 h-4"
                      style={{ color: "var(--accent-purple)" }}
                    />
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      All Skills ({allExpertise.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allExpertise.map(({ tag, count, members: tagMembers }) => (
                      <div
                        key={tag}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{
                          background: "var(--bg-subtle)",
                          border:     "1px solid var(--border-primary)",
                          color:      "var(--text-secondary)",
                        }}
                        title={`Known by: ${tagMembers.join(", ")}`}
                      >
                        {tag}
                        {count > 1 && (
                          <span
                            className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                            style={{
                              background: "var(--accent-purple-bg)",
                              color:      "var(--accent-purple)",
                            }}
                          >
                            {count}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-member expertise */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.map((member) => (
                  <div key={member.id} className="nx-card p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                        style={{ background: member.avatar_color }}
                      >
                        {member.initials}
                      </div>
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {member.name}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {member.role}
                        </p>
                      </div>
                    </div>

                    {member.expertise.length === 0 ? (
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        No expertise tags yet
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {member.expertise.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2.5 py-1 rounded-lg"
                            style={{
                              background: "var(--bg-subtle)",
                              color:      "var(--text-secondary)",
                              border:     "1px solid var(--border-primary)",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div
                      className="mt-3 pt-3 flex items-center justify-between"
                      style={{ borderTop: "1px solid var(--border-primary)" }}
                    >
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {member.stats.tasks_assigned} tasks ·{" "}
                        {member.stats.decisions_authored} decisions
                      </span>
                      <div
                        className="flex items-center gap-1.5"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: workloadConfig(member.workload).color,
                          }}
                        />
                        <span
                          className="text-xs"
                          style={{
                            color: workloadConfig(member.workload).color,
                          }}
                        >
                          {workloadConfig(member.workload).label}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Activity Tab ─────────────────────────────────── */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Team Activity
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Contributions and output across the team
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="nx-card p-4 relative overflow-hidden"
                  style={{ opacity: 1 - i * 0.15 }}
                >
                  <div className="absolute inset-0 skel-shimmer pointer-events-none" />
                  <div className="flex items-center gap-4">
                    <div
                      className="w-9 h-9 rounded-full flex-shrink-0"
                      style={{ background: "var(--bg-subtle)" }}
                    />
                    <div className="flex-1 space-y-2">
                      <SkeletonLine width="120px" height="14px" />
                      <SkeletonLine width="200px" height="11px" />
                    </div>
                    <div className="flex gap-3">
                      <SkeletonLine width="40px" height="32px" />
                      <SkeletonLine width="40px" height="32px" />
                      <SkeletonLine width="40px" height="32px" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="nx-card p-12 text-center">
              <Activity
                className="w-10 h-10 mx-auto mb-4 opacity-20"
                style={{ color: "var(--text-tertiary)" }}
              />
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                No activity yet
              </h3>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Activity will appear as team members create tasks, decisions,
                and notes
              </p>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Total Tasks",
                    value: stats.totalTasks,
                    icon:  CheckSquare,
                    color: "var(--color-info)",
                  },
                  {
                    label: "Decisions Made",
                    value: stats.totalDecisions,
                    icon:  Lightbulb,
                    color: "var(--color-warning)",
                  },
                  {
                    label: "Active Members",
                    value: stats.activeCount,
                    icon:  Zap,
                    color: "var(--color-success)",
                  },
                  {
                    label: "Team Size",
                    value: stats.totalMembers,
                    icon:  Users,
                    color: "var(--accent-purple)",
                  },
                ].map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={item.label} className="nx-card p-4">
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
                  );
                })}
              </div>

              {/* Contribution leaderboard */}
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
                    Contribution Leaderboard
                  </h3>
                </div>

                <div className="space-y-3">
                  {[...members]
                    .sort(
                      (a, b) =>
                        b.stats.tasks_assigned +
                        b.stats.decisions_authored +
                        b.stats.notes_authored -
                        (a.stats.tasks_assigned +
                          a.stats.decisions_authored +
                          a.stats.notes_authored)
                    )
                    .map((member, rank) => {
                      const total =
                        member.stats.tasks_assigned +
                        member.stats.decisions_authored +
                        member.stats.notes_authored;

                      const maxTotal = members.reduce(
                        (max, m) =>
                          Math.max(
                            max,
                            m.stats.tasks_assigned +
                              m.stats.decisions_authored +
                              m.stats.notes_authored
                          ),
                        1
                      );

                      const pct = Math.round((total / maxTotal) * 100);

                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-4 cursor-pointer"
                          onClick={() => {
                            setSelectedId(member.id);
                            setActiveTab("overview");
                          }}
                        >
                          {/* Rank */}
                          <span
                            className="text-xs font-bold tabular-nums w-5 text-center flex-shrink-0"
                            style={{
                              color:
                                rank === 0
                                  ? "#f59e0b"
                                  : rank === 1
                                  ? "var(--text-secondary)"
                                  : "var(--text-tertiary)",
                            }}
                          >
                            {rank === 0
                              ? "🥇"
                              : rank === 1
                              ? "🥈"
                              : rank === 2
                              ? "🥉"
                              : `${rank + 1}`}
                          </span>

                          {/* Avatar */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                            style={{ background: member.avatar_color }}
                          >
                            {member.initials}
                          </div>

                          {/* Name + bar */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className="text-sm font-medium"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {member.name}
                              </span>
                              <span
                                className="text-xs tabular-nums"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                {total} contributions
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
                                  background:
                                    rank === 0
                                      ? "linear-gradient(90deg, #a78bfa, #7c3aed)"
                                      : "var(--accent-purple)",
                                  opacity: rank === 0 ? 1 : 0.6 + rank * 0.05,
                                }}
                              />
                            </div>
                          </div>

                          {/* Breakdown */}
                          <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                            <div className="text-center">
                              <p
                                className="font-bold tabular-nums"
                                style={{ color: "var(--color-info)" }}
                              >
                                {member.stats.tasks_assigned}
                              </p>
                              <p style={{ color: "var(--text-tertiary)" }}>
                                tasks
                              </p>
                            </div>
                            <div className="text-center">
                              <p
                                className="font-bold tabular-nums"
                                style={{ color: "var(--color-warning)" }}
                              >
                                {member.stats.decisions_authored}
                              </p>
                              <p style={{ color: "var(--text-tertiary)" }}>
                                decisions
                              </p>
                            </div>
                            <div className="text-center">
                              <p
                                className="font-bold tabular-nums"
                                style={{ color: "var(--color-success)" }}
                              >
                                {member.stats.notes_authored}
                              </p>
                              <p style={{ color: "var(--text-tertiary)" }}>
                                notes
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Per-member activity feed */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp
                    className="w-4 h-4"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Member Breakdown
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="nx-card p-4 cursor-pointer"
                      onClick={() => {
                        setSelectedId(member.id);
                        setActiveTab("overview");
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                          style={{ background: member.avatar_color }}
                        >
                          {member.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {member.name}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {member.role}
                          </p>
                        </div>
                        <div
                          className="flex items-center gap-1.5 flex-shrink-0"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: workloadConfig(member.workload).color,
                            }}
                          />
                          <span
                            className="text-xs"
                            style={{
                              color: workloadConfig(member.workload).color,
                            }}
                          >
                            {workloadConfig(member.workload).label}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            label: "Tasks",
                            value: member.stats.tasks_assigned,
                            done:  member.stats.tasks_completed,
                            color: "var(--color-info)",
                          },
                          {
                            label:    "Decisions",
                            value:    member.stats.decisions_authored,
                            color:    "var(--color-warning)",
                          },
                          {
                            label: "Notes",
                            value: member.stats.notes_authored,
                            color: "var(--color-success)",
                          },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className="rounded-lg p-2 text-center"
                            style={{
                              background: "var(--bg-subtle)",
                            }}
                          >
                            <p
                              className="text-lg font-bold tabular-nums"
                              style={{ color: stat.color }}
                            >
                              {stat.value}
                            </p>
                            <p
                              className="text-[10px]"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              {stat.label}
                            </p>
                          </div>
                        ))}
                      </div>

                      {member.stats.tasks_assigned > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="text-xs"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              Completion rate
                            </span>
                            <span
                              className="text-xs font-medium tabular-nums"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {Math.round(
                                (member.stats.tasks_completed /
                                  member.stats.tasks_assigned) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <div
                            className="h-1 rounded-full overflow-hidden"
                            style={{ background: "var(--border-primary)" }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.round(
                                  (member.stats.tasks_completed /
                                    member.stats.tasks_assigned) *
                                    100
                                )}%`,
                                background: "var(--color-success)",
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Top Stat Card                                              */
/* ─────────────────────────────────────────────────────────── */

function TopStatCard({
  icon: Icon,
  label,
  value,
}: {
  icon:  React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="nx-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(167, 139, 250, 0.12)" }}
        >
          <Icon className="w-4 h-4" style={{ color: "var(--accent-purple)" }} />
        </div>
      </div>
      <p
        className="text-lg font-bold leading-none mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Member Card                                                */
/* ─────────────────────────────────────────────────────────── */

function MemberCard({
  member,
  active,
  onClick,
}: {
  member:  TeamMember;
  active:  boolean;
  onClick: () => void;
}) {
  const wl = workloadConfig(member.workload);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl p-4 transition-all border"
      style={{
        background:  active ? "rgba(167, 139, 250, 0.08)" : "var(--bg-elevated)",
        borderColor: active ? "rgba(167, 139, 250, 0.3)"  : "var(--border-primary)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
          style={{ background: member.avatar_color }}
        >
          {member.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {member.name}
              </p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {member.role}
              </p>
            </div>
            <ChevronRight
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "var(--text-tertiary)" }}
            />
          </div>

          <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
            {member.stats.tasks_assigned} tasks ·{" "}
            {member.stats.decisions_authored} decisions
          </p>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {member.expertise.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-1 rounded-md"
                style={{
                  background: "var(--bg-subtle)",
                  color:      "var(--text-secondary)",
                  border:     "1px solid var(--border-primary)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: wl.color }}
            />
            <span
              className="text-[11px] font-medium"
              style={{ color: wl.color }}
            >
              {wl.label}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Member Detail                                              */
/* ─────────────────────────────────────────────────────────── */

function MemberDetail({ member }: { member: TeamMemberDetail }) {
  const wl = workloadConfig(member.workload);

  return (
    <>
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold text-white"
            style={{ background: member.avatar_color }}
          >
            {member.initials}
          </div>
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {member.name}
            </h2>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              {member.role}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: wl.color }}
          />
          <span className="text-xs font-medium" style={{ color: wl.color }}>
            {wl.label}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* AI Summary */}
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--text-tertiary)" }}
          >
            Summary
          </p>
          <div
            className="p-4 rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(167, 139, 250, 0.08) 0%, rgba(124, 58, 237, 0.03) 100%)",
              border: "1px solid rgba(167, 139, 250, 0.2)",
            }}
          >
            <div className="flex items-start gap-2">
              <Sparkles
                className="w-4 h-4 mt-0.5"
                style={{ color: "var(--accent-purple)" }}
              />
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {member.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <MiniStat label="Tasks Assigned"  value={member.stats.tasks_assigned}     />
          <MiniStat label="Completed"       value={member.stats.tasks_completed}    />
          <MiniStat label="In Progress"     value={member.stats.tasks_in_progress}  />
          <MiniStat label="Decisions"       value={member.stats.decisions_authored} />
          <MiniStat label="Notes"           value={member.stats.notes_authored}     />
        </div>

        {/* Expertise */}
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--text-tertiary)" }}
          >
            Expertise
          </p>
          <div className="flex flex-wrap gap-2">
            {member.expertise.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                No expertise tags yet
              </p>
            ) : (
              member.expertise.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1.5 rounded-lg"
                  style={{
                    background: "var(--bg-subtle)",
                    color:      "var(--text-secondary)",
                    border:     "1px solid var(--border-primary)",
                  }}
                >
                  {tag}
                </span>
              ))
            )}
          </div>
        </div>

        <DetailList
          title="Recent Tasks"
          icon={CheckSquare}
          items={member.recent_tasks.map((t) => ({
            title: `${t.task_code} · ${t.title}`,
            meta:  t.status.replace("_", " "),
          }))}
        />

        <DetailList
          title="Recent Decisions"
          icon={Lightbulb}
          items={member.recent_decisions.map((d) => ({
            title: d.title,
            meta:  d.category || "General",
          }))}
        />

        <DetailList
          title="Recent Notes"
          icon={FileText}
          items={member.recent_notes.map((n) => ({
            title: n.title || "Untitled note",
            meta:  formatDate(n.created_at),
          }))}
        />
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Small components                                           */
/* ─────────────────────────────────────────────────────────── */

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: "var(--bg-subtle)",
        border:     "1px solid var(--border-primary)",
      }}
    >
      <p
        className="text-lg font-bold mb-1 tabular-nums"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </p>
    </div>
  );
}

function DetailList({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon:  React.ElementType;
  items: Array<{ title: string; meta: string }>;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-tertiary)" }}
        >
          {title}
        </p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          No items yet
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-lg p-3"
              style={{
                background: "var(--bg-subtle)",
                border:     "1px solid var(--border-primary)",
              }}
            >
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                {item.title}
              </p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {item.meta}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Invite Member Modal                                        */
/* ─────────────────────────────────────────────────────────── */

function InviteMemberModal({ onClose }: { onClose: () => void }) {
  const inviteMember = useInviteMember();
  const [email,  setEmail]  = useState("");
  const [role,   setRole]   = useState("member");
  const [error,  setError]  = useState<string | null>(null);
  const [sent,   setSent]   = useState(false);

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

  const handleInvite = async () => {
    if (!email) { setError("Email is required"); return; }
    setError(null);
    try {
      await inviteMember.mutateAsync({ email, role });
      setSent(true);
    } catch (err) {
      setError((err as Error).message || "Failed to send invitation");
    }
  };

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
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <div className="flex items-center gap-2">
            <Users
              className="w-4 h-4"
              style={{ color: "var(--accent-purple)" }}
            />
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Invite Team Member
            </h2>
          </div>
          <button
            onClick={onClose}
            className="nx-btn nx-btn-ghost p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4">
          {sent ? (
            <div className="text-center py-6">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(16, 185, 129, 0.15)" }}
              >
                <CheckCircle2
                  className="w-6 h-6"
                  style={{ color: "var(--color-success)" }}
                />
              </div>
              <h3
                className="text-base font-semibold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                Invitation sent!
              </h3>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                An invite has been sent to{" "}
                <strong style={{ color: "var(--text-primary)" }}>{email}</strong>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
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

              <div>
                <label
                  className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
                  placeholder="colleague@company.com"
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
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
                  Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["member", "admin", "owner"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className="px-3 py-2 rounded-xl text-sm font-medium transition-all capitalize"
                      style={{
                        background:
                          role === r
                            ? "var(--accent-purple-bg)"
                            : "var(--bg-elevated)",
                        border: `1px solid ${
                          role === r
                            ? "var(--accent-purple)"
                            : "var(--border-primary)"
                        }`,
                        color:
                          role === r
                            ? "var(--accent-purple)"
                            : "var(--text-secondary)",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className="px-6 py-4 border-t flex items-center justify-end gap-2"
          style={{ borderColor: "var(--border-primary)" }}
        >
          {sent ? (
            <button onClick={onClose} className="nx-btn nx-btn-primary">
              Done
            </button>
          ) : (
            <>
              <button onClick={onClose} className="nx-btn nx-btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!email || inviteMember.isPending}
                className="nx-btn nx-btn-primary disabled:opacity-40"
              >
                {inviteMember.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5" /> Send Invite
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}