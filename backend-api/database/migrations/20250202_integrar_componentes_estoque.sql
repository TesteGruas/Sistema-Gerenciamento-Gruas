-- Migration: Integração de Componentes com Estoque
-- Data: 2025-02-02
-- Descrição: Integra componentes de gruas com o módulo de estoque

-- Adicionar campo componente_id na tabela estoque (para referenciar componentes de gruas)
ALTER TABLE estoque 
ADD COLUMN IF NOT EXISTS componente_id INTEGER REFERENCES grua_componentes(id) ON DELETE CASCADE;

-- Adicionar índice para componente_id
CREATE INDEX IF NOT EXISTS idx_estoque_componente_id ON estoque(componente_id);

-- Adicionar campo tipo_item na tabela estoque para diferenciar produtos de componentes
ALTER TABLE estoque 
ADD COLUMN IF NOT EXISTS tipo_item VARCHAR(20) DEFAULT 'produto' CHECK (tipo_item IN ('produto', 'componente'));

-- Adicionar índice para tipo_item
CREATE INDEX IF NOT EXISTS idx_estoque_tipo_item ON estoque(tipo_item);

-- Adicionar campo componente_id na tabela movimentacoes_estoque
ALTER TABLE movimentacoes_estoque 
ADD COLUMN IF NOT EXISTS componente_id INTEGER REFERENCES grua_componentes(id) ON DELETE SET NULL;

-- Adicionar índice para componente_id em movimentacoes
CREATE INDEX IF NOT EXISTS idx_movimentacoes_componente_id ON movimentacoes_estoque(componente_id);

-- Comentários
COMMENT ON COLUMN estoque.componente_id IS 'ID do componente de grua quando tipo_item = componente';
COMMENT ON COLUMN estoque.tipo_item IS 'Tipo do item: produto ou componente';
COMMENT ON COLUMN movimentacoes_estoque.componente_id IS 'ID do componente relacionado à movimentação';

-- Função para sincronizar componente com estoque
CREATE OR REPLACE FUNCTION sincronizar_componente_estoque()
RETURNS TRIGGER AS $$
BEGIN
  -- Se é um novo componente ou quantidade foi alterada
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.quantidade_disponivel != NEW.quantidade_disponivel OR OLD.quantidade_em_uso != NEW.quantidade_em_uso)) THEN
    -- Verificar se já existe registro de estoque para este componente
    IF NOT EXISTS (SELECT 1 FROM estoque WHERE componente_id = NEW.id) THEN
      -- Criar registro de estoque para o componente
      INSERT INTO estoque (
        componente_id,
        tipo_item,
        produto_id, -- null para componentes
        quantidade_atual,
        quantidade_reservada,
        quantidade_disponivel,
        valor_total,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        'componente',
        NULL,
        NEW.quantidade_total,
        NEW.quantidade_em_uso,
        NEW.quantidade_disponivel,
        NEW.quantidade_total * NEW.valor_unitario,
        NEW.created_at,
        NEW.updated_at
      );
    ELSE
      -- Atualizar registro de estoque existente
      UPDATE estoque
      SET 
        quantidade_atual = NEW.quantidade_total,
        quantidade_reservada = NEW.quantidade_em_uso,
        quantidade_disponivel = NEW.quantidade_disponivel,
        valor_total = NEW.quantidade_total * NEW.valor_unitario,
        updated_at = NEW.updated_at
      WHERE componente_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para sincronizar automaticamente
DROP TRIGGER IF EXISTS trigger_sincronizar_componente_estoque ON grua_componentes;
CREATE TRIGGER trigger_sincronizar_componente_estoque
  AFTER INSERT OR UPDATE ON grua_componentes
  FOR EACH ROW
  EXECUTE FUNCTION sincronizar_componente_estoque();

-- Função para criar movimentação de estoque quando componente é movimentado
CREATE OR REPLACE FUNCTION criar_movimentacao_componente_estoque()
RETURNS TRIGGER AS $$
DECLARE
  v_componente_id INTEGER;
  v_quantidade_anterior INTEGER;
  v_quantidade_atual INTEGER;
  v_tipo_movimentacao VARCHAR(20);
  v_valor_unitario DECIMAL(10,2);
  v_grua_id VARCHAR;
BEGIN
  -- Obter ID do componente
  v_componente_id := NEW.componente_id;
  
  -- Obter dados do componente
  SELECT quantidade_disponivel, valor_unitario, grua_id 
  INTO v_quantidade_anterior, v_valor_unitario, v_grua_id
  FROM grua_componentes
  WHERE id = v_componente_id;
  
  -- Se não encontrou componente, retornar
  IF v_componente_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Determinar tipo de movimentação baseado no tipo_movimentacao do histórico
  CASE NEW.tipo_movimentacao
    WHEN 'Instalação' THEN
      v_tipo_movimentacao := 'Saída';
      v_quantidade_atual := v_quantidade_anterior - NEW.quantidade_movimentada;
    WHEN 'Remoção' THEN
      v_tipo_movimentacao := 'Entrada';
      v_quantidade_atual := v_quantidade_anterior + NEW.quantidade_movimentada;
    WHEN 'Substituição' THEN
      v_tipo_movimentacao := 'Entrada';
      v_quantidade_atual := v_quantidade_anterior + NEW.quantidade_movimentada;
    ELSE
      -- Para outros tipos, não criar movimentação de estoque
      RETURN NEW;
  END CASE;
  
  -- Verificar se a tabela movimentacoes_estoque tem os campos necessários
  -- Se não tiver, tentar inserir apenas os campos básicos
  BEGIN
    INSERT INTO movimentacoes_estoque (
      componente_id,
      produto_id,
      tipo,
      quantidade,
      valor_unitario,
      valor_total,
      data_movimentacao,
      responsavel_id,
      motivo,
      observacoes,
      obra_id,
      grua_id,
      status,
      created_at
    ) VALUES (
      v_componente_id,
      NULL,
      v_tipo_movimentacao,
      NEW.quantidade_movimentada,
      COALESCE(v_valor_unitario, 0),
      NEW.quantidade_movimentada * COALESCE(v_valor_unitario, 0),
      COALESCE(NEW.data_movimentacao, CURRENT_TIMESTAMP),
      NEW.funcionario_responsavel_id,
      NEW.motivo,
      NEW.observacoes,
      NEW.obra_id,
      v_grua_id,
      'Confirmada',
      COALESCE(NEW.created_at, CURRENT_TIMESTAMP)
    );
  EXCEPTION WHEN OTHERS THEN
    -- Se falhar por campos não existirem, tentar inserir apenas campos básicos
    INSERT INTO movimentacoes_estoque (
      item_id,
      tipo,
      quantidade,
      motivo,
      funcionario_id,
      data_movimentacao,
      observacoes
    ) VALUES (
      (SELECT id FROM estoque WHERE componente_id = v_componente_id LIMIT 1),
      LOWER(v_tipo_movimentacao),
      NEW.quantidade_movimentada,
      NEW.motivo,
      NEW.funcionario_responsavel_id,
      COALESCE(NEW.data_movimentacao, CURRENT_TIMESTAMP),
      NEW.observacoes
    );
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para criar movimentação de estoque quando componente é movimentado
DROP TRIGGER IF EXISTS trigger_criar_movimentacao_componente_estoque ON historico_componentes;
CREATE TRIGGER trigger_criar_movimentacao_componente_estoque
  AFTER INSERT ON historico_componentes
  FOR EACH ROW
  WHEN (NEW.tipo_movimentacao IN ('Instalação', 'Remoção', 'Substituição'))
  EXECUTE FUNCTION criar_movimentacao_componente_estoque();

