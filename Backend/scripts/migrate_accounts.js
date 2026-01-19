const db = require('../config/db');

console.log('🔄 Starting account migration...');
console.log('Migrating "Main" -> "Cash Account"');

const updateAccountQuery = "UPDATE transactions SET account = ? WHERE account = ?";
const updateToAccountQuery = "UPDATE transactions SET to_account = ? WHERE to_account = ?";

// Run migration
db.query(updateAccountQuery, ['Cash Account', 'Main'], (err, result) => {
    if (err) {
        console.error('❌ Error updating account column:', err);
        process.exit(1);
    }
    console.log(`✅ Updated ${result.affectedRows} transactions in 'account' column.`);

    db.query(updateToAccountQuery, ['Cash Account', 'Main'], (err, result) => {
        if (err) {
            console.error('❌ Error updating to_account column:', err);
            process.exit(1);
        }
        console.log(`✅ Updated ${result.affectedRows} transactions in 'to_account' column.`);
        console.log('🎉 Migration completed successfully!');
        process.exit(0);
    });
});
