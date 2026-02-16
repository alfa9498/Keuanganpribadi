const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "keuangan", // PRODUCTION DB
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
});

async function safeCleanse() {
  const userId = 1;
  console.log(
    `Executing corrected targeted cleanse for User ID: ${userId} in 'keuangan'...`,
  );

  // Confirmed tables WITH user_id column
  const tables = [
    "transactions",
    "budgets",
    "notifications",
    "savings_goals",
    "accounts",
    "categories",
    "category_groups",
    "password_resets",
  ];

  try {
    connection.connect();
    const promiseConn = connection.promise();

    await promiseConn.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const table of tables) {
      const [result] = await promiseConn.query(
        `DELETE FROM ${table} WHERE user_id = ?`,
        [userId],
      );
      console.log(`Table '${table}': Deleted ${result.affectedRows} rows.`);
    }

    // Special case: goal_transactions usually links via target_id or similar.
    // However, if savings_goals for this user are deleted, orphaned goal_txs might remain.
    // Let's check for orphaned ones just in case.
    await promiseConn.query(`
      DELETE FROM goal_transactions 
      WHERE goal_id NOT IN (SELECT id FROM savings_goals)
    `);

    await promiseConn.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("SUCCESS: Targeted production cleanse complete for ID 1.");
    process.exit(0);
  } catch (err) {
    console.error("FAILURE:", err);
    process.exit(1);
  }
}

safeCleanse();
