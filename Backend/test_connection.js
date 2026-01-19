const db = require('./config/db');

db.query('SELECT 1 + 1 AS solution', (err, results) => {
    if (err) {
        console.error('Test Failed:', err.message);
        process.exit(1);
    }
    console.log('The solution is: ', results[0].solution);
    console.log('✅ db.js configuration is working correctly!');
    process.exit(0);
});
