const mysql = require('mysql2/promise');
require('dotenv').config();

async function deduplicate() {
    const config = {
        host: (process.env.DB_HOST || "localhost").trim(),
        user: (process.env.DB_USER || "root").trim(),
        password: (process.env.DB_PASSWORD || "").trim(),
        database: (process.env.DB_NAME || "myapp_db").trim(),
        port: parseInt(process.env.DB_PORT || "4000"),
        ssl: process.env.DB_SSL === 'true' ? { 
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
        } : null,
        connectTimeout: 30000
    };

    console.log("Connecting to:", config.host, "database:", config.database);
    const db = await mysql.createConnection(config);

    try {
        console.log("Starting De-duplication process...");

        // 1. DEDUPLICATE CATEGORY GROUPS
        const [duplicateGroups] = await db.query(`
            SELECT name, user_id, type, MIN(id) as survivor_id, GROUP_CONCAT(id) as all_ids, COUNT(*) as count
            FROM category_groups
            GROUP BY name, user_id, type
            HAVING count > 1
        `);

        console.log(`Found ${duplicateGroups.length} sets of duplicate groups.`);

        for (const group of duplicateGroups) {
            const allIds = group.all_ids.split(',');
            const survivorId = group.survivor_id;
            const duplicateIds = allIds.filter(id => id != survivorId);

            console.log(`Processing Group: "${group.name}" | Survivor: ${survivorId} | Deleting: ${duplicateIds.join(', ')}`);

            // Update sub-categories to point to survivor group
            await db.query(
                'UPDATE categories SET group_id = ? WHERE group_id IN (?)',
                [survivorId, duplicateIds]
            );

            // Delete duplicate groups
            await db.query(
                'DELETE FROM category_groups WHERE id IN (?)',
                [duplicateIds]
            );
        }

        // 2. DEDUPLICATE CATEGORIES
        const [duplicateCategories] = await db.query(`
            SELECT name, user_id, group_id, type, MIN(id) as survivor_id, GROUP_CONCAT(id) as all_ids, COUNT(*) as count
            FROM categories
            GROUP BY name, user_id, group_id, type
            HAVING count > 1
        `);

        console.log(`Found ${duplicateCategories.length} sets of duplicate categories.`);

        for (const cat of duplicateCategories) {
            const allIds = cat.all_ids.split(',');
            const survivorId = cat.survivor_id;
            const duplicateIds = allIds.filter(id => id != survivorId);

            console.log(`Processing Category: "${cat.name}" | Survivor: ${survivorId} | Deleting: ${duplicateIds.join(', ')}`);

            // Check if we need to update transactions? 
            // The transactions table usually stores category NAME, not ID. 
            // So we don't necessarily NEED to update transactions if the name is the same.
            // But if there's any reference by ID (not common in this app), update it here.

            // Delete duplicate categories
            await db.query(
                'DELETE FROM categories WHERE id IN (?)',
                [duplicateIds]
            );
        }

        console.log("✅ De-duplication completed successfully!");

    } catch (error) {
        console.error("❌ Error during de-duplication:", error);
    } finally {
        await db.end();
    }
}

deduplicate();
