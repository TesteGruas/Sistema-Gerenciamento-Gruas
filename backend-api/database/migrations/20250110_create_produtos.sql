-- Criar tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('venda', 'locacao', 'servico')),
  preco DECIMAL(12,2) NOT NULL,
  preco_custo DECIMAL(12,2),
  unidade VARCHAR(50) NOT NULL,
  estoque INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 0,
  fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON produtos(tipo);
CREATE INDEX IF NOT EXISTS idx_produtos_status ON produtos(status);
CREATE INDEX IF NOT EXISTS idx_produtos_fornecedor_id ON produtos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_produtos_estoque ON produtos(estoque);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_produtos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_produtos_updated_at
  BEFORE UPDATE ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_produtos_updated_at();

-- Comentários nas colunas
COMMENT ON TABLE produtos IS 'Tabela de cadastro de produtos e serviços';
COMMENT ON COLUMN produtos.id IS 'Identificador único do produto';
COMMENT ON COLUMN produtos.nome IS 'Nome do produto/serviço';
COMMENT ON COLUMN produtos.tipo IS 'Tipo: venda, locacao ou servico';
COMMENT ON COLUMN produtos.preco IS 'Preço de venda/locação';
COMMENT ON COLUMN produtos.preco_custo IS 'Preço de custo (opcional)';
COMMENT ON COLUMN produtos.unidade IS 'Unidade de medida (un, kg, m, dia, mês)';
COMMENT ON COLUMN produtos.estoque IS 'Quantidade em estoque';
COMMENT ON COLUMN produtos.estoque_minimo IS 'Estoque mínimo para alerta';
COMMENT ON COLUMN produtos.status IS 'Status: ativo ou inativo';

