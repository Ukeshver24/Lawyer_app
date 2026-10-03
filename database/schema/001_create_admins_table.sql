-- =========================================================================
-- DIGI LAW REPORTER - DATABASE MIGRATION 001
-- Table: admins (Role-Based Access Control)
-- =========================================================================

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'EXTRA_ADMIN' CHECK (role IN ('MAIN_ADMIN', 'EXTRA_ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on username for fast login lookup
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
