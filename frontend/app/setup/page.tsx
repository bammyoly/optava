// frontend/app/setup/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Brain,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  FolderOpen,
} from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

// A fixed guest userId that exists in the DB
// We'll create this user on first setup if they don't exist
const GUEST_USER_ID = "00000000-0000-0000-0000-000000000001";

export default function SetupPage() {
  const router = useRouter();

  const [step, setStep]               = useState(1);
  const [orgName, setOrgName]         = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);
  const [createdNames, setCreatedNames] = useState({
    org: "",
    project: "",
  });

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50);
  }

  async function getUniqueSlug(name: string): Promise<string> {
    const base = generateSlug(name);
    if (!base) return `workspace-${Date.now().toString(36)}`;

    try {
      const result = await api.organizations.checkSlug(base);
      if (result.available) return base;
    } catch {}

    const suffix = Math.random().toString(36).substring(2, 6);
    return `${base}-${suffix}`;
  }

async function ensureGuestUser() {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/debug/ensure-guest-user`,
        { method: "POST" }
    );
    if (!res.ok) {
        throw new Error("Failed to initialize guest user");
    }
}

  const handleCreate = async () => {
    if (!orgName.trim()) {
      setError("Organization name is required");
      return;
    }
    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1 — ensure guest user exists in DB
      await ensureGuestUser();

      // Step 2 — create org + project
      const slug = await getUniqueSlug(orgName);

      const result = await api.organizations.create({
        name:               orgName.trim(),
        slug,
        userId:             GUEST_USER_ID,
        projectName:        projectName.trim(),
        projectDescription: projectDesc.trim() || undefined,
      });

      // Step 3 — save to localStorage so layout can read it
      localStorage.setItem("mb_org_id",     result.org.id);
      localStorage.setItem("mb_project_id", result.project.id);
      localStorage.setItem("mb_org_name",   result.org.name);
      localStorage.setItem("mb_org_slug",   result.org.slug);

      setCreatedNames({ org: orgName.trim(), project: projectName.trim() });
      setSuccess(true);

    } catch (err: any) {
      console.error("[setup] Create failed:", err);
      const msg = err.message || "";
      if (msg.toLowerCase().includes("slug")) {
        setError("That workspace name is already taken. Try a different name.");
      } else if (msg.toLowerCase().includes("duplicate")) {
        setError("A workspace with that name already exists. Try a different name.");
      } else if (msg.toLowerCase().includes("user") && msg.toLowerCase().includes("not found")) {
        setError("Guest user setup failed. Please refresh and try again.");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    // Hard navigate so layout re-runs and picks up new DB data
    window.location.href = "/app";
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-page)" }}
    >
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-lg">

          {/* Logo + Title */}
          <div className="text-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background:
                  "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
              }}
            >
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              {success
                ? "You're all set!"
                : step === 1
                ? "Create your workspace"
                : "Set up your first project"}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              {success
                ? "Your workspace is ready"
                : step === 1
                ? "Give your team a home for projects and memory"
                : "Projects organize your tasks, decisions, and memory"}
            </p>
          </div>

          {/* Progress dots */}
          {!success && (
            <div className="flex items-center gap-2 mb-8 justify-center">
              <StepDot active={step >= 1} label="1" />
              <div
                className="w-12 h-0.5 rounded-full"
                style={{
                  background:
                    step >= 2
                      ? "var(--accent-purple)"
                      : "var(--border-primary)",
                }}
              />
              <StepDot active={step >= 2} label="2" />
            </div>
          )}

          {/* Card */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-primary)",
            }}
          >
            {/* Error */}
            {error && (
              <div
                className="rounded-lg p-3 mb-4 text-sm flex items-start gap-2"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "var(--color-error)",
                }}
              >
                <span className="flex-shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* ── Success State ── */}
            {success && (
              <div className="text-center py-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(16, 185, 129, 0.15)" }}
                >
                  <CheckCircle2
                    className="w-8 h-8"
                    style={{ color: "var(--color-success)" }}
                  />
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Workspace created!
                </h3>
                <p
                  className="text-sm mb-6"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <strong style={{ color: "var(--text-primary)" }}>
                    {createdNames.org}
                  </strong>{" "}
                  is ready with your first project{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    {createdNames.project}
                  </strong>
                  .
                </p>
                <button
                  onClick={handleGoToDashboard}
                  className="nx-btn nx-btn-primary py-3 px-8 rounded-xl text-base"
                >
                  <Sparkles className="w-4 h-4" />
                  Go to Dashboard
                </button>
              </div>
            )}

            {/* ── Step 1: Organization ── */}
            {!success && step === 1 && (
              <div className="space-y-5">
                <div>
                  <label
                    className="text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && orgName.trim()) {
                        setError(null);
                        setStep(2);
                      }
                    }}
                    placeholder="e.g. Acme Labs, My Team, MemoryBoard"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-primary)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--accent-purple)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--border-primary)";
                    }}
                    autoFocus
                  />
                  <p
                    className="text-xs mt-1.5"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    This is your team's workspace name. You can change it
                    later.
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (orgName.trim()) {
                      setError(null);
                      setStep(2);
                    }
                  }}
                  disabled={!orgName.trim()}
                  className="w-full nx-btn nx-btn-primary py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ── Step 2: Project ── */}
            {!success && step === 2 && (
              <div className="space-y-5">
                <div>
                  <label
                    className="text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        projectName.trim() &&
                        !isSubmitting
                      ) {
                        handleCreate();
                      }
                    }}
                    placeholder="e.g. Q4 Sprint, Product Launch, Hackathon"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-primary)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--accent-purple)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--border-primary)";
                    }}
                    autoFocus
                  />
                </div>

                <div>
                  <label
                    className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Description (optional)
                  </label>
                  <textarea
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    placeholder="What's this project about?"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-primary)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--accent-purple)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--border-primary)";
                    }}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setError(null);
                      setStep(1);
                    }}
                    className="flex-1 nx-btn nx-btn-secondary py-3 rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isSubmitting || !projectName.trim()}
                    className="flex-1 nx-btn nx-btn-primary py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Create Workspace
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom note */}
          {!success && (
            <div
              className="mt-6 rounded-xl p-4 text-center"
              style={{
                background: "var(--accent-purple-bg)",
                border: "1px solid rgba(167, 139, 250, 0.15)",
              }}
            >
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                <Sparkles
                  className="w-3 h-3 inline mr-1"
                  style={{ color: "var(--accent-purple)" }}
                />
                Your workspace includes AI-powered chat, semantic search,
                and persistent project memory — powered by CockroachDB and
                AWS Bedrock.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDot({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
      style={{
        background: active ? "var(--accent-purple)" : "var(--bg-elevated)",
        color: active ? "#0b1020" : "var(--text-tertiary)",
        border: active ? "none" : "1px solid var(--border-primary)",
      }}
    >
      {label}
    </div>
  );
}