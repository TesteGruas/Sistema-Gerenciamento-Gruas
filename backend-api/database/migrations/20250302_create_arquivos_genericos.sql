-- Migration: Criar tabela genérica para armazenar arquivos de qualquer entidade
-- Data: 2025-03-02
-- Descrição: Permite anexar N arquivos em qualquer entidade do sistema (clientes, usuários, etc.)

CREATE TABLE IF NOT EXISTS arquivos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  nome_original VARCHAR(255) NOT NULL,
  caminho TEXT NOT NULL,
  tamanho BIGINT NOT NULL,
  tipo_mime VARCHAR(100) NOT NULL,
  extensao VARCHAR(10),
  modulo VARCHAR(50) NOT NULL,
  entidade_id INTEGER NOT NULL,
  entidade_tipo VARCHAR(50) NOT NULL,
  descricao TEXT,
  tags TEXT[], -- Array de tags
  publico BOOLEAN DEFAULT false,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_arquivos_entidade ON arquivos(entidade_tipo, entidade_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_modulo ON arquivos(modulo);
CREATE INDEX IF NOT EXISTS idx_arquivos_usuario ON arquivos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_publico ON arquivos(publico);

-- Comentários
COMMENT ON TABLE arquivos IS 'Tabela genérica para armazenar arquivos de qualquer entidade do sistema';
COMMENT ON COLUMN arquivos.nome IS 'Nome do arquivo (pode ser diferente do nome original)';
COMMENT ON COLUMN arquivos.nome_original IS 'Nome original do arquivo quando foi enviado';
COMMENT ON COLUMN arquivos.caminho IS 'Caminho ou URL do arquivo no storage';
COMMENT ON COLUMN arquivos.tamanho IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN arquivos.tipo_mime IS 'Tipo MIME do arquivo (ex: application/pdf)';
COMMENT ON COLUMN arquivos.extensao IS 'Extensão do arquivo (ex: pdf, docx)';
COMMENT ON COLUMN arquivos.modulo IS 'Módulo do sistema (ex: clientes, usuarios, obras)';
COMMENT ON COLUMN arquivos.entidade_id IS 'ID da entidade à qual o arquivo pertence';
COMMENT ON COLUMN arquivos.entidade_tipo IS 'Tipo da entidade (ex: cliente, usuario, obra)';
COMMENT ON COLUMN arquivos.descricao IS 'Descrição opcional do arquivo';
COMMENT ON COLUMN arquivos.tags IS 'Array de tags para categorização';
COMMENT ON COLUMN arquivos.publico IS 'Se o arquivo é público ou privado';
COMMENT ON COLUMN arquivos.usuario_id IS 'ID do usuário que fez o upload';







