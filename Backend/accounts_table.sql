-- Run this in TiDB Console to create the accounts table
USE keuangan_dev;

CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'Bank', -- Bank, E-Wallet, Cash, Investment, etc
    icon VARCHAR(50) DEFAULT 'Landmark', -- Lucide icon name
    initial_balance DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY idx_user_account_name (user_id, name)
);

-- Seed initial basic accounts for first user if needed
-- INSERT INTO accounts (user_id, name, type, icon) VALUES (1, 'Cash Account', 'Cash', 'Coins');
-- INSERT INTO accounts (user_id, name, type, icon) VALUES (1, 'BCA', 'Bank', 'Landmark');
