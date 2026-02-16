const db = require("./config/db");

async function resetFeb() {
  try {
    const month = "2026-02";
    console.log(`Resetting data for ${month}...`);

    // 1. Delete all transactions in February 2026
    const [txResult] = await db
      .promise()
      .query(
        "DELETE FROM transactions WHERE date >= '2026-02-01' AND date <= '2026-02-28'",
      );
    console.log(`Deleted ${txResult.affectedRows} transactions.`);

    // 2. Delete all budgets for February 2026
    const [budgetResult] = await db
      .promise()
      .query("DELETE FROM budgets WHERE month = ?", [month]);
    console.log(`Deleted ${budgetResult.affectedRows} budgets.`);

    console.log("SUCCESS: February 2026 data has been completely reset.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetFeb();
