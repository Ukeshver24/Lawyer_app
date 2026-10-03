-- =========================================================================
-- DIGI LAW REPORTER - DATABASE MIGRATION 002
-- Table: users (Public Legal Portal Subscribers & Users)
-- =========================================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Disabled')),
    joined_date DATE DEFAULT CURRENT_DATE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on mobile & status for user management lookup
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
