# 📋 TASK-004: Remover Mock de Complementos

**ID da Task:** TASK-004  
**Título:** Remover Mock de Complementos e Integrar com API Real  
**Fase:** 4  
**Módulo:** Complementos  
**Arquivo(s):** 
- `components/grua-complementos-manager.tsx`

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🟡 IMPORTANTE  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Remover o mock de complementos do componente `grua-complementos-manager.tsx` e substituir por chamada real à API existente `/api/complementos`.

O endpoint `/api/complementos` já existe no backend e está funcionando. Apenas o componente precisa ser atualizado para usar a API real ao invés de dados mockados.

---

## 🎯 Objetivos

- [ ] Remover mock do `useEffect` (linhas 151-204)
- [ ] Criar função `loadComplementos()` que chama a API real
- [ ] Implementar filtros por obra_id e grua_id se necessário
- [ ] Garantir que o componente funcione corretamente com dados reais
- [ ] Testar componente após remoção do mock

---

## 📋 Situação Atual

### Dados Mockados

O arquivo `components/grua-complementos-manager.tsx` possui mock no `useEffect` (linhas 151-204):
```typescript
useEffect(() => {
  const mockComplementos: ComplementoItem[] = [
    { id: '1', nome: 'Garfo Paleteiro', ... },
    { id: '2', nome: 'Estaiamentos', ... },
    { id: '3', nome: 'Chumbadores/Base de Fundação', ... }
  ]
  setComplementos(mockComplementos)
}, [dataInicioLocacao, mesesLocacao])
```

### Integrações Existentes

- ✅ Endpoint `/api/complementos` já existe no backend
- ✅ Rota registrada em `backend-api/src/routes/complementos.js`
- ✅ Endpoint suporta filtros: `?obra_id={id}&grua_id={id}`
- ✅ Página `/dashboard/complementos/page.tsx` já usa API real
- ❌ Componente `grua-complementos-manager.tsx` ainda usa mock

---

## 🔧 Ações Necessárias

### Frontend

- [ ] Criar função `loadComplementos()` no componente:
  ```typescript
  const loadComplementos = async (obraId?: string, gruaId?: string) => {
    try {
      const params = new URLSearchParams()
      if (obraId) params.append('obra_id', obraId)
      if (gruaId) params.append('grua_id', gruaId)
      
      const response = await fetch(`/api/complementos?${params}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Erro ao carregar complementos')
      }
      
      const data = await response.json()
      setComplementos(data.data || [])
    } catch (error) {
      console.error('Erro ao carregar complementos:', error)
      // Tratar erro (toast, etc.)
    }
  }
  ```
- [ ] Remover mock do `useEffect` (linhas 151-204)
- [ ] Substituir por chamada à função `loadComplementos()`:
  ```typescript
  useEffect(() => {
    loadComplementos(obraId, gruaId)
  }, [dataInicioLocacao, mesesLocacao, obraId, gruaId])
  ```
- [ ] Adicionar estado de loading se necessário
- [ ] Adicionar tratamento de erros
- [ ] Verificar se `obraId` e `gruaId` estão disponíveis no componente
- [ ] Testar componente após mudanças

---

## 🔌 Endpoints Necessários

### GET
```
GET /api/complementos?obra_id={id}&grua_id={id}
```

**Query Parameters:**
- `obra_id` (opcional): ID da obra para filtrar
- `grua_id` (opcional): ID da grua para filtrar

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "nome": "string",
      "sku": "string",
      "tipo_precificacao": "string",
      "preco_unitario_centavos": 0,
      "quantidade": 0,
      ...
    }
  ],
  "total": 0
}
```

---

## 🗂️ Estrutura de Dados

### Response - Complemento
```typescript
interface ComplementoItem {
  id: string;
  nome: string;
  sku: string;
  tipo_precificacao: 'mensal' | 'por_metro' | 'unico';
  unidade: string;
  preco_unitario_centavos: number;
  quantidade: number;
  descricao?: string;
  inicio_cobranca?: string;
  meses_cobranca?: number;
  taxavel: boolean;
  aliquota: number;
  desconto_percentual: number;
  status: string;
  incluido: boolean;
  // ... outros campos conforme necessário
}
```

---

## ✅ Critérios de Aceitação

- [ ] Mock removido do `useEffect`
- [ ] Função `loadComplementos()` implementada
- [ ] Chamada à API real funcionando
- [ ] Filtros por obra_id e grua_id funcionando (se aplicável)
- [ ] Componente funcionando corretamente com dados reais
- [ ] Tratamento de erros implementado
- [ ] Loading states funcionando (se adicionados)
- [ ] Testes do componente passando

---

## 🧪 Casos de Teste

### Teste 1: Carregar Complementos
**Dado:** Uma obra e grua válidas  
**Quando:** Componente carregar  
**Então:** Deve buscar complementos da API e exibir na lista

### Teste 2: Filtro por Obra
**Dado:** Uma obra específica  
**Quando:** Carregar complementos filtrando por obra_id  
**Então:** Deve retornar apenas complementos daquela obra

### Teste 3: Filtro por Grua
**Dado:** Uma grua específica  
**Quando:** Carregar complementos filtrando por grua_id  
**Então:** Deve retornar apenas complementos daquela grua

### Teste 4: Erro na API
**Dado:** API retornando erro  
**Quando:** Tentar carregar complementos  
**Então:** Deve tratar erro adequadamente (não quebrar componente)

### Teste 5: Sem Complementos
**Dado:** Obra/grua sem complementos  
**Quando:** Carregar complementos  
**Então:** Deve exibir lista vazia, não erro

---

## 🔗 Dependências

### Bloqueada por:
- Nenhuma (endpoint já existe)

### Bloqueia:
- [ ] TASK-006 - Testes e Validação Final (pode incluir validação deste componente)

### Relacionada com:
- Nenhuma task específica

---

## 📚 Referências

- `RELATORIO-DIVISAO-DEMANDAS-FRONTEND-BACKEND.md` - Seção "🟣 3. Remover Mock de Complementos"
- `RELATORIO-INTEGRACAO-FRONTEND-BACKEND-2025-02-02.md` - Seção "9️⃣ MÓDULO: COMPLEMENTOS"
- `components/grua-complementos-manager.tsx` - Componente a ser atualizado

---

## 💡 Notas Técnicas

1. **Filtros:** Verificar se o componente tem acesso a `obraId` e `gruaId`. Se não tiver, pode ser necessário passar como props ou buscar de outro lugar.

2. **Dependências do useEffect:** Incluir `obraId` e `gruaId` nas dependências para recarregar quando mudarem.

3. **Formato de Dados:** Verificar se a estrutura de dados retornada pela API corresponde à interface `ComplementoItem` esperada pelo componente.

4. **Autenticação:** Usar função `getAuthToken()` ou similar que já existe no projeto para autenticação.

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Componente pode não ter acesso a `obraId` ou `gruaId`
  - **Mitigação:** Verificar props do componente e contexto disponível

- **Risco 2:** Estrutura de dados da API pode diferir do mock
  - **Mitigação:** Testar resposta da API e ajustar mapeamento se necessário

- **Risco 3:** Performance se houver muitas chamadas à API
  - **Mitigação:** Implementar cache ou debounce se necessário

---

## 📊 Estimativas

**Tempo Estimado:** 2-4 horas  
**Complexidade:** Baixa  
**Esforço:** Pequeno

**Breakdown:**
- Criar função loadComplementos: 1 hora
- Remover mock e integrar: 30 minutos
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

