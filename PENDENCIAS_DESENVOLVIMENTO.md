# 📋 PENDÊNCIAS DE DESENVOLVIMENTO - Sistema de Gerenciamento de Gruas

**Data:** 09 de Outubro de 2025  
**Status Geral:** 75% Completo  
**Tempo Estimado para Conclusão:** 8 semanas

---

## 📊 RESUMO EXECUTIVO

| Categoria | Total de Itens | Completo | Pendente | % Conclusão |
|-----------|----------------|----------|----------|-------------|
| **Backend** | 45 | 25 | 20 | 56% |
| **Frontend** | 38 | 30 | 8 | 79% |
| **Integração** | 12 | 5 | 7 | 42% |
| **TOTAL** | **95** | **60** | **35** | **63%** |

---

## 🔴 PENDÊNCIAS DO BACKEND

### 🆕 NOVOS MÓDULOS (PRIORIDADE MÁXIMA)

#### 1. Sistema de Notificações
**Localização:** `backend-api/src/routes/notificacoes.js` (NÃO EXISTE)  
**Frontend:** ✅ Completo (`app/dashboard/notificacoes/page.tsx`)  
**Documentação:** `NOTIFICACOES_README.md`

**Endpoints a Implementar:**

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

**Banco de Dados:**
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

**Funcionalidades Adicionais:**
- [ ] Sistema de push notifications (FCM/OneSignal)
- [ ] Envio de email para notificações importantes
- [ ] Notificações PWA
- [ ] WebSocket para notificações em tempo real

**Estimativa:** 1 semana  
**Prioridade:** 🔴 CRÍTICA

---

#### 2. Aluguéis de Residências
**Localização:** `backend-api/src/routes/alugueis-residencias.js` (NÃO EXISTE)  
**Frontend:** ✅ Completo (`app/dashboard/financeiro/alugueis/page.tsx`)  
**Documentação:** `ALUGUEIS_RESIDENCIAS_README.md`

**Endpoints a Implementar (16 no total):**

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

**Banco de Dados:**
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

**Integrações Necessárias:**
- [ ] Integração com módulo de Funcionários
- [ ] Integração com Folha de Pagamento (desconto em folha)
- [ ] Integração com módulo Financeiro (lançamentos contábeis)
- [ ] Sistema de notificações (alertas de vencimento)
- [ ] Upload de documentos/fotos (Supabase Storage)

**Estimativa:** 2 semanas  
**Prioridade:** 🔴 CRÍTICA

---

### 💰 MÓDULOS FINANCEIROS

#### 3. Relatórios Financeiros Completos
**Localização:** `backend-api/src/routes/relatorios-financeiros.js` (NÃO EXISTE)  
**Status Frontend:** ⚠️ Mockado (`app/dashboard/financeiro/relatorios/page.tsx`)

**Endpoints a Implementar:**

```javascript
// 3.1 POST /api/relatorios/gerar
// Gerar relatório customizado
Body: {
  tipo: 'financeiro' | 'vendas' | 'locacoes' | 'estoque',
  periodo_inicio: date,
  periodo_fim: date,
  formato: 'json' | 'pdf' | 'excel',
  filtros?: object
}

// 3.2 GET /api/relatorios/faturamento
// Relatório de faturamento mensal
Query: { ano: number, mes?: number }

// 3.3 GET /api/relatorios/vendas
// Relatório de vendas por período
Query: { data_inicio: date, data_fim: date, cliente_id?: number }

// 3.4 GET /api/relatorios/locacoes
// Relatório de locações
Query: { data_inicio: date, data_fim: date, status?: string }

// 3.5 GET /api/relatorios/fluxo-caixa
// Relatório de fluxo de caixa detalhado
Query: { data_inicio: date, data_fim: date }

// 3.6 GET /api/relatorios/dre
// Demonstrativo de Resultado do Exercício
Query: { ano: number, mes?: number }
```

**Funcionalidades:**
- [ ] Geração de PDF com gráficos
- [ ] Exportação para Excel (XLSX)
- [ ] Cálculo automático de margens e lucros
- [ ] Comparativo entre períodos
- [ ] Dashboard executivo

**Estimativa:** 1 semana  
**Prioridade:** 🔴 ALTA

---

#### 4. Impostos
**Localização:** `backend-api/src/routes/impostos.js` (NÃO EXISTE)  
**Status Frontend:** ❌ Mockado (`app/dashboard/financeiro/impostos/page.tsx`)

**Endpoints a Implementar:**

```javascript
// 4.1 GET /api/impostos
// Listar impostos do período
Query: { mes: string, ano: number }

// 4.2 POST /api/impostos/calcular
// Calcular impostos automaticamente
Body: {
  mes_referencia: string,
  receita_bruta: number,
  deducoes: number,
  regime_tributario: 'simples' | 'lucro_presumido' | 'lucro_real'
}

// 4.3 POST /api/impostos/pagar
// Registrar pagamento de imposto
Body: {
  tipo_imposto: string,
  mes_referencia: string,
  valor: number,
  data_pagamento: date,
  codigo_darf: string
}

// 4.4 GET /api/impostos/relatorio
// Relatório mensal de impostos
Query: { ano: number, mes: number }
```

**Estimativa:** 3 dias  
**Prioridade:** 🟡 MÉDIA

---

#### 5. Logística
**Localização:** `backend-api/src/routes/logistica.js` (NÃO EXISTE)  
**Status Frontend:** ❌ Mockado (`app/dashboard/financeiro/logistica/page.tsx`)

**Endpoints a Implementar:**

```javascript
// 5.1 Manifestos de Carga
POST /api/logistica/manifestos
GET /api/logistica/manifestos
GET /api/logistica/manifestos/:id
PUT /api/logistica/manifestos/:id

// 5.2 CT-e (Conhecimento de Transporte Eletrônico)
POST /api/logistica/cte/emitir
GET /api/logistica/cte
GET /api/logistica/cte/:id

// 5.3 Motoristas
GET /api/logistica/motoristas
POST /api/logistica/motoristas
PUT /api/logistica/motoristas/:id

// 5.4 Viagens
POST /api/logistica/viagens
GET /api/logistica/viagens
PUT /api/logistica/viagens/:id/finalizar
```

**Estimativa:** 1 semana  
**Prioridade:** 🟡 MÉDIA

---

#### 6. Fornecedores
**Localização:** `backend-api/src/routes/fornecedores.js` (NÃO EXISTE)  
**Status Frontend:** ⚠️ Fallback mockado (`app/dashboard/financeiro/cadastro/page.tsx`)

**Endpoints a Implementar:**

```javascript
// 6.1 CRUD básico
GET /api/fornecedores
GET /api/fornecedores/:id
POST /api/fornecedores
PUT /api/fornecedores/:id
DELETE /api/fornecedores/:id

// 6.2 Funcionalidades extras
GET /api/fornecedores/:id/historico-compras
GET /api/fornecedores/:id/debitos
```

**Banco de Dados:**
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
**Prioridade:** 🟡 MÉDIA

---

#### 7. Produtos/Catálogo
**Localização:** `backend-api/src/routes/produtos.js` (PARCIAL - integrar com estoque)  
**Status:** ⚠️ Existe estoque, falta catálogo de produtos para venda

**Endpoints a Implementar:**

```javascript
// 7.1 Catálogo de Produtos para Venda
GET /api/catalogo/produtos
POST /api/catalogo/produtos
PUT /api/catalogo/produtos/:id

// 7.2 Tabelas de Preço
GET /api/catalogo/tabelas-preco
POST /api/catalogo/tabelas-preco

// 7.3 Combos e Kits
GET /api/catalogo/combos
POST /api/catalogo/combos
```

**Estimativa:** 3 dias  
**Prioridade:** 🟡 MÉDIA

---

### 👥 MÓDULOS DE RH

#### 8. Espelho de Ponto Exportável
**Localização:** `backend-api/src/routes/ponto-eletronico.js` (ADICIONAR ENDPOINT)  
**Status:** ⚠️ Backend existe mas falta exportação

**Endpoint a Implementar:**

```javascript
// 8.1 GET /api/ponto-eletronico/espelho-ponto
// Gerar espelho de ponto em PDF
Query: {
  funcionario_id: number,
  mes: string,
  ano: number,
  formato: 'pdf' | 'excel'
}
Response: Buffer (PDF) ou JSON (Excel)
```

**Funcionalidades:**
- [ ] Gerar PDF formatado para impressão
- [ ] Incluir assinatura digital do funcionário
- [ ] Incluir assinatura do responsável
- [ ] Totalizadores (horas trabalhadas, extras, faltas)
- [ ] Logo da empresa

**Estimativa:** 3 dias  
**Prioridade:** 🔴 ALTA

---

#### 9. Alocação Funcionários-Obras
**Localização:** `backend-api/src/routes/alocacao-funcionarios.js` (NÃO EXISTE)  
**Status Frontend:** ❌ Mockado (`app/dashboard/rh-completo/obras/page.tsx`)

**Endpoints a Implementar:**

```javascript
// 9.1 GET /api/alocacoes
// Listar alocações
Query: { obra_id?: number, funcionario_id?: number, status?: string }

// 9.2 POST /api/alocacoes
// Alocar funcionário em obra
Body: {
  funcionario_id: number,
  obra_id: number,
  data_inicio: date,
  data_fim?: date,
  cargo_na_obra: string,
  observacoes?: string
}

// 9.3 DELETE /api/alocacoes/:id
// Remover alocação

// 9.4 GET /api/alocacoes/obra/:obraId
// Funcionários alocados em uma obra específica

// 9.5 GET /api/alocacoes/funcionario/:funcId/historico
// Histórico de alocações do funcionário
```

**Estimativa:** 3 dias  
**Prioridade:** 🟡 MÉDIA

---

### 🔗 INTEGRAÇÕES E COMUNICAÇÃO

#### 10. Envio Automático de E-mail
**Localização:** `backend-api/src/services/email.js` (NÃO EXISTE)

**Serviços a Implementar:**

```javascript
// 10.1 Serviço de E-mail
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

**Integrações Sugeridas:**
- SendGrid
- AWS SES
- Mailgun
- SMTP próprio

**Estimativa:** 3 dias  
**Prioridade:** 🔴 ALTA

---

#### 11. Envio Automático por WhatsApp
**Localização:** `backend-api/src/services/whatsapp.js` (NÃO EXISTE)

**Serviços a Implementar:**

```javascript
// 11.1 Serviço de WhatsApp
class WhatsAppService {
  // Enviar mensagem de texto
  async enviarMensagem(numero, mensagem)
  
  // Enviar documento
  async enviarDocumento(numero, arquivo, legenda)
  
  // Enviar notificação
  async enviarNotificacao(numero, notificacao)
}
```

**Integrações Sugeridas:**
- Twilio
- WhatsApp Business API
- Evolution API
- Baileys

**Estimativa:** 3 dias  
**Prioridade:** 🟡 MÉDIA

---

#### 12. Push Notifications (PWA)
**Localização:** `backend-api/src/services/push-notifications.js` (NÃO EXISTE)

**Serviços a Implementar:**

```javascript
// 12.1 Serviço de Push
class PushNotificationService {
  // Registrar device token
  async registrarDevice(userId, token)
  
  // Enviar notificação
  async enviarNotificacao(userId, titulo, mensagem, dados)
  
  // Enviar para múltiplos usuários
  async enviarEmMassa(userIds, titulo, mensagem)
}
```

**Integrações Sugeridas:**
- Firebase Cloud Messaging (FCM)
- OneSignal
- Web Push Protocol

**Estimativa:** 2 dias  
**Prioridade:** 🟡 MÉDIA

---

### 📤 SISTEMA DE EXPORTAÇÃO

#### 13. Biblioteca Unificada de Exportação
**Localização:** `backend-api/src/utils/export.js` (NÃO EXISTE)

**Funcionalidades a Implementar:**

```javascript
// 13.1 Classe de Exportação
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

// 13.2 Templates de Relatórios
- Template de Espelho de Ponto
- Template de Relatório Financeiro
- Template de Relatório de Gruas
- Template de Relatório de Obras
- Template de Nota Fiscal
```

**Bibliotecas Sugeridas:**
- **PDF:** puppeteer, pdfkit, ou jsPDF
- **Excel:** exceljs ou xlsx
- **Gráficos:** chartjs-node-canvas

**Estimativa:** 1 semana  
**Prioridade:** 🔴 CRÍTICA

---

### 🔧 MELHORIAS EM ENDPOINTS EXISTENTES

#### 14. Medições Financeiras - Integração Completa
**Localização:** `backend-api/src/routes/medicoes.js` (EXISTENTE - MELHORAR)  
**Status:** ⚠️ Parcialmente integrado

**Melhorias Necessárias:**
- [ ] Integração completa com receitas
- [ ] Integração completa com custos
- [ ] Cálculo automático de margem
- [ ] Alertas de medições vencidas

**Estimativa:** 2 dias  
**Prioridade:** 🟡 MÉDIA

---

#### 15. API de Transferências Bancárias
**Localização:** `backend-api/src/routes/transferencias.js` (PARCIAL)  
**Status:** ⚠️ Estrutura existe mas incompleto

**Melhorias Necessárias:**
- [ ] Upload de comprovantes
- [ ] Integração com contas bancárias
- [ ] Conciliação automática
- [ ] Relatórios de transferências

**Estimativa:** 2 dias  
**Prioridade:** 🟡 MÉDIA

---

## 🎨 PENDÊNCIAS DO FRONTEND

### 🔴 CRÍTICAS

#### 1. Sistema de Exportação Universal
**Localização:** Criar componente reutilizável `components/export-button.tsx`

**Funcionalidades:**
```typescript
interface ExportButtonProps {
  dados: any[]
  tipo: 'gruas' | 'obras' | 'funcionarios' | 'financeiro' | 'estoque'
  formato: 'pdf' | 'excel' | 'csv'
  nomeArquivo?: string
  template?: string
}
```

**Uso:**
- Implementar em todos os módulos principais
- Botão unificado de exportação
- Opções de filtros antes de exportar
- Preview antes do download

**Estimativa:** 3 dias  
**Prioridade:** 🔴 CRÍTICA

---

#### 2. Dashboard Financeiro - Gráficos Interativos
**Localização:** `app/dashboard/financeiro/page.tsx` (MELHORAR)

**Melhorias:**
- [ ] Adicionar gráficos interativos (Chart.js ou Recharts)
- [ ] Gráfico de fluxo de caixa visual
- [ ] Gráfico de receitas vs despesas
- [ ] Gráfico de locações ativas
- [ ] Cards clicáveis com drill-down

**Estimativa:** 2 dias  
**Prioridade:** 🔴 ALTA

---

#### 3. Espelho de Ponto - Visualização e Assinatura
**Localização:** `app/dashboard/ponto/page.tsx` (ADICIONAR)

**Funcionalidades:**
- [ ] Botão "Gerar Espelho de Ponto"
- [ ] Modal com preview do espelho
- [ ] Campo para assinatura digital do funcionário
- [ ] Campo para assinatura do gestor
- [ ] Botão de download PDF
- [ ] Envio por e-mail

**Estimativa:** 2 dias  
**Prioridade:** 🔴 ALTA

---

### 🟡 MÉDIAS

#### 4. Página de Impostos - Conectar com Backend
**Localização:** `app/dashboard/financeiro/impostos/page.tsx`

**Tarefas:**
- [ ] Remover dados mockados
- [ ] Conectar com API de impostos
- [ ] Implementar calculadora de impostos
- [ ] Formulário de registro de pagamento

**Estimativa:** 1 dia  
**Prioridade:** 🟡 MÉDIA

---

#### 5. Página de Logística - Conectar com Backend
**Localização:** `app/dashboard/financeiro/logistica/page.tsx`

**Tarefas:**
- [ ] Remover dados mockados
- [ ] Conectar com API de logística
- [ ] Formulário de emissão de CT-e
- [ ] Gestão de manifestos

**Estimativa:** 1 dia  
**Prioridade:** 🟡 MÉDIA

---

#### 6. Cadastro Financeiro - API de Fornecedores
**Localização:** `app/dashboard/financeiro/cadastro/page.tsx`

**Tarefas:**
- [ ] Remover fallback mockado de fornecedores
- [ ] Conectar com API real
- [ ] Formulário completo de fornecedores
- [ ] Histórico de compras por fornecedor

**Estimativa:** 1 dia  
**Prioridade:** 🟡 MÉDIA

---

#### 7. RH Completo - Alocação de Funcionários
**Localização:** `app/dashboard/rh-completo/obras/page.tsx`

**Tarefas:**
- [ ] Remover dados mockados
- [ ] Conectar com API de alocações
- [ ] Drag & drop para alocar funcionários
- [ ] Timeline de alocações por funcionário

**Estimativa:** 2 dias  
**Prioridade:** 🟡 MÉDIA

---

#### 8. Relatórios Financeiros - Conectar com Backend
**Localização:** `app/dashboard/financeiro/relatorios/page.tsx`

**Tarefas:**
- [ ] Remover dados mockados
- [ ] Conectar com API de relatórios
- [ ] Gerador de relatórios customizados
- [ ] Biblioteca de templates

**Estimativa:** 2 dias  
**Prioridade:** 🟡 MÉDIA

---

## 🔗 INTEGRAÇÕES PENDENTES

### 1. E-mail e WhatsApp
**Módulos Afetados:**
- Assinatura de Documentos
- Notificações
- Notas Fiscais
- Boletos

**Tarefas:**
- [ ] Implementar serviço de e-mail no backend
- [ ] Implementar serviço de WhatsApp no backend
- [ ] Adicionar botões "Enviar por E-mail" e "Enviar por WhatsApp" no frontend
- [ ] Configurar templates de mensagens
- [ ] Logs de envios

**Estimativa:** 1 semana  
**Prioridade:** 🔴 ALTA

---

### 2. Push Notifications
**Módulos Afetados:**
- Notificações
- PWA

**Tarefas:**
- [ ] Configurar Firebase Cloud Messaging
- [ ] Implementar service worker para notificações
- [ ] Solicitar permissão ao usuário
- [ ] Registrar device tokens no backend
- [ ] Testar notificações em diferentes dispositivos

**Estimativa:** 3 dias  
**Prioridade:** 🟡 MÉDIA

---

### 3. Sistema de Anexos/Upload
**Módulos Afetados:**
- Aluguéis de Residências (fotos)
- Documentos de Obras
- Comprovantes de Pagamento
- Notas Fiscais

**Tarefas:**
- [ ] Implementar upload múltiplo de arquivos
- [ ] Validação de tipos de arquivo
- [ ] Compressão de imagens
- [ ] Preview antes do upload
- [ ] Gerenciamento de storage (Supabase)

**Estimativa:** 2 dias  
**Prioridade:** 🟡 MÉDIA

---

### 4. Integração com Folha de Pagamento
**Módulos Afetados:**
- Aluguéis de Residências (desconto em folha)
- Vales
- Remuneração

**Tarefas:**
- [ ] Definir estrutura de integração
- [ ] API para lançamentos em folha
- [ ] Sincronização mensal
- [ ] Relatórios de descontos

**Estimativa:** 3 dias  
**Prioridade:** 🟡 MÉDIA

---

## 📅 PLANO DE EXECUÇÃO RECOMENDADO

### Sprint 1 (2 semanas) - Backend Crítico
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

### Frontend (8 itens pendentes)

- [ ] Sistema de Exportação Universal
- [ ] Dashboard Financeiro - Gráficos
- [ ] Espelho de Ponto - UI
- [ ] Impostos - Conectar Backend
- [ ] Logística - Conectar Backend
- [ ] Cadastro - Fornecedores
- [ ] RH - Alocações
- [ ] Relatórios - Conectar Backend

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

