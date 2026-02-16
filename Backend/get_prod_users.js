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

connection.connect((err) => {
  if (err) process.exit(1);
  connection.query("SELECT id, email FROM users", (err, results) => {
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  });
});
