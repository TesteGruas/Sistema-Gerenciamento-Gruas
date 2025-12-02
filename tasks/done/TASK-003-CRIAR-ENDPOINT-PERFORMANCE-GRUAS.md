# 📋 TASK-003: Criar Endpoint de Performance de Gruas

**ID da Task:** TASK-003  
**Título:** Implementar Endpoint Real de Performance de Gruas com Queries SQL  
**Fase:** 1  
**Módulo:** Relatórios - Gruas  
**Arquivo(s):** 
- `backend-api/src/routes/relatorios.js` (ou novo arquivo)
- `backend-api/src/server.js`
- `lib/mocks/performance-gruas-mocks.ts` (remover após implementação)
- `lib/api-relatorios.ts` (ou criar se não existir)

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🔴 ALTA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Criar endpoint `/api/relatorios/performance-gruas` no backend com queries SQL complexas para calcular métricas reais de performance de gruas. Atualmente, o frontend usa dados mockados de `lib/mocks/performance-gruas-mocks.ts` que gera 10 gruas fake com dados simulados.

O endpoint deve calcular:
- Horas trabalhadas, disponíveis e ociosas
- Taxa de utilização
- Receitas e custos por grua
- ROI (Return on Investment)
- Comparativo com período anterior
- Agregações por período

---

## 🎯 Objetivos

- [ ] Criar endpoint `/api/relatorios/performance-gruas` no backend
- [ ] Implementar queries SQL complexas para cálculos reais
- [ ] Calcular métricas de performance por grua
- [ ] Calcular métricas financeiras (receita, custo, lucro, ROI)
- [ ] Implementar comparativo com período anterior
- [ ] Adicionar paginação e filtros
- [ ] Integrar frontend com endpoint real
- [ ] Remover mock após confirmação
- [ ] Adicionar validações e tratamento de erros

---

## 📋 Situação Atual

### Dados Mockados

O arquivo `lib/mocks/performance-gruas-mocks.ts` (linhas 1-803) contém:
- Interface `GruaPerformance` com estrutura completa
- Interface `PerformanceGruasResponse` com resumo e lista
- Função `gerarMockPerformanceGruas()` que gera 10 gruas fake com:
  - Métricas de horas trabalhadas/disponíveis/ociosas
  - Cálculos financeiros (receita, custo, lucro, margem)
  - ROI calculado
  - Lista de obras visitadas
  - Comparativo com período anterior

### Integrações Existentes

- ❌ Endpoint backend não existe: `/api/relatorios/performance-gruas`
- ⚠️ Frontend usa mock em componentes de relatórios
- ✅ Estrutura de dados bem definida nas interfaces TypeScript
- ✅ Banco de dados tem tabelas relacionadas (gruas, obras, locacoes, etc.)

---

## 🔧 Ações Necessárias

### Backend

- [ ] Criar rota em `backend-api/src/routes/relatorios.js` (ou criar arquivo específico):
  ```javascript
  GET /api/relatorios/performance-gruas?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD&grua_id=xxx&pagina=1&limite=10
  ```

- [ ] Implementar queries SQL para:
  - **Horas trabalhadas:** Agregar horas de locações ativas no período
  - **Horas disponíveis:** Calcular baseado em dias úteis do período
  - **Horas ociosas:** Horas disponíveis - horas trabalhadas
  - **Taxa de utilização:** (horas trabalhadas / horas disponíveis) * 100
  - **Receita total:** Soma de valores de locações no período
  - **Custo operação:** Calcular baseado em custos de operação
  - **Custo manutenção:** Soma de custos de manutenção no período
  - **Lucro bruto:** Receita - custos totais
  - **Margem lucro:** (Lucro / Receita) * 100
  - **ROI:** Calcular baseado em investimento inicial e receita acumulada
  - **Obras visitadas:** Listar obras onde a grua esteve no período
  - **Comparativo período anterior:** Calcular métricas do período anterior e comparar

- [ ] Adicionar validações:
  - Validar formato de datas (YYYY-MM-DD)
  - Validar que data_inicio < data_fim
  - Validar que período não seja maior que 1 ano
  - Validar paginação (página >= 1, limite entre 1 e 100)

- [ ] Implementar paginação:
  - Parâmetros: `pagina` (padrão: 1), `limite` (padrão: 10, máximo: 100)
  - Retornar metadados de paginação na resposta

- [ ] Adicionar filtros opcionais:
  - `grua_id`: Filtrar por grua específica
  - `status`: Filtrar por status da grua
  - `tipo`: Filtrar por tipo de grua

- [ ] Registrar rota no `backend-api/src/server.js`:
  ```javascript
  const relatoriosRoutes = require('./routes/relatorios')
  app.use('/api/relatorios', authenticate, relatoriosRoutes)
  ```

- [ ] Adicionar tratamento de erros adequado
- [ ] Adicionar logs para debugging

### Frontend

- [ ] Criar ou atualizar `lib/api-relatorios.ts`:
  - Adicionar função para chamar `/api/relatorios/performance-gruas`
  - Manter interfaces TypeScript existentes
  - Adicionar tratamento de erros

- [ ] Atualizar componentes que usam o mock:
  - Substituir `gerarMockPerformanceGruas()` por chamada real à API
  - Ajustar loading states
  - Ajustar tratamento de erros
  - Manter estrutura de dados compatível

- [ ] Testar integração completa

### Banco de Dados

- [ ] Verificar se tabelas necessárias existem:
  - `gruas`
  - `obras`
  - `grua_obra` (ou tabela de locações)
  - `lancamentos_financeiros` (para receitas)
  - `custos_operacao` (se existir)
  - `manutencoes` (para custos de manutenção)

- [ ] Criar índices se necessário:
  ```sql
  CREATE INDEX idx_grua_obra_data_inicio ON grua_obra(data_inicio);
  CREATE INDEX idx_grua_obra_data_fim ON grua_obra(data_fim);
  CREATE INDEX idx_lancamentos_grua_data ON lancamentos_financeiros(grua_id, data);
  ```

- [ ] Verificar se há dados suficientes para testes

---

## 🔌 Endpoints Necessários

### GET
```
GET /api/relatorios/performance-gruas?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD&grua_id=xxx&pagina=1&limite=10
```

**Parâmetros:**
- `data_inicio` (obrigatório): Data inicial do período (YYYY-MM-DD)
- `data_fim` (obrigatório): Data final do período (YYYY-MM-DD)
- `grua_id` (opcional): ID da grua específica
- `pagina` (opcional): Número da página (padrão: 1)
- `limite` (opcional): Itens por página (padrão: 10, máximo: 100)

**Response:**
```typescript
{
  success: boolean;
  data: {
    periodo: {
      data_inicio: string;
      data_fim: string;
      dias_totais: number;
      dias_uteis: number;
    };
    resumo_geral: {
      total_gruas: number;
      total_horas_trabalhadas: number;
      total_horas_disponiveis: number;
      taxa_utilizacao_media: number;
      receita_total: number;
      custo_total: number;
      lucro_total: number;
      roi_medio: number;
    };
    performance_por_grua: GruaPerformance[];
    paginacao: {
      pagina_atual: number;
      total_paginas: number;
      total_registros: number;
      limite: number;
    };
  };
}
```

---

## 🗂️ Estrutura de Dados

### Request
```typescript
interface PerformanceGruasRequest {
  data_inicio: string; // YYYY-MM-DD
  data_fim: string; // YYYY-MM-DD
  grua_id?: string;
  pagina?: number;
  limite?: number;
}
```

### Response
```typescript
interface GruaPerformance {
  grua: {
    id: number;
    nome: string;
    modelo: string;
    fabricante: string;
    tipo: string;
    status: string;
    numero_serie?: string;
  };
  metricas: {
    horas_trabalhadas: number;
    horas_disponiveis: number;
    horas_ociosas: number;
    taxa_utilizacao: number;
    dias_em_operacao: number;
    dias_total_periodo: number;
  };
  financeiro: {
    receita_total: number;
    custo_operacao: number;
    custo_manutencao: number;
    custo_total: number;
    lucro_bruto: number;
    margem_lucro: number;
    receita_por_hora: number;
    custo_por_hora: number;
    lucro_por_hora: number;
  };
  roi: {
    investimento_inicial: number;
    receita_acumulada: number;
    custo_acumulado: number;
    roi_percentual: number;
    tempo_retorno_meses: number;
  };
  obras: {
    total_obras: number;
    obras_visitadas: Array<{
      obra_id: number;
      obra_nome: string;
      dias_permanencia: number;
      receita_gerada: number;
    }>;
  };
  comparativo_periodo_anterior?: {
    horas_trabalhadas_variacao: number;
    receita_variacao: number;
    utilizacao_variacao: number;
  };
}

interface PerformanceGruasResponse {
  periodo: {
    data_inicio: string;
    data_fim: string;
    dias_totais: number;
    dias_uteis: number;
  };
  resumo_geral: {
    total_gruas: number;
    total_horas_trabalhadas: number;
    total_horas_disponiveis: number;
    taxa_utilizacao_media: number;
    receita_total: number;
    custo_total: number;
    lucro_total: number;
    roi_medio: number;
  };
  performance_por_grua: GruaPerformance[];
  paginacao: {
    pagina_atual: number;
    total_paginas: number;
    total_registros: number;
    limite: number;
  };
}
```

---

## ✅ Critérios de Aceitação

- [ ] Endpoint `/api/relatorios/performance-gruas` criado e funcionando
- [ ] Queries SQL calculam métricas corretamente
- [ ] Horas trabalhadas calculadas baseadas em locações reais
- [ ] Receitas calculadas baseadas em lançamentos financeiros reais
- [ ] Custos calculados corretamente (operação + manutenção)
- [ ] ROI calculado corretamente
- [ ] Comparativo com período anterior funcionando
- [ ] Paginação implementada e funcionando
- [ ] Filtros opcionais funcionando
- [ ] Validações de entrada implementadas
- [ ] Tratamento de erros implementado
- [ ] Frontend integrado e funcionando
- [ ] Mock removido após confirmação
- [ ] Testes de integração passando
- [ ] Performance aceitável (resposta em < 3 segundos)
- [ ] Documentação atualizada

---

## 🧪 Casos de Teste

### Teste 1: Performance Geral
**Dado:** Período de 1 mês com múltiplas gruas e locações  
**Quando:** Buscar performance geral  
**Então:** Deve retornar resumo geral e lista de todas as gruas com métricas corretas

### Teste 2: Performance por Grua
**Dado:** Período específico e ID de grua  
**Quando:** Buscar performance filtrando por grua  
**Então:** Deve retornar apenas a grua especificada com métricas corretas

### Teste 3: Cálculo de Horas
**Dado:** Grua com locações no período  
**Quando:** Calcular horas trabalhadas  
**Então:** Deve somar corretamente as horas de todas as locações ativas no período

### Teste 4: Cálculo Financeiro
**Dado:** Grua com receitas e custos no período  
**Quando:** Calcular métricas financeiras  
**Então:** Deve calcular receita, custos, lucro e margem corretamente

### Teste 5: ROI
**Dado:** Grua com investimento inicial e receitas acumuladas  
**Quando:** Calcular ROI  
**Então:** Deve calcular ROI percentual e tempo de retorno corretamente

### Teste 6: Comparativo Período Anterior
**Dado:** Período atual e período anterior com dados  
**Quando:** Buscar performance com comparativo  
**Então:** Deve calcular variações entre períodos corretamente

### Teste 7: Paginação
**Dado:** Múltiplas gruas (mais de 10)  
**Quando:** Buscar com paginação (limite=10, página=2)  
**Então:** Deve retornar apenas as gruas da página 2 e metadados corretos

---

## 🔗 Dependências

### Bloqueada por:
- Nenhuma (pode ser executada independentemente)

### Bloqueia:
- Nenhuma (pode ser executada em paralelo)

### Relacionada com:
- TASK-009 - Adicionar índices no banco (pode melhorar performance das queries)
- TASK-010 - Implementar paginação (esta task já implementa paginação específica)

---

## 📚 Referências

- `RELATORIO-AUDITORIA-COMPLETA-2025-02-02.md` - Seção "1.1 Mocks Críticos - Performance de Gruas"
- `lib/mocks/performance-gruas-mocks.ts` - Estrutura de dados esperada
- `backend-api/src/routes/` - Exemplos de outras rotas

---

## 💡 Notas Técnicas

1. **Performance de Queries:** As queries podem ser complexas. Considerar:
   - Usar índices nas colunas de data
   - Usar CTEs (Common Table Expressions) para organizar queries
   - Considerar cache para relatórios (implementar depois)

2. **Cálculo de Horas:** Definir se horas são:
   - Horas de calendário (24h por dia)
   - Horas úteis (8h por dia útil)
   - Horas de operação real (baseado em registros)

3. **Investimento Inicial:** Pode estar em tabela de gruas ou precisa ser calculado de outra forma. Verificar estrutura do banco.

4. **Custos:** Verificar onde estão armazenados:
   - Custo de operação (pode ser fixo por grua ou variável)
   - Custo de manutenção (tabela de manutenções)

5. **Dias Úteis:** Calcular considerando:
   - Finais de semana
   - Feriados (se houver tabela)
   - Ou usar aproximação (70% dos dias)

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Queries muito lentas com muitos dados
  - **Mitigação:** Adicionar índices, otimizar queries, considerar cache

- **Risco 2:** Dados inconsistentes no banco
  - **Mitigação:** Validar dados antes de calcular, tratar casos edge

- **Risco 3:** Cálculos complexos podem ter bugs
  - **Mitigação:** Testar extensivamente, comparar com mock inicialmente

- **Risco 4:** Período muito grande pode gerar timeout
  - **Mitigação:** Limitar período máximo (ex: 1 ano), adicionar paginação

---

## 📊 Estimativas

**Tempo Estimado:** 3-5 dias  
**Complexidade:** Alta  
**Esforço:** Grande

**Breakdown:**
- Análise de estrutura de dados: 4 horas
- Criação de queries SQL: 8-12 horas
- Implementação do endpoint: 4-6 horas
- Validações e tratamento de erros: 2-3 horas
- Integração frontend: 2-3 horas
- Testes e correções: 4-6 horas
- Otimizações: 2-4 horas

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

