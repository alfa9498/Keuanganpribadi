USE keuangan;

-- Fix 'accounts' table columns
DROP PROCEDURE IF EXISTS upgrade_accounts;

DELIMITER //
CREATE PROCEDURE upgrade_accounts()
BEGIN
  -- 1. Add 'type' if missing
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'keuangan' AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'type') THEN
    ALTER TABLE accounts ADD COLUMN type VARCHAR(50) DEFAULT 'Bank' AFTER name;
  END IF;

  -- 2. Add 'icon' if missing
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'keuangan' AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'icon') THEN
    ALTER TABLE accounts ADD COLUMN icon VARCHAR(50) DEFAULT 'Landmark' AFTER type;
  END IF;

  -- 3. Add 'initial_balance' if missing
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'keuangan' AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'initial_balance') THEN
    -- If 'balance' from old sync exists, we might want to rename it or just add initial_balance
    IF EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'keuangan' AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'balance') THEN
        ALTER TABLE accounts CHANGE COLUMN balance initial_balance DECIMAL(15, 2) DEFAULT 0.00;
    ELSE
        ALTER TABLE accounts ADD COLUMN initial_balance DECIMAL(15, 2) DEFAULT 0.00 AFTER icon;
    END IF;
  END IF;

  -- 4. Add Unique Key if missing
  IF NOT EXISTS (SELECT * FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'keuangan' AND TABLE_NAME = 'accounts' AND INDEX_NAME = 'idx_user_account_name') THEN
    ALTER TABLE accounts ADD UNIQUE KEY idx_user_account_name (user_id, name);
  END IF;

END //
DELIMITER ;

CALL upgrade_accounts();
DROP PROCEDURE upgrade_accounts;

SELECT 'Accounts Table Fixed' as Status;
