CREATE TABLE IF NOT EXISTS codex_users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(24) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 1000 CHECK (credits >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS codex_credit_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES codex_users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason VARCHAR(80) NOT NULL,
  model_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS codex_credit_transactions_user_created
  ON codex_credit_transactions(user_id, created_at DESC);
