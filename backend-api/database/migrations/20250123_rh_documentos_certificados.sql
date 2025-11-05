-- Migration: Criar tabelas de documentos e certificados do RH
-- Data: 2025-01-23

-- Criar tabela certificados_colaboradores
CREATE TABLE IF NOT EXISTS certificados_colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  tipo VARCHAR(100) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  data_validade DATE,
  arquivo VARCHAR(500),
  alerta_enviado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para certificados_colaboradores
CREATE INDEX IF NOT EXISTS idx_certificados_colaboradores_funcionario_id ON certificados_colaboradores(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_certificados_colaboradores_data_validade ON certificados_colaboradores(data_validade);
CREATE INDEX IF NOT EXISTS idx_certificados_colaboradores_tipo ON certificados_colaboradores(tipo);

-- Criar trigger para atualizar updated_at em certificados_colaboradores
CREATE OR REPLACE FUNCTION update_certificados_colaboradores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_certificados_colaboradores_updated_at
  BEFORE UPDATE ON certificados_colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION update_certificados_colaboradores_updated_at();

-- Criar tabela documentos_admissionais
CREATE TABLE IF NOT EXISTS documentos_admissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  tipo VARCHAR(100) NOT NULL,
  data_validade DATE,
  arquivo VARCHAR(500),
  alerta_enviado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para documentos_admissionais
CREATE INDEX IF NOT EXISTS idx_documentos_admissionais_funcionario_id ON documentos_admissionais(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_documentos_admissionais_data_validade ON documentos_admissionais(data_validade);
CREATE INDEX IF NOT EXISTS idx_documentos_admissionais_tipo ON documentos_admissionais(tipo);

-- Criar trigger para atualizar updated_at em documentos_admissionais
CREATE OR REPLACE FUNCTION update_documentos_admissionais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_documentos_admissionais_updated_at
  BEFORE UPDATE ON documentos_admissionais
  FOR EACH ROW
  EXECUTE FUNCTION update_documentos_admissionais_updated_at();

-- Criar tabela holerites
CREATE TABLE IF NOT EXISTS holerites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  mes_referencia VARCHAR(7) NOT NULL CHECK (mes_referencia ~ '^\d{4}-\d{2}$'),
  arquivo VARCHAR(500) NOT NULL,
  assinatura_digital TEXT,
  assinado_em TIMESTAMP WITH TIME ZONE,
  assinado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para holerites
CREATE INDEX IF NOT EXISTS idx_holerites_funcionario_id ON holerites(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_holerites_mes_referencia ON holerites(mes_referencia);
CREATE UNIQUE INDEX IF NOT EXISTS idx_holerites_funcionario_mes_unique ON holerites(funcionario_id, mes_referencia);

-- Criar trigger para atualizar updated_at em holerites
CREATE OR REPLACE FUNCTION update_holerites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_holerites_updated_at
  BEFORE UPDATE ON holerites
  FOR EACH ROW
  EXECUTE FUNCTION update_holerites_updated_at();

-- Adicionar coluna acesso_global_obras na tabela cargos
ALTER TABLE cargos
ADD COLUMN IF NOT EXISTS acesso_global_obras BOOLEAN DEFAULT FALSE;

-- Criar índice para acesso_global_obras
CREATE INDEX IF NOT EXISTS idx_cargos_acesso_global_obras ON cargos(acesso_global_obras);

-- Comentários nas tabelas
COMMENT ON TABLE certificados_colaboradores IS 'Certificados e qualificações dos colaboradores com controle de validade';
COMMENT ON TABLE documentos_admissionais IS 'Documentos admissionais dos funcionários com controle de validade';
COMMENT ON TABLE holerites IS 'Holerites dos funcionários com assinatura digital';
COMMENT ON COLUMN cargos.acesso_global_obras IS 'Se TRUE, cargo tem acesso a todas as obras sem filtro por obra específica';

