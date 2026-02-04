const categoryService = require("../services/categoryService");

exports.getCategories = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseStructure = await categoryService.getExpenseStructure(userId);
    const incomeList = await categoryService.getIncomeList(userId);

    res.json({
      expense: expenseStructure,
      income: incomeList,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);
    res.status(500).json({
      message: "Failed to fetch categories",
      error: error.message,
      stack: error.stack,
    });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await categoryService.createGroup(userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.id;
    const result = await categoryService.updateGroup(userId, groupId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.id;
    await categoryService.deleteGroup(userId, groupId);
    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await categoryService.createCategory(userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const categoryId = req.params.id;
    const result = await categoryService.updateCategory(
      userId,
      categoryId,
      req.body,
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const categoryId = req.params.id;
    await categoryService.deleteCategory(userId, categoryId);
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateRolloverStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const categoryId = req.params.id;
    const { is_rollover } = req.body;
    const result = await categoryService.updateRolloverStatus(
      userId,
      categoryId,
      is_rollover,
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
