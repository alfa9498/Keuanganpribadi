const db = require('./config/db');
const fs = require('fs');
const path = require('path');

const migrationFile = 'migration_password_resets.sql';
const migrationPath = path.join(__dirname, migrationFile);

const runMigration = async () => {
    try {
        console.log(`Reading migration file: ${migrationPath}`);
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log("Executing SQL...");
        await new Promise((resolve, reject) => {
            db.query(sql, (err, result) => {
                if (err) return reject(err);
                console.log("✅ Migration Table 'password_resets' created/verified successfully.");
                resolve(result);
            });
        });
    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        db.end();
    }
};

runMigration();
