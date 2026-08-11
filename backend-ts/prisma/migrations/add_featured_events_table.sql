CREATE TABLE IF NOT EXISTS featured_events (
  id          SERIAL PRIMARY KEY,
  event_id    INT NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  sort_order  INT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_featured_events_sort_order ON featured_events(sort_order);

-- Migrate existing featured events into the new table
INSERT INTO featured_events (event_id, sort_order)
SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1
FROM events
WHERE featured_on_homepage = true
ON CONFLICT DO NOTHING;
