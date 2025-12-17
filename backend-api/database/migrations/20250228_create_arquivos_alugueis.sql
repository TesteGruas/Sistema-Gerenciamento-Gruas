-- Migration: Criar tabela para armazenar múltiplos arquivos de aluguéis
-- Data: 2025-02-28
-- Descrição: Permite anexar N arquivos em um aluguel

CREATE TABLE IF NOT EXISTS arquivos_alugueis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluguel_id UUID NOT NULL REFERENCES alugueis_residencias(id) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  caminho_arquivo TEXT NOT NULL,
  tipo_arquivo VARCHAR(100),
  tamanho_arquivo BIGINT, -- em bytes
  categoria VARCHAR(50) DEFAULT 'contrato', -- contrato, recibo, foto, outro
  descricao TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by INTEGER REFERENCES usuarios(id),
  updated_by INTEGER REFERENCES usuarios(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_arquivos_aluguel_id ON arquivos_alugueis(aluguel_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_categoria ON arquivos_alugueis(categoria);

-- Comentários
COMMENT ON TABLE arquivos_alugueis IS 'Armazena múltiplos arquivos anexados a aluguéis';
COMMENT ON COLUMN arquivos_alugueis.aluguel_id IS 'ID do aluguel ao qual o arquivo pertence';
COMMENT ON COLUMN arquivos_alugueis.nome_arquivo IS 'Nome original do arquivo';
COMMENT ON COLUMN arquivos_alugueis.caminho_arquivo IS 'Caminho ou URL do arquivo no servidor';
COMMENT ON COLUMN arquivos_alugueis.tipo_arquivo IS 'MIME type do arquivo';
COMMENT ON COLUMN arquivos_alugueis.tamanho_arquivo IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN arquivos_alugueis.categoria IS 'Categoria do arquivo: contrato, recibo, foto, outro';

