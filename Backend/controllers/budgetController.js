const db = require("../config/db");

/**
 * Get budgets for a specific month (YYYY-MM)
 * Includes actual spending per category.
 */
exports.getMonthlyBudgets = async (req, res) => {
  const { user_id, month } = req.query;

  if (!user_id || !month) {
    return res.status(400).json({
      success: false,
      message: "user_id and month (YYYY-MM) are required",
    });
  }

  try {
    console.log(
      `[DEBUG] Fetching budgets for user: ${user_id}, month: ${month}`,
    );

    // Query to get categories with their budget amount for the month and actual spending from transactions
    // Rollover: Sum of (Budget - Spent) for all previous months if is_rollover is true
    const query = `
            SELECT 
                c.id as category_id,
                c.name as category_name,
                c.type as category_type,
                c.is_rollover,
                cg.name as group_name,
                COALESCE(b.amount, 0) as budget_amount,
                (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM transactions t
                    WHERE t.user_id = ? 
                      AND t.category = c.name
                      AND DATE_FORMAT(t.date, '%Y-%m') = ?
                      AND t.type = 'expense'
                ) as actual_spent,
                (
                    SELECT COALESCE(SUM(prev_b.amount), 0) - 
                           COALESCE((
                               SELECT SUM(t_inner.amount)
                               FROM transactions t_inner
                               WHERE t_inner.user_id = prev_b.user_id
                                 AND t_inner.category = c.name
                                 AND DATE_FORMAT(t_inner.date, '%Y-%m') < ?
                                 AND DATE_FORMAT(t_inner.date, '%Y-%m') IN (
                                     SELECT month FROM budgets WHERE user_id = prev_b.user_id AND category_id = c.id
                                 )
                           ), 0)
                    FROM budgets prev_b
                    WHERE prev_b.category_id = c.id 
                      AND prev_b.user_id = ? 
                      AND prev_b.month < ?
                      AND c.is_rollover = 1
                ) as rollover_balance
            FROM categories c
            LEFT JOIN category_groups cg ON c.group_id = cg.id
            LEFT JOIN budgets b ON c.id = b.category_id AND b.user_id = ? AND b.month = ?
            WHERE c.user_id = ? AND c.type = 'expense'
            ORDER BY cg.name, c.name;
        `;

    const [results] = await db.promise().execute(query, [
      user_id,
      month, // current spent
      month,
      user_id,
      month, // rollover (this is tricky, maybe simplify?)
      user_id,
      month, // current budget
      user_id, // categories filter
    ]);

    console.log(`[DEBUG] Found ${results.length} budget categories`);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("❌ Error in getMonthlyBudgets:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data anggaran bulan ini",
      error: error.message,
    });
  }
};

/**
 * Set or Update budget for a category
 */
exports.setBudget = async (req, res) => {
  const { user_id, category_id, amount, month } = req.body;

  if (!user_id || !category_id || amount === undefined || !month) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const query = `
            INSERT INTO budgets (user_id, category_id, amount, month)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE amount = VALUES(amount);
        `;

    await db.promise().execute(query, [user_id, category_id, amount, month]);

    res.status(200).json({
      success: true,
      message: "Budget updated successfully",
    });
  } catch (error) {
    console.error("Error setting budget:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
