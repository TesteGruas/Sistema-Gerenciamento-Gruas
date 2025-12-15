-- Migration: Criar tabela de itens para custos mensais
-- Data: 2025-02-27
-- Descrição: Cria tabela para armazenar itens padronizados que podem ser usados em custos mensais

-- Criar tabela de itens de custos mensais
CREATE TABLE IF NOT EXISTS itens_custos_mensais (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE, -- Ex: 01.01, 01.02, etc.
  descricao VARCHAR(255) NOT NULL,
  unidade VARCHAR(20) NOT NULL DEFAULT 'mês', -- mês, und, und., km, h, hora, kg, m², m³
  tipo VARCHAR(20) NOT NULL DEFAULT 'contrato', -- contrato, aditivo
  categoria VARCHAR(50), -- funcionario, horas_extras, servico, produto
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES usuarios(id),
  updated_by INTEGER REFERENCES usuarios(id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_itens_custos_mensais_codigo ON itens_custos_mensais(codigo);
CREATE INDEX IF NOT EXISTS idx_itens_custos_mensais_ativo ON itens_custos_mensais(ativo);
CREATE INDEX IF NOT EXISTS idx_itens_custos_mensais_tipo ON itens_custos_mensais(tipo);
CREATE INDEX IF NOT EXISTS idx_itens_custos_mensais_categoria ON itens_custos_mensais(categoria);

-- Comentários
COMMENT ON TABLE itens_custos_mensais IS 'Tabela de itens padronizados para custos mensais';
COMMENT ON COLUMN itens_custos_mensais.codigo IS 'Código do item (ex: 01.01, 01.02)';
COMMENT ON COLUMN itens_custos_mensais.descricao IS 'Descrição do item';
COMMENT ON COLUMN itens_custos_mensais.unidade IS 'Unidade de medida (mês, und, km, h, hora, etc.)';
COMMENT ON COLUMN itens_custos_mensais.tipo IS 'Tipo: contrato ou aditivo';
COMMENT ON COLUMN itens_custos_mensais.categoria IS 'Categoria: funcionario, horas_extras, servico, produto';

-- Inserir alguns itens padrão baseados no PDF
INSERT INTO itens_custos_mensais (codigo, descricao, unidade, tipo, categoria) VALUES
  ('01.01', 'Locação de grua torre', 'mês', 'contrato', 'servico'),
  ('01.02', 'Chumbador, base ou trilho', 'und', 'contrato', 'produto'),
  ('01.03', 'Transporte entrega', 'und', 'contrato', 'servico'),
  ('01.04', 'Custos de Operação', 'mês', 'contrato', 'servico'),
  ('01.05', 'Custos de Sinalização', 'mês', 'contrato', 'servico'),
  ('01.06', 'Montagem', 'und', 'contrato', 'servico'),
  ('01.07', 'Operador', 'mês', 'contrato', 'funcionario'),
  ('01.08', 'Sinaleiro', 'mês', 'contrato', 'funcionario'),
  ('01.09', 'Manutenção', 'mês', 'contrato', 'servico'),
  ('01.10', 'Desmontagem', 'und', 'contrato', 'servico'),
  ('01.11', 'Conjunto base', 'und', 'contrato', 'produto'),
  ('01.12', 'Ancoragens', 'und', 'contrato', 'produto'),
  ('01.13', 'Transporte retirada', 'und', 'contrato', 'servico'),
  ('01.14', 'ART instalação', 'und', 'contrato', 'servico'),
  ('01.15', 'Hora Extra Operador e sinaleiro', 'und.', 'aditivo', 'horas_extras'),
  ('01.16', 'Hora Extra Operador e sinaleiro 60%', 'und.', 'aditivo', 'horas_extras'),
  ('01.17', 'Hora Extra Operador e sinaleiro 100%', 'und', 'aditivo', 'horas_extras'),
  ('01.18', 'Hora Extra equipamento', 'und', 'aditivo', 'horas_extras'),
  ('01.19', 'Caixão de graude', 'und', 'aditivo', 'produto'),
  ('01.20', 'Caçamba de entulho', 'und', 'aditivo', 'produto'),
  ('01.21', 'Garfo 2500 kg com gaiola', 'und', 'aditivo', 'produto'),
  ('01.22', 'ART eletrica, mecanica, estabilidade, estrutura', 'und', 'aditivo', 'servico'),
  ('01.23', 'Hr Extra montagem ascenção sab,dom e fer', 'hora', 'aditivo', 'horas_extras'),
  ('01.24', 'Balde concreto 500 litros', 'mês', 'aditivo', 'produto'),
  ('01.25', 'Instalação de led no solo', 'und', 'aditivo', 'servico'),
  ('01.26', 'Plataforma de descarga', 'mês', 'aditivo', 'produto'),
  ('01.27', 'MDO fixação travamento grua', 'und', 'aditivo', 'servico'),
  ('01.28', 'Deslocamento ascensão', 'km', 'aditivo', 'servico')
ON CONFLICT (codigo) DO NOTHING;



