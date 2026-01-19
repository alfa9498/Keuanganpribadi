USE myapp_db;

-- Add 'transfer' to the type enum and add 'to_account' column
ALTER TABLE transactions 
MODIFY COLUMN type ENUM('income', 'expense', 'transfer') NOT NULL,
ADD COLUMN to_account VARCHAR(100) DEFAULT NULL AFTER account;

-- Verify the changes
DESCRIBE transactions;
