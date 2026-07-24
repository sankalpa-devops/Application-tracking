-- Create Database
CREATE DATABASE IF NOT EXISTS ATS_Sys
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ATS_Sys;

-- =========================
-- USERS TABLE
-- =========================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id VARCHAR(50) UNIQUE NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('HR','ADMIN') NOT NULL,
    email VARCHAR(100),
    reset_token TEXT,
    reset_expiry DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================
-- JOBS TABLE
-- =========================
CREATE TABLE jobs (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200),
    department VARCHAR(200),
    type VARCHAR(50),
    experience VARCHAR(100),
    skills TEXT,
    location VARCHAR(200),
    manager VARCHAR(200),
    openings INT,
    status VARCHAR(50),
    job_description TEXT,
    created_by VARCHAR(150),
    created_date DATE,
    version INT
) ENGINE=InnoDB;

-- =========================
-- CANDIDATES TABLE
-- =========================
CREATE TABLE candidates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200),
    email VARCHAR(200),
    phone VARCHAR(20),

    pan VARCHAR(20) UNIQUE,
    aadhaar VARCHAR(20) UNIQUE,
    uan VARCHAR(20) UNIQUE,

    current_location VARCHAR(200) NOT NULL,
    willing_to_relocate VARCHAR(10) NOT NULL,

    referral_type VARCHAR(20),
    referred_by VARCHAR(100),
    referral_value VARCHAR(100),

    resume_path TEXT,
    notice_period VARCHAR(50),

    current_ctc DECIMAL(12,2),
    expected_ctc DECIMAL(12,2),

    experience VARCHAR(100),

    job_match_id VARCHAR(36),

    status VARCHAR(50) DEFAULT 'Applied',
    source VARCHAR(20) DEFAULT 'online',
    applied_by VARCHAR(20) DEFAULT 'candidate',

    status_updated_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================
-- JOB APPLY LINKS
-- =========================
CREATE TABLE job_apply_links (
    id VARCHAR(36) PRIMARY KEY,
    job_id VARCHAR(36),
    slug VARCHAR(225) UNIQUE,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (job_id) REFERENCES jobs(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- TRANSFER REQUEST LINKS
-- =========================
CREATE TABLE transfer_request_links (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(225) UNIQUE NOT NULL,
    title VARCHAR(200),
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================
-- EMPLOYEE TRANSFER REQUESTS
-- =========================
CREATE TABLE employee_transfer_requests (
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

-- =========================
-- CANDIDATE ML DATA
-- =========================
CREATE TABLE candidate_ml_data (
    id VARCHAR(36) PRIMARY KEY,
    candidate_id VARCHAR(36),
    job_id VARCHAR(36),

    extracted_text LONGTEXT,
    extracted_skills TEXT,
    matched_skills TEXT,

    ats_score INT,
    experience_years FLOAT,

    jd_score INT,
    skill_score INT,
    exp_score INT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (candidate_id) REFERENCES candidates(id)
    ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- ATS FILTER CONFIG
-- =========================
CREATE TABLE ats_filter_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id VARCHAR(36),
    enable_auto_filter BOOLEAN DEFAULT 0,
    shortlist_score INT DEFAULT 70,
    reject_score INT DEFAULT 40,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================
-- INTERVIEWS
-- =========================
CREATE TABLE interviews (
    interview_id INT AUTO_INCREMENT PRIMARY KEY,

    candidate_id VARCHAR(36),
    job_id VARCHAR(36),

    round_name VARCHAR(100),
    round_order INT,

    interview_date DATETIME,

    interviewers JSON,
    meeting_link VARCHAR(255),

    feedback TEXT,
    rating INT,

    status VARCHAR(50) DEFAULT 'Scheduled',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================
-- OFFERS
-- =========================
CREATE TABLE offers (
    offer_id INT AUTO_INCREMENT PRIMARY KEY,

    candidate_id VARCHAR(36),
    job_id VARCHAR(36),

    salary DECIMAL(12,2),
    offer_letter_path TEXT,

    offer_status VARCHAR(50) DEFAULT 'Sent',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (candidate_id) REFERENCES candidates(id)
    ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- CANDIDATE BLACKLIST
-- =========================
CREATE TABLE candidate_blacklist (
    id VARCHAR(36) PRIMARY KEY,

    candidate_id VARCHAR(36),

    name VARCHAR(200),
    email VARCHAR(200),
    phone VARCHAR(20),

    pan VARCHAR(20),
    aadhaar VARCHAR(20),
    uan VARCHAR(20),

    reason TEXT,
    blacklisted_by VARCHAR(100),

    is_active BOOLEAN DEFAULT TRUE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,

    FOREIGN KEY (candidate_id) REFERENCES candidates(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- JOB INTERVIEW FLOW
-- =========================
CREATE TABLE job_interview_flow (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id VARCHAR(36),

    round_name VARCHAR(100),
    round_order INT,
    is_final BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================
-- CANDIDATE STATUS HISTORY
-- =========================
CREATE TABLE candidate_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id VARCHAR(36) NOT NULL,

    old_status VARCHAR(50),
    new_status VARCHAR(50),

    changed_by VARCHAR(100),
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_candidate_id (candidate_id)
) ENGINE=InnoDB;

-- =========================
-- OPTIONAL: DEFAULT ADMIN USER
-- =========================
INSERT INTO users (emp_id, user_name, password, role, email)
VALUES (
    'NEB0SA001',
    'SA-Admin',
    '$2b$12$examplehashedpassword', -- replace with bcrypt hash
    'ADMIN',
    'admin@ats.com'
);
