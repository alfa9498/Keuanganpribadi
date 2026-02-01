USE keuangan;

-- 1. Create 'accounts' table (Missing in Production)
CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  balance DECIMAL(15, 2) DEFAULT 0,
  is_main BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Create 'password_resets' table (Missing in Production)
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Update 'transactions' table (Add missing columns)
-- Using procedures to avoid errors if columns already exist
DROP PROCEDURE IF EXISTS upgrade_transactions;

DELIMITER //
CREATE PROCEDURE upgrade_transactions()
BEGIN
  -- Add payment_method if not exists
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'keuangan' AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'payment_method') THEN
    ALTER TABLE transactions ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Cash';
  END IF;

  -- Add account if not exists
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'keuangan' AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'account') THEN
    ALTER TABLE transactions ADD COLUMN account VARCHAR(50) DEFAULT 'Main';
  END IF;

  -- Add status if not exists
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'keuangan' AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'status') THEN
    ALTER TABLE transactions ADD COLUMN status ENUM('done', 'pending') DEFAULT 'done';
  END IF;

  -- Add to_account if not exists
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'keuangan' AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'to_account') THEN
    ALTER TABLE transactions ADD COLUMN to_account VARCHAR(50) DEFAULT NULL AFTER account;
  END IF;
END //
DELIMITER ;

CALL upgrade_transactions();
DROP PROCEDURE upgrade_transactions;

-- 4. Verify updates
SELECT 'Sync Completed' as Status;
