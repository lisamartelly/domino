-- Add phase column to events (gathering vs scheduled)
ALTER TABLE events ADD COLUMN IF NOT EXISTS phase VARCHAR(50) NOT NULL DEFAULT 'scheduled';

-- Make start_time nullable for gathering-phase events
ALTER TABLE events ALTER COLUMN start_time DROP NOT NULL;

-- Create event_interests table for anonymous interest sign-ups
CREATE TABLE IF NOT EXISTS event_interests (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    email VARCHAR(256) NOT NULL,
    open_to_romance BOOLEAN NOT NULL,
    about_me VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_event_interests_event FOREIGN KEY (event_id)
        REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT uq_event_interests_event_email UNIQUE (event_id, email)
);

CREATE INDEX IF NOT EXISTS idx_event_interests_event_id ON event_interests(event_id);
