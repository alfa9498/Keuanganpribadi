const db = require("../config/db");

async function diagnose() {
    console.log("--- DB DIAGNOSTIC ---");
    try {
        // Check current database
        const [dbRows] = await db.promise().query("SELECT DATABASE() as db_name");
        console.log("Connected to Database:", dbRows[0].db_name);

        // Check Test User specificaaly
        const [testUserRows] = await db.promise().query("SELECT id, email, full_name FROM users WHERE full_name LIKE '%Test%'");
        console.log("Users matching 'Test':");
        testUserRows.forEach(u => console.log(`- ID: ${u.id}, Email: ${u.email}, Name: ${u.full_name}`));

        // Check categories for first user
        if (userRows.length > 0) {
            const firstId = userRows[0].id;
            const [catRows] = await db.promise().query("SELECT * FROM categories WHERE user_id = ?", [firstId]);
            console.log(`Categories for User ${firstId}:`, catRows.length);
            catRows.slice(0, 3).forEach(c => console.log(`  - ${c.name} (${c.type})`));
        }

    } catch (error) {
        console.error("DIAGNOSTIC ERROR:", error.message);
    } finally {
        process.exit(0);
    }
}

diagnose();
