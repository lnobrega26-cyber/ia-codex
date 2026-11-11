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

ALTER TABLE codex_users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS codex_models (
  id VARCHAR(60) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  provider VARCHAR(80) NOT NULL,
  model VARCHAR(160) NOT NULL,
  api_base TEXT NOT NULL,
  api_key_env VARCHAR(80) NOT NULL,
  input_cost_per_1k NUMERIC(12,4) NOT NULL CHECK (input_cost_per_1k >= 0),
  output_cost_per_1k NUMERIC(12,4) NOT NULL CHECK (output_cost_per_1k >= 0),
  free BOOLEAN NOT NULL DEFAULT FALSE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  description VARCHAR(180) NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
