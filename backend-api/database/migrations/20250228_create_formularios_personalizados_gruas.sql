-- Migration: Criar sistema de formulários personalizados para gruas
-- Data: 2025-02-28
-- Descrição: Permite criar formulários personalizados de checklist e manutenção para gruas

-- Tabela de formulários personalizados
CREATE TABLE IF NOT EXISTS formularios_personalizados_gruas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('checklist', 'manutencao')),
  grua_id VARCHAR REFERENCES gruas(id) ON DELETE CASCADE,
  obra_id INTEGER REFERENCES obras(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT true,
  descricao TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES usuarios(id),
  updated_by INTEGER REFERENCES usuarios(id),
  -- Limitar a um único formulário por grua e tipo
  CONSTRAINT unique_formulario_grua_tipo UNIQUE (grua_id, tipo)
);

-- Tabela de itens do formulário personalizado
CREATE TABLE IF NOT EXISTS formularios_personalizados_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios_personalizados_gruas(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  categoria VARCHAR(100),
  descricao TEXT NOT NULL,
  tipo_item VARCHAR(20) DEFAULT 'checkbox' CHECK (tipo_item IN ('checkbox', 'texto', 'numero', 'data')),
  obrigatorio BOOLEAN DEFAULT false,
  permite_anexo BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de respostas dos formulários personalizados
CREATE TABLE IF NOT EXISTS formularios_personalizados_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios_personalizados_gruas(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES formularios_personalizados_itens(id) ON DELETE CASCADE,
  resposta TEXT,
  status VARCHAR(20) CHECK (status IN ('ok', 'manutencao', 'pendente')),
  anexos TEXT[],
  funcionario_id INTEGER REFERENCES funcionarios(id),
  data_preenchimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_formularios_grua_id ON formularios_personalizados_gruas(grua_id);
CREATE INDEX IF NOT EXISTS idx_formularios_obra_id ON formularios_personalizados_gruas(obra_id);
CREATE INDEX IF NOT EXISTS idx_formularios_tipo ON formularios_personalizados_gruas(tipo);
CREATE INDEX IF NOT EXISTS idx_formularios_ativo ON formularios_personalizados_gruas(ativo);
CREATE INDEX IF NOT EXISTS idx_formularios_itens_formulario_id ON formularios_personalizados_itens(formulario_id);
CREATE INDEX IF NOT EXISTS idx_formularios_itens_ordem ON formularios_personalizados_itens(formulario_id, ordem);
CREATE INDEX IF NOT EXISTS idx_formularios_respostas_formulario_id ON formularios_personalizados_respostas(formulario_id);
CREATE INDEX IF NOT EXISTS idx_formularios_respostas_item_id ON formularios_personalizados_respostas(item_id);

-- Comentários
COMMENT ON TABLE formularios_personalizados_gruas IS 'Formulários personalizados de checklist e manutenção para gruas (limitado a um por grua e tipo)';
COMMENT ON TABLE formularios_personalizados_itens IS 'Itens que compõem os formulários personalizados';
COMMENT ON TABLE formularios_personalizados_respostas IS 'Respostas preenchidas nos formulários personalizados';
COMMENT ON COLUMN formularios_personalizados_gruas.tipo IS 'Tipo: checklist (diário) ou manutencao';
COMMENT ON COLUMN formularios_personalizados_itens.tipo_item IS 'Tipo do item: checkbox, texto, numero, data';
COMMENT ON COLUMN formularios_personalizados_respostas.status IS 'Status da resposta: ok, manutencao, pendente';










