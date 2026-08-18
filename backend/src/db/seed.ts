import { query, transaction, closePool } from "../lib/db";
import {
  project,
  tasks,
  decisions,
  notes,
  conversations,
  standups,
  teamMembers,
} from "./seed-data";

/* ─────────────────────────────────────────────────────────── */
/*  Helpers                                                    */
/* ─────────────────────────────────────────────────────────── */

async function checkExisting(): Promise<boolean> {
  const result = await query(
    `SELECT COUNT(*) as count FROM projects WHERE id = $1`,
    [project.id]
  );
  return parseInt(result.rows[0].count) > 0;
}

async function clearProjectData(): Promise<void> {
  console.log("   🗑  Clearing existing project data...");

  // Cascade delete handles all child tables
  await query(`DELETE FROM projects WHERE id = $1`, [project.id]);
  console.log("   ✓ Cleared\n");
}

/* ─────────────────────────────────────────────────────────── */
/*  Seed Operations                                            */
/* ─────────────────────────────────────────────────────────── */

async function seedProject() {
  console.log("🌱 Seeding project...");

  await query(
    `INSERT INTO projects (id, name, description, status)
     VALUES ($1, $2, $3, $4)`,
    [project.id, project.name, project.description, project.status]
  );

  console.log(`   ✓ Created project: ${project.name}\n`);
}

async function seedTasks() {
  console.log(`🌱 Seeding ${tasks.length} tasks...`);

  await transaction(async (client) => {
    for (const task of tasks) {
      await client.query(
        `INSERT INTO tasks
          (id, project_id, task_code, category, title, description,
           status, priority, progress, assignee, due_date)
         VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          task.id, task.project_id, task.task_code, task.category,
          task.title, task.description, task.status, task.priority,
          task.progress, task.assignee, task.due_date,
        ]
      );
    }
  });

  // Breakdown by status
  const statusCounts: Record<string, number> = {};
  tasks.forEach((t) => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });

  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ✓ ${count} ${status}`);
  });
  console.log("");
}

async function seedDecisions() {
  console.log(`🌱 Seeding ${decisions.length} decisions...`);

  await transaction(async (client) => {
    for (const decision of decisions) {
      await client.query(
        `INSERT INTO decisions
          (id, project_id, title, context, rationale, alternatives, category, author)
         VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          decision.id, decision.project_id, decision.title,
          decision.context, decision.rationale,
          JSON.stringify(decision.alternatives),
          decision.category, decision.author,
        ]
      );
    }
  });

  // Breakdown by category
  const catCounts: Record<string, number> = {};
  decisions.forEach((d) => {
    const cat = d.category || "Uncategorized";
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });

  Object.entries(catCounts).forEach(([cat, count]) => {
    console.log(`   ✓ ${count} ${cat}`);
  });
  console.log("");
}

async function seedNotes() {
  console.log(`🌱 Seeding ${notes.length} notes...`);

  await transaction(async (client) => {
    for (const note of notes) {
      await client.query(
        `INSERT INTO notes (id, project_id, title, content, author, tags)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          note.id, note.project_id, note.title,
          note.content, note.author,
          note.tags ? JSON.stringify(note.tags) : null,
        ]
      );
    }
  });

  console.log(`   ✓ Created ${notes.length} notes\n`);
}

async function seedConversations() {
  console.log(`🌱 Seeding ${conversations.length} conversation messages...`);

  await transaction(async (client) => {
    for (const conv of conversations) {
      await client.query(
        `INSERT INTO conversations
          (id, project_id, session_id, role, content, metadata)
         VALUES
          ($1, $2, $3, $4, $5, $6)`,
        [
          conv.id, conv.project_id, conv.session_id,
          conv.role, conv.content,
          conv.metadata ? JSON.stringify(conv.metadata) : null,
        ]
      );
    }
  });

  const sessions = new Set(conversations.map((c) => c.session_id));
  console.log(`   ✓ Across ${sessions.size} sessions\n`);
}

async function seedStandups() {
  console.log(`🌱 Seeding ${standups.length} standups...`);

  await transaction(async (client) => {
    for (const standup of standups) {
      await client.query(
        `INSERT INTO standups
          (id, project_id, period_start, period_end,
           done, in_progress, blockers, focus, highlights,
           confidence, gen_time_ms, source_counts)
         VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          standup.id, standup.project_id,
          standup.period_start, standup.period_end,
          JSON.stringify(standup.done),
          JSON.stringify(standup.in_progress),
          JSON.stringify(standup.blockers),
          JSON.stringify(standup.focus),
          JSON.stringify(standup.highlights),
          standup.confidence, standup.gen_time_ms,
          JSON.stringify(standup.source_counts),
        ]
      );
    }
  });

  console.log(`   ✓ Created ${standups.length} standups\n`);
}

async function seedTeamMembers() {
  console.log(`🌱 Seeding ${teamMembers.length} team members...`);

  await transaction(async (client) => {
    for (const member of teamMembers) {
      await client.query(
        `INSERT INTO team_members (id, project_id, name, role, avatar_color)
         VALUES ($1, $2, $3, $4, $5)`,
        [member.id, member.project_id, member.name, member.role, member.avatar_color]
      );
    }
  });

  console.log(`   ✓ Created ${teamMembers.length} team members\n`);
}

/* ─────────────────────────────────────────────────────────── */
/*  Main                                                       */
/* ─────────────────────────────────────────────────────────── */

async function seed() {
  console.log("═══════════════════════════════════════════");
  console.log("  🌱 MemoryBoard Seed");
  console.log("═══════════════════════════════════════════\n");

  const startTime = Date.now();

  try {
    // Check if data already exists
    const existing = await checkExisting();
    if (existing) {
      console.log("⚠  Project data already exists.");

      const shouldClear = process.argv.includes("--force");
      if (!shouldClear) {
        console.log("\n To reseed, run: npm run db:seed -- --force");
        await closePool();
        return;
      }

      await clearProjectData();
    }

    // Seed in dependency order
    await seedProject();
    await seedTasks();
    await seedDecisions();
    await seedNotes();
    await seedConversations();
    await seedStandups();
    await seedTeamMembers();  // ← add this line

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("═══════════════════════════════════════════");
    console.log(`   Seeding complete in ${duration}s`);
    console.log("═══════════════════════════════════════════");
    console.log(`  Project:       1`);
    console.log(`  Tasks:         ${tasks.length}`);
    console.log(`  Decisions:     ${decisions.length}`);
    console.log(`  Notes:         ${notes.length}`);
    console.log(`  Conversations: ${conversations.length}`);
    console.log(`  Standups:      ${standups.length}`);
    console.log(`  Team Members: ${teamMembers.length}`);
    console.log("═══════════════════════════════════════════\n");

    console.log("   Note: Embeddings will be generated");
    console.log("   once AWS Bedrock is set up.");
    console.log("   Run: npm run db:embed (coming soon)\n");
  } catch (error: any) {
    console.error("\n❌ Seed failed:");
    console.error(error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

seed();