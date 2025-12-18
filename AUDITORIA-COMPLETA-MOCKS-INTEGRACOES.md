# 🔍 AUDITORIA COMPLETA - MOCKS, INTEGRAÇÕES E PENDÊNCIAS

**Data:** 02/03/2025  
**Escopo:** Sistema completo (Frontend Dashboard + PWA + Backend)  
**Objetivo:** Identificar todos os mocks, dados hardcoded, falta de integração com API e funcionalidades pendentes

---

## 📊 RESUMO EXECUTIVO

### Status Geral por Categoria

| Categoria | Total Encontrado | Crítico | Médio | Baixo |
|-----------|------------------|---------|-------|-------|
| **Páginas de Teste/Demo** | 3 | 2 | 1 | 0 |
| **Mocks em Produção** | 15+ | 8 | 5 | 2 |
| **Dados Hardcoded** | 20+ | 10 | 8 | 2 |
| **TODOs/FIXMEs** | 50+ | 15 | 25 | 10 |
| **Fallbacks para Mocks** | 8+ | 4 | 3 | 1 |
| **Integrações Pendentes** | 12+ | 6 | 4 | 2 |

---

## 🚨 CRÍTICO - REMOVER IMEDIATAMENTE

### 1. Páginas de Teste/Demo (DEV ONLY)

#### ❌ `app/teste-aprovacoes/page.tsx`
- **Status:** Página completa de teste com dados mockados
- **Problema:** Usa `mockAprovacoes` e `mockNotificacoes` (arrays vazios atualmente)
- **Ação:** Remover ou mover para ambiente de desenvolvimento apenas
- **Impacto:** Pode confundir usuários se acessível em produção
- **Linhas:** 717

#### ❌ `app/navegacao-teste/page.tsx`
- **Status:** Página de navegação de teste
- **Problema:** Página demonstrativa com dados mockados
- **Ação:** Remover ou proteger com autenticação de desenvolvimento
- **Impacto:** Baixo (apenas navegação)

#### ❌ `app/dashboard/gruas-new/page.tsx`
- **Status:** Versão antiga da página de gruas
- **Problema:** Usa `mockGruas`, `mockObras`, `mockUsers` (arrays vazios)
- **Ação:** DELETAR arquivo (já existe `app/dashboard/gruas/page.tsx` como versão atual)
- **Impacto:** Médio (arquivo não utilizado mas ainda presente)

---

### 2. Mocks Ativos em Componentes de Produção

#### ❌ `components/livro-grua-obra.tsx` (Linhas 806-876)
- **Problema:** 
  - `dadosMockados` (linhas 807-845) - Dados técnicos completos mockados
  - `sinaleirosMockados` (linhas 848-876) - Array de sinaleiros mockados
- **Uso:** Fallback quando dados não disponíveis
- **Ação:** 
  1. Buscar dados reais da API
  2. Remover fallback mockado ou substituir por valores padrão válidos
  3. Garantir que API sempre retorne dados necessários
- **Impacto:** CRÍTICO - Dados podem ser exibidos incorretamente

#### ❌ `app/dashboard/usuarios/[id]/page.tsx` (Linhas 29-112)
- **Problema:** Usa `mockUsuario` completo com dados hardcoded
- **Ação:** Integrar com API real de usuários (`api-usuarios.ts`)
- **Impacto:** CRÍTICO - Página de detalhes do usuário não funcional

#### ❌ `components/admin-guard.tsx` (Linha 26)
- **Problema:** Verificação mockada via `localStorage.getItem('userRole')`
- **Ação:** Usar hook de permissões real (`use-permissions.ts`) ou API
- **Impacto:** CRÍTICO - Segurança comprometida

#### ❌ `hooks/use-empresa.tsx` (Linhas 26-43, 68)
- **Problema:** 
  - `EMPRESA_DEFAULT` com dados hardcoded
  - Comentário "Por enquanto, usar dados mockados" (linha 68)
- **Ação:** Criar endpoint de empresa no backend e integrar
- **Impacto:** CRÍTICO - Dados da empresa podem estar incorretos

#### ❌ `app/dashboard/obras/nova/page.tsx` (Linhas 814-990)
- **Problema:** Função `preencherDadosTeste()` com dados mockados extensos
- **Ação:** Remover função ou proteger para ambiente de desenvolvimento apenas
- **Impacto:** Médio (função de debug, mas acessível)

#### ❌ `app/dashboard/gruas/page.tsx` (Linhas 878-910)
- **Problema:** Função `preencherDadosDebugGrua()` com dados mockados
- **Ação:** Remover ou proteger para ambiente de desenvolvimento
- **Impacto:** Médio (função de debug)

#### ❌ `app/dashboard/orcamentos/novo/page.tsx` (Linhas 862-919)
- **Problema:** Função `handleDebugFill()` preenche dados mockados
- **Ação:** Remover ou proteger para ambiente de desenvolvimento
- **Impacto:** Médio (função de debug)

---

## ⚠️ ALTO - CORRIGIR URGENTE

### 3. Dados Hardcoded em Componentes

#### ⚠️ `app/dashboard/clientes/page.tsx`
- **Linha 69:** `usuario_senha: ''` com comentário "Não será usado pelo usuário, apenas mockado no envio"
- **Linha 323:** Comentário sobre "senha mockada temporariamente"
- **Ação:** Implementar geração automática de senha no backend
- **Impacto:** ALTO - Processo de criação de cliente incompleto

#### ⚠️ `app/dashboard/financeiro/vendas/page.tsx`
- **Linha 2118:** Comentário "Fallback para dados mockados"
- **Ação:** Verificar e remover fallback, garantir tratamento de erro adequado
- **Impacto:** ALTO - Dados financeiros incorretos

#### ⚠️ `app/dashboard/rh/colaboradores/[id]/certificados/page.tsx`
- **Linha 19:** Comentário "Tipos de certificados (mantido do mock)"
- **Ação:** Buscar tipos de certificados da API
- **Impacto:** ALTO - Dados podem estar desatualizados

#### ⚠️ `components/documentos-sinaleiro-list.tsx`
- **Linha 18:** Comentário "Documentos obrigatórios (mantido do mock)"
- **Ação:** Buscar documentos obrigatórios da API/configuração
- **Impacto:** ALTO - Validações podem estar incorretas

#### ⚠️ `components/editar-sinaleiro-dialog.tsx`
- **Linha 250:** Mensagem "Documento X enviado com sucesso (MOCK)"
- **Ação:** Integrar com upload real e remover mensagem de mock
- **Impacto:** ALTO - Funcionalidade não implementada

---

### 4. TODOs e Funcionalidades Pendentes

#### ⚠️ `app/dashboard/obras/[id]/page.tsx`
- **Linha 4124:** `// TODO: Criar endpoint no backend para processar devoluções`
- **Linha 4875:** `{/* TODO: Integrar com API de funcionários */}`
- **Linha 4954:** `{/* TODO: Integrar com API de funcionários */}`
- **Ação:** Implementar endpoints e integração
- **Impacto:** ALTO - Funcionalidades não funcionais

#### ⚠️ `app/dashboard/financeiro/impostos/page.tsx`
- **Linha 1349:** `// TODO: Implementar upload de arquivo quando o endpoint estiver disponível`
- **Ação:** Criar endpoint de upload e integrar
- **Impacto:** ALTO - Upload de arquivos não funciona

#### ⚠️ `app/dashboard/financeiro/notas-fiscais/page.tsx`
- **Linha 301:** `// TODO: Adicionar paginação quando a API retornar`
- **Ação:** Implementar paginação na API
- **Impacto:** MÉDIO - Performance pode ser afetada

#### ⚠️ `app/dashboard/relatorios/page.tsx`
- **Linha 645:** `{/* TODO: Carregar obras do backend */}`
- **Ação:** Integrar com API de obras
- **Impacto:** ALTO - Relatórios não funcionais

---

### 5. Fallbacks para Mocks

#### ⚠️ `components/espelho-ponto-dialog.tsx`
- **Problema:** Fallback para dados mockados no catch
- **Ação:** Remover fallback, tratar erro adequadamente
- **Impacto:** ALTO - Dados podem estar incorretos

#### ⚠️ `app/dashboard/ponto/aprovacoes/page.tsx`
- **Problema:** Comentário "Mock" em métrica
- **Ação:** Verificar e corrigir
- **Impacto:** MÉDIO - Métricas podem estar incorretas

---

## 📱 PWA - APP MOBILE

### Status Geral do PWA

O PWA está **bem integrado** na maioria dos módulos. Principais achados:

#### ✅ Bem Integrado
- `app/pwa/ponto/page.tsx` - Usa API real (`pontoApi`)
- `app/pwa/obras/page.tsx` - Usa API real (`obrasApi`)
- `app/pwa/encarregador/page.tsx` - Usa API real (`encarregadorApi`)
- `app/pwa/notificacoes/page.tsx` - Usa API real (`NotificacoesAPI`)

#### ⚠️ Pontos de Atenção no PWA

1. **Cache Local vs API:**
   - Muitas páginas usam `localStorage` como fallback quando offline
   - Isso é **correto** para PWA, mas garantir que dados sejam sincronizados

2. **Validações:**
   - Verificar se todas as validações de formulários estão corretas
   - Garantir tratamento de erros adequado

---

## 🔧 INTEGRAÇÕES PENDENTES

### Frontend Pronto (Aguardando Backend)

#### 1. Sinaleiros ✅ Frontend Pronto
- **Arquivos:** 
  - `lib/api-sinaleiros.ts` - ✅ Usa API real
  - `app/dashboard/obras/[id]/page.tsx` - ✅ Usa `sinaleirosApi.listarPorObra()`
  - `app/dashboard/obras/nova/page.tsx` - ✅ Usa `sinaleirosApi.criarOuAtualizar()`
- **Endpoints que o frontend chama:**
  - `GET /api/obras/${obraId}/sinaleiros`
  - `POST /api/obras/${obraId}/sinaleiros`
  - `GET /api/obras/sinaleiros/${sinaleiroId}/documentos`
  - `POST /api/obras/sinaleiros/${sinaleiroId}/documentos`
  - `PUT /api/obras/documentos-sinaleiro/${documentoId}/aprovar`
- **⚠️ Falta:** Backend precisa criar esses endpoints

#### 2. Performance de Gruas ✅ Frontend Pronto
- **Arquivos:**
  - `lib/api-relatorios-performance.ts` - ✅ Usa API real
  - `app/dashboard/relatorios/page.tsx` - ✅ Usa `performanceGruasApi.obterRelatorio()`
- **Endpoints que o frontend chama:**
  - `GET /api/relatorios/performance-gruas?data_inicio=...&data_fim=...`
  - `GET /api/relatorios/performance-gruas/export/pdf`
  - `GET /api/relatorios/performance-gruas/export/excel`
  - `GET /api/relatorios/performance-gruas/export/csv`
- **⚠️ Falta:** Backend precisa criar esses endpoints

#### 3. Complementos de Grua 🟡 Parcial
- **Arquivo:** `components/grua-complementos-manager.tsx`
- **Problema:** Função `loadComplementos()` existe mas não popula dados (linha 187 comentada)
- **Ação:** Decidir lógica e implementar população de complementos

---

### Backend Necessário (Frontend Aguardando)

1. **Empresa/Configurações:**
   - Endpoint para buscar dados da empresa
   - Endpoint para atualizar dados da empresa

2. **Usuários:**
   - Endpoint para buscar detalhes completos do usuário
   - Endpoint para atualizar usuário

3. **Devoluções:**
   - Endpoint para processar devoluções de obras

4. **Funcionários (Integração Parcial):**
   - Verificar se todos os endpoints necessários existem

5. **Upload de Arquivos:**
   - Endpoint para upload de arquivos de impostos

---

## 📋 CHECKLIST DE AÇÕES

### Prioridade CRÍTICA (Fazer Imediatamente)

- [ ] **DELETAR** `app/dashboard/gruas-new/page.tsx`
- [ ] **REMOVER ou PROTEGER** `app/teste-aprovacoes/page.tsx`
- [ ] **REMOVER ou PROTEGER** `app/navegacao-teste/page.tsx`
- [ ] **INTEGRAR** `app/dashboard/usuarios/[id]/page.tsx` com API real
- [ ] **CORRIGIR** `components/admin-guard.tsx` para usar API/hook real
- [ ] **INTEGRAR** `hooks/use-empresa.tsx` com API real
- [ ] **REMOVER MOCKS** de `components/livro-grua-obra.tsx` (dadosMockados e sinaleirosMockados)
- [ ] **PROTEGER** funções de debug (`preencherDadosTeste`, `handleDebugFill`, `preencherDadosDebugGrua`)

### Prioridade ALTA (Fazer Esta Semana)

- [ ] **IMPLEMENTAR** geração automática de senha para clientes (backend)
- [ ] **REMOVER** fallback mockado de `app/dashboard/financeiro/vendas/page.tsx`
- [ ] **INTEGRAR** tipos de certificados com API
- [ ] **INTEGRAR** documentos obrigatórios de sinaleiros com API
- [ ] **IMPLEMENTAR** upload real de documentos de sinaleiros
- [ ] **IMPLEMENTAR** endpoint de devoluções no backend
- [ ] **INTEGRAR** funcionários nas páginas pendentes
- [ ] **IMPLEMENTAR** upload de arquivos de impostos
- [ ] **ADICIONAR** paginação em notas fiscais (backend)

### Prioridade MÉDIA (Fazer Este Mês)

- [ ] **CRIAR** endpoints de sinaleiros no backend
- [ ] **CRIAR** endpoint de performance de gruas no backend
- [ ] **FINALIZAR** lógica de complementos de grua
- [ ] **CORRIGIR** fallback mockado de `components/espelho-ponto-dialog.tsx`
- [ ] **REVISAR** todos os TODOs restantes

### Prioridade BAIXA (Fazer Quando Possível)

- [ ] **REVISAR** e limpar comentários antigos
- [ ] **DOCUMENTAR** APIs existentes
- [ ] **MELHORAR** tratamento de erros em todos os componentes

---

## 📊 ESTATÍSTICAS DETALHADAS

### Arquivos Analisados

- **Frontend Dashboard:** ~124 arquivos `.tsx`
- **Frontend PWA:** ~33 arquivos `.tsx`
- **Componentes:** ~157 arquivos
- **Hooks:** ~21 arquivos
- **Lib/API:** ~77 arquivos
- **Total:** ~412 arquivos

### Mocks Encontrados por Tipo

| Tipo | Quantidade | Arquivos |
|------|------------|----------|
| Arrays/Objetos Mockados | 15+ | `teste-aprovacoes`, `gruas-new`, `usuarios/[id]`, etc. |
| Funções de Debug/Teste | 5+ | `nova/page.tsx` (obras, gruas, orcamentos) |
| Dados Hardcoded | 20+ | `livro-grua-obra`, `use-empresa`, etc. |
| Fallbacks Mockados | 8+ | Vários componentes |
| TODOs/FIXMEs | 50+ | Distribuídos em vários arquivos |

---

## 🎯 RECOMENDAÇÕES FINAIS

### Estratégia de Remoção de Mocks

1. **Fase 1 - Limpeza (1 semana):**
   - Remover páginas de teste
   - Remover versões antigas de arquivos
   - Proteger funções de debug

2. **Fase 2 - Integração Crítica (2 semanas):**
   - Integrar usuários, empresa, admin-guard
   - Remover mocks críticos de componentes de produção
   - Implementar endpoints críticos no backend

3. **Fase 3 - Finalização (1 mês):**
   - Integrar todas as funcionalidades pendentes
   - Criar endpoints faltantes no backend
   - Revisar e corrigir TODOs restantes

### Boas Práticas Recomendadas

1. **Nunca usar mocks em produção:**
   - Usar variáveis de ambiente para dados de teste
   - Criar páginas de teste separadas (protegidas)

2. **Tratamento de erros:**
   - Sempre tratar erros adequadamente
   - Nunca usar fallback com dados mockados
   - Usar estados de erro/loading apropriados

3. **Validações:**
   - Validar dados da API antes de usar
   - Ter valores padrão válidos quando necessário
   - Documentar campos obrigatórios

4. **TODOs:**
   - Criar issues/tasks para cada TODO encontrado
   - Priorizar TODOs críticos
   - Revisar TODOs periodicamente

---

## 📝 NOTAS ADICIONAIS

### Arquivos de Referência

- `PENDENCIAS-FRONTEND.md` - Lista de pendências do frontend
- `LEVANTAMENTO-COMPLETO-FRONT-BACK-MOCKS.md` - Levantamento detalhado
- `validacao-audioria.md` - Validação técnica anterior

### Ambiente de Desenvolvimento

Alguns mocks e funções de debug são úteis em desenvolvimento. Recomenda-se:

1. **Criar variável de ambiente** `NODE_ENV` ou `ENVIRONMENT`
2. **Proteger funções de debug** com verificação de ambiente
3. **Remover ou comentar** em produção

---

**Fim da Auditoria**

*Última atualização: 02/03/2025*

