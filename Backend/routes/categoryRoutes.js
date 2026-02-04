const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { authenticateToken } = require("../middleware/authMiddleware"); // Assuming this exists

// Apply auth middleware to all routes
router.use(authenticateToken);

// GET full structure
router.get("/", categoryController.getCategories);

// Groups (Main Categories)
router.post("/groups", categoryController.createGroup);
router.put("/groups/:id", categoryController.updateGroup);
router.delete("/groups/:id", categoryController.deleteGroup);

// Categories (Sub Categories / Items)
router.post("/items", categoryController.createCategory);
router.put("/items/:id", categoryController.updateCategory);
router.delete("/items/:id", categoryController.deleteCategory);

module.exports = router;
