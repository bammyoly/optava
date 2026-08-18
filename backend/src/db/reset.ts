import { query, closePool } from "../lib/db";

async function reset() {
  console.log(" Resetting database...\n");

  const tables = [
    "memory_embeddings",
    "agent_tasks",
    "notes",
    "standups",
    "conversations",
    "decisions",
    "tasks",
    "projects",
  ];

  for (const table of tables) {
    try {
      await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`   ✓ Dropped ${table}`);
    } catch (error: any) {
      console.log(`   ⚠  ${table}: ${error.message}`);
    }
  }

  console.log("\n✅ Reset complete");
  await closePool();
}

reset();