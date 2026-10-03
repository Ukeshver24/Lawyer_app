-- =========================================================================
-- DIGI LAW REPORTER - COMPLETE ALL-IN-ONE POSTGRESQL DATABASE SETUP
-- Use this file directly in pgAdmin 4 Query Tool
-- =========================================================================

-- 1. Table: admins (Admin Accounts & Roles)
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'EXTRA_ADMIN' CHECK (role IN ('MAIN_ADMIN', 'EXTRA_ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- 2. Table: users (Subscribers & Portal Users)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'USER',
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Disabled')),
    is_active BOOLEAN DEFAULT TRUE,
    joined_date DATE DEFAULT CURRENT_DATE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Table: cases (Precedents, Judgments & Citations for Website & App)
CREATE TABLE IF NOT EXISTS cases (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    petitioner VARCHAR(150),
    respondent VARCHAR(150),
    court VARCHAR(150) NOT NULL DEFAULT 'Supreme Court of India',
    judgment_date DATE NOT NULL,
    year INTEGER NOT NULL,
    act VARCHAR(255),
    section VARCHAR(150),
    head_note TEXT NOT NULL,
    judgment_text TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft', 'Published')),
    citations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_year ON cases(year);
CREATE INDEX IF NOT EXISTS idx_cases_court ON cases(court);
CREATE INDEX IF NOT EXISTS idx_cases_judgment_date ON cases(judgment_date);

-- 4. Full-Text Search Vector & GIN Index for cases
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE cases 
        ADD COLUMN search_vector tsvector 
        GENERATED ALWAYS AS (
            setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(case_number, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(act, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(section, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(head_note, '')), 'C') ||
            setweight(to_tsvector('english', coalesce(judgment_text, '')), 'D')
        ) STORED;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cases_search_vector ON cases USING GIN(search_vector);

-- 5. Table: password_reset_tokens (Main Admin Secure Reset Tokens)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    admin_id VARCHAR(100) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reset_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_reset_admin_id ON password_reset_tokens(admin_id);

-- 6. Table: judgments (PDF upload & legacy table)
CREATE TABLE IF NOT EXISTS judgments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    court_name VARCHAR(150),
    judgment_date DATE,
    citation TEXT,
    petitioner_name VARCHAR(255),
    respondent_name VARCHAR(255),
    act_name VARCHAR(255),
    section_number VARCHAR(100),
    topics VARCHAR(255),
    head_note TEXT,
    content TEXT,
    pdf_file_path VARCHAR(255),
    search_vector TSVECTOR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_judgments_search_vector ON judgments USING GIN(search_vector);

-- 7. Seed Initial Main Admin Account
-- Email: kavinselvaraj12@gmail.com
-- Initial Password: Kavin1122
INSERT INTO admins (name, username, email, password_hash, role)
VALUES 
    ('Main Admin', 'mainadmin', 'kavinselvaraj12@gmail.com', '$2b$10$w8T0M4j6lJ4.uFqVqYhG2eE2F1.K3K4K5K6K7K8K9K0K1K2K3K4K5', 'MAIN_ADMIN')
ON CONFLICT (username) DO UPDATE 
SET email = EXCLUDED.email;

INSERT INTO users (name, mobile, email, password_hash, role)
VALUES 
    ('Main Admin', '9999999999', 'kavinselvaraj12@gmail.com', '$2b$10$w8T0M4j6lJ4.uFqVqYhG2eE2F1.K3K4K5K6K7K8K9K0K1K2K3K4K5', 'MAIN_ADMIN')
ON CONFLICT (mobile) DO UPDATE 
SET email = EXCLUDED.email;

-- 8. Table: settings (Platform Branding, Chambers Info & About Page Content)
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default platform settings
INSERT INTO settings (key, value)
VALUES ('platform_settings', '{
  "profile": {
    "name": "Main Admin",
    "email": "kavinselvaraj12@gmail.com",
    "mobile": "+91 98765 43210"
  },
  "office": {
    "lawChambersName": "DIGI LAW REPORTER CHAMBERS & LEGAL RESEARCH CENTRE",
    "officeAddress": "Chamber No. 402, High Court Lawyers Block, Supreme Court Enclave, New Delhi - 110001",
    "primaryPhone": "+91 98765 43210",
    "secondaryPhone": "+91 11 2345 6789",
    "primaryEmail": "contact@digilawreporter.in",
    "secondaryEmail": "support@digilawreporter.in",
    "workingHours": "Monday to Saturday: 9:00 AM - 7:00 PM"
  },
  "aboutPage": {
    "pageHeading": "Pioneering Digital Legal Intelligence & Supreme Court Precedents",
    "pageSubheading": "Empowering Advocates, Judiciary Members & Legal Researchers with Authentic Case Law Insights",
    "aboutParagraph1": "Digi Law Reporter is India’s premier digital legal reporting platform dedicated to publishing authentic, verified Supreme Court and High Court precedents with full citation authority.",
    "aboutParagraph2": "Engineered by Advocate on Record practitioners, our mission is to make comprehensive legal search instantaneous, reliable, and accessible across the country.",
    "founder1Name": "Adv. Rajesh Sharma",
    "founder1Title": "Founder & Senior Advocate",
    "founder1Court": "Supreme Court of India",
    "founder1Experience": "24+ Years Experience",
    "founder1BarNo": "D/1482/2000",
    "founder1Bio": "Senior Advocate specializing in Constitutional Law, Civil Appeals & Special Leave Petitions.",
    "founder1Image": "",
    "founder2Name": "Adv. Priya Venkatesh",
    "founder2Title": "Co-Founder & Advocate on Record",
    "founder2Court": "Supreme Court of India",
    "founder2Experience": "18+ Years Experience",
    "founder2BarNo": "D/892/2006",
    "founder2Bio": "Advocate on Record with extensive practice in Commercial Arbitration and Corporate Precedents.",
    "founder2Image": ""
  }
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 9. Table: user_saved_cases (Portal User Bookmarks and Saved Case Lists)
CREATE TABLE IF NOT EXISTS user_saved_cases (
    user_identifier VARCHAR(100) PRIMARY KEY,
    cases JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_cases_user ON user_saved_cases(user_identifier);

-- 10. Table: admin_sessions (Server-side Admin Authentication Sessions)
CREATE TABLE IF NOT EXISTS admin_sessions (
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

