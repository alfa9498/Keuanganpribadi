USE myapp_db;

ALTER TABLE transactions
ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Cash',
ADD COLUMN account VARCHAR(50) DEFAULT 'Main',
ADD COLUMN status ENUM('done', 'pending') DEFAULT 'done';
