import { query, closePool } from "../lib/db";
import { PROJECT_ID } from "./seed-data";

async function verify() {
  console.log("🔍 Verifying seeded data...\n");

  try {
    const checks = [
      { name: "Projects",      sql: `SELECT COUNT(*) FROM projects WHERE id = $1`,        params: [PROJECT_ID] },
      { name: "Tasks",         sql: `SELECT COUNT(*) FROM tasks WHERE project_id = $1`,   params: [PROJECT_ID] },
      { name: "Decisions",     sql: `SELECT COUNT(*) FROM decisions WHERE project_id = $1`, params: [PROJECT_ID] },
      { name: "Notes",         sql: `SELECT COUNT(*) FROM notes WHERE project_id = $1`,   params: [PROJECT_ID] },
      { name: "Conversations", sql: `SELECT COUNT(*) FROM conversations WHERE project_id = $1`, params: [PROJECT_ID] },
      { name: "Standups",      sql: `SELECT COUNT(*) FROM standups WHERE project_id = $1`, params: [PROJECT_ID] },
      { name: "Embeddings",    sql: `SELECT COUNT(*) FROM memory_embeddings WHERE project_id = $1`, params: [PROJECT_ID] },
    ];

    for (const check of checks) {
      const result = await query(check.sql, check.params);
      const count = parseInt(result.rows[0].count);
      const icon  = count > 0 ? "✓" : "○";
      const pad   = check.name.padEnd(15);
      console.log(`   ${icon} ${pad} ${count} rows`);
    }

    // Show sample project
    console.log("\n📋 Sample project:");
    const project = await query(
      `SELECT name, description, status, created_at
       FROM projects WHERE id = $1`,
      [PROJECT_ID]
    );

    if (project.rowCount && project.rowCount > 0) {
      const p = project.rows[0];
      console.log(`   Name:        ${p.name}`);
      console.log(`   Status:      ${p.status}`);
      console.log(`   Created:     ${p.created_at.toISOString()}`);
    }

    // Show task breakdown
    console.log("\n📊 Task breakdown by status:");
    const taskBreakdown = await query(
      `SELECT status, COUNT(*) as count
       FROM tasks WHERE project_id = $1
       GROUP BY status ORDER BY status`,
      [PROJECT_ID]
    );

    taskBreakdown.rows.forEach((row) => {
      console.log(`   ${row.status.padEnd(15)} ${row.count}`);
    });

    console.log("\n🎉 Verification complete!\n");
  } catch (error: any) {
    console.error("❌ Verification failed:");
    console.error(error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

verify();