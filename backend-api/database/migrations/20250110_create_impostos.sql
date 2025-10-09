-- Criar tabela de impostos
CREATE TABLE IF NOT EXISTS impostos_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ISS', 'ICMS', 'PIS', 'COFINS', 'IRPJ', 'CSLL', 'INSS', 'OUTRO')),
  descricao VARCHAR(500) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  valor_base DECIMAL(12,2) NOT NULL,
  aliquota DECIMAL(5,2) NOT NULL,
  competencia CHAR(7) NOT NULL, -- YYYY-MM
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  referencia VARCHAR(255),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de pagamentos de impostos
CREATE TABLE IF NOT EXISTS impostos_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imposto_id UUID NOT NULL REFERENCES impostos_financeiros(id) ON DELETE CASCADE,
  valor_pago DECIMAL(12,2) NOT NULL,
  data_pagamento DATE NOT NULL,
  forma_pagamento VARCHAR(100) NOT NULL,
  comprovante VARCHAR(500),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_impostos_tipo ON impostos_financeiros(tipo);
CREATE INDEX IF NOT EXISTS idx_impostos_competencia ON impostos_financeiros(competencia);
CREATE INDEX IF NOT EXISTS idx_impostos_status ON impostos_financeiros(status);
CREATE INDEX IF NOT EXISTS idx_impostos_data_vencimento ON impostos_financeiros(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_impostos_pagamentos_imposto_id ON impostos_pagamentos(imposto_id);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_impostos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_impostos_updated_at
  BEFORE UPDATE ON impostos_financeiros
  FOR EACH ROW
  EXECUTE FUNCTION update_impostos_updated_at();

-- Comentários nas colunas
COMMENT ON TABLE impostos_financeiros IS 'Tabela de controle de impostos';
COMMENT ON COLUMN impostos_financeiros.tipo IS 'Tipo de imposto: ISS, ICMS, PIS, COFINS, etc';
COMMENT ON COLUMN impostos_financeiros.competencia IS 'Mês/ano de competência (YYYY-MM)';
COMMENT ON COLUMN impostos_financeiros.valor_base IS 'Valor base para cálculo do imposto';
COMMENT ON COLUMN impostos_financeiros.aliquota IS 'Alíquota aplicada (%)';
COMMENT ON COLUMN impostos_financeiros.status IS 'Status: pendente, pago, atrasado ou cancelado';

COMMENT ON TABLE impostos_pagamentos IS 'Tabela de registro de pagamentos de impostos';
COMMENT ON COLUMN impostos_pagamentos.forma_pagamento IS 'Forma de pagamento (boleto, PIX, TED, etc)';

