import { query } from "../../lib/db";

/* ─────────────────────────────────────────────────────────── */
/*  List members of an organization                            */
/* ─────────────────────────────────────────────────────────── */

export async function listMembers(orgId: string) {
  const result = await query(
    `SELECT
       om.id,
       om.user_id,
       om.role,
       om.created_at,
       u.name,
       u.email,
       u.image
     FROM org_members om
     JOIN users u ON u.id = om.user_id
     WHERE om.org_id = $1
     ORDER BY
       CASE om.role
         WHEN 'owner'  THEN 1
         WHEN 'admin'  THEN 2
         WHEN 'member' THEN 3
       END,
       om.created_at ASC`,
    [orgId]
  );
  return result.rows;
}

/* ─────────────────────────────────────────────────────────── */
/*  Add a member (used after invite acceptance)                */
/* ─────────────────────────────────────────────────────────── */

export async function addMember(
  orgId:  string,
  userId: string,
  role:   string = "member"
) {
  const result = await query(
    `INSERT INTO org_members (org_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (org_id, user_id) DO NOTHING
     RETURNING *`,
    [orgId, userId, role]
  );
  return result.rows[0] || null;
}

/* ─────────────────────────────────────────────────────────── */
/*  Update member role                                         */
/* ─────────────────────────────────────────────────────────── */

export async function updateMemberRole(
  orgId:  string,
  userId: string,
  role:   string
) {
  const result = await query(
    `UPDATE org_members SET role = $1
     WHERE org_id = $2 AND user_id = $3
     RETURNING *`,
    [role, orgId, userId]
  );
  return result.rows[0] || null;
}

/* ─────────────────────────────────────────────────────────── */
/*  Remove member                                              */
/* ─────────────────────────────────────────────────────────── */

export async function removeMember(orgId: string, userId: string) {
  await query(
    `DELETE FROM org_members WHERE org_id = $1 AND user_id = $2`,
    [orgId, userId]
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Check membership                                           */
/* ─────────────────────────────────────────────────────────── */

export async function isMember(
  orgId:  string,
  userId: string
): Promise<boolean> {
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM org_members
     WHERE org_id = $1 AND user_id = $2`,
    [orgId, userId]
  );
  return parseInt(result.rows[0].count) > 0;
}

/* ─────────────────────────────────────────────────────────── */
/*  Get member role                                            */
/* ─────────────────────────────────────────────────────────── */

export async function getMemberRole(
  orgId:  string,
  userId: string
): Promise<string | null> {
  const result = await query(
    `SELECT role FROM org_members
     WHERE org_id = $1 AND user_id = $2`,
    [orgId, userId]
  );
  return result.rows[0]?.role || null;
}