// frontend/app/page.tsx

"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import {
  Brain,
  MessageSquare,
  Lightbulb,
  Zap,
  Users,
  ArrowRight,
  Database,
  Sparkles,
  Shield,
  GitBranch,
  Search,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-page)" }}
    >
      {/* ═══════════════════════════════════════════
          NAVBAR
         ═══════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 lg:px-12 border-b backdrop-blur-md"
        style={{
          borderColor: "var(--border-primary)",
          background:  "color-mix(in srgb, var(--bg-page) 85%, transparent)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
            }}
          >
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span
            className="font-bold text-lg"
            style={{ color: "var(--text-primary)" }}
          >
            Optava AI
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 ml-12">
          {["Features", "How It Works", "Tech Stack"].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(/\s/g, "-")}`}
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              {label}
            </a>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/app" className="nx-btn nx-btn-primary text-sm">
            Go To App
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════
          HERO
         ═══════════════════════════════════════════ */}
      <section className="pt-32 pb-20 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{
              background: "var(--accent-purple-bg)",
              border:     "1px solid rgba(167, 139, 250, 0.2)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent-purple)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--accent-purple)" }}>
              Built for the CockroachDB × AWS Hackathon
            </span>
          </div>

          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
            style={{ color: "var(--text-primary)" }}
          >
            The AI Project Manager{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #a78bfa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor:  "transparent",
              }}
            >
              That Never Forgets
            </span>
          </h1>

          <p
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Optava AI gives your team persistent, searchable memory.
            Every decision, task, and conversation stored and semantically indexed —
            so your AI agent can reason across your entire project history.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/app"
              className="nx-btn text-base px-8 py-3 rounded-xl font-semibold"
              style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
                color:      "#0b1020",
              }}
            >
              Launch App
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="nx-btn nx-btn-secondary text-base px-8 py-3 rounded-xl"
            >
              See Features
            </a>
          </div>

          {/* Hero visual */}
          <div
            className="mt-16 rounded-2xl p-1 mx-auto max-w-3xl"
            style={{
              background: "linear-gradient(135deg, rgba(167, 139, 250, 0.3), rgba(124, 58, 237, 0.1), rgba(167, 139, 250, 0.3))",
            }}
          >
            <div
              className="rounded-xl p-6 sm:p-8"
              style={{
                background: "var(--bg-card)",
                border:     "1px solid var(--border-primary)",
              }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}
                >
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div
                    className="rounded-xl p-4 mb-3"
                    style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-primary)" }}
                  >
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                      "Why did we choose CockroachDB for the memory layer?"
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{ background: "var(--accent-purple-bg)", border: "1px solid rgba(167, 139, 250, 0.2)" }}
                  >
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                      Based on the project memory, CockroachDB was chosen for three key reasons:
                      always-on availability, native vector indexing, and PostgreSQL compatibility...
                    </p>
                    <div className="flex gap-2 mt-3">
                      <span className="nx-citation">[1] 94%</span>
                      <span className="nx-citation">[2] 89%</span>
                      <span className="nx-citation">[3] 82%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 justify-center">
                <StatusDot label="CockroachDB" connected />
                <StatusDot label="Vector Index" connected />
                <StatusDot label="Bedrock AI" connected />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PROBLEM / SOLUTION
         ═══════════════════════════════════════════ */}
      <section className="py-20 px-6 lg:px-12" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Traditional PM tools are dumb databases
            </h2>
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              They store data but don't understand context. When someone asks
              "why did we choose this?" — the answer is lost in Slack threads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProblemSolutionCard
              problem="Context gets lost"
              solution="Every decision stored with full rationale, searchable semantically"
              icon={Lightbulb}
            />
            <ProblemSolutionCard
              problem="Onboarding is painful"
              solution="New members chat with project memory to get up to speed instantly"
              icon={MessageSquare}
            />
            <ProblemSolutionCard
              problem="Standups are manual"
              solution="AI synthesizes progress from memory — accurate, automatic, grounded"
              icon={Zap}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURES
         ═══════════════════════════════════════════ */}
      <section className="py-20 px-6 lg:px-12" id="features">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Memory-first project management
            </h2>
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              Every feature is designed around persistent, searchable project memory.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FeatureCard
              icon={MessageSquare}
              title="Memory Chat"
              description="Ask questions and get answers grounded in your project's stored context. Every response cites the memories it used."
            />
            <FeatureCard
              icon={Lightbulb}
              title="Decision Log"
              description="Record every decision with context, rationale, and alternatives. Semantically searchable so nothing gets lost."
            />
            <FeatureCard
              icon={Zap}
              title="AI Briefings"
              description="Auto-generated progress reports synthesized from tasks, decisions, notes, and conversations with confidence scoring."
            />
            <FeatureCard
              icon={Users}
              title="Team Intelligence"
              description="See who knows what, who owns what, and who has done what — all derived from project memory."
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TECH STACK
         ═══════════════════════════════════════════ */}
      <section className="py-20 px-6 lg:px-12" id="tech-stack">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Built on production-grade infrastructure
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TechCard icon={Database}  title="CockroachDB"  detail="Distributed SQL + Vector" />
            <TechCard icon={Sparkles}  title="AWS Bedrock"   detail="Claude Haiku 4.5" />
            <TechCard icon={Search}    title="Vector Search" detail="1024d Titan Embed" />
            <TechCard icon={Shield}    title="Always On"     detail="Zero downtime" />
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <TechCard icon={GitBranch} title="Next.js 15"    detail="App Router + RSC" />
            <TechCard icon={Database}  title="TypeScript"    detail="End to end" />
            <TechCard icon={Shield}    title="Auth Ready"    detail="OAuth 2.0" />
            <TechCard icon={Zap}       title="Real-time"     detail="RAG Pipeline" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FINAL CTA
         ═══════════════════════════════════════════ */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="rounded-2xl p-12"
            style={{
              background: "linear-gradient(135deg, rgba(167, 139, 250, 0.08) 0%, rgba(124, 58, 237, 0.03) 100%)",
              border:     "1px solid rgba(167, 139, 250, 0.2)",
            }}
          >
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Start building with persistent memory
            </h2>
            <p
              className="text-lg mb-8"
              style={{ color: "var(--text-secondary)" }}
            >
              Free to use. Set up in under a minute.
            </p>
            <Link
              href="/setup"
              className="nx-btn text-base px-8 py-3 rounded-xl font-semibold"
              style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
                color:      "#0b1020",
              }}
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
         ═══════════════════════════════════════════ */}
      <footer
        className="py-8 px-6 lg:px-12 border-t"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" style={{ color: "var(--accent-purple)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Optava AI
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Built for the CockroachDB × AWS Hackathon
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Sub-components                                             */
/* ─────────────────────────────────────────────────────────── */

function StatusDot({ label, connected }: { label: string; connected: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: connected ? "var(--color-success)" : "var(--color-error)",
          boxShadow:  connected ? "0 0 6px rgba(16, 185, 129, 0.4)" : "none",
        }}
      />
      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
    </div>
  );
}

function ProblemSolutionCard({
  problem,
  solution,
  icon: Icon,
}: {
  problem:  string;
  solution: string;
  icon:     React.ElementType;
}) {
  return (
    <div className="nx-card p-6">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: "var(--accent-purple-bg)" }}
      >
        <Icon className="w-5 h-5" style={{ color: "var(--accent-purple)" }} />
      </div>
      <p
        className="text-sm font-medium mb-2 line-through"
        style={{ color: "var(--text-tertiary)" }}
      >
        {problem}
      </p>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {solution}
      </p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon:        React.ElementType;
  title:       string;
  description: string;
}) {
  return (
    <div
      className="rounded-2xl p-6 transition-all duration-200"
      style={{
        background: "var(--bg-card)",
        border:     "1px solid var(--border-primary)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-primary)";
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: "var(--accent-purple-bg)" }}
      >
        <Icon className="w-6 h-6" style={{ color: "var(--accent-purple)" }} />
      </div>
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {description}
      </p>
    </div>
  );
}

function TechCard({
  icon: Icon,
  title,
  detail,
}: {
  icon:   React.ElementType;
  title:  string;
  detail: string;
}) {
  return (
    <div
      className="rounded-xl p-4 text-center"
      style={{
        background: "var(--bg-card)",
        border:     "1px solid var(--border-primary)",
      }}
    >
      <Icon
        className="w-5 h-5 mx-auto mb-2"
        style={{ color: "var(--accent-purple)" }}
      />
      <p
        className="text-sm font-semibold mb-0.5"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </p>
      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        {detail}
      </p>
    </div>
  );
}