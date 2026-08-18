// backend/src/api/routes/debug.ts

import { Router } from "express";
import { pool, transaction } from "../../lib/db";

const router = Router();

// GET /api/debug/db-state
router.get("/db-state", async (req, res) => {
  try {
    const tables = ["users","organizations","org_members","projects"];
    const counts: Record<string, any> = {};

    for (const table of tables) {
      const r = await pool.query(`SELECT COUNT(*) AS count FROM ${table}`);
      counts[table] = parseInt(r.rows[0].count, 10);
    }

    // Also show the actual rows for key tables
    const orgs     = await pool.query(`SELECT id, name, slug, created_by FROM organizations LIMIT 5`);
    const projects = await pool.query(`SELECT id, name, org_id FROM projects LIMIT 5`);
    const members  = await pool.query(`SELECT org_id, user_id, role FROM org_members LIMIT 5`);

    res.json({
      counts,
      rows: {
        organizations: orgs.rows,
        projects:      projects.rows,
        org_members:   members.rows,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// POST /api/debug/test-create-org
// Test the full createOrganization flow with verbose logging
router.post("/test-create-org", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  const steps: any[] = [];

  try {
    const result = await transaction(async (client) => {

      // Step 1: Check user
      steps.push({ step: 1, action: "check_user", userId });
      const userCheck = await client.query(
        `SELECT id, email FROM users WHERE id = $1`, [userId]
      );
      steps.push({ step: 1, result: userCheck.rows[0] ?? "NOT_FOUND" });

      if (userCheck.rows.length === 0) {
        throw new Error(`User ${userId} not found`);
      }

      // Step 2: Create org
      steps.push({ step: 2, action: "create_org" });
      const orgRes = await client.query(
        `INSERT INTO organizations (name, slug, created_by)
         VALUES ($1, $2, $3) RETURNING *`,
        ["Debug Org", `debug-org-${Date.now()}`, userId]
      );
      const org = orgRes.rows[0];
      steps.push({ step: 2, result: { orgId: org.id, orgName: org.name } });

      // Step 3: Create member
      steps.push({ step: 3, action: "create_member" });
      const memberRes = await client.query(
        `INSERT INTO org_members (org_id, user_id, role)
         VALUES ($1, $2, 'owner') RETURNING *`,
        [org.id, userId]
      );
      steps.push({ step: 3, result: memberRes.rows[0] });

      // Step 4: Create project
      steps.push({ step: 4, action: "create_project" });
      const projectRes = await client.query(
        `INSERT INTO projects (org_id, name, description, status)
         VALUES ($1, $2, $3, 'active') RETURNING *`,
        [org.id, "Debug Project", "Test project"]
      );
      const project = projectRes.rows[0];
      steps.push({ step: 4, result: { projectId: project.id, projectName: project.name } });

      return { org, project };
    });

    res.json({ success: true, steps, result });

  } catch (err: any) {
    res.status(500).json({
      success: false,
      steps,                    // shows exactly which step failed
      error: err.message,
      stack: err.stack,
    });
  }
});

/* POST /api/debug/ensure-guest-user */
router.post("/ensure-guest-user", async (req, res) => {
  try {
    await pool.query(`
      INSERT INTO users (id, name, email)
      VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Guest User',
        'guest@memoryboard.local'
      )
      ON CONFLICT (id) DO NOTHING
    `);

    const result = await pool.query(`
      SELECT id, name, email FROM users
      WHERE id = '00000000-0000-0000-0000-000000000001'
    `);

    res.json({ success: true, user: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;