USE ATS_Sys;

CREATE TABLE IF NOT EXISTS transfer_request_links (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(225) UNIQUE NOT NULL,
    title VARCHAR(200),
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_transfer_requests (
    id VARCHAR(36) PRIMARY KEY,
    link_id VARCHAR(36),

    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),

    current_department VARCHAR(200) NOT NULL,
    requested_department VARCHAR(200) NOT NULL,
    current_location VARCHAR(200) NOT NULL,
    requested_location VARCHAR(200) NOT NULL,
    current_field VARCHAR(200),
    requested_field VARCHAR(200),

    reason TEXT NOT NULL,
    preferred_transfer_date DATE,

    status VARCHAR(50) DEFAULT 'Pending',
    reviewed_by VARCHAR(100),
    review_note TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,

    FOREIGN KEY (link_id) REFERENCES transfer_request_links(id)
    ON DELETE SET NULL,
    INDEX idx_transfer_status (status),
    INDEX idx_transfer_employee (employee_id)
) ENGINE=InnoDB;
