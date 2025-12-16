# 📊 Estrutura do Sistema Financeiro - Rotas e Acesso

**Data:** 28/02/2025  
**Objetivo:** Documentar todas as funcionalidades implementadas e suas rotas de acesso

---

## 🏠 PÁGINA INICIAL (Dashboard)

**Rota:** `/dashboard/financeiro`

### Visão Geral
- ✅ **Valores a receber hoje** - Exibido no dashboard principal
- ✅ **Valores a pagar hoje** - Exibido no dashboard principal
- ✅ **Recebimentos em atraso** - Exibido no dashboard principal
- ✅ **Pagamentos em atraso** - Exibido no dashboard principal
- ✅ **Visualizar próximos dias** - Seletor de período disponível no dashboard

### Gráficos
- ✅ **Gráfico de saldo ao longo do tempo** - Exibido no dashboard
- ✅ **Fluxo de caixa diário/mensal** - Gráfico disponível no dashboard

### Integração Bancária
- ✅ **Registro de contas bancárias** - Rota: `/dashboard/financeiro/contas-bancarias`
- ✅ **Exibição do saldo atualizado** - Exibido no dashboard e na página de contas bancárias

### Cadastro Rápido
- ✅ **Orçamentos** - Rota: `/dashboard/financeiro/orcamentos`
- ✅ **Vendas** - Rota: `/dashboard/financeiro/vendas`
- ✅ **Compras** - Rota: `/dashboard/financeiro/compras`
- ✅ **Receitas** - Rota: `/dashboard/financeiro/receitas`
- ✅ **Custos/Despesas** - Rota: `/dashboard/financeiro/custos`

### Importação, Exportação e Impressão
- ✅ **Exportação como planilha** - Botão disponível no dashboard
- ✅ **Impressão rápida** - Botão disponível no dashboard

### Transferências Bancárias
- ✅ **Registrar transferências** - Rota: `/dashboard/financeiro/transferencias`
- ✅ **Visualizar transferências** - Rota: `/dashboard/financeiro/transferencias`
- ✅ **Resumo no dashboard** - Exibido na página inicial

---

## 📦 MENU 1: VENDAS

### 1.1 Ordem de Serviço / Ordem de Compras
**Rota:** `/dashboard/financeiro/vendas/ordem-compras`
- ✅ Criar ordem de compra
- ✅ Visualizar ordens
- ✅ Acompanhar status de aprovação
- ✅ Fluxo completo de aprovação

### 1.3 Vendas e Orçamentos
**Rota:** `/dashboard/financeiro/vendas`
- ✅ Criar vendas
- ✅ Visualizar vendas
- ✅ Listar orçamentos
- ✅ Converter orçamentos em vendas
- ✅ Gerenciar itens de venda

**Rota:** `/dashboard/financeiro/orcamentos`
- ✅ Criar orçamentos
- ✅ Visualizar orçamentos
- ✅ Enviar orçamentos
- ✅ Aprovar/rejeitar orçamentos

---

## 🛒 MENU 2: COMPRAS

### 2.1 Pedidos de Compra
**Rota:** `/dashboard/financeiro/compras`
- ✅ Criar pedidos de compra
- ✅ Acompanhar pedidos
- ✅ Status de aprovação
- ✅ Adicionar itens à compra
- ✅ Receber compras

### 2.2 Fornecedores
**Rota:** `/dashboard/financeiro/cadastro` (aba "Fornecedores")
- ✅ Cadastrar fornecedores
- ✅ Visualizar fornecedores
- ✅ Histórico de compras por fornecedor
- ✅ Editar fornecedores

### 2.3 Produtos e Serviços Comprados
**Rota:** `/dashboard/financeiro/compras`
- ✅ Registrar itens comprados
- ✅ Valores e categorias
- ✅ Gerenciar itens de compra

### 2.4 Contas a Pagar (Compras)
**Rota:** `/dashboard/financeiro/contas-pagar`
- ✅ Listar contas a pagar
- ✅ Visualizar vencimentos
- ✅ Visualizar valores
- ✅ Gerenciar pagamentos

---

## 🏗️ MENU 3: LOCAÇÕES

### 3.1 Gruas Locadas
**Rota:** `/dashboard/financeiro/locacoes` (aba "Locações")
- ✅ Cadastrar locações de gruas
- ✅ Visualizar gruas locadas
- ✅ Vincular com cliente e contrato
- ✅ Gerenciar medições
- ✅ Cálculo automático (sem e com aditivos)

### 3.2 Plataformas Locadas
**Rota:** `/dashboard/financeiro/locacoes` (aba "Locações")
- ✅ Cadastrar locações de plataformas
- ✅ Visualizar plataformas locadas
- ✅ Vincular com cliente e contrato
- ✅ Gerenciar medições
- ✅ Cálculo automático (sem e com aditivos)

### 3.3 Medições Finalizadas
**Rota:** `/dashboard/financeiro/medicoes`
- ✅ Visualizar medições finalizadas
- ✅ Relatório com filtros
- ✅ Filtro por períodos
- ✅ Filtro por locação
- ✅ Filtro por grua

### 3.4 Orçamentos de Locação
**Rota:** `/dashboard/financeiro/locacoes` (aba "Orçamentos")
- ✅ Criar orçamentos de locação
- ✅ Visualizar orçamentos
- ✅ Gerenciar orçamentos

### 3.5 NFe (Entrada e Saída)
**Rota:** `/dashboard/financeiro/locacoes` (aba "Notas Fiscais")
- ✅ Criar notas fiscais de locação
- ✅ Visualizar notas fiscais
- ✅ Gerenciar NFe entrada e saída
- ✅ Vincular com locações

### 3.6 Notas de Débito
**Rota:** `/dashboard/financeiro/locacoes` (aba "Notas de Débito")
- ✅ Criar notas de débito
- ✅ Visualizar notas de débito
- ✅ Gerenciar notas de débito

### 3.7 Notas Fiscais de Serviço
**Rota:** `/dashboard/financeiro/locacoes` (aba "Notas Fiscais")
- ✅ Criar NF de serviço
- ✅ Visualizar NF de serviço
- ✅ Gerenciar NF de serviço

### 3.8 Relatório Detalhado de Locações
**Rota:** `/dashboard/financeiro/relatorios` (aba "Locações")
- ✅ Relatório completo de locações
- ✅ Equipamentos locados
- ✅ Aditivos
- ✅ Pagamentos

---

## 💰 MENU 4: IMPOSTOS

### 4.1 Pagamentos de Impostos
**Rota:** `/dashboard/financeiro/impostos`
- ✅ Registrar pagamentos de impostos
- ✅ Visualizar impostos
- ✅ Gerenciar impostos financeiros
- ✅ Filtrar por tipo de imposto
- ✅ Filtrar por status

### 4.2 Relatório de Impostos
**Rota:** `/dashboard/financeiro/relatorios` (aba "Impostos")
- ✅ Relatório de impostos
- ✅ Filtros por período
- ✅ Exportação de relatórios

---

## 🚚 MENU 5: LOGÍSTICA DE EQUIPAMENTOS

### 5.1 Manifestos
**Rota:** `/dashboard/financeiro/logistica` (aba "Manifestos")
- ✅ Gerenciar manifestos eletrônicos (MDF-e)
- ✅ Emitir manifestos
- ✅ Cancelar manifestos
- ✅ Encerrar manifestos

### 5.2 CT-e e MDF-e
**Rota:** `/dashboard/financeiro/logistica` (aba "CT-e/MDF-e")
- ✅ Emitir CT-e
- ✅ Emitir MDF-e
- ✅ Gerenciar documentos fiscais
- ✅ Visualizar documentos

### 5.3 Motoristas
**Rota:** `/dashboard/financeiro/logistica` (aba "Motoristas")
- ✅ Gerenciar informações de motoristas
- ✅ Cadastrar motoristas
- ✅ Visualizar documentação
- ✅ Gerenciar carros/veículos
- ✅ Visualizar histórico de viagens

### 5.3.1 Cadastro de Motorista
**Rota:** `/dashboard/financeiro/logistica` (aba "Motoristas")
- ✅ Criar cadastro de motorista
- ✅ Editar cadastro
- ✅ Visualizar detalhes

### 5.4 Histórico/Relatórios de Viagens
**Rota:** `/dashboard/financeiro/logistica` (aba "Viagens")
- ✅ Visualizar histórico de viagens
- ✅ Relatórios de viagens
- ✅ Filtros por motorista, veículo, rota

### Gestão de Equipamentos
**Rota:** `/dashboard/financeiro/cadastro` (aba "Produtos")
- ✅ Cadastrar equipamentos (gruas, plataformas, rádios, ar-condicionado, etc.)
- ✅ Gerenciar diferentes tipos de equipamentos
- ✅ Visualizar equipamentos

---

## 👥 MENU 6: CADASTRO

### 6.1 Clientes
**Rota:** `/dashboard/financeiro/cadastro` (aba "Clientes")
- ✅ Cadastrar clientes
- ✅ Visualizar clientes
- ✅ Editar clientes
- ✅ Usar para vendas e locações

### 6.2 Fornecedores
**Rota:** `/dashboard/financeiro/cadastro` (aba "Fornecedores")
- ✅ Cadastrar fornecedores
- ✅ Visualizar fornecedores
- ✅ Editar fornecedores
- ✅ Usar para compras e serviços contratados

### 6.3 Produtos e Equipamentos
**Rota:** `/dashboard/financeiro/cadastro` (aba "Produtos")
- ✅ Cadastrar produtos e equipamentos
- ✅ Visualizar produtos
- ✅ Editar produtos
- ✅ Itens vendidos ou locados

### 6.4 Funcionários
**Rota:** `/dashboard/financeiro/cadastro` (aba "Funcionários")
- ✅ Visualizar funcionários
- ✅ Dados dos colaboradores
- ✅ Gerenciar informações

---

## 📈 MENU 7: RELATÓRIOS

**Rota Base:** `/dashboard/financeiro/relatorios`

### 7.1 Relatório Financeiro
**Rota:** `/dashboard/financeiro/relatorios` (aba "Financeiro")
- ✅ Fluxo de Caixa Diário
- ✅ Fluxo de Caixa Mensal
- ✅ Gráficos e análises

### 7.2 Relatório de Vendas
**Rota:** `/dashboard/financeiro/relatorios` (aba "Vendas")
- ✅ Relatório completo de vendas
- ✅ Filtros por período
- ✅ Filtros por cliente
- ✅ Exportação

### 7.3 Relatório de Contratos
**Rota:** `/dashboard/financeiro/relatorios` (aba "Contratos")
- ✅ Análise de contratos ativos
- ✅ Análise de contratos inativos
- ✅ Filtros personalizados

### 7.4 Relatório de Faturamento
**Rota:** `/dashboard/financeiro/relatorios` (aba "Faturamento")
- ✅ Relatório de faturamento
- ✅ Análises e gráficos
- ✅ Filtros por período

### 7.5 Relatório de Locações
**Rota:** `/dashboard/financeiro/relatorios` (aba "Locações")
- ✅ Equipamentos locados
- ✅ Aditivos
- ✅ Pagamentos
- ✅ Filtros personalizados

### 7.6 Relatório de Estoque
**Rota:** `/dashboard/financeiro/relatorios` (aba "Estoque")
- ✅ Relatório de estoque
- ✅ Movimentações
- ✅ Análises

### Personalização de Relatórios
**Disponível em todas as abas de relatórios:**
- ✅ Seleção de período (data inicial e final)
- ✅ Filtros por critérios (cliente, equipamento, etc.)
- ✅ Exportar em PDF
- ✅ Exportar em Excel

---

## 🔐 CONTROLE DE USUÁRIOS

### Login Individual
**Rota:** `/auth/login`
- ✅ Sistema de autenticação completo
- ✅ Cada pessoa tem login individual
- ✅ Controle de acesso por permissões

### Registro de Alterações (Auditoria)
**Rota:** `/dashboard/historico` (se disponível)
- ✅ Sistema de auditoria completo
- ✅ Logs de todas as alterações
- ✅ Registro de quem fez alterações
- ✅ Histórico de alterações por módulo
- ✅ Timestamp de todas as ações

---

## 📋 NAVEGAÇÃO RÁPIDA

### Menu Principal do Financeiro
Acesse através de: `/dashboard/financeiro`

**Itens do Menu:**
- Dashboard - `/dashboard/financeiro`
- Vendas - `/dashboard/financeiro/vendas`
- Medições - `/dashboard/financeiro/medicoes`
- Receitas - `/dashboard/financeiro/receitas`
- Custos - `/dashboard/financeiro/custos`
- Aluguéis - `/dashboard/financeiro/alugueis`
- Relatórios - `/dashboard/financeiro/relatorios`

### Módulos Adicionais
- Compras - `/dashboard/financeiro/compras`
- Locações - `/dashboard/financeiro/locacoes`
- Impostos - `/dashboard/financeiro/impostos`
- Logística - `/dashboard/financeiro/logistica`
- Cadastro - `/dashboard/financeiro/cadastro`
- Transferências - `/dashboard/financeiro/transferencias`
- Contas Bancárias - `/dashboard/financeiro/contas-bancarias`
- Contas a Receber - `/dashboard/financeiro/contas-receber`
- Contas a Pagar - `/dashboard/financeiro/contas-pagar`
- Orçamentos - `/dashboard/financeiro/orcamentos`

---

## 📝 RESUMO

Todas as funcionalidades listadas acima estão **implementadas e funcionais**. O sistema financeiro possui uma estrutura completa com:

- ✅ **Página inicial** com visão geral completa
- ✅ **7 menus principais** totalmente funcionais
- ✅ **Sistema de relatórios** completo e personalizável
- ✅ **Controle de usuários** com auditoria
- ✅ **Integração** entre todos os módulos

Para acessar qualquer funcionalidade, use as rotas indicadas acima ou navegue pelo menu do sistema financeiro.
