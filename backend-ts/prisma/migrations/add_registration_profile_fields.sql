-- Add profile fields collected during registration
-- (pronouns, interests, looking_for)

-- Pronouns (e.g. she/her, he/him, they/them)
ALTER TABLE users ADD COLUMN IF NOT EXISTS pronouns VARCHAR(50);

-- Free-text interests
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests VARCHAR(2000);

-- What the user is looking for (multi-select: closeFriends, romance, community, hobbies)
ALTER TABLE users ADD COLUMN IF NOT EXISTS looking_for TEXT[] NOT NULL DEFAULT '{}';

-- Make last_name optional for new registration flow (single "Name" field stored in first_name)
ALTER TABLE users ALTER COLUMN last_name SET DEFAULT '';
