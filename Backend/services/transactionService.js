const db = require('../config/db');
const notificationController = require('../controllers/notificationController');

/**
 * Create a new transaction
 * @param {Object} data - Transaction data
 * @returns {Promise<Object>} Created transaction
 */
const createTransaction = (data) => {
    return new Promise((resolve, reject) => {
        const { user_id, date, type, category, amount, description, payment_method, account, to_account, status } = data;

        // VALIDATION
        if (!user_id || !date || !type || !category || !amount) {
            return reject(new Error("Data transaksi tidak lengkap!"));
        }

        const query = "INSERT INTO transactions (user_id, date, type, category, amount, description, payment_method, account, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        // Default values
        const val_payment = payment_method || 'Cash';
        const val_account = account || 'Cash Account';
        const val_status = status || 'done';

        db.query(query, [user_id, date, type, category, amount, description, val_payment, val_account, val_status], (err, result) => {
            if (err) {
                console.error("Create Transaction Error:", err);
                return reject(err);
            }

            // Create notification (Fire and forget)
            const numAmount = Number(amount);
            let notifTitle = `New ${type === 'income' ? 'Income' : type === 'expense' ? 'Expense' : 'Transfer'}`;
            let notifMessage = `${category}: Rp ${numAmount.toLocaleString('id-ID')}`;

            if (type === 'transfer') {
                notifMessage = `Transfer Rp ${numAmount.toLocaleString('id-ID')} from ${val_account} to ${val_to_account}`;
            } else if (description) {
                notifMessage += ` - ${description}`;
            }

            notificationController.createNotification(user_id, 'transaction_added', notifTitle, notifMessage, (err) => {
                if (err) console.error('❌ Async Notification Error:', err);
            });

            // BROADCAST REAL-TIME UPDATE
            if (global.io) {
                console.log("📢 Broadcasting transaction_updated event...");
                global.io.emit('transaction_updated', { type: 'create', data: { id: result.insertId, user_id } });
            }

            resolve({ id: result.insertId, ...data });
        });
    });
};

module.exports = { createTransaction };
