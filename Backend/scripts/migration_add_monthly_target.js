require("dotenv").config(); // Load env vars from default location
const db = require("../config/db");

const migrate = async () => {
  try {
    console.log("Adding monthly_target to savings_goals...");
    // Check if column exists first to avoid error (optional, but good practice)
    // For simplicity in this environment, we'll try to add it.
    // If it fails because it exists, we catch it.

    await db.promise().query(`
      ALTER TABLE savings_goals
      ADD COLUMN monthly_target DECIMAL(15, 2) DEFAULT 0;
    `);

    console.log("✅ Migration success: monthly_target column added.");
    process.exit(0);
  } catch (error) {
    if (error.code === "ER_DUP_FIELDNAME") {
      console.log("ℹ️ Column monthly_target already exists.");
      process.exit(0);
    }
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

migrate();
