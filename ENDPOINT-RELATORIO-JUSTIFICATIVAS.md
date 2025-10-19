# Endpoint de Relatório de Justificativas - Backend
## Solicitação de Implementação - 19/12/2024

## 📋 Resumo

Este documento solicita a implementação de endpoints específicos para relatórios de justificativas no sistema de ponto eletrônico, similar aos relatórios mensais de ponto já existentes.

## 🎯 Objetivo

Criar endpoints de relatório que forneçam dados agregados e estatísticas sobre justificativas, permitindo análises mais eficientes e relatórios gerenciais.

## 📊 Situação Atual

### **✅ O que já existe:**
- `GET /api/ponto-eletronico/justificativas` - Listagem com filtros
- Filtros: funcionário, data, status, tipo
- Paginação e dados completos

### **❌ O que está faltando:**
- Endpoints específicos de **relatório** de justificativas
- **Resumos e estatísticas** agregadas
- **Relatórios mensais** de justificativas
- **Métricas gerenciais** (totais, tendências, etc.)

## 🚀 Endpoints Solicitados

### **1. Relatório Mensal de Justificativas**

#### **Endpoint:**
```
GET /api/ponto-eletronico/relatorios/justificativas/mensal
```

#### **Parâmetros:**
- `mes` (obrigatório): Mês do relatório (1-12)
- `ano` (obrigatório): Ano do relatório
- `funcionario_id` (opcional): ID do funcionário para filtrar
- `obra_id` (opcional): ID da obra para filtrar
- `status` (opcional): Status das justificativas (Pendente, Aprovada, Rejeitada)
- `tipo` (opcional): Tipo das justificativas (Atraso, Falta, Saída Antecipada, Ausência Parcial)

#### **Exemplo de uso:**
```
GET /api/ponto-eletronico/relatorios/justificativas/mensal?mes=12&ano=2024&status=Pendente
```

#### **Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "periodo": {
      "mes": 12,
      "ano": 2024,
      "data_inicio": "2024-12-01",
      "data_fim": "2024-12-31"
    },
    "resumo": {
      "total_justificativas": 25,
      "por_status": {
        "Pendente": 8,
        "Aprovada": 15,
        "Rejeitada": 2
      },
      "por_tipo": {
        "Atraso": 12,
        "Falta": 8,
        "Saída Antecipada": 3,
        "Ausência Parcial": 2
      },
      "por_funcionario": [
        {
          "funcionario_id": 123,
          "nome": "João Silva",
          "total_justificativas": 5,
          "por_status": {
            "Pendente": 2,
            "Aprovada": 3,
            "Rejeitada": 0
          }
        }
      ],
      "tendencia_mensal": {
        "crescimento": 15.5,
        "comparacao_mes_anterior": "+3 justificativas"
      }
    },
    "justificativas": [
      {
        "id": "just_123",
        "funcionario_id": 123,
        "data": "2024-12-15",
        "tipo": "Atraso",
        "motivo": "Trânsito congestionado",
        "status": "Pendente",
        "data_criacao": "2024-12-15T08:30:00Z",
        "funcionario": {
          "nome": "João Silva",
          "cargo": "Operador",
          "turno": "Manhã"
        }
      }
    ]
  }
}
```

---

### **2. Relatório de Justificativas por Período**

#### **Endpoint:**
```
GET /api/ponto-eletronico/relatorios/justificativas/periodo
```

#### **Parâmetros:**
- `data_inicio` (obrigatório): Data de início (YYYY-MM-DD)
- `data_fim` (obrigatório): Data de fim (YYYY-MM-DD)
- `funcionario_id` (opcional): ID do funcionário para filtrar
- `obra_id` (opcional): ID da obra para filtrar
- `status` (opcional): Status das justificativas
- `tipo` (opcional): Tipo das justificativas
- `agrupar_por` (opcional): Agrupamento (funcionario, tipo, status, dia, semana)

#### **Exemplo de uso:**
```
GET /api/ponto-eletronico/relatorios/justificativas/periodo?data_inicio=2024-12-01&data_fim=2024-12-31&agrupar_por=funcionario
```

#### **Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "periodo": {
      "data_inicio": "2024-12-01",
      "data_fim": "2024-12-31",
      "dias_uteis": 22,
      "dias_totais": 31
    },
    "resumo": {
      "total_justificativas": 45,
      "media_diaria": 1.45,
      "por_status": {
        "Pendente": 12,
        "Aprovada": 28,
        "Rejeitada": 5
      },
      "por_tipo": {
        "Atraso": 20,
        "Falta": 15,
        "Saída Antecipada": 7,
        "Ausência Parcial": 3
      },
      "taxa_aprovacao": 84.4,
      "funcionarios_com_justificativas": 8
    },
    "agrupamento": {
      "funcionario": [
        {
          "funcionario_id": 123,
          "nome": "João Silva",
          "total_justificativas": 8,
          "por_status": {
            "Pendente": 2,
            "Aprovada": 5,
            "Rejeitada": 1
          },
          "por_tipo": {
            "Atraso": 4,
            "Falta": 3,
            "Saída Antecipada": 1
          }
        }
      ]
    },
    "justificativas": [...]
  }
}
```

---

### **3. Relatório de Estatísticas de Justificativas**

#### **Endpoint:**
```
GET /api/ponto-eletronico/relatorios/justificativas/estatisticas
```

#### **Parâmetros:**
- `periodo` (opcional): Período (ultimo_mes, ultimos_3_meses, ultimo_ano)
- `funcionario_id` (opcional): ID do funcionário para filtrar
- `obra_id` (opcional): ID da obra para filtrar

#### **Exemplo de uso:**
```
GET /api/ponto-eletronico/relatorios/justificativas/estatisticas?periodo=ultimo_mes
```

#### **Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "periodo": {
      "data_inicio": "2024-11-01",
      "data_fim": "2024-11-30"
    },
    "estatisticas": {
      "total_justificativas": 35,
      "media_mensal": 35,
      "tendencia": {
        "crescimento_percentual": 12.5,
        "comparacao_mes_anterior": "+4 justificativas"
      },
      "distribuicao": {
        "por_status": {
          "Pendente": 8,
          "Aprovada": 24,
          "Rejeitada": 3
        },
        "por_tipo": {
          "Atraso": 18,
          "Falta": 12,
          "Saída Antecipada": 4,
          "Ausência Parcial": 1
        },
        "por_dia_semana": {
          "Segunda": 8,
          "Terça": 6,
          "Quarta": 5,
          "Quinta": 7,
          "Sexta": 9
        }
      },
      "funcionarios": {
        "total_com_justificativas": 12,
        "maior_frequencia": {
          "funcionario_id": 123,
          "nome": "João Silva",
          "total_justificativas": 6
        },
        "media_por_funcionario": 2.9
      },
      "tempo_medio_aprovacao": {
        "horas": 24.5,
        "dias": 1.02
      }
    }
  }
}
```

---

## 🔧 Implementação Técnica

### **1. Estrutura de Dados**

#### **Tabela justificativas (já existe):**
```sql
CREATE TABLE justificativas (
  id VARCHAR PRIMARY KEY,
  funcionario_id INTEGER REFERENCES funcionarios(id),
  data DATE NOT NULL,
  tipo VARCHAR NOT NULL, -- Atraso, Falta, Saída Antecipada, Ausência Parcial
  motivo TEXT NOT NULL,
  status VARCHAR DEFAULT 'Pendente', -- Pendente, Aprovada, Rejeitada
  aprovado_por INTEGER REFERENCES usuarios(id),
  data_aprovacao TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **2. Funções Utilitárias Necessárias**

#### **calcularResumoJustificativas:**
```javascript
function calcularResumoJustificativas(justificativas, dataInicio, dataFim) {
  const resumo = {
    total_justificativas: justificativas.length,
    por_status: {},
    por_tipo: {},
    por_funcionario: {},
    tendencia_mensal: {
      crescimento: 0,
      comparacao_mes_anterior: ''
    }
  };

  justificativas.forEach(justificativa => {
    // Agrupar por status
    resumo.por_status[justificativa.status] = 
      (resumo.por_status[justificativa.status] || 0) + 1;
    
    // Agrupar por tipo
    resumo.por_tipo[justificativa.tipo] = 
      (resumo.por_tipo[justificativa.tipo] || 0) + 1;
    
    // Agrupar por funcionário
    const funcionarioId = justificativa.funcionario_id;
    if (!resumo.por_funcionario[funcionarioId]) {
      resumo.por_funcionario[funcionarioId] = {
        funcionario_id: funcionarioId,
        nome: justificativa.funcionario?.nome || 'Desconhecido',
        total_justificativas: 0,
        por_status: {},
        por_tipo: {}
      };
    }
    
    resumo.por_funcionario[funcionarioId].total_justificativas++;
    resumo.por_funcionario[funcionarioId].por_status[justificativa.status] = 
      (resumo.por_funcionario[funcionarioId].por_status[justificativa.status] || 0) + 1;
    resumo.por_funcionario[funcionarioId].por_tipo[justificativa.tipo] = 
      (resumo.por_funcionario[funcionarioId].por_tipo[justificativa.tipo] || 0) + 1;
  });

  return resumo;
}
```

#### **calcularTendenciaMensal:**
```javascript
async function calcularTendenciaMensal(mes, ano) {
  const mesAnterior = mes === 1 ? 12 : mes - 1;
  const anoAnterior = mes === 1 ? ano - 1 : ano;
  
  const dataInicioAnterior = `${anoAnterior}-${mesAnterior.toString().padStart(2, '0')}-01`;
  const dataFimAnterior = `${anoAnterior}-${mesAnterior.toString().padStart(2, '0')}-31`;
  
  const { data: justificativasAnterior } = await supabaseAdmin
    .from('justificativas')
    .select('id')
    .gte('data', dataInicioAnterior)
    .lte('data', dataFimAnterior);
  
  const totalAnterior = justificativasAnterior?.length || 0;
  
  return {
    total_anterior: totalAnterior,
    crescimento_percentual: 0, // Será calculado com dados atuais
    comparacao: `+${0} justificativas` // Será calculado com dados atuais
  };
}
```

### **3. Implementação dos Endpoints**

#### **Relatório Mensal:**
```javascript
router.get('/relatorios/justificativas/mensal', async (req, res) => {
  try {
    const { funcionario_id, mes, ano, obra_id, status, tipo } = req.query;

    if (!mes || !ano) {
      return res.status(400).json({
        success: false,
        message: 'Mês e ano são obrigatórios'
      });
    }

    const dataInicio = `${ano}-${mes.padStart(2, '0')}-01`;
    const dataFim = `${ano}-${mes.padStart(2, '0')}-31`;

    let query = supabaseAdmin
      .from('justificativas')
      .select(`
        *,
        funcionario:funcionarios!fk_justificativas_funcionario(nome, cargo, turno, obra_atual_id),
        aprovador:usuarios!justificativas_aprovado_por_fkey(nome)
      `)
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: true });

    // Aplicar filtros
    if (funcionario_id) query = query.eq('funcionario_id', funcionario_id);
    if (obra_id) query = query.eq('funcionario.obra_atual_id', obra_id);
    if (status) query = query.eq('status', status);
    if (tipo) query = query.eq('tipo', tipo);

    const { data: justificativas, error } = await query;

    if (error) {
      console.error('Erro ao buscar justificativas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // Calcular resumo
    const resumo = calcularResumoJustificativas(justificativas || [], dataInicio, dataFim);
    
    // Calcular tendência mensal
    const tendencia = await calcularTendenciaMensal(parseInt(mes), parseInt(ano));
    resumo.tendencia_mensal = tendencia;

    res.json({
      success: true,
      data: {
        periodo: {
          mes: parseInt(mes),
          ano: parseInt(ano),
          data_inicio: dataInicio,
          data_fim: dataFim
        },
        resumo,
        justificativas: justificativas || []
      }
    });

  } catch (error) {
    console.error('Erro na rota de relatório mensal de justificativas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});
```

---

## 📋 Checklist de Implementação

### **Prioridade Alta:**
- [ ] **Relatório Mensal** (`/relatorios/justificativas/mensal`)
- [ ] **Função calcularResumoJustificativas**
- [ ] **Validação de parâmetros**
- [ ] **Documentação Swagger**

### **Prioridade Média:**
- [ ] **Relatório por Período** (`/relatorios/justificativas/periodo`)
- [ ] **Função calcularTendenciaMensal**
- [ ] **Filtros por obra**
- [ ] **Agrupamento de dados**

### **Prioridade Baixa:**
- [ ] **Relatório de Estatísticas** (`/relatorios/justificativas/estatisticas`)
- [ ] **Análise de tendências**
- [ ] **Métricas avançadas**
- [ ] **Testes de integração**

---

## 🎯 Benefícios Esperados

### **Para o Frontend:**
- ✅ **Relatórios prontos** com dados agregados
- ✅ **Performance melhorada** (menos processamento no frontend)
- ✅ **Dados consistentes** e validados

### **Para o Backend:**
- ✅ **Consultas otimizadas** no banco de dados
- ✅ **Reutilização de código** com funções utilitárias
- ✅ **Escalabilidade** para grandes volumes

### **Para o Usuário:**
- ✅ **Relatórios instantâneos** de justificativas
- ✅ **Análises gerenciais** detalhadas
- ✅ **Insights de tendências** e padrões

---

## 📝 Documentação Swagger

### **Exemplo de documentação para o endpoint mensal:**

```javascript
/**
 * @swagger
 * /api/ponto-eletronico/relatorios/justificativas/mensal:
 *   get:
 *     summary: Gera relatório mensal de justificativas
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mes
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Mês do relatório (1-12)
 *       - in: query
 *         name: ano
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ano do relatório
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário para filtrar
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: ID da obra para filtrar
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pendente, Aprovada, Rejeitada]
 *         description: Status das justificativas
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [Atraso, Falta, Saída Antecipada, Ausência Parcial]
 *         description: Tipo das justificativas
 *     responses:
 *       200:
 *         description: Relatório mensal de justificativas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     periodo:
 *                       type: object
 *                       properties:
 *                         mes:
 *                           type: integer
 *                         ano:
 *                           type: integer
 *                         data_inicio:
 *                           type: string
 *                           format: date
 *                         data_fim:
 *                           type: string
 *                           format: date
 *                     resumo:
 *                       type: object
 *                       description: Resumo das justificativas
 *                     justificativas:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Lista de justificativas
 *       400:
 *         description: Mês e ano são obrigatórios
 *       500:
 *         description: Erro interno do servidor
 */
```

---

## 🚀 Conclusão

A implementação desses endpoints de relatório de justificativas irá completar o sistema de relatórios do ponto eletrônico, fornecendo dados agregados e estatísticas essenciais para análises gerenciais e tomada de decisões.

A implementação deve seguir a mesma estrutura e padrões dos relatórios mensais de ponto já existentes, garantindo consistência e facilidade de manutenção.
