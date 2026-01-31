const db = require('./config/db');
const fs = require('fs');
const path = require('path');

const filename = process.argv[2];

if (!filename) {
    console.error("Please provide a SQL filename (relative to current dir)");
    process.exit(1);
}

const filePath = path.resolve(__dirname, filename);
const sql = fs.readFileSync(filePath, 'utf8');

const run = async () => {
    console.log(`Executing SQL from ${filename}...`);
    try {
        await db.promise().query(sql);
        console.log("✅ Migration successful!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
};

run();
