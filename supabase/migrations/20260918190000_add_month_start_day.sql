-- Migration to add month_start_day for monthly analytics
ALTER TABLE user_profiles
ADD COLUMN month_start_day INT DEFAULT 1;
