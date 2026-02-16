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

async function cleanseUserOne() {
  const userId = 1; // test@example.com in PRODUCTION
  console.log(
    `Starting targeted cleanse for User ID: ${userId} in 'keuangan' database...`,
  );

  const tables = [
    "transactions",
    "budgets",
    "goal_transactions",
    "notifications",
    "savings_goals",
    "accounts",
    "categories",
    "category_groups",
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

    await promiseConn.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log(
      "SUCCESS: Targeted cleanse complete for test@example.com (ID 1).",
    );
    process.exit(0);
  } catch (err) {
    console.error("FAILURE during cleanse:", err);
    process.exit(1);
  }
}

cleanseUserOne();
