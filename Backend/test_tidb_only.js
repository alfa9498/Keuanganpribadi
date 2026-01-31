const mysql = require('mysql2/promise');
require('dotenv').config();

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

async function test() {
    console.log('Testing connection to TiDB...');
    try {
        const conn = await mysql.createConnection(targetConfig);
        console.log('✅ Connected successfully!');
        const [rows] = await conn.query('SELECT 1 as val');
        console.log('Query result:', rows);
        await conn.end();
    } catch (e) {
        console.error('❌ Connection failed:', e.message);
        console.error('Code:', e.code);
        console.error('Syscall:', e.syscall);
        console.error('Address:', e.address);
        console.error('Port:', e.port);
    }
}
test();
