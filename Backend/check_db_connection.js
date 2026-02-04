const mysql = require("mysql2");
require("dotenv").config();

console.log("Testing Database Connection...");
console.log("Host:", process.env.DB_HOST);
console.log("User:", process.env.DB_USER);
console.log("SSL:", process.env.DB_SSL);

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || 4000),
  ssl: {
    rejectUnauthorized: false,
  },
});

connection.connect((err) => {
  if (err) {
    console.error("❌ Connection Failed:", err.message);
    console.error("Error Code:", err.code);
  } else {
    console.log("✅ Connection Successful!");
    connection.end();
  }
});
