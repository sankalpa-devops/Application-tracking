-- Migration: Add request_type field to employee_transfer_requests table
-- Date: 2026-07-11
-- Description: Add request_type column to support 3 transfer scenarios: department, management, employee

ALTER TABLE employee_transfer_requests 
ADD COLUMN request_type VARCHAR(50) NOT NULL DEFAULT 'employee' 
AFTER preferred_transfer_date;

-- Update existing records to have a default request_type
UPDATE employee_transfer_requests 
SET request_type = 'employee' 
WHERE request_type IS NULL OR request_type = '';
