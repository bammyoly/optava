//backend/src/api/services/orgranizations.ts

import { query, transaction } from "../../lib/db";

/* ─────────────────────────────────────────────────────────── */
/*  Create organization + first project + owner membership     */
/* ─────────────────────────────────────────────────────────── */

// backend/src/api/services/organizations.ts

export async function createOrganization(input: {
  name:        string;
  slug:        string;
  userId:      string;
  projectName: string;
  projectDesc?: string;
}) {
  return transaction(async (client) => {

    // ── Safety check: does this user exist? ───────────────
    // Catches stale-cookie scenarios where userId is from
    // a previous DB that was reset
    const userCheck = await client.query(
      `SELECT id, name, email FROM users WHERE id = $1`,
      [input.userId]
    );

    if (userCheck.rows.length === 0) {
      throw new Error(
        `USER_NOT_FOUND: No user with id "${input.userId}" exists in the database. ` +
        `If you recently reset the DB, clear your browser cookies and sign in again.`
      );
    }

    console.log("[createOrganization] Creating for user:", userCheck.rows[0].email);

    // ── 1. Create organization ─────────────────────────────
    const orgResult = await client.query(
      `INSERT INTO organizations (name, slug, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.name, input.slug, input.userId]
    );
    const org = orgResult.rows[0];
    console.log("[createOrganization] Org created:", org.id, org.name);

    // ── 2. Add creator as owner ────────────────────────────
    await client.query(
      `INSERT INTO org_members (org_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [org.id, input.userId]
    );
    console.log("[createOrganization] Owner membership created");

    // ── 3. Create first project ────────────────────────────
    const projectResult = await client.query(
      `INSERT INTO projects (org_id, name, description, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING *`,
      [org.id, input.projectName, input.projectDesc || null]
    );
    const project = projectResult.rows[0];
    console.log("[createOrganization] Project created:", project.id, project.name);

    return { org, project };
  });
}

/* ─────────────────────────────────────────────────────────── */
/*  Get organization by ID                                     */
/* ─────────────────────────────────────────────────────────── */

export async function getOrganization(id: string) {
  const result = await query(
    `SELECT * FROM organizations WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/* ─────────────────────────────────────────────────────────── */
/*  Get organization by slug                                   */
/* ─────────────────────────────────────────────────────────── */

export async function getOrganizationBySlug(slug: string) {
  const result = await query(
    `SELECT * FROM organizations WHERE slug = $1`,
    [slug]
  );
  return result.rows[0] || null;
}

/* ─────────────────────────────────────────────────────────── */
/*  Check if slug is available                                 */
/* ─────────────────────────────────────────────────────────── */

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const result = await query(
    `SELECT COUNT(*)::int AS count FROM organizations WHERE slug = $1`,
    [slug]
  );
  return parseInt(result.rows[0].count) === 0;
}

/* ─────────────────────────────────────────────────────────── */
/*  Update organization                                        */
/* ─────────────────────────────────────────────────────────── */

export async function updateOrganization(
  id:      string,
  updates: { name?: string }
) {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    values.push(updates.name);
    fields.push(`name = $${values.length}`);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await query(
    `UPDATE organizations SET ${fields.join(", ")}, updated_at = now()
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

/* ─────────────────────────────────────────────────────────── */
/*  Delete organization                                        */
/* ─────────────────────────────────────────────────────────── */

export async function deleteOrganization(id: string) {
  await query(`DELETE FROM organizations WHERE id = $1`, [id]);
}

/* ─────────────────────────────────────────────────────────── */
/*  Get user's org membership                                  */
/* ─────────────────────────────────────────────────────────── */

export async function getUserOrganization(userId: string) {
  const result = await query(
    `SELECT
       o.*,
       om.role AS user_role,
       p.id   AS project_id,
       p.name AS project_name
     FROM org_members om
     JOIN organizations o ON o.id = om.org_id
     LEFT JOIN projects p ON p.org_id = o.id
     WHERE om.user_id = $1
     ORDER BY om.created_at ASC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}