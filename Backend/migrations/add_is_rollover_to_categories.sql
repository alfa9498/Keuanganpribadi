-- Migration: Add is_rollover to categories table
ALTER TABLE categories ADD COLUMN is_rollover BOOLEAN DEFAULT FALSE;
