-- EXECUTE THIS SQL IN MYSQL WORKBENCH OR YOUR DATABASE CLIENT

-- Step 1: Use the myapp_db database (sesuai config backend Anda)
USE myapp_db;

-- Step 2: Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
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

-- Step 3: Verify table created
SHOW TABLES LIKE 'notifications';

-- Step 4: Check table structure
DESCRIBE notifications;

-- Optional: Insert test notification to verify system works
-- INSERT INTO notifications (user_id, type, title, message) 
-- VALUES (1, 'system', 'Test Notification', 'This is a test notification to verify the system works');

-- Optional: Check if test notification was created
-- SELECT * FROM notifications;
