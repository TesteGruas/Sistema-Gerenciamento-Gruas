# Pendências Identificadas na Auditoria Técnica

**Data:** 30/10/2025  
**Baseado em:** `validacao-audioria.md`

---

## 📊 Status Geral por Módulo

| Módulo | Status | Mock | Integração | Prioridade |
|--------|--------|------|------------|------------|
| Financeiro | ✅ OK | 0% | 100% | Baixa (melhorias opcionais) |
| Autenticação | 🟡 Parcial | 10% | 90% | **ALTA** |
| Assinatura Digital | 🟡 Parcial | 20% | 80% | **ALTA** |
| Aprovações Horas Extras | 🟡 Parcial | 60% | 40% | **ALTA** |
| Notificações | 🟡 Parcial | 50% | 50% | **ALTA** |
| Ponto Eletrônico | 🟡 Parcial | 40% | 60% | Média |
| Obras/Gruas | 🟡 Parcial | 60% | 40% | **ALTA** |
| RH | 🟡 Parcial | 15% | 85% | Média |

---

## 🔴 PRIORIDADE ALTA - Ações Imediatas

### 1. **Notificações** ⚠️
**Status:** 50% mockado

#### Frontend - Pendências:
- ❌ `app/pwa/notificacoes/page.tsx`: **Usa mock local** (linhas 45-74)
  - Substituir array `notificacoesLocais` por `NotificacoesAPI.listar()`
  - Integrar `marcarComoLida()` e `excluirNotificacao()` com APIs reais
  - Usar `useNotificacoes` hook ou `NotificacoesAPI` diretamente
  
- ❌ `lib/api-notificacoes.ts`: **Verificar fallbacks silenciosos**
  - Remover qualquer retorno de mock em catch
  - Propagar erros corretamente
  
- ✅ `hooks/useNotificacoes.ts`: **Já implementado** (marcar todas como lidas ok)

#### Backend:
- ✅ Endpoints existem e estão funcionais

**Arquivos a alterar:**
1. `app/pwa/notificacoes/page.tsx` - Substituir mock por API real
2. `lib/api-notificacoes.ts` - Remover fallbacks silenciosos (se houver)

---

### 2. **Aprovações de Horas Extras** ⚠️
**Status:** 60% mockado

#### Frontend - Pendências:
- ✅ `app/pwa/aprovacao-massa/page.tsx`: **PARCIALMENTE INTEGRADO**
  - ✅ Carrega aprovações via API (`apiAprovacoesHorasExtras.listarPendentes()`)
  - ✅ Aprovação em massa integrada (`aprovarLote()`)
  - ⚠️ Verificar se `rejeitar-lote` está implementado
  
- ⚠️ `app/pwa/aprovacao-detalhes/page.tsx`: **PARCIALMENTE INTEGRADO**
  - ✅ Carrega aprovação via API
  - ⚠️ Precisa buscar registro individual por ID (não via lista)
  - ⚠️ Exibir histórico de aprovação se existir no backend
  
- ❌ `components/card-aprovacao-horas-extras.tsx`: **Verificar dependências de mock**
  - Criar `lib/utils-aprovacoes.ts` com utilitários
  - Remover dependências de dados mockados
  
- ❌ `lib/geolocation-validator.ts`: **Usa `obrasMock`**
  - Substituir por `GET /api/obras`

#### Backend:
- ✅ Endpoints existem (`/aprovar-lote`, `/rejeitar-lote`)
- ⚠️ Validar autorização/perfis

**Arquivos a alterar:**
1. `app/pwa/aprovacao-detalhes/page.tsx` - Buscar registro individual por ID
2. `components/card-aprovacao-horas-extras.tsx` - Remover mocks
3. `lib/geolocation-validator.ts` - Substituir `obrasMock` por API real
4. Criar `lib/utils-aprovacoes.ts` com utilitários extraídos do card

---

### 3. **Ponto Eletrônico** ⚠️
**Status:** 40% mockado

#### Frontend - Pendências:
- ❌ `lib/api-ponto-eletronico.ts`: **Verificar arrays de mocks**
  - Remover todos os arrays mockados
  - Remover catch que retornam mocks silenciosamente
  - Remover `isAdmin = true` hardcoded
  - Tratar erros corretamente (não fallback para mock)
  
- ❌ `app/pwa/ponto/page.tsx`: **Usa `obrasMock[0]`**
  - Buscar obras via API (`GET /api/obras`)
  - Tratar caso sem obras disponíveis
  
- ❌ `app/dashboard/ponto/page.tsx`: **`usuarioId` hardcoded**
  - Usar usuário autenticado do contexto
  - Remover qualquer ID fixo
  
- ❌ `components/espelho-ponto-dialog.tsx`: **Fallback para dados mockados no catch**
  - Remover fallback para mock
  - Exibir erro ao usuário

#### Backend:
- ⚠️ Validar filtros por funcionário/obra
- ⚠️ Garantir erros claros (4xx/5xx) para UI

**Arquivos a alterar:**
1. `lib/api-ponto-eletronico.ts` - Limpeza completa de mocks
2. `app/pwa/ponto/page.tsx` - Substituir obra mock
3. `app/dashboard/ponto/page.tsx` - Remover usuarioId hardcoded
4. `components/espelho-ponto-dialog.tsx` - Remover fallback mock

---

### 4. **Obras e Gruas** ⚠️
**Status:** 60% mockado

#### Frontend - Pendências:
- ⚠️ `app/dashboard/obras/page.tsx`: **Verificar se ainda usa mock-data**
  - ✅ Parece estar usando `obrasApi.listarObras()` (linha 128)
  - ⚠️ Verificar imports de `mock-data`
  - ⚠️ Remover fallbacks para mock se houver
  - Garantir loading/erro na UI
  
- ❌ `app/dashboard/obras/[id]/page.tsx`: **Funções mockadas**
  - Substituir por chamadas reais:
    - `GET /api/obras/:id`
    - Endpoints de documentos por obra
    - Endpoints de custos mensais por obra
  - Remover comentário "Fallback para função mockada"
  
- ❌ `app/dashboard/gruas-new/page.tsx`: **Usa `mockGruas`, `mockObras`, `mockUsers`**
  - Substituir por `gruasApi` e APIs reais
  - Remover todos os imports de mock-data
  
- ❌ Substituir utilitários mockados:
  - Funcionários por obra
  - Custos por obra
  - Documentos por obra

#### Backend:
- ⚠️ Confirmar existência de endpoints auxiliares:
  - Documentos por obra (`GET /api/obras/:id/documentos`)
  - Custos mensais por obra (`GET /api/obras/:id/custos`)
  - Criar se faltarem

**Arquivos a alterar:**
1. `app/dashboard/obras/page.tsx` - Remover imports de mock-data (verificar)
2. `app/dashboard/obras/[id]/page.tsx` - Integrar endpoints reais
3. `app/dashboard/gruas-new/page.tsx` - Remover todos os mocks
4. `app/dashboard/gruas/page.tsx` - Verificar e remover mocks

---

### 5. **Assinatura Digital** ⚠️
**Status:** 20% mockado

#### Frontend - Pendências:
- ❌ `app/dashboard/assinatura/page.tsx`: **Simulações presentes**
  - Remover simulações de DocuSign
  - Remover simulações de links
  - Remover simulações de upload
  - Integrar endpoints reais de assinatura
  - Remover fallback para mocks
  
- ❌ `app/dashboard/assinatura/[id]/page.tsx`: **Fallback para mock data**
  - Integrar upload real de documentos assinados
  - Remover `mockDocumentos.find()`

#### Backend:
- ❓ Se DocuSign: expor endpoints de criação de envelope/callback
- ❓ Caso contrário: `POST /api/documentos/:id/assinar` e upload de arquivo assinado

**Arquivos a alterar:**
1. `app/dashboard/assinatura/page.tsx` - Remover todas as simulações
2. `app/dashboard/assinatura/[id]/page.tsx` - Integrar upload/assinatura real

---

### 6. **Autenticação** ⚠️
**Status:** 10% mockado

#### Frontend - Pendências:
- ✅ `app/lib/auth.ts`: **JÁ INTEGRADO** (chama `/api/auth/me`)
  - ⚠️ Verificar se ainda há fallback para mock em caso de erro
  
- ❌ `components/user-dropdown.tsx`: **Verificar dados mock para dev**
  - Remover dados mock
  - Usar usuário do contexto real
  
- ❌ `lib/user-context.tsx`: **Verificar se usa `mockUsers[0]`**
  - Usar dados reais do usuário autenticado

#### Backend:
- ⚠️ Confirmar `GET /api/auth/me` está exposto e retorna:
  - `id`, `name`, `email`, `role`, `avatar`
  - Retornar JWT validado

**Arquivos a alterar:**
1. `components/user-dropdown.tsx` - Remover dados mock
2. `lib/user-context.tsx` - Verificar e remover `mockUsers[0]`
3. Backend: Confirmar/ajustar `/api/auth/me`

---

## 🟡 PRIORIDADE MÉDIA

### 7. **RH** 🟡
**Status:** 15% mockado

#### Frontend - Pendências:
- Remover todas as simulações "Simular ..." nas páginas:
  - Ponto eletrônico
  - Cálculo de horas
  - Pagamentos
  - Relatórios
  - Alocação/transferência
  
- Integrar com endpoints reais quando disponíveis

#### Backend:
- ❌ Criar endpoints pendentes:
  - Benefícios
  - Férias
  - Relatórios de RH
  - Alocação/transferência

---

## 🟢 PRIORIDADE BAIXA (Melhorias Opcionais)

### 8. **Financeiro - Melhorias** ✅
**Status:** Funcional, melhorias recomendadas

#### Backend (Opcional):
- Adicionar `grua_id` em tabela `receitas`:
  ```sql
  ALTER TABLE receitas ADD COLUMN grua_id INT REFERENCES gruas(id);
  ```
  - Criar automaticamente ao finalizar medição
  
- Adicionar `grua_id` em tabela `custos`:
  ```sql
  ALTER TABLE custos ADD COLUMN grua_id INT REFERENCES gruas(id);
  ```
  - Criar automaticamente em manutenção
  
- Ajustar consultas de rentabilidade para filtrar por `grua_id`/`obra_id`

#### Frontend:
- ✅ Sem pendências funcionais

---

## 🧹 Limpeza de Código

### Arquivos a Deprecar/Remover:
1. `lib/mock-data.ts` - Deprecar após migração
2. `lib/mock-data-aprovacoes.ts` - Deprecar após migração

### Arquivos com Mocks/Fallbacks a Limpar:
1. `lib/api-ponto-eletronico.ts` - Remover arrays mock e fallbacks
2. `lib/api-notificacoes.ts` - Remover fallbacks silenciosos
3. `lib/geolocation-validator.ts` - Substituir `obrasMock`
4. `components/espelho-ponto-dialog.tsx` - Remover fallback mock
5. `components/admin-guard.tsx` - Verificar mock/simulação

### Criar:
- `lib/utils-aprovacoes.ts` - Utilitários extraídos do card de aprovações

---

## ✅ Páginas que Já Estão Integradas

- ✅ `app/pwa/aprovacoes/page.tsx` - Integrada
- ✅ `app/pwa/aprovacao-assinatura/page.tsx` - Integrada
- ✅ `app/dashboard/obras/page.tsx` - Parece estar integrada (verificar mocks)

---

## ⚠️ Páginas de Teste/Demo (Manter como estão)

- `app/teste-aprovacoes/page.tsx` - Página de teste, manter mocks
- `app/navegacao-teste/page.tsx` - Página demonstrativa, manter mocks

---

## 📋 Checklist Consolidado - Frontend

### Notificações
- [ ] Integrar `app/pwa/notificacoes/page.tsx` com `NotificacoesAPI.listar()`
- [ ] Remover fallbacks silenciosos em `lib/api-notificacoes.ts`

### Aprovações
- [ ] `app/pwa/aprovacao-detalhes/page.tsx` - Buscar por ID individual
- [ ] `components/card-aprovacao-horas-extras.tsx` - Remover mocks
- [ ] `lib/geolocation-validator.ts` - Substituir `obrasMock`
- [ ] Criar `lib/utils-aprovacoes.ts`

### Ponto Eletrônico
- [ ] `lib/api-ponto-eletronico.ts` - Limpeza completa
- [ ] `app/pwa/ponto/page.tsx` - Substituir obra mock
- [ ] `app/dashboard/ponto/page.tsx` - Remover usuarioId hardcoded
- [ ] `components/espelho-ponto-dialog.tsx` - Remover fallback

### Obras/Gruas
- [ ] `app/dashboard/obras/page.tsx` - Verificar e remover imports mock-data
- [ ] `app/dashboard/obras/[id]/page.tsx` - Integrar endpoints reais
- [ ] `app/dashboard/gruas-new/page.tsx` - Remover mocks
- [ ] `app/dashboard/gruas/page.tsx` - Verificar mocks

### Assinatura
- [ ] `app/dashboard/assinatura/page.tsx` - Remover simulações
- [ ] `app/dashboard/assinatura/[id]/page.tsx` - Integrar upload real

### Autenticação
- [ ] `components/user-dropdown.tsx` - Remover dados mock
- [ ] `lib/user-context.tsx` - Verificar mockUsers[0]

### RH
- [ ] Remover todas as simulações nas páginas de RH

---

## 📋 Checklist Consolidado - Backend

- [ ] Confirmar `GET /api/auth/me` exposto e funcional
- [ ] Criar endpoints auxiliares de obras (documentos, custos) se faltarem
- [ ] Validar autorização/perfis em endpoints de aprovações
- [ ] Garantir respostas com códigos corretos (4xx/5xx) para evitar fallbacks a mocks
- [ ] Criar endpoints de RH pendentes (benefícios, férias, relatórios, alocação)
- [ ] (Opcional) Adicionar `grua_id` em `receitas` e `custos`

---

## 📝 Regras de Implementação

1. ❌ **Não usar fallback silencioso para mock em produção**
   - Em erro de API: exibir estado/erro e permitir retry

2. ✅ **Todas as chamadas devem validar autenticação/autorização**
   - JWT/claims/permissões

3. ❌ **Sem hardcodes de `usuarioId` ou `isAdmin`**
   - Usar contexto do usuário atual

4. ✅ **Páginas devem ter estados: loading, empty, error**

5. ✅ **Após integrar, remover imports mortos e comentários de simulação**

---

## 🎯 Ordem de Execução Recomendada

1. **Notificações** (FE) - Mais rápido, impacto alto
2. **Aprovações** (FE) - Massa e detalhes, utilitários
3. **Ponto Eletrônico** (FE) - Limpeza da API
4. **Obras/Gruas** (FE) - Remover mock-data
5. **Autenticação** (FE/BE) - Base para tudo
6. **Assinatura** (FE/BE) - Mais complexo
7. **RH** (BE/FE) - Endpoints backend primeiro
8. **Financeiro** (BE) - Melhorias opcionais

---

**Última atualização:** 30/10/2025

