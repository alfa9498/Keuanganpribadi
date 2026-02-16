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

async function checkSchema() {
  const tables = ["notifications", "category_groups", "password_resets"];

  try {
    connection.connect();
    const promiseConn = connection.promise();

    for (const table of tables) {
      const [cols] = await promiseConn.query(`DESCRIBE ${table}`);
      console.log(
        `Table '${table}' columns:`,
        cols.map((c) => c.Field),
      );
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
