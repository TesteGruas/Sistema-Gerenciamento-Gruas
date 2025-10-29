# AUDITORIA PROJETO - 30/10/2025

**Status Geral:** Parcialmente Integrado  
**Arquivos com Mocks:** 50+ arquivos  
**Módulos Críticos:** 7 módulos principais com integrações faltantes

---

## RESUMO POR MÓDULO

| Módulo | Status | Mock % | Integração % | Prioridade |
|--------|--------|--------|--------------|------------|
| Financeiro | OK | 0% | 100% | - |
| Autenticação | Parcial | 10% | 90% | Alta |
| Assinatura Digital | Parcial | 20% | 80% | Média |
| Aprovações Horas Extras | Parcial | 60% | 40% | Alta |
| Notificações | Parcial | 50% | 50% | Alta |
| Ponto Eletrônico | Parcial | 40% | 60% | Alta |
| Obras/Gruas | Parcial | 60% | 40% | Média |
| RH | Parcial | 15% | 85% | Baixa |

---

## 1. APROVAÇÕES HORAS EXTRAS

**Status:** 40% Integrado  
**Status Atual:** Páginas principais integradas, detalhes e massa pendentes

### FRONTEND - TAREFAS

#### Páginas Pendentes
1. **`app/pwa/aprovacao-massa/page.tsx`**
   - Remover import de `mockAprovacoes`
   - Implementar chamada para `POST /api/ponto-eletronico/horas-extras/aprovar-lote`
   - Implementar chamada para `POST /api/ponto-eletronico/horas-extras/rejeitar-lote`
   - Usar `useCurrentUser` para obter funcionário logado
   - Validar permissões antes de aprovar/rejeitar

2. **`app/pwa/aprovacao-detalhes/page.tsx`**
   - Remover import de `mockAprovacoes`
   - Buscar detalhes via `GET /api/ponto-eletronico/registros/:id`
   - Carregar histórico de aprovações se existir endpoint
   - Tratar estados de loading e erro

#### Componentes Pendentes
3. **`components/card-aprovacao-horas-extras.tsx`**
   - Criar arquivo `lib/utils-aprovacoes.ts`
   - Mover funções: `getStatusColor`, `formatarData`, `formatarDataHora`, `formatarTempoRelativo`
   - Atualizar import para usar `lib/utils-aprovacoes.ts`
   - Remover dependência de `lib/mock-data-aprovacoes.ts`

#### Libs Pendentes
4. **`lib/geolocation-validator.ts` (linha 134)**
   - Remover `obrasMock`
   - Implementar busca via `GET /api/obras` usando `lib/api-obras.ts`
   - Filtrar obras do funcionário logado
   - Tratar erro quando API falhar

### BACKEND - TAREFAS

**Endpoints Já Existem:**
- `GET /api/ponto-eletronico/horas-extras` - OK
- `POST /api/ponto-eletronico/registros/:id/aprovar-assinatura` - OK
- `POST /api/ponto-eletronico/horas-extras/aprovar-lote` - OK (não utilizado)
- `POST /api/ponto-eletronico/horas-extras/rejeitar-lote` - OK (não utilizado)

**Nenhuma tarefa pendente no backend.**

---

## 2. NOTIFICAÇÕES

**Status:** 50% Integrado  
**Status Atual:** Endpoints existem, componentes ainda usam mocks

### FRONTEND - TAREFAS

1. **`components/pwa-notifications.tsx`**
   - Remover array `mockNotifications`
   - Substituir por chamada: `NotificacoesAPI.listar()` ou `useNotificacoes` hook
   - Implementar loading state
   - Implementar error handling
   - Implementar refresh manual

2. **`lib/api-notificacoes.ts`**
   - Remover array `mockNotificacoes` (linha ~115)
   - Remover fallback silencioso para mocks no catch
   - Lançar erro ou mostrar toast quando API falhar
   - Manter tratamento de erro mas não retornar dados fake

3. **`hooks/useNotificacoes.ts`**
   - Remover TODO sobre `marcar-todas-lidas` (linha ~140)
   - Implementar chamada para `PATCH /api/notificacoes/marcar-todas-lidas`
   - Atualizar estado local após marcar todas como lidas

### BACKEND - TAREFAS

**Endpoints Já Existem:**
- `GET /api/notificacoes` - OK
- `GET /api/notificacoes/nao-lidas` - OK
- `GET /api/notificacoes/count/nao-lidas` - OK
- `PATCH /api/notificacoes/:id/marcar-lida` - OK
- `PATCH /api/notificacoes/marcar-todas-lidas` - OK

**Nenhuma tarefa pendente no backend.**

---

## 3. PONTO ELETRÔNICO

**Status:** 60% Integrado  
**Status Atual:** Fallbacks para mocks em várias funções

### FRONTEND - TAREFAS

1. **`lib/api-ponto-eletronico.ts`**
   - Remover arrays: `mockFuncionarios`, `mockRegistrosPonto`, `mockJustificativas`
   - Remover todos os blocos catch que retornam mocks
   - Implementar tratamento de erro adequado (lançar erro ou retornar array vazio)
   - Remover `const isAdmin = true` (linha ~188)
   - Implementar verificação real de permissões via `useCurrentUser` ou token JWT

2. **`app/pwa/ponto/page.tsx`**
   - Remover `obrasMock[0]` (linha ~182)
   - Implementar busca de obras via `GET /api/obras`
   - Filtrar obras do funcionário logado
   - Tratar caso onde funcionário não tem obras

3. **`app/dashboard/ponto/page.tsx`**
   - Remover `const usuarioId = 2` (linha ~179)
   - Usar `useCurrentUser` para obter ID do usuário logado
   - Implementar verificação de permissões para acesso admin

### BACKEND - TAREFAS

**Verificar se endpoints respondem corretamente:**
- `GET /api/ponto-eletronico/registros` - Verificar filtro por funcionário
- `GET /api/ponto-eletronico/justificativas` - Verificar filtro por funcionário
- `POST /api/ponto-eletronico/registros` - Validar permissões

**Nenhuma tarefa crítica pendente no backend.**

---

## 4. OBRAS E GRUAS

**Status:** 40% Integrado  
**Status Atual:** Múltiplas páginas ainda usam `lib/mock-data.ts`

### FRONTEND - TAREFAS

1. **`app/dashboard/obras/page.tsx`**
   - Remover import de `mock-data.ts`
   - Remover fallback para `mockObras` no catch
   - Usar `obrasApi.listarObras()` para buscar dados
   - Implementar tratamento de erro (não usar fallback para mock)
   - Implementar estados de loading e erro na UI

2. **`app/dashboard/obras/[id]/page.tsx`**
   - Remover imports de funções mockadas (`getObraById`, `getDocumentosByObra`, etc)
   - Buscar obra via `GET /api/obras/:id`
   - Buscar documentos via `GET /api/obras/:id/documentos` (se existir) ou endpoint de documentos
   - Buscar custos via `GET /api/obras/:id/custos` (se existir) ou endpoint de custos
   - Remover `documentosMockados` e usar dados reais

3. **`app/dashboard/gruas/page.tsx`**
   - Remover import de `mock-data.ts`
   - Usar `gruasApi.listarGruas()` para buscar dados
   - Remover todas as referências a mocks

4. **`app/dashboard/gruas-new/page.tsx`**
   - Remover import de `mock-data.ts`
   - Verificar se usa alguma função mockada e substituir

5. **Funções utilitárias mockadas - Substituir por APIs:**
   - `getUserById()` → `GET /api/funcionarios/:id`
   - `getUsersByRole()` → `GET /api/funcionarios?role={role}`
   - `getUsersByObra()` → `GET /api/funcionarios/obra/:obra_id`
   - `getObraById()` → `GET /api/obras/:id`
   - `getGruaById()` → `GET /api/gruas/:id`
   - `getGruasByObra()` → `GET /api/gruas?obra_id={id}`
   - `getDocumentosByObra()` → Endpoint específico de documentos
   - `getCustosByObra()` → `GET /api/custos?obra_id={id}`
   - `getCustosMensaisByObra()` → `GET /api/custos?obra_id={id}&group_by=mes`
   - `getCustosMensaisByObraAndMes()` → `GET /api/custos?obra_id={id}&mes={mes}`
   - `getMesesDisponiveis()` → Calcular a partir de dados reais ou endpoint específico
   - `criarCustosParaNovoMes()` → `POST /api/custos`

6. **`lib/mock-data.ts`**
   - Manter arquivo temporariamente para referência
   - Marcar como deprecated
   - Planejar remoção após migração completa

### BACKEND - TAREFAS

**Verificar existência e funcionalidade de endpoints:**
- `GET /api/obras` - OK
- `GET /api/obras/:id` - Verificar
- `GET /api/obras/:id/documentos` - Verificar se existe
- `GET /api/gruas` - OK
- `GET /api/gruas/:id` - Verificar
- `GET /api/custos?obra_id={id}` - Verificar filtro por obra
- `GET /api/documentos` - Verificar se existe e filtros disponíveis

**Tarefas Opcionais:**
- Criar endpoint `GET /api/obras/:id/documentos` se não existir
- Criar endpoint `GET /api/custos/mensais?obra_id={id}` se facilitar frontend

---

## 5. ASSINATURA DIGITAL

**Status:** 80% Integrado  
**Status Atual:** PWA integrado, dashboard ainda tem simulações

### FRONTEND - TAREFAS

1. **`app/dashboard/assinatura/page.tsx`**
   - Remover simulações de envio para DocuSign
   - Remover simulações de geração de links
   - Implementar integração real com DocuSign ou sistema de assinatura escolhido
   - Se não usar DocuSign, implementar upload de documentos assinados
   - Remover fallback para dados mockados

2. **`app/dashboard/assinatura/[id]/page.tsx`**
   - Remover `mockDocumentos.find()` (linha ~280)
   - Buscar documento via API real
   - Implementar upload real de documento assinado
   - Conectar com backend para salvar assinatura

### BACKEND - TAREFAS

**Verificar integração com DocuSign:**
- Se usar DocuSign: implementar endpoints de criação de envelopes
- Se não usar: implementar upload de documentos assinados
- Endpoint para salvar documento assinado: `POST /api/documentos/:id/assinar`

**Verificar endpoints existentes:**
- `GET /api/documentos/:id` - Para buscar documento
- `POST /api/documentos/:id/assinar` - Para salvar assinatura

---

## 6. AUTENTICAÇÃO

**Status:** 90% Integrado  
**Status Atual:** `getCurrentUser()` retorna dados mockados

### FRONTEND - TAREFAS

1. **`app/lib/auth.ts`**
   - Remover retorno mockado de `getCurrentUser()` (linha ~312)
   - Implementar chamada para `GET /api/auth/me` ou endpoint equivalente
   - Buscar dados do usuário a partir do token JWT
   - Tratar erro quando token inválido ou expirado
   - Retornar dados reais do usuário logado

2. **`components/user-dropdown.tsx`**
   - Remover dados mock para desenvolvimento
   - Usar `getCurrentUser()` ou `useCurrentUser` hook
   - Buscar dados reais do usuário

3. **`lib/user-context.tsx`**
   - Remover `mockUsers[0]` como padrão
   - Inicializar com `null` ou dados do `getCurrentUser()`

### BACKEND - TAREFAS

1. **Criar endpoint `GET /api/auth/me`**
   - Autenticar via token JWT
   - Buscar dados do usuário no banco
   - Retornar: id, name, email, role, avatar (se existir)
   - Validar token e retornar 401 se inválido

**Ou verificar se endpoint equivalente já existe e documentar.**

---

## 7. RH - MÓDULOS ESPECÍFICOS

**Status:** 85% Integrado  
**Status Atual:** Algumas funcionalidades têm simulações

### FRONTEND - TAREFAS

1. **`app/dashboard/rh-completo/vales/page.tsx`**
   - Remover toast "Funcionalidade em desenvolvimento"
   - Implementar chamada para endpoint de benefícios quando disponível
   - Remover TODO sobre endpoint

2. **`app/dashboard/rh-completo/ponto/page.tsx`**
   - Remover simulação de registro de ponto
   - Integrar com `POST /api/ponto-eletronico/registros`

3. **`app/dashboard/rh-completo/horas/page.tsx`**
   - Remover simulações de cálculo de horas
   - Remover simulações de processamento de pagamento
   - Integrar com endpoints de cálculo de horas extras
   - Integrar com sistema de processamento de pagamento

4. **`app/dashboard/rh-completo/ferias/page.tsx`**
   - Remover simulação de saldo de férias
   - Integrar com endpoint de férias quando disponível

5. **`app/dashboard/rh-completo/relatorios/page.tsx`**
   - Remover simulação de geração
   - Implementar geração real de relatórios
   - Conectar com endpoint de relatórios quando disponível

6. **`app/dashboard/rh-completo/obras/page.tsx`**
   - Remover simulações de alocação/transferência
   - Integrar com endpoints de alocação de funcionários

### BACKEND - TAREFAS

1. **Criar endpoint `GET /api/funcionarios/:id/beneficios`**
   - Retornar benefícios do funcionário (vales, auxílios, etc)

2. **Criar endpoint `GET /api/funcionarios/:id/ferias`**
   - Retornar saldo de férias do funcionário
   - Retornar histórico de férias

3. **Criar endpoint `GET /api/funcionarios/:id/historico-pagamentos`**
   - Retornar histórico de pagamentos e horas extras processadas

4. **Criar endpoint `POST /api/relatorios/rh`**
   - Gerar relatórios de RH
   - Aceitar filtros e período

5. **Criar endpoint `POST /api/funcionarios/:id/alocar`**
   - Alocar funcionário em obra
   - Validar permissões

6. **Criar endpoint `POST /api/funcionarios/:id/transferir`**
   - Transferir funcionário entre obras
   - Validar permissões

---

## 8. FINANCEIRO E GRUAS

**Status:** 100% Integrado (mas com melhorias sugeridas)

### FRONTEND - TAREFAS

**Nenhuma tarefa pendente no frontend.**

### BACKEND - TAREFAS (Melhorias Opcionais)

1. **Adicionar campo `grua_id` na tabela `receitas`**
   - Criar migração SQL: `ALTER TABLE receitas ADD COLUMN grua_id INTEGER REFERENCES gruas(id)`
   - Atualizar schema de validação em `backend-api/src/routes/receitas.js`
   - Tornar campo opcional inicialmente
   - Criar receita com `grua_id` ao finalizar medição quando grua estiver vinculada

2. **Adicionar campo `grua_id` na tabela `custos`**
   - Criar migração SQL: `ALTER TABLE custos ADD COLUMN grua_id INTEGER REFERENCES gruas(id)`
   - Atualizar schema de validação em `backend-api/src/routes/custos.js`
   - Adicionar `grua_id` ao `custoSchema` como opcional
   - Permitir vincular custos diretamente a gruas

3. **Corrigir busca de custos em `backend-api/src/routes/rentabilidade.js` (linha ~87)**
   - Filtrar custos por `obra_id` quando houver relação grua-obra
   - OU filtrar por `grua_id` quando o campo existir
   - Buscar obras relacionadas à grua antes de buscar custos

4. **Criar receita automaticamente ao finalizar medição**
   - Hook/trigger ao finalizar medição com status 'finalizada'
   - Criar registro em `receitas` com `tipo='locacao'`, `grua_id` (se disponível) e `valor`
   - Vincular receita à grua através da locação

5. **Criar custo automaticamente ao registrar manutenção de grua**
   - Ao criar registro de manutenção, criar custo automaticamente
   - Vincular custo diretamente à grua via `grua_id`
   - Tipo de custo: 'manutencao'

---

## RESUMO DE PRIORIDADES

### ALTA PRIORIDADE - ENDPOINTS JÁ EXISTEM (Integrar Agora)

1. **Notificações** - `components/pwa-notifications.tsx`
2. **Aprovações em Massa** - `app/pwa/aprovacao-massa/page.tsx`
3. **Aprovações Detalhes** - `app/pwa/aprovacao-detalhes/page.tsx`
4. **Geolocalização** - `lib/geolocation-validator.ts`
5. **Autenticação** - `app/lib/auth.ts` (criar endpoint se não existir)

### MÉDIA PRIORIDADE

6. **Ponto Eletrônico** - Remover mocks de `lib/api-ponto-eletronico.ts`
7. **Obras/Gruas** - Migrar páginas de mocks para APIs
8. **Assinatura Digital** - Remover simulações DocuSign

### BAIXA PRIORIDADE

9. **RH** - Implementar endpoints faltantes
10. **Financeiro/Gruas** - Melhorias opcionais (adicionar campos `grua_id`)

---

## ARQUIVOS PARA REMOVER/DEPRECAR

### Deprecar (usar como referência, remover após migração):
- `lib/mock-data.ts` - 1250+ linhas
- `lib/mock-data-aprovacoes.ts` - 295 linhas

### Limpar (remover apenas seções de mock):
- `lib/api-ponto-eletronico.ts` - Seções de mock (~85 linhas)
- `lib/api-notificacoes.ts` - Fallbacks para mocks (~70 linhas)
- `lib/geolocation-validator.ts` - `obrasMock` (linha 134)

### Atualizar (integrar completamente):
- `components/pwa-notifications.tsx` - Remover mock
- `components/card-aprovacao-horas-extras.tsx` - Mover funções utilitárias
- `app/pwa/aprovacao-massa/page.tsx` - Integrar API
- `app/pwa/aprovacao-detalhes/page.tsx` - Integrar API
- `app/lib/auth.ts` - Integrar endpoint real

---

## ESTATÍSTICAS

- **Total de arquivos:** 250+
- **Arquivos com mocks:** 50+
- **Arquivos com fallbacks:** 15+
- **Arquivos com TODOs:** 30+
- **Linhas de código mockado:** ~2000+ linhas

---

## NOTAS TÉCNICAS

1. Todos os endpoints mencionados devem validar autenticação via JWT
2. Endpoints devem retornar códigos HTTP apropriados (200, 400, 401, 404, 500)
3. Frontend deve tratar erros adequadamente (não usar fallbacks silenciosos para mocks)
4. Manter compatibilidade com código existente durante migração
5. Testar cada integração isoladamente antes de remover mocks completamente

---

**Última Atualização:** 30/10/2025

