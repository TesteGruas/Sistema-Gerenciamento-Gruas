-- =============================================================================
-- MODELO SQL — Sistema de Gerenciamento de Gruas (IRBANA)
-- Arquivo: backend-api/database/modelo-banco.sql
-- Gerado a partir do schema em uso + CREATE TABLE das migrations do repositório.
--
-- COMO USAR (banco novo / PostgreSQL ou Supabase):
--   1) psql "$DATABASE_URL" -f database/modelo-banco.sql
--   2) Em seguida aplique as migrations restantes (ALTER/seed):
--        for f in database/migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
--      (erros de "already exists" / "column already exists" são esperados e ok)
--
-- OBSERVAÇÕES:
--   • Auth de login fica no Supabase Auth (não neste SQL). A tabela "usuarios"
--     é o espelho de negócio (id numérico usado pela API).
--   • Este arquivo cobre as tabelas CORE + ~70 tabelas com CREATE nas migrations.
--   • Tabelas legadas/opcionais podem surgir só via ALTER em migrations — rode
--     o passo 2 acima.
--   • Para dump 100% fiel à produção: pg_dump --schema-only do Supabase.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- CORE: autenticação de negócio e cadastros base
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  cpf VARCHAR(14),
  telefone VARCHAR(30),
  endereco TEXT,
  cidade VARCHAR(120),
  estado VARCHAR(2),
  cep VARCHAR(12),
  cargo VARCHAR(100),
  role VARCHAR(50),
  status VARCHAR(30) DEFAULT 'Ativo',
  funcionario_id INTEGER,
  eh_funcionario BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cargos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  nivel VARCHAR(50),
  salario_base NUMERIC(12,2),
  salario_minimo NUMERIC(12,2),
  salario_maximo NUMERIC(12,2),
  ativo BOOLEAN DEFAULT true,
  perfil_id INTEGER,
  acesso_global_obras BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funcionarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14),
  rg VARCHAR(30),
  data_nascimento DATE,
  telefone VARCHAR(30),
  telefone_whatsapp VARCHAR(30),
  email VARCHAR(255),
  endereco TEXT,
  cargo VARCHAR(100),
  cargo_id INTEGER REFERENCES cargos(id),
  salario NUMERIC(12,2),
  data_admissao DATE,
  status VARCHAR(30) DEFAULT 'ativo',
  user_id INTEGER REFERENCES usuarios(id),
  eh_supervisor BOOLEAN DEFAULT false,
  obra_atual_id INTEGER,
  avatar_url TEXT,
  foto_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE usuarios
  DROP CONSTRAINT IF EXISTS usuarios_funcionario_id_fkey;
ALTER TABLE usuarios
  ADD CONSTRAINT usuarios_funcionario_id_fkey
  FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  inscricao_estadual VARCHAR(50),
  inscricao_municipal VARCHAR(50),
  email VARCHAR(255),
  telefone VARCHAR(30),
  endereco TEXT,
  endereco_complemento TEXT,
  cidade VARCHAR(120),
  estado VARCHAR(2),
  cep VARCHAR(12),
  endereco_obra TEXT,
  endereco_obra_complemento TEXT,
  cidade_obra VARCHAR(120),
  estado_obra VARCHAR(2),
  cep_obra VARCHAR(12),
  contato VARCHAR(255),
  contato_cargo VARCHAR(120),
  contato_email VARCHAR(255),
  contato_cpf VARCHAR(14),
  contato_telefone VARCHAR(30),
  contato_usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  status VARCHAR(30) DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS obras (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  endereco TEXT,
  endereco_numero VARCHAR(30),
  endereco_complemento TEXT,
  bairro VARCHAR(120),
  cidade VARCHAR(120),
  estado VARCHAR(2),
  cep VARCHAR(12),
  cliente_id INTEGER REFERENCES clientes(id),
  orcamento_id INTEGER,
  data_inicio DATE,
  data_fim DATE,
  status VARCHAR(40) DEFAULT 'ativa',
  valor_total NUMERIC(14,2),
  observacoes TEXT,
  cno VARCHAR(50),
  art VARCHAR(50),
  cno_arquivo TEXT,
  canteiro TEXT,
  operador_obra_funcionario_id INTEGER REFERENCES funcionarios(id),
  latitude NUMERIC(12,8),
  longitude NUMERIC(12,8),
  raio_permitido NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE funcionarios
  DROP CONSTRAINT IF EXISTS funcionarios_obra_atual_id_fkey;
ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_obra_atual_id_fkey
  FOREIGN KEY (obra_atual_id) REFERENCES obras(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS gruas (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(255),
  modelo VARCHAR(120),
  fabricante VARCHAR(120),
  tipo VARCHAR(80),
  numero_serie VARCHAR(100),
  capacidade NUMERIC(12,2),
  status VARCHAR(40) DEFAULT 'disponivel',
  ano INTEGER,
  observacoes TEXT,
  ultima_manutencao_corretiva DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grua_obra (
  id SERIAL PRIMARY KEY,
  grua_id VARCHAR(50) REFERENCES gruas(id),
  obra_id INTEGER REFERENCES obras(id),
  status VARCHAR(40) DEFAULT 'ativa',
  data_inicio_locacao DATE,
  data_fim_locacao DATE,
  valor_locacao_mensal NUMERIC(14,2),
  altura_inicial NUMERIC(10,2),
  raio_trabalho NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funcionarios_obras (
  id SERIAL PRIMARY KEY,
  funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  data_entrada DATE,
  data_saida DATE,
  status VARCHAR(30) DEFAULT 'ativo',
  is_supervisor BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orcamentos (
  id SERIAL PRIMARY KEY,
  obra_id INTEGER REFERENCES obras(id),
  cliente_id INTEGER REFERENCES clientes(id),
  numero VARCHAR(50),
  status VARCHAR(40) DEFAULT 'rascunho',
  valor_total NUMERIC(14,2),
  total_faturado_acumulado NUMERIC(14,2) DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE obras
  DROP CONSTRAINT IF EXISTS obras_orcamento_id_fkey;
ALTER TABLE obras
  ADD CONSTRAINT obras_orcamento_id_fkey
  FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS orcamentos_locacao (
  id SERIAL PRIMARY KEY,
  obra_id INTEGER REFERENCES obras(id),
  cliente_id INTEGER REFERENCES clientes(id),
  status VARCHAR(40) DEFAULT 'rascunho',
  valor_total NUMERIC(14,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estoque (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(80),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(80),
  classificacao VARCHAR(80),
  subcategoria_ativo VARCHAR(80),
  unidade VARCHAR(30),
  quantidade NUMERIC(14,3) DEFAULT 0,
  quantidade_minima NUMERIC(14,3) DEFAULT 0,
  localizacao VARCHAR(120),
  status VARCHAR(40) DEFAULT 'ativo',
  produto_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notas_fiscais (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(60),
  serie VARCHAR(20),
  tipo VARCHAR(40),
  chave_acesso VARCHAR(80),
  emitente_nome VARCHAR(255),
  emitente_cnpj VARCHAR(18),
  destinatario_nome VARCHAR(255),
  destinatario_cnpj VARCHAR(18),
  valor_total NUMERIC(14,2),
  valor_liquido NUMERIC(14,2),
  data_emissao DATE,
  data_entrada DATE,
  status VARCHAR(40) DEFAULT 'pendente',
  medicao_id INTEGER,
  locacao_id INTEGER,
  arquivo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registros_ponto (
  id SERIAL PRIMARY KEY,
  funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id),
  obra_id INTEGER REFERENCES obras(id),
  data DATE NOT NULL,
  entrada TIMESTAMPTZ,
  saida_almoco TIMESTAMPTZ,
  retorno_almoco TIMESTAMPTZ,
  saida TIMESTAMPTZ,
  status VARCHAR(40) DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beneficios_tipo (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(120) NOT NULL,
  valor NUMERIC(12,2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funcionario_beneficios (
  id SERIAL PRIMARY KEY,
  funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  beneficio_tipo_id INTEGER REFERENCES beneficios_tipo(id),
  valor NUMERIC(12,2),
  mes_referencia VARCHAR(7),
  data_inicio DATE,
  arquivo TEXT,
  assinatura_digital TEXT,
  assinado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS residencias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255),
  endereco TEXT,
  cidade VARCHAR(120),
  estado VARCHAR(2),
  cep VARCHAR(12),
  status VARCHAR(40) DEFAULT 'ativa',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alugueis_residencias (
  id SERIAL PRIMARY KEY,
  residencia_id INTEGER REFERENCES residencias(id),
  obra_id INTEGER REFERENCES obras(id),
  valor_aluguel NUMERIC(14,2),
  data_inicio DATE,
  data_fim DATE,
  status VARCHAR(40) DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS livro_grua (
  id SERIAL PRIMARY KEY,
  grua_id VARCHAR(50) REFERENCES gruas(id),
  obra_id INTEGER REFERENCES obras(id),
  data DATE,
  operador_id INTEGER REFERENCES funcionarios(id),
  observacoes TEXT,
  checklist jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grua_componentes (
  id SERIAL PRIMARY KEY,
  grua_id VARCHAR(50) REFERENCES gruas(id),
  estoque_id INTEGER REFERENCES estoque(id),
  nome VARCHAR(255),
  quantidade NUMERIC(14,3) DEFAULT 1,
  status VARCHAR(40) DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id SERIAL PRIMARY KEY,
  instance_name VARCHAR(120) NOT NULL,
  apikey TEXT,
  status VARCHAR(40) DEFAULT 'disconnected',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(120) UNIQUE NOT NULL,
  nome VARCHAR(255),
  conteudo TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(120) UNIQUE NOT NULL,
  valor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- TABELAS DAS MIGRATIONS (CREATE TABLE IF NOT EXISTS)
-- -----------------------------------------------------------------------------


-- Fonte: 09_create_permissions_system.sql
CREATE TABLE IF NOT EXISTS perfis (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  nivel_acesso INTEGER NOT NULL CHECK (nivel_acesso BETWEEN 1 AND 10),
  status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Fonte: 09_create_permissions_system.sql
CREATE TABLE IF NOT EXISTS permissoes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  modulo VARCHAR(50) NOT NULL,
  acao VARCHAR(50) NOT NULL,
  recurso VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(modulo, acao, recurso)
);

-- Fonte: 09_create_permissions_system.sql
CREATE TABLE IF NOT EXISTS perfil_permissoes (
  id SERIAL PRIMARY KEY,
  perfil_id INTEGER NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  permissao_id INTEGER NOT NULL REFERENCES permissoes(id) ON DELETE CASCADE,
  data_atribuicao TIMESTAMP DEFAULT NOW(),
  atribuido_por INTEGER,
  status VARCHAR(20) DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(perfil_id, permissao_id)
);

-- Fonte: 09_create_permissions_system.sql
CREATE TABLE IF NOT EXISTS usuario_perfis (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  perfil_id INTEGER NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  data_atribuicao TIMESTAMP DEFAULT NOW(),
  atribuido_por INTEGER,
  status VARCHAR(20) DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, perfil_id)
);

-- Fonte: 20250110_create_fornecedores.sql
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

-- Fonte: 20250110_create_impostos.sql
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

-- Fonte: 20250110_create_impostos.sql
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

-- Fonte: 20250110_create_produtos.sql
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

-- Fonte: 20250111_create_email_configs.sql
CREATE TABLE IF NOT EXISTS email_configs (
  id BIGSERIAL PRIMARY KEY,
  smtp_host VARCHAR(255) NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_secure BOOLEAN DEFAULT FALSE,
  smtp_user TEXT NOT NULL, -- Criptografado
  smtp_pass TEXT NOT NULL, -- Criptografado
  email_from VARCHAR(255) NOT NULL,
  email_from_name VARCHAR(255) NOT NULL,
  email_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,
  
  -- Foreign keys
  CONSTRAINT fk_email_configs_updated_by 
    FOREIGN KEY (updated_by) 
    REFERENCES usuarios(id) 
    ON DELETE SET NULL
);

-- Fonte: 20250111_create_email_logs.sql
CREATE TABLE IF NOT EXISTS email_logs (
  id BIGSERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  destinatario VARCHAR(255) NOT NULL,
  assunto VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  erro TEXT,
  tentativas INTEGER DEFAULT 1,
  enviado_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_email_logs_status 
    CHECK (status IN ('enviado', 'falha', 'pendente')),
  CONSTRAINT chk_email_logs_tipo
    CHECK (tipo IN ('welcome', 'reset_password', 'password_changed', 'test', 'custom'))
);

-- Fonte: 20250111_create_email_templates.sql
CREATE TABLE IF NOT EXISTS email_templates (
  id BIGSERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  assunto VARCHAR(500) NOT NULL,
  html_template TEXT NOT NULL,
  variaveis JSONB DEFAULT '[]'::jsonb,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,
  
  -- Foreign keys
  CONSTRAINT fk_email_templates_updated_by 
    FOREIGN KEY (updated_by) 
    REFERENCES usuarios(id) 
    ON DELETE SET NULL,
    
  -- Constraints
  CONSTRAINT chk_email_templates_tipo 
    CHECK (tipo IN ('welcome', 'reset_password', 'password_changed'))
);

-- Fonte: 20250111_create_notificacoes.sql
CREATE TABLE IF NOT EXISTS notificacoes (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  data TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  link VARCHAR(500),
  icone VARCHAR(100),
  destinatarios JSONB DEFAULT '[]'::jsonb,
  remetente VARCHAR(255),
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT check_tipo CHECK (tipo IN (
    'info', 'warning', 'error', 'success', 
    'grua', 'obra', 'financeiro', 'rh', 'estoque'
  ))
);

-- Fonte: 20250111_create_password_reset_tokens.sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT fk_password_reset_tokens_usuario 
    FOREIGN KEY (usuario_id) 
    REFERENCES usuarios(id) 
    ON DELETE CASCADE
);

-- Fonte: 20250123_checklist_diario.sql
CREATE TABLE IF NOT EXISTS checklists_modelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250123_checklist_diario.sql
CREATE TABLE IF NOT EXISTS checklist_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo_id UUID NOT NULL REFERENCES checklists_modelos(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  obrigatorio BOOLEAN DEFAULT FALSE,
  permite_anexo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250123_checklist_diario.sql
CREATE TABLE IF NOT EXISTS checklists_diarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  modelo_id UUID NOT NULL REFERENCES checklists_modelos(id),
  data DATE NOT NULL,
  responsavel_id INTEGER NOT NULL REFERENCES funcionarios(id),
  horario_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assinatura_digital TEXT,
  status VARCHAR(20) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluido', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250123_checklist_diario.sql
CREATE TABLE IF NOT EXISTS checklist_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES checklists_diarios(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES checklist_itens(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('ok', 'nao_conforme', 'nao_aplicavel')),
  observacao TEXT,
  plano_acao TEXT,
  responsavel_correcao_id INTEGER REFERENCES funcionarios(id),
  prazo_correcao DATE,
  status_correcao VARCHAR(20) DEFAULT 'pendente' CHECK (status_correcao IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250123_checklist_diario.sql
CREATE TABLE IF NOT EXISTS checklist_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resposta_id UUID NOT NULL REFERENCES checklist_respostas(id) ON DELETE CASCADE,
  arquivo VARCHAR(500) NOT NULL,
  tipo VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250123_manutencoes.sql
CREATE TABLE IF NOT EXISTS manutencoes_ordens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grua_id VARCHAR NOT NULL REFERENCES gruas(id) ON DELETE CASCADE,
  obra_id INTEGER REFERENCES obras(id) ON DELETE SET NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('preventiva', 'corretiva', 'preditiva', 'emergencial')),
  descricao TEXT NOT NULL,
  responsavel_tecnico_id INTEGER REFERENCES funcionarios(id),
  data_prevista DATE,
  prioridade VARCHAR(20) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
  status VARCHAR(20) DEFAULT 'agendada' CHECK (status IN ('agendada', 'em_andamento', 'concluida', 'cancelada', 'pausada')),
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_fim TIMESTAMP WITH TIME ZONE,
  horas_trabalhadas NUMERIC(10,2) DEFAULT 0,
  custo_mao_obra NUMERIC(12,2) DEFAULT 0,
  custo_total NUMERIC(12,2) DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250123_manutencoes.sql
CREATE TABLE IF NOT EXISTS manutencoes_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manutencao_id UUID NOT NULL REFERENCES manutencoes_ordens(id) ON DELETE CASCADE,
  produto_id VARCHAR REFERENCES produtos(id) ON DELETE SET NULL,
  descricao VARCHAR(255) NOT NULL,
  quantidade NUMERIC(10,2) NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(12,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250123_manutencoes.sql
CREATE TABLE IF NOT EXISTS manutencoes_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manutencao_id UUID NOT NULL REFERENCES manutencoes_ordens(id) ON DELETE CASCADE,
  arquivo VARCHAR(500) NOT NULL,
  tipo VARCHAR(50),
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250123_manutencoes.sql
CREATE TABLE IF NOT EXISTS manutencoes_agenda_preventiva (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grua_id VARCHAR NOT NULL REFERENCES gruas(id) ON DELETE CASCADE,
  tipo_manutencao VARCHAR(100) NOT NULL,
  intervalo_tipo VARCHAR(20) NOT NULL CHECK (intervalo_tipo IN ('horas', 'dias', 'meses', 'km')),
  intervalo_valor INTEGER NOT NULL,
  ultima_manutencao_horimetro INTEGER,
  ultima_manutencao_data DATE,
  proxima_manutencao_horimetro INTEGER,
  proxima_manutencao_data DATE,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250123_obras_campos_obrigatorios.sql
CREATE TABLE IF NOT EXISTS responsaveis_tecnicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cpf_cnpj VARCHAR(20) NOT NULL,
  crea VARCHAR(50),
  email VARCHAR(255),
  telefone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250123_obras_campos_obrigatorios.sql
CREATE TABLE IF NOT EXISTS sinaleiros_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  rg_cpf VARCHAR(20) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(255),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('principal', 'reserva')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250123_obras_campos_obrigatorios.sql
CREATE TABLE IF NOT EXISTS documentos_sinaleiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sinaleiro_id UUID NOT NULL REFERENCES sinaleiros_obra(id) ON DELETE CASCADE,
  tipo VARCHAR(100) NOT NULL,
  arquivo VARCHAR(500) NOT NULL,
  data_validade DATE,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'vencido')),
  aprovado_por INTEGER REFERENCES usuarios(id),
  aprovado_em TIMESTAMP WITH TIME ZONE,
  alerta_enviado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250123_ordem_compras.sql
CREATE TABLE IF NOT EXISTS ordem_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante_id INTEGER NOT NULL REFERENCES funcionarios(id),
  descricao TEXT NOT NULL,
  valor_total NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'aguardando_orcamento', 'orcamento_aprovado', 'enviado_financeiro', 'pagamento_registrado', 'pagamento_aprovado', 'finalizada', 'cancelada')),
  aprovador_orcamento_id INTEGER REFERENCES usuarios(id),
  responsavel_pagamento_id INTEGER REFERENCES usuarios(id),
  aprovador_final_id INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250123_ordem_compras.sql
CREATE TABLE IF NOT EXISTS aprovacoes_ordem_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_id UUID NOT NULL REFERENCES ordem_compras(id) ON DELETE CASCADE,
  etapa VARCHAR(50) NOT NULL CHECK (etapa IN ('orcamento', 'financeiro', 'pagamento')),
  aprovador_id INTEGER NOT NULL REFERENCES usuarios(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  comentarios TEXT,
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250123_rh_documentos_certificados.sql
CREATE TABLE IF NOT EXISTS certificados_colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  tipo VARCHAR(100) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  data_validade DATE,
  arquivo VARCHAR(500),
  alerta_enviado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250123_rh_documentos_certificados.sql
CREATE TABLE IF NOT EXISTS documentos_admissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  tipo VARCHAR(100) NOT NULL,
  data_validade DATE,
  arquivo VARCHAR(500),
  alerta_enviado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250123_rh_documentos_certificados.sql
CREATE TABLE IF NOT EXISTS holerites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  mes_referencia VARCHAR(7) NOT NULL CHECK (mes_referencia ~ '^\d{4}-\d{2}$'),
  arquivo VARCHAR(500) NOT NULL,
  assinatura_digital TEXT,
  assinado_em TIMESTAMP WITH TIME ZONE,
  assinado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250124_create_whatsapp_logs.sql
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL DEFAULT 'notificacao',
  telefone_destino VARCHAR(20) NOT NULL,
  mensagem TEXT,
  aprovacao_id UUID REFERENCES aprovacoes_horas_extras(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'enviado',
  erro_detalhes TEXT,
  tentativas INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_whatsapp_logs_status 
    CHECK (status IN ('enviado', 'entregue', 'lido', 'erro', 'falha', 'pendente')),
  CONSTRAINT chk_whatsapp_logs_tipo
    CHECK (tipo IN ('notificacao', 'aprovacao', 'lembrete', 'nova_obra', 'novo_usuario', 'resultado'))
);

-- Fonte: 20250202_add_debug_mode_config.sql
CREATE TABLE IF NOT EXISTS configuracoes (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descricao TEXT,
    tipo VARCHAR(50) DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250202_expandir_orcamentos.sql
CREATE TABLE IF NOT EXISTS orcamento_valores_fixos (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Locação', 'Serviço')),
  descricao VARCHAR(255) NOT NULL,
  quantidade DECIMAL(10,2) DEFAULT 1,
  valor_unitario DECIMAL(12,2) NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250202_expandir_orcamentos.sql
CREATE TABLE IF NOT EXISTS orcamento_custos_mensais (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  valor_mensal DECIMAL(12,2) NOT NULL,
  obrigatorio BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250202_expandir_orcamentos.sql
CREATE TABLE IF NOT EXISTS orcamento_horas_extras (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('operador', 'sinaleiro', 'equipamento')),
  dia_semana VARCHAR(20) NOT NULL CHECK (dia_semana IN ('sabado', 'domingo_feriado', 'normal')),
  valor_hora DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(orcamento_id, tipo, dia_semana)
);

-- Fonte: 20250202_expandir_orcamentos.sql
CREATE TABLE IF NOT EXISTS orcamento_servicos_adicionais (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  quantidade DECIMAL(10,2) DEFAULT 1,
  valor_unitario DECIMAL(12,2) NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250202_medicoes_mensais_orcamentos.sql
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

-- Fonte: 20250202_medicoes_mensais_orcamentos.sql
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

-- Fonte: 20250202_medicoes_mensais_orcamentos.sql
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

-- Fonte: 20250202_medicoes_mensais_orcamentos.sql
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

-- Fonte: 20250202_medicoes_mensais_orcamentos.sql
CREATE TABLE IF NOT EXISTS medicao_aditivos (
  id SERIAL PRIMARY KEY,
  medicao_id INTEGER NOT NULL REFERENCES medicoes_mensais(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('adicional', 'desconto')),
  descricao VARCHAR(255) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250220_add_campos_orcamentos_locacao.sql
CREATE TABLE IF NOT EXISTS orcamento_valores_fixos_locacao (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos_locacao(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Locação', 'Serviço')),
  descricao VARCHAR(255) NOT NULL,
  quantidade DECIMAL(10,2) DEFAULT 1,
  valor_unitario DECIMAL(12,2) NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250220_add_campos_orcamentos_locacao.sql
CREATE TABLE IF NOT EXISTS orcamento_custos_mensais_locacao (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos_locacao(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  valor_mensal DECIMAL(12,2) NOT NULL,
  obrigatorio BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250225_create_complementos_catalogo.sql
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

-- Fonte: 20250226_add_campos_complementos_orcamento_itens.sql
CREATE TABLE IF NOT EXISTS orcamento_itens (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  produto_servico VARCHAR(255) NOT NULL,
  descricao TEXT,
  quantidade DECIMAL(10,2) NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(12,2) NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('produto', 'servico', 'equipamento')),
  unidade VARCHAR(50),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250226_medicoes_vinculadas_gruas.sql
CREATE TABLE IF NOT EXISTS medicao_anexos_aprovacao (
  id SERIAL PRIMARY KEY,
  medicao_id INTEGER NOT NULL REFERENCES medicoes_mensais(id) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  caminho_arquivo VARCHAR(500) NOT NULL,
  tipo_arquivo VARCHAR(50),
  tamanho_bytes BIGINT,
  uploaded_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250226_medicoes_vinculadas_gruas.sql
CREATE TABLE IF NOT EXISTS medicao_documentos (
  id SERIAL PRIMARY KEY,
  medicao_id INTEGER NOT NULL REFERENCES medicoes_mensais(id) ON DELETE CASCADE,
  tipo_documento VARCHAR(50) NOT NULL CHECK (tipo_documento IN ('nf_servico', 'nf_locacao', 'boleto')),
  numero_documento VARCHAR(100),
  caminho_arquivo VARCHAR(500),
  data_emissao DATE,
  data_vencimento DATE,
  valor DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'gerado', 'enviado', 'pago', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250227_create_itens_custos_mensais.sql
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

-- Fonte: 20250228_add_feriados_tipo_dia_ponto.sql
CREATE TABLE IF NOT EXISTS feriados_nacionais (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data DATE NOT NULL UNIQUE,
    tipo VARCHAR(50) NOT NULL DEFAULT 'nacional' CHECK (tipo IN ('nacional', 'estadual', 'local')),
    estado CHAR(2), -- NULL para nacional, código do estado para estadual/local
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250228_create_arquivos_alugueis.sql
CREATE TABLE IF NOT EXISTS arquivos_alugueis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluguel_id UUID NOT NULL REFERENCES alugueis_residencias(id) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  caminho_arquivo TEXT NOT NULL,
  tipo_arquivo VARCHAR(100),
  tamanho_arquivo BIGINT, -- em bytes
  categoria VARCHAR(50) DEFAULT 'contrato', -- contrato, recibo, foto, outro
  descricao TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by INTEGER REFERENCES usuarios(id),
  updated_by INTEGER REFERENCES usuarios(id)
);

-- Fonte: 20250228_create_boletos.sql
CREATE TABLE IF NOT EXISTS boletos (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    numero_boleto VARCHAR(100) UNIQUE,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    obra_id INTEGER REFERENCES obras(id) ON DELETE SET NULL,
    medicao_id INTEGER REFERENCES medicoes_mensais(id) ON DELETE SET NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
    forma_pagamento VARCHAR(50),
    codigo_barras VARCHAR(200),
    linha_digitavel VARCHAR(200),
    nosso_numero VARCHAR(100),
    banco VARCHAR(100),
    agencia VARCHAR(20),
    conta VARCHAR(20),
    arquivo_boleto VARCHAR(500),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250228_create_contas_bancarias.sql
CREATE TABLE IF NOT EXISTS contas_bancarias (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    nome VARCHAR(255),
    banco VARCHAR(100) NOT NULL,
    agencia VARCHAR(20) NOT NULL,
    conta VARCHAR(20) NOT NULL,
    tipo_conta VARCHAR(20) NOT NULL CHECK (tipo_conta IN ('corrente', 'poupanca', 'investimento')),
    saldo_atual DECIMAL(12,2) DEFAULT 0,
    saldo_inicial DECIMAL(12,2) DEFAULT 0,
    moeda VARCHAR(10) DEFAULT 'BRL',
    status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'bloqueada')),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250228_create_formularios_personalizados_gruas.sql
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

-- Fonte: 20250228_create_formularios_personalizados_gruas.sql
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

-- Fonte: 20250228_create_formularios_personalizados_gruas.sql
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

-- Fonte: 20250228_create_notas_fiscais_itens.sql
CREATE TABLE IF NOT EXISTS notas_fiscais_itens (
    id SERIAL PRIMARY KEY,
    nota_fiscal_id INTEGER NOT NULL REFERENCES notas_fiscais(id) ON DELETE CASCADE,
    
    -- Dados do Item
    codigo_produto VARCHAR(100),
    descricao TEXT NOT NULL,
    ncm_sh VARCHAR(10),
    csosn VARCHAR(10),
    cfop VARCHAR(10),
    unidade VARCHAR(10),
    quantidade DECIMAL(10,3) NOT NULL,
    preco_unitario DECIMAL(12,2) NOT NULL,
    preco_total DECIMAL(12,2) NOT NULL,
    
    -- Impostos do Item
    base_calculo_icms DECIMAL(12,2) DEFAULT 0.00,
    valor_icms DECIMAL(12,2) DEFAULT 0.00,
    valor_ipi DECIMAL(12,2) DEFAULT 0.00,
    percentual_icms DECIMAL(5,4) DEFAULT 0.0000,
    percentual_ipi DECIMAL(5,2) DEFAULT 0.00,
    
    -- Ordem do item na nota
    ordem INTEGER DEFAULT 1,
    
    -- Metadados
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250228_create_tipos_impostos.sql
CREATE TABLE IF NOT EXISTS tipos_impostos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao VARCHAR(500),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250302_add_almoco_automatico.sql
CREATE TABLE IF NOT EXISTS notificacoes_almoco (
    id SERIAL PRIMARY KEY,
    registro_ponto_id VARCHAR(50) REFERENCES registros_ponto(id) ON DELETE CASCADE,
    funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    hora_notificacao TIME NOT NULL,
    telefone_destino VARCHAR(20) NOT NULL,
    mensagem_enviada TEXT,
    status VARCHAR(50) DEFAULT 'enviada' CHECK (status IN ('enviada', 'respondida', 'expirada')),
    resposta VARCHAR(50) CHECK (resposta IN ('pausa', 'trabalho_corrido', 'nao_respondido')),
    resposta_recebida_em TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20250302_add_almoco_automatico.sql
CREATE TABLE IF NOT EXISTS confirmacoes_trabalho_corrido (
    id SERIAL PRIMARY KEY,
    registro_ponto_id VARCHAR(50) NOT NULL REFERENCES registros_ponto(id) ON DELETE CASCADE,
    funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    encarregado_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    confirmado BOOLEAN DEFAULT false,
    observacoes TEXT,
    confirmado_em TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(registro_ponto_id)
);

-- Fonte: 20250302_create_arquivos_genericos.sql
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

-- Fonte: 20260204_create_movimentacoes_bancarias.sql
CREATE TABLE IF NOT EXISTS movimentacoes_bancarias (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    conta_bancaria_id INTEGER NOT NULL REFERENCES contas_bancarias(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    valor DECIMAL(12,2) NOT NULL CHECK (valor > 0),
    descricao VARCHAR(255) NOT NULL,
    referencia VARCHAR(255),
    data DATE NOT NULL,
    categoria VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20260207_create_cobrancas_aluguel.sql
CREATE TABLE IF NOT EXISTS cobrancas_aluguel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluguel_id UUID NOT NULL REFERENCES alugueis_residencias(id) ON DELETE CASCADE,
    mes VARCHAR(7) NOT NULL, -- formato YYYY-MM
    conta_bancaria_id INTEGER NOT NULL REFERENCES contas_bancarias(id) ON DELETE RESTRICT,
    valor_aluguel DECIMAL(10,2) NOT NULL CHECK (valor_aluguel >= 0),
    valor_custos DECIMAL(10,2) DEFAULT 0 CHECK (valor_custos >= 0), -- custos adicionais (luz, água, etc.)
    valor_total DECIMAL(10,2) NOT NULL CHECK (valor_total > 0),
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
    movimentacao_bancaria_id INTEGER REFERENCES movimentacoes_bancarias(id) ON DELETE SET NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES usuarios(id),
    updated_by INTEGER REFERENCES usuarios(id)
);

-- Fonte: 20260221_create_responsaveis_obra.sql
CREATE TABLE IF NOT EXISTS responsaveis_obra (
  id SERIAL PRIMARY KEY,
  obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  pedido VARCHAR(100),
  usuario VARCHAR(100),
  email VARCHAR(255),
  telefone VARCHAR(50),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonte: 20260311_create_pwa_push_subscriptions.sql
CREATE TABLE IF NOT EXISTS pwa_push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  subscription JSONB NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fonte: 20260318_create_aluguel_contas_recorrentes.sql
CREATE TABLE IF NOT EXISTS aluguel_contas_recorrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluguel_id UUID NOT NULL REFERENCES alugueis_residencias(id) ON DELETE CASCADE,
  nome_conta VARCHAR(150) NOT NULL,
  tipo_conta VARCHAR(30) NOT NULL DEFAULT 'outros'
    CHECK (tipo_conta IN ('luz', 'agua', 'energia', 'internet', 'gas', 'condominio', 'outros')),
  valor_mensal NUMERIC(12,2) NOT NULL CHECK (valor_mensal >= 0),
  dia_vencimento INTEGER CHECK (dia_vencimento BETWEEN 1 AND 31),
  arquivo_pdf VARCHAR(500),
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by INTEGER REFERENCES usuarios(id),
  updated_by INTEGER REFERENCES usuarios(id)
);

-- Fonte: 20260402_create_tipos_grua.sql
CREATE TABLE IF NOT EXISTS tipos_grua (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(128) NOT NULL UNIQUE,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20260409_documentos_demissao.sql
CREATE TABLE IF NOT EXISTS documentos_demissao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  tipo VARCHAR(100) NOT NULL,
  data_validade DATE,
  arquivo VARCHAR(500),
  alerta_enviado BOOLEAN DEFAULT FALSE,
  assinatura_digital TEXT,
  assinado_em TIMESTAMP WITH TIME ZONE,
  assinado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fonte: 20260413_obra_checklist_itens_custom.sql
CREATE TABLE IF NOT EXISTS obra_checklist_itens_custom (
  id BIGSERIAL PRIMARY KEY,
  obra_id INTEGER NOT NULL REFERENCES obras (id) ON DELETE CASCADE,
  label VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fonte: 20260729_estoque_classificacoes_subcategorias.sql
CREATE TABLE IF NOT EXISTS estoque_classificacoes (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa')),
  exige_subcategoria BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fonte: 20260729_estoque_classificacoes_subcategorias.sql
CREATE TABLE IF NOT EXISTS estoque_subcategorias_ativo (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fonte: setup-assinaturas.sql
CREATE TABLE IF NOT EXISTS obras_documentos (
  id SERIAL PRIMARY KEY,
  obra_id INTEGER REFERENCES obras(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  arquivo_original VARCHAR(500),
  arquivo_assinado VARCHAR(500),
  caminho_arquivo VARCHAR(500),
  docu_sign_link VARCHAR(500),
  docu_sign_envelope_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'aguardando_assinatura', 'em_assinatura', 'assinado', 'rejeitado')),
  proximo_assinante_id INTEGER,
  proximo_assinante_nome VARCHAR(255),
  created_by INTEGER REFERENCES auth.users(id),
  created_by_nome VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Fonte: setup-assinaturas.sql
CREATE TABLE IF NOT EXISTS obras_documento_assinaturas (
  id SERIAL PRIMARY KEY,
  documento_id INTEGER REFERENCES obras_documentos(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL, -- Pode ser UUID do auth ou ID numérico
  ordem INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aguardando', 'assinado', 'rejeitado')),
  tipo VARCHAR(20) DEFAULT 'interno' CHECK (tipo IN ('interno', 'cliente')),
  docu_sign_link VARCHAR(500),
  docu_sign_envelope_id VARCHAR(255),
  data_envio TIMESTAMP,
  data_assinatura TIMESTAMP,
  arquivo_assinado VARCHAR(500),
  observacoes TEXT,
  email_enviado BOOLEAN DEFAULT FALSE,
  data_email_enviado TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(documento_id, user_id)
);

-- Fonte: setup-assinaturas.sql
CREATE TABLE IF NOT EXISTS obras_documento_historico (
  id SERIAL PRIMARY KEY,
  documento_id INTEGER REFERENCES obras_documentos(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES auth.users(id),
  acao VARCHAR(50) NOT NULL CHECK (acao IN ('criado', 'enviado', 'assinou', 'rejeitou', 'cancelou')),
  data_acao TIMESTAMP DEFAULT NOW(),
  arquivo_gerado VARCHAR(500),
  observacoes TEXT,
  ip_address INET,
  user_agent TEXT,
  user_nome VARCHAR(255),
  user_email VARCHAR(255),
  user_role VARCHAR(50)
);

-- -----------------------------------------------------------------------------
-- SEEDS MÍNIMOS (perfis usados pela API)
-- Código de clientes usa perfil_id = 6 para "Clientes"
-- -----------------------------------------------------------------------------

INSERT INTO perfis (id, nome, descricao, nivel_acesso, status) VALUES
  (1, 'Admin', 'Acesso completo ao sistema', 10, 'Ativo'),
  (2, 'Gestores', 'Acesso gerencial completo', 9, 'Ativo'),
  (3, 'Operários', 'Operação diária via APP', 4, 'Ativo'),
  (6, 'Clientes', 'Acesso limitado — visualização e assinatura', 1, 'Ativo')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  nivel_acesso = EXCLUDED.nivel_acesso,
  status = EXCLUDED.status,
  updated_at = NOW();

SELECT setval(pg_get_serial_sequence('perfis', 'id'), GREATEST((SELECT MAX(id) FROM perfis), 10));

-- Usuário admin de bootstrap (senha/auth ficam no Supabase Auth — criar lá com o mesmo e-mail)
INSERT INTO usuarios (nome, email, status)
VALUES ('Administrador', 'admin@admin.com', 'Ativo')
ON CONFLICT (email) DO NOTHING;

DO $$
DECLARE
  v_admin_id INTEGER;
  v_perfil_admin INTEGER := 1;
BEGIN
  SELECT id INTO v_admin_id FROM usuarios WHERE email = 'admin@admin.com';
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO usuario_perfis (usuario_id, perfil_id, status)
    VALUES (v_admin_id, v_perfil_admin, 'Ativa')
    ON CONFLICT (usuario_id, perfil_id) DO NOTHING;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- FIM DO MODELO
-- Próximo passo: aplicar migrations em database/migrations/ (ALTER + seeds).
-- =============================================================================
