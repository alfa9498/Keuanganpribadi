const db = require('./config/db');
const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, 'migrations', 'add_transfer_support.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

// Split multi-statement SQL but careful with ENUM strings. 
// For this simple case, we'll run the ALTER statements.
const statements = [
    "ALTER TABLE transactions MODIFY COLUMN type ENUM('income', 'expense', 'transfer') NOT NULL",
    "ALTER TABLE transactions ADD COLUMN to_account VARCHAR(100) DEFAULT NULL AFTER account"
];

const runMigrations = async () => {
    for (const statement of statements) {
        try {
            await new Promise((resolve, reject) => {
                db.query(statement, (err, result) => {
                    if (err) {
                        // Ignore if column already exists
                        if (err.errno === 1060) {
                            console.log(`⚠️ Column already exists, skipping: ${statement.substring(0, 30)}...`);
                            resolve();
                        } else {
                            reject(err);
                        }
                    } else {
                        console.log(`✅ Success: ${statement.substring(0, 50)}...`);
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.error("❌ Migration failed:", error.message);
        }
    }
    db.end();
};

runMigrations();
