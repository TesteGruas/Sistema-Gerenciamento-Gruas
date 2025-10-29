# 🔍 RELATÓRIO DE INTEGRAÇÃO - MÓDULO FINANCEIRO E GRUAS

**Data:** 2025-01-XX  
**Status:** ⚠️ **PARCIALMENTE INTEGRADO** - Requer melhorias

---

## 📊 RESUMO EXECUTIVO

O módulo financeiro possui integração com as Gruas através de **relações indiretas** via obras, locações e medições. Entretanto, **NÃO HÁ vinculação direta** entre custos/receitas e gruas específicas, o que limita análises financeiras detalhadas por grua.

---

## ✅ INTEGRAÇÕES EXISTENTES

### 1. ✅ **RECEITAS GERADAS POR GRUAS (Via Locações e Medições)**

#### Como funciona atualmente:
- **Gruas → Obras → Locações → Medições → Receitas**

#### Fluxo de Integração:
```12:14:backend-api/src/routes/rentabilidade.js
  // Buscar receitas (locações) da grua
  const { data: receitas, error: receitasError } = await supabaseAdmin
    .from('receitas')
```

1. **Grua criada** (`gruas` table) → Armazena `valor_locacao`
2. **Obra criada com grua** → Cria registro em `grua_obra` com `valor_locacao_mensal`
3. **Locação criada** → Vincula `equipamento_id` (grua) através de `locacoes.equipamento_id`
4. **Medição criada** → Vincula `locacao_id` e armazena `valor_total` (receita real)
5. **Receitas** → Buscadas por `tipo = 'locacao'` mas **NÃO tem campo `grua_id` direto**

#### Código de Integração:
```94:107:backend-api/src/routes/rentabilidade.js
      // Buscar locações da grua
      const { data: locacoes, error: locacoesError } = await supabaseAdmin
        .from('locacoes')
        .select('id, valor_mensal, data_inicio, data_fim, status')
        .eq('equipamento_id', grua.id)
        .eq('tipo_equipamento', 'grua')
        .or(`and(data_inicio.gte.${data_inicio},data_inicio.lte.${data_fim}),and(data_fim.gte.${data_inicio},data_fim.lte.${data_fim})`);

      // Buscar medições (faturamento real das locações)
      const { data: medicoes, error: medicoesError } = await supabaseAdmin
        .from('medicoes')
        .select('valor_total, periodo')
        .in('locacao_id', locacoes?.map(l => l.id) || [])
        .eq('status', 'finalizada');
```

#### Status: ✅ **FUNCIONAL** mas indireto
- ✅ Receitas são calculadas via medições/locações
- ❌ **FALTA:** Campo `grua_id` direto na tabela `receitas`
- ❌ **FALTA:** Criação automática de receita quando grua é alocada

---

### 2. ⚠️ **CUSTOS DE GRUAS (Limitado)**

#### Como funciona atualmente:
- **Custos → Obras → (sem vínculo direto com Gruas)**

#### Fluxo Atual:
```87:92:backend-api/src/routes/rentabilidade.js
      // Buscar custos da grua (manutenção, operação, etc)
      const { data: custos, error: custosError } = await supabaseAdmin
        .from('custos')
        .select('valor, data_custo, tipo, descricao')
        .gte('data_custo', data_inicio)
        .lte('data_custo', data_fim);
```

#### Problema Identificado:
- ⚠️ **Custos são buscados por período, mas NÃO filtrados por grua**
- ⚠️ **Tabela `custos` tem `obra_id` mas NÃO tem `grua_id`**
- ⚠️ **Custos de manutenção específicos de grua não são vinculados diretamente**

#### Código Atual:
```9:18:backend-api/src/routes/custos.js
const custoSchema = Joi.object({
  obra_id: Joi.number().integer().positive().required(),
  tipo: Joi.string().valid('salario', 'material', 'servico', 'manutencao').required(),
  descricao: Joi.string().min(1).max(500).required(),
  valor: Joi.number().min(0).precision(2).required(),
  data_custo: Joi.date().iso().required(),
  funcionario_id: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('pendente', 'confirmado', 'cancelado').default('pendente'),
  observacoes: Joi.string().max(1000).allow('').optional()
})
```

#### Status: ⚠️ **PARCIALMENTE FUNCIONAL**
- ✅ Custos são registrados por obra
- ❌ **FALTA:** Campo `grua_id` na tabela `custos`
- ❌ **FALTA:** Identificação de custos específicos de gruas (manutenção, operação)

---

### 3. ✅ **ANÁLISE DE RENTABILIDADE POR GRUA**

#### Endpoint Implementado:
```44:206:backend-api/src/routes/rentabilidade.js
router.get('/gruas', authenticateToken, requirePermission('financeiro:visualizar'), async (req, res) => {
```

**Funcionalidades:**
- ✅ Calcula receitas via locações/medições
- ✅ Calcula custos (mas sem filtro por grua)
- ✅ Calcula lucro, ROI, margem de lucro
- ✅ Calcula taxa de utilização
- ✅ Retorna ranking de gruas por rentabilidade

#### Status: ✅ **FUNCIONAL** mas pode melhorar

---

### 4. ✅ **INTEGRAÇÃO COM RESUMO FINANCEIRO**

#### Dashboard Financeiro:
```332:350:backend-api/src/routes/financial-data.js
    // Locações (usar medições se disponíveis)
    const { data: medicoes } = await supabaseAdmin
      .from('medicoes')
      .select('valor_total, status')
      .gte('data_medicao', data_inicio)
      .lte('data_medicao', data_fim)
      .eq('status', 'finalizada');

    const totalMedicoes = medicoes?.reduce((sum, m) => sum + parseFloat(m.valor_total || 0), 0) || 0;

    // Locações sem medições
    const { data: locacoes } = await supabaseAdmin
      .from('locacoes')
      .select('valor_mensal, status, data_inicio')
      .gte('data_inicio', data_inicio)
      .lte('data_inicio', data_fim)
      .in('status', ['ativa', 'finalizada']);

    const totalLocacoes = totalMedicoes > 0 ? totalMedicoes : (locacoes?.reduce((sum, l) => sum + parseFloat(l.valor_mensal || 0), 0) || 0);
```

**Status:** ✅ Receitas de locações são incluídas no resumo financeiro

---

## ❌ LACUNAS IDENTIFICADAS

### 1. ❌ **FALTA: Campo `grua_id` na tabela `receitas`**
**Impacto:** Impossível rastrear receitas diretamente vinculadas a uma grua específica  
**Localização:** `backend-api/database/schema.sql` (ou migração relacionada)

### 2. ❌ **FALTA: Campo `grua_id` na tabela `custos`**
**Impacto:** Impossível rastrear custos específicos de cada grua  
**Localização:** `backend-api/src/routes/custos.js` (schema de validação)

### 3. ❌ **FALTA: Criação Automática de Receita ao Alocar Grua**
**Impacto:** Receitas não são criadas automaticamente quando uma grua é locada  
**Localização:** `backend-api/src/routes/obras.js` (criação de obra com grua)

### 4. ❌ **FALTA: Criação Automática de Custo ao Registrar Manutenção**
**Impacto:** Custos de manutenção não são criados automaticamente  
**Localização:** Sistema de manutenção de gruas

### 5. ⚠️ **CUSTOS BUSCADOS SEM FILTRO POR GRUA**
**Problema:** No cálculo de rentabilidade, custos são buscados sem filtrar por grua específica
```87:92:backend-api/src/routes/rentabilidade.js
      // Buscar custos da grua (manutenção, operação, etc)
      const { data: custos, error: custosError } = await supabaseAdmin
        .from('custos')
        .select('valor, data_custo, tipo, descricao')
        .gte('data_custo', data_inicio)
        .lte('data_custo', data_fim);
```
**Deveria ter:** Filtro por `obra_id` ou `grua_id` se existir

---

## 🔧 INTEGRAÇÕES ENCONTRADAS NO CÓDIGO

### Tabelas Relacionadas:
1. ✅ **`grua_obra`** - Vincula gruas a obras com `valor_locacao_mensal`
2. ✅ **`locacoes`** - Vincula `equipamento_id` (grua) e `valor_mensal`
3. ✅ **`medicoes`** - Faturamento real via `locacao_id` e `valor_total`
4. ✅ **`gruas_mensais`** - Registra `receita_gerada` e `custo_operacional`
5. ⚠️ **`receitas`** - Tem `obra_id` mas **NÃO tem `grua_id`**
6. ⚠️ **`custos`** - Tem `obra_id` mas **NÃO tem `grua_id`**

---

## 📋 AÇÕES RECOMENDADAS

### 🔴 **ALTA PRIORIDADE**

1. **Adicionar campo `grua_id` na tabela `receitas`**
   - Criar migração SQL
   - Atualizar schema de validação em `receitas.js`
   - Criar receita automaticamente ao finalizar medição

2. **Adicionar campo `grua_id` na tabela `custos`**
   - Criar migração SQL
   - Atualizar schema de validação em `custos.js`
   - Permitir vincular custos diretamente a gruas

3. **Corrigir busca de custos na análise de rentabilidade**
   - Filtrar custos por `obra_id` quando houver relação grua-obra
   - OU filtrar por `grua_id` quando o campo existir

### 🟡 **MÉDIA PRIORIDADE**

4. **Criar receita automática ao finalizar locação**
   - Hook/trigger ao finalizar medição
   - Criar registro em `receitas` com `tipo='locacao'` e `grua_id`

5. **Integrar custos de manutenção de gruas**
   - Quando registrar manutenção na grua, criar custo automaticamente
   - Vincular custo de manutenção diretamente à grua

### 🟢 **BAIXA PRIORIDADE**

6. **Melhorar relatório financeiro por grua**
   - Dashboard específico de finanças por grua
   - Gráfico de receitas vs custos por grua ao longo do tempo

---

## 📊 TABELA DE INTEGRAÇÃO ATUAL

| Módulo | Campo Financeiro | Integração | Status |
|--------|------------------|------------|--------|
| **Gruas** | Receitas (via locações) | `gruas → locacoes → medicoes → receitas` | ✅ Indireto |
| **Gruas** | Receitas (direto) | Campo `grua_id` em `receitas` | ❌ **FALTA** |
| **Gruas** | Custos (via obras) | `gruas → obras → custos` | ⚠️ Parcial |
| **Gruas** | Custos (direto) | Campo `grua_id` em `custos` | ❌ **FALTA** |
| **Gruas** | Rentabilidade | Análise consolidada | ✅ Funcional |
| **Gruas Mensais** | Receitas/Custos | `receita_gerada`, `custo_operacional` | ✅ Existe |

---

## 🎯 CONCLUSÃO

### Status Geral: ⚠️ **PARCIALMENTE INTEGRADO (60%)**

**Pontos Positivos:**
- ✅ Receitas são calculadas via locações/medições
- ✅ Análise de rentabilidade implementada
- ✅ Integração com dashboard financeiro funcional

**Pontos a Melhorar:**
- ❌ Falta vinculação direta entre receitas e gruas
- ❌ Falta vinculação direta entre custos e gruas
- ❌ Falta criação automática de receitas/custos
- ❌ Análise de custos por grua é imprecisa

### Recomendação: **Implementar melhorias de ALTA PRIORIDADE para integração completa**

