# Endpoint Espelho de Ponto - Backend
## Solicitação de Implementação - 19/12/2024

## 📋 Resumo

Este documento solicita a implementação de um endpoint específico para **espelho de ponto** no sistema de ponto eletrônico, pois atualmente o frontend está tentando acessar uma rota que não existe.

## 🚨 Problema Atual

### **Erro Identificado:**
```json
{
  "error": "Rota não encontrada",
  "path": "/api/ponto-eletronico/espelho-ponto?funcionario_id=87&mes=10&ano=2025",
  "method": "GET"
}
```

### **Situação:**
- ❌ **Endpoint não existe**: `/api/ponto-eletronico/espelho-ponto`
- ✅ **Frontend está chamando**: Mas a rota não foi implementada
- ✅ **Endpoint genérico existe**: `/api/ponto-eletronico/registros` (mas não atende especificamente o espelho)

## 🎯 Objetivo

Criar um endpoint específico para **espelho de ponto** que forneça dados otimizados para visualização mensal dos registros de ponto de um funcionário.

## 🚀 Endpoint Solicitado

### **Rota:**
```
GET /api/ponto-eletronico/espelho-ponto
```

### **Parâmetros:**
- `funcionario_id` (obrigatório): ID do funcionário
- `mes` (obrigatório): Mês do espelho (1-12)
- `ano` (obrigatório): Ano do espelho
- `obra_id` (opcional): ID da obra para filtrar

### **Exemplo de uso:**
```
GET /api/ponto-eletronico/espelho-ponto?funcionario_id=87&mes=10&ano=2025
```

### **Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "funcionario": {
      "id": 87,
      "nome": "João Silva",
      "cargo": "Operador",
      "turno": "Manhã",
      "obra_atual": {
        "id": 1,
        "nome": "Obra Central"
      }
    },
    "periodo": {
      "mes": 10,
      "ano": 2025,
      "data_inicio": "2025-10-01",
      "data_fim": "2025-10-31",
      "dias_uteis": 22,
      "dias_totais": 31
    },
    "resumo": {
      "total_dias_trabalhados": 20,
      "total_horas_trabalhadas": 160.5,
      "total_horas_extras": 12.5,
      "total_atrasos": 2,
      "total_faltas": 1,
      "media_horas_dia": 8.03,
      "taxa_presenca": 90.9
    },
    "registros": [
      {
        "id": "reg_123",
        "data": "2025-10-01",
        "dia_semana": "Segunda-feira",
        "entrada": "08:00",
        "saida_almoco": "12:00",
        "volta_almoco": "13:00",
        "saida": "17:00",
        "horas_trabalhadas": 8.0,
        "horas_extras": 0.0,
        "status": "Completo",
        "observacoes": "",
        "localizacao": "Obra Central",
        "justificativas": []
      },
      {
        "id": "reg_124",
        "data": "2025-10-02",
        "dia_semana": "Terça-feira",
        "entrada": "08:15",
        "saida_almoco": "12:00",
        "volta_almoco": "13:00",
        "saida": "17:30",
        "horas_trabalhadas": 8.25,
        "horas_extras": 0.25,
        "status": "Pendente Aprovação",
        "observacoes": "Atraso por trânsito",
        "localizacao": "Obra Central",
        "justificativas": [
          {
            "id": "just_123",
            "tipo": "Atraso",
            "motivo": "Trânsito congestionado",
            "status": "Aprovada",
            "data_aprovacao": "2025-10-02T10:00:00Z"
          }
        ]
      }
    ],
    "estatisticas_mensais": {
      "por_dia_semana": {
        "Segunda": { "dias": 5, "horas_media": 8.1 },
        "Terça": { "dias": 4, "horas_media": 8.0 },
        "Quarta": { "dias": 4, "horas_media": 7.9 },
        "Quinta": { "dias": 4, "horas_media": 8.2 },
        "Sexta": { "dias": 3, "horas_media": 8.0 }
      },
      "tendencia_semanal": {
        "semana_1": { "horas": 40.5, "extras": 2.0 },
        "semana_2": { "horas": 40.0, "extras": 0.0 },
        "semana_3": { "horas": 40.25, "extras": 0.25 },
        "semana_4": { "horas": 39.75, "extras": 0.0 }
      }
    }
  }
}
```

## 🔧 Implementação Técnica

### **1. Estrutura do Endpoint**

```javascript
/**
 * @swagger
 * /api/ponto-eletronico/espelho-ponto:
 *   get:
 *     summary: Gera espelho de ponto mensal para funcionário
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: funcionario_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do funcionário
 *       - in: query
 *         name: mes
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Mês do espelho (1-12)
 *       - in: query
 *         name: ano
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ano do espelho
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: ID da obra para filtrar
 *     responses:
 *       200:
 *         description: Espelho de ponto mensal
 *       400:
 *         description: Parâmetros obrigatórios não fornecidos
 *       404:
 *         description: Funcionário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/espelho-ponto', async (req, res) => {
  try {
    const { funcionario_id, mes, ano, obra_id } = req.query;

    // Validações
    if (!funcionario_id || !mes || !ano) {
      return res.status(400).json({
        success: false,
        message: 'funcionario_id, mes e ano são obrigatórios'
      });
    }

    // Validar mês
    const mesNum = parseInt(mes);
    if (mesNum < 1 || mesNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'Mês deve estar entre 1 e 12'
      });
    }

    // Calcular período
    const dataInicio = `${ano}-${mes.padStart(2, '0')}-01`;
    const dataFim = `${ano}-${mes.padStart(2, '0')}-31`;

    // Buscar dados do funcionário
    const { data: funcionario, error: funcionarioError } = await supabaseAdmin
      .from('funcionarios')
      .select(`
        id, nome, cargo, turno, obra_atual_id,
        obra_atual:obras!funcionarios_obra_atual_id_fkey(id, nome)
      `)
      .eq('id', funcionario_id)
      .eq('status', 'Ativo')
      .single();

    if (funcionarioError || !funcionario) {
      return res.status(404).json({
        success: false,
        message: 'Funcionário não encontrado ou inativo'
      });
    }

    // Buscar registros do período
    let query = supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        justificativas:justificativas!fk_justificativas_registro_ponto(
          id, tipo, motivo, status, data_aprovacao
        )
      `)
      .eq('funcionario_id', funcionario_id)
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: true });

    // Aplicar filtro de obra se fornecido
    if (obra_id) {
      query = query.eq('funcionario.obra_atual_id', obra_id);
    }

    const { data: registros, error: registrosError } = await query;

    if (registrosError) {
      console.error('Erro ao buscar registros:', registrosError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // Calcular resumo e estatísticas
    const resumo = calcularResumoEspelho(registros || [], dataInicio, dataFim);
    const estatisticas = calcularEstatisticasEspelho(registros || []);

    // Formatar registros com informações adicionais
    const registrosFormatados = (registros || []).map(registro => ({
      ...registro,
      dia_semana: formatarDiaSemana(registro.data),
      justificativas: registro.justificativas || []
    }));

    res.json({
      success: true,
      data: {
        funcionario: {
          id: funcionario.id,
          nome: funcionario.nome,
          cargo: funcionario.cargo,
          turno: funcionario.turno,
          obra_atual: funcionario.obra_atual
        },
        periodo: {
          mes: parseInt(mes),
          ano: parseInt(ano),
          data_inicio: dataInicio,
          data_fim: dataFim,
          dias_uteis: calcularDiasUteis(dataInicio, dataFim),
          dias_totais: new Date(parseInt(ano), parseInt(mes), 0).getDate()
        },
        resumo,
        registros: registrosFormatados,
        estatisticas_mensais: estatisticas
      }
    });

  } catch (error) {
    console.error('Erro na rota de espelho de ponto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});
```

### **2. Funções Utilitárias Necessárias**

#### **calcularResumoEspelho:**
```javascript
function calcularResumoEspelho(registros, dataInicio, dataFim) {
  const resumo = {
    total_dias_trabalhados: 0,
    total_horas_trabalhadas: 0,
    total_horas_extras: 0,
    total_atrasos: 0,
    total_faltas: 0,
    media_horas_dia: 0,
    taxa_presenca: 0
  };

  registros.forEach(registro => {
    if (registro.entrada) {
      resumo.total_dias_trabalhados++;
      resumo.total_horas_trabalhadas += parseFloat(registro.horas_trabalhadas || 0);
      resumo.total_horas_extras += parseFloat(registro.horas_extras || 0);
      
      if (registro.status === 'Atraso') {
        resumo.total_atrasos++;
      }
    } else {
      resumo.total_faltas++;
    }
  });

  // Calcular médias
  if (resumo.total_dias_trabalhados > 0) {
    resumo.media_horas_dia = resumo.total_horas_trabalhadas / resumo.total_dias_trabalhados;
  }

  const diasUteis = calcularDiasUteis(dataInicio, dataFim);
  resumo.taxa_presenca = (resumo.total_dias_trabalhados / diasUteis) * 100;

  return resumo;
}
```

#### **calcularEstatisticasEspelho:**
```javascript
function calcularEstatisticasEspelho(registros) {
  const estatisticas = {
    por_dia_semana: {},
    tendencia_semanal: {}
  };

  // Agrupar por dia da semana
  registros.forEach(registro => {
    const diaSemana = formatarDiaSemana(registro.data);
    if (!estatisticas.por_dia_semana[diaSemana]) {
      estatisticas.por_dia_semana[diaSemana] = {
        dias: 0,
        horas_total: 0,
        horas_media: 0
      };
    }
    
    if (registro.entrada) {
      estatisticas.por_dia_semana[diaSemana].dias++;
      estatisticas.por_dia_semana[diaSemana].horas_total += parseFloat(registro.horas_trabalhadas || 0);
    }
  });

  // Calcular médias por dia da semana
  Object.keys(estatisticas.por_dia_semana).forEach(dia => {
    const dados = estatisticas.por_dia_semana[dia];
    dados.horas_media = dados.dias > 0 ? dados.horas_total / dados.dias : 0;
  });

  // Calcular tendência semanal
  const semanas = agruparPorSemanas(registros);
  semanas.forEach((semana, index) => {
    const totalHoras = semana.reduce((sum, r) => sum + parseFloat(r.horas_trabalhadas || 0), 0);
    const totalExtras = semana.reduce((sum, r) => sum + parseFloat(r.horas_extras || 0), 0);
    
    estatisticas.tendencia_semanal[`semana_${index + 1}`] = {
      horas: totalHoras,
      extras: totalExtras
    };
  });

  return estatisticas;
}
```

#### **Funções Auxiliares:**
```javascript
function formatarDiaSemana(data) {
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const dia = new Date(data).getDay();
  return dias[dia];
}

function calcularDiasUteis(dataInicio, dataFim) {
  let diasUteis = 0;
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  
  for (let data = new Date(inicio); data <= fim; data.setDate(data.getDate() + 1)) {
    const diaSemana = data.getDay();
    if (diaSemana >= 1 && diaSemana <= 5) { // Segunda a sexta
      diasUteis++;
    }
  }
  
  return diasUteis;
}

function agruparPorSemanas(registros) {
  const semanas = [];
  let semanaAtual = [];
  let semanaAnterior = null;
  
  registros.forEach(registro => {
    const data = new Date(registro.data);
    const semana = Math.ceil(data.getDate() / 7);
    
    if (semanaAnterior !== null && semana !== semanaAnterior) {
      semanas.push([...semanaAtual]);
      semanaAtual = [];
    }
    
    semanaAtual.push(registro);
    semanaAnterior = semana;
  });
  
  if (semanaAtual.length > 0) {
    semanas.push(semanaAtual);
  }
  
  return semanas;
}
```

## 📊 Diferenças do Endpoint Genérico

### **Endpoint Genérico (`/registros`):**
- ✅ Lista registros com filtros básicos
- ✅ Paginação simples
- ❌ Não calcula resumos
- ❌ Não agrupa por período
- ❌ Não inclui estatísticas

### **Endpoint Espelho (`/espelho-ponto`):**
- ✅ **Dados específicos** para espelho mensal
- ✅ **Resumos calculados** (totais, médias, taxas)
- ✅ **Estatísticas por dia da semana**
- ✅ **Tendências semanais**
- ✅ **Informações do funcionário** incluídas
- ✅ **Justificativas** relacionadas
- ✅ **Dados formatados** para visualização

## 🎯 Benefícios da Implementação

### **Para o Frontend:**
- ✅ **Dados prontos** para exibição
- ✅ **Performance melhorada** (menos processamento)
- ✅ **Informações completas** em uma única chamada

### **Para o Backend:**
- ✅ **Endpoint específico** para espelho
- ✅ **Consultas otimizadas** para esse uso
- ✅ **Reutilização de funções** utilitárias

### **Para o Usuário:**
- ✅ **Espelho completo** em uma página
- ✅ **Estatísticas detalhadas** do mês
- ✅ **Visualização otimizada** dos dados

## 📋 Checklist de Implementação

### **Prioridade Alta:**
- [ ] **Endpoint básico** `/espelho-ponto`
- [ ] **Validações** de parâmetros
- [ ] **Busca de registros** com filtros
- [ ] **Cálculo de resumo** básico

### **Prioridade Média:**
- [ ] **Funções utilitárias** (resumo, estatísticas)
- [ ] **Formatação de dados** (dia da semana, etc.)
- [ ] **Documentação Swagger**

### **Prioridade Baixa:**
- [ ] **Estatísticas avançadas** (tendências)
- [ ] **Otimizações** de performance
- [ ] **Testes de integração**

## 🚀 Conclusão

A implementação deste endpoint específico para espelho de ponto irá resolver o erro atual e fornecer uma funcionalidade otimizada para visualização mensal dos registros de ponto, com dados agregados e estatísticas essenciais para análise do funcionário.

O endpoint deve seguir os mesmos padrões dos outros endpoints do sistema e incluir validações adequadas e tratamento de erros.
