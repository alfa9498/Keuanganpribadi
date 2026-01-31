-- Migration: Add to_account column to transactions table
-- This column is used for transfer transactions to track the destination account
-- Date: 2026-02-01

USE myapp_db;

ALTER TABLE transactions
ADD COLUMN to_account VARCHAR(50) DEFAULT NULL AFTER account;
