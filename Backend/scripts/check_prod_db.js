require('dotenv').config();
const mysql = require("mysql2");

const dbConfig = {
  host: (process.env.DB_HOST || "localhost").trim(),
  user: (process.env.DB_USER || "root").trim(),
  password: (process.env.DB_PASSWORD || "").trim(),
  database: (process.env.DB_NAME || "myapp_db").trim(),
  port: parseInt(process.env.DB_PORT || "3306"),
  ssl: process.env.DB_SSL === 'true' ? { 
    rejectUnauthorized: false
  } : null,
};

console.log("🔍 Checking Database Connection...");
console.log(`Config: host=${dbConfig.host}, user=${dbConfig.user}, database=${dbConfig.database}, port=${dbConfig.port}`);

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected successfully!");

  // Check tables
  connection.query("SHOW TABLES", (err, tables) => {
    if (err) {
      console.error("❌ Failed to show tables:", err.message);
    } else {
      console.log("📋 Tables in database:");
      console.table(tables);
    }

    // Check users table structure
    connection.query("DESCRIBE users", (err, structure) => {
      if (err) {
        console.error("❌ Failed to describe 'users' table:", err.message);
      } else {
        console.log("👤 'users' table structure:");
        console.table(structure);
        
        // Check if any users exist
        connection.query("SELECT count(*) as count FROM users", (err, result) => {
            if (err) console.error("❌ Failed to count users:", err.message);
            else console.log(`📊 Total users: ${result[0].count}`);
            
            connection.end();
            process.exit(0);
        });
      }
    });
  });
});
