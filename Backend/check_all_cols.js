const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "keuangan",
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
});

async function checkAll() {
  try {
    const promiseConn = connection.promise();
    const [tables] = await promiseConn.query("SHOW TABLES");
    const tableNames = tables.map((r) => Object.values(r)[0]);

    for (const table of tableNames) {
      const [cols] = await promiseConn.query(`DESCRIBE ${table}`);
      const hasUserId = cols.some((c) => c.Field === "user_id");
      console.log(
        `Table '${table}': ${hasUserId ? "HAS user_id" : "NO user_id"}`,
      );
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAll();
