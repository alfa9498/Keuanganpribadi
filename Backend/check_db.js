const db = require("./config/db");

db.query("DESCRIBE accounts", (err, results) => {
  if (err) {
    console.error("❌ Error describing accounts table:", err.message);
    if (err.code === "ER_NO_SUCH_TABLE") {
      console.log("⚠️ Table 'accounts' does not exist!");
    }
  } else {
    console.log("✅ Table 'accounts' structure:");
    console.table(results);
  }

  db.query("SELECT * FROM accounts", (err, results) => {
    if (err) {
      console.error("❌ Error selecting from accounts table:", err.message);
    } else {
      console.log(`✅ Table 'accounts' has ${results.length} rows.`);
      console.table(results);
    }
    process.exit();
  });
});
