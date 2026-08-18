// frontend/app/app/decisions/page.tsx

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import AppShell from "@/components/layout/AppShell";
import { useDecisions, useSearch, useCreateDecision } from "@/hooks/useApi";
import type { SearchResult } from "@/lib/api";
import { useOrg } from "@/components/OrgContext";
import {
  Search,
  Lightbulb,
  Sparkles,
  Plus,
  Filter,
  ChevronRight,
  User,
  Calendar,
  X,
  Loader2,
  Brain,
  BarChart2,
  TrendingUp,
  Database,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────── */
/*  Constants                                                  */
/* ─────────────────────────────────────────────────────────── */

const CATEGORIES = [
  "Architecture",
  "Backend",
  "Frontend",
  "Design",
  "Product",
  "DevOps",
  "AI",
];

const categoryColors: Record<string, string> = {
  Architecture: "var(--accent-purple)",
  Backend:      "var(--color-info)",
  Frontend:     "var(--color-success)",
  Design:       "var(--color-warning)",
  Product:      "var(--color-error)",
  DevOps:       "#22d3ee",
  AI:           "#f472b6",
};

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

function DecisionCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="nx-decision-card relative overflow-hidden"
      style={{ opacity: 1 - index * 0.15 }}
    >
      <div className="absolute inset-0 skel-shimmer pointer-events-none" />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md"
            style={{ background: "var(--bg-subtle)" }}
          />
          <SkeletonLine width="80px" height="11px" />
        </div>
      </div>
      <SkeletonLine width="90%" height="16px" />
      <div className="mt-2 space-y-1.5">
        <SkeletonLine width="100%" height="12px" />
        <SkeletonLine width="70%"  height="12px" />
      </div>
      <div className="flex items-center justify-between mt-4">
        <SkeletonLine width="80px" height="11px" />
        <SkeletonLine width="16px" height="16px" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Helpers                                                    */
/* ─────────────────────────────────────────────────────────── */

function formatDateGroup(dateStr: string): string {
  const date     = new Date(dateStr);
  const now      = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0)
    return `Today · ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  if (diffDays === 1)
    return `Yesterday · ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour:   "2-digit",
    minute: "2-digit",
  });
}

/* ─────────────────────────────────────────────────────────── */
/*  Decisions Page                                             */
/* ─────────────────────────────────────────────────────────── */

export default function DecisionsPage() {
  const { data: decisions = [], isLoading, refetch } = useDecisions();
  const searchMutation = useSearch();

  const [activeTab,         setActiveTab]         = useState("timeline");
  const [selectedCategory,  setSelectedCategory]  = useState("All");
  const [searchQuery,       setSearchQuery]        = useState("");
  const [selectedDecision,  setSelectedDecision]  = useState<any>(null);
  const [searchResults,     setSearchResults]      = useState<SearchResult[] | null>(null);
  const [showLogModal,      setShowLogModal]       = useState(false);

  // Category counts
  const categoryStats = useMemo(() => {
    const cats: Record<string, number> = { All: decisions.length };
    decisions.forEach((d) => {
      if (d.category) cats[d.category] = (cats[d.category] || 0) + 1;
    });
    return cats;
  }, [decisions]);

  const categoryList = useMemo(
    () =>
      Object.entries(categoryStats).map(([label, count]) => ({
        label,
        count,
      })),
    [categoryStats]
  );

  // Filter decisions
  const filteredDecisions = useMemo(() => {
    if (searchResults) {
      return searchResults
        .filter((r) => r.source_type === "decision")
        .map((r) => {
          const dec = decisions.find((d) => d.id === r.source_id);
          return dec ? { ...dec, similarity: r.similarity } : null;
        })
        .filter(Boolean) as any[];
    }
    if (selectedCategory === "All") return decisions;
    return decisions.filter((d) => d.category === selectedCategory);
  }, [decisions, selectedCategory, searchResults]);

  // Group by date
  const groupedDecisions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredDecisions.forEach((d) => {
      const key = formatDateGroup(d.created_at);
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });
    return groups;
  }, [filteredDecisions]);

  // Debounced semantic search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(() => {
      searchMutation.mutate(
        { query: searchQuery, sourceTypes: ["decision"], limit: 10 },
        { onSuccess: (results) => setSearchResults(results) }
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Most recent decision date
  const lastDecisionDate =
    decisions.length > 0
      ? formatDateGroup(decisions[0].created_at)
      : null;

  return (
    <AppShell
      tabs={[
        { label: "Timeline",   key: "timeline"   },
        { label: "Categories", key: "categories" },
        { label: "Insights",   key: "insights"   },
      ]}
      defaultTab="timeline"
      onTabChange={setActiveTab}
    >
      {showLogModal && (
        <LogDecisionModal
          onClose={() => setShowLogModal(false)}
          onCreated={() => { refetch(); setShowLogModal(false); }}
        />
      )}

      {/* ── Timeline Tab ─────────────────────────────────── */}
      {activeTab === "timeline" && (
        <div className="flex gap-6 h-[calc(100vh-8rem)]">
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

            {/* Header */}
            <div className="mb-6 flex items-start justify-between flex-shrink-0">
              <div>
                <h1
                  className="text-2xl font-bold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Decision Log
                </h1>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  {decisions.length} decisions · Semantic search enabled
                </p>
              </div>
              <button
                onClick={() => setShowLogModal(true)}
                className="nx-btn nx-btn-primary"
              >
                <Plus className="w-4 h-4" />
                Log Decision
              </button>
            </div>

            {/* Semantic search */}
            <div className="mb-4 flex-shrink-0 relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-tertiary)" }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Ask semantically... "Why did we choose our database?"'
                className="nx-search-large pl-11 pr-32"
              />
              {searchQuery && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searchMutation.isPending ? (
                    <span
                      className="text-xs flex items-center gap-1.5"
                      style={{ color: "var(--accent-purple)" }}
                    >
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Searching...
                    </span>
                  ) : (
                    <>
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {filteredDecisions.length} matches
                      </span>
                      <button
                        onClick={() => setSearchQuery("")}
                        className="nx-btn nx-btn-ghost p-1 rounded-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-2 mb-6 flex-shrink-0 overflow-x-auto pb-1">
              <Filter
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "var(--text-tertiary)" }}
              />
              {categoryList.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setSelectedCategory(cat.label)}
                  className={`nx-filter-chip ${
                    selectedCategory === cat.label ? "nx-filter-chip-active" : ""
                  }`}
                >
                  {cat.label}
                  <span className="text-xs opacity-70">{cat.count}</span>
                </button>
              ))}
            </div>

            {/* Timeline list */}
            <div className="flex-1 overflow-y-auto pr-2">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <DecisionCardSkeleton key={i} index={i} />
                  ))}
                </div>
              ) : Object.keys(groupedDecisions).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: "var(--bg-subtle)" }}
                  >
                    <Lightbulb
                      className="w-6 h-6"
                      style={{ color: "var(--text-tertiary)" }}
                    />
                  </div>
                  <h3
                    className="text-base font-semibold mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {decisions.length === 0
                      ? "No decisions yet"
                      : "No decisions match your search"}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
                    {decisions.length === 0
                      ? "Log your first decision to build searchable project memory"
                      : "Try a different search or category filter"}
                  </p>
                  {decisions.length === 0 && (
                    <button
                      onClick={() => setShowLogModal(true)}
                      className="nx-btn nx-btn-primary"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Log First Decision
                    </button>
                  )}
                </div>
              ) : (
                Object.entries(groupedDecisions).map(([dateGroup, items]) => (
                  <div key={dateGroup} className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar
                        className="w-3.5 h-3.5"
                        style={{ color: "var(--text-tertiary)" }}
                      />
                      <span
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {dateGroup}
                      </span>
                      <div
                        className="flex-1 h-px"
                        style={{ background: "var(--border-primary)" }}
                      />
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {items.length} decision{items.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-3 pl-6 relative">
                      <div
                        className="absolute left-2 top-2 bottom-0 w-px"
                        style={{ background: "var(--border-primary)" }}
                      />
                      {items.map((decision: any) => (
                        <div key={decision.id} className="relative">
                          <div
                            className="absolute -left-4 top-5 w-2 h-2 rounded-full"
                            style={{
                              background:
                                categoryColors[decision.category] ||
                                "var(--text-tertiary)",
                              boxShadow: "0 0 0 4px var(--bg-page)",
                            }}
                          />
                          <DecisionCard
                            decision={decision}
                            isActive={selectedDecision?.id === decision.id}
                            categoryColor={
                              categoryColors[decision.category] ||
                              "var(--text-tertiary)"
                            }
                            onClick={() => setSelectedDecision(decision)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detail panel or insights panel */}
          {selectedDecision ? (
            <DecisionDetail
              decision={selectedDecision}
              categoryColor={
                categoryColors[selectedDecision.category] ||
                "var(--text-tertiary)"
              }
              onClose={() => setSelectedDecision(null)}
            />
          ) : (
            <InsightsPanel
              decisions={decisions}
              categoryStats={categoryStats}
              isLoading={isLoading}
            />
          )}
        </div>
      )}

      {/* ── Categories Tab ───────────────────────────────── */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Decision Categories
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Browse decisions by category
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="nx-card p-5 relative overflow-hidden"
                  style={{ opacity: 1 - i * 0.1 }}
                >
                  <div className="absolute inset-0 skel-shimmer pointer-events-none" />
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-9 h-9 rounded-lg"
                      style={{ background: "var(--bg-subtle)" }}
                    />
                    <div className="space-y-1.5">
                      <SkeletonLine width="80px" height="13px" />
                      <SkeletonLine width="50px" height="11px" />
                    </div>
                  </div>
                  <SkeletonLine width="100%" height="1px" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORIES.map((cat) => {
                const catDecisions = decisions.filter(
                  (d) => d.category === cat
                );
                const color = categoryColors[cat] || "var(--text-secondary)";

                return (
                  <div
                    key={cat}
                    className="nx-card p-5 cursor-pointer"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setActiveTab("timeline");
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ background: `${color}20` }}
                        >
                          <Lightbulb
                            className="w-4 h-4"
                            style={{ color }}
                          />
                        </div>
                        <div>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {cat}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {catDecisions.length} decision
                            {catDecisions.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className="w-4 h-4"
                        style={{ color: "var(--text-tertiary)" }}
                      />
                    </div>

                    {/* Progress bar */}
                    <div
                      className="h-1 rounded-full overflow-hidden mb-3"
                      style={{ background: "var(--border-primary)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width:
                            decisions.length > 0
                              ? `${(catDecisions.length / decisions.length) * 100}%`
                              : "0%",
                          background: color,
                        }}
                      />
                    </div>

                    {/* Recent decisions preview */}
                    {catDecisions.length > 0 ? (
                      <div className="space-y-1.5">
                        {catDecisions.slice(0, 2).map((d) => (
                          <p
                            key={d.id}
                            className="text-xs truncate"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            · {d.title}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        No decisions yet
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Insights Tab ─────────────────────────────────── */}
      {activeTab === "insights" && (
        <div className="space-y-6">
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Decision Insights
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Patterns and analytics from your decision log
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="nx-card p-5 relative overflow-hidden"
                >
                  <div className="absolute inset-0 skel-shimmer pointer-events-none" />
                  <SkeletonLine width="120px" height="14px" />
                  <div className="mt-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <SkeletonLine
                        key={j}
                        width={`${80 - j * 15}%`}
                        height="12px"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : decisions.length === 0 ? (
            <div className="nx-card p-12 text-center">
              <Brain
                className="w-10 h-10 mx-auto mb-4 opacity-20"
                style={{ color: "var(--text-tertiary)" }}
              />
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                No insights yet
              </h3>
              <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
                Log decisions to see patterns and analytics
              </p>
              <button
                onClick={() => setShowLogModal(true)}
                className="nx-btn nx-btn-primary"
              >
                <Plus className="w-3.5 h-3.5" />
                Log First Decision
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Category distribution */}
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
                    Category Distribution
                  </h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(categoryStats)
                    .filter(([k]) => k !== "All")
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count]) => {
                      const color = categoryColors[cat] || "var(--text-secondary)";
                      const pct   = Math.round((count / decisions.length) * 100);
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="text-xs font-medium"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {cat}
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
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Summary stats */}
              <div className="nx-card p-5">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp
                    className="w-4 h-4"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Decision Summary
                  </h3>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      label: "Total Decisions",
                      value: decisions.length,
                      color: "var(--accent-purple)",
                    },
                    {
                      label: "With Alternatives",
                      value: decisions.filter(
                        (d) =>
                          d.alternatives &&
                          (d.alternatives as string[]).length > 0
                      ).length,
                      color: "var(--color-info)",
                    },
                    {
                      label: "Most Active Category",
                      value: Object.entries(categoryStats)
                        .filter(([k]) => k !== "All")
                        .sort(([, a], [, b]) => b - a)[0]?.[0] || "—",
                      color: "var(--color-warning)",
                      isText: true,
                    },
                    {
                      label: "Latest Decision",
                      value: lastDecisionDate || "—",
                      color: "var(--color-success)",
                      isText: true,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: "var(--bg-subtle)" }}
                    >
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {item.label}
                      </span>
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: item.color }}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Memory embedding status */}
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
                    Memory Embedding Status
                  </h3>
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: "var(--color-success)" }}
                  />
                </div>
                <div className="space-y-2">
                  {[
                    { label: "All decisions embedded", ok: true },
                    { label: "Vector index: 1024 dimensions", ok: true },
                    { label: "Model: Titan Embed v2",         ok: true },
                    { label: "Search: cosine similarity",     ok: true },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background: item.ok
                            ? "var(--color-success)"
                            : "var(--color-error)",
                        }}
                      />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* AI insight card */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(167, 139, 250, 0.08) 0%, rgba(124, 58, 237, 0.03) 100%)",
                  border: "1px solid rgba(167, 139, 250, 0.2)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles
                    className="w-4 h-4"
                    style={{ color: "var(--accent-purple)" }}
                  />
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    AI Memory Insight
                  </h3>
                </div>
                <p
                  className="text-sm leading-relaxed mb-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {decisions.length === 0
                    ? "Start logging decisions to get AI insights about your project's decision patterns."
                    : `You have ${decisions.length} decision${decisions.length !== 1 ? "s" : ""} stored with semantic embeddings. Use the Chat tab to ask questions about any of these decisions in natural language.`}
                </p>
                <button
                  className="nx-btn nx-btn-primary text-xs"
                  onClick={() =>
                    (window.location.href = "/app/chat")
                  }
                >
                  <Brain className="w-3.5 h-3.5" />
                  Ask about decisions
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Insights Panel (right side on timeline tab)                */
/* ─────────────────────────────────────────────────────────── */

function InsightsPanel({
  decisions,
  categoryStats,
  isLoading,
}: {
  decisions:     any[];
  categoryStats: Record<string, number>;
  isLoading:     boolean;
}) {
  return (
    <div className="w-[340px] nx-card flex flex-col overflow-hidden flex-shrink-0">
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
          Memory Insights
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonLine width="12px" height="12px" />
                <SkeletonLine width="100px" height="12px" />
                <SkeletonLine width="24px" height="12px" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Distribution */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-tertiary)" }}
              >
                Distribution
              </p>
              <div className="space-y-2.5">
                {Object.entries(categoryStats)
                  .filter(([k]) => k !== "All")
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => (
                    <div key={cat} className="flex items-center gap-3">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background:
                            categoryColors[cat] || "var(--text-tertiary)",
                        }}
                      />
                      <span
                        className="text-sm flex-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {cat}
                      </span>
                      <span
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* AI suggestion */}
            <div
              className="p-4 rounded-lg"
              style={{
                background:
                  "linear-gradient(135deg, rgba(167, 139, 250, 0.08) 0%, rgba(124, 58, 237, 0.03) 100%)",
                border: "1px solid rgba(167, 139, 250, 0.2)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--accent-purple)" }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: "var(--accent-purple)" }}
                >
                  AI Insight
                </span>
              </div>
              <p
                className="text-xs leading-relaxed mb-3"
                style={{ color: "var(--text-secondary)" }}
              >
                {decisions.length === 0
                  ? "Log decisions to see AI-powered insights about your project patterns."
                  : `${decisions.length} decisions stored with 1024d vector embeddings. Use semantic search above to find any decision by meaning, not just keywords.`}
              </p>
            </div>

            {/* Embedding status */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-tertiary)" }}
              >
                Vector Index
              </p>
              <div className="space-y-2">
                {[
                  { label: "Decisions embedded", value: decisions.length },
                  { label: "Dimensions",          value: "1024d"         },
                  { label: "Model",               value: "Titan v2"      },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {row.label}
                    </span>
                    <span
                      className="text-xs font-medium font-mono"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

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
            Vector index synced
          </span>
        </div>
        <span
          className="text-xs font-mono"
          style={{ color: "var(--text-tertiary)" }}
        >
          {decisions.length} entries
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Decision Card                                              */
/* ─────────────────────────────────────────────────────────── */

function DecisionCard({
  decision,
  isActive,
  categoryColor,
  onClick,
}: {
  decision:      any;
  isActive:      boolean;
  categoryColor: string;
  onClick:       () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`nx-decision-card ${isActive ? "nx-decision-card-active" : ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: `${categoryColor}20` }}
          >
            <Lightbulb className="w-3 h-3" style={{ color: categoryColor }} />
          </div>
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: categoryColor }}
          >
            {decision.category}
          </span>
        </div>
        {(decision as any).similarity !== undefined && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-10 h-1 rounded-full overflow-hidden"
              style={{ background: "var(--border-primary)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width:      `${(decision as any).similarity * 100}%`,
                  background: "var(--accent-purple)",
                }}
              />
            </div>
            <span
              className="text-xs font-medium tabular-nums"
              style={{ color: "var(--accent-purple)" }}
            >
              {Math.round((decision as any).similarity * 100)}%
            </span>
          </div>
        )}
      </div>

      <h3
        className="text-[15px] font-semibold mb-2 leading-snug"
        style={{ color: "var(--text-primary)" }}
      >
        {decision.title}
      </h3>

      <p
        className="text-sm leading-relaxed mb-3 line-clamp-2"
        style={{ color: "var(--text-secondary)" }}
      >
        {decision.context}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {decision.author && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: "var(--bg-subtle)" }}
              >
                <User
                  className="w-3 h-3"
                  style={{ color: "var(--text-secondary)" }}
                />
              </div>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {decision.author}
              </span>
            </div>
          )}
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {formatTime(decision.created_at)}
          </span>
        </div>
        <ChevronRight
          className="w-4 h-4"
          style={{ color: "var(--text-tertiary)" }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Decision Detail                                            */
/* ─────────────────────────────────────────────────────────── */

function DecisionDetail({
  decision,
  categoryColor,
  onClose,
}: {
  decision:      any;
  categoryColor: string;
  onClose:       () => void;
}) {
  return (
    <div className="w-[380px] nx-card flex flex-col overflow-hidden flex-shrink-0">
      <div
        className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: `${categoryColor}20` }}
          >
            <Lightbulb
              className="w-3.5 h-3.5"
              style={{ color: categoryColor }}
            />
          </div>
          <div>
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: categoryColor }}
            >
              {decision.category}
            </span>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {formatDateGroup(decision.created_at)}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="nx-btn nx-btn-ghost p-1.5 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <h2
          className="text-xl font-bold leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {decision.title}
        </h2>

        <DetailSection label="Context">
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {decision.context}
          </p>
        </DetailSection>

        <DetailSection label="Rationale">
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {decision.rationale}
          </p>
        </DetailSection>

        <DetailSection label="Alternatives Considered">
          <div className="flex flex-wrap gap-1.5">
            {((decision.alternatives as string[]) || []).length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                None recorded
              </p>
            ) : (
              (decision.alternatives as string[]).map((alt) => (
                <span
                  key={alt}
                  className="text-xs px-2.5 py-1 rounded-md"
                  style={{
                    background: "var(--bg-subtle)",
                    color:      "var(--text-secondary)",
                    border:     "1px solid var(--border-primary)",
                  }}
                >
                  {alt}
                </span>
              ))
            )}
          </div>
        </DetailSection>

        <DetailSection label="Metadata">
          <div className="space-y-2">
            <MetaRow label="Author"   value={decision.author || "—"}               />
            <MetaRow label="Time"     value={formatTime(decision.created_at)}       />
            <MetaRow label="ID"       value={decision.id.substring(0, 8).toUpperCase()} mono />
            <MetaRow label="Embedded" value="1024d vector"                          mono />
          </div>
        </DetailSection>
      </div>

      <div
        className="px-5 py-3 border-t flex items-center gap-2 flex-shrink-0"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <button className="nx-btn nx-btn-secondary flex-1 text-xs">
          Edit
        </button>
        <button
          className="nx-btn nx-btn-primary flex-1 text-xs"
          onClick={() => (window.location.href = "/app/chat")}
        >
          <Sparkles className="w-3 h-3" />
          Ask about this
        </button>
      </div>
    </div>
  );
}

function DetailSection({
  label,
  children,
}: {
  label:    string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function MetaRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
      <span
        className={`text-xs ${mono ? "font-mono" : "font-medium"}`}
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Log Decision Modal                                         */
/* ─────────────────────────────────────────────────────────── */

function LogDecisionModal({
  onClose,
  onCreated,
}: {
  onClose:   () => void;
  onCreated: () => void;
}) {
  const { userName }   = useOrg();
  const createDecision = useCreateDecision();

  const [title,        setTitle]        = useState("");
  const [context,      setContext]      = useState("");
  const [rationale,    setRationale]    = useState("");
  const [category,     setCategory]     = useState("Architecture");
  const [altInput,     setAltInput]     = useState("");
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [error,        setError]        = useState<string | null>(null);

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

  const addAlternative = () => {
    const trimmed = altInput.trim();
    if (trimmed && !alternatives.includes(trimmed)) {
      setAlternatives((prev) => [...prev, trimmed]);
      setAltInput("");
    }
  };

  const handleSubmit = async () => {
    if (!title || !context || !rationale) {
      setError("Title, context, and rationale are required");
      return;
    }
    setError(null);
    try {
      await createDecision.mutateAsync({
        title,
        context,
        rationale,
        alternatives,
        category,
        author: userName || "Team",
      });
      onCreated();
    } catch (err) {
      setError((err as Error).message || "Failed to log decision");
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
        className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        style={{
          background: "var(--bg-card)",
          border:     "1px solid var(--border-primary)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <div className="flex items-center gap-2">
            <Lightbulb
              className="w-4 h-4"
              style={{ color: "var(--accent-purple)" }}
            />
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Log Decision
            </h2>
          </div>
          <button
            onClick={onClose}
            className="nx-btn nx-btn-ghost p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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

          <ModalField label="Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chose CockroachDB for vector storage"
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
          </ModalField>

          <ModalField label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "var(--bg-elevated)",
                border:     "1px solid var(--border-primary)",
                color:      "var(--text-primary)",
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Context" required>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="What problem were you solving? What were the constraints?"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
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
          </ModalField>

          <ModalField label="Rationale" required>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Why did you make this choice? What made it the right decision?"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
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
          </ModalField>

          <ModalField label="Alternatives Considered">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={altInput}
                onChange={(e) => setAltInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAlternative();
                  }
                }}
                placeholder="e.g. Pinecone, Weaviate — press Enter to add"
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none transition-all"
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
              <button
                onClick={addAlternative}
                className="nx-btn nx-btn-secondary px-3 rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {alternatives.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {alternatives.map((alt) => (
                  <span
                    key={alt}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                    style={{
                      background: "var(--bg-subtle)",
                      border:     "1px solid var(--border-primary)",
                      color:      "var(--text-secondary)",
                    }}
                  >
                    {alt}
                    <button
                      onClick={() =>
                        setAlternatives((prev) =>
                          prev.filter((a) => a !== alt)
                        )
                      }
                      className="hover:opacity-70 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </ModalField>

          <ModalField label="Author">
            <input
              type="text"
              value={userName || "Team"}
              disabled
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none opacity-60"
              style={{
                background: "var(--bg-subtle)",
                border:     "1px solid var(--border-primary)",
                color:      "var(--text-primary)",
              }}
            />
          </ModalField>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between flex-shrink-0"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Auto-embedded for semantic search
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="nx-btn nx-btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                createDecision.isPending || !title || !context || !rationale
              }
              className="nx-btn nx-btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {createDecision.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Logging...
                </>
              ) : (
                <>
                  <Lightbulb className="w-3.5 h-3.5" />
                  Log Decision
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalField({
  label,
  required,
  children,
}: {
  label:     string;
  required?: boolean;
  children:  React.ReactNode;
}) {
  return (
    <div>
      <label
        className="text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--color-error)" }}>*</span>
        )}
      </label>
      {children}
    </div>
  );
}