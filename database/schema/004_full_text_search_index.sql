-- =========================================================================
-- DIGI LAW REPORTER - DATABASE MIGRATION 004
-- Full-Text Legal Search Engine GIN Index (TSVECTOR)
-- Enables lightning-fast keyword, precedent & ratio decidendi search
-- =========================================================================

-- 1. Add generated tsvector search column
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(case_number, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(act, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(section, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(head_note, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(judgment_text, '')), 'D')
) STORED;

-- 2. Create GIN Index on search_vector for sub-second searches across lakhs of rows
CREATE INDEX IF NOT EXISTS idx_cases_search_vector ON cases USING GIN(search_vector);
