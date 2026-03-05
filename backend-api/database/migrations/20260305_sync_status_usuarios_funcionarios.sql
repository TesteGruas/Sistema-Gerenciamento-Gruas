-- Migration: Sincronizar status entre usuarios e funcionarios
-- Data: 2026-03-05
-- Descricao:
--   1) Corrige inconsistencias existentes entre usuarios.funcionario_id e funcionarios.id
--   2) Cria trigger bidirecional para manter status sincronizado automaticamente
--   3) Se houver deleted_at em qualquer lado, status final fica "Inativo"

BEGIN;

-- 1) Correcao inicial dos dados existentes (funcionario como fonte de verdade)
-- Se qualquer lado estiver deletado logicamente, ambos ficam inativos.
UPDATE usuarios u
SET
  status = 'Inativo',
  updated_at = NOW()
FROM funcionarios f
WHERE u.funcionario_id = f.id
  AND (
    u.deleted_at IS NOT NULL
    OR f.deleted_at IS NOT NULL
  )
  AND COALESCE(u.status, '') <> 'Inativo';

UPDATE funcionarios f
SET
  status = 'Inativo',
  updated_at = NOW()
FROM usuarios u
WHERE u.funcionario_id = f.id
  AND (
    u.deleted_at IS NOT NULL
    OR f.deleted_at IS NOT NULL
  )
  AND COALESCE(f.status, '') <> 'Inativo';

-- Sincroniza status dos vinculados nao deletados com base em funcionarios.
UPDATE usuarios u
SET
  status = f.status,
  updated_at = NOW()
FROM funcionarios f
WHERE u.funcionario_id = f.id
  AND u.deleted_at IS NULL
  AND f.deleted_at IS NULL
  AND COALESCE(u.status, '') <> COALESCE(f.status, '');

-- 2) Trigger function para sincronismo automatico
CREATE OR REPLACE FUNCTION sync_status_usuarios_funcionarios()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  status_final TEXT;
BEGIN
  -- Evita recursao infinita entre triggers cruzados.
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'funcionarios' THEN
    status_final := CASE
      WHEN NEW.deleted_at IS NOT NULL THEN 'Inativo'
      ELSE COALESCE(NEW.status, 'Ativo')
    END;

    UPDATE usuarios
    SET
      status = status_final,
      deleted_at = CASE
        WHEN NEW.deleted_at IS NOT NULL THEN COALESCE(usuarios.deleted_at, NEW.deleted_at)
        ELSE usuarios.deleted_at
      END,
      updated_at = NOW()
    WHERE funcionario_id = NEW.id
      AND (
        usuarios.status IS DISTINCT FROM status_final
        OR (NEW.deleted_at IS NOT NULL AND usuarios.deleted_at IS NULL)
      );

    RETURN NEW;
  END IF;

  -- TG_TABLE_NAME = 'usuarios'
  IF NEW.funcionario_id IS NOT NULL THEN
    status_final := CASE
      WHEN NEW.deleted_at IS NOT NULL THEN 'Inativo'
      ELSE COALESCE(NEW.status, 'Ativo')
    END;

    UPDATE funcionarios
    SET
      status = status_final,
      deleted_at = CASE
        WHEN NEW.deleted_at IS NOT NULL THEN COALESCE(funcionarios.deleted_at, NEW.deleted_at)
        ELSE funcionarios.deleted_at
      END,
      updated_at = NOW()
    WHERE id = NEW.funcionario_id
      AND (
        funcionarios.status IS DISTINCT FROM status_final
        OR (NEW.deleted_at IS NOT NULL AND funcionarios.deleted_at IS NULL)
      );
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Triggers
DROP TRIGGER IF EXISTS trg_sync_status_from_funcionarios ON funcionarios;
CREATE TRIGGER trg_sync_status_from_funcionarios
AFTER UPDATE OF status, deleted_at ON funcionarios
FOR EACH ROW
EXECUTE FUNCTION sync_status_usuarios_funcionarios();

DROP TRIGGER IF EXISTS trg_sync_status_from_usuarios ON usuarios;
CREATE TRIGGER trg_sync_status_from_usuarios
AFTER INSERT OR UPDATE OF status, funcionario_id, deleted_at ON usuarios
FOR EACH ROW
EXECUTE FUNCTION sync_status_usuarios_funcionarios();

COMMIT;
