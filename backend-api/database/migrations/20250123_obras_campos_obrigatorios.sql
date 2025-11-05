-- Migration: Adicionar campos obrigatórios em obras e criar tabelas relacionadas
-- Data: 2025-01-23

-- Adicionar colunas na tabela obras
ALTER TABLE obras
ADD COLUMN IF NOT EXISTS cno VARCHAR(50),
ADD COLUMN IF NOT EXISTS art_numero VARCHAR(100),
ADD COLUMN IF NOT EXISTS art_arquivo VARCHAR(500),
ADD COLUMN IF NOT EXISTS apolice_numero VARCHAR(100),
ADD COLUMN IF NOT EXISTS apolice_arquivo VARCHAR(500);

-- Criar tabela responsaveis_tecnicos
CREATE TABLE IF NOT EXISTS responsaveis_tecnicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cpf_cnpj VARCHAR(20) NOT NULL,
  crea VARCHAR(50),
  email VARCHAR(255),
  telefone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para responsaveis_tecnicos
CREATE INDEX IF NOT EXISTS idx_responsaveis_tecnicos_obra_id ON responsaveis_tecnicos(obra_id);
CREATE INDEX IF NOT EXISTS idx_responsaveis_tecnicos_cpf_cnpj ON responsaveis_tecnicos(cpf_cnpj);

-- Criar trigger para atualizar updated_at em responsaveis_tecnicos
CREATE OR REPLACE FUNCTION update_responsaveis_tecnicos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_responsaveis_tecnicos_updated_at
  BEFORE UPDATE ON responsaveis_tecnicos
  FOR EACH ROW
  EXECUTE FUNCTION update_responsaveis_tecnicos_updated_at();

-- Criar tabela sinaleiros_obra
CREATE TABLE IF NOT EXISTS sinaleiros_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  rg_cpf VARCHAR(20) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(255),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('principal', 'reserva')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para sinaleiros_obra
CREATE INDEX IF NOT EXISTS idx_sinaleiros_obra_obra_id ON sinaleiros_obra(obra_id);
CREATE INDEX IF NOT EXISTS idx_sinaleiros_obra_tipo ON sinaleiros_obra(tipo);

-- Criar trigger para atualizar updated_at em sinaleiros_obra
CREATE OR REPLACE FUNCTION update_sinaleiros_obra_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sinaleiros_obra_updated_at
  BEFORE UPDATE ON sinaleiros_obra
  FOR EACH ROW
  EXECUTE FUNCTION update_sinaleiros_obra_updated_at();

-- Criar tabela documentos_sinaleiro
CREATE TABLE IF NOT EXISTS documentos_sinaleiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sinaleiro_id UUID NOT NULL REFERENCES sinaleiros_obra(id) ON DELETE CASCADE,
  tipo VARCHAR(100) NOT NULL,
  arquivo VARCHAR(500) NOT NULL,
  data_validade DATE,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'vencido')),
  aprovado_por INTEGER REFERENCES usuarios(id),
  aprovado_em TIMESTAMP WITH TIME ZONE,
  alerta_enviado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para documentos_sinaleiro
CREATE INDEX IF NOT EXISTS idx_documentos_sinaleiro_sinaleiro_id ON documentos_sinaleiro(sinaleiro_id);
CREATE INDEX IF NOT EXISTS idx_documentos_sinaleiro_status ON documentos_sinaleiro(status);
CREATE INDEX IF NOT EXISTS idx_documentos_sinaleiro_data_validade ON documentos_sinaleiro(data_validade);

-- Comentários nas tabelas
COMMENT ON TABLE responsaveis_tecnicos IS 'Responsáveis técnicos vinculados às obras';
COMMENT ON TABLE sinaleiros_obra IS 'Sinaleiros (principal e reserva) vinculados às obras';
COMMENT ON TABLE documentos_sinaleiro IS 'Documentos dos sinaleiros com controle de validade e aprovação';

