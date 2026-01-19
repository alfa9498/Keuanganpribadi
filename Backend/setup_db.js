const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to MySQL Server');

    connection.query("CREATE DATABASE IF NOT EXISTS myapp_db", (err, result) => {
        if (err) {
            console.error("❌ Failed to create DB:", err.message);
        } else {
            console.log("✅ Database 'myapp_db' checked/created");
        }
        connection.end();
    });
});
