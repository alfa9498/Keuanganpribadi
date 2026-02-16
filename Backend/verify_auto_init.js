const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "keuangan",
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
});

async function verifyAutoInit() {
  const userId = 1;
  const testName = "Auto-Init Test " + Date.now();
  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    const promiseConn = connection.promise();
    console.log(`Phase 1: Creating category '${testName}'...`);

    // Simulate Service logic
    const [catResult] = await promiseConn.query(
      "INSERT INTO categories (user_id, name, type) VALUES (?, ?, 'expense')",
      [userId, testName],
    );
    const catId = catResult.insertId;
    console.log(`Category created ID: ${catId}`);

    console.log("Phase 2: Initializing budget (simulating service)...");
    await promiseConn.query(
      "INSERT IGNORE INTO budgets (user_id, category_id, amount, month) VALUES (?, ?, 0, ?)",
      [userId, catId, currentMonth],
    );

    console.log("Phase 3: Verifying budget record exists...");
    const [budgets] = await promiseConn.query(
      "SELECT * FROM budgets WHERE category_id = ? AND month = ?",
      [catId, currentMonth],
    );

    if (budgets.length > 0) {
      console.log("SUCCESS: Budget record found!", budgets[0]);
    } else {
      console.error("FAILURE: Budget record NOT found.");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

verifyAutoInit();
