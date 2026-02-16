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

async function testSync() {
  const userId = 1; // test@example.com
  const newCatName = "Test Category " + Date.now();

  try {
    const promiseConn = connection.promise();
    console.log(`Creating category: ${newCatName}...`);

    // 1. Create Category
    const [catResult] = await promiseConn.query(
      "INSERT INTO categories (user_id, name, type) VALUES (?, ?, 'expense')",
      [userId, newCatName],
    );
    const catId = catResult.insertId;
    console.log(`Category created with ID: ${catId}`);

    // 2. Simulate getBudgets logic
    const month = "2026-02";
    const [categories] = await promiseConn.query(
      `SELECT c.id, c.name, cg.name as group_name 
       FROM categories c
       LEFT JOIN category_groups cg ON c.group_id = cg.id
       WHERE c.user_id = ? AND c.type = 'expense'`,
      [userId],
    );

    const [budgets] = await promiseConn.query(
      "SELECT category_id, amount FROM budgets WHERE user_id = ? AND month = ?",
      [userId, month],
    );

    const budgetMap = new Map(
      budgets.map((b) => [b.category_id, parseFloat(b.amount)]),
    );

    const result = categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      groupName: cat.group_name || "Uncategorized",
      budgetLimit: budgetMap.get(cat.id) || 0,
    }));

    const found = result.find((r) => r.categoryId === catId);
    if (found) {
      console.log("SUCCESS: Category found in planning logic:", found);
    } else {
      console.log("FAILURE: Category NOT found in planning logic.");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testSync();
