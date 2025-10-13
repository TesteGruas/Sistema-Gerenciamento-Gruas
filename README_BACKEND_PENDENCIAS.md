# 🔧 PENDÊNCIAS DO BACKEND - Sistema de Gerenciamento de Gruas

**Data:** 09 de Outubro de 2025  
**Status Backend:** 75% Completo  
**Tempo Estimado para Conclusão:** 4 semanas

---

## 📊 RESUMO EXECUTIVO

| Categoria | Total | Completo | Pendente | % |
|-----------|-------|----------|----------|---|
| **Novos Módulos** | 2 | 0 | 2 | 0% |
| **Módulos Financeiros** | 8 | 4 | 4 | 50% |
| **Módulos RH** | 6 | 5 | 1 | 83% |
| **Integrações** | 4 | 1 | 3 | 25% |
| **Sistema Exportação** | 1 | 0 | 1 | 0% |
| **TOTAL** | **21** | **10** | **11** | **48%** |

---

## 🔴 PRIORIDADE CRÍTICA

### 1. Sistema de Notificações
**Localização:** `backend-api/src/routes/notificacoes.js` (NÃO EXISTE)  
**Status:** Frontend 100% | Backend 0%  
**Impacto:** Alto - Sistema já usa na interface

#### Endpoints a Implementar:

```javascript
// 1.1 GET /api/notificacoes
// Listar notificações do usuário logado
Query: { lida?: boolean, limit?: number, offset?: number }
Response: { success, data: Notificacao[], total, naoLidas }

// 1.2 POST /api/notificacoes
// Criar nova notificação
Body: {
  titulo: string,
  mensagem: string,
  tipo: 'info' | 'alerta' | 'sucesso' | 'erro',
  prioridade: 'baixa' | 'media' | 'alta',
  destinatarioTipo: 'geral' | 'cliente' | 'funcionario' | 'obra',
  destinatarios?: Array<{ id, tipo, nome, info }>
}

// 1.3 PUT /api/notificacoes/:id/marcar-lida
// Marcar notificação como lida

// 1.4 DELETE /api/notificacoes/:id
// Deletar notificação
```

#### Banco de Dados:

```sql
-- Tabela: notificacoes
CREATE TABLE notificacoes (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'info', 'alerta', 'sucesso', 'erro'
  prioridade VARCHAR(50) NOT NULL, -- 'baixa', 'media', 'alta'
  destinatario_tipo VARCHAR(50), -- 'geral', 'cliente', 'funcionario', 'obra'
  destinatario_id INTEGER,
  lida BOOLEAN DEFAULT FALSE,
  data_leitura TIMESTAMP,
  created_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: notificacoes_destinatarios
CREATE TABLE notificacoes_destinatarios (
  id SERIAL PRIMARY KEY,
  notificacao_id INTEGER REFERENCES notificacoes(id) ON DELETE CASCADE,
  destinatario_id INTEGER NOT NULL,
  destinatario_tipo VARCHAR(50) NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  data_leitura TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Funcionalidades Adicionais:
- [ ] Sistema de push notifications (FCM/OneSignal)
- [ ] Envio de email para notificações importantes
- [ ] Notificações PWA
- [ ] WebSocket para notificações em tempo real

**Estimativa:** 1 semana  
**Prioridade:** 🔴 CRÍTICA

---

### 2. Aluguéis de Residências
**Localização:** `backend-api/src/routes/alugueis-residencias.js` (NÃO EXISTE)  
**Status:** Frontend 100% | Backend 0%  
**Impacto:** Alto - Módulo financeiro completo aguardando

#### Endpoints a Implementar (16 no total):

**Residências (5 endpoints):**
```javascript
// 2.1 GET /api/residencias
// Listar todas as residências

// 2.2 GET /api/residencias/:id
// Buscar residência por ID

// 2.3 POST /api/residencias
// Criar nova residência
Body: {
  tipo: 'casa' | 'apartamento' | 'kitnet',
  endereco: string,
  bairro: string,
  cidade: string,
  estado: string,
  cep: string,
  valor_aluguel: number,
  valor_condominio?: number,
  valor_iptu?: number,
  quartos: number,
  banheiros: number,
  area_m2: number,
  mobiliado: boolean,
  status: 'disponivel' | 'ocupada' | 'manutencao',
  fotos?: string[],
  observacoes?: string
}

// 2.4 PUT /api/residencias/:id
// Atualizar residência

// 2.5 DELETE /api/residencias/:id
// Deletar residência (soft delete)
```

**Aluguéis (5 endpoints):**
```javascript
// 2.6 GET /api/alugueis
// Listar todos os contratos de aluguel
Query: { status?: string, funcionario_id?: number }

// 2.7 GET /api/alugueis/:id
// Buscar contrato por ID

// 2.8 POST /api/alugueis
// Criar novo contrato de aluguel
Body: {
  residencia_id: number,
  funcionario_id: number,
  data_inicio: date,
  data_fim?: date,
  valor_aluguel: number,
  valor_subsidio: number,
  desconto_folha: boolean,
  dia_vencimento: number,
  observacoes?: string
}

// 2.9 PUT /api/alugueis/:id
// Atualizar contrato

// 2.10 POST /api/alugueis/:id/encerrar
// Encerrar contrato
Body: { data_encerramento: date, motivo: string }
```

**Pagamentos (4 endpoints):**
```javascript
// 2.11 GET /api/alugueis/:id/pagamentos
// Listar pagamentos de um contrato

// 2.12 POST /api/alugueis/:id/pagamentos
// Registrar pagamento
Body: {
  mes_referencia: string,
  data_vencimento: date,
  data_pagamento?: date,
  valor_pago: number,
  status: 'pendente' | 'pago' | 'atrasado',
  forma_pagamento?: string,
  observacoes?: string
}

// 2.13 PUT /api/alugueis/:id/pagamentos/:pagId
// Atualizar pagamento

// 2.14 GET /api/alugueis/pagamentos/pendentes
// Listar todos os pagamentos pendentes
```

**Relatórios (2 endpoints):**
```javascript
// 2.15 GET /api/alugueis/estatisticas
// Dashboard de estatísticas
Response: {
  total_residencias: number,
  residencias_ocupadas: number,
  residencias_disponiveis: number,
  total_contratos_ativos: number,
  valor_total_subsidios: number,
  pagamentos_pendentes: number,
  valor_pendente: number
}

// 2.16 GET /api/alugueis/relatorio-financeiro
// Relatório financeiro por período
Query: { data_inicio: date, data_fim: date }
```

#### Banco de Dados:

```sql
-- Tabela: residencias
CREATE TABLE residencias (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  endereco VARCHAR(255) NOT NULL,
  bairro VARCHAR(100),
  cidade VARCHAR(100) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  cep VARCHAR(10),
  valor_aluguel DECIMAL(10,2) NOT NULL,
  valor_condominio DECIMAL(10,2),
  valor_iptu DECIMAL(10,2),
  quartos INTEGER,
  banheiros INTEGER,
  area_m2 DECIMAL(10,2),
  mobiliado BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'disponivel',
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Tabela: residencias_fotos
CREATE TABLE residencias_fotos (
  id SERIAL PRIMARY KEY,
  residencia_id INTEGER REFERENCES residencias(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: alugueis_residencias
CREATE TABLE alugueis_residencias (
  id SERIAL PRIMARY KEY,
  residencia_id INTEGER REFERENCES residencias(id),
  funcionario_id INTEGER REFERENCES funcionarios(id),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  valor_aluguel DECIMAL(10,2) NOT NULL,
  valor_subsidio DECIMAL(10,2) DEFAULT 0,
  desconto_folha BOOLEAN DEFAULT TRUE,
  dia_vencimento INTEGER DEFAULT 10,
  status VARCHAR(50) DEFAULT 'ativo',
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: pagamentos_aluguel
CREATE TABLE pagamentos_aluguel (
  id SERIAL PRIMARY KEY,
  aluguel_id INTEGER REFERENCES alugueis_residencias(id) ON DELETE CASCADE,
  mes_referencia VARCHAR(7) NOT NULL, -- YYYY-MM
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  valor_pago DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pendente',
  forma_pagamento VARCHAR(100),
  comprovante_url VARCHAR(500),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Integrações Necessárias:
- [ ] Integração com módulo de Funcionários
- [ ] Integração com Folha de Pagamento (desconto em folha)
- [ ] Integração com módulo Financeiro (lançamentos contábeis)
- [ ] Sistema de notificações (alertas de vencimento)
- [ ] Upload de documentos/fotos (Supabase Storage)

**Estimativa:** 2 semanas  
**Prioridade:** 🔴 CRÍTICA

---

### 3. Sistema de Exportação Universal
**Localização:** `backend-api/src/utils/export.js` (NÃO EXISTE)  
**Status:** Frontend 100% | Backend 0%

#### Funcionalidades a Implementar:

```javascript
// 3.1 Classe de Exportação
class ExportService {
  // Exportar para PDF
  async exportToPDF(dados, template, opcoes)
  
  // Exportar para Excel
  async exportToExcel(dados, planilhas, opcoes)
  
  // Exportar para CSV
  async exportToCSV(dados, opcoes)
  
  // Gerar gráficos
  async gerarGrafico(tipo, dados, opcoes)
}

// 3.2 Templates de Relatórios
- Template de Espelho de Ponto
- Template de Relatório Financeiro
- Template de Relatório de Gruas
- Template de Relatório de Obras
- Template de Nota Fiscal
```

#### Endpoints:

```javascript
// POST /api/exportar/:tipo
// Gerar exportação
Body: {
  formato: 'pdf' | 'excel' | 'csv',
  dados: array,
  filtros?: object,
  colunas?: array,
  titulo?: string
}
Response: Blob (PDF/Excel) ou JSON (CSV)
```

#### Bibliotecas Sugeridas:
- **PDF:** puppeteer, pdfkit, ou jsPDF
- **Excel:** exceljs ou xlsx
- **Gráficos:** chartjs-node-canvas

**Estimativa:** 1 semana  
**Prioridade:** 🔴 CRÍTICA

---

## 🟡 PRIORIDADE ALTA

### 4. Relatórios Financeiros Completos
**Localização:** `backend-api/src/routes/relatorios-financeiros.js` (NÃO EXISTE)  
**Status Frontend:** ⚠️ Mockado (`app/dashboard/financeiro/relatorios/page.tsx`)

#### Endpoints a Implementar:

```javascript
// 4.1 POST /api/relatorios/gerar
// Gerar relatório customizado
Body: {
  tipo: 'financeiro' | 'vendas' | 'locacoes' | 'estoque',
  periodo_inicio: date,
  periodo_fim: date,
  formato: 'json' | 'pdf' | 'excel',
  filtros?: object
}

// 4.2 GET /api/relatorios/faturamento
// Relatório de faturamento mensal
Query: { ano: number, mes?: number }

// 4.3 GET /api/relatorios/vendas
// Relatório de vendas por período
Query: { data_inicio: date, data_fim: date, cliente_id?: number }

// 4.4 GET /api/relatorios/locacoes
// Relatório de locações
Query: { data_inicio: date, data_fim: date, status?: string }

// 4.5 GET /api/relatorios/fluxo-caixa
// Relatório de fluxo de caixa detalhado
Query: { data_inicio: date, data_fim: date }

// 4.6 GET /api/relatorios/dre
// Demonstrativo de Resultado do Exercício
Query: { ano: number, mes?: number }
```

#### Funcionalidades:
- [ ] Geração de PDF com gráficos
- [ ] Exportação para Excel (XLSX)
- [ ] Cálculo automático de margens e lucros
- [ ] Comparativo entre períodos
- [ ] Dashboard executivo

**Estimativa:** 1 semana  
**Prioridade:** 🔴 ALTA

---

### 5. Impostos
**Localização:** `backend-api/src/routes/impostos.js` (NÃO EXISTE)  
**Status Frontend:** ❌ Mockado (`app/dashboard/financeiro/impostos/page.tsx`)

#### Endpoints a Implementar:

```javascript
// 5.1 GET /api/impostos
// Listar impostos do período
Query: { mes: string, ano: number }

// 5.2 POST /api/impostos/calcular
// Calcular impostos automaticamente
Body: {
  mes_referencia: string,
  receita_bruta: number,
  deducoes: number,
  regime_tributario: 'simples' | 'lucro_presumido' | 'lucro_real'
}

// 5.3 POST /api/impostos/pagar
// Registrar pagamento de imposto
Body: {
  tipo_imposto: string,
  mes_referencia: string,
  valor: number,
  data_pagamento: date,
  codigo_darf: string
}

// 5.4 GET /api/impostos/relatorio
// Relatório mensal de impostos
Query: { ano: number, mes: number }
```

#### Banco de Dados:

```sql
CREATE TABLE impostos (
  id SERIAL PRIMARY KEY,
  tipo_imposto VARCHAR(100) NOT NULL,
  mes_referencia VARCHAR(7) NOT NULL, -- YYYY-MM
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  codigo_darf VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Estimativa:** 3 dias  
**Prioridade:** 🟡 ALTA

---

### 6. Logística
**Localização:** `backend-api/src/routes/logistica.js` (NÃO EXISTE)  
**Status Frontend:** ❌ Mockado (`app/dashboard/financeiro/logistica/page.tsx`)

#### Endpoints a Implementar:

```javascript
// 6.1 Manifestos de Carga
POST /api/logistica/manifestos
GET /api/logistica/manifestos
GET /api/logistica/manifestos/:id
PUT /api/logistica/manifestos/:id

// 6.2 CT-e (Conhecimento de Transporte Eletrônico)
POST /api/logistica/cte/emitir
GET /api/logistica/cte
GET /api/logistica/cte/:id

// 6.3 Motoristas
GET /api/logistica/motoristas
POST /api/logistica/motoristas
PUT /api/logistica/motoristas/:id

// 6.4 Viagens
POST /api/logistica/viagens
GET /api/logistica/viagens
PUT /api/logistica/viagens/:id/finalizar
```

#### Banco de Dados:

```sql
-- Tabela: manifestos_carga
CREATE TABLE manifestos_carga (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(50) UNIQUE NOT NULL,
  data_emissao DATE NOT NULL,
  origem VARCHAR(255) NOT NULL,
  destino VARCHAR(255) NOT NULL,
  transportadora_id INTEGER,
  motorista_id INTEGER,
  status VARCHAR(50) DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: cte
CREATE TABLE cte (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(50) UNIQUE NOT NULL,
  manifesto_id INTEGER REFERENCES manifestos_carga(id),
  data_emissao DATE NOT NULL,
  valor_frete DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pendente',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: motoristas
CREATE TABLE motoristas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  cnh VARCHAR(20),
  telefone VARCHAR(20),
  email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: viagens
CREATE TABLE viagens (
  id SERIAL PRIMARY KEY,
  manifesto_id INTEGER REFERENCES manifestos_carga(id),
  motorista_id INTEGER REFERENCES motoristas(id),
  data_inicio TIMESTAMP,
  data_fim TIMESTAMP,
  km_inicial INTEGER,
  km_final INTEGER,
  status VARCHAR(50) DEFAULT 'iniciada',
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Estimativa:** 1 semana  
**Prioridade:** 🟡 ALTA

---

### 7. Fornecedores
**Localização:** `backend-api/src/routes/fornecedores.js` (NÃO EXISTE)  
**Status Frontend:** ⚠️ Fallback mockado (`app/dashboard/financeiro/cadastro/page.tsx`)

#### Endpoints a Implementar:

```javascript
// 7.1 CRUD básico
GET /api/fornecedores
GET /api/fornecedores/:id
POST /api/fornecedores
PUT /api/fornecedores/:id
DELETE /api/fornecedores/:id

// 7.2 Funcionalidades extras
GET /api/fornecedores/:id/historico-compras
GET /api/fornecedores/:id/debitos
```

#### Banco de Dados:

```sql
CREATE TABLE fornecedores (
  id SERIAL PRIMARY KEY,
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  inscricao_estadual VARCHAR(50),
  email VARCHAR(255),
  telefone VARCHAR(20),
  celular VARCHAR(20),
  contato_nome VARCHAR(255),
  endereco VARCHAR(255),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  banco VARCHAR(100),
  agencia VARCHAR(20),
  conta VARCHAR(30),
  pix VARCHAR(255),
  status VARCHAR(50) DEFAULT 'ativo',
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Estimativa:** 2 dias  
**Prioridade:** 🟡 ALTA

---

### 8. Produtos/Catálogo
**Localização:** `backend-api/src/routes/produtos.js` (PARCIAL - integrar com estoque)  
**Status:** ⚠️ Existe estoque, falta catálogo de produtos para venda

#### Endpoints a Implementar:

```javascript
// 8.1 Catálogo de Produtos para Venda
GET /api/catalogo/produtos
POST /api/catalogo/produtos
PUT /api/catalogo/produtos/:id

// 8.2 Tabelas de Preço
GET /api/catalogo/tabelas-preco
POST /api/catalogo/tabelas-preco

// 8.3 Combos e Kits
GET /api/catalogo/combos
POST /api/catalogo/combos
```

#### Banco de Dados:

```sql
-- Tabela: catalogo_produtos
CREATE TABLE catalogo_produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(100),
  unidade VARCHAR(20),
  preco_venda DECIMAL(10,2),
  preco_custo DECIMAL(10,2),
  estoque_minimo INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: tabelas_preco
CREATE TABLE tabelas_preco (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status VARCHAR(50) DEFAULT 'ativa',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: precos_produto
CREATE TABLE precos_produto (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER REFERENCES catalogo_produtos(id),
  tabela_id INTEGER REFERENCES tabelas_preco(id),
  preco DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Estimativa:** 3 dias  
**Prioridade:** 🟡 ALTA

---

## 🟢 PRIORIDADE MÉDIA

### 9. Espelho de Ponto Exportável
**Localização:** `backend-api/src/routes/ponto-eletronico.js` (ADICIONAR ENDPOINT)  
**Status:** ⚠️ Backend existe mas falta exportação

#### Endpoint a Implementar:

```javascript
// 9.1 GET /api/ponto-eletronico/espelho-ponto
// Gerar espelho de ponto em PDF
Query: {
  funcionario_id: number,
  mes: string,
  ano: number,
  formato: 'pdf' | 'excel'
}
Response: Buffer (PDF) ou JSON (Excel)
```

#### Funcionalidades:
- [ ] Gerar PDF formatado para impressão
- [ ] Incluir assinatura digital do funcionário
- [ ] Incluir assinatura do responsável
- [ ] Totalizadores (horas trabalhadas, extras, faltas)
- [ ] Logo da empresa

**Estimativa:** 3 dias  
**Prioridade:** 🟡 MÉDIA

---

### 10. Alocação Funcionários-Obras
**Localização:** `backend-api/src/routes/alocacao-funcionarios.js` (NÃO EXISTE)  
**Status Frontend:** ❌ Mockado (`app/dashboard/rh-completo/obras/page.tsx`)

#### Endpoints a Implementar:

```javascript
// 10.1 GET /api/alocacoes
// Listar alocações
Query: { obra_id?: number, funcionario_id?: number, status?: string }

// 10.2 POST /api/alocacoes
// Alocar funcionário em obra
Body: {
  funcionario_id: number,
  obra_id: number,
  data_inicio: date,
  data_fim?: date,
  cargo_na_obra: string,
  observacoes?: string
}

// 10.3 DELETE /api/alocacoes/:id
// Remover alocação

// 10.4 GET /api/alocacoes/obra/:obraId
// Funcionários alocados em uma obra específica

// 10.5 GET /api/alocacoes/funcionario/:funcId/historico
// Histórico de alocações do funcionário
```

#### Banco de Dados:

```sql
CREATE TABLE alocacoes_funcionarios (
  id SERIAL PRIMARY KEY,
  funcionario_id INTEGER REFERENCES funcionarios(id),
  obra_id INTEGER REFERENCES obras(id),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  cargo_na_obra VARCHAR(100),
  status VARCHAR(50) DEFAULT 'ativa',
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Estimativa:** 3 dias  
**Prioridade:** 🟡 MÉDIA

---

## 🔗 INTEGRAÇÕES E COMUNICAÇÃO

### 11. Envio Automático de E-mail
**Localização:** `backend-api/src/services/email.js` (NÃO EXISTE)

#### Serviços a Implementar:

```javascript
// 11.1 Serviço de E-mail
class EmailService {
  // Enviar notificação
  async enviarNotificacao(destinatario, assunto, mensagem)
  
  // Enviar documento para assinatura
  async enviarDocumentoAssinatura(documento, destinatarios)
  
  // Enviar nota fiscal
  async enviarNotaFiscal(notaFiscal, cliente)
  
  // Enviar boleto
  async enviarBoleto(boleto, cliente)
  
  // Enviar relatório
  async enviarRelatorio(relatorio, destinatarios)
}
```

#### Integrações Sugeridas:
- SendGrid
- AWS SES
- Mailgun
- SMTP próprio

**Estimativa:** 3 dias  
**Prioridade:** 🔴 ALTA

---

### 12. Envio Automático por WhatsApp
**Localização:** `backend-api/src/services/whatsapp.js` (NÃO EXISTE)

#### Serviços a Implementar:

```javascript
// 12.1 Serviço de WhatsApp
class WhatsAppService {
  // Enviar mensagem de texto
  async enviarMensagem(numero, mensagem)
  
  // Enviar documento
  async enviarDocumento(numero, arquivo, legenda)
  
  // Enviar notificação
  async enviarNotificacao(numero, notificacao)
}
```

#### Integrações Sugeridas:
- Twilio
- WhatsApp Business API
- Evolution API
- Baileys

**Estimativa:** 3 dias  
**Prioridade:** 🟡 MÉDIA

---

### 13. Push Notifications (PWA)
**Localização:** `backend-api/src/services/push-notifications.js` (NÃO EXISTE)

#### Serviços a Implementar:

```javascript
// 13.1 Serviço de Push
class PushNotificationService {
  // Registrar device token
  async registrarDevice(userId, token)
  
  // Enviar notificação
  async enviarNotificacao(userId, titulo, mensagem, dados)
  
  // Enviar para múltiplos usuários
  async enviarEmMassa(userIds, titulo, mensagem)
}
```

#### Integrações Sugeridas:
- Firebase Cloud Messaging (FCM)
- OneSignal
- Web Push Protocol

**Estimativa:** 2 dias  
**Prioridade:** 🟡 MÉDIA

---

## 🔧 MELHORIAS EM ENDPOINTS EXISTENTES

### 14. Medições Financeiras - Integração Completa
**Localização:** `backend-api/src/routes/medicoes.js` (EXISTENTE - MELHORAR)  
**Status:** ⚠️ Parcialmente integrado

#### Melhorias Necessárias:
- [ ] Integração completa com receitas
- [ ] Integração completa com custos
- [ ] Cálculo automático de margem
- [ ] Alertas de medições vencidas

**Estimativa:** 2 dias  
**Prioridade:** 🟡 MÉDIA

---

### 15. API de Transferências Bancárias
**Localização:** `backend-api/src/routes/transferencias.js` (PARCIAL)  
**Status:** ⚠️ Estrutura existe mas incompleto

#### Melhorias Necessárias:
- [ ] Upload de comprovantes
- [ ] Integração com contas bancárias
- [ ] Conciliação automática
- [ ] Relatórios de transferências

**Estimativa:** 2 dias  
**Prioridade:** 🟡 MÉDIA

---

## 📅 PLANO DE EXECUÇÃO RECOMENDADO

### Sprint 1 (2 semanas) - Crítico
**Objetivo:** Implementar módulos novos essenciais

#### Semana 1:
- ✅ **Backend Notificações** (3 dias)
  - Criar tabelas no banco
  - Implementar 4 endpoints principais
  - Testes básicos
  
- ✅ **Espelho de Ponto PDF** (2 dias)
  - Endpoint de geração
  - Template PDF

#### Semana 2:
- ✅ **Relatórios Financeiros** (3 dias)
  - 6 endpoints de relatórios
  - Cálculos e agregações
  
- ✅ **Sistema de Exportação** (2 dias)
  - Biblioteca unificada
  - Suporte a PDF e Excel

**Entregáveis:**
- Sistema de notificações funcional
- Espelho de ponto exportável
- Relatórios financeiros básicos
- Exportação padronizada

---

### Sprint 2 (2 semanas) - Aluguéis e Integrações
**Objetivo:** Completar módulo de aluguéis e comunicação

#### Semana 3:
- ✅ **Backend Aluguéis** (5 dias)
  - Criar 4 tabelas no banco
  - Implementar 16 endpoints
  - CRUD completo de residências, contratos e pagamentos

#### Semana 4:
- ✅ **Integração E-mail** (2 dias)
  - Serviço de envio
  - Templates
  
- ✅ **Frontend Aluguéis** (1 dia)
  - Conectar com backend
  - Testes
  
- ✅ **Dashboard Financeiro Gráficos** (2 dias)
  - Implementar gráficos interativos

**Entregáveis:**
- Módulo de aluguéis 100% funcional
- Sistema de e-mail operacional
- Dashboard financeiro visual

---

### Sprint 3 (2 semanas) - APIs e Fornecedores
**Objetivo:** Completar cadastros e módulos secundários

#### Semana 5:
- ✅ **API Fornecedores** (2 dias)
- ✅ **API Produtos/Catálogo** (2 dias)
- ✅ **Alocação Funcionários-Obras** (1 dia)

#### Semana 6:
- ✅ **Frontend - Conectar Fornecedores** (1 dia)
- ✅ **Frontend - Conectar Alocações** (1 dia)
- ✅ **Frontend - Espelho de Ponto** (2 dias)
- ✅ **Push Notifications** (1 dia)

**Entregáveis:**
- Cadastro de fornecedores funcional
- Catálogo de produtos
- Alocação de funcionários integrada
- Espelho de ponto completo

---

### Sprint 4 (2 semanas) - Módulos Financeiros Avançados
**Objetivo:** Completar impostos, logística e melhorias

#### Semana 7:
- ✅ **Backend Impostos** (2 dias)
- ✅ **Backend Logística** (3 dias)

#### Semana 8:
- ✅ **Frontend Impostos** (1 dia)
- ✅ **Frontend Logística** (1 dia)
- ✅ **WhatsApp Integration** (2 dias)
- ✅ **Testes Finais e Ajustes** (1 dia)

**Entregáveis:**
- Gestão de impostos completa
- Logística e manifestos funcionais
- WhatsApp integrado
- Sistema 100% funcional

---

## 📊 RESUMO DE ESTIMATIVAS

| Sprint | Semanas | Foco Principal | Prioridade |
|--------|---------|----------------|------------|
| **Sprint 1** | 2 | Backend Crítico + Notificações | 🔴 CRÍTICA |
| **Sprint 2** | 2 | Aluguéis + E-mail | 🔴 CRÍTICA |
| **Sprint 3** | 2 | APIs + Fornecedores + RH | 🟡 ALTA |
| **Sprint 4** | 2 | Impostos + Logística + WhatsApp | 🟡 MÉDIA |
| **TOTAL** | **8 semanas** | **Projeto 100% Completo** | - |

---

## 💰 ALINHAMENTO COM INVESTIMENTO

| Fase | Investimento | % Completo | Falta Desenvolver | Custo Estimado |
|------|--------------|------------|-------------------|----------------|
| **Fase 1** - Operacional | R$ 20.000 | 95% | 5% | ~R$ 1.000 |
| **Fase 2** - Ponto e RH | R$ 16.000 | 75% | 25% | ~R$ 4.000 |
| **Fase 3** - Assinatura | R$ 10.000 | 85% | 15% | ~R$ 1.500 |
| **Fase 4** - Financeiro | R$ 19.000 | 50% | 50% | ~R$ 9.500 |
| **TOTAL** | **R$ 65.000** | **75%** | **25%** | **~R$ 16.000** |

---

## ✅ CHECKLIST DE CONCLUSÃO

### Backend (20 itens pendentes)

- [ ] Sistema de Notificações (4 endpoints)
- [ ] Aluguéis de Residências (16 endpoints + 4 tabelas)
- [ ] Relatórios Financeiros (6 endpoints)
- [ ] Impostos (4 endpoints)
- [ ] Logística (12 endpoints)
- [ ] Fornecedores (7 endpoints)
- [ ] Produtos/Catálogo (3 endpoints)
- [ ] Espelho de Ponto PDF (1 endpoint)
- [ ] Alocação Funcionários (5 endpoints)
- [ ] Serviço de E-mail
- [ ] Serviço de WhatsApp
- [ ] Push Notifications
- [ ] Biblioteca de Exportação (PDF/Excel)
- [ ] Melhorias em Medições
- [ ] Melhorias em Transferências

### Integrações (7 itens pendentes)

- [ ] E-mail (envio automático)
- [ ] WhatsApp (envio automático)
- [ ] Push Notifications (PWA)
- [ ] Sistema de Anexos/Upload
- [ ] Integração Folha de Pagamento
- [ ] Conciliação Bancária
- [ ] Webhooks para eventos

---

## 🎯 MÉTRICAS DE SUCESSO

Ao final das 8 semanas, o sistema deverá ter:

✅ **100%** dos módulos funcionais (sem mocks)  
✅ **100%** das exportações em PDF/Excel implementadas  
✅ **100%** das notificações operacionais (email/push/WhatsApp)  
✅ **100%** dos relatórios financeiros funcionais  
✅ **0%** de dados mockados em produção  
✅ **100%** de cobertura do escopo original  

---

## 📝 OBSERVAÇÕES IMPORTANTES

1. **Priorização:** Focar primeiro nos módulos críticos (Notificações e Aluguéis) que são módulos novos com frontend já pronto.

2. **Banco de Dados:** Criar todas as tabelas necessárias antes de iniciar os endpoints.

3. **Testes:** Implementar testes unitários e de integração para módulos críticos.

4. **Documentação:** Documentar todos os novos endpoints no Swagger/OpenAPI.

5. **Segurança:** Implementar validação adequada e controle de permissões em todos os endpoints.

6. **Performance:** Otimizar queries pesadas e implementar cache onde necessário.

7. **Logs:** Implementar sistema de logs para auditoria e debug.

8. **Deploy:** Planejar deploys incrementais a cada sprint.

---

## 🆘 CONTATO E SUPORTE

Para dúvidas sobre este documento ou priorização de tarefas:
- Revisar `INTEGRACOES_PENDENTES.md` para detalhes técnicos
- Consultar `NOTIFICACOES_README.md` para sistema de notificações
- Consultar `ALUGUEIS_RESIDENCIAS_README.md` para módulo de aluguéis

---

**Última Atualização:** 09 de Outubro de 2025  
**Próxima Revisão:** Após conclusão da Sprint 1  
**Responsável:** Equipe de Desenvolvimento
