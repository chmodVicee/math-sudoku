CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(30)  NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ux_users_username_lower ON users (lower(username));

CREATE TABLE progress (
    user_id                 BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    current_level           INT     NOT NULL DEFAULT 1,
    highest_level           INT     NOT NULL DEFAULT 1,
    total_levels_completed  INT     NOT NULL DEFAULT 0,
    total_time_seconds      BIGINT  NOT NULL DEFAULT 0,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE level_results (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT  NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    level_number   INT     NOT NULL,
    best_seconds   INT     NOT NULL,
    attempts       INT     NOT NULL DEFAULT 1,
    last_played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_level_results_user_level UNIQUE (user_id, level_number)
);

CREATE INDEX ix_level_results_user ON level_results (user_id);
