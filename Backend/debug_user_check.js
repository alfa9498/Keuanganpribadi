const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || "4000"),
    ssl: { rejectUnauthorized: false }
};

async function checkData() {
    let conn;
    try {
        conn = await mysql.createConnection(config);
        console.log("Connected to TiDB");

        // 1. Get all users
        const [users] = await conn.query("SELECT id, email, full_name FROM users");
        console.table(users);

        // 2. Count transactions by user_id
        const [txCounts] = await conn.query("SELECT user_id, COUNT(*) as count FROM transactions GROUP BY user_id");
        console.table(txCounts);

        // 3. Check for transactions with non-existent users
        const userIds = users.map(u => u.id);
        const [orphans] = await conn.query("SELECT COUNT(*) as count FROM transactions WHERE user_id NOT IN (?)", [userIds.length > 0 ? userIds : [-1]]);
        console.log("Orphaned Transactions (invalid user_id):", orphans[0].count);

        if (orphans[0].count > 0) {
            const [orphanSamples] = await conn.query("SELECT id, user_id, description FROM transactions WHERE user_id NOT IN (?) LIMIT 5", [userIds]);
            console.log("Sample Orphans:", orphanSamples);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (conn) conn.end();
    }
}

checkData();
