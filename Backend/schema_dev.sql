-- Skrip untuk membuat Database Development di TiDB

-- 1. Buat Database Baru
CREATE DATABASE IF NOT EXISTS keuangan_dev;
USE keuangan_dev;

-- 2. Buat Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NULL, -- Password boleh NULL (persiapan untuk Google Auth)
    gender ENUM('male', 'female') DEFAULT 'male',
    telegram_chat_id VARCHAR(50) UNIQUE NULL, -- Kolom baru untuk Telegram
    telegram_username VARCHAR(100) NULL,      -- Kolom baru untuk Telegram
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_telegram_chat_id (telegram_chat_id)
);

-- 3. Buat Tabel Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    payment_method VARCHAR(50) DEFAULT 'Cash', -- Kolom tambahan yang mungkin diperlukan
    account VARCHAR(50) DEFAULT 'Cash Account', -- Kolom tambahan yang mungkin diperlukan
    status VARCHAR(20) DEFAULT 'done',         -- Kolom tambahan yang mungkin diperlukan
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Buat Tabel Password Resets (untuk fitur lupa password)
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    otp VARCHAR(10),
    expires_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Tabel Notifikasi (jika ada fitur notifikasi)
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
