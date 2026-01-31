const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'myapp_db'
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to local MySQL:', err.message);
        process.exit(1);
    }
    
    console.log('✅ Connected to local myapp_db');
    
    const tables = ['users', 'transactions', 'notifications'];
    
    const checkTable = (index) => {
        if (index >= tables.length) {
            connection.end();
            return;
        }
        
        const table = tables[index];
        connection.query(`SELECT COUNT(*) as count FROM ${table}`, (err, results) => {
            if (err) {
                console.error(`❌ Error checking ${table}:`, err.message);
            } else {
                console.log(`📊 Table ${table}: ${results[0].count} records found`);
            }
            checkTable(index + 1);
        });
    };
    
    checkTable(0);
});
