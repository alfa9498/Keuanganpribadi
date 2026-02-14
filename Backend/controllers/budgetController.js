const db = require("../config/db");

// Get budgets for a specific month (default: current month)
// Returns: List of categories with their budget limit AND current spending
exports.getBudgets = async (req, res) => {
  try {
    const userId = req.user.id;
    const month = req.query.month || new Date().toISOString().slice(0, 7); // YYYY-MM

    // 1. Get all expense categories with their group name
    const [categories] = await db.promise().query(
      `SELECT c.id, c.name, cg.name as group_name 
       FROM categories c
       LEFT JOIN category_groups cg ON c.group_id = cg.id
       WHERE c.user_id = ? AND c.type = 'expense'`,
      [userId],
    );

    // 2. Get budgets for this month
    const [budgets] = await db
      .promise()
      .query(
        "SELECT category_id, amount FROM budgets WHERE user_id = ? AND month = ?",
        [userId, month],
      );

    // 3. Get actual spending for this month grouped by category
    const [spending] = await db.promise().query(
      `
            SELECT category, SUM(amount) as total_spent 
            FROM transactions 
            WHERE user_id = ? 
            AND type = 'expense' 
            AND DATE_FORMAT(date, '%Y-%m') = ?
            GROUP BY category
        `,
      [userId, month],
    );
    // 4. Merge data
    const budgetMap = new Map(
      budgets.map((b) => [b.category_id, parseFloat(b.amount)]),
    );
    const spendingMap = new Map(
      spending.map((s) => [s.category, parseFloat(s.total_spent)]),
    );

    const result = categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      groupName: cat.group_name || "Uncategorized",
      budgetLimit: budgetMap.get(cat.id) || 0,
      currentSpent: spendingMap.get(cat.name) || 0, // Matching by name is risky if names change, but schema uses name in transactions. ideally transactions should use category_id.
      // Note: In this system transactions store category NAME, but budgets store ID.
      // We need to match properly.
    }));

    res.json({ status: "success", data: result, month });
  } catch (error) {
    console.error("Get Budgets Error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Set or Update Budget for a Category
exports.setBudget = async (req, res) => {
  try {
    const userId = req.user.id;
    const { categoryId, amount, month } = req.body;

    if (!categoryId || amount === undefined || !month) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing required fields" });
    }

    // Upsert budget
    await db.promise().query(
      `
            INSERT INTO budgets (user_id, category_id, amount, month)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE amount = VALUES(amount)
        `,
      [userId, categoryId, amount, month],
    );

    res.json({ status: "success", message: "Budget updated successfully" });
  } catch (error) {
    console.error("Set Budget Error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Delete Budget for a Category
exports.deleteBudget = async (req, res) => {
  try {
    const userId = req.user.id;
    const { categoryId, month } = req.query; // Use query params for DELETE

    if (!categoryId || !month) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing required fields" });
    }

    await db
      .promise()
      .query(
        "DELETE FROM budgets WHERE user_id = ? AND category_id = ? AND month = ?",
        [userId, categoryId, month],
      );

    res.json({ status: "success", message: "Budget deleted successfully" });
  } catch (error) {
    console.error("Delete Budget Error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};
