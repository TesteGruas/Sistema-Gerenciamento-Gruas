# Relatório Backend - Módulo Financeiro
## Análise de Endpoints Necessários - 19/12/2024

## 📋 Resumo

Este relatório identifica todos os endpoints e funcionalidades que faltam no backend para preencher completamente todas as abas e telas do módulo financeiro do sistema.

## 🎯 Módulos do Financeiro Analisados

### **1. Dashboard Principal (`/dashboard/financeiro`)**
### **2. Vendas (`/dashboard/financeiro/vendas`)**
### **3. Locações (`/dashboard/financeiro/locacoes`)**
### **4. Medições (`/dashboard/financeiro/medicoes`)**
### **5. Receitas (`/dashboard/financeiro/receitas`)**
### **6. Custos (`/dashboard/financeiro/custos`)**
### **7. Aluguéis (`/dashboard/financeiro/alugueis`)**
### **8. Impostos (`/dashboard/financeiro/impostos`)**
### **9. Logística (`/dashboard/financeiro/logistica`)**
### **10. Cadastro (`/dashboard/financeiro/cadastro`)**
### **11. Relatórios (`/dashboard/financeiro/relatorios`)**

---

## 🚨 ENDPOINTS FALTANDO NO BACKEND

### **1. DASHBOARD PRINCIPAL**

#### **1.1 Estatísticas Financeiras**
```
❌ GET /api/financeiro/dashboard/estatisticas
```
**Dados necessários:**
- Receber hoje
- Pagar hoje
- Recebimentos em atraso
- Pagamentos em atraso
- Saldo atual
- Fluxo de caixa (últimos 30 dias)
- Transferências recentes

#### **1.2 Gráficos e Métricas**
```
❌ GET /api/financeiro/dashboard/graficos
```
**Dados necessários:**
- Receitas vs Despesas (últimos 6 meses)
- Top clientes por faturamento
- Distribuição de receitas por categoria
- Evolução do saldo bancário

---

### **2. VENDAS E ORÇAMENTOS**

#### **2.1 Orçamentos**
```
✅ GET /api/orcamentos (existe)
❌ POST /api/orcamentos (falta)
❌ PUT /api/orcamentos/{id} (falta)
❌ DELETE /api/orcamentos/{id} (falta)
❌ POST /api/orcamentos/{id}/enviar (falta)
❌ POST /api/orcamentos/{id}/aprovar (falta)
❌ POST /api/orcamentos/{id}/rejeitar (falta)
```

#### **2.2 Vendas**
```
✅ GET /api/vendas (existe)
❌ POST /api/vendas (falta)
❌ PUT /api/vendas/{id} (falta)
❌ DELETE /api/vendas/{id} (falta)
❌ POST /api/vendas/{id}/confirmar (falta)
❌ POST /api/vendas/{id}/itens (falta)
❌ PUT /api/vendas/{id}/itens/{item_id} (falta)
❌ DELETE /api/vendas/{id}/itens/{item_id} (falta)
```

#### **2.3 Itens de Venda**
```
❌ GET /api/vendas/{id}/itens (falta)
❌ POST /api/vendas/{id}/itens (falta)
❌ PUT /api/vendas/{id}/itens/{item_id} (falta)
❌ DELETE /api/vendas/{id}/itens/{item_id} (falta)
```

---

### **3. LOCAÇÕES**

#### **3.1 Locações de Gruas**
```
✅ GET /api/locacoes (existe)
❌ POST /api/locacoes (falta)
❌ PUT /api/locacoes/{id} (falta)
❌ DELETE /api/locacoes/{id} (falta)
❌ POST /api/locacoes/{id}/iniciar (falta)
❌ POST /api/locacoes/{id}/finalizar (falta)
❌ POST /api/locacoes/{id}/cancelar (falta)
```

#### **3.2 Medições**
```
✅ GET /api/medicoes (existe)
❌ POST /api/medicoes (falta)
❌ PUT /api/medicoes/{id} (falta)
❌ DELETE /api/medicoes/{id} (falta)
❌ POST /api/medicoes/{id}/aprovar (falta)
❌ POST /api/medicoes/{id}/rejeitar (falta)
```

#### **3.3 Aditivos**
```
✅ GET /api/aditivos (existe)
❌ POST /api/aditivos (falta)
❌ PUT /api/aditivos/{id} (falta)
❌ DELETE /api/aditivos/{id} (falta)
```

#### **3.4 Orçamentos de Locação**
```
✅ GET /api/orcamentos-locacao (existe)
❌ POST /api/orcamentos-locacao (falta)
❌ PUT /api/orcamentos-locacao/{id} (falta)
❌ DELETE /api/orcamentos-locacao/{id} (falta)
```

#### **3.5 Notas Fiscais de Locação**
```
✅ GET /api/notas-fiscais-locacao (existe)
❌ POST /api/notas-fiscais-locacao (falta)
❌ PUT /api/notas-fiscais-locacao/{id} (falta)
❌ DELETE /api/notas-fiscais-locacao/{id} (falta)
```

#### **3.6 Notas de Débito**
```
✅ GET /api/notas-debito (existe)
❌ POST /api/notas-debito (falta)
❌ PUT /api/notas-debito/{id} (falta)
❌ DELETE /api/notas-debito/{id} (falta)
```

---

### **4. RECEITAS**

#### **4.1 Receitas Gerais**
```
✅ GET /api/receitas (existe)
❌ POST /api/receitas (falta)
❌ PUT /api/receitas/{id} (falta)
❌ DELETE /api/receitas/{id} (falta)
❌ POST /api/receitas/{id}/confirmar (falta)
❌ POST /api/receitas/{id}/cancelar (falta)
```

#### **4.2 Categorias de Receita**
```
❌ GET /api/receitas/categorias (falta)
❌ POST /api/receitas/categorias (falta)
❌ PUT /api/receitas/categorias/{id} (falta)
❌ DELETE /api/receitas/categorias/{id} (falta)
```

---

### **5. CUSTOS**

#### **5.1 Custos Gerais**
```
✅ GET /api/custos (existe)
❌ POST /api/custos (falta)
❌ PUT /api/custos/{id} (falta)
❌ DELETE /api/custos/{id} (falta)
❌ POST /api/custos/{id}/confirmar (falta)
❌ POST /api/custos/{id}/cancelar (falta)
```

#### **5.2 Custos Mensais**
```
✅ GET /api/custos-mensais (existe)
❌ POST /api/custos-mensais (falta)
❌ PUT /api/custos-mensais/{id} (falta)
❌ DELETE /api/custos-mensais/{id} (falta)
```

#### **5.3 Categorias de Custo**
```
❌ GET /api/custos/categorias (falta)
❌ POST /api/custos/categorias (falta)
❌ PUT /api/custos/categorias/{id} (falta)
❌ DELETE /api/custos/categorias/{id} (falta)
```

---

### **6. ALUGUÉIS DE RESIDÊNCIAS**

#### **6.1 Residências**
```
✅ GET /api/alugueis-residencias (existe)
❌ POST /api/alugueis-residencias (falta)
❌ PUT /api/alugueis-residencias/{id} (falta)
❌ DELETE /api/alugueis-residencias/{id} (falta)
```

#### **6.2 Contratos de Aluguel**
```
❌ GET /api/alugueis-residencias/contratos (falta)
❌ POST /api/alugueis-residencias/contratos (falta)
❌ PUT /api/alugueis-residencias/contratos/{id} (falta)
❌ DELETE /api/alugueis-residencias/contratos/{id} (falta)
```

#### **6.3 Pagamentos de Aluguel**
```
❌ GET /api/alugueis-residencias/pagamentos (falta)
❌ POST /api/alugueis-residencias/pagamentos (falta)
❌ PUT /api/alugueis-residencias/pagamentos/{id} (falta)
❌ DELETE /api/alugueis-residencias/pagamentos/{id} (falta)
```

---

### **7. IMPOSTOS**

#### **7.1 Impostos Gerais**
```
✅ GET /api/impostos (existe)
❌ POST /api/impostos (falta)
❌ PUT /api/impostos/{id} (falta)
❌ DELETE /api/impostos/{id} (falta)
❌ POST /api/impostos/{id}/pagar (falta)
❌ POST /api/impostos/{id}/cancelar (falta)
```

#### **7.2 Cálculo de Impostos**
```
❌ POST /api/impostos/calcular (falta)
❌ GET /api/impostos/vencimentos (falta)
❌ GET /api/impostos/relatorio-mensal (falta)
```

---

### **8. LOGÍSTICA**

#### **8.1 Transportes**
```
✅ GET /api/logistica (existe)
❌ POST /api/logistica (falta)
❌ PUT /api/logistica/{id} (falta)
❌ DELETE /api/logistica/{id} (falta)
```

#### **8.2 Rastreamento**
```
❌ GET /api/logistica/{id}/rastreamento (falta)
❌ POST /api/logistica/{id}/atualizar-status (falta)
```

---

### **9. CADASTROS**

#### **9.1 Clientes**
```
✅ GET /api/clientes (existe)
❌ POST /api/clientes (falta)
❌ PUT /api/clientes/{id} (falta)
❌ DELETE /api/clientes/{id} (falta)
```

#### **9.2 Fornecedores**
```
✅ GET /api/fornecedores (existe)
❌ POST /api/fornecedores (falta)
❌ PUT /api/fornecedores/{id} (falta)
❌ DELETE /api/fornecedores/{id} (falta)
```

#### **9.3 Contas Bancárias**
```
✅ GET /api/contas-bancarias (existe)
❌ POST /api/contas-bancarias (falta)
❌ PUT /api/contas-bancarias/{id} (falta)
❌ DELETE /api/contas-bancarias/{id} (falta)
```

---

### **10. RELATÓRIOS**

#### **10.1 Relatórios Financeiros**
```
✅ GET /api/relatorios/financeiro (existe)
❌ GET /api/relatorios/fluxo-caixa (falta)
❌ GET /api/relatorios/balanco (falta)
❌ GET /api/relatorios/dre (falta)
```

#### **10.2 Relatórios de Vendas**
```
❌ GET /api/relatorios/vendas (falta)
❌ GET /api/relatorios/vendas-por-cliente (falta)
❌ GET /api/relatorios/vendas-por-periodo (falta)
```

#### **10.3 Relatórios de Locações**
```
❌ GET /api/relatorios/locacoes (falta)
❌ GET /api/relatorios/locacoes-por-grua (falta)
❌ GET /api/relatorios/locacoes-por-cliente (falta)
```

---

## 📊 RESUMO DE ENDPOINTS FALTANDO

### **Por Módulo:**

| Módulo | Endpoints Existentes | Endpoints Faltando | % Completo |
|--------|---------------------|-------------------|------------|
| **Dashboard** | 0 | 2 | 0% |
| **Vendas** | 1 | 7 | 12.5% |
| **Locações** | 6 | 6 | 50% |
| **Receitas** | 1 | 5 | 16.7% |
| **Custos** | 2 | 4 | 33.3% |
| **Aluguéis** | 1 | 3 | 25% |
| **Impostos** | 1 | 3 | 25% |
| **Logística** | 1 | 2 | 33.3% |
| **Cadastros** | 3 | 3 | 50% |
| **Relatórios** | 1 | 6 | 14.3% |

### **Total Geral:**
- **Endpoints Existentes**: 17
- **Endpoints Faltando**: 41
- **% Completo**: 29.3%

---

## 🚀 PRIORIDADES DE IMPLEMENTAÇÃO

### **Prioridade ALTA (Implementar Primeiro):**

#### **1. Dashboard Principal**
```
❌ GET /api/financeiro/dashboard/estatisticas
❌ GET /api/financeiro/dashboard/graficos
```
**Impacto**: Interface principal do módulo financeiro

#### **2. CRUD Básico - Vendas**
```
❌ POST /api/vendas
❌ PUT /api/vendas/{id}
❌ DELETE /api/vendas/{id}
❌ POST /api/vendas/{id}/confirmar
```
**Impacto**: Funcionalidade principal de vendas

#### **3. CRUD Básico - Orçamentos**
```
❌ POST /api/orcamentos
❌ PUT /api/orcamentos/{id}
❌ DELETE /api/orcamentos/{id}
❌ POST /api/orcamentos/{id}/enviar
❌ POST /api/orcamentos/{id}/aprovar
❌ POST /api/orcamentos/{id}/rejeitar
```
**Impacto**: Fluxo completo de orçamentos

#### **4. CRUD Básico - Receitas**
```
❌ POST /api/receitas
❌ PUT /api/receitas/{id}
❌ DELETE /api/receitas/{id}
```
**Impacto**: Gestão de receitas

#### **5. CRUD Básico - Custos**
```
❌ POST /api/custos
❌ PUT /api/custos/{id}
❌ DELETE /api/custos/{id}
```
**Impacto**: Gestão de custos

### **Prioridade MÉDIA:**

#### **6. CRUD Básico - Locações**
```
❌ POST /api/locacoes
❌ PUT /api/locacoes/{id}
❌ DELETE /api/locacoes/{id}
```

#### **7. CRUD Básico - Medições**
```
❌ POST /api/medicoes
❌ PUT /api/medicoes/{id}
❌ DELETE /api/medicoes/{id}
```

#### **8. CRUD Básico - Cadastros**
```
❌ POST /api/clientes
❌ POST /api/fornecedores
❌ POST /api/contas-bancarias
```

### **Prioridade BAIXA:**

#### **9. Funcionalidades Avançadas**
- Relatórios específicos
- Integração bancária
- Notificações
- Auditoria

---

## 🔧 ESTRUTURA DE DADOS NECESSÁRIA

### **1. Tabelas Principais Faltando:**

#### **Vendas:**
```sql
CREATE TABLE vendas (
  id VARCHAR PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id),
  data_venda DATE NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  status VARCHAR NOT NULL, -- 'rascunho', 'pendente', 'confirmada', 'cancelada'
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE venda_itens (
  id VARCHAR PRIMARY KEY,
  venda_id VARCHAR REFERENCES vendas(id),
  produto_id INTEGER REFERENCES produtos(id),
  quantidade DECIMAL(10,2) NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **Orçamentos:**
```sql
CREATE TABLE orcamentos (
  id VARCHAR PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id),
  data_orcamento DATE NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  status VARCHAR NOT NULL, -- 'rascunho', 'enviado', 'aprovado', 'rejeitado', 'expirado'
  validade_ate DATE,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orcamento_itens (
  id VARCHAR PRIMARY KEY,
  orcamento_id VARCHAR REFERENCES orcamentos(id),
  produto_id INTEGER REFERENCES produtos(id),
  quantidade DECIMAL(10,2) NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **Receitas:**
```sql
CREATE TABLE receitas (
  id VARCHAR PRIMARY KEY,
  categoria_id INTEGER REFERENCES receita_categorias(id),
  descricao VARCHAR NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_recebimento DATE NOT NULL,
  status VARCHAR NOT NULL, -- 'pendente', 'recebido', 'cancelado'
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE receita_categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **Custos:**
```sql
CREATE TABLE custos (
  id VARCHAR PRIMARY KEY,
  categoria_id INTEGER REFERENCES custo_categorias(id),
  fornecedor_id INTEGER REFERENCES fornecedores(id),
  descricao VARCHAR NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_pagamento DATE NOT NULL,
  status VARCHAR NOT NULL, -- 'pendente', 'pago', 'cancelado'
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE custo_categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **2. Relacionamentos Necessários:**

#### **Vendas ↔ Clientes:**
- Uma venda pertence a um cliente
- Um cliente pode ter várias vendas

#### **Orçamentos ↔ Clientes:**
- Um orçamento pertence a um cliente
- Um cliente pode ter vários orçamentos

#### **Receitas ↔ Categorias:**
- Uma receita pertence a uma categoria
- Uma categoria pode ter várias receitas

#### **Custos ↔ Fornecedores:**
- Um custo pertence a um fornecedor
- Um fornecedor pode ter vários custos

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### **Fase 1 - Dashboard (Prioridade ALTA):**
- [ ] **GET /api/financeiro/dashboard/estatisticas**
- [ ] **GET /api/financeiro/dashboard/graficos**
- [ ] **Tabelas de estatísticas** no banco
- [ ] **Funções de cálculo** de métricas

### **Fase 2 - Vendas (Prioridade ALTA):**
- [ ] **Tabelas vendas e venda_itens**
- [ ] **POST /api/vendas**
- [ ] **PUT /api/vendas/{id}**
- [ ] **DELETE /api/vendas/{id}**
- [ ] **POST /api/vendas/{id}/confirmar**

### **Fase 3 - Orçamentos (Prioridade ALTA):**
- [ ] **Tabelas orcamentos e orcamento_itens**
- [ ] **POST /api/orcamentos**
- [ ] **PUT /api/orcamentos/{id}**
- [ ] **DELETE /api/orcamentos/{id}**
- [ ] **POST /api/orcamentos/{id}/enviar**
- [ ] **POST /api/orcamentos/{id}/aprovar**
- [ ] **POST /api/orcamentos/{id}/rejeitar**

### **Fase 4 - Receitas e Custos (Prioridade ALTA):**
- [ ] **Tabelas receitas, receita_categorias**
- [ ] **Tabelas custos, custo_categorias**
- [ ] **CRUD completo** para receitas
- [ ] **CRUD completo** para custos

### **Fase 5 - Locações (Prioridade MÉDIA):**
- [ ] **POST /api/locacoes**
- [ ] **PUT /api/locacoes/{id}**
- [ ] **DELETE /api/locacoes/{id}**
- [ ] **POST /api/medicoes**
- [ ] **PUT /api/medicoes/{id}**
- [ ] **DELETE /api/medicoes/{id}**

### **Fase 6 - Cadastros (Prioridade MÉDIA):**
- [ ] **POST /api/clientes**
- [ ] **PUT /api/clientes/{id}**
- [ ] **DELETE /api/clientes/{id}**
- [ ] **POST /api/fornecedores**
- [ ] **PUT /api/fornecedores/{id}**
- [ ] **DELETE /api/fornecedores/{id}**

### **Fase 7 - Relatórios (Prioridade BAIXA):**
- [ ] **GET /api/relatorios/fluxo-caixa**
- [ ] **GET /api/relatorios/balanco**
- [ ] **GET /api/relatorios/dre**
- [ ] **GET /api/relatorios/vendas**

---

## 🎯 BENEFÍCIOS DA IMPLEMENTAÇÃO

### **Para o Sistema:**
- ✅ **Funcionalidade completa** do módulo financeiro
- ✅ **Integração total** entre frontend e backend
- ✅ **Dados reais** em todas as telas
- ✅ **Performance otimizada** com endpoints específicos

### **Para o Usuário:**
- ✅ **Interface funcional** sem dados mockados
- ✅ **Operações CRUD** completas
- ✅ **Relatórios precisos** com dados reais
- ✅ **Fluxo de trabalho** completo

### **Para o Desenvolvimento:**
- ✅ **Código limpo** e organizado
- ✅ **APIs padronizadas** e consistentes
- ✅ **Documentação completa** dos endpoints
- ✅ **Testes automatizados** possíveis

---

## 📝 CONCLUSÃO

O módulo financeiro do sistema possui **29.3% dos endpoints necessários** implementados no backend. Para completar a funcionalidade, são necessários **41 endpoints adicionais** distribuídos em 10 módulos principais.

A implementação deve seguir a ordem de prioridades definida, começando pelo **Dashboard Principal** e **CRUD básico** dos módulos mais importantes (Vendas, Orçamentos, Receitas, Custos).

Com a implementação completa, o sistema terá um módulo financeiro totalmente funcional e integrado, proporcionando uma experiência completa para gestão financeira da empresa.
