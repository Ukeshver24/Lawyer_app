-- =========================================================================
-- DIGI LAW REPORTER - DATABASE MIGRATION 003
-- Table: cases (Precedents, Judgments & Citations)
-- =========================================================================

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

-- Indexes for quick metadata searching
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_year ON cases(year);
CREATE INDEX IF NOT EXISTS idx_cases_court ON cases(court);
CREATE INDEX IF NOT EXISTS idx_cases_judgment_date ON cases(judgment_date);
