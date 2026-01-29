require('dotenv').config();
const db = require('./config/db');

const migrationQuery = `
  ALTER TABLE transactions 
  ADD COLUMN to_account VARCHAR(50) DEFAULT NULL AFTER account;
`;

console.log("🚀 Starting migration: Adding to_account column...");

db.query(migrationQuery, (err, result) => {
  if (err) {
    // If error is "Duplicate column name", it's fine
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("⚠️ Column to_account already exists.");
    } else {
      console.error("❌ Migration Failed:", err);
    }
  } else {
    console.log("✅ Migration Success: Column to_account added.");
    console.log(result);
  }
  process.exit();
});
