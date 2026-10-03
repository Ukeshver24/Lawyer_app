-- =========================================================================
-- DIGI LAW REPORTER - DATABASE SEED DATA
-- Only Main Admin Credentials (NO fake details, NO sample cases)
-- =========================================================================

-- Insert Initial Main Admin Credentials
-- Default Password for mainadmin: mainpassword123
INSERT INTO admins (name, username, password_hash, role)
VALUES 
    ('Main Admin', 'mainadmin', '$2b$10$w8T0M4j6lJ4.uFqVqYhG2eE2F1.K3K4K5K6K7K8K9K0K1K2K3K4K5', 'MAIN_ADMIN')
ON CONFLICT (username) DO NOTHING;
