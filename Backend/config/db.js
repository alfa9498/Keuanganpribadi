require('dotenv').config();
const mysql = require("mysql2");

// koneksi pool config
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "myapp_db",
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : null,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// test koneksi
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database Connection Error:", err.message);
  } else {
    console.log(`✅ Connected to Database: ${process.env.DB_NAME || "myapp_db"} on ${process.env.DB_HOST || "localhost"}`);
    connection.release();
  }
});

module.exports = db;
