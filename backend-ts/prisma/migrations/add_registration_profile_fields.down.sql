-- Rollback: remove profile fields added for registration

ALTER TABLE users DROP COLUMN IF EXISTS pronouns;
ALTER TABLE users DROP COLUMN IF EXISTS interests;
ALTER TABLE users DROP COLUMN IF EXISTS looking_for;
ALTER TABLE users ALTER COLUMN last_name DROP DEFAULT;
