const db = require("./config/db");

async function listTables() {
  try {
    const [tables] = await db.promise().query("SHOW TABLES");
    console.log("Database Tables:", JSON.stringify(tables, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listTables();
