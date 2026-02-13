const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'keuangan_dev', // Default to dev if not specified
    port: parseInt(process.env.DB_PORT || "4000"),
    ssl: { rejectUnauthorized: false }
};

async function migratePlanningTables() {
    let connection;
    try {
        console.log("🚀 Connecting to database...", dbConfig.database);
        connection = await mysql.createConnection(dbConfig);
        
        // 1. Create budgets table
        // Tracks monthly spending limits per category
        console.log("Creating 'budgets' table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS budgets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                category_id INT NOT NULL,
                amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
                month VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_budget (user_id, category_id, month),
                INDEX idx_budget_month (user_id, month)
            ) ENGINE=InnoDB;
        `);
        console.log("✅ 'budgets' table ready.");

        // 2. Create savings_goals table
        // Tracks long-term savings targets
        console.log("Creating 'savings_goals' table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS savings_goals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                target_amount DECIMAL(15, 2) NOT NULL,
                current_amount DECIMAL(15, 2) DEFAULT 0,
                deadline DATE NULL,
                icon VARCHAR(50) DEFAULT 'PiggyBank',
                color VARCHAR(20) DEFAULT 'bg-blue-500',
                status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_goals_user (user_id)
            ) ENGINE=InnoDB;
        `);
        console.log("✅ 'savings_goals' table ready.");

        // 3. Create goal_transactions table (Optional - for tracking history of goals)
        // Good for "History" tab in Goal details
        console.log("Creating 'goal_transactions' table...");
        await connection.query(`
             CREATE TABLE IF NOT EXISTS goal_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                goal_id INT NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                type ENUM('deposit', 'withdraw') NOT NULL,
                notes TEXT,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_goal_tx (goal_id)
            ) ENGINE=InnoDB;
        `);
         console.log("✅ 'goal_transactions' table ready.");

        console.log("🎉 Migration for Financial Planning tables COMPLETED successfully!");

    } catch (error) {
        console.error("❌ Migration Failed:", error);
    } finally {
        if (connection) await connection.end();
    }
}

migratePlanningTables();
