"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { useStandups, useGenerateStandup } from "@/hooks/useApi";
import type { Standup, StandupItem } from "@/lib/api";
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Target,
  MessageSquare,
  CheckSquare,
  Lightbulb,
  FileText,
  Copy,
  Share2,
  Download,
  RefreshCw,
  Zap,
  TrendingUp,
  Clock,
  Calendar,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────── */
/*  Helpers                                                    */
/* ─────────────────────────────────────────────────────────── */

function formatBriefingDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day:   "numeric",
    year:  "numeric",
  });
}

function totalSources(s: Standup): number {
  if (!s.source_counts) return 0;
  return Object.values(s.source_counts).reduce((a, b) => a + b, 0);
}

function genTimeSecs(ms: number): string {
  return (ms / 1000).toFixed(1) + "s";
}

/* ─────────────────────────────────────────────────────────── */
/*  Briefings Page                                             */
/* ─────────────────────────────────────────────────────────── */

export default function BriefingsPage() {
  const { data: briefings = [], isLoading } = useStandups();
  const generateMutation                    = useGenerateStandup();

  const [activeBriefing, setActiveBriefing] = useState<Standup | null>(null);

  useEffect(() => {
    if (briefings.length > 0 && !activeBriefing) {
      setActiveBriefing(briefings[0]);
    }
  }, [briefings]);

  const handleRegenerate = async () => {
    try {
      const fresh = await generateMutation.mutateAsync();
      setActiveBriefing(fresh);
    } catch (err) {
      console.error("[briefings] Generate failed:", err);
    }
  };

  const handleCopy = () => {
    if (!activeBriefing) return;

    const lines = [
      `AI Briefing — ${formatBriefingDate(activeBriefing.created_at)}`,
      "",
      "✅ Done:",
      ...(activeBriefing.done || []).map((i) => `  • ${i.text}`),
      "",
      "🔄 In Progress:",
      ...(activeBriefing.in_progress || []).map((i) => `  • ${i.text}`),
      "",
      "🚨 Blockers:",
      ...(activeBriefing.blockers || []).map((i) => `  • ${i.text}`),
      "",
      "🎯 Focus:",
      ...(activeBriefing.focus || []).map((i) => `  • ${i.text}`),
    ].join("\n");

    navigator.clipboard.writeText(lines).catch(console.error);
  };

  const isGenerating = generateMutation.isPending;

  // ── Loading state ──
  if (isLoading) {
    return (
      <AppShell
        tabs={[
          { label: "Latest",  key: "latest" },
          { label: "Weekly",  key: "weekly" },
          { label: "History", key: "history" },
        ]}
        defaultTab="latest"
      >
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: "var(--accent-purple)" }}
            />
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Loading briefings...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Empty state ──
  if (!activeBriefing && !isGenerating) {
    return (
      <AppShell
        tabs={[
          { label: "Latest",  key: "latest" },
          { label: "Weekly",  key: "weekly" },
          { label: "History", key: "history" },
        ]}
        defaultTab="latest"
      >
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
              }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2
                className="text-lg font-semibold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                No briefings yet
              </h2>
              <p
                className="text-sm mb-4"
                style={{ color: "var(--text-tertiary)" }}
              >
                Generate your first AI briefing from project memory
              </p>
            </div>
            <button
              onClick={handleRegenerate}
              className="nx-btn nx-btn-primary"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Briefing
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      tabs={[
        { label: "Latest",  key: "latest" },
        { label: "Weekly",  key: "weekly" },
        { label: "History", key: "history" },
      ]}
      defaultTab="latest"
    >
      <div className="flex gap-6 h-[calc(100vh-8rem)]">

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Header */}
          <div className="flex items-start justify-between mb-6 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="nx-badge nx-badge-purple">
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  AI Generated
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {activeBriefing
                    ? formatBriefingDate(activeBriefing.created_at)
                    : "—"}
                </span>
              </div>
              <h1
                className="text-2xl font-bold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                AI Briefing
              </h1>
              <p
                className="text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                {activeBriefing
                  ? `Auto-synthesized from ${totalSources(activeBriefing)} memory entries`
                  : "Generating from project memory..."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!activeBriefing}
                className="nx-btn nx-btn-secondary"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
              <button className="nx-btn nx-btn-secondary">
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
              <button className="nx-btn nx-btn-secondary">
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
              <button
                onClick={handleRegenerate}
                disabled={isGenerating}
                className={`nx-btn nx-btn-primary ${isGenerating ? "nx-generating" : ""}`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Regenerate
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sections */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <BriefingSection
              icon={CheckCircle2}
              iconColor="var(--color-success)"
              title="What Got Done"
              subtitle={`${activeBriefing?.done?.length ?? 0} completed`}
              items={activeBriefing?.done ?? []}
              loading={isGenerating}
            />

            <BriefingSection
              icon={Loader2}
              iconColor="var(--color-info)"
              title="In Progress"
              subtitle={`${activeBriefing?.in_progress?.length ?? 0} active`}
              items={activeBriefing?.in_progress ?? []}
              loading={isGenerating}
            />

            <BriefingSection
              icon={AlertTriangle}
              iconColor="var(--color-error)"
              title="Blockers & Risks"
              subtitle={`${activeBriefing?.blockers?.length ?? 0} need attention`}
              items={activeBriefing?.blockers ?? []}
              loading={isGenerating}
              accent
            />

            <BriefingSection
              icon={Target}
              iconColor="var(--accent-purple)"
              title="Focus Areas"
              subtitle={`${activeBriefing?.focus?.length ?? 0} priorities`}
              items={activeBriefing?.focus ?? []}
              loading={isGenerating}
            />
          </div>
        </div>

        {/* ── Sources panel ── */}
        {activeBriefing && (
          <SourcesPanel
            briefing={activeBriefing}
            isGenerating={isGenerating}
          />
        )}

      </div>
    </AppShell>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Briefing Section                                           */
/* ─────────────────────────────────────────────────────────── */

function BriefingSection({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  items,
  loading,
  accent,
}: {
  icon:      React.ElementType;
  iconColor: string;
  title:     string;
  subtitle:  string;
  items:     StandupItem[];
  loading:   boolean;
  accent?:   boolean;
}) {
  return (
    <div
      className="nx-standup-section"
      style={accent ? {
        borderColor: "rgba(239, 68, 68, 0.2)",
        background:  "linear-gradient(135deg, rgba(239, 68, 68, 0.03) 0%, transparent 100%)",
      } : {}}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: `${iconColor}20` }}
          >
            <Icon
              className={`w-3.5 h-3.5 ${title === "In Progress" ? "animate-spin" : ""}`}
              style={{ color: iconColor }}
            />
          </div>
          <div>
            <h3
              className="text-sm font-semibold leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h3>
            <p
              className="text-xs leading-tight"
              style={{ color: "var(--text-tertiary)" }}
            >
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <BriefingLoadingSkeleton />
      ) : items.length === 0 ? (
        <p
          className="text-sm py-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          Nothing to report
        </p>
      ) : (
        <div>
          {items.map((item, i) => (
            <BriefingItemRow key={i} item={item} accentColor={iconColor} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Briefing Item Row                                          */
/* ─────────────────────────────────────────────────────────── */

function BriefingItemRow({
  item,
  accentColor,
}: {
  item:        StandupItem;
  accentColor: string;
}) {
  const priorityClass =
    item.priority === "high"   ? "nx-badge-high"
    : item.priority === "medium" ? "nx-badge-medium"
    : item.priority === "low"    ? "nx-badge-low"
    : "";

  return (
    <div className="nx-standup-item">
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
        style={{ background: accentColor }}
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--text-primary)" }}
        >
          {item.text}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          {item.taskId && (
            <span className="nx-task-id">{item.taskId}</span>
          )}
          {item.priority && (
            <span className={`nx-badge ${priorityClass}`}>
              {item.priority}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Loading Skeleton                                           */
/* ─────────────────────────────────────────────────────────── */

function BriefingLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 py-2">
          <div
            className="w-1.5 h-1.5 rounded-full mt-2 animate-pulse"
            style={{ background: "var(--text-tertiary)" }}
          />
          <div className="flex-1 space-y-2">
            <div
              className="h-3 rounded animate-pulse"
              style={{ background: "var(--bg-subtle)", width: "70%" }}
            />
            <div
              className="h-3 rounded animate-pulse"
              style={{ background: "var(--bg-subtle)", width: "45%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Sources Panel                                              */
/* ─────────────────────────────────────────────────────────── */

function SourcesPanel({
  briefing,
  isGenerating,
}: {
  briefing:     Standup;
  isGenerating: boolean;
}) {
  const counts = briefing.source_counts || {
    conversations: 0,
    tasks:         0,
    decisions:     0,
    notes:         0,
  };

  const sourceItems = [
    { icon: MessageSquare, label: "Conversations", value: counts.conversations, color: "#22d3ee" },
    { icon: CheckSquare,   label: "Tasks",         value: counts.tasks,         color: "var(--color-info)" },
    { icon: Lightbulb,     label: "Decisions",     value: counts.decisions,     color: "var(--color-warning)" },
    { icon: FileText,      label: "Notes",         value: counts.notes,         color: "var(--color-success)" },
  ];

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="w-[340px] nx-card flex flex-col overflow-hidden flex-shrink-0">

      {/* Header */}
      <div
        className="px-5 py-4 border-b flex items-center gap-2 flex-shrink-0"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <Sparkles
          className="w-4 h-4"
          style={{ color: "var(--accent-purple)" }}
        />
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Briefing Details
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Memory sources */}
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--text-tertiary)" }}
          >
            Memory Sources
          </p>

          <div
            className="p-3 rounded-lg mb-3"
            style={{ background: "var(--bg-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Total entries analyzed
              </span>
              <span
                className="text-lg font-bold tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {total}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {sourceItems.map((src) => {
              const SrcIcon = src.icon;
              return (
                <div key={src.label} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: `${src.color}20` }}
                  >
                    <SrcIcon
                      className="w-3.5 h-3.5"
                      style={{ color: src.color }}
                    />
                  </div>
                  <span
                    className="text-sm flex-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {src.label}
                  </span>
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {src.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confidence */}
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--text-tertiary)" }}
          >
            Confidence
          </p>

          <div
            className="p-4 rounded-lg"
            style={{
              background: "linear-gradient(135deg, rgba(167, 139, 250, 0.08) 0%, rgba(124, 58, 237, 0.03) 100%)",
              border:     "1px solid rgba(167, 139, 250, 0.2)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {Math.round((briefing.confidence ?? 0) * 100)}%
              </span>
              <TrendingUp
                className="w-3.5 h-3.5"
                style={{ color: "var(--accent-purple)" }}
              />
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden mb-2"
              style={{ background: "var(--border-primary)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width:      `${(briefing.confidence ?? 0) * 100}%`,
                  background: "linear-gradient(90deg, #a78bfa 0%, #7c3aed 100%)",
                }}
              />
            </div>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Based on {total} memory entries across{" "}
              {Object.values(counts).filter((v) => v > 0).length} source types.
            </p>
          </div>
        </div>

        {/* AI Highlights */}
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--text-tertiary)" }}
          >
            🔥 AI Highlights
          </p>

          <div className="space-y-2">
            {(briefing.highlights ?? []).map((highlight, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-3 rounded-lg"
                style={{ background: "var(--bg-subtle)" }}
              >
                <Zap
                  className="w-3 h-3 flex-shrink-0 mt-0.5"
                  style={{ color: "var(--accent-purple)" }}
                />
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {highlight}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Performance */}
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--text-tertiary)" }}
          >
            Performance
          </p>

          <div className="space-y-2">
            <StatRow
              icon={Clock}
              label="Generation time"
              value={briefing.gen_time_ms ? genTimeSecs(briefing.gen_time_ms) : "—"}
            />
            <StatRow
              icon={Sparkles}
              label="Model"
              value="Claude Haiku 4.5"
            />
            <StatRow
              icon={Calendar}
              label="Generated"
              value={
                isGenerating
                  ? "Generating..."
                  : formatBriefingDate(briefing.created_at)
              }
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-5 py-3 border-t flex items-center justify-between flex-shrink-0"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "var(--color-success)" }}
          />
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Bedrock connected
          </span>
        </div>
        <span
          className="text-xs font-mono"
          style={{ color: "var(--text-tertiary)" }}
        >
          us-east-1
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Stat Row                                                   */
/* ─────────────────────────────────────────────────────────── */

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon:  React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon
        className="w-3.5 h-3.5 flex-shrink-0"
        style={{ color: "var(--text-tertiary)" }}
      />
      <span
        className="text-xs flex-1"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </span>
      <span
        className="text-xs font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}