import { generateEmbedding, generateChat } from "../lib/bedrock";

async function testBedrock() {
  console.log("═══════════════════════════════════════════");
  console.log("  🤖 Testing AWS Bedrock");
  console.log("═══════════════════════════════════════════\n");

  // ─── Test 1: Embeddings ─────────────────────────────
  console.log("🧪 Test 1: Titan Embed v2");
  console.log("   Generating embedding for sample text...\n");

  try {
    const start1 = Date.now();

    const embedResult = await generateEmbedding(
      "CockroachDB was chosen for its always-on distributed architecture."
    );

    const duration1 = Date.now() - start1;

    console.log(`   ✅ Success in ${duration1}ms`);
    console.log(`      Dimensions: ${embedResult.embedding.length}`);
    console.log(`      Input tokens: ${embedResult.inputTokens}`);
    console.log(`      Sample values: [${embedResult.embedding.slice(0, 3).map(v => v.toFixed(4)).join(", ")}...]\n`);
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    if (error.name === "AccessDeniedException") {
      console.log("   💡 Ensure Titan Embed v2 is enabled in Bedrock Model Access\n");
    }
    process.exit(1);
  }

  // ─── Test 2: Chat ────────────────────────────────────
  console.log("🧪 Test 2: Claude 3 Haiku");
  console.log("   Generating chat response...\n");

  try {
    const start2 = Date.now();

    const chatResult = await generateChat(
      [
        { role: "user", content: "In one sentence, explain what agentic memory is." },
      ],
      {
        system:    "You are a helpful AI expert on database systems.",
        maxTokens: 150,
      }
    );

    const duration2 = Date.now() - start2;

    console.log(`   ✅ Success in ${duration2}ms`);
    console.log(`      Input tokens:  ${chatResult.inputTokens}`);
    console.log(`      Output tokens: ${chatResult.outputTokens}`);
    console.log(`      Stop reason:   ${chatResult.stopReason}`);
    console.log(`\n   💬 Response:`);
    console.log(`      "${chatResult.content}"\n`);
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    if (error.name === "AccessDeniedException") {
      console.log("   💡 Ensure Claude 3 Haiku is enabled in Bedrock Model Access\n");
    }
    process.exit(1);
  }

  console.log("═══════════════════════════════════════════");
  console.log("  🎉 All Bedrock tests passed!");
  console.log("═══════════════════════════════════════════\n");
}

testBedrock();