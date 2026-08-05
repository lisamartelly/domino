ALTER TABLE events ADD COLUMN IF NOT EXISTS featured_on_homepage BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_events_featured ON events (featured_on_homepage) WHERE featured_on_homepage = true;
