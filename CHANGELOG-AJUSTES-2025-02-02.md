# Changelog - Ajustes do Sistema de Gerenciamento de Gruas

**Data:** 02 de Fevereiro de 2025  
**Versão:** 2.0.0  
**Descrição:** Implementação completa de ajustes nos módulos de Componentes, Gruas, Orçamentos, Medições e Relatórios

---

## 📋 Índice

1. [Ajustes no Cadastro de Componentes](#1-ajustes-no-cadastro-de-componentes)
2. [Integração de Componentes com Estoque](#2-integração-de-componentes-com-estoque)
3. [Campos Técnicos Obrigatórios no Cadastro de Grua](#3-campos-técnicos-obrigatórios-no-cadastro-de-grua)
4. [Renomeação do Módulo de Configuração](#4-renomeação-do-módulo-de-configuração)
5. [Expansão do Módulo de Orçamentos](#5-expansão-do-módulo-de-orçamentos)
6. [Módulo de Medições Mensais](#6-módulo-de-medições-mensais)
7. [Sistema de Relatórios](#7-sistema-de-relatórios)

---

## 1. Ajustes no Cadastro de Componentes

### 📝 Descrição
Reformulação completa do cadastro de componentes de gruas com novos campos e remoção de campos obsoletos.

### ✨ Alterações Implementadas

#### Campos Adicionados:
- **Localização (Tipo)**: Dropdown com opções:
  - Obra X
  - Almoxarifado
  - Oficina
  - Em trânsito
  - Em manutenção
- **Obra ID**: Campo que aparece quando "Obra X" é selecionado, permitindo selecionar a obra específica
- **Dimensões** (todos opcionais):
  - Altura (metros)
  - Largura (metros)
  - Comprimento (metros)
  - Peso (kg)
- **Vida Útil (%)**: Campo percentual (0-100%) com slider + input numérico

#### Campos Removidos:
- **Danificada**: Removido do formulário (gerenciado via status ou checklist)
- **Data de Instalação**: Removido (instalação é por obra, não por componente)

### 📁 Arquivos Alterados

#### Backend

**1. Migration: `backend-api/database/migrations/20250202_ajustes_componentes_grua.sql`** (NOVO)
- Adiciona colunas `localizacao_tipo`, `obra_id`
- Adiciona colunas de dimensões: `dimensoes_altura`, `dimensoes_largura`, `dimensoes_comprimento`, `dimensoes_peso`
- Adiciona coluna `vida_util_percentual` (INTEGER, 0-100)
- Cria índices para melhor performance
- Adiciona comentários nas colunas

**2. Schema: `backend-api/src/schemas/grua-schemas.js`** (ALTERADO)
- Atualiza `componenteSchema` e `componenteUpdateSchema`
- Adiciona validação para novos campos
- Remove validação de `quantidade_danificada` e `data_instalacao`

**3. Rotas: `backend-api/src/routes/grua-componentes.js`** (ALTERADO)
- Atualiza schemas Joi inline
- Adiciona suporte aos novos campos nas rotas POST e PUT

#### Frontend

**4. API Client: `lib/api-componentes.ts`** (ALTERADO)
- Atualiza interface `ComponenteGrua` com novos campos
- Adiciona tipo `obra` para relacionamento

**5. Página de Componentes: `app/dashboard/gruas/[id]/componentes/page.tsx`** (ALTERADO)
- Adiciona estado para `localizacao_tipo`, `obra_id`, dimensões e `vida_util_percentual`
- Implementa dropdown de localização
- Implementa dropdown condicional de obras (quando "Obra X" selecionado)
- Adiciona slider + input para vida útil percentual
- Adiciona campos de dimensões (4 inputs numéricos)
- Remove campos "Data de Instalação" e "Danificada" do formulário
- Integra com `obrasApi` para carregar lista de obras

---

## 2. Integração de Componentes com Estoque

### 📝 Descrição
Integração completa dos componentes de gruas com o módulo de estoque existente, permitindo rastreamento de saldo, localização, disponibilidade e movimentações.

### ✨ Alterações Implementadas

#### Funcionalidades:
- Cada componente aparece automaticamente no estoque
- Sincronização automática de quantidades (total, disponível, em uso)
- Movimentações automáticas quando componentes são instalados/removidos
- Rastreamento de valor total do estoque de componentes

### 📁 Arquivos Alterados

#### Backend

**1. Migration: `backend-api/database/migrations/20250202_integrar_componentes_estoque.sql`** (NOVO)
- Adiciona `componente_id` e `tipo_item` na tabela `estoque`
- Adiciona `componente_id` na tabela `movimentacoes_estoque`
- Cria função `sincronizar_componente_estoque()` com trigger automático
- Cria função `criar_movimentacao_componente_estoque()` com trigger automático
- Triggers garantem sincronização automática sem intervenção manual

**2. Rotas: `backend-api/src/routes/estoque.js`** (ALTERADO)
- Atualiza GET `/api/estoque` para incluir componentes
- Atualiza POST `/api/estoque/movimentar` para suportar `componente_id`
- Adiciona lógica para diferenciar produtos de componentes

---

## 3. Campos Técnicos Obrigatórios no Cadastro de Grua

### 📝 Descrição
Adição de campos técnicos obrigatórios no cadastro de gruas conforme especificação do modelo de orçamento.

### ✨ Alterações Implementadas

#### Campos Adicionados (todos obrigatórios):
- **Fabricante**: Nome do fabricante
- **Tipo**: Grua Torre, Grua Torre Auto Estável, Grua Móvel
- **Lança**: Comprimento da lança em metros
- **Altura Final**: Altura final em metros
- **Ano**: Ano de fabricação
- **Tipo de Base**: Fixa, Auto-estável, etc.
- **Capacidade 1 cabo**: Capacidade com 1 cabo em kg
- **Capacidade 2 cabos**: Capacidade com 2 cabos em kg
- **Potência Instalada**: Potência em KVA
- **Voltagem**: Voltagem de operação (ex: 380V)
- **Velocidade de Rotação**: Velocidade em rpm
- **Velocidade de Elevação**: Velocidade em m/min

### 📁 Arquivos Alterados

#### Backend

**1. Migration: `backend-api/database/migrations/20250202_campos_tecnicos_grua.sql`** (NOVO)
- Adiciona todas as novas colunas na tabela `gruas`
- Atualiza registros existentes com valores padrão usando `COALESCE`
- Torna todas as colunas `NOT NULL` com valores padrão
- Cria índices para melhor performance
- Adiciona comentários nas colunas

**2. Rotas: `backend-api/src/routes/gruas.js`** (ALTERADO)
- Atualiza `gruaSchema` e `gruaInputSchema` com validação dos novos campos
- Adiciona mensagens de erro personalizadas
- Atualiza rotas POST e PUT para mapear novos campos
- Todos os campos são obrigatórios na criação

---

## 4. Renomeação do Módulo de Configuração

### 📝 Descrição
Renomeação do módulo "Configuração de Grua" para "Especificações Técnicas" e transformação em módulo somente leitura.

### ✨ Alterações Implementadas

#### Mudanças:
- Título alterado de "Configurações da Grua" para "Especificações Técnicas"
- Removida funcionalidade de criação de configurações
- Removida funcionalidade de edição de configurações
- Removida funcionalidade de exclusão de configurações
- Módulo agora é puramente visual (read-only)
- Botões de ação removidos

### 📁 Arquivos Alterados

#### Frontend

**1. Página de Configurações: `app/dashboard/gruas/[id]/configuracoes/page.tsx`** (ALTERADO)
- Título atualizado para "Especificações Técnicas"
- Removidos estados e handlers de criação/edição/exclusão
- Removidos diálogos de criação e edição
- Simplificado diálogo de visualização (somente leitura)
- Removidos imports não utilizados
- Componente renomeado conceitualmente (arquivo mantém nome original)

**2. Página de Componentes: `app/dashboard/gruas/[id]/componentes/page.tsx`** (ALTERADO)
- Botão "Configurações" renomeado para "Especificações Técnicas"
- Ícone atualizado para `Settings`

**3. Listagem de Gruas: `app/dashboard/gruas/page.tsx`** (ALTERADO)
- Botão "Configurações" renomeado para "Especificações Técnicas"
- Ícone atualizado para `Settings`

---

## 5. Expansão do Módulo de Orçamentos

### 📝 Descrição
Expansão completa do módulo de orçamentos com todos os campos necessários conforme modelo GR2025064-1.

### ✨ Alterações Implementadas

#### Estrutura de Dados:
- **Dados do Cliente**: Nome, CNPJ, Endereço, Bairro, CEP, Cidade/Estado, Telefone, Email, Contato
- **Dados da Obra**: Nome, Tipo, Endereço, Cidade/Bairro/CEP, Engenheiro Responsável, Contato
- **Dados da Grua**: Modelo, Lança, Altura Final, Base, Ano, Potência, Capacidades, Voltagem
- **Valores Fixos**: Tabela com tipo (Locação/Serviço), descrição, quantidade, valor unitário, total, observações
- **Custos Mensais**: Tabela com tipo, descrição, valor mensal, obrigatório, observações
- **Tabela de Horas Extras**: Tipo (operador/sinaleiro/equipamento), dia da semana, valor/hora
- **Serviços Adicionais**: Tabela completa com tipo, descrição, quantidade, valor unitário, total, observações
- **Campos Gerais**: Prazo de locação, data início estimada, tolerância, escopo incluso, responsabilidades, condições comerciais, logística, garantias

### 📁 Arquivos Alterados

#### Backend

**1. Migration: `backend-api/database/migrations/20250202_expandir_orcamentos.sql`** (NOVO)
- Adiciona campos de cliente expandidos na tabela `orcamentos`
- Adiciona campos de obra na tabela `orcamentos`
- Adiciona campos de grua na tabela `orcamentos`
- Cria tabela `orcamento_valores_fixos`
- Cria tabela `orcamento_custos_mensais`
- Cria tabela `orcamento_horas_extras`
- Cria tabela `orcamento_servicos_adicionais`
- Adiciona campos gerais (prazo, escopo, condições, logística, garantias)
- Cria índices para todas as tabelas relacionadas

**2. Rotas: `backend-api/src/routes/orcamentos.js`** (ALTERADO)
- Atualiza `criarOrcamentoSchema` com todos os novos campos
- Adiciona validação para arrays de itens relacionados
- Atualiza rota POST para criar itens relacionados
- Atualiza rota PUT para atualizar itens relacionados
- Adiciona suporte completo a todos os campos do PDF

---

## 6. Módulo de Medições Mensais

### 📝 Descrição
Criação completa do módulo de medições mensais com cálculo automático e integração total com orçamentos.

### ✨ Alterações Implementadas

#### Funcionalidades Principais:
- **Geração Automática**: Medições podem ser geradas automaticamente a partir do orçamento
- **Cálculo Automático**: Valores calculados automaticamente pela fórmula:
  ```
  Valor Total = Valor Mensal Bruto + Aditivos + Custos Extras - Descontos
  ```
- **Sincronização com Orçamento**: Ao finalizar uma medição, o orçamento é atualizado automaticamente com o total acumulado
- **Histórico Mensal**: Todas as medições de um orçamento podem ser consultadas
- **Itens Detalhados**: Cada medição pode ter:
  - Custos mensais (copiados do orçamento ou editados)
  - Horas extras (com quantidade de horas preenchida)
  - Serviços adicionais
  - Aditivos do cliente (adicionais e descontos)

### 📁 Arquivos Alterados

#### Backend

**1. Migration: `backend-api/database/migrations/20250202_medicoes_mensais_orcamentos.sql`** (NOVO)
- Cria tabela `medicoes_mensais` (tabela principal)
- Cria tabela `medicao_custos_mensais` (custos mensais da medição)
- Cria tabela `medicao_horas_extras` (horas extras da medição)
- Cria tabela `medicao_servicos_adicionais` (serviços adicionais da medição)
- Cria tabela `medicao_aditivos` (aditivos e descontos)
- Adiciona campos `total_faturado_acumulado` e `ultima_medicao_periodo` em `orcamentos`
- Cria função `calcular_valor_total_medicao()` com trigger automático
- Cria função `atualizar_total_faturado_orcamento()` com trigger automático
- Cria função `recalcular_valores_medicao()` para recalcular quando itens são alterados
- Cria triggers para recalcular valores automaticamente

**2. Schemas: `backend-api/src/schemas/medicao-mensal-schemas.js`** (NOVO)
- `medicaoMensalSchema`: Schema para criação de medição
- `medicaoMensalUpdateSchema`: Schema para atualização
- `medicaoMensalFiltersSchema`: Schema para filtros
- `gerarMedicaoAutomaticaSchema`: Schema para geração automática

**3. Rotas: `backend-api/src/routes/medicoes-mensais.js`** (NOVO)
- `GET /api/medicoes-mensais`: Listar medições com filtros
- `GET /api/medicoes-mensais/:id`: Buscar medição por ID com todos os itens
- `POST /api/medicoes-mensais`: Criar nova medição
- `POST /api/medicoes-mensais/gerar-automatica`: Gerar medição automaticamente do orçamento
- `PUT /api/medicoes-mensais/:id`: Atualizar medição
- `PATCH /api/medicoes-mensais/:id/finalizar`: Finalizar medição (atualiza orçamento)
- `GET /api/medicoes-mensais/orcamento/:orcamento_id`: Histórico mensal do orçamento
- `DELETE /api/medicoes-mensais/:id`: Deletar medição (apenas se não finalizada)

**4. Servidor: `backend-api/src/server.js`** (ALTERADO)
- Adiciona import de `medicoesMensaisRoutes`
- Registra rota `/api/medicoes-mensais`

#### Frontend

**5. API Client: `lib/api-medicoes-mensais.ts`** (NOVO)
- Interface `MedicaoMensal` completa
- Interfaces para todos os tipos de itens
- Métodos para todas as operações CRUD
- Método para geração automática
- Método para finalização
- Método para listar por orçamento

---

## 7. Sistema de Relatórios

### 📝 Descrição
Implementação completa de três relatórios em PDF: Orçamento (formato GR2025064-1), Medições Mensais e Componentes + Estoque.

### ✨ Alterações Implementadas

#### Relatórios Criados:

1. **Relatório de Orçamento (GR2025064-1)**
   - Formato idêntico ao modelo fornecido
   - Inclui todos os dados: cliente, obra, grua, valores fixos, custos mensais, horas extras, serviços adicionais, condições gerais, logística, garantias, assinaturas

2. **Relatório de Medições Mensais**
   - Resumo geral com totais
   - Detalhamento mês a mês
   - Histórico completo de faturamento
   - Total acumulado

3. **Relatório de Componentes + Estoque**
   - Resumo geral
   - Componentes alocados
   - Componentes retornados/danificados
   - Movimentações recentes (30 dias)

### 📁 Arquivos Alterados

#### Backend

**1. Rotas: `backend-api/src/routes/relatorios-orcamentos.js`** (NOVO)
- `GET /api/relatorios/orcamentos/:id/pdf`: Gera PDF do orçamento completo
- Usa PDFKit para geração
- Layout A4 profissional
- Inclui todos os dados do orçamento
- Paginação automática

**2. Rotas: `backend-api/src/routes/relatorios-medicoes.js`** (NOVO)
- `GET /api/relatorios/medicoes/:orcamento_id/pdf`: Gera relatório de medições
- Busca todas as medições do orçamento
- Detalha cada mês com todos os itens
- Calcula totais e acumulados

**3. Rotas: `backend-api/src/routes/relatorios-componentes.js`** (NOVO)
- `GET /api/relatorios/componentes-estoque/pdf`: Gera relatório de componentes
- Suporta filtros opcionais (grua_id, localizacao_tipo, status, obra_id)
- Mostra componentes alocados, retornados e movimentações

**4. Servidor: `backend-api/src/server.js`** (ALTERADO)
- Adiciona imports dos três novos arquivos de relatórios
- Registra rotas `/api/relatorios` para todos os relatórios

---

## 📊 Resumo de Arquivos

### Arquivos Novos Criados (15 arquivos)

#### Migrations (4 arquivos)
1. `backend-api/database/migrations/20250202_ajustes_componentes_grua.sql`
2. `backend-api/database/migrations/20250202_integrar_componentes_estoque.sql`
3. `backend-api/database/migrations/20250202_campos_tecnicos_grua.sql`
4. `backend-api/database/migrations/20250202_medicoes_mensais_orcamentos.sql`

#### Backend - Schemas (1 arquivo)
5. `backend-api/src/schemas/medicao-mensal-schemas.js`

#### Backend - Rotas (4 arquivos)
6. `backend-api/src/routes/medicoes-mensais.js`
7. `backend-api/src/routes/relatorios-orcamentos.js`
8. `backend-api/src/routes/relatorios-medicoes.js`
9. `backend-api/src/routes/relatorios-componentes.js`

#### Frontend - API Clients (1 arquivo)
10. `lib/api-medicoes-mensais.ts`

### Arquivos Alterados (8 arquivos)

#### Backend (4 arquivos)
1. `backend-api/src/schemas/grua-schemas.js`
2. `backend-api/src/routes/grua-componentes.js`
3. `backend-api/src/routes/estoque.js`
4. `backend-api/src/routes/gruas.js`
5. `backend-api/src/routes/orcamentos.js`
6. `backend-api/src/server.js`

#### Frontend (3 arquivos)
7. `lib/api-componentes.ts`
8. `app/dashboard/gruas/[id]/componentes/page.tsx`
9. `app/dashboard/gruas/[id]/configuracoes/page.tsx`
10. `app/dashboard/gruas/page.tsx`

---

## 🔧 Tecnologias Utilizadas

- **Backend**: Node.js, Express.js, PostgreSQL, Supabase
- **Validação**: Joi
- **PDF**: PDFKit
- **Frontend**: Next.js, React, TypeScript
- **UI**: Shadcn UI Components

---

## 🚀 Como Aplicar as Mudanças

### 1. Executar Migrations

```bash
cd backend-api/database/migrations
# Execute as migrations na ordem:
# 1. 20250202_ajustes_componentes_grua.sql
# 2. 20250202_integrar_componentes_estoque.sql
# 3. 20250202_campos_tecnicos_grua.sql
# 4. 20250202_expandir_orcamentos.sql (se ainda não foi executada)
# 5. 20250202_medicoes_mensais_orcamentos.sql
```

### 2. Reiniciar Servidor Backend

```bash
cd backend-api
npm install  # Se necessário instalar novas dependências
npm run dev   # ou npm start
```

### 3. Recompilar Frontend

```bash
npm run build  # ou npm run dev para desenvolvimento
```

---

## 📝 Notas Importantes

1. **Compatibilidade**: Todas as mudanças são retrocompatíveis. Registros existentes recebem valores padrão.

2. **Triggers Automáticos**: Os triggers PostgreSQL garantem sincronização automática entre componentes e estoque, e entre medições e orçamentos.

3. **Validação**: Todos os campos obrigatórios têm validação tanto no backend (Joi) quanto no frontend.

4. **Segurança**: Todos os endpoints requerem autenticação e permissões apropriadas.

5. **Performance**: Índices foram criados em todas as colunas usadas em filtros e joins.

---

## ✅ Checklist de Implementação

- [x] Ajustes no cadastro de componentes
- [x] Integração componentes com estoque
- [x] Campos técnicos obrigatórios na grua
- [x] Renomeação módulo de configuração
- [x] Expansão módulo de orçamentos
- [x] Módulo de medições mensais
- [x] Relatório de orçamento (PDF)
- [x] Relatório de medições mensais (PDF)
- [x] Relatório de componentes + estoque (PDF)

---

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação do sistema ou entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido por:** Sistema IRBANA  
**Data:** 02 de Fevereiro de 2025  
**Versão:** 2.0.0

