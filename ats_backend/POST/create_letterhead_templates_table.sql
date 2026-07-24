-- Migration: Create letterhead_templates table
-- Date: 2026-07-11
-- Description: Create table for managing letterhead templates for LOI and transfer letters

CREATE TABLE letterhead_templates (
    id VARCHAR(36) PRIMARY KEY,
    template_name VARCHAR(200) NOT NULL,
    template_type VARCHAR(50) NOT NULL COMMENT 'loi, transfer_letter, general',
    
    -- Header content
    company_name VARCHAR(200),
    company_address TEXT,
    company_phone VARCHAR(50),
    company_email VARCHAR(200),
    company_logo_path TEXT,
    
    -- Footer content
    footer_text TEXT,
    signature_block TEXT,
    
    -- Styling
    header_color VARCHAR(20) DEFAULT '#1a1a1a',
    footer_color VARCHAR(20) DEFAULT '#666666',
    
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    
    INDEX idx_template_type (template_type),
    INDEX idx_is_active (is_active),
    INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
