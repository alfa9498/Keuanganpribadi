const mysql = require('mysql2/promise');
require('dotenv').config();

async function syncCategories() {
    // Configuration for DEV and PROD
    // Assuming both are accessible via the same connection string logic but different DB names
    // For safety, we will use hardcoded names based on your screenshot
    
    const baseConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || "4000"),
        ssl: { rejectUnauthorized: false }
    };

    console.log("🚀 Starting Category Sync: dev -> prod...");

    let devConn, prodConn;
    try {
        devConn = await mysql.createConnection({ ...baseConfig, database: 'keuangan_dev' });
        prodConn = await mysql.createConnection({ ...baseConfig, database: 'keuangan' });

        console.log("✅ Both databases connected.");

        // 1. Fetch Groups from Dev
        const [groups] = await devConn.query("SELECT * FROM category_groups");
        console.log(`Found ${groups.length} category groups in Dev.`);

        // 2. Fetch Categories from Dev
        const [categories] = await devConn.query("SELECT * FROM categories");
        console.log(`Found ${categories.length} sub-categories in Dev.`);

        // 3. Sync Groups
        const groupIdMap = {}; // mapping old_id -> new_id
        for (const group of groups) {
            console.log(`Syncing group: ${group.name}...`);
            const [result] = await prodConn.query(
                "INSERT INTO category_groups (user_id, name, type, is_default, created_at) VALUES (?, ?, ?, ?, ?)",
                [group.user_id, group.name, group.type, group.is_default, group.created_at]
            );
            groupIdMap[group.id] = result.insertId;
        }

        // 4. Sync Categories (Sub-categories & Income)
        for (const cat of categories) {
            console.log(`Syncing category: ${cat.name}...`);
            const newGroupId = cat.group_id ? groupIdMap[cat.group_id] : null;
            await prodConn.query(
                "INSERT INTO categories (user_id, group_id, name, type, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                [cat.user_id, newGroupId, cat.name, cat.type, cat.is_default, cat.created_at]
            );
        }

        console.log("🎉 Category Sync COMPLETED successfully!");

    } catch (error) {
        console.error("❌ Sync Failed:", error);
    } finally {
        if (devConn) await devConn.end();
        if (prodConn) await prodConn.end();
    }
}

syncCategories();
