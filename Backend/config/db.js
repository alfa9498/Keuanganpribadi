require('dotenv').config();
const mysql = require("mysql2");

// koneksi pool config
const db = mysql.createPool({
  host: (process.env.DB_HOST || "localhost").trim(),
  user: (process.env.DB_USER || "root").trim(),
  password: (process.env.DB_PASSWORD || "").trim(),
  database: (process.env.DB_NAME || "myapp_db").trim(),
  port: parseInt(process.env.DB_PORT || "3306"),
  ssl: process.env.DB_SSL === 'true' ? { 
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  } : null,
  waitForConnections: true,
  connectionLimit: 5, // Reduced for serverless
  queueLimit: 0,
  connectTimeout: 10000 // 10 seconds
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
