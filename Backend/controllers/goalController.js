const db = require('../config/db');

// Get all goals
exports.getGoals = async (req, res) => {
    try {
        const userId = req.user.id;
        const [goals] = await db.promise().query(
            "SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC", 
            [userId]
        );        res.json({ status: 'success', data: goals });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Create new Goal
exports.createGoal = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, target_amount, deadline, icon, color } = req.body;

        const [result] = await db.promise().query(
            "INSERT INTO savings_goals (user_id, name, target_amount, deadline, icon, color) VALUES (?, ?, ?, ?, ?, ?)",
            [userId, name, target_amount, deadline, icon || 'PiggyBank', color || 'bg-blue-500']
        );
        res.json({ status: 'success', data: { id: result.insertId, ...req.body } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Add Funds (Deposit) or Withdraw
exports.updateFunds = async (req, res) => {
    try {
        const userId = req.user.id;
        const goalId = req.params.id;
        const { amount, type, notes } = req.body; // type: 'deposit' or 'withdraw'

        if (!amount || amount <= 0) {
            return res.status(400).json({ status: 'error', message: 'Invalid amount' });
        }

        // 1. Verify goal ownership
        const [goals] = await db.promise().query("SELECT * FROM savings_goals WHERE id = ? AND user_id = ?", [goalId, userId]);
        if (goals.length === 0) return res.status(404).json({ status: 'error', message: 'Goal not found' });
        
        const goal = goals[0];
        let newAmount = parseFloat(goal.current_amount);

        if (type === 'deposit') {
            newAmount += parseFloat(amount);
        } else if (type === 'withdraw') {
             if (newAmount < amount) return res.status(400).json({ status: 'error', message: 'Insufficient funds' });
            newAmount -= parseFloat(amount);
        } else {
            return res.status(400).json({ status: 'error', message: 'Invalid transaction type' });
        }

        // 2. Update Goal
        await db.promise().query("UPDATE savings_goals SET current_amount = ? WHERE id = ?", [newAmount, goalId]);

        // 3. Log Goal Transaction
        await db.promise().query(
            "INSERT INTO goal_transactions (goal_id, amount, type, notes) VALUES (?, ?, ?, ?)",
            [goalId, amount, type, notes]
        );
        res.json({ status: 'success', message: 'Funds updated', new_amount: newAmount });

    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Delete Goal
exports.deleteGoal = async (req, res) => {
    try {
        const userId = req.user.id;
        const goalId = req.params.id;
        
        await db.promise().query("DELETE FROM savings_goals WHERE id = ? AND user_id = ?", [goalId, userId]);
        
        res.json({ status: 'success', message: 'Goal deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
