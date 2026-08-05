DROP INDEX IF EXISTS idx_events_featured;

ALTER TABLE events DROP COLUMN IF EXISTS featured_on_homepage;
