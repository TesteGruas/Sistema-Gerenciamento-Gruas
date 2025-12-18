-- Criar tabela de tipos de impostos personalizados
CREATE TABLE IF NOT EXISTS tipos_impostos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao VARCHAR(500),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir tipos padrão
INSERT INTO tipos_impostos (nome, descricao, ativo) VALUES
  ('DAS', 'Documento de Arrecadação do Simples Nacional', true),
  ('DARF', 'Documento de Arrecadação de Receitas Federais', true),
  ('FGTS', 'Fundo de Garantia do Tempo de Serviço', true),
  ('INSS', 'Instituto Nacional do Seguro Social', true),
  ('TRIBUTOS MUNICIPAIS', 'Tributos e taxas municipais', true),
  ('TRIBUTOS ESTADUAIS', 'Tributos e taxas estaduais', true)
ON CONFLICT (nome) DO NOTHING;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_tipos_impostos_nome ON tipos_impostos(nome);
CREATE INDEX IF NOT EXISTS idx_tipos_impostos_ativo ON tipos_impostos(ativo);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_tipos_impostos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tipos_impostos_updated_at
  BEFORE UPDATE ON tipos_impostos
  FOR EACH ROW
  EXECUTE FUNCTION update_tipos_impostos_updated_at();

-- Comentários
COMMENT ON TABLE tipos_impostos IS 'Tabela de tipos de impostos personalizados';
COMMENT ON COLUMN tipos_impostos.nome IS 'Nome do tipo de imposto (ex: DAS, DARF, FGTS)';
COMMENT ON COLUMN tipos_impostos.descricao IS 'Descrição do tipo de imposto';
COMMENT ON COLUMN tipos_impostos.ativo IS 'Indica se o tipo está ativo';

