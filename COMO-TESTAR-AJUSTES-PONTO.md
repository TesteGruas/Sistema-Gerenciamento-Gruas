# 🧪 Como Testar os Ajustes do Ponto Eletrônico

Este documento fornece um guia passo a passo para testar todas as funcionalidades implementadas.

---

## 📋 Pré-requisitos

1. **Executar a Migration:**
```sql
\i backend-api/database/migrations/20250228_add_feriados_tipo_dia_ponto.sql
```

2. **Verificar se o backend está rodando:**
```bash
cd backend-api
npm start
```

3. **Verificar se o frontend está rodando:**
```bash
npm run dev
```

---

## ✅ 1. Testar Feriados e Tipo de Dia no PWA

### Passo 1: Acessar PWA
1. Abra o navegador e acesse: `http://localhost:3000/pwa`
2. Faça login com um usuário que tenha funcionário vinculado (Operário ou Sinaleiro)

### Passo 2: Testar Registro de Ponto em Dia Normal
1. Clique em "Ponto Eletrônico" ou acesse `/pwa/ponto`
2. Clique no botão "Entrada" (▶️)
3. **Deve aparecer:** Diálogo perguntando "Hoje é feriado?"
4. Clique em **"Não"**
5. Clique em **"Continuar"**
6. Confirme o registro
7. **Verificar:** O registro deve ser salvo com `tipo_dia = 'normal'` (ou 'sabado'/'domingo' se for fim de semana)

### Passo 3: Testar Registro de Ponto em Feriado
1. Clique no botão "Entrada" novamente (ou em outro dia)
2. Quando aparecer "Hoje é feriado?", clique em **"Sim"**
3. **Deve aparecer:** Opções: Nacional, Estadual, Local
4. Selecione **"Nacional"**
5. Clique em **"Continuar"**
6. Confirme o registro
7. **Verificar no banco:**
```sql
SELECT 
  id,
  data,
  tipo_dia,
  is_feriado,
  feriado_id
FROM registros_ponto
WHERE data = CURRENT_DATE
ORDER BY created_at DESC
LIMIT 1;
```
8. **Resultado esperado:**
   - `tipo_dia = 'feriado_nacional'`
   - `is_feriado = true`
   - `feriado_id` deve ter um ID válido

---

## ✅ 2. Testar Resumo de Horas Extras por Dia da Semana

### Passo 1: Acessar Dashboard
1. Acesse: `http://localhost:3000/dashboard/ponto`
2. Faça login como Admin ou Gestor

### Passo 2: Navegar para Relatório Mensal
1. Clique na aba **"Relatório Mensal"**
2. Role a página até encontrar **"Resumo de Horas Extras por Dia da Semana"**

### Passo 3: Carregar Resumo
1. No seletor de **"Funcionário"**, selecione um funcionário que tenha registros de ponto
2. Verifique se o **Mês** e **Ano** estão corretos (ou ajuste se necessário)
3. Clique em **"Carregar Resumo"**

### Passo 4: Verificar Resultados
**Deve aparecer uma tabela com:**
- Colunas: Dia | Horas Extras | Acréscimo | Total com Acréscimo | Registros
- Linhas para cada dia da semana que teve horas extras:
  - Segunda-feira
  - Terça-feira
  - Quarta-feira
  - Quinta-feira
  - Sexta-feira
  - Sábado (com acréscimo de 60%)
  - Domingo (com acréscimo de 100%)
  - Feriado (com acréscimo de 100%)

**Exemplo esperado:**
```
Segunda-feira | 1:30 | 0% | 1:30 | 1
Sábado       | 14:30 | 60% | 23:12 | 1
Feriado      | 6:30 | 100% | 13:00 | 1
```

**Totais no final:**
- Total de Horas Extras: [soma de todas]
- Total com Acréscimos: [soma com acréscimos aplicados]

### Passo 5: Validar Cálculos
1. Verifique se os acréscimos estão corretos:
   - Sábado: 60% de acréscimo
   - Domingo/Feriado: 100% de acréscimo
2. Verifique se o total com acréscimos está correto

---

## ✅ 3. Testar Resumo de Assinaturas do Encarregado

### Passo 1: Acessar Página de Assinaturas
1. Acesse: `http://localhost:3000/dashboard/assinatura`
2. Faça login como encarregado (usuário que tem assinaturas)

### Passo 2: Localizar Resumo Mensal
1. Role a página até encontrar **"Resumo de Assinaturas do Mês"**

### Passo 3: Carregar Resumo
1. Selecione o **Mês** (ex: Novembro)
2. Selecione o **Ano** (ex: 2025)
3. Clique em **"Carregar Resumo"**

### Passo 4: Verificar Resultados
**Deve aparecer:**
- **Card azul** com:
  - Total de Assinaturas: [número]
  - Período: [data início] - [data fim]

- **Tabela** (se houver assinaturas) com:
  - Colunas: Data | Documento | Tipo | Obra
  - Linhas com cada assinatura realizada no mês

**Exemplo esperado:**
```
Total de Assinaturas: 5
Período: 01/11/2025 - 30/11/2025

Tabela:
15/11/2025 | Documento de Obra | contrato | Obra ABC
20/11/2025 | Certificado | certificado | Obra XYZ
...
```

### Passo 5: Validar Dados
1. Verifique se o total corresponde ao número de linhas na tabela
2. Verifique se as datas estão no formato brasileiro (DD/MM/YYYY)
3. Verifique se os nomes dos documentos aparecem corretamente

---

## ✅ 4. Testar Relatório de Aluguéis com Datas

### Passo 1: Acessar Página de Aluguéis
1. Acesse: `http://localhost:3000/dashboard/financeiro/alugueis`
2. Faça login como Admin ou Gestor

### Passo 2: Visualizar Lista de Aluguéis
1. A lista de aluguéis deve aparecer automaticamente

### Passo 3: Verificar Campos de Data
**Para cada aluguel, deve aparecer uma seção "Informações de Contrato" com:**
- **Data de Início:** [data no formato DD/MM/YYYY]
- **Aniversário (1 ano):** [data de aniversário calculada]
- **Dias até Aniversário:** [número de dias] + badge "Próximo" se ≤ 30 dias

### Passo 4: Validar Cálculos
1. **Data de Aniversário:** Deve ser exatamente 1 ano após a data de início
   - Exemplo: Se início é 15/11/2024, aniversário deve ser 15/11/2025

2. **Dias até Aniversário:** Deve calcular corretamente
   - Se hoje é 01/12/2025 e aniversário é 15/12/2025, deve mostrar 14 dias

3. **Badge "Próximo":** Deve aparecer apenas se:
   - `dias_ate_aniversario <= 30` E `dias_ate_aniversario >= 0`

### Passo 5: Testar com Dados Reais
1. Crie um aluguel com data de início há 11 meses
2. Verifique se o badge "Próximo" aparece
3. Crie um aluguel com data de início há 13 meses
4. Verifique se o badge não aparece (já passou)

---

## ✅ 5. Testar Cálculo de Horas Extras

### Passo 1: Criar Registros de Teste
1. Acesse `/dashboard/ponto`
2. Crie registros de ponto para testar diferentes cenários:

**Cenário 1: Segunda-feira (07:00-18:00)**
- Entrada: 07:00
- Saída: 18:00
- **Horas extras esperadas:** 1 hora (18:00 - 17:00)

**Cenário 2: Sexta-feira (07:00-17:00)**
- Entrada: 07:00
- Saída: 17:00
- **Horas extras esperadas:** 1 hora (17:00 - 16:00)

**Cenário 3: Sábado (07:00-12:00)**
- Entrada: 07:00
- Saída: 12:00
- Tipo: Sábado
- **Horas extras esperadas:** 5 horas (toda hora trabalhada é extra)

### Passo 2: Verificar Cálculos
1. Após criar cada registro, verifique:
   - Se `horas_extras` está correto
   - Se `tipo_dia` está correto
   - Se o cálculo considera o tipo de dia

### Passo 3: Verificar no Resumo
1. Carregue o resumo de horas extras para o funcionário
2. Verifique se os valores aparecem corretamente na tabela
3. Verifique se os acréscimos são aplicados corretamente

---

## 🐛 Troubleshooting

### Problema: Diálogo de feriado não aparece
**Solução:**
1. Verifique se está acessando `/pwa/ponto` (não `/dashboard/ponto`)
2. Verifique se é a primeira entrada do dia
3. Limpe o cache do navegador

### Problema: Resumo de horas extras não carrega
**Solução:**
1. Verifique se o funcionário selecionado tem registros no período
2. Verifique se há registros com `horas_extras > 0`
3. Verifique o console do navegador para erros

### Problema: Datas de aniversário não aparecem
**Solução:**
1. Verifique se o backend está retornando os campos:
   - `data_aniversario_contrato`
   - `dias_ate_aniversario`
   - `proximo_aniversario`
2. Verifique o Network tab do navegador na requisição de aluguéis

### Problema: Tipo de dia não aparece na tabela
**Solução:**
1. Verifique se a migration foi executada
2. Verifique se os registros têm o campo `tipo_dia` preenchido
3. Recarregue a página

---

## 📊 Checklist de Validação Completa

### PWA - Ponto Eletrônico
- [ ] Diálogo de feriado aparece ao iniciar ponto
- [ ] Pergunta sobre tipo de feriado funciona
- [ ] Dados são salvos corretamente no banco
- [ ] Tipo de dia é identificado automaticamente para sábado/domingo

### Dashboard - Ponto Eletrônico
- [ ] Coluna "Tipo Dia" aparece na tabela de registros
- [ ] Badges de tipo de dia aparecem corretamente
- [ ] Resumo de horas extras aparece na aba "Relatório Mensal"
- [ ] Seletor de funcionário funciona
- [ ] Tabela exibe dados corretamente
- [ ] Totais são calculados corretamente
- [ ] Acréscimos são aplicados corretamente (60% sábado, 100% domingo/feriado)

### Dashboard - Assinaturas
- [ ] Resumo mensal de assinaturas aparece na página
- [ ] Seletor de mês/ano funciona
- [ ] Total de assinaturas é exibido corretamente
- [ ] Lista de assinaturas é exibida corretamente
- [ ] Datas estão no formato brasileiro

### Dashboard - Aluguéis
- [ ] Data de início aparece
- [ ] Data de aniversário aparece e está correta (1 ano após início)
- [ ] Dias até aniversário aparece e está correto
- [ ] Badge "Próximo" aparece para contratos ≤ 30 dias
- [ ] Badge "Próximo" não aparece para contratos > 30 dias ou já passados

---

**Data de Criação:** 2025-02-28  
**Status:** ✅ Pronto para Teste

