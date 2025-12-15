# 📋 Guia de Validação - Ajustes Ponto Eletrônico

Este documento descreve como validar cada funcionalidade implementada nos ajustes solicitados para o sistema de ponto eletrônico.

---

## 1. ✅ Feriados e Finais de Semana

### 📍 Localização
- **Migration:** `backend-api/database/migrations/20250228_add_feriados_tipo_dia_ponto.sql`
- **Backend:** `backend-api/src/routes/ponto-eletronico.js`
- **Frontend:** `app/pwa/ponto/page.tsx`

### 🎯 Funcionalidades Implementadas
1. Tabela de feriados nacionais com tipos (nacional, estadual, local)
2. Campos na tabela `registros_ponto` para tipo de dia e feriado
3. Identificação automática de sábados, domingos e feriados
4. Perguntas sobre feriado ao iniciar cartão de ponto

### ✅ Como Validar

#### **Passo 1: Executar Migration**
```sql
-- Executar a migration
\i backend-api/database/migrations/20250228_add_feriados_tipo_dia_ponto.sql
```

#### **Passo 2: Verificar Tabela de Feriados**
```sql
-- Verificar se os feriados foram inseridos
SELECT * FROM feriados_nacionais ORDER BY data;
```

#### **Passo 3: Testar Registro de Ponto com Feriado**
1. Acesse o PWA: `/pwa/ponto`
2. Clique em "Iniciar Cartão de Ponto" (botão Entrada)
3. Deve aparecer pergunta: **"Hoje é feriado?"**
4. Selecione **"Sim"**
5. Deve aparecer opções: **Nacional**, **Estadual**, **Local**
6. Selecione um tipo e confirme
7. Registre o ponto normalmente

#### **Passo 4: Verificar no Banco de Dados**
```sql
-- Verificar registro com tipo de dia
SELECT 
  id,
  data,
  tipo_dia,
  is_feriado,
  feriado_id,
  observacoes_feriado
FROM registros_ponto
WHERE data = CURRENT_DATE
ORDER BY created_at DESC
LIMIT 1;
```

### 🔍 Validações Específicas

| Ação | Resultado Esperado |
|------|-------------------|
| Registrar ponto em sábado | `tipo_dia = 'sabado'` automaticamente |
| Registrar ponto em domingo | `tipo_dia = 'domingo'` automaticamente |
| Registrar ponto em feriado nacional | `tipo_dia = 'feriado_nacional'`, `is_feriado = true` |
| Registrar ponto em dia normal | `tipo_dia = 'normal'` |

---

## 2. ✅ Cálculo de Horas Extras por Tipo de Dia

### 📍 Localização
- **Backend:** `backend-api/src/utils/ponto-eletronico.js`
- **Função:** `calcularHorasExtras()`

### 🎯 Funcionalidades Implementadas
1. Cálculo diferenciado por tipo de dia
2. Horários padrão: Segunda-Quinta (07:00-17:00), Sexta (07:00-16:00)
3. Qualquer hora além do horário padrão = hora extra

### ✅ Como Validar

#### **Passo 1: Testar Horas Extras em Dia Normal**
1. Registrar entrada: **07:00**
2. Registrar saída: **18:00** (segunda-quinta)
3. Horas extras esperadas: **1 hora** (18:00 - 17:00)

#### **Passo 2: Testar Horas Extras em Sexta-feira**
1. Registrar entrada: **07:00**
2. Registrar saída: **17:00** (sexta)
3. Horas extras esperadas: **1 hora** (17:00 - 16:00)

#### **Passo 3: Testar Horas Extras em Sábado/Domingo/Feriado**
1. Registrar entrada: **07:00**
2. Registrar saída: **12:00**
3. Horas extras esperadas: **5 horas** (toda hora trabalhada é extra)

### 🔍 Validações Específicas

| Dia | Entrada | Saída | Horas Extras Esperadas |
|-----|---------|-------|------------------------|
| Segunda | 07:00 | 17:00 | 0h |
| Segunda | 07:00 | 18:00 | 1h |
| Sexta | 07:00 | 16:00 | 0h |
| Sexta | 07:00 | 17:00 | 1h |
| Sábado | 07:00 | 12:00 | 5h |
| Domingo | 07:00 | 12:00 | 5h |
| Feriado | 07:00 | 12:00 | 5h |

---

## 3. ✅ Resumo de Horas Extras por Dia da Semana

### 📍 Localização
- **Backend:** `backend-api/src/routes/ponto-eletronico.js`
- **Endpoint:** `GET /api/ponto-eletronico/resumo-horas-extras`

### 🎯 Funcionalidades Implementadas
1. Resumo agregado por dia da semana
2. Cálculo de acréscimos (sábado 60%, domingo/feriado 100%)
3. Total com acréscimos

### ✅ Como Validar

#### **Passo 1: Testar Endpoint**
```bash
curl -X GET "http://localhost:3001/api/ponto-eletronico/resumo-horas-extras?funcionario_id=1&mes=11&ano=2025" \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### **Passo 2: Verificar Resposta**
```json
{
  "success": true,
  "data": {
    "resumo": {
      "segunda": {
        "horas_extras": 1.5,
        "registros": 1,
        "acrescimo": 0,
        "total_com_acrescimo": 1.5
      },
      "sabado": {
        "horas_extras": 14.5,
        "registros": 1,
        "acrescimo": 0.6,
        "total_com_acrescimo": 23.2
      },
      "feriado": {
        "horas_extras": 6.5,
        "registros": 1,
        "acrescimo": 1.0,
        "total_com_acrescimo": 13.0
      }
    },
    "totais": {
      "horas_extras": 22.5,
      "total_com_acrescimos": 37.7
    }
  }
}
```

### 🔍 Validações Específicas

| Dia | Horas Extras | Acréscimo | Total com Acréscimo |
|-----|--------------|-----------|---------------------|
| Segunda | 1.5h | 0% | 1.5h |
| Sábado | 14.5h | 60% | 23.2h |
| Domingo | 0h | 100% | 0h |
| Feriado | 6.5h | 100% | 13.0h |

---

## 4. ✅ Resumo de Assinaturas do Encarregado

### 📍 Localização
- **Backend:** `backend-api/src/routes/assinaturas.js`
- **Endpoint:** `GET /api/assinaturas/resumo-mensal`

### 🎯 Funcionalidades Implementadas
1. Buscar assinaturas do encarregado no mês
2. Total de assinaturas realizadas
3. Lista detalhada com documentos

### ✅ Como Validar

#### **Passo 1: Testar Endpoint**
```bash
curl -X GET "http://localhost:3001/api/assinaturas/resumo-mensal?mes=11&ano=2025" \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### **Passo 2: Verificar Resposta**
```json
{
  "success": true,
  "data": {
    "total_assinaturas": 5,
    "periodo": {
      "mes": 11,
      "ano": 2025,
      "data_inicio": "2025-11-01",
      "data_fim": "2025-11-30"
    },
    "assinaturas": [
      {
        "id": 1,
        "data_assinatura": "2025-11-15",
        "documento": {
          "nome": "Documento de Obra",
          "tipo": "contrato"
        }
      }
    ]
  }
}
```

---

## 5. ✅ Relatório de Aluguéis com Datas

### 📍 Localização
- **Backend:** `backend-api/src/routes/alugueis-residencias.js`
- **Endpoint:** `GET /api/alugueis-residencias`

### 🎯 Funcionalidades Implementadas
1. Data de início do contrato
2. Data de aniversário (1 ano após início)
3. Dias até aniversário
4. Alerta de próximo aniversário (30 dias)

### ✅ Como Validar

#### **Passo 1: Testar Endpoint**
```bash
curl -X GET "http://localhost:3001/api/alugueis-residencias" \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### **Passo 2: Verificar Resposta**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "data_inicio": "2024-11-15",
      "data_inicio_contrato": "2024-11-15",
      "data_aniversario_contrato": "2025-11-15",
      "dias_ate_aniversario": 15,
      "proximo_aniversario": true
    }
  ]
}
```

### 🔍 Validações Específicas

| Data Início | Data Aniversário | Dias até Aniversário | Próximo Aniversário |
|-------------|------------------|----------------------|---------------------|
| 2024-11-15 | 2025-11-15 | 15 | ✅ Sim (≤ 30 dias) |
| 2024-01-01 | 2025-01-01 | 60 | ❌ Não (> 30 dias) |

---

## 📊 Resumo das Validações

### ✅ Checklist Completo

- [ ] **Feriados:** Tabela criada e feriados inseridos
- [ ] **Feriados:** Pergunta aparece ao iniciar ponto
- [ ] **Feriados:** Tipo de dia salvo corretamente
- [ ] **Horas Extras:** Cálculo correto para segunda-quinta
- [ ] **Horas Extras:** Cálculo correto para sexta-feira
- [ ] **Horas Extras:** Cálculo correto para sábado/domingo/feriado
- [ ] **Resumo:** Endpoint retorna dados corretos
- [ ] **Resumo:** Acréscimos calculados corretamente
- [ ] **Assinaturas:** Endpoint retorna assinaturas do mês
- [ ] **Aluguéis:** Datas de início e aniversário aparecem

---

## 🐛 Troubleshooting

### Erro: "Tabela feriados_nacionais não existe"
**Solução:** Execute a migration: `\i backend-api/database/migrations/20250228_add_feriados_tipo_dia_ponto.sql`

### Erro: "tipo_dia não existe na tabela registros_ponto"
**Solução:** A migration adiciona os campos automaticamente. Verifique se foi executada.

### Erro: "Horas extras não calculam corretamente"
**Solução:** Verifique se o tipo_dia está sendo salvo corretamente no registro.

### Erro: "Endpoint de resumo não retorna dados"
**Solução:** Verifique se há registros de ponto com horas_extras > 0 no período.

---

## 📝 Notas Importantes

1. **Feriados:** Os feriados nacionais são inseridos automaticamente na migration. Feriados estaduais/locais devem ser adicionados manualmente.

2. **Cálculo de Horas Extras:** O sistema assume jornada padrão de 10h (seg-qui) ou 9h (sex). Qualquer hora além disso é considerada extra.

3. **Acréscimos:** Sábado tem 60% de acréscimo, domingo e feriados têm 100% de acréscimo.

4. **Aniversário de Contrato:** Calculado automaticamente como 1 ano após a data de início.

---

**Data de Criação:** 2025-02-28  
**Última Atualização:** 2025-02-28

