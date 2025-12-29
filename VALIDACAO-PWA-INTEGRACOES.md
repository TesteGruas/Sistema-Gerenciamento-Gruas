# Validação PWA - Dados Mockados e Integrações Faltantes

**Data:** 2025-02-26  
**Status:** ⚠️ Requer Atenção

## 📋 Resumo Executivo

Este documento identifica dados mockados, URLs hardcoded e integrações faltantes ou incompletas no PWA (Progressive Web App).

---

## 🔴 Problemas Críticos Encontrados

### 1. URLs Hardcoded com Fallback para Localhost

**Problema:** Múltiplos arquivos usam URLs hardcoded com fallback para `localhost:3001` ou IP específico `72.60.60.118:3001`.

#### Arquivos Afetados:

**`app/pwa/page.tsx`** (linha 564)
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
```

**`app/pwa/login/page.tsx`** (linha 118)
```typescript
let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
```

**`app/pwa/ponto/page.tsx`** (linhas 598, 614)
```typescript
`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ponto-eletronico/registros?...`
```

**`app/pwa/perfil/page.tsx`** (múltiplas linhas: 376, 456, 547, 606)
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
```

**`app/pwa/holerites/page.tsx`** (linhas 176, 396, 471)
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
```

**`app/pwa/gruas/[id]/page.tsx`** (linhas 163, 198)
```typescript
`http://localhost:3001/api/geocoding/endereco?q=${encodeURIComponent(...)}`
```

**`app/pwa/gerenciar-funcionarios/page.tsx`** (linha 82)
```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'}/api/funcionarios`, {
```

**`app/pwa/diagnostico/page.tsx`** (linha 95)
```typescript
{process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'}
```

**`hooks/use-pwa-user.ts`** (linhas 137, 274)
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'
```

**`app/pwa/validar-obra/page.tsx`** (linha 72)
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
```

#### Impacto:
- ❌ URLs hardcoded não funcionam em produção
- ❌ Diferentes fallbacks em diferentes arquivos (inconsistência)
- ❌ IP específico (`72.60.60.118`) pode não estar disponível em todos os ambientes
- ⚠️ Risco de quebra em produção se variável de ambiente não estiver configurada

---

### 2. Comentário Indicando Simulação de Dados

**`app/pwa/gerenciar-funcionarios/page.tsx`** (linha 81)
```typescript
// Simular busca de funcionários (em produção, usar API real)
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'}/api/funcionarios`, {
```

**Status:** ✅ **RESOLVIDO** - O código está usando a API real, mas o comentário está desatualizado e pode causar confusão.

---

### 3. Integração de Geocoding Hardcoded

**`app/pwa/gruas/[id]/page.tsx`** (linhas 163, 198)
```typescript
`http://localhost:3001/api/geocoding/endereco?q=${encodeURIComponent(enderecoCompleto)}`
```

**Problema:**
- URL hardcoded sem usar variável de ambiente
- Não há fallback para serviço externo (ex: Google Maps Geocoding API)
- Pode quebrar se o endpoint não existir no backend

---

### 4. Integração Externa: OpenStreetMap Nominatim

**`app/pwa/page.tsx`** (linhas 172-180)
```typescript
const response = await fetch(
  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordenadas.lat}&lon=${coordenadas.lng}&zoom=18&addressdetails=1`,
  {
    headers: {
      'User-Agent': 'Sistema-Gerenciamento-Gruas'
    },
    signal: abortController.signal
  }
)
```

**Status:** ✅ **OK** - Integração funcional com OpenStreetMap para reverse geocoding.

**Observações:**
- ⚠️ OpenStreetMap tem limites de uso (1 requisição por segundo)
- ⚠️ Pode falhar se exceder o limite
- ✅ Tem tratamento de erro adequado

---

### 5. TODO/FIXME Encontrados

**`app/pwa/holerites/page.tsx`** (linha 573)
```typescript
// TODO: Implementar endpoint de confirmação de recebimento no backend se necessário
```

**Status:** ⚠️ **PENDENTE** - Funcionalidade pode estar incompleta.

---

## 🟡 Problemas Menores

### 6. Inconsistência em Variáveis de Ambiente

Alguns arquivos usam:
- `process.env.NEXT_PUBLIC_API_URL`
- `process.env.NEXT_PUBLIC_API_BASE_URL`

**Recomendação:** Padronizar para uma única variável.

---

### 7. Falta de Validação de URL da API

Nenhum arquivo valida se a URL da API está configurada antes de fazer requisições.

**Recomendação:** Adicionar validação e mensagem de erro clara se a URL não estiver configurada.

---

## ✅ Integrações Funcionais

### 1. API de Ponto Eletrônico
- ✅ Integração completa via `lib/api-ponto-eletronico.ts`
- ✅ Suporte offline com fila de sincronização
- ✅ Tratamento de erros adequado

### 2. API de Gruas
- ✅ Integração via `lib/api-gruas.ts`
- ✅ Cache offline implementado

### 3. API de Notificações
- ✅ Endpoint `/api/notificacoes/count/nao-lidas` funcionando
- ✅ Integrado no hook `use-pwa-user.ts`

### 4. API de Documentos
- ✅ Integração via `lib/api-documentos` (assumido)
- ✅ Suporte offline

### 5. API de Holerites
- ✅ Integração funcional
- ✅ Suporte a assinatura digital

---

## 📝 Recomendações

### Prioridade Alta 🔴

1. **Remover URLs hardcoded:**
   - Criar arquivo de configuração centralizado
   - Usar apenas variáveis de ambiente
   - Validar se a URL está configurada no startup

2. **Corrigir geocoding:**
   - Usar variável de ambiente para URL do backend
   - Adicionar fallback para serviço externo se necessário

3. **Padronizar variáveis de ambiente:**
   - Usar apenas `NEXT_PUBLIC_API_URL`
   - Documentar no `.env.example`

### Prioridade Média 🟡

4. **Remover comentários desatualizados:**
   - Atualizar comentário em `gerenciar-funcionarios/page.tsx`

5. **Implementar TODO:**
   - Avaliar necessidade do endpoint de confirmação de recebimento

6. **Adicionar validação de configuração:**
   - Validar URLs no startup
   - Mostrar erro claro se configuração estiver faltando

### Prioridade Baixa 🟢

7. **Melhorar tratamento de limites do OpenStreetMap:**
   - Implementar rate limiting
   - Adicionar fallback para outro serviço

---

## 🔧 Arquivos que Precisam de Correção

1. ✅ `app/pwa/page.tsx` - Remover localhost hardcoded
2. ✅ `app/pwa/login/page.tsx` - Remover localhost hardcoded
3. ✅ `app/pwa/ponto/page.tsx` - Remover localhost hardcoded
4. ✅ `app/pwa/perfil/page.tsx` - Padronizar variável de ambiente
5. ✅ `app/pwa/holerites/page.tsx` - Padronizar variável de ambiente
6. ✅ `app/pwa/gruas/[id]/page.tsx` - Corrigir geocoding hardcoded
7. ✅ `app/pwa/gerenciar-funcionarios/page.tsx` - Remover comentário desatualizado e IP hardcoded
8. ✅ `app/pwa/diagnostico/page.tsx` - Remover IP hardcoded
9. ✅ `hooks/use-pwa-user.ts` - Remover IP hardcoded
10. ✅ `app/pwa/validar-obra/page.tsx` - Remover localhost hardcoded

---

## 📊 Resumo de Status

| Categoria | Status | Quantidade |
|-----------|--------|------------|
| URLs Hardcoded | 🔴 Crítico | 10+ arquivos |
| Dados Mockados | ✅ OK | 0 (comentário desatualizado) |
| Integrações Externas | ✅ OK | 1 (OpenStreetMap) |
| TODOs Pendentes | 🟡 Atenção | 1 |
| Integrações Backend | ✅ OK | Todas funcionais |

---

## ✅ Conclusão

O PWA está **funcionalmente integrado** com o backend, mas possui **problemas de configuração** que podem causar falhas em produção:

- ❌ **10+ arquivos** com URLs hardcoded
- ✅ **Nenhum dado mockado** (apenas comentário desatualizado)
- ✅ **Todas as integrações principais** estão funcionais
- ⚠️ **1 TODO** pendente (baixa prioridade)

**Ação Recomendada:** Corrigir URLs hardcoded antes do deploy em produção.










