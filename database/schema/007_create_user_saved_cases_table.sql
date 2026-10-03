-- Table: user_saved_cases (Portal User Bookmarks and Saved Case Lists)
CREATE TABLE IF NOT EXISTS user_saved_cases (
    user_identifier VARCHAR(100) PRIMARY KEY,
    cases JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_cases_user ON user_saved_cases(user_identifier);
