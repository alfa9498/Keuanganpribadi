const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const goalController = require('../controllers/goalController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware for all
router.use(authenticateToken);

// --- Budget Routes ---
router.get('/budgets', budgetController.getBudgets);
router.post('/budgets', budgetController.setBudget);

// --- Goal Routes ---
router.get('/goals', goalController.getGoals);
router.post('/goals', goalController.createGoal);
router.post('/goals/:id/funds', goalController.updateFunds); // Add/Withdraw
router.delete('/goals/:id', goalController.deleteGoal);

module.exports = router;
