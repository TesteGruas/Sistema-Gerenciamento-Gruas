# 📋 TASK-002: Endpoint e Frontend de Performance de Gruas

**ID da Task:** TASK-002  
**Título:** Implementar Endpoint de Relatórios de Performance de Gruas e Integrar no Frontend  
**Fase:** 2  
**Módulo:** Relatórios  
**Arquivo(s):** 
- `backend-api/src/routes/relatorios-performance-gruas.js`
- `backend-api/src/server.js`
- `lib/api-relatorios-performance.ts`
- `app/dashboard/relatorios/page.tsx`

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🔴 CRÍTICA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Implementar endpoint completo de relatórios de performance de gruas com:
1. **Backend:** Criar rota `/api/relatorios/performance-gruas` com queries SQL complexas para calcular métricas (horas trabalhadas, receitas, custos, ROI, comparativos)
2. **Frontend:** Remover mock de `lib/api-relatorios-performance.ts` e garantir que a página de relatórios exiba dados reais

O frontend já está estruturado para chamar a API real, mas o endpoint não existe no backend.

---

## 🎯 Objetivos

- [ ] Criar rota `GET /api/relatorios/performance-gruas` no backend
- [ ] Implementar queries SQL para agregar horas trabalhadas por grua
- [ ] Implementar queries SQL para calcular receitas acumuladas por grua
- [ ] Implementar queries SQL para calcular custos operacionais por grua
- [ ] Implementar cálculo de ROI (Return on Investment)
- [ ] Implementar comparativo com período anterior
- [ ] Registrar rota no `server.js`
- [ ] Validar parâmetros de entrada (datas, obra_id, grua_id)
- [ ] Verificar e ajustar integração no frontend
- [ ] Testar relatórios com dados reais

---

## 📋 Situação Atual

### Dados Mockados

O arquivo `lib/api-relatorios-performance.ts` **não possui mocks**, mas está tentando chamar um endpoint que não existe:
- `GET /api/relatorios/performance-gruas` - Não existe no backend

### Integrações Existentes

- ✅ Frontend API client já está estruturado em `lib/api-relatorios-performance.ts`
- ✅ Interface `PerformanceGruasFiltros` já definida
- ✅ Funções de exportação (PDF, Excel, CSV) já implementadas no frontend
- ✅ Página de relatórios (`app/dashboard/relatorios/page.tsx`) já usa `performanceGruasApi`
- ❌ Backend não possui rota de performance de gruas
- ❌ Queries SQL complexas não implementadas

---

## 🔧 Ações Necessárias

### Backend

- [ ] Criar arquivo `backend-api/src/routes/relatorios-performance-gruas.js`
- [ ] Implementar rota `GET /api/relatorios/performance-gruas` com query parameters:
  - `data_inicio` (obrigatório): Data inicial do período
  - `data_fim` (obrigatório): Data final do período
  - `obra_id` (opcional): Filtrar por obra específica
  - `grua_id` (opcional): Filtrar por grua específica
- [ ] Implementar query de horas trabalhadas por grua:
  ```sql
  SELECT grua_id, SUM(horas_trabalhadas) as total_horas
  FROM medicoes_mensais
  WHERE data_medicao BETWEEN :data_inicio AND :data_fim
  GROUP BY grua_id
  ```
- [ ] Implementar query de receitas acumuladas:
  ```sql
  SELECT grua_id, SUM(valor_total) as total_receitas
  FROM locacoes l
  JOIN obra_gruas og ON l.obra_id = og.obra_id
  WHERE l.data_inicio <= :data_fim AND l.data_fim >= :data_inicio
  GROUP BY grua_id
  ```
- [ ] Implementar query de custos operacionais:
  ```sql
  SELECT grua_id, SUM(valor) as total_custos
  FROM custos_mensais
  WHERE mes BETWEEN :data_inicio AND :data_fim
  GROUP BY grua_id
  ```
- [ ] Implementar cálculo de ROI: `(Receitas - Custos) / Custos * 100`
- [ ] Implementar comparativo com período anterior:
  - Calcular métricas do período anterior (mesmo intervalo de dias, mas no período anterior)
  - Calcular variação percentual para cada métrica
- [ ] Combinar todas as queries em uma resposta estruturada
- [ ] Validar parâmetros de entrada (datas válidas, formato correto)
- [ ] Registrar rota no `backend-api/src/server.js`:
  ```javascript
  const relatoriosPerformanceRoutes = require('./routes/relatorios-performance-gruas')
  app.use('/api/relatorios/performance-gruas', authenticate, relatoriosPerformanceRoutes)
  ```
- [ ] Criar índices para melhorar performance das queries:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_medicoes_data ON medicoes_mensais(data_medicao);
  CREATE INDEX IF NOT EXISTS idx_locacoes_data ON locacoes(data_inicio, data_fim);
  CREATE INDEX IF NOT EXISTS idx_custos_mes ON custos_mensais(mes);
  ```

### Frontend

- [ ] Verificar se `lib/api-relatorios-performance.ts` está correto (já parece estar estruturado)
- [ ] Testar integração em `app/dashboard/relatorios/page.tsx`
- [ ] Validar parâmetros de período, obra e grua no frontend
- [ ] Adicionar validação de datas (data_inicio < data_fim)
- [ ] Adicionar tratamento de erros adequado
- [ ] Adicionar loading states
- [ ] Garantir que gráficos e tabelas exibam dados reais

### Banco de Dados

- [ ] Verificar se índices necessários existem
- [ ] Criar índices se não existirem (ver seção Backend acima)
- [ ] Verificar se tabelas necessárias existem:
  - `medicoes_mensais`
  - `locacoes`
  - `obra_gruas`
  - `custos_mensais`

---

## 🔌 Endpoints Necessários

### GET
```
GET /api/relatorios/performance-gruas?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD&obra_id={id}&grua_id={id}
```

**Query Parameters:**
- `data_inicio` (obrigatório): Data inicial no formato YYYY-MM-DD
- `data_fim` (obrigatório): Data final no formato YYYY-MM-DD
- `obra_id` (opcional): ID da obra para filtrar
- `grua_id` (opcional): ID da grua para filtrar

**Response:**
```json
{
  "data": [
    {
      "grua_id": "uuid",
      "grua_nome": "string",
      "periodo": {
        "inicio": "YYYY-MM-DD",
        "fim": "YYYY-MM-DD"
      },
      "metricas": {
        "horas_trabalhadas": 0,
        "receitas": 0,
        "custos": 0,
        "lucro": 0,
        "roi": 0
      },
      "comparativo": {
        "periodo_anterior": {
          "horas_trabalhadas": 0,
          "receitas": 0,
          "custos": 0,
          "lucro": 0,
          "roi": 0
        },
        "variacao_percentual": {
          "horas_trabalhadas": 0,
          "receitas": 0,
          "custos": 0,
          "lucro": 0,
          "roi": 0
        }
      }
    }
  ],
  "total": 0,
  "periodo": {
    "inicio": "YYYY-MM-DD",
    "fim": "YYYY-MM-DD"
  }
}
```

---

## 🗂️ Estrutura de Dados

### Request (Query Parameters)
```typescript
interface PerformanceGruasFiltros {
  data_inicio: string; // YYYY-MM-DD
  data_fim: string; // YYYY-MM-DD
  obra_id?: number;
  grua_id?: number;
}
```

### Response
```typescript
interface PerformanceGruasResponse {
  data: PerformanceGrua[];
  total: number;
  periodo: {
    inicio: string;
    fim: string;
  };
}

interface PerformanceGrua {
  grua_id: string;
  grua_nome: string;
  periodo: {
    inicio: string;
    fim: string;
  };
  metricas: {
    horas_trabalhadas: number;
    receitas: number;
    custos: number;
    lucro: number;
    roi: number; // percentual
  };
  comparativo: {
    periodo_anterior: {
      horas_trabalhadas: number;
      receitas: number;
      custos: number;
      lucro: number;
      roi: number;
    };
    variacao_percentual: {
      horas_trabalhadas: number;
      receitas: number;
      custos: number;
      lucro: number;
      roi: number;
    };
  };
}
```

---

## ✅ Critérios de Aceitação

- [ ] Endpoint `/api/relatorios/performance-gruas` implementado e funcionando
- [ ] Query de horas trabalhadas retorna valores corretos
- [ ] Query de receitas retorna valores corretos
- [ ] Query de custos retorna valores corretos
- [ ] Cálculo de ROI implementado corretamente
- [ ] Comparativo com período anterior funcionando
- [ ] Filtros por obra_id e grua_id funcionando
- [ ] Validação de parâmetros implementada
- [ ] Rota registrada no `server.js`
- [ ] Frontend integrado e exibindo dados reais
- [ ] Gráficos e tabelas atualizados com dados reais
- [ ] Tratamento de erros implementado
- [ ] Loading states funcionando
- [ ] Testes de integração passando

---

## 🧪 Casos de Teste

### Teste 1: Relatório Básico
**Dado:** Período de datas válido  
**Quando:** Buscar relatório de performance sem filtros  
**Então:** Deve retornar métricas de todas as gruas no período

### Teste 2: Filtro por Obra
**Dado:** Uma obra específica  
**Quando:** Buscar relatório filtrando por `obra_id`  
**Então:** Deve retornar apenas métricas de gruas daquela obra

### Teste 3: Filtro por Grua
**Dado:** Uma grua específica  
**Quando:** Buscar relatório filtrando por `grua_id`  
**Então:** Deve retornar apenas métricas daquela grua

### Teste 4: Cálculo de ROI
**Dado:** Uma grua com receitas e custos conhecidos  
**Quando:** Calcular ROI  
**Então:** O ROI deve ser calculado corretamente: `(receitas - custos) / custos * 100`

### Teste 5: Comparativo Período Anterior
**Dado:** Um período de datas  
**Quando:** Buscar relatório com comparativo  
**Então:** Deve calcular métricas do período anterior e variação percentual

### Teste 6: Validação de Datas
**Dado:** Data inicial maior que data final  
**Quando:** Buscar relatório  
**Então:** Deve retornar erro de validação

### Teste 7: Período sem Dados
**Dado:** Um período sem medições, locações ou custos  
**Quando:** Buscar relatório  
**Então:** Deve retornar métricas zeradas, não erro

---

## 🔗 Dependências

### Bloqueada por:
- Nenhuma (pode ser executada em paralelo com TASK-001)

### Bloqueia:
- [ ] TASK-006 - Testes e Validação Final (depende desta task)

### Relacionada com:
- [ ] TASK-005 - Ajustes Gerais Backend (registrar rota no server.js, criar índices)

---

## 📚 Referências

- `RELATORIO-DIVISAO-DEMANDAS-FRONTEND-BACKEND.md` - Seção "🔴 2. Endpoint de Performance de Gruas"
- `RELATORIO-INTEGRACAO-FRONTEND-BACKEND-2025-02-02.md` - Seção "🔟 MÓDULO: RELATÓRIOS"
- `lib/api-relatorios-performance.ts` - API client existente no frontend

---

## 💡 Notas Técnicas

1. **JOINs Necessários:** As queries precisarão fazer JOINs entre:
   - `medicoes_mensais` / `medicoes`
   - `custos_mensais` / `custos`
   - `receitas`
   - `locacoes`
   - `obra` / `grua` / `obra_gruas`

2. **Performance:** Queries complexas podem ser lentas. Considerar:
   - Criar índices adequados
   - Implementar cache se necessário
   - Otimizar queries com EXPLAIN ANALYZE

3. **Cálculo de Período Anterior:** Para calcular o período anterior:
   - Calcular duração do período atual: `dias = data_fim - data_inicio`
   - Período anterior: `data_inicio_anterior = data_inicio - dias`, `data_fim_anterior = data_inicio - 1`

4. **Divisão por Zero:** Cuidado com divisão por zero no cálculo de ROI quando custos = 0

5. **Agregação:** Pode ser necessário agrupar por mês para histórico mensal comparativo

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Queries SQL complexas podem ser lentas com muitos dados
  - **Mitigação:** Criar índices adequados, considerar paginação ou cache

- **Risco 2:** Dados inconsistentes entre tabelas (medições, locações, custos)
  - **Mitigação:** Validar integridade dos dados, tratar casos onde dados podem estar faltando

- **Risco 3:** Cálculo de período anterior pode ser complexo
  - **Mitigação:** Testar cuidadosamente com diferentes períodos

- **Risco 4:** Performance em produção com muitos dados históricos
  - **Mitigação:** Implementar cache, considerar materialized views ou tabelas de agregação

---

## 📊 Estimativas

**Tempo Estimado:** 2-3 dias (backend) + 1-2 dias (frontend)  
**Complexidade:** Alta  
**Esforço:** Grande

**Breakdown:**
- Queries SQL complexas: 6-8 horas
- Cálculo de ROI e comparativos: 4-6 horas
- Validações e tratamento de erros: 2-3 horas
- Integração frontend: 4-6 horas
- Testes e ajustes: 4-6 horas
- Otimização de performance: 2-4 horas

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

