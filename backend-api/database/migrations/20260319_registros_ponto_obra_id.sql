-- Vincula registro de ponto à obra (facilita relatórios e notificações)
ALTER TABLE registros_ponto
  ADD COLUMN IF NOT EXISTS obra_id INTEGER REFERENCES obras(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_registros_ponto_obra_id ON registros_ponto(obra_id);
