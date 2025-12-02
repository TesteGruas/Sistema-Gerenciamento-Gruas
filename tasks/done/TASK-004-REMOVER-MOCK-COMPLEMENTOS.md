# 📋 TASK-004: Remover Mock de Complementos de Grua

**ID da Task:** TASK-004  
**Título:** Substituir Mock de Complementos por API Real  
**Fase:** 1  
**Módulo:** Obras - Complementos  
**Arquivo(s):** 
- `components/grua-complementos-manager.tsx` (linhas 151-204)
- `lib/api-complementos.ts` (criar se não existir)

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🔴 ALTA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Substituir o mock de complementos de grua no componente `grua-complementos-manager.tsx` (linhas 151-204) por chamada real à API `/api/complementos`. O endpoint backend já existe e está funcionando, mas o componente ainda usa dados mockados hardcoded em um `useEffect`.

O componente atualmente carrega 3 complementos fixos (Garfo Paleteiro, Estaiamentos, Chumbadores/Base de Fundação) em vez de buscar do catálogo real de complementos.

---

## 🎯 Objetivos

- [ ] Criar ou verificar `lib/api-complementos.ts` com função para listar complementos
- [ ] Substituir mock no `useEffect` por chamada real à API
- [ ] Ajustar filtros e parâmetros conforme necessário
- [ ] Mapear dados da API para estrutura esperada pelo componente
- [ ] Adicionar tratamento de erros e loading states
- [ ] Testar integração completa
- [ ] Remover código mockado

---

## 📋 Situação Atual

### Dados Mockados

O arquivo `components/grua-complementos-manager.tsx` (linhas 151-204) contém:
```typescript
useEffect(() => {
  const mockComplementos: ComplementoItem[] = [
    {
      id: '1',
      nome: 'Garfo Paleteiro',
      sku: 'ACESS-001',
      // ... dados hardcoded
    },
    {
      id: '2',
      nome: 'Estaiamentos',
      sku: 'ACESS-005',
      // ... dados hardcoded
    },
    {
      id: '3',
      nome: 'Chumbadores/Base de Fundação',
      sku: 'ACESS-006',
      // ... dados hardcoded
    }
  ]
  setComplementos(mockComplementos)
}, [dataInicioLocacao, mesesLocacao])
```

### Integrações Existentes

- ✅ Backend endpoint existe: `/api/complementos`
- ✅ Rota registrada: `backend-api/src/server.js:355`
- ✅ Rotas implementadas: `backend-api/src/routes/complementos.js`
- ✅ CRUD completo disponível (GET, POST, PUT, DELETE)
- ✅ Validações com Joi implementadas
- ✅ Paginação implementada
- ✅ Filtros disponíveis (tipo, ativo, search)
- ❌ Frontend não tem API client (`lib/api-complementos.ts`)
- ⚠️ Componente usa mock hardcoded

---

## 🔧 Ações Necessárias

### Frontend

- [ ] Criar `lib/api-complementos.ts`:
  ```typescript
  export const complementosApi = {
    async listar(filtros?: {
      tipo?: 'acessorio' | 'servico';
      ativo?: boolean;
      search?: string;
      page?: number;
      limit?: number;
      grua_obra_id?: string; // se necessário filtrar por grua_obra
    }): Promise<ComplementosResponse> {
      // Implementar chamada GET /api/complementos
    }
  }
  ```

- [ ] Atualizar `components/grua-complementos-manager.tsx`:
  - Remover mock do `useEffect` (linhas 151-204)
  - Adicionar estado de loading
  - Substituir por chamada real:
    ```typescript
    useEffect(() => {
      const carregarComplementos = async () => {
        try {
          setLoading(true)
          const response = await complementosApi.listar({
            ativo: true,
            // Adicionar filtros conforme necessário
            // grua_obra_id: gruaObraId (se a API suportar)
          })
          // Mapear dados da API para ComplementoItem
          setComplementos(response.data || [])
        } catch (error) {
          console.error('Erro ao carregar complementos:', error)
          toast.error('Erro ao carregar complementos')
        } finally {
          setLoading(false)
        }
      }
      carregarComplementos()
    }, [gruaObraId]) // Ajustar dependências conforme necessário
    ```

- [ ] Mapear dados da API para `ComplementoItem`:
  - Verificar se estrutura da API é compatível
  - Criar função de conversão se necessário
  - Ajustar campos que possam diferir

- [ ] Adicionar tratamento de erros:
  - Try-catch na chamada da API
  - Mensagens de erro amigáveis
  - Fallback para lista vazia em caso de erro

- [ ] Adicionar loading state:
  - Mostrar skeleton ou spinner enquanto carrega
  - Desabilitar interações durante carregamento

### Backend

- [ ] Verificar se endpoint suporta filtro por `grua_obra_id`:
  - Se necessário, adicionar filtro na rota GET
  - Ou criar rota específica `/api/complementos/grua-obra/:id`

- [ ] Verificar se estrutura de resposta está completa:
  - Garantir que todos os campos necessários são retornados
  - Verificar tipos de dados (centavos, datas, etc.)

### Banco de Dados

- [ ] Verificar se tabela `complementos_catalogo` tem dados:
  - Se não tiver, criar dados de teste
  - Verificar se SKUs do mock existem no banco

---

## 🔌 Endpoints Necessários

### GET
```
GET /api/complementos?ativo=true&tipo=acessorio&page=1&limit=50
GET /api/complementos/grua-obra/:grua_obra_id (se necessário)
```

**Parâmetros:**
- `tipo` (opcional): 'acessorio' | 'servico'
- `ativo` (opcional): boolean
- `search` (opcional): string para busca
- `page` (opcional): número da página (padrão: 1)
- `limit` (opcional): itens por página (padrão: 50, máximo: 100)

**Response:**
```typescript
{
  success: boolean;
  data: ComplementoCatalogo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Nota:** Endpoint já existe, apenas precisa ser integrado no frontend.

---

## 🗂️ Estrutura de Dados

### Request
```typescript
interface ComplementosListRequest {
  tipo?: 'acessorio' | 'servico';
  ativo?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}
```

### Response - API
```typescript
interface ComplementoCatalogo {
  id: string;
  nome: string;
  sku: string;
  tipo: 'acessorio' | 'servico';
  tipo_precificacao: 'mensal' | 'unico' | 'por_metro' | 'por_hora' | 'por_dia';
  unidade: 'm' | 'h' | 'unidade' | 'dia' | 'mes';
  preco_unitario_centavos: number;
  fator?: number;
  descricao?: string;
  rule_key?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}
```

### Response - Componente (ComplementoItem)
```typescript
interface ComplementoItem {
  id: string;
  nome: string;
  sku?: string;
  tipo_precificacao: TipoPrecificacao;
  unidade: Unidade;
  preco_unitario_centavos: number;
  quantidade: number;
  fator?: number;
  descricao?: string;
  inicio_cobranca?: string;
  fim_cobranca?: string;
  meses_cobranca?: number;
  taxavel: boolean;
  aliquota: number;
  desconto_percentual: number;
  depends_on_item_id?: string;
  rule_key?: string;
  status: StatusItem;
  incluido: boolean;
  condicoes_locacao?: string;
}
```

**Nota:** Pode ser necessário mapear `ComplementoCatalogo` para `ComplementoItem`, adicionando campos que não vêm da API (como `quantidade`, `status`, `incluido`, etc.).

---

## ✅ Critérios de Aceitação

- [ ] API client `lib/api-complementos.ts` criado
- [ ] Mock removido do componente
- [ ] Componente carrega complementos do catálogo real
- [ ] Filtros funcionando (ativo, tipo, etc.)
- [ ] Mapeamento de dados funcionando corretamente
- [ ] Tratamento de erros implementado
- [ ] Loading states funcionando
- [ ] Componente funciona corretamente após mudança
- [ ] Testes de integração passando
- [ ] Código mockado removido
- [ ] Documentação atualizada

---

## 🧪 Casos de Teste

### Teste 1: Carregar Complementos
**Dado:** Catálogo de complementos no banco de dados  
**Quando:** Abrir componente de complementos  
**Então:** Deve exibir complementos reais do catálogo

### Teste 2: Filtrar por Tipo
**Dado:** Complementos de diferentes tipos no catálogo  
**Quando:** Filtrar por tipo 'acessorio'  
**Então:** Deve exibir apenas acessórios

### Teste 3: Buscar Complemento
**Dado:** Complementos no catálogo  
**Quando:** Buscar por nome ou SKU  
**Então:** Deve retornar complementos que correspondem à busca

### Teste 4: Erro na API
**Dado:** API indisponível ou erro  
**Quando:** Tentar carregar complementos  
**Então:** Deve exibir mensagem de erro e não quebrar o componente

### Teste 5: Lista Vazia
**Dado:** Nenhum complemento no catálogo  
**Quando:** Carregar complementos  
**Então:** Deve exibir lista vazia sem erros

---

## 🔗 Dependências

### Bloqueada por:
- Nenhuma (pode ser executada independentemente)

### Bloqueia:
- Nenhuma (pode ser executada em paralelo)

### Relacionada com:
- TASK-006 - Remover fallbacks silenciosos (pode haver fallbacks relacionados)

---

## 📚 Referências

- `RELATORIO-AUDITORIA-COMPLETA-2025-02-02.md` - Seção "1.1 Mocks Críticos - Complementos de Grua"
- `backend-api/src/routes/complementos.js` - Rotas backend existentes
- `components/grua-complementos-manager.tsx` - Componente que usa mock

---

## 💡 Notas Técnicas

1. **Mapeamento de Dados:** O `ComplementoCatalogo` da API pode não ter todos os campos do `ComplementoItem` usado no componente. Campos como `quantidade`, `status`, `incluido` podem precisar ser inicializados com valores padrão.

2. **Filtro por Grua Obra:** Verificar se é necessário filtrar complementos por `grua_obra_id`. Se sim, pode ser necessário:
   - Adicionar filtro na API
   - Ou criar rota específica
   - Ou filtrar no frontend após carregar

3. **Dependências do useEffect:** Atualmente depende de `dataInicioLocacao` e `mesesLocacao`. Verificar se ainda faz sentido ou se deve depender de `gruaObraId`.

4. **Performance:** Se houver muitos complementos, considerar:
   - Paginação no componente
   - Cache de complementos
   - Lazy loading

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Estrutura de dados diferente entre API e componente
  - **Mitigação:** Criar função de mapeamento e testar extensivamente

- **Risco 2:** Componente pode depender de campos que não vêm da API
  - **Mitigação:** Inicializar campos faltantes com valores padrão

- **Risco 3:** Performance se houver muitos complementos
  - **Mitigação:** Implementar paginação ou filtros adequados

- **Risco 4:** Funcionalidades que dependem do mock podem quebrar
  - **Mitigação:** Testar todas as funcionalidades do componente após mudança

---

## 📊 Estimativas

**Tempo Estimado:** 3-4 horas  
**Complexidade:** Baixa  
**Esforço:** Pequeno

**Breakdown:**
- Criar API client: 1 hora
- Substituir mock no componente: 1 hora
- Mapeamento de dados: 30 minutos
- Testes e correções: 1-1.5 horas

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

