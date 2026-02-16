const db = require("./config/db");

async function findUser() {
  try {
    const email = "test@example.com";
    const [users] = await db
      .promise()
      .query("SELECT id, email, full_name FROM users WHERE email = ?", [email]);
    console.log("User found:", JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findUser();
