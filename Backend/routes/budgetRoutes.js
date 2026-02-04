const express = require("express");
const router = express.Router();
const budgetController = require("../controllers/budgetController");

// Get budgets for a month
router.get("/", budgetController.getMonthlyBudgets);

// Set/Update a budget
router.post("/", budgetController.setBudget);

module.exports = router;
