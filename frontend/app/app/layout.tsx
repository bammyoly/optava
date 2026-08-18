// frontend/app/app/layout.tsx

import { OrgProvider } from "@/components/OrgContext";
import { Pool } from "pg";

// Force fresh DB query on every request — no caching
export const dynamic = "force-dynamic";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function getFirstOrgAndProject() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT
          o.id        AS "orgId",
          o.name      AS "orgName",
          o.slug      AS "orgSlug",
          om.role     AS "orgRole",
          om.user_id  AS "userId",
          u.name      AS "userName",
          u.email     AS "userEmail",
          u.image     AS "userImage",
          p.id        AS "projectId"
        FROM   organizations o
        JOIN   org_members om ON om.org_id = o.id
        JOIN   users u        ON u.id = om.user_id
        LEFT   JOIN projects p ON p.org_id = o.id
        ORDER  BY o.created_at ASC, p.created_at ASC
        LIMIT  1
      `);

      if (result.rows.length === 0) return null;
      return result.rows[0];
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[layout] DB lookup failed:", err);
    return null;
  }
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getFirstOrgAndProject();

  if (!data || !data.orgId || !data.projectId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-page)" }}
      >
        <div
          className="rounded-2xl p-8 max-w-md w-full text-center"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{
              background:
                "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
            }}
          >
            <span className="text-white text-xl">🧠</span>
          </div>
          <h2
            className="text-lg font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            No workspace found
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            Create your organization and first project to get started.
          </p>
          <a
            href="/setup"
            className="nx-btn nx-btn-primary py-3 px-6 rounded-xl inline-flex"
          >
            Create Workspace
          </a>
        </div>
      </div>
    );
  }

  const orgValue = {
    orgId:     data.orgId,
    orgName:   data.orgName    || "",
    orgSlug:   data.orgSlug    || "",
    orgRole:   data.orgRole    || "owner",
    projectId: data.projectId,
    userId:    data.userId     || "",
    userName:  data.userName   || "",
    userEmail: data.userEmail  || "",
    userImage: data.userImage  || null,
  };

  return (
    <OrgProvider value={orgValue}>
      {children}
    </OrgProvider>
  );
}