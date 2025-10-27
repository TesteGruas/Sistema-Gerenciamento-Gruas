# 💰 BACKEND - Implementação Completa do Módulo Financeiro

**Data:** 27/10/2025  
**Status:** ⏳ Pendente de Implementação  
**Prioridade:** 🔴 Alta  
**Estimativa:** 114 horas (3 semanas)

---

## 🎯 OBJETIVO GERAL

Implementar todas as funcionalidades necessárias no backend para tornar o módulo financeiro completamente funcional, atendendo aos requisitos de:
- Dashboard financeiro completo
- Fluxo de caixa granular (diário/semanal/mensal)
- Relatórios financeiros exportáveis
- Gestão de contas bancárias reais
- Contas a pagar/receber
- Análise de rentabilidade

---

## 📋 FUNCIONALIDADES A IMPLEMENTAR

### ✅ **1. Filtro de Período no Fluxo de Caixa**

**Arquivo:** `backend-api/src/routes/financial-data.js`  
**Tempo estimado:** 6 horas

#### **O que fazer:**

Adicionar suporte aos parâmetros de query `?periodo=hoje` e `?periodo=semana`.

**Modificações necessárias:**

```javascript
router.get('/', async (req, res) => {
  try {
    const { periodo } = req.query
    
    // Definir intervalo e tipo de agrupamento
    let dataInicio, dataFim, agruparPor
    
    if (periodo === 'hoje') {
      // Dados do dia atual, agrupados por hora (0-23)
      dataInicio = new Date()
      dataInicio.setHours(0, 0, 0, 0)
      dataFim = new Date()
      dataFim.setHours(23, 59, 59, 999)
      agruparPor = 'hora'
    } else if (periodo === 'semana') {
      // Últimos 7 dias, agrupados por dia
      dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - 7)
      dataInicio.setHours(0, 0, 0, 0)
      dataFim = new Date()
      dataFim.setHours(23, 59, 59, 999)
      agruparPor = 'dia'
    } else {
      // Últimos 6 meses, agrupados por mês (padrão)
      dataInicio = new Date()
      dataInicio.setMonth(dataInicio.getMonth() - 6)
      agruparPor = 'mes'
    }
    
    // Buscar dados agrupados conforme tipo
    const fluxoCaixa = agruparPor === 'hora' 
      ? await buscarFluxoCaixaPorHora(dataInicio)
      : agruparPor === 'dia'
      ? await buscarFluxoCaixaPorDia(dataInicio, dataFim)
      : await buscarFluxoCaixaPorMes(dataInicio)
    
    // ... resto da resposta
  }
})
```

#### **Funções auxiliares necessárias:**

```javascript
async function buscarFluxoCaixaPorHora(dia) {
  const fluxoCaixa = []
  
  for (let i = 0; i < 24; i++) {
    // Buscar receitas da hora
    const { data: receitas } = await supabaseAdmin
      .from('receitas')
      .select('valor')
      .eq('status', 'confirmada')
      .gte('data_receita', dia.toISOString().split('T')[0])
      // Adicionar filtro por hora do dia aqui
    
    // Buscar custos da hora
    const { data: custos } = await supabaseAdmin
      .from('custos')
      .select('valor')
      .eq('status', 'confirmado')
      .gte('data_custo', dia.toISOString().split('T')[0])
      // Adicionar filtro por hora do dia aqui
    
    const totalEntradas = receitas?.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) || 0
    const totalSaidas = custos?.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) || 0
    
    fluxoCaixa.push({
      dia: `${String(i).padStart(2, '0')}:00`,
      entrada: totalEntradas,
      saida: totalSaidas
    })
  }
  
  return fluxoCaixa
}

async function buscarFluxoCaixaPorDia(dataInicio, dataFim) {
  const fluxoCaixa = []
  const diaAtual = new Date(dataInicio)
  
  while (diaAtual <= dataFim) {
    const diaString = diaAtual.toISOString().split('T')[0]
    
    // Buscar receitas do dia
    const { data: receitas } = await supabaseAdmin
      .from('receitas')
      .select('valor')
      .eq('status', 'confirmada')
      .gte('data_receita', diaString)
      .lt('data_receita', new Date(diaAtual.getTime() + 86400000).toISOString().split('T')[0])
    
    // Buscar custos do dia
    const { data: custos } = await supabaseAdmin
      .from('custos')
      .select('valor')
      .eq('status', 'confirmado')
      .gte('data_custo', diaString)
      .lt('data_custo', new Date(diaAtual.getTime() + 86400000).toISOString().split('T')[0])
    
    const totalEntradas = receitas?.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) || 0
    const totalSaidas = custos?.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) || 0
    
    const nomeDia = diaAtual.toLocaleDateString('pt-BR', { weekday: 'short' })
    
    fluxoCaixa.push({
      dia: nomeDia,
      entrada: totalEntradas,
      saida: totalSaidas
    })
    
    diaAtual.setDate(diaAtual.getDate() + 1)
  }
  
  return fluxoCaixa
}
```

---

### ⛔ **2. Saldo Atual Real (Contas Bancárias)**

**Arquivo:** `backend-api/src/routes/financial-data.js` (linha 169)  
**Tempo estimado:** 8 horas

#### **O que fazer:**

Substituir saldo fixo de R$ 50.000 por busca real de contas bancárias.

**Modificações necessárias:**

```javascript
// Buscar saldo real das contas bancárias
const { data: contasBancarias, error: contasError } = await supabaseAdmin
  .from('contas_bancarias')
  .select('saldo_atual')
  .eq('status', 'ativa')

if (contasError) {
  console.error('Erro ao buscar contas bancárias:', contasError)
}

// Calcular saldo total
const saldoAtual = contasBancarias?.reduce((sum, conta) => sum + parseFloat(conta.saldo_atual || 0), 0) || 0
```

#### **Novo endpoint necessário:**

Criar rota para atualizar saldo de contas:

```javascript
// backend-api/src/routes/contas-bancarias.js

router.put('/:id/saldo', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { saldo_atual } = req.body
    
    const { data, error } = await supabaseAdmin
      .from('contas_bancarias')
      .update({ saldo_atual })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})
```

---

### ⛔ **3. Relatório de Faturamento Completo**

**Arquivo:** Criar novo arquivo `backend-api/src/routes/relatorios-faturamento.js`  
**Tempo estimado:** 8 horas

#### **O que fazer:**

Criar endpoint completo para relatório de faturamento separando por tipo (vendas, locações, serviços).

**Nova rota:**

```javascript
// backend-api/src/routes/relatorios-faturamento.js

import express from 'express'
import { supabaseAdmin } from '../config/supabase.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query
    
    // Validar datas
    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        success: false,
        message: 'Datas de início e fim são obrigatórias'
      })
    }
    
    // Agrupar por mês
    const faturamentoPorMes = new Map()
    
    // Buscar vendas
    const { data: vendas } = await supabaseAdmin
      .from('vendas')
      .select('data_venda, valor_total')
      .gte('data_venda', data_inicio)
      .lte('data_venda', data_fim)
      .eq('status', 'confirmada')
    
    // Buscar locações
    const { data: locacoes } = await supabaseAdmin
      .from('locacoes')
      .select('data_inicio, data_fim, valor_total, valor_mensal')
      .gte('data_inicio', data_inicio)
      .lte('data_fim', data_fim)
      .eq('status', 'ativa')
    
    // Buscar receitas de serviços
    const { data: receitas } = await supabaseAdmin
      .from('receitas')
      .select('data_receita, valor, tipo')
      .gte('data_receita', data_inicio)
      .lte('data_receita', data_fim)
      .eq('status', 'confirmada')
    
    // Processar vendas
    vendas?.forEach(venda => {
      const mes = new Date(venda.data_venda).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      if (!faturamentoPorMes.has(mes)) {
        faturamentoPorMes.set(mes, { mes, vendas: 0, locacoes: 0, servicos: 0, total: 0 })
      }
      faturamentoPorMes.get(mes).vendas += parseFloat(venda.valor_total || 0)
    })
    
    // Processar locações
    locacoes?.forEach(locacao => {
      const mes = new Date(locacao.data_inicio).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      if (!faturamentoPorMes.has(mes)) {
        faturamentoPorMes.set(mes, { mes, vendas: 0, locacoes: 0, servicos: 0, total: 0 })
      }
      faturamentoPorMes.get(mes).locacoes += parseFloat(locacao.valor_total || 0)
    })
    
    // Processar serviços
    receitas?.forEach(receita => {
      const tipo = receita.tipo?.toLowerCase() || ''
      if (tipo.includes('serviço') || tipo.includes('servico')) {
        const mes = new Date(receita.data_receita).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        if (!faturamentoPorMes.has(mes)) {
          faturamentoPorMes.set(mes, { mes, vendas: 0, locacoes: 0, servicos: 0, total: 0 })
        }
        faturamentoPorMes.get(mes).servicos += parseFloat(receita.valor || 0)
      }
    })
    
    // Calcular totais
    const dadosFaturamento = Array.from(faturamentoPorMes.values()).map(item => ({
      ...item,
      total: item.vendas + item.locacoes + item.servicos
    }))
    
    res.json({ success: true, data: dadosFaturamento })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
```

**Registrar rota em:** `backend-api/src/server.js`

```javascript
import relatoriosFaturamentoRouter from './routes/relatorios-faturamento.js'
app.use('/api/relatorios-faturamento', relatoriosFaturamentoRouter)
```

---

### ⛔ **4. Exportação de Relatórios (PDF/Excel)**

**Arquivo:** Criar `backend-api/src/routes/exportar.js`  
**Tempo estimado:** 16 horas

#### **O que fazer:**

Criar rota para exportar relatórios em diferentes formatos.

**Nova rota:**

```javascript
// backend-api/src/routes/exportar.js

import express from 'express'
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'

const router = express.Router()

router.post('/:tipo', authenticateToken, async (req, res) => {
  try {
    const { tipo } = req.params
    const { formato, dados, titulo } = req.body
    
    if (!['financeiro', 'vendas', 'locacoes', 'faturamento'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de relatório inválido'
      })
    }
    
    if (formato === 'pdf') {
      // Gerar PDF
      const doc = new PDFDocument()
      
      // Headers
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename=${titulo || tipo}-${Date.now()}.pdf`)
      
      doc.pipe(res)
      
      // Título
      doc.fontSize(18).text(titulo || 'Relatório Financeiro', { align: 'center' })
      doc.moveDown()
      
      // Dados (exemplo)
      doc.fontSize(12)
      dados?.forEach(item => {
        doc.text(`${item.mes || item.dia}: R$ ${item.total?.toLocaleString('pt-BR') || 0}`)
      })
      
      doc.end()
      
    } else if (formato === 'excel') {
      // Gerar Excel
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet(titulo || 'Relatório')
      
      // Headers
      worksheet.columns = [
        { header: 'Período', key: 'periodo' },
        { header: 'Valor', key: 'valor' }
      ]
      
      // Dados
      dados?.forEach(item => {
        worksheet.addRow({ periodo: item.mes || item.dia, valor: item.total || 0 })
      })
      
      // Headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename=${titulo || tipo}-${Date.now()}.xlsx`)
      
      await workbook.xlsx.write(res)
      res.end()
    }
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
```

**Instalar dependências:**

```bash
cd backend-api
npm install pdfkit exceljs
```

**Registrar rota em:** `backend-api/src/server.js`

```javascript
import exportarRouter from './routes/exportar.js'
app.use('/api/exportar', exportarRouter)
```

---

### ⛔ **5. Sistema de Contas a Pagar/Receber**

**Arquivo:** `backend-api/database/schema.sql` (tabelas já existem) + criar rotas  
**Tempo estimado:** 16 horas

#### **O que fazer:**

Criar rotas CRUD para contas a pagar e receber que já existem no schema.

**Nova rota:** `backend-api/src/routes/contas-pagar.js`

```javascript
import express from 'express'
import { supabaseAdmin } from '../config/supabase.js'

const router = express.Router()

// GET todas as contas a pagar
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, data_vencimento } = req.query
    
    let query = supabaseAdmin.from('contas_pagar').select('*')
    
    if (status) query = query.eq('status', status)
    if (data_vencimento) query = query.eq('data_vencimento', data_vencimento)
    
    const { data, error } = await query.order('data_vencimento', { ascending: true })
    
    if (error) throw error
    
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST nova conta a pagar
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('contas_pagar')
      .insert([req.body])
      .select()
    
    if (error) throw error
    
    res.status(201).json({ success: true, data: data[0] })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT atualizar conta
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    
    const { data, error } = await supabaseAdmin
      .from('contas_pagar')
      .update(req.body)
      .eq('id', id)
      .select()
    
    if (error) throw error
    
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE conta
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    
    const { error } = await supabaseAdmin
      .from('contas_pagar')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
```

**Criar rota similar para:** `backend-api/src/routes/contas-receber.js`

**Registrar rotas em:** `backend-api/src/server.js`

```javascript
import contasPagarRouter from './routes/contas-pagar.js'
import contasReceberRouter from './routes/contas-receber.js'

app.use('/api/contas-pagar', contasPagarRouter)
app.use('/api/contas-receber', contasReceberRouter)
```

---

### ⛔ **6. Relatório de Impostos**

**Arquivo:** Criar `backend-api/src/routes/relatorios-impostos.js`  
**Tempo estimado:** 16 horas

#### **O que fazer:**

Criar endpoint para cálculo e visualização de impostos.

**Nova rota:**

```javascript
import express from 'express'
import { supabaseAdmin } from '../config/supabase.js'

const router = express.Router()

router.get('/:mes/:ano', async (req, res) => {
  try {
    const { mes, ano } = req.params
    
    // Buscar vendas do mês
    const { data: vendas } = await supabaseAdmin
      .from('vendas')
      .select('valor_total')
      .gte('data_venda', `${ano}-${mes}-01`)
      .lt('data_venda', `${ano}-${parseInt(mes) + 1}-01`)
    
    // Calcular ICMS (12% sobre vendas)
    const totalVendas = vendas?.reduce((sum, v) => sum + parseFloat(v.valor_total || 0), 0) || 0
    const icms = totalVendas * 0.12
    
    // Calcular ISS (5% sobre serviços)
    const { data: servicos } = await supabaseAdmin
      .from('receitas')
      .select('valor')
      .eq('tipo', 'serviço')
      .gte('data_receita', `${ano}-${mes}-01`)
      .lt('data_receita', `${ano}-${parseInt(mes) + 1}-01`)
    
    const totalServicos = servicos?.reduce((sum, s) => sum + parseFloat(s.valor || 0), 0) || 0
    const iss = totalServicos * 0.05
    
    // Calcular PIS/COFINS
    const pis = totalVendas * 0.0165
    const cofins = totalVendas * 0.076
    
    res.json({
      success: true,
      data: {
        mes,
        ano,
        icms,
        iss,
        pis,
        cofins,
        total: icms + iss + pis + cofins
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
```

---

### ⛔ **7. Análise de Rentabilidade por Grua**

**Arquivo:** Criar `backend-api/src/routes/relatorios-rentabilidade.js`  
**Tempo estimado:** 12 horas

#### **O que fazer:**

Criar endpoint para análise de ROI por grua.

**Nova rota:**

```javascript
import express from 'express'
import { supabaseAdmin } from '../config/supabase.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    // Buscar todas as gruas
    const { data: gruas } = await supabaseAdmin
      .from('gruas')
      .select('*')
    
    const analise = []
    
    for (const grua of gruas || []) {
      // Receitas da grua
      const { data: receitas } = await supabaseAdmin
        .from('locacoes')
        .select('valor_total')
        .eq('grua_id', grua.id)
      
      const totalReceitas = receitas?.reduce((sum, r) => sum + parseFloat(r.valor_total || 0), 0) || 0
      
      // Custos da grua
      const { data: custos } = await supabaseAdmin
        .from('custos')
        .select('valor')
        .eq('grua_id', grua.id)
      
      const totalCustos = custos?.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0) || 0
      
      // Calcular ROI
      const lucro = totalReceitas - totalCustos
      const roi = totalReceitas > 0 ? (lucro / totalReceitas) * 100 : 0
      
      analise.push({
        grua_id: grua.id,
        modelo: grua.modelo,
        fabricante: grua.fabricante,
        receitas: totalReceitas,
        custos: totalCustos,
        lucro,
        roi,
        margem_lucro: lucro / totalReceitas * 100
      })
    }
    
    res.json({ success: true, data: analise })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
```

---

## 📊 RESUMO DE IMPLEMENTAÇÕES

| Função | Arquivo | Tempo | Prioridade |
|--------|---------|-------|------------|
| Filtro de Período | `financial-data.js` | 6h | 🔴 Alta |
| Saldo Real Contas | `financial-data.js` + `contas-bancarias.js` | 8h | 🔴 Alta |
| Relatório Faturamento | `relatorios-faturamento.js` | 8h | 🔴 Alta |
| Exportação PDF/Excel | `exportar.js` | 16h | 🟡 Média |
| Contas a Pagar/Receber | `contas-pagar.js` + `contas-receber.js` | 16h | 🟡 Média |
| Relatório Impostos | `relatorios-impostos.js` | 16h | 🟢 Baixa |
| Análise Rentabilidade | `relatorios-rentabilidade.js` | 12h | 🟢 Baixa |

**TOTAL:** ~82 horas (2 semanas)

---

## 🎯 CHECKLIST DE IMPLEMENTAÇÃO

### Alta Prioridade
- [ ] Implementar filtro de período (hoje/semana)
- [ ] Integrar saldo real de contas bancárias
- [ ] Criar endpoint de relatório de faturamento
- [ ] Testar endpoints com front-end

### Média Prioridade
- [ ] Criar rotas de exportação (PDF/Excel)
- [ ] Criar rotas de contas a pagar/receber
- [ ] Instalar dependências (pdfkit, exceljs)

### Baixa Prioridade
- [ ] Criar endpoint de impostos
- [ ] Criar endpoint de rentabilidade

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

### **Semana 1 (30 horas)**
1. Filtro de período (6h)
2. Saldo real de contas (8h)
3. Relatório de faturamento (8h)
4. Contas a pagar/receber (8h)

### **Semana 2 (32 horas)**
5. Exportação de relatórios (16h)
6. Relatório de impostos (16h)

### **Semana 3 (20 horas)**
7. Análise de rentabilidade (12h)
8. Testes e ajustes finais (8h)

---

## 💡 NOTAS IMPORTANTES

1. **Todas as rotas devem usar:** `authenticateToken` middleware
2. **Instalar dependências:** `npm install pdfkit exceljs`
3. **Registrar todas as rotas em:** `backend-api/src/server.js`
4. **Usar:** `supabaseAdmin` para queries que não requerem permissão do usuário
5. **Logs:** Adicionar `console.log` para debug

---

**Status:** ⏳ Aguardando Implementação  
**Desenvolvedor:** [A definir]  
**Prazo:** 3 semanas

