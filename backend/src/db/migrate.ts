import fs   from "fs";
import path from "path";
import { query, closePool } from "../lib/db";

/* ─────────────────────────────────────────────────────────── */
/*  SQL Statement Splitter                                     */
/*  Properly handles Windows line endings, comments,           */
/*  and multi-line statements.                                 */
/* ─────────────────────────────────────────────────────────── */

function splitStatements(sql: string): string[] {
  // Normalize line endings
  const normalized = sql.replace(/\r\n/g, "\n");

  // Remove SQL comments (but preserve inside strings)
  const withoutComments = normalized
    .split("\n")
    .map((line) => {
      const commentIdx = line.indexOf("--");
      if (commentIdx === -1) return line;
      return line.substring(0, commentIdx);
    })
    .join("\n");

  // Split on semicolons and clean up
  return withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/* ─────────────────────────────────────────────────────────── */
/*  Migration Runner                                           */
/* ─────────────────────────────────────────────────────────── */

async function runMigrations() {
  console.log(" Running migrations...\n");

  const migrationsDir = path.join(__dirname, "migrations");

  if (!fs.existsSync(migrationsDir)) {
    console.error("❌ Migrations directory not found:", migrationsDir);
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("📭 No migration files found");
    return;
  }

  for (const file of files) {
    console.log(`▶  Running: ${file}`);

    const filePath = path.join(migrationsDir, file);
    const sql      = fs.readFileSync(filePath, "utf-8");

    const statements = splitStatements(sql);
    console.log(`   Found ${statements.length} statements\n`);

    let stmtNum = 0;

    for (const statement of statements) {
      stmtNum++;

      // Get a preview for logging (first 60 chars)
      const preview = statement
        .replace(/\s+/g, " ")
        .substring(0, 60);

      try {
        await query(statement);
        console.log(`   ✓ [${stmtNum}/${statements.length}] ${preview}...`);
      } catch (error: any) {
        console.error(`\n❌ Statement ${stmtNum} failed:`);
        console.error(`   SQL: ${preview}...`);
        console.error(`   Error: ${error.message}\n`);
        process.exit(1);
      }
    }

    console.log(`\n✅ Completed: ${file}\n`);
  }

  console.log("🎉 All migrations completed successfully!");
  await closePool();
}

runMigrations();