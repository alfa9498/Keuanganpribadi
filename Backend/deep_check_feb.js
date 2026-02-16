const db = require("./config/db");

async function deepCheck() {
  try {
    const [txs] = await db
      .promise()
      .query(
        "SELECT user_id, date, type, category, amount, description FROM transactions WHERE date >= '2026-02-01' AND date <= '2026-02-28'",
      );
    console.log("Found Transactions:", JSON.stringify(txs, null, 2));

    const [budgets] = await db
      .promise()
      .query(
        "SELECT b.*, c.name as cat_name FROM budgets b JOIN categories c ON b.category_id = c.id WHERE b.month = '2026-02'",
      );
    console.log("Found Budgets:", JSON.stringify(budgets, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

deepCheck();
