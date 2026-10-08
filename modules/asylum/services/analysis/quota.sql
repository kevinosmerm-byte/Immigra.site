CREATE TABLE IF NOT EXISTS ai_daily_usage (
 day TEXT NOT NULL,
 bucket TEXT NOT NULL,
 used INTEGER NOT NULL DEFAULT 0 CHECK (used >= 0),
 PRIMARY KEY (day,bucket)
);
-- No narratives, documents, email addresses or model responses are stored here.
-- Periodic maintenance: DELETE FROM ai_daily_usage WHERE day < date('now','-30 days');
