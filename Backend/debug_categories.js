const mysql = require("mysql2");
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "myapp_db",
    port: 3306
});

db.query("SELECT DISTINCT category FROM transactions", (err, results) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
});
