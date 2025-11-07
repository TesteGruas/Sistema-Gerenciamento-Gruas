# 🔧 Especificação Técnica - Relatório de Performance de Gruas (Backend)

## 📋 Visão Geral

Este documento descreve a implementação do endpoint de API para o **Relatório de Performance de Gruas** no backend, incluindo estrutura de dados, queries SQL, validações e tratamento de erros.

---

## 🎯 Objetivo

Fornecer dados consolidados sobre a performance operacional e financeira de gruas, calculando métricas como:
- Horas trabalhadas vs disponíveis
- Taxa de utilização
- Receita e custos por grua
- ROI (Retorno sobre Investimento)
- Comparativos temporais

---

## 🔌 Endpoint da API

### Rota Principal
```
GET /api/relatorios/performance-gruas
```

### Método
`GET`

### Autenticação
Requer token JWT válido

### Permissões
- `relatorios:visualizar` (mínimo)
- `gruas:visualizar` (recomendado)

---

## 📥 Parâmetros de Query

| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo |
|-----------|------|-------------|-----------|---------|
| `data_inicio` | string | Não | Data inicial (YYYY-MM-DD) | `2024-01-01` |
| `data_fim` | string | Não | Data final (YYYY-MM-DD) | `2024-12-31` |
| `grua_id` | number | Não | ID específico da grua | `1` |
| `obra_id` | number | Não | Filtrar por obra específica | `5` |
| `agrupar_por` | string | Não | Agrupamento: `grua`, `obra`, `mes` | `grua` |
| `incluir_projecao` | boolean | Não | Incluir projeções futuras | `true` |
| `limite` | number | Não | Itens por página (padrão: 50) | `25` |
| `pagina` | number | Não | Página atual (padrão: 1) | `1` |
| `ordenar_por` | string | Não | Campo de ordenação | `taxa_utilizacao` |
| `ordem` | string | Não | `asc` ou `desc` (padrão: `desc`) | `desc` |

### Valores Padrão
- `data_inicio`: Primeiro dia do mês atual
- `data_fim`: Último dia do mês atual
- `agrupar_por`: `grua`
- `incluir_projecao`: `false`
- `limite`: `50`
- `pagina`: `1`
- `ordenar_por`: `taxa_utilizacao`
- `ordem`: `desc`

---

## 📤 Estrutura de Resposta

### Sucesso (200 OK)
```json
{
  "success": true,
  "data": {
    "periodo": {
      "data_inicio": "2024-01-01",
      "data_fim": "2024-12-31",
      "dias_totais": 365,
      "dias_uteis": 252
    },
    "resumo_geral": {
      "total_gruas": 15,
      "total_horas_trabalhadas": 12450,
      "total_horas_disponiveis": 18000,
      "taxa_utilizacao_media": 69.2,
      "receita_total": 1250000.00,
      "custo_total": 850000.00,
      "lucro_total": 400000.00,
      "roi_medio": 47.1
    },
    "performance_por_grua": [
      {
        "grua": {
          "id": 1,
          "nome": "Grua 01",
          "modelo": "GT-550",
          "fabricante": "Liebherr",
          "tipo": "Torre",
          "status": "Operacional",
          "numero_serie": "LR-2020-001"
        },
        "metricas": {
          "horas_trabalhadas": 850,
          "horas_disponiveis": 1200,
          "horas_ociosas": 350,
          "taxa_utilizacao": 70.8,
          "dias_em_operacao": 35,
          "dias_total_periodo": 60
        },
        "financeiro": {
          "receita_total": 85000.00,
          "custo_operacao": 45000.00,
          "custo_manutencao": 12000.00,
          "custo_total": 57000.00,
          "lucro_bruto": 28000.00,
          "margem_lucro": 32.9,
          "receita_por_hora": 100.00,
          "custo_por_hora": 67.1,
          "lucro_por_hora": 32.9
        },
        "roi": {
          "investimento_inicial": 500000.00,
          "receita_acumulada": 85000.00,
          "custo_acumulado": 57000.00,
          "roi_percentual": 5.6,
          "tempo_retorno_meses": 18
        },
        "obras": {
          "total_obras": 3,
          "obras_visitadas": [
            {
              "obra_id": 1,
              "obra_nome": "Edifício Residencial Centro",
              "dias_permanencia": 20,
              "receita_gerada": 50000.00
            }
          ]
        },
        "comparativo_periodo_anterior": {
          "horas_trabalhadas_variacao": 5.2,
          "receita_variacao": 8.5,
          "utilizacao_variacao": 2.1
        }
      }
    ],
    "paginacao": {
      "pagina_atual": 1,
      "total_paginas": 3,
      "total_registros": 15,
      "limite": 50
    }
  },
  "ultima_atualizacao": "2024-12-15T10:30:00Z"
}
```

### Erro (400/401/403/500)
```json
{
  "success": false,
  "message": "Mensagem de erro descritiva",
  "error": "Código do erro (opcional)"
}
```

---

## 🗄️ Queries SQL Necessárias

### 1. Obter Gruas com Informações Básicas
```sql
SELECT 
  g.id,
  g.nome,
  g.modelo,
  g.fabricante,
  g.tipo,
  g.status,
  g.numero_serie,
  g.valor_aquisicao as investimento_inicial
FROM gruas g
WHERE g.deleted_at IS NULL
  AND ($1::int IS NULL OR g.id = $1)
ORDER BY g.nome;
```

### 2. Calcular Horas Trabalhadas por Grua
```sql
SELECT 
  l.grua_id,
  SUM(EXTRACT(EPOCH FROM (COALESCE(l.data_fim, CURRENT_DATE) - l.data_inicio)) / 3600) as horas_trabalhadas,
  COUNT(DISTINCT l.obra_id) as total_obras
FROM locacoes l
WHERE l.data_inicio >= $1::date
  AND l.data_inicio <= $2::date
  AND ($3::int IS NULL OR l.grua_id = $3)
  AND ($4::int IS NULL OR l.obra_id = $4)
GROUP BY l.grua_id;
```

### 3. Calcular Receitas por Grua
```sql
SELECT 
  r.grua_id,
  SUM(r.valor) as receita_total
FROM receitas r
WHERE r.data_receita >= $1::date
  AND r.data_receita <= $2::date
  AND ($3::int IS NULL OR r.grua_id = $3)
  AND ($4::int IS NULL OR r.obra_id = $4)
GROUP BY r.grua_id;
```

### 4. Calcular Custos por Grua
```sql
SELECT 
  c.grua_id,
  SUM(CASE WHEN c.tipo = 'operacao' THEN c.valor ELSE 0 END) as custo_operacao,
  SUM(CASE WHEN c.tipo = 'manutencao' THEN c.valor ELSE 0 END) as custo_manutencao,
  SUM(c.valor) as custo_total
FROM custos c
WHERE c.data_custo >= $1::date
  AND c.data_custo <= $2::date
  AND ($3::int IS NULL OR c.grua_id = $3)
GROUP BY c.grua_id;
```

### 5. Obter Obras por Grua
```sql
SELECT 
  l.grua_id,
  l.obra_id,
  o.nome as obra_nome,
  COUNT(DISTINCT l.id) as locacoes,
  SUM(EXTRACT(EPOCH FROM (COALESCE(l.data_fim, CURRENT_DATE) - l.data_inicio)) / 86400) as dias_permanencia,
  COALESCE(SUM(r.valor), 0) as receita_gerada
FROM locacoes l
LEFT JOIN obras o ON o.id = l.obra_id
LEFT JOIN receitas r ON r.obra_id = l.obra_id AND r.grua_id = l.grua_id
WHERE l.data_inicio >= $1::date
  AND l.data_inicio <= $2::date
  AND ($3::int IS NULL OR l.grua_id = $3)
GROUP BY l.grua_id, l.obra_id, o.nome
ORDER BY l.grua_id, receita_gerada DESC;
```

### 6. Comparativo com Período Anterior
```sql
-- Calcular período anterior
WITH periodo_anterior AS (
  SELECT 
    $1::date - ($2::date - $1::date) as data_inicio_anterior,
    $1::date - INTERVAL '1 day' as data_fim_anterior
)
SELECT 
  l.grua_id,
  SUM(EXTRACT(EPOCH FROM (COALESCE(l.data_fim, CURRENT_DATE) - l.data_inicio)) / 3600) as horas_trabalhadas_anterior,
  COALESCE(SUM(r.valor), 0) as receita_anterior
FROM locacoes l
LEFT JOIN receitas r ON r.obra_id = l.obra_id AND r.grua_id = l.grua_id
CROSS JOIN periodo_anterior pa
WHERE l.data_inicio >= pa.data_inicio_anterior
  AND l.data_inicio <= pa.data_fim_anterior
  AND ($3::int IS NULL OR l.grua_id = $3)
GROUP BY l.grua_id;
```

---

## 🧮 Cálculos e Fórmulas

### Taxa de Utilização
```
taxa_utilizacao = (horas_trabalhadas / horas_disponiveis) * 100
```

### Horas Disponíveis
```
horas_disponiveis = dias_periodo * 24 horas
```

### Margem de Lucro
```
margem_lucro = (lucro_bruto / receita_total) * 100
```

### ROI (Retorno sobre Investimento)
```
roi_percentual = ((receita_acumulada - custo_acumulado) / investimento_inicial) * 100
```

### Tempo de Retorno
```
tempo_retorno_meses = investimento_inicial / (lucro_mensal_medio)
```

### Receita por Hora
```
receita_por_hora = receita_total / horas_trabalhadas
```

### Custo por Hora
```
custo_por_hora = custo_total / horas_trabalhadas
```

---

## ✅ Validações

### Validação de Parâmetros
1. **Datas:**
   - `data_inicio` deve ser anterior a `data_fim`
   - Formato: YYYY-MM-DD
   - Não pode ser futura (exceto se `incluir_projecao = true`)

2. **IDs:**
   - `grua_id` e `obra_id` devem existir no banco
   - Retornar erro 404 se não encontrado

3. **Paginação:**
   - `limite` entre 1 e 100
   - `pagina` >= 1

4. **Agrupamento:**
   - Valores válidos: `grua`, `obra`, `mes`

---

## 🔒 Segurança

### Autenticação
- Validar token JWT em todas as requisições
- Verificar expiração do token

### Autorização
- Verificar permissão `relatorios:visualizar`
- Filtrar dados baseado em permissões do usuário:
  - Se não tem `gruas:visualizar`, não mostrar dados de gruas
  - Se não tem `obras:visualizar`, não mostrar dados de obras

### Validação de Dados
- Sanitizar todos os inputs
- Validar tipos de dados
- Prevenir SQL injection

---

## 📊 Performance

### Otimizações
- Usar índices nas colunas:
  - `locacoes.grua_id`
  - `locacoes.obra_id`
  - `locacoes.data_inicio`
  - `receitas.data_receita`
  - `custos.data_custo`

- Cache de resultados:
  - Cache por 5 minutos para mesmas queries
  - Invalidar cache quando houver novas locações/receitas/custos

### Limites
- Máximo de 100 registros por página
- Timeout de 30 segundos para queries
- Limitar período máximo a 2 anos

---

## 🧪 Testes

### Casos de Teste
1. ✅ Requisição sem parâmetros (usar defaults)
2. ✅ Requisição com período personalizado
3. ✅ Requisição com filtro de grua
4. ✅ Requisição com filtro de obra
5. ✅ Requisição com paginação
6. ✅ Requisição com agrupamento
7. ✅ Validação de datas inválidas
8. ✅ Validação de IDs inexistentes
9. ✅ Teste de permissões
10. ✅ Teste de performance com muitos dados

---

## 📝 Estrutura do Arquivo Backend

```
backend-api/src/routes/
  └── relatorios-performance-gruas.js

backend-api/src/services/
  └── performance-gruas-service.js

backend-api/src/validators/
  └── performance-gruas-validator.js
```

---

## 🔄 Fluxo de Processamento

1. **Validação de Parâmetros**
   - Validar formato e valores
   - Aplicar defaults se necessário

2. **Verificação de Permissões**
   - Validar token JWT
   - Verificar permissões do usuário

3. **Cálculo de Período**
   - Determinar datas de início/fim
   - Calcular dias totais e úteis

4. **Busca de Dados**
   - Buscar gruas
   - Calcular horas trabalhadas
   - Calcular receitas
   - Calcular custos
   - Buscar obras relacionadas

5. **Cálculo de Métricas**
   - Taxa de utilização
   - ROI
   - Margens
   - Comparativos

6. **Agrupamento e Ordenação**
   - Aplicar agrupamento solicitado
   - Ordenar resultados

7. **Paginação**
   - Aplicar limite e offset
   - Calcular total de páginas

8. **Formatação de Resposta**
   - Estruturar dados conforme interface
   - Adicionar metadados

9. **Retorno**
   - Retornar JSON formatado
   - Incluir headers apropriados

---

## 🚨 Tratamento de Erros

### Erros Esperados
- **400 Bad Request:** Parâmetros inválidos
- **401 Unauthorized:** Token inválido/expirado
- **403 Forbidden:** Sem permissão
- **404 Not Found:** Grua/Obra não encontrada
- **500 Internal Server Error:** Erro no servidor

### Mensagens de Erro
```json
{
  "success": false,
  "message": "Data de início deve ser anterior à data de fim",
  "error": "INVALID_DATE_RANGE"
}
```

---

## 📈 Melhorias Futuras

- [ ] Cache Redis para resultados frequentes
- [ ] Agregação pré-calculada em tabela de resumo
- [ ] Suporte a exportação direta (PDF/Excel)
- [ ] Webhooks para notificações de métricas críticas
- [ ] API GraphQL para queries flexíveis
- [ ] Suporte a múltiplas moedas
- [ ] Cálculo de depreciação de equipamentos

