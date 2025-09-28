# Sistema Financeiro - Documentação Completa para Implementação

## 📋 Visão Geral

O Sistema Financeiro é um módulo abrangente para gestão financeira de empresas de locação de gruas, incluindo vendas, compras, locações, impostos, logística e relatórios. Este documento unificado mapeia todos os campos, relacionamentos, fluxos de dados e rotas existentes para implementação completa do sistema.

## 🏗️ Arquitetura do Sistema

### Módulos Principais
1. **Vendas** - Gestão de vendas, contratos e orçamentosa
2. **Compras** - Gestão de compras e fornecedores  
3. **Locações** - Gestão de locações de gruas e plataformas
4. **Impostos** - Gestão de impostos e tributos
5. **Logística** - Gestão logística e transporte
6. **Cadastro** - Cadastros gerais do sistema
7. **Relatórios** - Relatórios e análises financeiras

## 📊 Estruturas de Dados

### 1. Interfaces Frontend (TypeScript)

#### FinancialData
```typescript
interface FinancialData {
  receberHoje: number
  pagarHoje: number
  recebimentosAtraso: number
  pagamentosAtraso: number
  saldoAtual: number
  fluxoCaixa: FluxoCaixa[]
  transferencias: Transferencia[]
}
```

#### FluxoCaixa
```typescript
interface FluxoCaixa {
  mes: string
  entrada: number
  saida: number
}
```

#### Transferencia
```typescript
interface Transferencia {
  id: number
  data: string
  valor: number
  tipo: 'entrada' | 'saida'
  descricao: string
  status: 'confirmada' | 'pendente'
}
```

#### CustoMensal
```typescript
interface CustoMensal {
  id: number
  obra_id: number
  item: string
  descricao: string
  unidade: string
  quantidade_orcamento: number
  valor_unitario: number
  total_orcamento: number
  mes: string // formato YYYY-MM
  quantidade_realizada: number
  valor_realizado: number
  quantidade_acumulada: number
  valor_acumulado: number
  quantidade_saldo: number
  valor_saldo: number
  tipo: 'contrato' | 'aditivo'
  created_at: string
  updated_at: string
  obras?: {
    id: number
    nome: string
    status: string
  }
}
```

## 🗄️ Estruturas de Banco de Dados

### 1. Tabela: historico_locacoes
```sql
CREATE TABLE historico_locacoes (
  id SERIAL PRIMARY KEY,
  grua_id VARCHAR NOT NULL,
  obra_id INTEGER NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  funcionario_responsavel_id INTEGER,
  tipo_operacao VARCHAR(20) NOT NULL CHECK (tipo_operacao IN ('Início', 'Transferência', 'Fim', 'Pausa', 'Retomada')),
  valor_locacao DECIMAL(10,2),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Tabela: custos_mensais
```sql
CREATE TABLE custos_mensais (
  id SERIAL PRIMARY KEY,
  obra_id INTEGER NOT NULL REFERENCES obras(id),
  item VARCHAR(20) NOT NULL,
  descricao TEXT NOT NULL,
  unidade VARCHAR(10) NOT NULL CHECK (unidade IN ('mês', 'und', 'und.', 'km', 'h', 'kg', 'm²', 'm³')),
  quantidade_orcamento DECIMAL(10,2) NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL,
  total_orcamento DECIMAL(10,2) GENERATED ALWAYS AS (quantidade_orcamento * valor_unitario) STORED,
  mes VARCHAR(7) NOT NULL CHECK (mes ~ '^\d{4}-\d{2}$'), -- formato YYYY-MM
  quantidade_realizada DECIMAL(10,2) DEFAULT 0,
  valor_realizado DECIMAL(10,2) DEFAULT 0,
  quantidade_acumulada DECIMAL(10,2) DEFAULT 0,
  valor_acumulado DECIMAL(10,2) DEFAULT 0,
  quantidade_saldo DECIMAL(10,2) GENERATED ALWAYS AS (quantidade_orcamento - quantidade_acumulada) STORED,
  valor_saldo DECIMAL(10,2) GENERATED ALWAYS AS (total_orcamento - valor_acumulado) STORED,
  tipo VARCHAR(10) DEFAULT 'contrato' CHECK (tipo IN ('contrato', 'aditivo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Tabela: transferencias_bancarias
```sql
CREATE TABLE transferencias_bancarias (
  id SERIAL PRIMARY KEY,
  data DATE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  descricao TEXT NOT NULL,
  banco_origem VARCHAR(100),
  banco_destino VARCHAR(100),
  documento_comprobatório VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('confirmada', 'pendente', 'cancelada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Tabela: contas_bancarias
```sql
CREATE TABLE contas_bancarias (
  id SERIAL PRIMARY KEY,
  banco VARCHAR(100) NOT NULL,
  agencia VARCHAR(10) NOT NULL,
  conta VARCHAR(20) NOT NULL,
  tipo_conta VARCHAR(20) NOT NULL CHECK (tipo_conta IN ('corrente', 'poupanca', 'investimento')),
  saldo_atual DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'bloqueada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Tabela: vendas
```sql
CREATE TABLE vendas (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  obra_id INTEGER REFERENCES obras(id),
  numero_venda VARCHAR(50) UNIQUE NOT NULL,
  data_venda DATE NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmada', 'cancelada', 'finalizada')),
  tipo_venda VARCHAR(20) NOT NULL CHECK (tipo_venda IN ('equipamento', 'servico', 'locacao')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. Tabela: vendas_itens
```sql
CREATE TABLE vendas_itens (
  id SERIAL PRIMARY KEY,
  venda_id INTEGER NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id),
  grua_id VARCHAR REFERENCES gruas(id),
  descricao TEXT NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. Tabela: compras
```sql
CREATE TABLE compras (
  id SERIAL PRIMARY KEY,
  fornecedor_id INTEGER NOT NULL REFERENCES fornecedores(id),
  numero_pedido VARCHAR(50) UNIQUE NOT NULL,
  data_pedido DATE NOT NULL,
  data_entrega DATE,
  valor_total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'enviado', 'recebido', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8. Tabela: compras_itens
```sql
CREATE TABLE compras_itens (
  id SERIAL PRIMARY KEY,
  compra_id INTEGER NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id),
  descricao TEXT NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9. Tabela: fornecedores
```sql
CREATE TABLE fornecedores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  contato VARCHAR(255),
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 10. Tabela: notas_fiscais
```sql
CREATE TABLE notas_fiscais (
  id SERIAL PRIMARY KEY,
  numero_nf VARCHAR(50) UNIQUE NOT NULL,
  serie VARCHAR(10),
  data_emissao DATE NOT NULL,
  data_vencimento DATE,
  valor_total DECIMAL(10,2) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'vencida', 'cancelada')),
  cliente_id INTEGER REFERENCES clientes(id),
  fornecedor_id INTEGER REFERENCES fornecedores(id),
  venda_id INTEGER REFERENCES vendas(id),
  compra_id INTEGER REFERENCES compras(id),
  arquivo_nf VARCHAR(255), -- Caminho do arquivo PDF/XML
  nome_arquivo VARCHAR(255), -- Nome original do arquivo
  tamanho_arquivo INTEGER, -- Tamanho em bytes
  tipo_arquivo VARCHAR(10), -- PDF, XML, etc.
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 11. Tabela: impostos
```sql
CREATE TABLE impostos (
  id SERIAL PRIMARY KEY,
  tipo_imposto VARCHAR(50) NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
  referencia VARCHAR(20), -- mês/ano de referência
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 12. Tabela: logistica_manifestos
```sql
CREATE TABLE logistica_manifestos (
  id SERIAL PRIMARY KEY,
  numero_manifesto VARCHAR(50) UNIQUE NOT NULL,
  data_emissao DATE NOT NULL,
  motorista_id INTEGER NOT NULL REFERENCES motoristas(id),
  veiculo_id INTEGER REFERENCES veiculos(id),
  origem VARCHAR(255) NOT NULL,
  destino VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_transito', 'entregue', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 13. Tabela: logistica_manifestos_itens
```sql
CREATE TABLE logistica_manifestos_itens (
  id SERIAL PRIMARY KEY,
  manifesto_id INTEGER NOT NULL REFERENCES logistica_manifestos(id) ON DELETE CASCADE,
  grua_id VARCHAR NOT NULL REFERENCES gruas(id),
  obra_origem_id INTEGER REFERENCES obras(id),
  obra_destino_id INTEGER REFERENCES obras(id),
  peso DECIMAL(10,2),
  dimensoes VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 14. Tabela: motoristas
```sql
CREATE TABLE motoristas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  cnh VARCHAR(20) UNIQUE NOT NULL,
  categoria_cnh VARCHAR(5) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco TEXT,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 15. Tabela: veiculos
```sql
CREATE TABLE veiculos (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(10) UNIQUE NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  marca VARCHAR(50) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  capacidade DECIMAL(10,2),
  ano INTEGER,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'manutencao')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 Fluxos de Dados

### 1. Fluxo de Vendas
```
Cliente → Orçamento → Venda → Upload NF → Recebimento
```

**Campos obrigatórios:**
- cliente_id, data_venda, valor_total, tipo_venda

**Relacionamentos:**
- vendas → clientes (cliente_id)
- vendas → obras (obra_id)
- vendas_itens → vendas (venda_id)
- vendas_itens → produtos (produto_id)
- vendas_itens → gruas (grua_id)

### 2. Fluxo de Compras
```
Fornecedor → Pedido → Compra → Upload NF → Pagamento
```

**Campos obrigatórios:**
- fornecedor_id, numero_pedido, data_pedido, valor_total

**Relacionamentos:**
- compras → fornecedores (fornecedor_id)
- compras_itens → compras (compra_id)
- compras_itens → produtos (produto_id)

### 3. Fluxo de Locações
```
Obra → Grua → Locação → Medição → Faturamento → Recebimento
```

**Campos obrigatórios:**
- grua_id, obra_id, data_inicio, valor_locacao

**Relacionamentos:**
- historico_locacoes → gruas (grua_id)
- historico_locacoes → obras (obra_id)
- historico_locacoes → funcionarios (funcionario_responsavel_id)

### 4. Fluxo de Transferências Bancárias
```
Transferência → Validação → Confirmação → Atualização de Saldo
```

**Campos obrigatórios:**
- data, valor, tipo, descricao

## 🛠️ Rotas Backend Necessárias

### 1. Rotas de Vendas
```javascript
// GET /api/vendas - Listar vendas
// POST /api/vendas - Criar venda
// GET /api/vendas/:id - Obter venda específica
// PUT /api/vendas/:id - Atualizar venda
// DELETE /api/vendas/:id - Excluir venda
// GET /api/vendas/:id/itens - Listar itens da venda
// POST /api/vendas/:id/itens - Adicionar item à venda
```

### 2. Rotas de Compras
```javascript
// GET /api/compras - Listar compras
// POST /api/compras - Criar compra
// GET /api/compras/:id - Obter compra específica
// PUT /api/compras/:id - Atualizar compra
// DELETE /api/compras/:id - Excluir compra
// GET /api/compras/:id/itens - Listar itens da compra
// POST /api/compras/:id/itens - Adicionar item à compra
```

### 3. Rotas de Fornecedores
```javascript
// GET /api/fornecedores - Listar fornecedores
// POST /api/fornecedores - Criar fornecedor
// GET /api/fornecedores/:id - Obter fornecedor específico
// PUT /api/fornecedores/:id - Atualizar fornecedor
// DELETE /api/fornecedores/:id - Excluir fornecedor
```

### 4. Rotas de Transferências
```javascript
// GET /api/transferencias - Listar transferências
// POST /api/transferencias - Criar transferência
// PUT /api/transferencias/:id - Atualizar transferência
// DELETE /api/transferencias/:id - Excluir transferência
// POST /api/transferencias/:id/confirmar - Confirmar transferência
```

### 5. Rotas de Contas Bancárias (Dados Manuais)
```javascript
// GET /api/contas-bancarias - Listar contas
// POST /api/contas-bancarias - Criar conta
// PUT /api/contas-bancarias/:id - Atualizar conta
// DELETE /api/contas-bancarias/:id - Excluir conta
// PUT /api/contas-bancarias/:id/saldo - Atualizar saldo manualmente
```

### 6. Rotas de Notas Fiscais (Apenas Upload de Arquivos)
```javascript
// GET /api/notas-fiscais - Listar notas fiscais
// POST /api/notas-fiscais - Criar registro de nota fiscal
// GET /api/notas-fiscais/:id - Obter nota fiscal específica
// PUT /api/notas-fiscais/:id - Atualizar nota fiscal
// DELETE /api/notas-fiscais/:id - Excluir nota fiscal
// POST /api/notas-fiscais/:id/upload - Upload de arquivo PDF/XML
// GET /api/notas-fiscais/:id/download - Download do arquivo
```

### 7. Rotas de Impostos
```javascript
// GET /api/impostos - Listar impostos
// POST /api/impostos - Criar imposto
// PUT /api/impostos/:id - Atualizar imposto
// DELETE /api/impostos/:id - Excluir imposto
// POST /api/impostos/:id/pagar - Marcar como pago
```

### 8. Rotas de Logística
```javascript
// GET /api/manifestos - Listar manifestos
// POST /api/manifestos - Criar manifesto
// GET /api/manifestos/:id - Obter manifesto específico
// PUT /api/manifestos/:id - Atualizar manifesto
// DELETE /api/manifestos/:id - Excluir manifesto
// GET /api/manifestos/:id/itens - Listar itens do manifesto
// POST /api/manifestos/:id/itens - Adicionar item ao manifesto

// GET /api/motoristas - Listar motoristas
// POST /api/motoristas - Criar motorista
// GET /api/motoristas/:id - Obter motorista específico
// PUT /api/motoristas/:id - Atualizar motorista
// DELETE /api/motoristas/:id - Excluir motorista

// GET /api/veiculos - Listar veículos
// POST /api/veiculos - Criar veículo
// GET /api/veiculos/:id - Obter veículo específico
// PUT /api/veiculos/:id - Atualizar veículo
// DELETE /api/veiculos/:id - Excluir veículo
```

### 9. Rotas de Relatórios Financeiros
```javascript
// GET /api/relatorios/financeiro - Relatório financeiro geral
// GET /api/relatorios/vendas - Relatório de vendas
// GET /api/relatorios/compras - Relatório de compras
// GET /api/relatorios/locacoes - Relatório de locações
// GET /api/relatorios/fluxo-caixa - Relatório de fluxo de caixa
// GET /api/relatorios/impostos - Relatório de impostos
```

## 📋 Validações e Schemas

### Schema de Venda
```javascript
const vendaSchema = Joi.object({
  cliente_id: Joi.number().integer().positive().required(),
  obra_id: Joi.number().integer().positive().optional(),
  numero_venda: Joi.string().min(1).max(50).required(),
  data_venda: Joi.date().required(),
  valor_total: Joi.number().min(0).required(),
  status: Joi.string().valid('pendente', 'confirmada', 'cancelada', 'finalizada').default('pendente'),
  tipo_venda: Joi.string().valid('equipamento', 'servico', 'locacao').required(),
  observacoes: Joi.string().optional()
})
```

### Schema de Compra
```javascript
const compraSchema = Joi.object({
  fornecedor_id: Joi.number().integer().positive().required(),
  numero_pedido: Joi.string().min(1).max(50).required(),
  data_pedido: Joi.date().required(),
  data_entrega: Joi.date().optional(),
  valor_total: Joi.number().min(0).required(),
  status: Joi.string().valid('pendente', 'aprovado', 'enviado', 'recebido', 'cancelado').default('pendente'),
  observacoes: Joi.string().optional()
})
```

### Schema de Fornecedor
```javascript
const fornecedorSchema = Joi.object({
  nome: Joi.string().min(2).required(),
  cnpj: Joi.string().required(),
  email: Joi.string().email().allow('').optional(),
  telefone: Joi.string().allow('').optional(),
  endereco: Joi.string().allow('').optional(),
  cidade: Joi.string().allow('').optional(),
  estado: Joi.string().length(2).allow('').optional(),
  cep: Joi.string().pattern(/^[\d]{2}\.?[\d]{3}-?[\d]{3}$/).allow('').optional(),
  contato: Joi.string().allow('').optional()
})
```

### Schema de Transferência
```javascript
const transferenciaSchema = Joi.object({
  data: Joi.date().required(),
  valor: Joi.number().min(0).required(),
  tipo: Joi.string().valid('entrada', 'saida').required(),
  descricao: Joi.string().min(1).required(),
  banco_origem: Joi.string().optional(),
  banco_destino: Joi.string().optional(),
  documento_comprobatório: Joi.string().optional()
})
```

### Schema de Nota Fiscal
```javascript
const notaFiscalSchema = Joi.object({
  numero_nf: Joi.string().min(1).max(50).required(),
  serie: Joi.string().max(10).optional(),
  data_emissao: Joi.date().required(),
  data_vencimento: Joi.date().optional(),
  valor_total: Joi.number().min(0).required(),
  tipo: Joi.string().valid('entrada', 'saida').required(),
  status: Joi.string().valid('pendente', 'paga', 'vencida', 'cancelada').default('pendente'),
  cliente_id: Joi.number().integer().positive().optional(),
  fornecedor_id: Joi.number().integer().positive().optional(),
  venda_id: Joi.number().integer().positive().optional(),
  compra_id: Joi.number().integer().positive().optional(),
  observacoes: Joi.string().optional()
})
```

### Schema de Imposto
```javascript
const impostoSchema = Joi.object({
  tipo_imposto: Joi.string().min(1).max(50).required(),
  descricao: Joi.string().min(1).required(),
  valor: Joi.number().min(0).required(),
  data_vencimento: Joi.date().required(),
  data_pagamento: Joi.date().optional(),
  status: Joi.string().valid('pendente', 'pago', 'vencido', 'cancelado').default('pendente'),
  referencia: Joi.string().max(20).optional(),
  observacoes: Joi.string().optional()
})
```

## 🔐 Permissões e Segurança

### Permissões Necessárias
- `visualizar_financeiro` - Visualizar dados financeiros
- `editar_vendas` - Criar/editar vendas
- `editar_compras` - Criar/editar compras
- `editar_transferencias` - Criar/editar transferências
- `gerar_relatorios` - Gerar relatórios financeiros
- `gerenciar_impostos` - Gerenciar impostos
- `gerenciar_logistica` - Gerenciar logística

### Middleware de Autenticação
```javascript
// Aplicar em todas as rotas financeiras
router.use(authenticateToken)
router.use(requirePermission('visualizar_financeiro'))
```

## 📁 Sistema de Upload de Arquivos

### Estrutura de Armazenamento
```
/uploads/
├── notas-fiscais/
│   ├── entrada/
│   │   ├── 2024/
│   │   │   ├── 01/
│   │   │   └── 02/
│   │   └── 2023/
│   └── saida/
│       ├── 2024/
│       └── 2023/
├── transferencias/
│   └── comprovantes/
└── impostos/
    └── documentos/
```

### Tipos de Arquivo Suportados
- **Notas Fiscais**: PDF, XML
- **Comprovantes de Transferência**: PDF, JPG, PNG
- **Documentos de Impostos**: PDF, XML

### Validações de Upload
- Tamanho máximo: 10MB por arquivo
- Tipos permitidos: PDF, XML, JPG, PNG
- Nomenclatura: `{tipo}_{numero}_{data}.{extensao}`
- Verificação de duplicidade por hash MD5

### Rotas de Upload
```javascript
// POST /api/upload/nota-fiscal - Upload de nota fiscal
// POST /api/upload/comprovante - Upload de comprovante
// GET /api/files/:id/download - Download de arquivo
// DELETE /api/files/:id - Excluir arquivo
```

## 📊 Relatórios e Analytics

### 1. Dashboard Financeiro
- Saldo atual por conta bancária
- Recebimentos e pagamentos do dia
- Valores em atraso
- Fluxo de caixa mensal
- Transferências recentes

### 2. Relatórios de Vendas
- Vendas por período
- Vendas por cliente
- Vendas por tipo
- Produtos mais vendidos
- Análise de tendências

### 3. Relatórios de Compras
- Compras por período
- Compras por fornecedor
- Análise de custos
- Fornecedores mais utilizados

### 4. Relatórios de Locações
- Receita por grua
- Utilização por período
- Análise de rentabilidade
- Obras mais lucrativas

## 🔄 Funcionalidades do Sistema

### 1. Gestão de Contas Bancárias
- Cadastro manual de contas bancárias
- Atualização manual de saldos
- Controle de transferências entre contas
- Histórico de movimentações

### 2. Gestão de Notas Fiscais
- Upload de arquivos PDF/XML de notas fiscais
- Armazenamento seguro de documentos
- Vinculação com vendas/compras
- Controle de status de pagamento

### 3. Sistema de Comunicação
- Envio de boletos por e-mail
- Notificações por WhatsApp
- Alertas de vencimento
- Relatórios por e-mail

## 📋 Mapeamento de Rotas Existentes vs Módulos Financeiros

### ✅ **ROTAS EXISTENTES QUE SE RELACIONAM COM O FINANCEIRO (8 rotas)**

#### 1. **custos-mensais.js** ✅ **DIRETAMENTE RELACIONADO**
- **Módulo Financeiro**: Locações → Medições Finalizadas
- **Rota**: `/api/custos-mensais`
- **Status**: ✅ **IMPLEMENTADO** - Pode ser usado diretamente

#### 2. **relatorios.js** ✅ **DIRETAMENTE RELACIONADO**
- **Módulo Financeiro**: Relatórios (todos os submodules)
- **Rotas**: `/api/relatorios/financeiro`, `/api/relatorios/utilizacao`
- **Status**: ✅ **IMPLEMENTADO** - Pode ser usado diretamente

#### 3. **contratos.js** ✅ **DIRETAMENTE RELACIONADO**
- **Módulo Financeiro**: Vendas → Contratos
- **Rota**: `/api/contratos`
- **Status**: ✅ **IMPLEMENTADO** - Pode ser usado diretamente

#### 4. **clientes.js** ✅ **DIRETAMENTE RELACIONADO**
- **Módulo Financeiro**: Cadastro → Clientes
- **Rota**: `/api/clientes`
- **Status**: ✅ **IMPLEMENTADO** - Pode ser usado diretamente

#### 5. **obras.js** ✅ **DIRETAMENTE RELACIONADO**
- **Módulo Financeiro**: Locações → Gruas Locadas, Orçamentos
- **Rota**: `/api/obras`
- **Status**: ✅ **IMPLEMENTADO** - Pode ser usado diretamente

#### 6. **estoque.js** ✅ **DIRETAMENTE RELACIONADO**
- **Módulo Financeiro**: Compras → Produtos e Serviços, Cadastro → Produtos
- **Rota**: `/api/estoque`
- **Status**: ✅ **IMPLEMENTADO** - Pode ser usado diretamente

#### 7. **arquivos.js** ✅ **DIRETAMENTE RELACIONADO**
- **Módulo Financeiro**: Upload de Notas Fiscais, Comprovantes
- **Rota**: `/api/arquivos`
- **Status**: ✅ **IMPLEMENTADO** - Pode ser usado diretamente

#### 8. **funcionarios.js** ✅ **DIRETAMENTE RELACIONADO**
- **Módulo Financeiro**: Cadastro → Funcionários
- **Rota**: `/api/funcionarios`
- **Status**: ✅ **IMPLEMENTADO** - Pode ser usado diretamente

### ❌ **ROTAS QUE NÃO EXISTEM E PRECISAM SER CRIADAS (6 módulos)**

#### 1. **Vendas** ❌ **NÃO EXISTE**
- **Módulo Financeiro**: Vendas (todos os submodules)
- **Status**: ❌ **NÃO IMPLEMENTADO** - Precisa ser criado

#### 2. **Compras** ❌ **NÃO EXISTE**
- **Módulo Financeiro**: Compras (todos os submodules)
- **Status**: ❌ **NÃO IMPLEMENTADO** - Precisa ser criado

#### 3. **Transferências Bancárias** ❌ **NÃO EXISTE**
- **Módulo Financeiro**: Integração Bancária
- **Status**: ❌ **NÃO IMPLEMENTADO** - Precisa ser criado

#### 4. **Notas Fiscais** ❌ **NÃO EXISTE**
- **Módulo Financeiro**: Vendas/Compras → Notas Fiscais
- **Status**: ❌ **NÃO IMPLEMENTADO** - Precisa ser criado

#### 5. **Impostos** ❌ **NÃO EXISTE**
- **Módulo Financeiro**: Impostos (todos os submodules)
- **Status**: ❌ **NÃO IMPLEMENTADO** - Precisa ser criado

#### 6. **Logística** ❌ **NÃO EXISTE**
- **Módulo Financeiro**: Logística (todos os submodules)
- **Status**: ❌ **NÃO IMPLEMENTADO** - Precisa ser criado

### 🔄 **ROTAS QUE PODEM SER REUTILIZADAS COM MODIFICAÇÕES (2 rotas)**

#### 1. **gruas.js** 🔄 **PODE SER REUTILIZADO**
- **Módulo Financeiro**: Locações → Gruas Locadas
- **Modificações Necessárias**: Adicionar campos financeiros
- **Status**: 🔄 **PARCIALMENTE IMPLEMENTADO** - Precisa de modificações

#### 2. **livro-grua.js** 🔄 **PODE SER REUTILIZADO**
- **Módulo Financeiro**: Locações → Medições Finalizadas
- **Modificações Necessárias**: Integrar com sistema de custos mensais
- **Status**: 🔄 **PARCIALMENTE IMPLEMENTADO** - Precisa de integração

## 📝 Notas de Implementação

### 1. Transações de Banco
- Usar transações para operações críticas
- Implementar rollback em caso de erro
- Validar integridade referencial

### 2. Performance
- Criar índices nas colunas de busca frequente
- Implementar paginação em listagens
- Cache para dados frequentemente acessados

### 3. Auditoria
- Log de todas as operações financeiras
- Rastreamento de alterações
- Backup automático de dados críticos

### 4. Validações
- Validação de CNPJ/CPF
- Verificação de duplicidade
- Validação de valores monetários
- Validação de tipos de arquivo (PDF, XML)
- Verificação de tamanho de arquivos

## 🚀 Próximos Passos

1. **Implementar tabelas no banco de dados**
2. **Criar rotas backend com validações**
3. **Implementar middleware de autenticação**
4. **Criar interfaces frontend**
5. **Implementar sistema de upload de arquivos**
6. **Implementar relatórios e dashboards**
7. **Configurar sistema de comunicação (e-mail/WhatsApp)**
8. **Implementar sistema de auditoria**
9. **Configurar backup e recuperação**

## 📊 Resumo da Análise

### ✅ **ROTAS PRONTAS PARA USO (8 rotas)**
1. `custos-mensais.js` - Custos mensais por obra
2. `relatorios.js` - Relatórios financeiros
3. `contratos.js` - Contratos de locação/venda
4. `clientes.js` - Cadastro de clientes
5. `obras.js` - Obras com dados financeiros
6. `estoque.js` - Produtos e movimentações
7. `arquivos.js` - Upload de documentos
8. `funcionarios.js` - Cadastro de funcionários

### ❌ **ROTAS QUE PRECISAM SER CRIADAS (6 módulos)**
1. **Vendas** - Sistema completo de vendas
2. **Compras** - Sistema completo de compras
3. **Transferências Bancárias** - Gestão financeira
4. **Notas Fiscais** - Controle fiscal
5. **Impostos** - Gestão tributária
6. **Logística** - Gestão de transportes

### 🔄 **ROTAS QUE PRECISAM DE MODIFICAÇÕES (2 rotas)**
1. `gruas.js` - Adicionar campos financeiros
2. `livro-grua.js` - Integrar com custos mensais

## 🎯 **Recomendações para Implementação**

1. **Reutilizar rotas existentes** para acelerar o desenvolvimento
2. **Criar novas rotas** seguindo o padrão das existentes
3. **Modificar rotas existentes** para incluir campos financeiros
4. **Manter consistência** nos schemas de validação (Joi)
5. **Usar middleware de autenticação** já implementado

---

**Conclusão**: Das 34 funcionalidades listadas no dashboard financeiro, **8 já estão implementadas** no backend (23%), **6 precisam ser criadas do zero** (77%), e **2 precisam de modificações**. Isso representa uma base sólida para implementação do sistema financeiro completo.

Esta documentação unificada fornece todas as informações necessárias para uma LLM implementar completamente o sistema financeiro, incluindo estruturas de dados, relacionamentos, fluxos, rotas existentes e novas, validações, permissões e funcionalidades.
