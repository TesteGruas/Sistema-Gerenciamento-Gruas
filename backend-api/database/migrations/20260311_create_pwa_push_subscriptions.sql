-- Migration: criar tabela de subscriptions para Web Push (PWA)
-- Data: 2026-03-11

BEGIN;

CREATE TABLE IF NOT EXISTS pwa_push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  subscription JSONB NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pwa_push_subscriptions_user_id
  ON pwa_push_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_pwa_push_subscriptions_is_active
  ON pwa_push_subscriptions(is_active);

COMMENT ON TABLE pwa_push_subscriptions IS
'Inscrições de Web Push por dispositivo para envio de notificações no PWA.';

COMMIT;
