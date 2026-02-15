const db = require("./config/db");

async function seedCompleteJan() {
  try {
    const month = "2026-01";
    const [users] = await db.promise().query("SELECT id FROM users");

    for (const user of users) {
      const userId = user.id;
      console.log(`Seeding user ${userId}...`);

      const [categories] = await db
        .promise()
        .query("SELECT id, name, type FROM categories WHERE user_id = ?", [
          userId,
        ]);
      if (categories.length === 0) continue;

      // 1. Seed ALL Budgets
      const budgetsToInsert = categories.map((cat) => {
        // Randomish but realistic budget amounts
        let amount = 0;
        if (cat.type === "income") {
          if (cat.name.toLowerCase().includes("gaji")) amount = 15000000;
          else if (cat.name.toLowerCase().includes("saldo")) amount = 5000000;
          else amount = 1000000;
        } else {
          if (cat.name.toLowerCase().includes("makan")) amount = 3000000;
          else if (cat.name.toLowerCase().includes("belanja")) amount = 2000000;
          else if (
            cat.name.toLowerCase().includes("kontrakan") ||
            cat.name.toLowerCase().includes("kos")
          )
            amount = 1500000;
          else if (cat.name.toLowerCase().includes("listrik")) amount = 500000;
          else amount = 200000;
        }
        return [userId, cat.id, amount, month];
      });

      await db
        .promise()
        .query(
          "INSERT INTO budgets (user_id, category_id, amount, month) VALUES ? ON DUPLICATE KEY UPDATE amount = VALUES(amount)",
          [budgetsToInsert],
        );

      // 2. Seed Transactions (Actuals) for roughly 70-80% of categories to make it realistic
      const transactionsToInsert = [];
      categories.forEach((cat) => {
        // 80% chance to have a transaction
        if (Math.random() > 0.2) {
          let amount = 0;
          if (cat.type === "income") {
            if (cat.name.toLowerCase().includes("gaji")) amount = 15000000;
            else if (cat.name.toLowerCase().includes("saldo")) amount = 5000000;
            else amount = Math.floor(Math.random() * 500000) + 100000;
          } else {
            // Expense: random between 20% to 110% of budget
            const budgetVal = budgetsToInsert.find((b) => b[1] === cat.id)[2];
            amount = Math.floor(budgetVal * (Math.random() * 0.9 + 0.2));
          }

          // Add 1-2 transactions per category
          const date = `2026-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`;
          transactionsToInsert.push([
            userId,
            date,
            cat.type,
            cat.name,
            amount,
            `Sample: ${cat.name}`,
          ]);

          if (Math.random() > 0.7) {
            const date2 = `2026-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`;
            transactionsToInsert.push([
              userId,
              date2,
              cat.type,
              cat.name,
              Math.floor(amount * 0.2),
              `Extra: ${cat.name}`,
            ]);
          }
        }
      });

      if (transactionsToInsert.length > 0) {
        // Clear old sample txs
        await db
          .promise()
          .query(
            "DELETE FROM transactions WHERE user_id = ? AND date BETWEEN '2026-01-01' AND '2026-01-31' AND (description LIKE 'Sample%' OR description LIKE 'Extra%')",
            [userId],
          );

        await db
          .promise()
          .query(
            "INSERT INTO transactions (user_id, date, type, category, amount, description) VALUES ?",
            [transactionsToInsert],
          );
      }
    }

    console.log(
      "SUCCESS: Every category for every user has been seeded for 2026-01.",
    );
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedCompleteJan();
