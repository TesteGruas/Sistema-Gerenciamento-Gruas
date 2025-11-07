# 📊 Especificação Técnica - Relatório de Performance de Gruas (Frontend)

## 📋 Visão Geral

Este documento descreve a implementação do **Relatório de Performance de Gruas** no frontend, incluindo componentes, estrutura de dados, mocks e integração com a API.

---

## 🎯 Objetivo

Fornecer uma análise detalhada da performance operacional e financeira de cada grua, permitindo identificar:
- Gruas mais/menos rentáveis
- Horas trabalhadas vs horas disponíveis
- Custo por hora de operação
- Receita por hora de operação
- ROI (Retorno sobre Investimento)
- Comparativos entre períodos

---

## 📁 Estrutura de Arquivos

```
app/dashboard/relatorios/
  └── performance-gruas/
      └── page.tsx                    # Página principal do relatório

components/
  └── relatorios/
      ├── performance-gruas-filtros.tsx      # Componente de filtros
      ├── performance-gruas-tabela.tsx        # Tabela de resultados
      ├── performance-gruas-graficos.tsx     # Gráficos de análise
      └── performance-gruas-resumo.tsx       # Cards de resumo

lib/
  ├── api-relatorios-performance.ts          # API client
  └── mocks/
      └── performance-gruas-mocks.ts          # Dados mockados
```

---

## 🔌 Interface da API

### Endpoint Principal
```
GET /api/relatorios/performance-gruas
```

### Parâmetros de Query
```typescript
{
  data_inicio?: string          // YYYY-MM-DD
  data_fim?: string            // YYYY-MM-DD
  grua_id?: number             // ID específico da grua
  obra_id?: number             // Filtrar por obra
  agrupar_por?: 'grua' | 'obra' | 'mes'
  incluir_projecao?: boolean   // Incluir projeções futuras
  limite?: number              // Paginação
  pagina?: number              // Paginação
}
```

### Resposta da API
```typescript
{
  success: boolean
  data: {
    periodo: {
      data_inicio: string
      data_fim: string
      dias_totais: number
      dias_uteis: number
    }
    resumo_geral: {
      total_gruas: number
      total_horas_trabalhadas: number
      total_horas_disponiveis: number
      taxa_utilizacao_media: number
      receita_total: number
      custo_total: number
      lucro_total: number
      roi_medio: number
    }
    performance_por_grua: Array<{
      grua: {
        id: number
        nome: string
        modelo: string
        fabricante: string
        tipo: string
        status: string
      }
      metricas: {
        horas_trabalhadas: number
        horas_disponiveis: number
        horas_ociosas: number
        taxa_utilizacao: number
        dias_em_operacao: number
        dias_total_periodo: number
      }
      financeiro: {
        receita_total: number
        custo_operacao: number
        custo_manutencao: number
        custo_total: number
        lucro_bruto: number
        margem_lucro: number
        receita_por_hora: number
        custo_por_hora: number
        lucro_por_hora: number
      }
      roi: {
        investimento_inicial: number
        receita_acumulada: number
        custo_acumulado: number
        roi_percentual: number
        tempo_retorno_meses: number
      }
      obras: {
        total_obras: number
        obras_visitadas: Array<{
          obra_id: number
          obra_nome: string
          dias_permanencia: number
          receita_gerada: number
        }>
      }
      comparativo_periodo_anterior?: {
        horas_trabalhadas_variacao: number
        receita_variacao: number
        utilizacao_variacao: number
      }
    }>
    paginacao?: {
      pagina_atual: number
      total_paginas: number
      total_registros: number
      limite: number
    }
  }
  ultima_atualizacao: string
}
```

---

## 🎨 Componentes Frontend

### 1. Página Principal (`page.tsx`)

**Responsabilidades:**
- Gerenciar estado global do relatório
- Coordenar carregamento de dados
- Layout principal com tabs

**Estrutura:**
```tsx
- Header com título e ações
- Filtros (componente separado)
- Tabs:
  - Resumo Geral
  - Performance Detalhada
  - Análise Comparativa
  - Gráficos
```

### 2. Componente de Filtros (`performance-gruas-filtros.tsx`)

**Campos:**
- Período (data início/fim ou presets)
- Grua específica (opcional)
- Obra específica (opcional)
- Agrupamento (por grua, obra, mês)
- Incluir projeções (checkbox)

**Presets de Período:**
- Última semana
- Último mês
- Último trimestre
- Último semestre
- Último ano
- Personalizado

### 3. Componente de Resumo (`performance-gruas-resumo.tsx`)

**Cards de Métricas:**
- Total de Gruas Analisadas
- Taxa de Utilização Média
- Receita Total
- Custo Total
- Lucro Total
- ROI Médio
- Horas Trabalhadas Totais

### 4. Componente de Tabela (`performance-gruas-tabela.tsx`)

**Colunas:**
- Grua (nome, modelo, fabricante)
- Status
- Horas Trabalhadas
- Taxa de Utilização (%)
- Receita Total
- Custo Total
- Lucro Bruto
- Margem de Lucro (%)
- ROI (%)
- Receita por Hora
- Ações (ver detalhes, exportar)

**Ordenação:**
- Por qualquer coluna
- Ascendente/Descendente

**Paginação:**
- Controles de navegação
- Itens por página (10, 25, 50, 100)

### 5. Componente de Gráficos (`performance-gruas-graficos.tsx`)

**Gráficos:**
1. **Taxa de Utilização por Grua** (Barras horizontais)
2. **Receita vs Custo por Grua** (Barras agrupadas)
3. **ROI por Grua** (Barras)
4. **Distribuição de Horas** (Pizza: Trabalhadas vs Ociosas)
5. **Evolução Temporal** (Linha: Receita/Custo ao longo do tempo)
6. **Top 10 Gruas por Lucro** (Barras)

---

## 📊 Estrutura de Dados Mockados

### Mock de Resumo Geral
```typescript
{
  total_gruas: 15,
  total_horas_trabalhadas: 12450,
  total_horas_disponiveis: 18000,
  taxa_utilizacao_media: 69.2,
  receita_total: 1250000,
  custo_total: 850000,
  lucro_total: 400000,
  roi_medio: 47.1
}
```

### Mock de Performance por Grua
```typescript
[
  {
    grua: {
      id: 1,
      nome: "Grua 01",
      modelo: "GT-550",
      fabricante: "Liebherr",
      tipo: "Torre",
      status: "Operacional"
    },
    metricas: {
      horas_trabalhadas: 850,
      horas_disponiveis: 1200,
      horas_ociosas: 350,
      taxa_utilizacao: 70.8,
      dias_em_operacao: 35,
      dias_total_periodo: 60
    },
    financeiro: {
      receita_total: 85000,
      custo_operacao: 45000,
      custo_manutencao: 12000,
      custo_total: 57000,
      lucro_bruto: 28000,
      margem_lucro: 32.9,
      receita_por_hora: 100,
      custo_por_hora: 67.1,
      lucro_por_hora: 32.9
    },
    roi: {
      investimento_inicial: 500000,
      receita_acumulada: 85000,
      custo_acumulado: 57000,
      roi_percentual: 5.6,
      tempo_retorno_meses: 18
    },
    obras: {
      total_obras: 3,
      obras_visitadas: [
        {
          obra_id: 1,
          obra_nome: "Edifício Residencial Centro",
          dias_permanencia: 20,
          receita_gerada: 50000
        }
      ]
    }
  }
]
```

---

## 🎯 Funcionalidades

### Filtros e Busca
- ✅ Filtro por período (presets e personalizado)
- ✅ Filtro por grua específica
- ✅ Filtro por obra
- ✅ Agrupamento de resultados
- ✅ Busca por nome/modelo de grua

### Visualização
- ✅ Tabela ordenável e paginável
- ✅ Cards de resumo com métricas principais
- ✅ Gráficos interativos (Recharts)
- ✅ Comparativo com período anterior
- ✅ Indicadores visuais (cores, badges)

### Exportação
- ✅ Exportar para PDF
- ✅ Exportar para Excel
- ✅ Exportar para CSV
- ✅ Imprimir relatório

### Detalhamento
- ✅ Modal/dialog com detalhes da grua
- ✅ Histórico de obras
- ✅ Gráfico de evolução temporal
- ✅ Breakdown de custos

---

## 🎨 Design e UX

### Cores e Indicadores
- **Taxa de Utilização:**
  - Verde: ≥ 80%
  - Amarelo: 60-79%
  - Vermelho: < 60%

- **ROI:**
  - Verde: ≥ 50%
  - Amarelo: 20-49%
  - Vermelho: < 20%

- **Margem de Lucro:**
  - Verde: ≥ 30%
  - Amarelo: 15-29%
  - Vermelho: < 15%

### Responsividade
- Layout adaptável para mobile
- Tabela com scroll horizontal em telas pequenas
- Gráficos responsivos

---

## 🔄 Fluxo de Dados

1. **Carregamento Inicial:**
   - Carrega dados mockados se API não disponível
   - Mostra loading state
   - Exibe dados ou erro

2. **Aplicação de Filtros:**
   - Atualiza parâmetros
   - Recarrega dados (ou filtra localmente se mock)
   - Atualiza gráficos e tabela

3. **Exportação:**
   - Gera arquivo com dados filtrados
   - Formato selecionado pelo usuário
   - Download automático

---

## 📝 Notas de Implementação

- Usar `useState` e `useEffect` para gerenciar estado
- Implementar debounce em filtros de busca
- Cache de dados para melhor performance
- Tratamento de erros com toast notifications
- Loading states em todas as operações assíncronas
- Validação de filtros antes de requisições

---

## 🧪 Dados Mockados

Os dados mockados devem ser realistas e incluir:
- 10-15 gruas diferentes
- Vários status (Operacional, Manutenção, Disponível)
- Diferentes taxas de utilização
- Variação de receitas e custos
- Múltiplas obras por grua
- Dados históricos para comparação

---

## ✅ Checklist de Implementação

- [ ] Criar estrutura de pastas
- [ ] Implementar API client
- [ ] Criar dados mockados
- [ ] Implementar componente de filtros
- [ ] Implementar componente de resumo
- [ ] Implementar componente de tabela
- [ ] Implementar componente de gráficos
- [ ] Criar página principal
- [ ] Adicionar exportação (PDF/Excel/CSV)
- [ ] Implementar modal de detalhes
- [ ] Adicionar tratamento de erros
- [ ] Testar responsividade
- [ ] Adicionar loading states
- [ ] Integrar com sistema de permissões

