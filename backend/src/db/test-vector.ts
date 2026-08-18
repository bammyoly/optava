import { query, closePool } from "../lib/db";

async function testVector() {
  console.log("Testing vector support...\n");

  try {
    // Test creating a table with VECTOR type
    await query(`
      CREATE TABLE IF NOT EXISTS _vector_test (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        embedding VECTOR(3)
      )
    `);
    console.log("✅ VECTOR type supported");

    // Test inserting a vector
    await query(`
      INSERT INTO _vector_test (embedding)
      VALUES ('[1.0, 2.0, 3.0]'::vector)
    `);
    console.log("✅ Vector insert works");

    // Test similarity search
    const result = await query(`
      SELECT embedding, embedding <=> '[1.0, 2.0, 3.0]'::vector AS distance
      FROM _vector_test
      LIMIT 1
    `);
    console.log("✅ Vector similarity operator works");
    console.log(`   Distance: ${result.rows[0].distance}`);

    // Cleanup
    await query(`DROP TABLE _vector_test`);
    console.log("\n🎉 Vector support fully working!");
  } catch (error: any) {
    console.error("\n❌ Vector test failed:");
    console.error(error.message);
    console.log("\n💡 Your CockroachDB version may not support vectors natively.");
    console.log("   We'll need to store embeddings as JSONB arrays instead.");
  } finally {
    await closePool();
  }
}

testVector();