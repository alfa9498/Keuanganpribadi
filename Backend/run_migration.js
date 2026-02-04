const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const dbConfig = {
  host: (process.env.DB_HOST || "localhost").trim(),
  user: (process.env.DB_USER || "root").trim(),
  password: (process.env.DB_PASSWORD || "").trim(),
  database: (process.env.DB_NAME || "myapp_db").trim(),
  port: parseInt(process.env.DB_PORT || "3306"),
  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized: false,
          minVersion: "TLSv1.2",
        }
      : null,
};

async function runMigration() {
  console.log("🚀 Starting Database Migration...");
  console.log(`Connecting to: ${dbConfig.host} / ${dbConfig.database}`);

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to database");

    const sqlFile = path.join(
      __dirname,
      "migrations",
      "migration_category_system.sql",
    );
    const sql = fs.readFileSync(sqlFile, "utf8");

    // Split by semicolon to run multiple queries if needed,
    // but for CREATE TABLE usually fine to run as separate queries or use multipleStatements
    // Simple create table usually works fine

    console.log("📜 Executing SQL migration...");

    // Execute queries one by one
    const queries = sql.split(";").filter((q) => q.trim());

    for (const query of queries) {
      if (query.trim()) {
        await connection.query(query);
      }
    }

    console.log("✅ Migration executed successfully!");
    console.log("   - Created table: category_groups");
    console.log("   - Created table: categories");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  } finally {
    if (connection) await connection.end();
    process.exit();
  }
}

runMigration();
