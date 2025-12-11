-- Migration: Medições Vinculadas a Gruas
-- Data: 2025-02-26
-- Descrição: Adiciona suporte para vincular medições diretamente a gruas

-- Adicionar coluna grua_id para vincular medições diretamente à grua
-- Nota: gruas.id é VARCHAR no banco (mesmo padrão usado em manutencoes_ordens e outras tabelas)
ALTER TABLE medicoes_mensais 
  ADD COLUMN IF NOT EXISTS grua_id VARCHAR REFERENCES gruas(id) ON DELETE CASCADE;

-- Criar índice para melhorar performance de consultas por grua
CREATE INDEX IF NOT EXISTS idx_medicoes_mensais_grua_id 
  ON medicoes_mensais(grua_id);

-- Adicionar campos para aprovação do cliente
ALTER TABLE medicoes_mensais 
  ADD COLUMN IF NOT EXISTS status_aprovacao VARCHAR(20) DEFAULT NULL 
    CHECK (status_aprovacao IN ('pendente', 'aprovada', 'rejeitada'));
  
ALTER TABLE medicoes_mensais 
  ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMP;

ALTER TABLE medicoes_mensais 
  ADD COLUMN IF NOT EXISTS aprovado_por INTEGER REFERENCES usuarios(id);

ALTER TABLE medicoes_mensais 
  ADD COLUMN IF NOT EXISTS observacoes_aprovacao TEXT;

-- Adicionar campo para indicar se a medição pode ser editada
ALTER TABLE medicoes_mensais 
  ADD COLUMN IF NOT EXISTS editavel BOOLEAN DEFAULT TRUE;

-- Criar tabela para anexos de aprovação do cliente
CREATE TABLE IF NOT EXISTS medicao_anexos_aprovacao (
  id SERIAL PRIMARY KEY,
  medicao_id INTEGER NOT NULL REFERENCES medicoes_mensais(id) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  caminho_arquivo VARCHAR(500) NOT NULL,
  tipo_arquivo VARCHAR(50),
  tamanho_bytes BIGINT,
  uploaded_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medicao_anexos_aprovacao_medicao_id 
  ON medicao_anexos_aprovacao(medicao_id);

-- Criar tabela para documentos gerados (NF Serviço, NF Locação, Boleto)
CREATE TABLE IF NOT EXISTS medicao_documentos (
  id SERIAL PRIMARY KEY,
  medicao_id INTEGER NOT NULL REFERENCES medicoes_mensais(id) ON DELETE CASCADE,
  tipo_documento VARCHAR(50) NOT NULL CHECK (tipo_documento IN ('nf_servico', 'nf_locacao', 'boleto')),
  numero_documento VARCHAR(100),
  caminho_arquivo VARCHAR(500),
  data_emissao DATE,
  data_vencimento DATE,
  valor DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'gerado', 'enviado', 'pago', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medicao_documentos_medicao_id 
  ON medicao_documentos(medicao_id);
  
CREATE INDEX IF NOT EXISTS idx_medicao_documentos_tipo 
  ON medicao_documentos(tipo_documento);

-- Atualizar constraint de unicidade para considerar grua_id
-- Permitir uma medição por grua/período
CREATE UNIQUE INDEX IF NOT EXISTS medicoes_mensais_grua_periodo_unique 
  ON medicoes_mensais(grua_id, periodo) 
  WHERE grua_id IS NOT NULL;

-- Atualizar constraint de obra_ou_orcamento para incluir grua_id
ALTER TABLE medicoes_mensais 
  DROP CONSTRAINT IF EXISTS medicoes_mensais_obra_ou_orcamento_check;

ALTER TABLE medicoes_mensais 
  ADD CONSTRAINT medicoes_mensais_obra_ou_orcamento_ou_grua_check 
  CHECK (
    (obra_id IS NOT NULL AND orcamento_id IS NULL AND grua_id IS NULL) OR 
    (obra_id IS NULL AND orcamento_id IS NOT NULL AND grua_id IS NULL) OR
    (obra_id IS NULL AND orcamento_id IS NULL AND grua_id IS NOT NULL) OR
    (obra_id IS NOT NULL AND orcamento_id IS NOT NULL AND grua_id IS NULL) OR
    (obra_id IS NOT NULL AND orcamento_id IS NULL AND grua_id IS NOT NULL) OR
    (obra_id IS NULL AND orcamento_id IS NOT NULL AND grua_id IS NOT NULL) OR
    (obra_id IS NOT NULL AND orcamento_id IS NOT NULL AND grua_id IS NOT NULL)
  );

-- Comentários
COMMENT ON COLUMN medicoes_mensais.grua_id IS 'ID da grua relacionada à medição';
COMMENT ON COLUMN medicoes_mensais.status_aprovacao IS 'Status de aprovação pelo cliente (pendente, aprovada, rejeitada)';
COMMENT ON COLUMN medicoes_mensais.editavel IS 'Indica se a medição pode ser editada (false após envio)';
