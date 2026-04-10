-- =============================================================
-- Domino – Mock User Seed Data
-- =============================================================
-- Run against the Domino dev database after migrations.
-- All mock members share the password "Password1!" but since
-- Identity V3 hashes can't be generated in raw SQL, the script
-- leaves password_hash NULL. Use the /api/auth/register endpoint
-- or the dev seeder in Program.cs to set real passwords.
--
-- The script is idempotent — re-running it skips existing emails.
-- =============================================================

BEGIN;

-- Helper: look up role IDs once
DO $$
DECLARE
    v_admin_role_id  INT;
    v_user_role_id   INT;
    v_user_id        INT;
BEGIN
    SELECT id INTO v_admin_role_id FROM roles WHERE name = 'Admin';
    SELECT id INTO v_user_role_id  FROM roles WHERE name = 'User';

    -- ── Admin user ──────────────────────────────────────────────

    IF NOT EXISTS (SELECT 1 FROM users WHERE normalized_email = 'ADMIN@DOMINO.DEV') THEN
        INSERT INTO users (
            first_name, last_name, birthday, is_active,
            user_name, normalized_user_name,
            email, normalized_email,
            email_confirmed, phone_number_confirmed,
            two_factor_enabled, lockout_enabled, access_failed_count,
            security_stamp, concurrency_stamp
        ) VALUES (
            'Admin', 'User', '1990-01-01', TRUE,
            'admin@domino.dev', 'ADMIN@DOMINO.DEV',
            'admin@domino.dev', 'ADMIN@DOMINO.DEV',
            TRUE, FALSE,
            FALSE, TRUE, 0,
            gen_random_uuid()::TEXT, gen_random_uuid()::TEXT
        ) RETURNING id INTO v_user_id;

        INSERT INTO user_roles (user_id, role_id) VALUES (v_user_id, v_admin_role_id);
    END IF;

    -- ── Mock members ────────────────────────────────────────────

    -- 1. Alex Rivera
    IF NOT EXISTS (SELECT 1 FROM users WHERE normalized_email = 'ALEX.RIVERA@EXAMPLE.COM') THEN
        INSERT INTO users (
            first_name, last_name, birthday, is_active,
            user_name, normalized_user_name,
            email, normalized_email,
            email_confirmed, phone_number_confirmed,
            two_factor_enabled, lockout_enabled, access_failed_count,
            security_stamp, concurrency_stamp
        ) VALUES (
            'Alex', 'Rivera', '1997-03-14', TRUE,
            'alex.rivera@example.com', 'ALEX.RIVERA@EXAMPLE.COM',
            'alex.rivera@example.com', 'ALEX.RIVERA@EXAMPLE.COM',
            TRUE, FALSE, FALSE, TRUE, 0,
            gen_random_uuid()::TEXT, gen_random_uuid()::TEXT
        ) RETURNING id INTO v_user_id;
        INSERT INTO user_roles (user_id, role_id) VALUES (v_user_id, v_user_role_id);
    END IF;

    -- 2. Jordan Chen
    IF NOT EXISTS (SELECT 1 FROM users WHERE normalized_email = 'JORDAN.CHEN@EXAMPLE.COM') THEN
        INSERT INTO users (
            first_name, last_name, birthday, is_active,
            user_name, normalized_user_name,
            email, normalized_email,
            email_confirmed, phone_number_confirmed,
            two_factor_enabled, lockout_enabled, access_failed_count,
            security_stamp, concurrency_stamp
        ) VALUES (
            'Jordan', 'Chen', '1995-07-22', TRUE,
            'jordan.chen@example.com', 'JORDAN.CHEN@EXAMPLE.COM',
            'jordan.chen@example.com', 'JORDAN.CHEN@EXAMPLE.COM',
            TRUE, FALSE, FALSE, TRUE, 0,
            gen_random_uuid()::TEXT, gen_random_uuid()::TEXT
        ) RETURNING id INTO v_user_id;
        INSERT INTO user_roles (user_id, role_id) VALUES (v_user_id, v_user_role_id);
    END IF;

    -- 3. Sam Okonkwo
    IF NOT EXISTS (SELECT 1 FROM users WHERE normalized_email = 'SAM.OKONKWO@EXAMPLE.COM') THEN
        INSERT INTO users (
            first_name, last_name, birthday, is_active,
            user_name, normalized_user_name,
            email, normalized_email,
            email_confirmed, phone_number_confirmed,
            two_factor_enabled, lockout_enabled, access_failed_count,
            security_stamp, concurrency_stamp
        ) VALUES (
            'Sam', 'Okonkwo', '1999-11-03', TRUE,
            'sam.okonkwo@example.com', 'SAM.OKONKWO@EXAMPLE.COM',
            'sam.okonkwo@example.com', 'SAM.OKONKWO@EXAMPLE.COM',
            TRUE, FALSE, FALSE, TRUE, 0,
            gen_random_uuid()::TEXT, gen_random_uuid()::TEXT
        ) RETURNING id INTO v_user_id;
        INSERT INTO user_roles (user_id, role_id) VALUES (v_user_id, v_user_role_id);
    END IF;

    -- 4. Taylor Brooks
    IF NOT EXISTS (SELECT 1 FROM users WHERE normalized_email = 'TAYLOR.BROOKS@EXAMPLE.COM') THEN
        INSERT INTO users (
            first_name, last_name, birthday, is_active,
            user_name, normalized_user_name,
            email, normalized_email,
            email_confirmed, phone_number_confirmed,
            two_factor_enabled, lockout_enabled, access_failed_count,
            security_stamp, concurrency_stamp
        ) VALUES (
            'Taylor', 'Brooks', '1992-05-30', TRUE,
            'taylor.brooks@example.com', 'TAYLOR.BROOKS@EXAMPLE.COM',
            'taylor.brooks@example.com', 'TAYLOR.BROOKS@EXAMPLE.COM',
            TRUE, FALSE, FALSE, TRUE, 0,
            gen_random_uuid()::TEXT, gen_random_uuid()::TEXT
        ) RETURNING id INTO v_user_id;
        INSERT INTO user_roles (user_id, role_id) VALUES (v_user_id, v_user_role_id);
    END IF;

    -- 5. Riley Patel
    IF NOT EXISTS (SELECT 1 FROM users WHERE normalized_email = 'RILEY.PATEL@EXAMPLE.COM') THEN
        INSERT INTO users (
            first_name, last_name, birthday, is_active,
            user_name, normalized_user_name,
            email, normalized_email,
            email_confirmed, phone_number_confirmed,
            two_factor_enabled, lockout_enabled, access_failed_count,
            security_stamp, concurrency_stamp
        ) VALUES (
            'Riley', 'Patel', '1996-09-17', TRUE,
            'riley.patel@example.com', 'RILEY.PATEL@EXAMPLE.COM',
            'riley.patel@example.com', 'RILEY.PATEL@EXAMPLE.COM',
            TRUE, FALSE, FALSE, TRUE, 0,
            gen_random_uuid()::TEXT, gen_random_uuid()::TEXT
        ) RETURNING id INTO v_user_id;
        INSERT INTO user_roles (user_id, role_id) VALUES (v_user_id, v_user_role_id);
    END IF;

    -- 6. Morgan Davis
    IF NOT EXISTS (SELECT 1 FROM users WHERE normalized_email = 'MORGAN.DAVIS@EXAMPLE.COM') THEN
        INSERT INTO users (
            first_name, last_name, birthday, is_active,
            user_name, normalized_user_name,
            email, normalized_email,
            email_confirmed, phone_number_confirmed,
            two_factor_enabled, lockout_enabled, access_failed_count,
            security_stamp, concurrency_stamp
        ) VALUES (
            'Morgan', 'Davis', '1994-12-08', TRUE,
            'morgan.davis@example.com', 'MORGAN.DAVIS@EXAMPLE.COM',
            'morgan.davis@example.com', 'MORGAN.DAVIS@EXAMPLE.COM',
            TRUE, FALSE, FALSE, TRUE, 0,
            gen_random_uuid()::TEXT, gen_random_uuid()::TEXT
        ) RETURNING id INTO v_user_id;
        INSERT INTO user_roles (user_id, role_id) VALUES (v_user_id, v_user_role_id);
    END IF;

    -- 7. Casey Reyes
    IF NOT EXISTS (SELECT 1 FROM users WHERE normalized_email = 'CASEY.REYES@EXAMPLE.COM') THEN
        INSERT INTO users (
            first_name, last_name, birthday, is_active,
            user_name, normalized_user_name,
            email, normalized_email,
            email_confirmed, phone_number_confirmed,
            two_factor_enabled, lockout_enabled, access_failed_count,
            security_stamp, concurrency_stamp
        ) VALUES (
            'Casey', 'Reyes', '1998-02-25', TRUE,
            'casey.reyes@example.com', 'CASEY.REYES@EXAMPLE.COM',
            'casey.reyes@example.com', 'CASEY.REYES@EXAMPLE.COM',
            TRUE, FALSE, FALSE, TRUE, 0,
            gen_random_uuid()::TEXT, gen_random_uuid()::TEXT
        ) RETURNING id INTO v_user_id;
        INSERT INTO user_roles (user_id, role_id) VALUES (v_user_id, v_user_role_id);
    END IF;

    -- 8. Avery Larson
    IF NOT EXISTS (SELECT 1 FROM users WHERE normalized_email = 'AVERY.LARSON@EXAMPLE.COM') THEN
        INSERT INTO users (
            first_name, last_name, birthday, is_active,
            user_name, normalized_user_name,
            email, normalized_email,
            email_confirmed, phone_number_confirmed,
            two_factor_enabled, lockout_enabled, access_failed_count,
            security_stamp, concurrency_stamp
        ) VALUES (
            'Avery', 'Larson', '2000-06-11', TRUE,
            'avery.larson@example.com', 'AVERY.LARSON@EXAMPLE.COM',
            'avery.larson@example.com', 'AVERY.LARSON@EXAMPLE.COM',
            TRUE, FALSE, FALSE, TRUE, 0,
            gen_random_uuid()::TEXT, gen_random_uuid()::TEXT
        ) RETURNING id INTO v_user_id;
        INSERT INTO user_roles (user_id, role_id) VALUES (v_user_id, v_user_role_id);
    END IF;

    -- 9. Drew Nakamura
    IF NOT EXISTS (SELECT 1 FROM users WHERE normalized_email = 'DREW.NAKAMURA@EXAMPLE.COM') THEN
        INSERT INTO users (
            first_name, last_name, birthday, is_active,
            user_name, normalized_user_name,
            email, normalized_email,
            email_confirmed, phone_number_confirmed,
            two_factor_enabled, lockout_enabled, access_failed_count,
            security_stamp, concurrency_stamp
        ) VALUES (
            'Drew', 'Nakamura', '1993-08-19', TRUE,
            'drew.nakamura@example.com', 'DREW.NAKAMURA@EXAMPLE.COM',
            'drew.nakamura@example.com', 'DREW.NAKAMURA@EXAMPLE.COM',
            TRUE, FALSE, FALSE, TRUE, 0,
            gen_random_uuid()::TEXT, gen_random_uuid()::TEXT
        ) RETURNING id INTO v_user_id;
        INSERT INTO user_roles (user_id, role_id) VALUES (v_user_id, v_user_role_id);
    END IF;

    -- 10. Quinn Abara
    IF NOT EXISTS (SELECT 1 FROM users WHERE normalized_email = 'QUINN.ABARA@EXAMPLE.COM') THEN
        INSERT INTO users (
            first_name, last_name, birthday, is_active,
            user_name, normalized_user_name,
            email, normalized_email,
            email_confirmed, phone_number_confirmed,
            two_factor_enabled, lockout_enabled, access_failed_count,
            security_stamp, concurrency_stamp
        ) VALUES (
            'Quinn', 'Abara', '1991-04-02', TRUE,
            'quinn.abara@example.com', 'QUINN.ABARA@EXAMPLE.COM',
            'quinn.abara@example.com', 'QUINN.ABARA@EXAMPLE.COM',
            TRUE, FALSE, FALSE, TRUE, 0,
            gen_random_uuid()::TEXT, gen_random_uuid()::TEXT
        ) RETURNING id INTO v_user_id;
        INSERT INTO user_roles (user_id, role_id) VALUES (v_user_id, v_user_role_id);
    END IF;

END $$;

COMMIT;
