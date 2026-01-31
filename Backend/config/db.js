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
  connectionLimit: 10, // Increased for better concurrency
  queueLimit: 0,
  connectTimeout: 20000, // 20 seconds for TiDB Cloud
  acquireTimeout: 20000, // 20 seconds to acquire connection from pool
  timeout: 20000, // Query timeout
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
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
