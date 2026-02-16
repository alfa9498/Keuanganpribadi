const db = require("./config/db");

async function cleanseDB() {
  try {
    console.log("Starting full database cleanse...");

    // Ordered to respect potential FKs, but we'll use SET FOREIGN_KEY_CHECKS=0 to be sure
    const tablesToClear = [
      "transactions",
      "budgets",
      "goal_transactions",
      "notifications",
      "password_resets",
      "savings_goals",
      "accounts",
      "categories",
      "category_groups",
    ];

    await db.promise().query("SET FOREIGN_KEY_CHECKS = 0");
    console.log("Foreign key checks disabled.");

    for (const table of tablesToClear) {
      await db.promise().query(`TRUNCATE TABLE ${table}`);
      console.log(`Table ${table} cleared.`);
    }

    await db.promise().query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("Foreign key checks re-enabled.");

    console.log(
      "SUCCESS: Database cleansed. All transactional data, categories, and accounts have been removed. Users kept.",
    );
    process.exit(0);
  } catch (err) {
    console.error("ERROR during cleanse:", err);
    process.exit(1);
  }
}

cleanseDB();
