require("dotenv").config();
const db = require("../config/db");

async function checkTables() {
  try {
    const [tables] = await db.promise().query("SHOW TABLES");
    console.log(
      "Existing Tables:",
      tables.map((t) => Object.values(t)[0]),
    );

    const [budgets] = await db.promise().query("DESCRIBE budgets");
    console.log(
      "Budgets Table Schema:",
      budgets.map((c) => c.Field),
    );

    const [goals] = await db.promise().query("DESCRIBE savings_goals");
    console.log(
      "Goals Table Schema:",
      goals.map((c) => c.Field),
    );
  } catch (error) {
    console.error("Error checking tables:", error.message);
  } finally {
    process.exit();
  }
}

checkTables();
