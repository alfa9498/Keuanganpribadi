const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || "4000"),
    ssl: {
        rejectUnauthorized: false
    }
};

async function migrate() {
    console.log('🚀 Starting Category System Migration...');
    try {
        const connection = await mysql.createConnection(dbConfig);
        const sqlFile = path.join(__dirname, '..', 'migrations', 'migration_category_system.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Split by semicolon but ignore ones inside procedures or quotes if any
        // For this simple file, splitting by ; is okay.
        const queries = sql.split(';').map(q => q.trim()).filter(q => q.length > 0);

        for (let query of queries) {
            console.log(`Executing: ${query.substring(0, 50)}...`);
            await connection.query(query);
        }

        console.log('✅ Migration COMPLETED successfully!');
        await connection.end();
    } catch (error) {
        console.error('❌ Migration FAILED:', error.message);
        process.exit(1);
    }
}

migrate();
