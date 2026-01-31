const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'myapp_db'
};

async function generateBackup() {
    console.log('📦 Starting Manual Backup: Generating tidb_full_backup.sql');
    
    let conn;
    let sqlOutput = `-- TABEL BACKUP UNTUK TIDB CLOUD
-- Di-generate pada: ${new Date().toLocaleString()}

-- 0. HAPUS TABEL LAMA (Urutan diperhatikan karena foreign key)
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS users;

-- 1. BUAT KEMBALI TABEL
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    gender ENUM('male', 'female') DEFAULT 'male',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    type ENUM('income', 'expense', 'transfer') NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    payment_method VARCHAR(50) DEFAULT 'Cash',
    account VARCHAR(50) DEFAULT 'Main Account',
    to_account VARCHAR(100) DEFAULT NULL,
    status ENUM('done', 'pending') DEFAULT 'done',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('transaction_added', 'transaction_updated', 'transaction_deleted', 'system') DEFAULT 'system',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created (created_at DESC)
);

`;

    try {
        conn = await mysql.createConnection(config);
        
        // --- USERS ---
        console.log('   > Processing Users...');
        const [users] = await conn.query('SELECT * FROM users');
        if (users.length > 0) {
            sqlOutput += `-- Data Users\n`;
            for (const u of users) {
                const values = [u.id, u.full_name, u.email, u.phone, u.password, u.gender || 'male', u.created_at.toISOString().slice(0, 19).replace('T', ' ')];
                sqlOutput += `INSERT INTO users (id, full_name, email, phone, password, gender, created_at) VALUES (${u.id}, ${conn.escape(u.full_name)}, ${conn.escape(u.email)}, ${conn.escape(u.phone)}, ${conn.escape(u.password)}, ${conn.escape(u.gender || 'male')}, '${values[6]}');\n`;
            }
        }

        // --- TRANSACTIONS ---
        console.log('   > Processing Transactions...');
        const [txs] = await conn.query('SELECT * FROM transactions');
        if (txs.length > 0) {
            sqlOutput += `\n-- Data Transactions\n`;
            for (const t of txs) {
                const date = t.date.toISOString().slice(0, 10);
                const createdAt = t.created_at.toISOString().slice(0, 19).replace('T', ' ');
                sqlOutput += `INSERT INTO transactions (id, user_id, date, type, category, amount, description, payment_method, account, to_account, status, created_at) VALUES (${t.id}, ${t.user_id}, '${date}', '${t.type}', ${conn.escape(t.category)}, ${t.amount}, ${conn.escape(t.description)}, ${conn.escape(t.payment_method)}, ${conn.escape(t.account)}, ${t.to_account ? conn.escape(t.to_account) : 'NULL'}, '${t.status}', '${createdAt}');\n`;
            }
        }

        // --- NOTIFICATIONS ---
        console.log('   > Processing Notifications...');
        try {
            const [notifs] = await conn.query('SELECT * FROM notifications');
            if (notifs.length > 0) {
                sqlOutput += `\n-- Data Notifications\n`;
                for (const n of notifs) {
                    const createdAt = n.created_at.toISOString().slice(0, 19).replace('T', ' ');
                    sqlOutput += `INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES (${n.id}, ${n.user_id}, '${n.type}', ${conn.escape(n.title)}, ${conn.escape(n.message)}, ${n.is_read}, '${createdAt}');\n`;
                }
            }
        } catch (e) {
            console.log('   ! Skipping Notifications (Table not found or empty)');
        }

        const backupPath = path.join(__dirname, 'tidb_full_backup.sql');
        fs.writeFileSync(backupPath, sqlOutput);
        console.log('\n✅ SUCCESS: File backup dibuat di: ' + backupPath);
        console.log('Silakan copy isi file tersebut dan jalankan di TiDB Console Bapak.');

    } catch (err) {
        console.error('❌ Error generating backup:', err.message);
    } finally {
        if (conn) await conn.end();
        process.exit();
    }
}

generateBackup();
