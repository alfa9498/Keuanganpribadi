const db = require('./config/db');

db.query("DESCRIBE transactions", (err, results) => {
    if (err) {
        console.error("Error describing table:", err);
    } else {
        results.forEach(row => {
            console.log(`${row.Field} | ${row.Type} | ${row.Null} | ${row.Key} | ${row.Default}`);
        });
    }
    db.end();
});
