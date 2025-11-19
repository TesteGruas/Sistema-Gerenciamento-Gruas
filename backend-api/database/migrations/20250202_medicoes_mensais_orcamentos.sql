-- Migration: Módulo de Medições Mensais Integrado com Orçamentos
-- Data: 2025-02-02
-- Descrição: Cria estrutura completa de medições mensais com integração automática com orçamentos

-- Criar tabela principal de medições mensais
CREATE TABLE IF NOT EXISTS medicoes_mensais (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  numero VARCHAR(50) NOT NULL,
  periodo VARCHAR(7) NOT NULL CHECK (periodo ~ '^\d{4}-\d{2}$'), -- Formato YYYY-MM
  data_medicao DATE NOT NULL,
  mes_referencia INTEGER NOT NULL CHECK (mes_referencia >= 1 AND mes_referencia <= 12),
  ano_referencia INTEGER NOT NULL CHECK (ano_referencia >= 2000),
  
  -- Valores calculados automaticamente
  valor_mensal_bruto DECIMAL(12,2) NOT NULL DEFAULT 0,
  valor_aditivos DECIMAL(12,2) NOT NULL DEFAULT 0,
  valor_custos_extras DECIMAL(12,2) NOT NULL DEFAULT 0,
  valor_descontos DECIMAL(12,2) NOT NULL DEFAULT 0,
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Status e controle
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'finalizada', 'cancelada', 'enviada')),
  data_finalizacao TIMESTAMP,
  data_envio TIMESTAMP,
  
  -- Observações
  observacoes TEXT,
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES usuarios(id),
  updated_by INTEGER REFERENCES usuarios(id),
  
  -- Garantir unicidade: uma medição por orçamento/mês
  UNIQUE(orcamento_id, periodo)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_medicoes_mensais_orcamento_id ON medicoes_mensais(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_medicoes_mensais_periodo ON medicoes_mensais(periodo);
CREATE INDEX IF NOT EXISTS idx_medicoes_mensais_status ON medicoes_mensais(status);
CREATE INDEX IF NOT EXISTS idx_medicoes_mensais_data_medicao ON medicoes_mensais(data_medicao);

-- Criar tabela para itens de custos mensais da medição
CREATE TABLE IF NOT EXISTS medicao_custos_mensais (
  id SERIAL PRIMARY KEY,
  medicao_id INTEGER NOT NULL REFERENCES medicoes_mensais(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  valor_mensal DECIMAL(12,2) NOT NULL,
  quantidade_meses DECIMAL(4,2) DEFAULT 1, -- Para frações de mês
  valor_total DECIMAL(12,2) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medicao_custos_mensais_medicao_id ON medicao_custos_mensais(medicao_id);

-- Criar tabela para horas extras da medição
CREATE TABLE IF NOT EXISTS medicao_horas_extras (
  id SERIAL PRIMARY KEY,
  medicao_id INTEGER NOT NULL REFERENCES medicoes_mensais(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('operador', 'sinaleiro', 'equipamento')),
  dia_semana VARCHAR(20) NOT NULL CHECK (dia_semana IN ('sabado', 'domingo_feriado', 'normal')),
  quantidade_horas DECIMAL(10,2) NOT NULL,
  valor_hora DECIMAL(12,2) NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medicao_horas_extras_medicao_id ON medicao_horas_extras(medicao_id);

-- Criar tabela para serviços adicionais da medição
CREATE TABLE IF NOT EXISTS medicao_servicos_adicionais (
  id SERIAL PRIMARY KEY,
  medicao_id INTEGER NOT NULL REFERENCES medicoes_mensais(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  quantidade DECIMAL(10,2) DEFAULT 1,
  valor_unitario DECIMAL(12,2) NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medicao_servicos_adicionais_medicao_id ON medicao_servicos_adicionais(medicao_id);

-- Criar tabela para aditivos do cliente na medição
CREATE TABLE IF NOT EXISTS medicao_aditivos (
  id SERIAL PRIMARY KEY,
  medicao_id INTEGER NOT NULL REFERENCES medicoes_mensais(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('adicional', 'desconto')),
  descricao VARCHAR(255) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medicao_aditivos_medicao_id ON medicao_aditivos(medicao_id);

-- Adicionar campo de total acumulado de faturamento no orçamento
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS total_faturado_acumulado DECIMAL(12,2) DEFAULT 0;

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS ultima_medicao_periodo VARCHAR(7);

-- Criar função para calcular valor total da medição automaticamente
CREATE OR REPLACE FUNCTION calcular_valor_total_medicao()
RETURNS TRIGGER AS $$
DECLARE
  v_valor_total DECIMAL(12,2);
  v_valor_mensal_bruto DECIMAL(12,2);
  v_valor_aditivos DECIMAL(12,2);
  v_valor_custos_extras DECIMAL(12,2);
  v_valor_descontos DECIMAL(12,2);
BEGIN
  -- Obter valores da própria medição
  v_valor_mensal_bruto := COALESCE(NEW.valor_mensal_bruto, 0);
  v_valor_aditivos := COALESCE(NEW.valor_aditivos, 0);
  v_valor_custos_extras := COALESCE(NEW.valor_custos_extras, 0);
  v_valor_descontos := COALESCE(NEW.valor_descontos, 0);
  
  -- Calcular total
  v_valor_total := v_valor_mensal_bruto + v_valor_aditivos + v_valor_custos_extras - v_valor_descontos;
  
  -- Atualizar valor total
  NEW.valor_total := v_valor_total;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para calcular valor total automaticamente
DROP TRIGGER IF EXISTS trigger_calcular_valor_total_medicao ON medicoes_mensais;
CREATE TRIGGER trigger_calcular_valor_total_medicao
  BEFORE INSERT OR UPDATE ON medicoes_mensais
  FOR EACH ROW
  EXECUTE FUNCTION calcular_valor_total_medicao();

-- Criar função para atualizar total acumulado no orçamento quando medição é finalizada
CREATE OR REPLACE FUNCTION atualizar_total_faturado_orcamento()
RETURNS TRIGGER AS $$
DECLARE
  v_total_acumulado DECIMAL(12,2);
BEGIN
  -- Só atualizar se a medição foi finalizada
  IF NEW.status = 'finalizada' AND (OLD.status IS NULL OR OLD.status != 'finalizada') THEN
    -- Calcular total acumulado de todas as medições finalizadas deste orçamento
    SELECT COALESCE(SUM(valor_total), 0) INTO v_total_acumulado
    FROM medicoes_mensais
    WHERE orcamento_id = NEW.orcamento_id
      AND status = 'finalizada';
    
    -- Atualizar orçamento
    UPDATE orcamentos
    SET 
      total_faturado_acumulado = v_total_acumulado,
      ultima_medicao_periodo = NEW.periodo,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.orcamento_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar orçamento quando medição é finalizada
DROP TRIGGER IF EXISTS trigger_atualizar_total_faturado_orcamento ON medicoes_mensais;
CREATE TRIGGER trigger_atualizar_total_faturado_orcamento
  AFTER INSERT OR UPDATE ON medicoes_mensais
  FOR EACH ROW
  WHEN (NEW.status = 'finalizada')
  EXECUTE FUNCTION atualizar_total_faturado_orcamento();

-- Criar função para recalcular valores da medição baseado nos itens
CREATE OR REPLACE FUNCTION recalcular_valores_medicao(p_medicao_id INTEGER)
RETURNS VOID AS $$
DECLARE
  v_valor_mensal_bruto DECIMAL(12,2);
  v_valor_custos_extras DECIMAL(12,2);
  v_valor_aditivos DECIMAL(12,2);
  v_valor_descontos DECIMAL(12,2);
BEGIN
  -- Calcular valor mensal bruto (soma dos custos mensais)
  SELECT COALESCE(SUM(valor_total), 0) INTO v_valor_mensal_bruto
  FROM medicao_custos_mensais
  WHERE medicao_id = p_medicao_id;
  
  -- Calcular custos extras (horas extras + serviços adicionais)
  SELECT COALESCE(SUM(valor_total), 0) INTO v_valor_custos_extras
  FROM (
    SELECT valor_total FROM medicao_horas_extras WHERE medicao_id = p_medicao_id
    UNION ALL
    SELECT valor_total FROM medicao_servicos_adicionais WHERE medicao_id = p_medicao_id
  ) AS extras;
  
  -- Calcular aditivos (apenas adicionais)
  SELECT COALESCE(SUM(valor), 0) INTO v_valor_aditivos
  FROM medicao_aditivos
  WHERE medicao_id = p_medicao_id AND tipo = 'adicional';
  
  -- Calcular descontos
  SELECT COALESCE(SUM(ABS(valor)), 0) INTO v_valor_descontos
  FROM medicao_aditivos
  WHERE medicao_id = p_medicao_id AND tipo = 'desconto';
  
  -- Atualizar medição
  UPDATE medicoes_mensais
  SET 
    valor_mensal_bruto = v_valor_mensal_bruto,
    valor_custos_extras = v_valor_custos_extras,
    valor_aditivos = v_valor_aditivos,
    valor_descontos = v_valor_descontos,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_medicao_id;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para recalcular valores quando itens são alterados
CREATE OR REPLACE FUNCTION trigger_recalcular_medicao()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalcular_valores_medicao(OLD.medicao_id);
    RETURN OLD;
  ELSE
    PERFORM recalcular_valores_medicao(NEW.medicao_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas de itens
DROP TRIGGER IF EXISTS trigger_recalcular_medicao_custos ON medicao_custos_mensais;
CREATE TRIGGER trigger_recalcular_medicao_custos
  AFTER INSERT OR UPDATE OR DELETE ON medicao_custos_mensais
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalcular_medicao();

DROP TRIGGER IF EXISTS trigger_recalcular_medicao_horas ON medicao_horas_extras;
CREATE TRIGGER trigger_recalcular_medicao_horas
  AFTER INSERT OR UPDATE OR DELETE ON medicao_horas_extras
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalcular_medicao();

DROP TRIGGER IF EXISTS trigger_recalcular_medicao_servicos ON medicao_servicos_adicionais;
CREATE TRIGGER trigger_recalcular_medicao_servicos
  AFTER INSERT OR UPDATE OR DELETE ON medicao_servicos_adicionais
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalcular_medicao();

DROP TRIGGER IF EXISTS trigger_recalcular_medicao_aditivos ON medicao_aditivos;
CREATE TRIGGER trigger_recalcular_medicao_aditivos
  AFTER INSERT OR UPDATE OR DELETE ON medicao_aditivos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalcular_medicao();

-- Comentários
COMMENT ON TABLE medicoes_mensais IS 'Medições mensais de orçamentos com cálculo automático de valores';
COMMENT ON COLUMN medicoes_mensais.valor_mensal_bruto IS 'Valor mensal bruto (soma dos custos mensais do orçamento)';
COMMENT ON COLUMN medicoes_mensais.valor_aditivos IS 'Valor de aditivos do cliente (adicionais)';
COMMENT ON COLUMN medicoes_mensais.valor_custos_extras IS 'Valor de custos extras (horas extras + serviços adicionais)';
COMMENT ON COLUMN medicoes_mensais.valor_descontos IS 'Valor de descontos aplicados';
COMMENT ON COLUMN medicoes_mensais.valor_total IS 'Valor total calculado: mensal_bruto + aditivos + custos_extras - descontos';
COMMENT ON COLUMN orcamentos.total_faturado_acumulado IS 'Total acumulado de faturamento (soma de todas as medições finalizadas)';
COMMENT ON COLUMN orcamentos.ultima_medicao_periodo IS 'Período da última medição finalizada (formato YYYY-MM)';

