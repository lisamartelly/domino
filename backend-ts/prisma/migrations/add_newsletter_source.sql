ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'newsletter';
