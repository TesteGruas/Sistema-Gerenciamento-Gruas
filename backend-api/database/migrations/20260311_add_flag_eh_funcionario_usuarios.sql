-- Migration: Adicionar flag de funcionario na tabela usuarios
-- Data: 2026-03-11
-- Objetivo: Diferenciar funcionario de outros tipos de usuario no login do app

BEGIN;

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS eh_funcionario BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill para usuarios ja vinculados a um funcionario
UPDATE usuarios
SET
  eh_funcionario = TRUE,
  updated_at = NOW()
WHERE funcionario_id IS NOT NULL
  AND COALESCE(eh_funcionario, FALSE) = FALSE;

CREATE INDEX IF NOT EXISTS idx_usuarios_eh_funcionario
ON usuarios(eh_funcionario);

COMMENT ON COLUMN usuarios.eh_funcionario IS
'Flag que identifica se o usuario representa um funcionario no app.';

COMMIT;
