import { query, closePool } from "../lib/db";

async function testConnection() {
  console.log("🔌 Testing CockroachDB connection...\n");

  try {
    // Test 1: Basic query
    const versionResult = await query("SELECT version()");
    console.log("✅ Connection successful");
    console.log(`   Version: ${versionResult.rows[0].version.substring(0, 50)}...\n`);

    // Test 2: Check current database
    const dbResult = await query("SELECT current_database()");
    console.log(`✅ Connected to database: ${dbResult.rows[0].current_database}\n`);

    // Test 3: List existing tables
    const tablesResult = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablesResult.rowCount === 0) {
      console.log("📭 No tables yet — run `npm run db:migrate` to create schema\n");
    } else {
      console.log(`📋 Found ${tablesResult.rowCount} tables:`);
      tablesResult.rows.forEach((row) => {
        console.log(`   - ${row.table_name}`);
      });
      console.log("");
    }

    console.log("🎉 All connection tests passed!");
  } catch (error) {
    console.error("\n❌ Connection failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

testConnection();