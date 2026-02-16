const db = require("./config/db");

async function listUsers() {
  try {
    const [users] = await db
      .promise()
      .query("SELECT id, email, full_name FROM users");
    console.log("All Users:", JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listUsers();
