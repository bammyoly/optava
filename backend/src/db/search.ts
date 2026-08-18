import { closePool } from "../lib/db";
import { semanticSearch } from "../lib/embeddings";
import { PROJECT_ID } from "./seed-data";

/* ─────────────────────────────────────────────────────────── */
/*  Test queries                                               */
/* ─────────────────────────────────────────────────────────── */

const testQueries = [
  "Why did we choose our database?",
  "What UI framework are we using?",
  "What are the current blockers?",
  "How does the AI reasoning work?",
  "What's the current sprint status?",
];

const sourceEmoji: Record<string, string> = {
  decision:     "💡",
  task:         "✅",
  note:         "📝",
  conversation: "💬",
  standup:      "⚡",
};

/* ─────────────────────────────────────────────────────────── */
/*  Helpers                                                    */
/* ─────────────────────────────────────────────────────────── */

function similarityBar(similarity: number, width: number = 20): string {
  const filled = Math.round(similarity * width);
  const empty  = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

function truncate(text: string, len: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > len ? clean.substring(0, len) + "..." : clean;
}

/* ─────────────────────────────────────────────────────────── */
/*  Main                                                       */
/* ─────────────────────────────────────────────────────────── */

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  🔍 Semantic Search Test");
  console.log("═══════════════════════════════════════════\n");

  // Check for CLI query argument
  const customQuery = process.argv.slice(2).join(" ");
  const queries    = customQuery ? [customQuery] : testQueries;

  try {
    for (const q of queries) {
      console.log(`\n💭 Query: "${q}"`);
      console.log("───────────────────────────────────────────");

      const start   = Date.now();
      const results = await semanticSearch(q, {
        projectId: PROJECT_ID,
        limit:     3,
      });
      const duration = Date.now() - start;

      if (results.length === 0) {
        console.log("   No results found");
        continue;
      }

      results.forEach((result, i) => {
        const emoji = sourceEmoji[result.source_type] || "•";
        const pct   = (result.similarity * 100).toFixed(1);
        const bar   = similarityBar(result.similarity);
        const title = result.metadata?.title || truncate(result.content, 50);

        console.log(`\n   [${i + 1}] ${emoji} ${result.source_type}  ${bar} ${pct}%`);
        console.log(`       ${title}`);
      });

      console.log(`\n   ⏱  Retrieved in ${duration}ms`);
    }

    console.log("\n═══════════════════════════════════════════");
    console.log("  🎉 Search complete");
    console.log("═══════════════════════════════════════════\n");

    console.log("💡 Try your own query:");
    console.log('   npm run db:search -- "your query here"\n');
  } catch (error: any) {
    console.error("\n❌ Search failed:");
    console.error(error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();