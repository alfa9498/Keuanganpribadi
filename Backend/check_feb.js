const db = require("./config/db");

async function checkFebData() {
  try {
    const month = "2026-02";

    // Check transactions
    const [txs] = await db
      .promise()
      .query(
        "SELECT user_id, COUNT(*) as count FROM transactions WHERE DATE_FORMAT(date, '%Y-%m') = ? GROUP BY user_id",
        [month],
      );
    console.log("Transacting Users in Feb 2026:", txs);

    // Check budgets
    const [budgets] = await db
      .promise()
      .query(
        "SELECT user_id, COUNT(*) as count FROM budgets WHERE month = ? GROUP BY user_id",
        [month],
      );
    console.log("Budgeting Users in Feb 2026:", budgets);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkFebData();
