# 📋 TASK-006: Remover Fallbacks Silenciosos para Mocks

**ID da Task:** TASK-006  
**Título:** Corrigir Fallbacks Silenciosos que Usam Mocks  
**Fase:** 1  
**Módulo:** Múltiplos  
**Arquivo(s):** 
- `app/dashboard/obras/page.tsx` (~linha 245)
- `app/dashboard/obras/[id]/page.tsx` (~linha 1179)
- `lib/api-obras.ts` (linha 663)
- `lib/api-responsavel-tecnico.ts` (linha 103)
- `lib/auth-cache.ts` (linhas 115-121)

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🔴 ALTA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Remover ou corrigir fallbacks silenciosos que usam mocks quando há erro na API. Esses fallbacks mascaram problemas reais e fazem o sistema parecer funcionar quando na verdade está usando dados falsos.

Os fallbacks identificados estão em vários arquivos e precisam ser substituídos por tratamento de erros adequado, sem usar dados mockados como fallback.

---

## 🎯 Objetivos

- [ ] Identificar todos os fallbacks silenciosos para mocks
- [ ] Substituir por tratamento de erros adequado
- [ ] Mostrar mensagens de erro ao usuário quando apropriado
- [ ] Garantir que erros sejam logados corretamente
- [ ] Remover imports de mocks não utilizados
- [ ] Testar comportamento após correções

---

## 📋 Situação Atual

### Fallbacks Identificados

1. **`app/dashboard/obras/page.tsx` (~linha 245):**
   - `catch { setObras(mockObras) }` - Fallback silencioso para mock

2. **`app/dashboard/obras/[id]/page.tsx` (~linha 1179):**
   - `// Fallback para função mockada` - Comentário indicando fallback

3. **`lib/api-obras.ts` (linha 663):**
   - `// Relacionamentos - usar os que vêm do backend ou fallback` - Fallback para relacionamentos

4. **`lib/api-responsavel-tecnico.ts` (linha 103):**
   - `// Fallback: tabela responsaveis_tecnicos` - Comentário sobre fallback

5. **`lib/auth-cache.ts` (linhas 115-121):**
   - Fallback para dados do localStorage quando há erro ao carregar do Supabase

### Integrações Existentes

- ✅ APIs reais existem e funcionam
- ⚠️ Fallbacks mascaram erros reais
- ⚠️ Usuários podem ver dados incorretos sem saber

---

## 🔧 Ações Necessárias

### Frontend

- [ ] **`app/dashboard/obras/page.tsx`:**
  - Localizar `catch { setObras(mockObras) }`
  - Substituir por:
    ```typescript
    catch (error) {
      console.error('Erro ao carregar obras:', error)
      toast.error('Erro ao carregar obras. Tente novamente.')
      // Não definir obras mockadas, deixar lista vazia ou estado de erro
      setObras([])
      setError('Erro ao carregar obras')
    }
    ```
  - Remover import de `mockObras` se não for mais usado
  - Adicionar estado de erro se não existir
  - Mostrar mensagem de erro ao usuário

- [ ] **`app/dashboard/obras/[id]/page.tsx`:**
  - Localizar comentário `// Fallback para função mockada` (~linha 1179)
  - Verificar se há código de fallback
  - Remover fallback e implementar tratamento de erro adequado
  - Verificar outras ocorrências de fallback no arquivo (linhas 3147, 3360 mencionadas no grep)

- [ ] **`lib/api-obras.ts` (linha 663):**
  - Localizar comentário sobre fallback de relacionamentos
  - Verificar se há código que usa fallback
  - Remover fallback e usar apenas dados do backend
  - Se relacionamentos não vêm do backend, tratar como erro ou buscar separadamente

- [ ] **`lib/api-responsavel-tecnico.ts` (linha 103):**
  - Localizar comentário sobre fallback
  - Verificar se há código de fallback
  - Remover fallback e usar apenas dados reais
  - Implementar tratamento de erro se necessário

- [ ] **`lib/auth-cache.ts` (linhas 115-121):**
  - Este caso é diferente - fallback para localStorage pode ser aceitável
  - Avaliar se é realmente um problema ou se é comportamento esperado
  - Se for problema, melhorar tratamento de erro:
    ```typescript
    catch (error) {
      console.error('Erro ao carregar dados de autenticação:', error)
      // Tentar localStorage como último recurso, mas logar o erro
      const userProfile = localStorage.getItem('user_profile')
      // ... resto do código
      // Mas retornar erro se não conseguir carregar de nenhum lugar
    }
    ```

- [ ] Buscar outros fallbacks no projeto:
  - Buscar por `catch {` seguido de setState com mock
  - Buscar por `fallback` em comentários
  - Buscar por `mock` em catch blocks

### Backend

- [ ] Verificar se há problemas nas APIs que causam os erros:
  - Testar endpoints que estão falhando
  - Corrigir bugs se encontrados
  - Melhorar mensagens de erro

---

## 🔌 Endpoints Verificados

Verificar se os seguintes endpoints estão funcionando corretamente:
- `GET /api/obras` - Listagem de obras
- `GET /api/obras/:id` - Detalhes da obra
- `GET /api/responsaveis-tecnicos` - Responsáveis técnicos
- Endpoints de autenticação

---

## ✅ Critérios de Aceitação

- [ ] Todos os fallbacks silenciosos para mocks foram removidos
- [ ] Tratamento de erros adequado implementado
- [ ] Mensagens de erro mostradas ao usuário quando apropriado
- [ ] Erros são logados corretamente
- [ ] Imports de mocks não utilizados foram removidos
- [ ] Sistema não usa dados mockados como fallback
- [ ] Comportamento após erro é adequado (lista vazia, estado de erro, etc.)
- [ ] Testes passando
- [ ] Documentação atualizada

---

## 🧪 Casos de Teste

### Teste 1: Erro ao Carregar Obras
**Dado:** API de obras retorna erro  
**Quando:** Tentar carregar lista de obras  
**Então:** Deve mostrar mensagem de erro e não usar dados mockados

### Teste 2: Erro ao Carregar Obra Específica
**Dado:** API retorna erro ao buscar obra por ID  
**Quando:** Tentar carregar detalhes da obra  
**Então:** Deve mostrar mensagem de erro e não usar fallback mockado

### Teste 3: Relacionamentos Não Disponíveis
**Dado:** API não retorna relacionamentos  
**Quando:** Converter obra do backend para frontend  
**Então:** Deve usar lista vazia ou buscar separadamente, não usar fallback

### Teste 4: Erro na Autenticação
**Dado:** Erro ao carregar dados de autenticação do Supabase  
**Quando:** Tentar carregar dados de autenticação  
**Então:** Deve tentar localStorage mas logar o erro, não silenciar

---

## 🔗 Dependências

### Bloqueada por:
- Pode ser executada em paralelo com outras tasks

### Bloqueia:
- Nenhuma (pode ser executada em paralelo)

### Relacionada com:
- TASK-002 - Remover mock certificados (pode haver fallbacks relacionados)
- TASK-004 - Remover mock complementos (pode haver fallbacks relacionados)
- Todas as tasks de remoção de mocks

---

## 📚 Referências

- `RELATORIO-AUDITORIA-COMPLETA-2025-02-02.md` - Seção "1.2 Fallbacks Silenciosos para Mocks"
- Arquivos mencionados na seção de situação atual

---

## 💡 Notas Técnicas

1. **Tratamento de Erros:** Ao remover fallbacks, garantir que:
   - Erros são logados para debugging
   - Usuários veem mensagens adequadas
   - Sistema não quebra completamente
   - Estados de erro são gerenciados corretamente

2. **Fallback vs Cache:** Alguns "fallbacks" podem ser cache legítimo (como localStorage). Diferenciar entre:
   - Fallback para mock (ruim, remover)
   - Cache/backup legítimo (pode ser aceitável, mas melhorar)

3. **Relacionamentos:** Se relacionamentos não vêm do backend, considerar:
   - Buscar separadamente via API
   - Mostrar loading enquanto busca
   - Tratar como erro se não conseguir buscar

4. **UX:** Ao remover fallbacks, garantir boa experiência:
   - Mostrar loading states
   - Mostrar mensagens de erro claras
   - Permitir retry quando apropriado
   - Não deixar tela completamente vazia

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Remover fallback pode quebrar funcionalidade se API estiver instável
  - **Mitigação:** Garantir que APIs estão funcionando antes de remover fallbacks

- **Risco 2:** Usuários podem ver mais erros
  - **Mitigação:** Melhorar tratamento de erros e mensagens, implementar retry

- **Risco 3:** Alguns "fallbacks" podem ser cache legítimo
  - **Mitigação:** Avaliar caso a caso, melhorar em vez de remover se for legítimo

---

## 📊 Estimativas

**Tempo Estimado:** 4-6 horas  
**Complexidade:** Média  
**Esforço:** Médio

**Breakdown:**
- Identificação de todos os fallbacks: 1 hora
- Correção de fallbacks: 2-3 horas
- Testes e ajustes: 1-2 horas

---

## 🔄 Histórico de Mudanças

| Data | Autor | Mudança |
|------|-------|---------|
| 02/02/2025 | Sistema | Task criada |

---

## ✅ Checklist Final

- [ ] Código implementado
- [ ] Testes passando
- [ ] Code review realizado
- [ ] Documentação atualizada
- [ ] Deploy em dev
- [ ] Testes em dev
- [ ] Deploy em homologação
- [ ] Testes em homologação
- [ ] Aprovação do PO
- [ ] Deploy em produção
- [ ] Verificação em produção
- [ ] Task fechada

---

**Criado em:** 02/02/2025  
**Última Atualização:** 02/02/2025

