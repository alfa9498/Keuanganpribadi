const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "keuangan", // Target production DB
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : null,
});

connection.connect((err) => {
  if (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }
  console.log("Connected to 'keuangan' database.");

  connection.query("SELECT id, email, full_name FROM users", (err, results) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log("Users in 'keuangan':", JSON.stringify(results, null, 2));

    // Check data for ID 1 and 30001
    connection.query(
      "SELECT user_id, COUNT(*) as count FROM transactions GROUP BY user_id",
      (err, txs) => {
        console.log("Transactions per user in 'keuangan':", txs);
        process.exit(0);
      },
    );
  });
});
