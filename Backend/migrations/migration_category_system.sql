-- Migration: Category Management System

-- 1. Create Category Groups Table (Parent Categories)
-- Used for Expense main groups: Survival, Optional, Culture, Financial, Extra
CREATE TABLE IF NOT EXISTS category_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_type (user_id, type)
);

-- 2. Create Categories Table (Sub Categories / Items)
-- Used for:
-- Expense: Sub-categories linked to a group (e.g., Makanan -> Survival)
-- Income: Flat categories (group_id IS NULL)
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
);
