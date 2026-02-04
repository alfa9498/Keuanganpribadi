const db = require("../config/db");

// --- HELPER FUNCTIONS ---

const getGroups = async (userId, type) => {
  let query = "SELECT * FROM category_groups WHERE user_id = ?";
  const params = [userId];

  if (type) {
    query += " AND type = ?";
    params.push(type);
  }

  query += " ORDER BY id ASC"; // Or by specific order field if added later

  const [rows] = await db.promise().query(query, params);
  return rows;
};

const getCategories = async (userId, type) => {
  let query = `
        SELECT c.*, cg.name as group_name 
        FROM categories c
        LEFT JOIN category_groups cg ON c.group_id = cg.id
        WHERE c.user_id = ?
    `;
  const params = [userId];

  if (type) {
    query += " AND c.type = ?";
    params.push(type);
  }

  query += " ORDER BY cg.id ASC, c.id ASC";

  const [rows] = await db.promise().query(query, params);
  return rows;
};

// --- SERVICE METHODS ---

exports.getAllData = async (userId) => {
  // Returns full structure: Groups and Categories mostly for initialization
  const groups = await getGroups(userId);
  const categories = await getCategories(userId);

  return { groups, categories };
};

exports.getExpenseStructure = async (userId) => {
  // Returns nested structure for Expense UI
  const groups = await getGroups(userId, "expense");
  const categories = await getCategories(userId, "expense");

  // Map categories to their groups
  const structure = groups.map((group) => ({
    ...group,
    subCategories: categories.filter((c) => c.group_id === group.id),
  }));

  return structure;
};

exports.getIncomeList = async (userId) => {
  // Income is flat list
  return await getCategories(userId, "income");
};

exports.createGroup = async (userId, data) => {
  const { name, type } = data;
  const [result] = await db
    .promise()
    .query(
      "INSERT INTO category_groups (user_id, name, type) VALUES (?, ?, ?)",
      [userId, name, type],
    );
  return { id: result.insertId, user_id: userId, name, type };
};

exports.updateGroup = async (userId, groupId, data) => {
  const { name } = data;
  const [result] = await db
    .promise()
    .query("UPDATE category_groups SET name = ? WHERE id = ? AND user_id = ?", [
      name,
      groupId,
      userId,
    ]);

  if (result.affectedRows === 0) {
    throw new Error("Update failed: Group not found or permission denied.");
  }

  return { id: groupId, name };
};

exports.deleteGroup = async (userId, groupId) => {
  // Cascade delete handles sub-categories, but logic in DB
  // Ideally check if transactions use this group's categories?
  // For now simple delete.
  await db
    .promise()
    .query("DELETE FROM category_groups WHERE id = ? AND user_id = ?", [
      groupId,
      userId,
    ]);
  return true;
};

exports.createCategory = async (userId, data) => {
  const { name, type, group_id } = data;
  const [result] = await db
    .promise()
    .query(
      "INSERT INTO categories (user_id, name, type, group_id) VALUES (?, ?, ?, ?)",
      [userId, name, type, group_id || null],
    );
  return { id: result.insertId, user_id: userId, name, type, group_id };
};

exports.updateCategory = async (userId, categoryId, data) => {
  const { name, group_id } = data;
  const [result] = await db
    .promise()
    .query(
      "UPDATE categories SET name = ?, group_id = ? WHERE id = ? AND user_id = ?",
      [name, group_id || null, categoryId, userId],
    );

  if (result.affectedRows === 0) {
    throw new Error("Update failed: Category not found or permission denied.");
  }

  return { id: categoryId, name, group_id };
};

exports.deleteCategory = async (userId, categoryId) => {
  // Check usage in transactions first!
  const [cat] = await db
    .promise()
    .query("SELECT name FROM categories WHERE id = ?", [categoryId]);
  if (cat.length > 0) {
    const catName = cat[0].name;
    // Check transaction usage
    // Note: transactions table stores category NAME, so we match by name
    const [usage] = await db
      .promise()
      .query(
        "SELECT COUNT(*) as count FROM transactions WHERE category = ? AND user_id = ?",
        [catName, userId],
      );

    if (usage[0].count > 0) {
      throw new Error(
        `Cannot delete category "${catName}" because it is used in ${usage[0].count} transactions.`,
      );
    }
  }

  await db
    .promise()
    .query("DELETE FROM categories WHERE id = ? AND user_id = ?", [
      categoryId,
      userId,
    ]);
  return true;
};

exports.updateRolloverStatus = async (userId, categoryId, isRollover) => {
  const [result] = await db
    .promise()
    .query(
      "UPDATE categories SET is_rollover = ? WHERE id = ? AND user_id = ?",
      [isRollover ? 1 : 0, categoryId, userId],
    );

  if (result.affectedRows === 0) {
    throw new Error("Update failed: Category not found or permission denied.");
  }

  return { id: categoryId, is_rollover: !!isRollover };
};
