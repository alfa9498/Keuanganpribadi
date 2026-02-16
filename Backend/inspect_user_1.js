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

async function inspectData() {
  const userId = 1;
  try {
    const promiseConn = connection.promise();

    const [cats] = await promiseConn.query(
      "SELECT c.id, c.name, c.type, cg.name as group_name FROM categories c LEFT JOIN category_groups cg ON c.group_id = cg.id WHERE c.user_id = ?",
      [userId],
    );
    console.log("Categories for User 1:", JSON.stringify(cats, null, 2));

    const [groups] = await promiseConn.query(
      "SELECT * FROM category_groups WHERE user_id = ?",
      [userId],
    );
    console.log("Groups for User 1:", JSON.stringify(groups, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectData();
