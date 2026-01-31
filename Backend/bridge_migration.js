const mysql = require('mysql2/promise');
require('dotenv').config();

// SOURCE: Local MySQL (myapp_db)
const sourceConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'myapp_db'
};

// TARGET: TiDB Cloud (from .env)
const targetConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || "4000"),
    ssl: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
    }
};

async function migrate() {
    console.log('🚀 Starting Data Migration: Local -> TiDB');
    
    let sourceConn, targetConn;
    
    try {
        sourceConn = await mysql.createConnection(sourceConfig);
        console.log('✅ Connected to SOURCE (Local)');
        
        targetConn = await mysql.createConnection(targetConfig);
        console.log('✅ Connected to TARGET (TiDB)');

        // 1. Migrate USERS
        console.log('👥 Migrating Users...');
        const [users] = await sourceConn.query('SELECT * FROM users');
        console.log(`Found ${users.length} users.`);
        
        for (const user of users) {
             await targetConn.query(
                'INSERT INTO users (id, full_name, email, phone, password, gender, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE full_name=VALUES(full_name)',
                [user.id, user.full_name, user.email, user.phone, user.password, user.gender || 'male', user.created_at]
            );
        }
        console.log('✅ Users migrated.');

        // 2. Migrate TRANSACTIONS
        console.log('💰 Migrating Transactions...');
        const [txs] = await sourceConn.query('SELECT * FROM transactions');
        console.log(`Found ${txs.length} transactions.`);
        
        for (const tx of txs) {
            await targetConn.query(
                'INSERT INTO transactions (id, user_id, date, type, category, amount, description, payment_method, account, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount=VALUES(amount)',
                [tx.id, tx.user_id, tx.date, tx.type, tx.category, tx.amount, tx.description, tx.payment_method || 'Cash', tx.account || 'Main', tx.status || 'done', tx.created_at]
            );
        }
        console.log('✅ Transactions migrated.');

        console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');

    } catch (error) {
        console.error('❌ Migration Failed:', error.message);
    } finally {
        if (sourceConn) await sourceConn.end();
        if (targetConn) await targetConn.end();
    }
}

migrate();
