const db = require("./config/db");

async function listAll() {
  try {
    const [rows] = await db.promise().query("SHOW TABLES");
    const tables = rows.map((r) => Object.values(r)[0]);
    console.log("Full Table List:", tables);

    for (const table of tables) {
      const [count] = await db
        .promise()
        .query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table}: ${count[0].count} records`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listAll();
