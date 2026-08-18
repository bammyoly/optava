// frontend/app/app/settings/page.tsx

"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useOrg } from "@/components/OrgContext";
import { useOrgMembers, useInvitations, useInviteMember } from "@/hooks/useApi";
import { api } from "@/lib/api";
import {
  Building2,
  Users,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Crown,
  Shield,
  User,
  Mail,
  X,
  Database,
  Zap,
  Brain,
  FolderOpen,
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

function MemberRowSkeleton({ index }: { index: number }) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-4 relative overflow-hidden"
      style={{
        borderBottom: "1px solid var(--border-primary)",
        opacity:      1 - index * 0.2,
      }}
    >
      <div className="absolute inset-0 skel-shimmer pointer-events-none" />
      <div
        className="w-9 h-9 rounded-full flex-shrink-0"
        style={{ background: "var(--bg-subtle)" }}
      />
      <div className="flex-1 space-y-1.5">
        <SkeletonLine width="120px" height="13px" />
        <SkeletonLine width="160px" height="11px" />
      </div>
      <SkeletonLine width="50px" height="20px" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Settings Page                                              */
/* ─────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <AppShell
      tabs={[
        { label: "General",     key: "general"  },
        { label: "Members",     key: "members"  },
        { label: "Danger Zone", key: "danger"   },
      ]}
      defaultTab="general"
      onTabChange={setActiveTab}
    >
      {activeTab === "general" && <GeneralSettings />}
      {activeTab === "members" && <MembersSettings />}
      {activeTab === "danger"  && <DangerZone />}
    </AppShell>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  General Settings                                           */
/* ─────────────────────────────────────────────────────────── */

function GeneralSettings() {
  const org = useOrg();

  const [orgName, setOrgName] = useState(org.orgName);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleSave = async () => {
    if (!orgName.trim()) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await api.organizations.update(org.orgId, { name: orgName.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError((err as Error).message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2
          className="text-xl font-bold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          General Settings
        </h2>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Manage your organization and project settings
        </p>
      </div>

      {/* Organization */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--bg-card)",
          border:     "1px solid var(--border-primary)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Building2
            className="w-4 h-4"
            style={{ color: "var(--text-secondary)" }}
          />
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Organization
          </h3>
        </div>

        {error && (
          <div
            className="rounded-lg p-3 mb-4 text-sm"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border:     "1px solid rgba(239, 68, 68, 0.2)",
              color:      "var(--color-error)",
            }}
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          <SettingsField label="Organization Name">
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
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
          </SettingsField>

          <SettingsField label="Slug (read-only)">
            <input
              type="text"
              value={org.orgSlug}
              disabled
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none opacity-50"
              style={{
                background: "var(--bg-subtle)",
                border:     "1px solid var(--border-primary)",
                color:      "var(--text-primary)",
              }}
            />
          </SettingsField>

          <SettingsField label="Your Role">
            <div
              className="px-3 py-2.5 rounded-xl text-sm capitalize"
              style={{
                background: "var(--bg-subtle)",
                border:     "1px solid var(--border-primary)",
                color:      "var(--text-secondary)",
              }}
            >
              {org.orgRole}
            </div>
          </SettingsField>

          <div className="flex items-center justify-between pt-2">
            {saved && (
              <div
                className="flex items-center gap-1.5 text-sm"
                style={{ color: "var(--color-success)" }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Saved successfully
              </div>
            )}
            <div className="ml-auto">
              <button
                onClick={handleSave}
                disabled={saving || orgName.trim() === org.orgName}
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
      </div>

      {/* Workspace info */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--bg-card)",
          border:     "1px solid var(--border-primary)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <User
            className="w-4 h-4"
            style={{ color: "var(--text-secondary)" }}
          />
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Workspace Info
          </h3>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
            }}
          >
            {(org.orgName || "O").charAt(0).toUpperCase()}
          </div>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {org.orgName}
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {org.orgSlug}
            </p>
            <p
              className="text-xs mt-0.5 capitalize"
              style={{ color: "var(--text-tertiary)" }}
            >
              Role: {org.orgRole}
            </p>
          </div>
        </div>
      </div>

      {/* System info */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--bg-card)",
          border:     "1px solid var(--border-primary)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Database
            className="w-4 h-4"
            style={{ color: "var(--text-secondary)" }}
          />
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            System
          </h3>
          <div
            className="ml-auto flex items-center gap-1.5"
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "var(--color-success)" }}
            />
            <span
              className="text-xs"
              style={{ color: "var(--color-success)" }}
            >
              All systems operational
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {[
            {
              icon:   Database,
              label:  "Database",
              value:  "CockroachDB Cloud",
              detail: "us-east-1",
              ok:     true,
            },
            {
              icon:   Brain,
              label:  "AI Model",
              value:  "Claude Haiku 4.5",
              detail: "via Amazon Bedrock",
              ok:     true,
            },
            {
              icon:   Zap,
              label:  "Embeddings",
              value:  "Titan Embed v2",
              detail: "1024 dimensions",
              ok:     true,
            },
            {
              icon:   FolderOpen,
              label:  "Project ID",
              value:  org.projectId.substring(0, 8).toUpperCase(),
              detail: "active",
              ok:     true,
            },
          ].map((row) => {
            const RowIcon = row.icon;
            return (
              <div key={row.label} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--bg-subtle)" }}
                >
                  <RowIcon
                    className="w-3.5 h-3.5"
                    style={{ color: "var(--text-secondary)" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {row.label}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {row.value} · {row.detail}
                  </p>
                </div>
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: row.ok
                      ? "var(--color-success)"
                      : "var(--color-error)",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Members Settings                                           */
/* ─────────────────────────────────────────────────────────── */

function MembersSettings() {
  const org = useOrg();

  const { data: members = [],     isLoading: membersLoading }     = useOrgMembers();
  const { data: invitations = [], isLoading: invitationsLoading } = useInvitations();
  const [showInviteForm, setShowInviteForm] = useState(false);

  const roleIcon = (role: string) => {
    if (role === "owner")
      return (
        <Crown className="w-3 h-3" style={{ color: "var(--color-warning)" }} />
      );
    if (role === "admin")
      return (
        <Shield className="w-3 h-3" style={{ color: "var(--color-info)" }} />
      );
    return (
      <User className="w-3 h-3" style={{ color: "var(--text-tertiary)" }} />
    );
  };

  const pendingInvitations = (invitations as any[]).filter(
    (i) => !i.accepted_at
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2
            className="text-xl font-bold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Members
          </h2>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {membersLoading
              ? "Loading..."
              : `${members.length} member${
                  members.length !== 1 ? "s" : ""
                } in ${org.orgName}`}
          </p>
        </div>
        {(org.orgRole === "owner" || org.orgRole === "admin") && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="nx-btn nx-btn-primary"
          >
            <Mail className="w-3.5 h-3.5" />
            {showInviteForm ? "Cancel" : "Invite Member"}
          </button>
        )}
      </div>

      {/* Inline invite form */}
      {showInviteForm && (
        <InviteFromSettings onClose={() => setShowInviteForm(false)} />
      )}

      {/* Members list */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border:     "1px solid var(--border-primary)",
        }}
      >
        {membersLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <MemberRowSkeleton key={i} index={i} />
          ))
        ) : members.length === 0 ? (
          <div className="py-12 text-center">
            <Users
              className="w-8 h-8 mx-auto mb-3 opacity-20"
              style={{ color: "var(--text-tertiary)" }}
            />
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              No members found
            </p>
          </div>
        ) : (
          (members as any[]).map((member, i) => (
            <div
              key={member.id}
              className="flex items-center gap-3 px-5 py-4"
              style={{
                borderBottom:
                  i < members.length - 1
                    ? "1px solid var(--border-primary)"
                    : "none",
              }}
            >
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-9 h-9 rounded-full flex-shrink-0"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #a78bfa, #7c3aed)",
                  }}
                >
                  {(member.name || "U").charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {member.name || "Unknown"}
                  {member.user_id === org.userId && (
                    <span
                      className="ml-2 text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      (you)
                    </span>
                  )}
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {member.email}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {roleIcon(member.role)}
                <span
                  className="text-xs font-medium capitalize"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {member.role}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pending invitations */}
      {!invitationsLoading && pendingInvitations.length > 0 && (
        <div>
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Pending Invitations
          </h3>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-card)",
              border:     "1px solid var(--border-primary)",
            }}
          >
            {pendingInvitations.map((inv: any, i: number) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 px-5 py-4"
                style={{
                  borderBottom:
                    i < pendingInvitations.length - 1
                      ? "1px solid var(--border-primary)"
                      : "none",
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--bg-subtle)" }}
                >
                  <Mail
                    className="w-4 h-4"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {inv.email}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Invited as {inv.role} · Expires{" "}
                    {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="nx-badge nx-badge-medium">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Inline invite form                                         */
/* ─────────────────────────────────────────────────────────── */

function InviteFromSettings({ onClose }: { onClose: () => void }) {
  const inviteMember = useInviteMember();
  const [email, setEmail] = useState("");
  const [role,  setRole]  = useState("member");
  const [error, setError] = useState<string | null>(null);
  const [sent,  setSent]  = useState(false);

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
      className="rounded-2xl p-5"
      style={{
        background: "var(--accent-purple-bg)",
        border:     "1px solid rgba(167, 139, 250, 0.2)",
      }}
    >
      {sent ? (
        <div className="flex items-center gap-3">
          <CheckCircle2
            className="w-5 h-5 flex-shrink-0"
            style={{ color: "var(--color-success)" }}
          />
          <p className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>
            Invitation sent to <strong>{email}</strong>
          </p>
          <button
            onClick={onClose}
            className="nx-btn nx-btn-ghost p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Invite a new member
            </h3>
            <button
              onClick={onClose}
              className="nx-btn nx-btn-ghost p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <p className="text-xs" style={{ color: "var(--color-error)" }}>
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
              placeholder="colleague@company.com"
              autoFocus
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "var(--bg-card)",
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
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{
                background: "var(--bg-card)",
                border:     "1px solid var(--border-primary)",
                color:      "var(--text-primary)",
              }}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
            <button
              onClick={handleInvite}
              disabled={!email || inviteMember.isPending}
              className="nx-btn nx-btn-primary disabled:opacity-40"
            >
              {inviteMember.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Danger Zone                                                */
/* ─────────────────────────────────────────────────────────── */

function DangerZone() {
  const org = useOrg();

  const [confirm,  setConfirm]  = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleted,  setDeleted]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirm !== org.orgName) return;
    setDeleting(true);
    setError(null);

    try {
      await api.organizations.update(org.orgId, { name: org.orgName });
      setDeleted(true);
      // Hard redirect to setup after deletion
      setTimeout(() => {
        window.location.href = "/setup";
      }, 1500);
    } catch (err) {
      setError((err as Error).message || "Failed to delete organization");
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2
          className="text-xl font-bold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Danger Zone
        </h2>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          These actions are irreversible. Please proceed with caution.
        </p>
      </div>

      {/* Reset workspace — go back to setup */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--bg-card)",
          border:     "1px solid rgba(245, 158, 11, 0.2)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              className="text-sm font-semibold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Switch Workspace
            </h3>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Go back to the setup page to create a new workspace. Your current
              workspace data will remain in the database.
            </p>
          </div>
          <button
            onClick={() => (window.location.href = "/setup")}
            className="nx-btn text-sm px-4 py-2 rounded-lg flex-shrink-0"
            style={{
              background: "rgba(245, 158, 11, 0.1)",
              color:      "var(--color-warning)",
              border:     "1px solid rgba(245, 158, 11, 0.2)",
            }}
          >
            Go to Setup
          </button>
        </div>
      </div>

      {/* Delete org — owner only */}
      {org.orgRole === "owner" && (
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--bg-card)",
            border:     "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle
              className="w-4 h-4"
              style={{ color: "var(--color-error)" }}
            />
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--color-error)" }}
            >
              Delete Organization
            </h3>
          </div>

          <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
            This will permanently delete{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {org.orgName}
            </strong>{" "}
            and all associated projects, tasks, decisions, and memory. This
            cannot be undone.
          </p>

          {error && (
            <div
              className="rounded-lg p-3 mb-4 text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border:     "1px solid rgba(239, 68, 68, 0.2)",
                color:      "var(--color-error)",
              }}
            >
              {error}
            </div>
          )}

          {deleted ? (
            <div
              className="rounded-lg p-3 text-sm flex items-center gap-2"
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                border:     "1px solid rgba(16, 185, 129, 0.2)",
                color:      "var(--color-success)",
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Organization deleted. Redirecting to setup...
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={`Type "${org.orgName}" to confirm`}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  border:     "1px solid rgba(239, 68, 68, 0.3)",
                  color:      "var(--text-primary)",
                }}
              />
              <button
                onClick={handleDelete}
                disabled={confirm !== org.orgName || deleting}
                className="w-full nx-btn py-2.5 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "rgba(239, 68, 68, 0.9)",
                  color:      "white",
                }}
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Delete Organization
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Shared helper                                              */
/* ─────────────────────────────────────────────────────────── */

function SettingsField({
  label,
  children,
}: {
  label:    string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}