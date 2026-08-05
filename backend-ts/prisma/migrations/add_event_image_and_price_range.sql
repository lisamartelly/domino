-- Add anticipated price range (free text, e.g. "$20-$40", "Free")
ALTER TABLE events ADD COLUMN IF NOT EXISTS anticipated_price_range VARCHAR(100);

-- Add image URL for event photos
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
