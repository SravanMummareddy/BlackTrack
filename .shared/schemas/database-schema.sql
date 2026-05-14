-- BlackStack Database Schema
-- Casino session tracking + blackjack learning app
-- Run via: psql $DATABASE_URL -f .shared/schemas/database-schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT        NOT NULL,
    name            TEXT        NOT NULL,
    password_hash   TEXT,
    role            TEXT        NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    active          BOOLEAN     NOT NULL DEFAULT true,
    oauth_provider  TEXT,
    oauth_id        TEXT,
    -- Responsible gambling settings
    monthly_budget  NUMERIC(10,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_email_unique  UNIQUE (email),
    CONSTRAINT users_oauth_unique  UNIQUE (oauth_provider, oauth_id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ============================================================
-- CASINOS
-- ============================================================
CREATE TABLE IF NOT EXISTS casinos (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name        TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
    location    TEXT,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_casinos_user_id ON casinos (user_id);

-- ============================================================
-- SESSIONS
-- A session = one casino visit on one date.
-- Net P/L is computed from game_entries (not stored — derive with SUM).
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    casino_id       UUID        REFERENCES casinos (id) ON DELETE SET NULL,
    session_date    DATE        NOT NULL,
    duration_min    INTEGER,                  -- optional: minutes played
    mood_before     TEXT CHECK (mood_before IN ('great','good','neutral','tired','anxious')),
    mood_after      TEXT CHECK (mood_after  IN ('great','good','neutral','tired','anxious')),
    notes           TEXT,
    -- Responsible gambling
    loss_limit      NUMERIC(10,2),            -- user-set limit for this session
    time_limit_min  INTEGER,                  -- user-set time limit in minutes
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id       ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date     ON sessions (user_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_casino_id     ON sessions (casino_id);

-- ============================================================
-- SESSION TAGS
-- Predefined: disciplined, tilted, chasing, lucky, distracted, focused
-- ============================================================
CREATE TABLE IF NOT EXISTS session_tags (
    session_id  UUID  NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
    tag         TEXT  NOT NULL,
    PRIMARY KEY (session_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_session_tags_session_id ON session_tags (session_id);

-- ============================================================
-- GAME ENTRIES
-- Sub-ledger within a session: one row per game type played.
-- ============================================================
CREATE TABLE IF NOT EXISTS game_entries (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID        NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
    game_type   TEXT        NOT NULL CHECK (game_type IN ('blackjack','poker','roulette','slots','baccarat','craps','other')),
    buy_in      NUMERIC(10,2) NOT NULL CHECK (buy_in >= 0),
    cash_out    NUMERIC(10,2) NOT NULL CHECK (cash_out >= 0),
    -- net = cash_out - buy_in (computed in application layer or as generated column)
    table_min   NUMERIC(10,2),               -- optional: table minimum for context
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_entries_session_id ON game_entries (session_id);
CREATE INDEX IF NOT EXISTS idx_game_entries_game_type  ON game_entries (game_type);

-- ============================================================
-- STRATEGY ATTEMPTS
-- Each trainer hand attempt: hand, dealer upcard, user action, correct action.
-- Feeds accuracy stats and the Mistakes review queue.
-- ============================================================
CREATE TABLE IF NOT EXISTS strategy_attempts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    hand_type       TEXT        NOT NULL CHECK (hand_type IN ('hard','soft','pair')),
    player_total    INTEGER     NOT NULL,     -- e.g. 16 for hard 16
    dealer_upcard   INTEGER     NOT NULL,     -- 2-11 (11 = Ace)
    user_action     TEXT        NOT NULL,     -- hit, stand, double, split, surrender
    correct_action  TEXT        NOT NULL,
    was_correct     BOOLEAN     NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_attempts_user_id    ON strategy_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_attempts_correct    ON strategy_attempts (user_id, was_correct);
-- Fast lookup for Mistakes queue (wrong answers, most recent first)
CREATE INDEX IF NOT EXISTS idx_strategy_attempts_mistakes   ON strategy_attempts (user_id, created_at DESC)
    WHERE was_correct = false;

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at       BEFORE UPDATE ON users        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER casinos_updated_at     BEFORE UPDATE ON casinos      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER sessions_updated_at    BEFORE UPDATE ON sessions     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER game_entries_updated_at BEFORE UPDATE ON game_entries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
