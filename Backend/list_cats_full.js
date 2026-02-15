const db = require("./config/db");

async function listAllCategories() {
  try {
    const [users] = await db.promise().query("SELECT id FROM users");
    for (const user of users) {
      const [cats] = await db
        .promise()
        .query("SELECT id, name, type FROM categories WHERE user_id = ?", [
          user.id,
        ]);
      console.log(`User ${user.id} categories:`, JSON.stringify(cats, null, 2));
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listAllCategories();
