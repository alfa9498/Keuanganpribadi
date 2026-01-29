ALTER TABLE users
ADD COLUMN telegram_chat_id VARCHAR(50) UNIQUE NULL,
ADD COLUMN telegram_username VARCHAR(100) NULL,
ADD INDEX idx_telegram_chat_id (telegram_chat_id);
