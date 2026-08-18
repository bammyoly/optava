import { closePool } from "../lib/db";
import { embedAll } from "../lib/embeddings";
import { PROJECT_ID } from "./seed-data";

/* ─────────────────────────────────────────────────────────── */
/*  Helpers                                                    */
/* ─────────────────────────────────────────────────────────── */

const sourceEmoji: Record<string, string> = {
  decision:     "💡",
  task:         "✅",
  note:         "📝",
  conversation: "💬",
  standup:      "⚡",
};

function truncate(text: string, len: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > len ? clean.substring(0, len) + "..." : clean;
}

/* ─────────────────────────────────────────────────────────── */
/*  Main                                                       */
/* ─────────────────────────────────────────────────────────── */

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  🧠 Generating Memory Embeddings");
  console.log("═══════════════════════════════════════════\n");

  try {
    const stats = await embedAll(PROJECT_ID, (current, total, item) => {
      const emoji  = sourceEmoji[item.source_type] || "•";
      const label  = `[${current}/${total}]`.padEnd(8);
      const type   = item.source_type.padEnd(13);
      const title  = truncate(item.content, 55);

      console.log(`   ${label} ${emoji} ${type} ${title}`);
    });

    console.log("\n═══════════════════════════════════════════");
    console.log("  ✅ Embedding complete");
    console.log("═══════════════════════════════════════════");
    console.log(`  Total processed:  ${stats.total}`);
    console.log(`  ✓ Succeeded:      ${stats.succeeded}`);
    if (stats.failed > 0) {
      console.log(`  ✗ Failed:         ${stats.failed}`);
    }
    console.log(`  ⏱  Duration:       ${(stats.duration_ms / 1000).toFixed(2)}s`);
    console.log(`  ⚡ Avg per item:   ${Math.round(stats.duration_ms / stats.total)}ms`);
    console.log("═══════════════════════════════════════════\n");

    console.log("💡 Next: run `npm run db:search` to try semantic search\n");
  } catch (error: any) {
    console.error("\n❌ Embedding failed:");
    console.error(error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();