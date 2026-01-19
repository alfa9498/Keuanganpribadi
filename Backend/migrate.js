const fs = require('fs');
const path = require('path');
const db = require('./config/db');

const schemaPath = path.join(__dirname, 'schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

// Split queries by semicolon (simple split, might need robust parsing for complex SQL)
const queries = sql.split(';').filter(q => q.trim().length > 0);

console.log(`Found ${queries.length} queries to execute.`);

const executeQueries = async () => {
    for (const query of queries) {
        await new Promise((resolve, reject) => {
            db.query(query, (err, result) => {
                if (err) {
                    console.error('❌ Query Failed:', err.message);
                    // Don't reject, just log error and continue (e.g. if table exists)
                    resolve();
                } else {
                    console.log('✅ Query Executed');
                    resolve();
                }
            });
        });
    }
    console.log('🎉 Migration completed.');
    process.exit(0);
};

executeQueries();
