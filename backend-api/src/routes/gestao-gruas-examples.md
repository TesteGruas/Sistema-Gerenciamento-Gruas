# Gestão Dinâmica de Gruas - Exemplos de Uso

## 📋 Visão Geral

Este documento apresenta exemplos práticos de como usar as novas funcionalidades de gestão dinâmica de gruas implementadas no backend.

## 🚀 Funcionalidades Implementadas

### 1. **Transferência de Gruas**
- Mover grua de uma obra para outra
- Validação de conflitos de agendamento
- Histórico automático de transferências
- Atualização de funcionário responsável

### 2. **Histórico de Locação**
- Rastreamento completo de onde cada grua esteve
- Estatísticas de utilização
- Relatório de receita por grua
- Filtros por período

### 3. **Disponibilidade em Tempo Real**
- Status atual de cada grua (Disponível/Ocupada)
- Verificação de disponibilidade para períodos específicos
- Filtros por tipo e capacidade
- Taxa de disponibilidade do parque

### 4. **Validação de Conflitos**
- Verificação de sobreposição de datas
- Recomendações para resolução de conflitos
- Próximas disponibilidades

## 📡 Endpoints Disponíveis

### Base URL: `/api/gestao-gruas`

---

## 🔄 **1. Transferir Grua entre Obras**

### `POST /transferir`

**Exemplo de Requisição:**
```json
{
  "grua_id": "GRU001",
  "obra_origem_id": 1,
  "obra_destino_id": 2,
  "data_transferencia": "2024-02-15",
  "funcionario_responsavel_id": 3,
  "motivo": "Finalização da obra atual",
  "observacoes": "Transferência programada conforme cronograma"
}
```

**Exemplo de Resposta:**
```json
{
  "success": true,
  "data": {
    "transferencia": {
      "id": 15,
      "grua_id": "GRU001",
      "obra_id": 2,
      "data_inicio_locacao": "2024-02-15",
      "status": "Ativa"
    },
    "grua": {
      "id": "GRU001",
      "modelo": "GT-200",
      "fabricante": "Liebherr"
    },
    "obra_origem": {
      "id": 1,
      "nome": "Edifício Residencial Alpha"
    },
    "obra_destino": {
      "id": 2,
      "nome": "Shopping Center Beta"
    },
    "funcionario_responsavel": {
      "id": 3,
      "nome": "João Silva",
      "cargo": "Operador"
    },
    "data_transferencia": "2024-02-15"
  },
  "message": "Grua GT-200 transferida com sucesso de Edifício Residencial Alpha para Shopping Center Beta"
}
```

---

## 📊 **2. Histórico de Locação**

### `GET /historico/{grua_id}`

**Exemplo de Requisição:**
```
GET /api/gestao-gruas/historico/GRU001?data_inicio=2024-01-01&data_fim=2024-12-31
```

**Exemplo de Resposta:**
```json
{
  "success": true,
  "data": {
    "grua": {
      "id": "GRU001",
      "modelo": "GT-200",
      "fabricante": "Liebherr",
      "tipo": "Grua Torre",
      "capacidade": "8 toneladas"
    },
    "locacao_atual": {
      "id": 15,
      "obra_id": 2,
      "data_inicio_locacao": "2024-02-15",
      "data_fim_locacao": null,
      "status": "Ativa",
      "obra": {
        "id": 2,
        "nome": "Shopping Center Beta",
        "endereco": "Rua das Flores, 123",
        "cidade": "São Paulo",
        "estado": "SP",
        "cliente": {
          "nome": "Construtora Beta Ltda",
          "cnpj": "12.345.678/0001-90"
        }
      }
    },
    "historico": [
      {
        "id": 1,
        "data_inicio": "2024-01-01",
        "data_fim": "2024-02-14",
        "tipo_operacao": "Início",
        "valor_locacao": 5000.00,
        "observacoes": "Locação inicial da grua",
        "obra": {
          "id": 1,
          "nome": "Edifício Residencial Alpha",
          "cliente": {
            "nome": "Construtora Alpha Ltda",
            "cnpj": "98.765.432/0001-10"
          }
        },
        "funcionario": {
          "id": 1,
          "nome": "Pedro Santos",
          "cargo": "Operador"
        }
      },
      {
        "id": 2,
        "data_inicio": "2024-02-15",
        "data_fim": null,
        "tipo_operacao": "Transferência",
        "valor_locacao": 5500.00,
        "observacoes": "Transferida de Edifício Residencial Alpha para Shopping Center Beta. Motivo: Finalização da obra atual"
      }
    ],
    "estatisticas": {
      "total_locacoes": 2,
      "dias_total_locacao": 45,
      "receita_total": 10500.00,
      "obras_visitadas": 2
    }
  }
}
```

---

## ⏰ **3. Disponibilidade em Tempo Real**

### `GET /disponibilidade`

**Exemplo de Requisição:**
```
GET /api/gestao-gruas/disponibilidade?data_inicio=2024-03-01&data_fim=2024-03-31&tipo_grua=Grua Torre&capacidade_minima=5
```

**Exemplo de Resposta:**
```json
{
  "success": true,
  "data": {
    "periodo": {
      "data_inicio": "2024-03-01",
      "data_fim": "2024-03-31"
    },
    "filtros": {
      "tipo_grua": "Grua Torre",
      "capacidade_minima": "5"
    },
    "resumo": {
      "total_gruas": 8,
      "disponiveis": 5,
      "ocupadas": 3,
      "taxa_disponibilidade": "62.50"
    },
    "gruas_disponiveis": [
      {
        "id": "GRU002",
        "modelo": "GT-150",
        "fabricante": "Potain",
        "tipo": "Grua Torre",
        "capacidade": "6 toneladas",
        "status_atual": "Disponível",
        "disponivel_periodo": true,
        "proxima_disponibilidade": null
      }
    ],
    "gruas_ocupadas": [
      {
        "id": "GRU001",
        "modelo": "GT-200",
        "fabricante": "Liebherr",
        "tipo": "Grua Torre",
        "capacidade": "8 toneladas",
        "status_atual": "Ocupada",
        "disponivel_periodo": false,
        "locacao_ativa": {
          "obra_id": 2,
          "data_inicio_locacao": "2024-02-15",
          "data_fim_locacao": "2024-04-30"
        },
        "proxima_disponibilidade": "2024-04-30"
      }
    ]
  }
}
```

### `GET /status/{grua_id}`

**Exemplo de Requisição:**
```
GET /api/gestao-gruas/status/GRU001
```

**Exemplo de Resposta:**
```json
{
  "success": true,
  "data": {
    "grua": {
      "id": "GRU001",
      "modelo": "GT-200",
      "fabricante": "Liebherr",
      "tipo": "Grua Torre",
      "capacidade": "8 toneladas",
      "status": "Operacional"
    },
    "locacao_ativa": {
      "id": 15,
      "obra_id": 2,
      "data_inicio_locacao": "2024-02-15",
      "data_fim_locacao": "2024-04-30",
      "valor_locacao_mensal": 5500.00,
      "status": "Ativa",
      "obra": {
        "id": 2,
        "nome": "Shopping Center Beta",
        "status": "Em Andamento"
      }
    },
    "status": "Ocupada",
    "proxima_disponibilidade": "2024-04-30"
  }
}
```

---

## ⚠️ **4. Validação de Conflitos**

### `POST /validar-conflitos`

**Exemplo de Requisição:**
```json
{
  "grua_id": "GRU001",
  "data_inicio": "2024-03-15",
  "data_fim": "2024-04-15",
  "obra_id": 1
}
```

**Exemplo de Resposta (Com Conflito):**
```json
{
  "success": true,
  "data": {
    "grua": {
      "id": "GRU001",
      "modelo": "GT-200",
      "fabricante": "Liebherr"
    },
    "periodo": {
      "data_inicio": "2024-03-15",
      "data_fim": "2024-04-15"
    },
    "disponivel": false,
    "conflitos": [
      {
        "id": 15,
        "data_inicio_locacao": "2024-02-15",
        "data_fim_locacao": "2024-04-30",
        "status": "Ativa"
      }
    ],
    "validacao_obra": {
      "esta_na_obra": false,
      "obra_atual": "Shopping Center Beta"
    },
    "proximas_disponibilidades": [
      {
        "data_disponivel": "2024-04-30",
        "obra_atual": "Shopping Center Beta"
      }
    ],
    "recomendacoes": [
      "Considere ajustar as datas do agendamento",
      "Verifique se há outras gruas disponíveis no período",
      "Entre em contato com a obra atual para negociar a liberação antecipada"
    ]
  }
}
```

**Exemplo de Resposta (Sem Conflito):**
```json
{
  "success": true,
  "data": {
    "grua": {
      "id": "GRU002",
      "modelo": "GT-150",
      "fabricante": "Potain"
    },
    "periodo": {
      "data_inicio": "2024-03-15",
      "data_fim": "2024-04-15"
    },
    "disponivel": true,
    "conflitos": [],
    "validacao_obra": null,
    "proximas_disponibilidades": [],
    "recomendacoes": [
      "Grua disponível para o período solicitado",
      "Pode prosseguir com o agendamento"
    ]
  }
}
```

---

## 🔧 **5. Configuração e Setup**

### `POST /setup-historico`

**Exemplo de Requisição:**
```
POST /api/gestao-gruas/setup-historico
```

**Exemplo de Resposta (Tabela não existe):**
```json
{
  "error": "Tabela não existe",
  "message": "Execute o SQL abaixo no Supabase para criar a tabela:",
  "sql": "CREATE TABLE IF NOT EXISTS historico_locacoes (...);",
  "instrucoes": [
    "1. Acesse o painel do Supabase",
    "2. Vá para SQL Editor",
    "3. Execute o SQL fornecido acima",
    "4. Teste novamente este endpoint"
  ]
}
```

**Exemplo de Resposta (Tabela configurada):**
```json
{
  "success": true,
  "message": "Tabela de histórico de locações configurada e testada com sucesso!",
  "data": {
    "tabela_existe": true,
    "teste_insercao": true,
    "teste_remocao": true
  }
}
```

---

## 🎯 **Cenários de Uso Práticos**

### **Cenário 1: Transferência Programada**
1. Verificar disponibilidade da grua: `GET /disponibilidade`
2. Validar conflitos: `POST /validar-conflitos`
3. Executar transferência: `POST /transferir`
4. Verificar histórico: `GET /historico/{grua_id}`

### **Cenário 2: Planejamento de Obra**
1. Buscar gruas disponíveis: `GET /disponibilidade`
2. Verificar status específico: `GET /status/{grua_id}`
3. Validar agendamento: `POST /validar-conflitos`

### **Cenário 3: Relatório de Utilização**
1. Obter histórico de todas as gruas
2. Calcular estatísticas de utilização
3. Identificar gruas subutilizadas

---

## 📝 **Notas Importantes**

- **Autenticação**: Todos os endpoints requerem token de autenticação
- **Validação**: Todos os dados são validados com Joi
- **Transações**: Operações críticas são executadas em transações
- **Histórico**: Todas as operações são registradas automaticamente
- **Conflitos**: Sistema previne sobreposições de datas
- **Performance**: Consultas otimizadas com índices apropriados

---

## 🚨 **Códigos de Erro Comuns**

- **400**: Dados inválidos ou conflitos de agendamento
- **401**: Token de autenticação inválido
- **404**: Grua, obra ou funcionário não encontrado
- **500**: Erro interno do servidor

---

## 🔄 **Próximos Passos**

1. **Frontend**: Criar interfaces para usar essas funcionalidades
2. **Notificações**: Implementar alertas automáticos
3. **Relatórios**: Dashboards com métricas avançadas
4. **Integrações**: APIs externas para sincronização
