const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateProduction() {
    const config = {
        host: (process.env.DB_HOST || "localhost").trim(),
        user: (process.env.DB_USER || "root").trim(),
        password: (process.env.DB_PASSWORD || "").trim(),
        database: (process.env.DB_NAME || "myapp_db").trim(),
        port: parseInt(process.env.DB_PORT || "4000"),
        ssl: process.env.DB_SSL === 'true' ? { 
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
        } : null,
        connectTimeout: 30000
    };

    console.log(`🚀 Starting Production Migration for database: ${config.database} on ${config.host}...`);

    let db;
    try {
        db = await mysql.createConnection(config);
        console.log("✅ Connected to TiDB.");

        // 1. USERS TABLE
        console.log("Creating 'users' table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                phone VARCHAR(20),
                password VARCHAR(255) NOT NULL,
                gender ENUM('male', 'female') DEFAULT 'male',
                telegram_chat_id VARCHAR(50),
                telegram_username VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. ACCOUNTS TABLE
        console.log("Creating 'accounts' table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) DEFAULT 'Main',
                balance DECIMAL(15, 2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 3. CATEGORY GROUPS TABLE
        console.log("Creating 'category_groups' table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS category_groups (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                type ENUM('income', 'expense') NOT NULL,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_type (user_id, type)
            )
        `);

        // 4. CATEGORIES TABLE
        console.log("Creating 'categories' table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                group_id INT NULL, 
                name VARCHAR(100) NOT NULL,
                type ENUM('income', 'expense') NOT NULL,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (group_id) REFERENCES category_groups(id) ON DELETE CASCADE,
                INDEX idx_user_type (user_id, type),
                INDEX idx_group (group_id)
            )
        `);

        // 5. TRANSACTIONS TABLE
        console.log("Creating 'transactions' table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                date DATE NOT NULL,
                type ENUM('income', 'expense', 'transfer') NOT NULL,
                category VARCHAR(100) NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                description TEXT,
                payment_method VARCHAR(50) DEFAULT 'Cash',
                account VARCHAR(100) NOT NULL,
                to_account VARCHAR(100),
                status ENUM('done', 'pending') DEFAULT 'done',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 6. NOTIFICATIONS TABLE
        console.log("Creating 'notifications' table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 7. PASSWORD RESETS TABLE
        console.log("Creating 'password_resets' table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                otp VARCHAR(10) NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log("🎉 All tables created successfully!");

    } catch (error) {
        console.error("❌ Migration Failed:", error);
    } finally {
        if (db) await db.end();
    }
}

migrateProduction();
