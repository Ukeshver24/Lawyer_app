-- Table: admin_sessions (Server-side Admin Authentication Sessions)
DROP TABLE IF EXISTS admin_sessions CASCADE;

CREATE TABLE admin_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    admin_id VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(50),
    created_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL,
    last_activity BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
