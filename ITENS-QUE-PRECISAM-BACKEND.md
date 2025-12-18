# 🔧 ITENS QUE PRECISAM DE BACKEND

**Data:** 02/03/2025  
**Status:** Frontend pronto, aguardando implementação no backend

---

## 🚨 PRIORIDADE CRÍTICA

### 1. Geração Automática de Senha para Clientes
**Status:** ✅ **JÁ IMPLEMENTADO NO BACKEND**
- O backend já gera senha automaticamente usando `generateSecurePassword()`
- **Ação no Frontend:** ✅ Corrigido - removido envio de senha mockada
- **Status:** ✅ Completo

### 2. Endpoint de Devoluções
**Arquivo:** `app/dashboard/obras/[id]/page.tsx` (linha 4124)
- **TODO:** `// TODO: Criar endpoint no backend para processar devoluções`
- **Endpoint necessário:** `POST /api/obras/:obraId/devolver` ou similar
- **Ação:** Criar endpoint no backend para processar devoluções de obras

### 3. Upload de Arquivos de Impostos
**Arquivo:** `app/dashboard/financeiro/impostos/page.tsx` (linha 1349)
- **TODO:** `// TODO: Implementar upload de arquivo quando o endpoint estiver disponível`
- **Endpoint necessário:** `POST /api/impostos/:id/arquivo` ou similar
- **Ação:** Criar endpoint de upload de arquivo para impostos

### 4. Integração com API de Funcionários (2 lugares)
**Arquivo:** `app/dashboard/obras/[id]/page.tsx` (linhas 4875, 4954)
- **TODO:** `{/* TODO: Integrar com API de funcionários */}`
- **Ação:** Verificar se endpoints de funcionários já existem e integrar

---

## 🔴 PRIORIDADE ALTA

### 5. Endpoints de Sinaleiros
**Status:** Frontend já preparado, aguardando backend

**Endpoints necessários:**
- `GET /api/obras/:obraId/sinaleiros` - Listar sinaleiros de uma obra
- `POST /api/obras/:obraId/sinaleiros` - Criar/atualizar sinaleiros
- `GET /api/obras/sinaleiros/:sinaleiroId/documentos` - Listar documentos do sinaleiro
- `POST /api/obras/sinaleiros/:sinaleiroId/documentos` - Criar documento do sinaleiro
- `PUT /api/obras/documentos-sinaleiro/:documentoId/aprovar` - Aprovar documento

**Nota:** Verificar se alguns destes endpoints já existem no backend

### 6. Endpoint de Performance de Gruas
**Status:** Frontend já preparado, aguardando backend

**Endpoints necessários:**
- `GET /api/relatorios/performance-gruas?data_inicio=...&data_fim=...` - Obter relatório
- `GET /api/relatorios/performance-gruas/export/pdf` - Exportar PDF
- `GET /api/relatorios/performance-gruas/export/excel` - Exportar Excel
- `GET /api/relatorios/performance-gruas/export/csv` - Exportar CSV

### 7. Módulo RH Completo - Endpoints Pendentes

#### 7.1 Férias
- `GET /api/funcionarios/:id/ferias/saldo` - Obter saldo de férias

#### 7.2 Horas
- `POST /api/funcionarios/:id/horas/calcular` - Calcular horas
- `POST /api/funcionarios/:id/pagamento/processar` - Processar pagamento

#### 7.3 Ponto
- `POST /api/funcionarios/:id/ponto` - Registrar ponto (verificar se já existe)

#### 7.4 Alocações
- `POST /api/funcionarios/:id/alocar` - Alocar funcionário em obra
- `POST /api/funcionarios/alocacoes/:id/transferir` - Transferir alocação
- `POST /api/funcionarios/alocacoes/:id/finalizar` - Finalizar alocação

#### 7.5 Relatórios
- `POST /api/rh/relatorios` - Gerar relatórios RH

#### 7.6 Funcionários
- `DELETE /api/funcionarios/:id` - Deletar funcionário (verificar se já existe)

---

## 🟡 PRIORIDADE MÉDIA

### 8. Histórico de Atividades de Usuários
**Arquivo:** `app/dashboard/usuarios/[id]/page.tsx` (linha 134)
- **TODO:** `// TODO: Implementar histórico de atividades quando API estiver disponível`
- **Endpoint necessário:** `GET /api/usuarios/:id/atividades` ou similar
- **Ação:** Criar endpoint para buscar histórico de atividades do usuário

### 9. Paginação em Notas Fiscais
**Arquivo:** `app/dashboard/financeiro/notas-fiscais/page.tsx` (linha 301)
- **TODO:** `// TODO: Adicionar paginação quando a API retornar`
- **Ação:** Implementar paginação no endpoint de notas fiscais

### 10. Integração de Obras nos Relatórios
**Arquivo:** `app/dashboard/relatorios/page.tsx` (linha 645)
- **TODO:** `{/* TODO: Carregar obras do backend */}`
- **Ação:** Verificar se endpoint já existe e integrar

### 11. Dados de Evolução Mensal no Dashboard
**Arquivo:** `app/dashboard/page.tsx` (linhas 96-105)
- **TODO:** Implementado com valores estimados
- **Endpoint necessário:** `GET /api/dashboard/evolucao-mensal` ou similar
- **Ação:** Criar endpoint para buscar dados de evolução histórica

---

## 🔵 PRIORIDADE BAIXA / MELHORIAS

### 12. API de Empresa
**Status:** Funciona com localStorage, mas idealmente deveria ter API

**Endpoint necessário:**
- `GET /api/empresa` - Buscar dados da empresa
- `PUT /api/empresa` - Atualizar dados da empresa

### 13. Tipos de Certificados e Documentos Obrigatórios
**Status:** Atualmente hardcoded no frontend

**Opção 1:** Manter hardcoded (funciona bem)
**Opção 2:** Criar endpoints/configuração:
- `GET /api/configuracoes/tipos-certificados` - Listar tipos de certificados
- `GET /api/configuracoes/documentos-obrigatorios` - Listar documentos obrigatórios

### 14. Catálogo de Complementos
**Arquivo:** `app/dashboard/orcamentos/novo/page.tsx`
- **Status:** Atualmente hardcoded
- **Endpoint necessário:** `GET /api/complementos/catalogo` ou similar
- **Ação:** Criar endpoint para buscar catálogo de complementos disponíveis

### 15. Endpoints de Assinaturas
**Arquivos:**
- `app/dashboard/assinatura/page.tsx` (linha 2165)
- `app/dashboard/assinatura/[id]/page.tsx` (linha 235)

**Ação:** Verificar quais endpoints estão faltando e implementar

### 16. Confirmação de Recebimento de Holerites
**Arquivo:** `app/pwa/holerites/page.tsx` (linha 645)
- **TODO:** `// TODO: Implementar endpoint de confirmação de recebimento no backend se necessário`
- **Endpoint necessário:** `POST /api/holerites/:id/confirmar-recebimento` (opcional)

---

## 📋 RESUMO POR PRIORIDADE

### 🔴 Crítico (Implementar Imediatamente)
1. ✅ Geração automática de senha - **JÁ IMPLEMENTADO**
2. Endpoint de devoluções
3. Upload de arquivos de impostos
4. Integração com API de funcionários (2 lugares)

### 🟠 Alto (Implementar em Breve)
5. Endpoints de sinaleiros (5 endpoints)
6. Endpoint de performance de gruas (4 endpoints)
7. Módulo RH Completo (8+ endpoints)

### 🟡 Médio (Melhorias)
8. Histórico de atividades
9. Paginação em notas fiscais
10. Integração de obras nos relatórios
11. Dados de evolução mensal

### 🔵 Baixo (Opcional/Melhorias)
12. API de empresa
13. Tipos/configurações via API
14. Catálogo de complementos via API
15. Endpoints de assinaturas pendentes
16. Confirmação de recebimento de holerites

---

## ✅ STATUS GERAL

### Frontend
- ✅ **Páginas de teste protegidas**
- ✅ **Mocks críticos removidos**
- ✅ **Funções de debug protegidas**
- ✅ **Fallbacks mockados removidos**
- ✅ **Integrações críticas completas**

### Pendências no Backend
- 🔴 **Crítico:** 3 itens
- 🟠 **Alto:** 12+ endpoints
- 🟡 **Médio:** 4 itens
- 🔵 **Baixo:** 5 itens

---

**Nota:** Muitos dos endpoints listados podem já existir no backend. Recomenda-se verificar a documentação do backend (Swagger/OpenAPI) antes de implementar novos endpoints.

**Última atualização:** 02/03/2025



