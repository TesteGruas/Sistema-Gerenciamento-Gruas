# 📊 Endpoints para Tabs do Ponto Eletrônico

## 📋 Análise das Tabs e Endpoints Existentes

### 1. **Registros de Ponto** ✅ **IMPLEMENTADO**
**Tab ID**: `registros`

#### Endpoints Existentes:
- `GET /api/ponto-eletronico/registros` - Listar registros com paginação
- `GET /api/ponto-eletronico/registros/:id` - Obter registro específico
- `POST /api/ponto-eletronico/registros` - Criar novo registro
- `PUT /api/ponto-eletronico/registros/:id` - Atualizar registro
- `POST /api/ponto-eletronico/registros/:id/aprovar` - Aprovar registro
- `POST /api/ponto-eletronico/registros/:id/rejeitar` - Rejeitar registro
- `POST /api/ponto-eletronico/registros/:id/enviar-aprovacao` - Enviar para aprovação
- `GET /api/ponto-eletronico/registros/pendentes-aprovacao` - Listar pendentes

#### Status: ✅ **COMPLETO**
- Paginação implementada
- Filtros funcionando
- CRUD completo
- Aprovação/rejeição implementada

---

### 2. **Controle de Horas Extras** ⚠️ **PARCIALMENTE IMPLEMENTADO**
**Tab ID**: `horas-extras`

#### Endpoints Existentes:
- `GET /api/ponto-eletronico/registros` - Usa filtro para horas extras
- `POST /api/ponto-eletronico/registros/:id/aprovar` - Aprovar horas extras
- `POST /api/ponto-eletronico/registros/:id/rejeitar` - Rejeitar horas extras
- `GET /api/ponto-eletronico/relatorios/horas-extras` - Relatório de horas extras

#### Endpoints Faltando:
```javascript
// 1. Endpoint específico para listar apenas registros com horas extras
GET /api/ponto-eletronico/horas-extras
Query params:
- page, limit (paginação)
- funcionario_id (filtro por funcionário)
- data_inicio, data_fim (filtro por período)
- status (pendente, aprovado, rejeitado)
- ordenacao (maior, menor, data)

// 2. Endpoint para estatísticas de horas extras
GET /api/ponto-eletronico/horas-extras/estatisticas
Query params:
- periodo (mes, trimestre, ano)
- funcionario_id (opcional)

// 3. Endpoint para aprovação em lote
POST /api/ponto-eletronico/horas-extras/aprovar-lote
Body: { registro_ids: [1,2,3], observacoes: "string" }

// 4. Endpoint para rejeição em lote
POST /api/ponto-eletronico/horas-extras/rejeitar-lote
Body: { registro_ids: [1,2,3], motivo: "string" }
```

#### Status: ⚠️ **PRECISA IMPLEMENTAR**

---

### 3. **Justificativas** ✅ **IMPLEMENTADO**
**Tab ID**: `justificativas`

#### Endpoints Existentes:
- `GET /api/ponto-eletronico/justificativas` - Listar justificativas
- `POST /api/ponto-eletronico/justificativas` - Criar justificativa
- `POST /api/ponto-eletronico/justificativas/:id/aprovar` - Aprovar justificativa
- `POST /api/ponto-eletronico/justificativas/:id/rejeitar` - Rejeitar justificativa

#### Status: ✅ **COMPLETO**
- CRUD completo
- Aprovação/rejeição implementada
- Filtros funcionando

---

### 4. **Relatório Mensal** ⚠️ **PARCIALMENTE IMPLEMENTADO**
**Tab ID**: `relatorio`

#### Endpoints Existentes:
- `GET /api/ponto-eletronico/relatorios/mensal` - Relatório mensal básico
- `GET /api/relatorios-rh/` - Listar relatórios RH
- `POST /api/relatorios-rh/gerar/:tipo` - Gerar relatório específico

#### Endpoints Faltando:
```javascript
// 1. Endpoint para relatório mensal detalhado por funcionário
GET /api/ponto-eletronico/relatorios/mensal/funcionario/:id
Query params:
- mes, ano (período)
- incluir_graficos (boolean)

// 2. Endpoint para relatório de frequência
GET /api/ponto-eletronico/relatorios/frequencia
Query params:
- mes, ano (período)
- funcionario_id (opcional)
- departamento (opcional)

// 3. Endpoint para relatório de atrasos
GET /api/ponto-eletronico/relatorios/atrasos
Query params:
- mes, ano (período)
- funcionario_id (opcional)

// 4. Endpoint para exportar relatório
GET /api/ponto-eletronico/relatorios/exportar
Query params:
- tipo (pdf, excel, csv)
- formato (mensal, semanal, diario)
- periodo (mes, ano)
```

#### Status: ⚠️ **PRECISA IMPLEMENTAR**

---

### 5. **Gráficos Visuais** ❌ **NÃO IMPLEMENTADO**
**Tab ID**: `graficos`

#### Endpoints Existentes:
- Nenhum endpoint específico para gráficos

#### Endpoints Necessários:
```javascript
// 1. Endpoint para dados de gráfico de horas trabalhadas
GET /api/ponto-eletronico/graficos/horas-trabalhadas
Query params:
- periodo (semana, mes, trimestre, ano)
- funcionario_id (opcional)
- agrupamento (dia, semana, mes)

// 2. Endpoint para gráfico de frequência
GET /api/ponto-eletronico/graficos/frequencia
Query params:
- periodo (mes, trimestre, ano)
- funcionario_id (opcional)

// 3. Endpoint para gráfico de status
GET /api/ponto-eletronico/graficos/status
Query params:
- periodo (mes, trimestre, ano)
- agrupamento (funcionario, departamento, cargo)

// 4. Endpoint para gráfico de horas extras
GET /api/ponto-eletronico/graficos/horas-extras
Query params:
- periodo (mes, trimestre, ano)
- funcionario_id (opcional)
- agrupamento (dia, semana, mes)

// 5. Endpoint para gráfico de atrasos
GET /api/ponto-eletronico/graficos/atrasos
Query params:
- periodo (mes, trimestre, ano)
- funcionario_id (opcional)

// 6. Endpoint para dashboard geral
GET /api/ponto-eletronico/graficos/dashboard
Query params:
- periodo (hoje, semana, mes, trimestre, ano)
```

#### Status: ❌ **PRECISA IMPLEMENTAR TUDO**

---

## 🚀 Plano de Implementação

### **Prioridade 1: Gráficos Visuais** (Tab `graficos`)
```javascript
// Arquivo: backend-api/src/routes/ponto-eletronico-graficos.js
import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// 1. Dados para gráfico de horas trabalhadas
router.get('/horas-trabalhadas', async (req, res) => {
  // Implementar lógica para buscar dados de horas trabalhadas
  // Retornar dados no formato esperado pelos gráficos
});

// 2. Dados para gráfico de frequência
router.get('/frequencia', async (req, res) => {
  // Implementar lógica para buscar dados de frequência
  // Retornar dados no formato esperado pelos gráficos
});

// 3. Dados para gráfico de status
router.get('/status', async (req, res) => {
  // Implementar lógica para buscar dados de status
  // Retornar dados no formato esperado pelos gráficos
});

// 4. Dados para gráfico de horas extras
router.get('/horas-extras', async (req, res) => {
  // Implementar lógica para buscar dados de horas extras
  // Retornar dados no formato esperado pelos gráficos
});

// 5. Dados para gráfico de atrasos
router.get('/atrasos', async (req, res) => {
  // Implementar lógica para buscar dados de atrasos
  // Retornar dados no formato esperado pelos gráficos
});

// 6. Dashboard geral
router.get('/dashboard', async (req, res) => {
  // Implementar lógica para buscar dados do dashboard
  // Retornar dados no formato esperado pelos gráficos
});

export default router;
```

### **Prioridade 2: Controle de Horas Extras** (Tab `horas-extras`)
```javascript
// Adicionar ao arquivo: backend-api/src/routes/ponto-eletronico.js

// 1. Endpoint específico para horas extras
router.get('/horas-extras', async (req, res) => {
  // Implementar lógica para buscar apenas registros com horas extras
  // Incluir paginação e filtros
});

// 2. Estatísticas de horas extras
router.get('/horas-extras/estatisticas', async (req, res) => {
  // Implementar lógica para calcular estatísticas
  // Retornar dados agregados
});

// 3. Aprovação em lote
router.post('/horas-extras/aprovar-lote', async (req, res) => {
  // Implementar lógica para aprovar múltiplos registros
  // Incluir validações e logs
});

// 4. Rejeição em lote
router.post('/horas-extras/rejeitar-lote', async (req, res) => {
  // Implementar lógica para rejeitar múltiplos registros
  // Incluir validações e logs
});
```

### **Prioridade 3: Relatório Mensal** (Tab `relatorio`)
```javascript
// Adicionar ao arquivo: backend-api/src/routes/ponto-eletronico.js

// 1. Relatório mensal detalhado por funcionário
router.get('/relatorios/mensal/funcionario/:id', async (req, res) => {
  // Implementar lógica para relatório detalhado
  // Incluir dados de frequência, horas, atrasos, etc.
});

// 2. Relatório de frequência
router.get('/relatorios/frequencia', async (req, res) => {
  // Implementar lógica para relatório de frequência
  // Incluir dados de presença, faltas, atrasos
});

// 3. Relatório de atrasos
router.get('/relatorios/atrasos', async (req, res) => {
  // Implementar lógica para relatório de atrasos
  // Incluir análise de padrões
});

// 4. Exportar relatório
router.get('/relatorios/exportar', async (req, res) => {
  // Implementar lógica para exportar relatórios
  // Suportar PDF, Excel, CSV
});
```

---

## 📊 Estrutura de Dados para Gráficos

### **Horas Trabalhadas**
```javascript
{
  "success": true,
  "data": [
    {
      "dia": "Seg",
      "horas": 8.5,
      "extras": 0.5,
      "data": "2024-01-15"
    },
    // ... mais dados
  ],
  "periodo": {
    "inicio": "2024-01-15",
    "fim": "2024-01-21"
  }
}
```

### **Frequência**
```javascript
{
  "success": true,
  "data": [
    {
      "mes": "Jan",
      "presencas": 22,
      "faltas": 1,
      "atrasos": 3,
      "horas_extras": 8.5
    },
    // ... mais dados
  ]
}
```

### **Status**
```javascript
{
  "success": true,
  "data": [
    {
      "funcionario": "João Silva",
      "horas": 44,
      "status": "completo",
      "departamento": "Operações"
    },
    // ... mais dados
  ]
}
```

---

## 🔧 Configuração no Frontend

### **1. Atualizar API Client**
```typescript
// lib/api-ponto-eletronico.ts
export const apiGraficos = {
  async getHorasTrabalhadas(params: any) {
    return apiRequest(`${API_BASE_URL}/api/ponto-eletronico/graficos/horas-trabalhadas`, {
      method: 'GET',
      params
    });
  },
  
  async getFrequencia(params: any) {
    return apiRequest(`${API_BASE_URL}/api/ponto-eletronico/graficos/frequencia`, {
      method: 'GET',
      params
    });
  },
  
  async getStatus(params: any) {
    return apiRequest(`${API_BASE_URL}/api/ponto-eletronico/graficos/status`, {
      method: 'GET',
      params
    });
  },
  
  async getHorasExtras(params: any) {
    return apiRequest(`${API_BASE_URL}/api/ponto-eletronico/graficos/horas-extras`, {
      method: 'GET',
      params
    });
  },
  
  async getAtrasos(params: any) {
    return apiRequest(`${API_BASE_URL}/api/ponto-eletronico/graficos/atrasos`, {
      method: 'GET',
      params
    });
  },
  
  async getDashboard(params: any) {
    return apiRequest(`${API_BASE_URL}/api/ponto-eletronico/graficos/dashboard`, {
      method: 'GET',
      params
    });
  }
};
```

### **2. Atualizar Componente de Gráficos**
```typescript
// app/dashboard/ponto/page.tsx - Tab graficos
const [dadosGraficos, setDadosGraficos] = useState({
  horasTrabalhadas: [],
  frequencia: [],
  statusFuncionarios: [],
  distribuicaoHoras: []
});

useEffect(() => {
  const carregarDadosGraficos = async () => {
    try {
      const [horasTrabalhadas, frequencia, status, horasExtras, atrasos] = await Promise.all([
        apiGraficos.getHorasTrabalhadas({ periodo: 'semana' }),
        apiGraficos.getFrequencia({ periodo: 'mes' }),
        apiGraficos.getStatus({ periodo: 'mes' }),
        apiGraficos.getHorasExtras({ periodo: 'mes' }),
        apiGraficos.getAtrasos({ periodo: 'mes' })
      ]);
      
      setDadosGraficos({
        horasTrabalhadas: horasTrabalhadas.data || [],
        frequencia: frequencia.data || [],
        statusFuncionarios: status.data || [],
        distribuicaoHoras: horasExtras.data || []
      });
    } catch (error) {
      console.error('Erro ao carregar dados dos gráficos:', error);
    }
  };
  
  carregarDadosGraficos();
}, []);
```

---

## 📝 Resumo de Implementação

| Tab | Status Atual | Endpoints Faltando | Prioridade |
|-----|-------------|-------------------|------------|
| **Registros de Ponto** | ✅ Completo | 0 | - |
| **Justificativas** | ✅ Completo | 0 | - |
| **Controle de Horas Extras** | ⚠️ Parcial | 4 | Alta |
| **Relatório Mensal** | ⚠️ Parcial | 4 | Média |
| **Gráficos Visuais** | ❌ Nenhum | 6 | Alta |

### **Próximos Passos:**
1. **Implementar endpoints de gráficos** (Prioridade 1)
2. **Implementar endpoints de horas extras** (Prioridade 2)
3. **Implementar endpoints de relatórios** (Prioridade 3)
4. **Atualizar frontend** para usar os novos endpoints
5. **Testar integração** completa

---

## 🎯 Benefícios da Implementação

### **Gráficos Visuais:**
- 📊 Visualização clara de dados
- 📈 Análise de tendências
- 🎨 Interface mais atrativa
- 📱 Responsividade completa

### **Controle de Horas Extras:**
- ⚡ Aprovação em lote
- 📊 Estatísticas detalhadas
- 🔍 Filtros avançados
- 📈 Relatórios específicos

### **Relatório Mensal:**
- 📄 Relatórios detalhados
- 📊 Exportação em múltiplos formatos
- 🔍 Análise por funcionário
- 📈 Métricas de performance

---

**Total de Endpoints a Implementar: 14**
**Tempo Estimado: 2-3 dias**
**Complexidade: Média**
