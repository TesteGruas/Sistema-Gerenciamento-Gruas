-- Migration: Criar tabelas para sistema de manutenções
-- Data: 2025-01-23

-- Criar tabela manutencoes_ordens
CREATE TABLE IF NOT EXISTS manutencoes_ordens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grua_id VARCHAR NOT NULL REFERENCES gruas(id) ON DELETE CASCADE,
  obra_id INTEGER REFERENCES obras(id) ON DELETE SET NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('preventiva', 'corretiva', 'preditiva', 'emergencial')),
  descricao TEXT NOT NULL,
  responsavel_tecnico_id INTEGER REFERENCES funcionarios(id),
  data_prevista DATE,
  prioridade VARCHAR(20) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
  status VARCHAR(20) DEFAULT 'agendada' CHECK (status IN ('agendada', 'em_andamento', 'concluida', 'cancelada', 'pausada')),
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_fim TIMESTAMP WITH TIME ZONE,
  horas_trabalhadas NUMERIC(10,2) DEFAULT 0,
  custo_mao_obra NUMERIC(12,2) DEFAULT 0,
  custo_total NUMERIC(12,2) DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para manutencoes_ordens
CREATE INDEX IF NOT EXISTS idx_manutencoes_ordens_grua_id ON manutencoes_ordens(grua_id);
CREATE INDEX IF NOT EXISTS idx_manutencoes_ordens_obra_id ON manutencoes_ordens(obra_id);
CREATE INDEX IF NOT EXISTS idx_manutencoes_ordens_tipo ON manutencoes_ordens(tipo);
CREATE INDEX IF NOT EXISTS idx_manutencoes_ordens_status ON manutencoes_ordens(status);
CREATE INDEX IF NOT EXISTS idx_manutencoes_ordens_data_prevista ON manutencoes_ordens(data_prevista);
CREATE INDEX IF NOT EXISTS idx_manutencoes_ordens_responsavel_tecnico_id ON manutencoes_ordens(responsavel_tecnico_id);

-- Criar trigger para atualizar updated_at em manutencoes_ordens
CREATE OR REPLACE FUNCTION update_manutencoes_ordens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_manutencoes_ordens_updated_at
  BEFORE UPDATE ON manutencoes_ordens
  FOR EACH ROW
  EXECUTE FUNCTION update_manutencoes_ordens_updated_at();

-- Criar tabela manutencoes_itens
CREATE TABLE IF NOT EXISTS manutencoes_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manutencao_id UUID NOT NULL REFERENCES manutencoes_ordens(id) ON DELETE CASCADE,
  produto_id VARCHAR REFERENCES produtos(id) ON DELETE SET NULL,
  descricao VARCHAR(255) NOT NULL,
  quantidade NUMERIC(10,2) NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(12,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para manutencoes_itens
CREATE INDEX IF NOT EXISTS idx_manutencoes_itens_manutencao_id ON manutencoes_itens(manutencao_id);
CREATE INDEX IF NOT EXISTS idx_manutencoes_itens_produto_id ON manutencoes_itens(produto_id);

-- Criar trigger para atualizar updated_at em manutencoes_itens
CREATE OR REPLACE FUNCTION update_manutencoes_itens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_manutencoes_itens_updated_at
  BEFORE UPDATE ON manutencoes_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_manutencoes_itens_updated_at();

-- Criar tabela manutencoes_anexos
CREATE TABLE IF NOT EXISTS manutencoes_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manutencao_id UUID NOT NULL REFERENCES manutencoes_ordens(id) ON DELETE CASCADE,
  arquivo VARCHAR(500) NOT NULL,
  tipo VARCHAR(50),
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para manutencoes_anexos
CREATE INDEX IF NOT EXISTS idx_manutencoes_anexos_manutencao_id ON manutencoes_anexos(manutencao_id);

-- Criar tabela manutencoes_agenda_preventiva
CREATE TABLE IF NOT EXISTS manutencoes_agenda_preventiva (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grua_id VARCHAR NOT NULL REFERENCES gruas(id) ON DELETE CASCADE,
  tipo_manutencao VARCHAR(100) NOT NULL,
  intervalo_tipo VARCHAR(20) NOT NULL CHECK (intervalo_tipo IN ('horas', 'dias', 'meses', 'km')),
  intervalo_valor INTEGER NOT NULL,
  ultima_manutencao_horimetro INTEGER,
  ultima_manutencao_data DATE,
  proxima_manutencao_horimetro INTEGER,
  proxima_manutencao_data DATE,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para manutencoes_agenda_preventiva
CREATE INDEX IF NOT EXISTS idx_manutencoes_agenda_preventiva_grua_id ON manutencoes_agenda_preventiva(grua_id);
CREATE INDEX IF NOT EXISTS idx_manutencoes_agenda_preventiva_ativo ON manutencoes_agenda_preventiva(ativo);
CREATE INDEX IF NOT EXISTS idx_manutencoes_agenda_preventiva_proxima_data ON manutencoes_agenda_preventiva(proxima_manutencao_data);

-- Criar trigger para atualizar updated_at em manutencoes_agenda_preventiva
CREATE OR REPLACE FUNCTION update_manutencoes_agenda_preventiva_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_manutencoes_agenda_preventiva_updated_at
  BEFORE UPDATE ON manutencoes_agenda_preventiva
  FOR EACH ROW
  EXECUTE FUNCTION update_manutencoes_agenda_preventiva_updated_at();

-- Comentários nas tabelas
COMMENT ON TABLE manutencoes_ordens IS 'Ordens de manutenção de gruas';
COMMENT ON TABLE manutencoes_itens IS 'Peças e materiais utilizados nas manutenções';
COMMENT ON TABLE manutencoes_anexos IS 'Anexos (fotos, documentos) das manutenções';
COMMENT ON TABLE manutencoes_agenda_preventiva IS 'Agenda de manutenções preventivas programadas';

