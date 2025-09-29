# ⚡ GUIA RÁPIDO - ACESSO ÀS FUNCIONALIDADES

## 🚀 COMO ACESSAR CADA FUNCIONALIDADE

### **🏠 DASHBOARD PRINCIPAL**
- **URL:** `/dashboard`
- **Acesso:** Login automático após autenticação
- **Funcionalidade:** Visão geral do sistema

---

## 🏗️ MÓDULO DE OBRAS

### **📋 Listar Obras**
- **URL:** `/dashboard/obras`
- **Menu:** Lateral → "Obras"
- **Funcionalidade:** Ver todas as obras cadastradas

### **➕ Nova Obra**
- **URL:** `/dashboard/obras/nova`
- **Acesso:** Botão "Nova Obra" (laranja) na página de obras
- **Funcionalidade:** Criar nova obra com múltiplas gruas

### **🔧 Gerenciar Gruas por Obra**
- **Acesso:** Lista de obras → Botão "Gerenciar Gruas" (laranja)
- **Funcionalidade:** Adicionar/remover gruas de obra existente

### **👁️ Visualizar Obra**
- **Acesso:** Lista de obras → Botão "Ver" (azul)
- **Funcionalidade:** Ver detalhes completos da obra

---

## 🏗️ MÓDULO DE GRUAS

### **📋 Listar Gruas**
- **URL:** `/dashboard/gruas`
- **Menu:** Lateral → "Gruas"
- **Funcionalidade:** Ver todas as gruas cadastradas

### **➕ Nova Grua**
- **Acesso:** Botão "Nova Grua" na página de gruas
- **Funcionalidade:** Cadastrar nova grua

### **🔧 Componentes da Grua**
- **URL:** `/dashboard/gruas/[id]/componentes`
- **Acesso:** Lista de gruas → Botão "Componentes" (azul)
- **Funcionalidade:** Gerenciar peças individuais da grua

### **⚙️ Configurações da Grua**
- **URL:** `/dashboard/gruas/[id]/configuracoes`
- **Acesso:** Lista de gruas → Botão "Configurações" (verde)
- **Funcionalidade:** Definir configurações possíveis da grua

### **📖 Livro da Grua**
- **URL:** `/dashboard/gruas/[id]/livro`
- **Acesso:** Lista de gruas → Botão "Livro" (roxo)
- **Funcionalidade:** Histórico completo da grua

---

## 👥 MÓDULO DE FUNCIONÁRIOS

### **📋 Listar Funcionários**
- **URL:** `/dashboard/funcionarios`
- **Menu:** Lateral → "Funcionários"
- **Funcionalidade:** Ver todos os funcionários

### **➕ Novo Funcionário**
- **Acesso:** Botão "Novo Funcionário" na página de funcionários
- **Funcionalidade:** Cadastrar novo funcionário

### **⏰ Ponto Eletrônico**
- **URL:** `/dashboard/ponto`
- **Menu:** Lateral → "Ponto"
- **Funcionalidade:** Controle de ponto dos funcionários

---

## 💰 MÓDULO FINANCEIRO

### **🏠 Dashboard Financeiro**
- **URL:** `/dashboard/financeiro`
- **Menu:** Lateral → "Financeiro"
- **Funcionalidade:** Visão geral das finanças

### **💰 Custos**
- **URL:** `/dashboard/financeiro/custos`
- **Acesso:** Financeiro → "Custos"
- **Funcionalidade:** Gestão de custos operacionais

### **💵 Receitas**
- **URL:** `/dashboard/financeiro/receitas`
- **Acesso:** Financeiro → "Receitas"
- **Funcionalidade:** Controle de receitas e faturamento

### **📊 Medições**
- **URL:** `/dashboard/financeiro/medicoes`
- **Acesso:** Financeiro → "Medições"
- **Funcionalidade:** Registro de medições de obra

### **🛒 Vendas**
- **URL:** `/dashboard/financeiro/vendas`
- **Acesso:** Financeiro → "Vendas"
- **Funcionalidade:** Gestão de vendas e orçamentos

### **📋 Orçamentos**
- **URL:** `/dashboard/financeiro/orcamentos`
- **Acesso:** Financeiro → "Orçamentos"
- **Funcionalidade:** Criação e gestão de orçamentos

### **🛍️ Compras**
- **URL:** `/dashboard/financeiro/compras`
- **Acesso:** Financeiro → "Compras"
- **Funcionalidade:** Gestão de compras e fornecedores

### **🏗️ Locações**
- **URL:** `/dashboard/financeiro/locacoes`
- **Acesso:** Financeiro → "Locações"
- **Funcionalidade:** Controle de locações de gruas

### **📊 Relatórios**
- **URL:** `/dashboard/financeiro/relatorios`
- **Acesso:** Financeiro → "Relatórios"
- **Funcionalidade:** Relatórios avançados e exportação

---

## 📦 MÓDULO DE ESTOQUE

### **📋 Controle de Estoque**
- **URL:** `/dashboard/estoque`
- **Menu:** Lateral → "Estoque"
- **Funcionalidade:** Gestão de peças e componentes

---

## 📋 CHECK-LIST DE DEVOLUÇÃO

### **📋 Controle de Devolução**
- **URL:** `/dashboard/checklist-devolucao`
- **Menu:** Lateral → "Check-list Devolução"
- **Funcionalidade:** Conferência de peças devolvidas

---

## 📊 RELATÓRIOS GERAIS

### **📊 Relatórios**
- **URL:** `/dashboard/relatorios`
- **Menu:** Lateral → "Relatórios"
- **Funcionalidade:** Relatórios operacionais e financeiros

---

## 🎯 FUNCIONALIDADES ESPECIAIS

### **🔧 Múltiplas Gruas por Obra**
- **Onde:** Nova Obra → Aba "Gruas"
- **Como:** Buscar e adicionar várias gruas
- **Benefício:** Flexibilidade total na gestão

### **💰 Custos Mensais**
- **Onde:** Nova Obra → Aba "Custos Mensais"
- **Como:** Configurar custos recorrentes
- **Benefício:** Controle financeiro detalhado

### **📋 Check-list de Devolução**
- **Onde:** Menu lateral → "Check-list Devolução"
- **Como:** Comparar enviado vs devolvido
- **Benefício:** Controle de peças e prevenção de perdas

### **📊 Relatórios Avançados**
- **Onde:** Financeiro → "Relatórios"
- **Como:** Usar filtros combinados
- **Benefício:** Análise completa dos dados

---

## 🚀 FLUXO RECOMENDADO

### **1. Configuração Inicial**
1. **Cadastrar Gruas** → `/dashboard/gruas`
2. **Cadastrar Funcionários** → `/dashboard/funcionarios`
3. **Configurar Custos** → `/dashboard/financeiro/custos`

### **2. Operação Diária**
1. **Criar Obras** → `/dashboard/obras/nova`
2. **Registrar Medições** → `/dashboard/financeiro/medicoes`
3. **Controle de Ponto** → `/dashboard/ponto`
4. **Check-list Devolução** → `/dashboard/checklist-devolucao`

### **3. Análise e Relatórios**
1. **Relatórios Financeiros** → `/dashboard/financeiro/relatorios`
2. **Análise de Performance** → `/dashboard/relatorios`
3. **Exportação de Dados** → Qualquer módulo com botão "Exportar"

---

## 💡 DICAS IMPORTANTES

### **🎯 Navegação**
- **Menu lateral** para acesso rápido
- **Breadcrumbs** para orientação
- **Botões coloridos** para identificação de ações
- **Filtros** em todas as listagens

### **🔍 Busca e Filtros**
- **Campo de busca** em todas as listas
- **Filtros avançados** nos módulos financeiros
- **Ordenação** por qualquer coluna
- **Paginação** para grandes volumes

### **📊 Relatórios**
- **Exportação** em PDF, Excel, CSV
- **Filtros combinados** para análises específicas
- **Seleção de colunas** para personalização
- **Agendamento** de relatórios automáticos

### **⚙️ Configurações**
- **Perfil do usuário** no canto superior direito
- **Configurações** do sistema no menu lateral
- **Preferências** de visualização
- **Backup** automático de dados

---

## 🆘 SUPORTE RÁPIDO

### **❓ Em caso de dúvidas:**
1. **Consulte este guia** para localização rápida
2. **Use a busca** do sistema para encontrar funcionalidades
3. **Verifique os filtros** para localizar informações
4. **Exporte dados** antes de fazer alterações importantes

### **🔧 Funcionalidades em Destaque:**
- ✅ **Interface responsiva** - Funciona em qualquer dispositivo
- ✅ **Navegação intuitiva** - Menu lateral organizado
- ✅ **Busca rápida** - Filtros em todas as telas
- ✅ **Exportação flexível** - Múltiplos formatos
- ✅ **Controle total** - Todas as operações centralizadas

---

**🎯 Este guia fornece acesso rápido a todas as funcionalidades do sistema. Para instruções detalhadas, consulte o Manual do Usuário completo.**
