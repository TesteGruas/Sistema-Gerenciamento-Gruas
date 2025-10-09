-- Criar tabela de fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(20) NOT NULL UNIQUE,
  contato VARCHAR(255),
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco VARCHAR(500),
  cidade VARCHAR(100),
  estado CHAR(2),
  cep VARCHAR(10),
  categoria VARCHAR(100),
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj ON fornecedores(cnpj);
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores(nome);
CREATE INDEX IF NOT EXISTS idx_fornecedores_status ON fornecedores(status);
CREATE INDEX IF NOT EXISTS idx_fornecedores_categoria ON fornecedores(categoria);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_fornecedores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fornecedores_updated_at
  BEFORE UPDATE ON fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION update_fornecedores_updated_at();

-- Comentários nas colunas
COMMENT ON TABLE fornecedores IS 'Tabela de cadastro de fornecedores';
COMMENT ON COLUMN fornecedores.id IS 'Identificador único do fornecedor';
COMMENT ON COLUMN fornecedores.nome IS 'Nome/Razão social do fornecedor';
COMMENT ON COLUMN fornecedores.cnpj IS 'CNPJ do fornecedor (único)';
COMMENT ON COLUMN fornecedores.status IS 'Status do fornecedor: ativo ou inativo';

