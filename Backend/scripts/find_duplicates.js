const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDuplicates() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 4000,
        ssl: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true
        }
    });

    console.log("--- DUPLICATE CATEGORY GROUPS ---");
    const [groups] = await db.query(`
        SELECT name, user_id, type, COUNT(*) as count, GROUP_CONCAT(id) as ids
        FROM category_groups
        GROUP BY name, user_id, type
        HAVING count > 1
    `);
    console.table(groups);

    console.log("\n--- DUPLICATE CATEGORIES ---");
    const [categories] = await db.query(`
        SELECT name, user_id, group_id, type, COUNT(*) as count, GROUP_CONCAT(id) as ids
        FROM categories
        GROUP BY name, user_id, group_id, type
        HAVING count > 1
    `);
    console.table(categories);

    await db.end();
}

checkDuplicates().catch(console.error);
