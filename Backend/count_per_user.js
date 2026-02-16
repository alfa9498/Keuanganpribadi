const db = require("./config/db");

async function checkCounts() {
  try {
    const [txCounts] = await db
      .promise()
      .query(
        "SELECT user_id, COUNT(*) as count FROM transactions GROUP BY user_id",
      );
    console.log("Transactions Per User:", txCounts);

    const [budgetCounts] = await db
      .promise()
      .query("SELECT user_id, COUNT(*) as count FROM budgets GROUP BY user_id");
    console.log("Budgets Per User:", budgetCounts);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkCounts();
