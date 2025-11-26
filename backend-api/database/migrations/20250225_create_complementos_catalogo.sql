-- Migration: Criar tabela de catálogo de complementos
-- Data: 2025-02-25
-- Descrição: Tabela para gerenciar o catálogo de complementos (acessórios e serviços) usados em obras e orçamentos

-- Criar tabela de complementos
CREATE TABLE IF NOT EXISTS complementos_catalogo (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  sku VARCHAR(50) NOT NULL UNIQUE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('acessorio', 'servico')),
  tipo_precificacao VARCHAR(20) NOT NULL CHECK (tipo_precificacao IN ('mensal', 'unico', 'por_metro', 'por_hora', 'por_dia')),
  unidade VARCHAR(20) NOT NULL CHECK (unidade IN ('m', 'h', 'unidade', 'dia', 'mes')),
  preco_unitario_centavos INTEGER NOT NULL DEFAULT 0,
  fator DECIMAL(10,2),
  descricao TEXT,
  rule_key VARCHAR(100),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_complementos_catalogo_sku ON complementos_catalogo(sku);
CREATE INDEX IF NOT EXISTS idx_complementos_catalogo_tipo ON complementos_catalogo(tipo);
CREATE INDEX IF NOT EXISTS idx_complementos_catalogo_tipo_precificacao ON complementos_catalogo(tipo_precificacao);
CREATE INDEX IF NOT EXISTS idx_complementos_catalogo_ativo ON complementos_catalogo(ativo);
CREATE INDEX IF NOT EXISTS idx_complementos_catalogo_created_at ON complementos_catalogo(created_at);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_complementos_catalogo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_complementos_catalogo_updated_at
  BEFORE UPDATE ON complementos_catalogo
  FOR EACH ROW
  EXECUTE FUNCTION update_complementos_catalogo_updated_at();

-- Comentários nas colunas
COMMENT ON TABLE complementos_catalogo IS 'Catálogo de complementos (acessórios e serviços) disponíveis para uso em obras e orçamentos';
COMMENT ON COLUMN complementos_catalogo.id IS 'Identificador único do complemento';
COMMENT ON COLUMN complementos_catalogo.nome IS 'Nome do complemento';
COMMENT ON COLUMN complementos_catalogo.sku IS 'Código SKU único do complemento';
COMMENT ON COLUMN complementos_catalogo.tipo IS 'Tipo: acessorio ou servico';
COMMENT ON COLUMN complementos_catalogo.tipo_precificacao IS 'Tipo de precificação: mensal, unico, por_metro, por_hora, por_dia';
COMMENT ON COLUMN complementos_catalogo.unidade IS 'Unidade de medida: m, h, unidade, dia, mes';
COMMENT ON COLUMN complementos_catalogo.preco_unitario_centavos IS 'Preço unitário em centavos';
COMMENT ON COLUMN complementos_catalogo.fator IS 'Fator multiplicador (usado em precificações por metro/hora)';
COMMENT ON COLUMN complementos_catalogo.descricao IS 'Descrição detalhada do complemento';
COMMENT ON COLUMN complementos_catalogo.rule_key IS 'Chave de regra técnica (ex: estaiamento_por_altura, autotrafo_se_sem_380v)';
COMMENT ON COLUMN complementos_catalogo.ativo IS 'Indica se o complemento está ativo e disponível para uso';

