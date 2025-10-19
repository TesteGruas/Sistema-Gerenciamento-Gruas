# Melhorias Backend - 19/12/2024
## Integração Completa de Filtros - Sistema de Ponto Eletrônico

## 📋 Resumo

Este documento lista as melhorias necessárias no backend para ter uma integração completa dos filtros do sistema de ponto eletrônico, incluindo busca textual, ordenação avançada e filtros adicionais.

## 🎯 Objetivo

Completar a integração dos filtros implementados no frontend, garantindo que todas as funcionalidades de filtragem sejam processadas no backend para melhor performance e experiência do usuário.

## 🔧 Melhorias Necessárias

### **1. Busca Textual no Endpoint de Registros**

#### **Problema Atual:**
- ❌ Frontend envia parâmetro `search` mas backend não suporta
- ❌ Busca textual é feita apenas no frontend (ineficiente)
- ❌ Não aproveita índices do banco de dados

#### **Solução Proposta:**
```javascript
// Adicionar no endpoint GET /api/ponto-eletronico/registros
router.get('/registros', async (req, res) => {
  try {
    const { 
      funcionario_id, 
      data_inicio, 
      data_fim, 
      status, 
      search, // ← NOVO PARÂMETRO
      page = 1, 
      limit = 50 
    } = req.query;

    let query = supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno),
        aprovador:usuarios!registros_ponto_aprovado_por_fkey(nome)
      `)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false });

    // Aplicar filtros existentes
    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id);
    }

    if (data_inicio) {
      query = query.gte('data', data_inicio);
    }

    if (data_fim) {
      query = query.lte('data', data_fim);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // NOVO: Aplicar busca textual
    if (search) {
      query = query.or(`
        funcionario.nome.ilike.%${search}%,
        data.ilike.%${search}%,
        status.ilike.%${search}%,
        observacoes.ilike.%${search}%
      `);
    }

    // Resto da implementação...
  } catch (error) {
    // Tratamento de erro...
  }
});
```

#### **Arquivo a Modificar:**
- `backend-api/src/routes/ponto-eletronico.js` (linha ~269)

---

### **2. Ordenação Avançada no Backend**

#### **Problema Atual:**
- ❌ Ordenação é feita apenas no frontend
- ❌ Não aproveita índices do banco de dados
- ❌ Performance degradada com muitos registros

#### **Solução Proposta:**
```javascript
// Adicionar parâmetros de ordenação
const { 
  funcionario_id, 
  data_inicio, 
  data_fim, 
  status, 
  search,
  order_by = 'data', // ← NOVO: Campo para ordenação
  order_direction = 'desc', // ← NOVO: Direção da ordenação
  page = 1, 
  limit = 50 
} = req.query;

// Mapear campos de ordenação válidos
const validOrderFields = {
  'data': 'data',
  'funcionario': 'funcionario.nome',
  'horas_trabalhadas': 'horas_trabalhadas',
  'horas_extras': 'horas_extras',
  'status': 'status',
  'created_at': 'created_at'
};

// Aplicar ordenação
if (validOrderFields[order_by]) {
  const ascending = order_direction === 'asc';
  query = query.order(validOrderFields[order_by], { ascending });
} else {
  // Ordenação padrão
  query = query.order('data', { ascending: false });
}
```

#### **Campos de Ordenação Suportados:**
- `data`: Data do registro
- `funcionario`: Nome do funcionário
- `horas_trabalhadas`: Horas trabalhadas
- `horas_extras`: Horas extras
- `status`: Status do registro
- `created_at`: Data de criação

#### **Arquivo a Modificar:**
- `backend-api/src/routes/ponto-eletronico.js` (linha ~269)

---

### **3. Filtros Adicionais**

#### **3.1 Filtro por Obra**
```javascript
// Adicionar parâmetro obra_id
const { 
  funcionario_id, 
  data_inicio, 
  data_fim, 
  status, 
  search,
  obra_id, // ← NOVO: Filtro por obra
  order_by = 'data',
  order_direction = 'desc',
  page = 1, 
  limit = 50 
} = req.query;

// Aplicar filtro por obra
if (obra_id) {
  query = query.eq('funcionario.obra_atual_id', obra_id);
}
```

#### **3.2 Filtro por Cargo**
```javascript
// Adicionar parâmetro cargo
const { 
  funcionario_id, 
  data_inicio, 
  data_fim, 
  status, 
  search,
  obra_id,
  cargo, // ← NOVO: Filtro por cargo
  order_by = 'data',
  order_direction = 'desc',
  page = 1, 
  limit = 50 
} = req.query;

// Aplicar filtro por cargo
if (cargo) {
  query = query.eq('funcionario.cargo', cargo);
}
```

#### **3.3 Filtro por Turno**
```javascript
// Adicionar parâmetro turno
const { 
  funcionario_id, 
  data_inicio, 
  data_fim, 
  status, 
  search,
  obra_id,
  cargo,
  turno, // ← NOVO: Filtro por turno
  order_by = 'data',
  order_direction = 'desc',
  page = 1, 
  limit = 50 
} = req.query;

// Aplicar filtro por turno
if (turno) {
  query = query.eq('funcionario.turno', turno);
}
```

#### **3.4 Filtro por Horas Extras (Range)**
```javascript
// Adicionar parâmetros de horas extras
const { 
  funcionario_id, 
  data_inicio, 
  data_fim, 
  status, 
  search,
  obra_id,
  cargo,
  turno,
  horas_extras_min, // ← NOVO: Mínimo de horas extras
  horas_extras_max, // ← NOVO: Máximo de horas extras
  order_by = 'data',
  order_direction = 'desc',
  page = 1, 
  limit = 50 
} = req.query;

// Aplicar filtros de horas extras
if (horas_extras_min !== undefined) {
  query = query.gte('horas_extras', horas_extras_min);
}

if (horas_extras_max !== undefined) {
  query = query.lte('horas_extras', horas_extras_max);
}
```

---

### **4. Documentação Swagger Atualizada**

#### **4.1 Parâmetros de Query Atualizados:**
```javascript
/**
 * @swagger
 * /api/ponto-eletronico/registros:
 *   get:
 *     summary: Lista registros de ponto com filtros opcionais
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário para filtrar
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do período (YYYY-MM-DD)
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do período (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Normal, Pendente Aprovação, Aprovado, Rejeitado, Em Andamento]
 *         description: Status do registro
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca textual (nome, data, status, observações)
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: ID da obra para filtrar
 *       - in: query
 *         name: cargo
 *         schema:
 *           type: string
 *         description: Cargo do funcionário
 *       - in: query
 *         name: turno
 *         schema:
 *           type: string
 *         description: Turno do funcionário
 *       - in: query
 *         name: horas_extras_min
 *         schema:
 *           type: number
 *         description: Mínimo de horas extras
 *       - in: query
 *         name: horas_extras_max
 *         schema:
 *           type: number
 *         description: Máximo de horas extras
 *       - in: query
 *         name: order_by
 *         schema:
 *           type: string
 *           enum: [data, funcionario, horas_trabalhadas, horas_extras, status, created_at]
 *           default: data
 *         description: Campo para ordenação
 *       - in: query
 *         name: order_direction
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Direção da ordenação
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limite de registros por página
 */
```

---

### **5. Validação de Parâmetros**

#### **5.1 Validação de Ordenação:**
```javascript
// Validar parâmetros de ordenação
const validOrderFields = {
  'data': 'data',
  'funcionario': 'funcionario.nome',
  'horas_trabalhadas': 'horas_trabalhadas',
  'horas_extras': 'horas_extras',
  'status': 'status',
  'created_at': 'created_at'
};

const validOrderDirections = ['asc', 'desc'];

if (order_by && !validOrderFields[order_by]) {
  return res.status(400).json({
    success: false,
    message: `Campo de ordenação inválido. Campos válidos: ${Object.keys(validOrderFields).join(', ')}`
  });
}

if (order_direction && !validOrderDirections.includes(order_direction)) {
  return res.status(400).json({
    success: false,
    message: 'Direção de ordenação inválida. Use "asc" ou "desc"'
  });
}
```

#### **5.2 Validação de Filtros Numéricos:**
```javascript
// Validar filtros de horas extras
if (horas_extras_min !== undefined) {
  const min = parseFloat(horas_extras_min);
  if (isNaN(min) || min < 0) {
    return res.status(400).json({
      success: false,
      message: 'horas_extras_min deve ser um número positivo'
    });
  }
}

if (horas_extras_max !== undefined) {
  const max = parseFloat(horas_extras_max);
  if (isNaN(max) || max < 0) {
    return res.status(400).json({
      success: false,
      message: 'horas_extras_max deve ser um número positivo'
    });
  }
}

if (horas_extras_min !== undefined && horas_extras_max !== undefined) {
  const min = parseFloat(horas_extras_min);
  const max = parseFloat(horas_extras_max);
  if (min > max) {
    return res.status(400).json({
      success: false,
      message: 'horas_extras_min não pode ser maior que horas_extras_max'
    });
  }
}
```

---

### **6. Otimizações de Performance**

#### **6.1 Índices do Banco de Dados:**
```sql
-- Índices para melhorar performance dos filtros
CREATE INDEX IF NOT EXISTS idx_registros_ponto_funcionario_id ON registros_ponto(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_registros_ponto_data ON registros_ponto(data);
CREATE INDEX IF NOT EXISTS idx_registros_ponto_status ON registros_ponto(status);
CREATE INDEX IF NOT EXISTS idx_registros_ponto_horas_extras ON registros_ponto(horas_extras);
CREATE INDEX IF NOT EXISTS idx_registros_ponto_created_at ON registros_ponto(created_at);

-- Índice composto para filtros combinados
CREATE INDEX IF NOT EXISTS idx_registros_ponto_funcionario_data ON registros_ponto(funcionario_id, data);
CREATE INDEX IF NOT EXISTS idx_registros_ponto_status_data ON registros_ponto(status, data);
```

#### **6.2 Limite de Busca Textual:**
```javascript
// Limitar busca textual para evitar consultas muito lentas
if (search && search.length < 3) {
  return res.status(400).json({
    success: false,
    message: 'Termo de busca deve ter pelo menos 3 caracteres'
  });
}
```

---

### **7. Endpoint de Estatísticas de Filtros**

#### **7.1 Novo Endpoint:**
```javascript
/**
 * @swagger
 * /api/ponto-eletronico/registros/estatisticas:
 *   get:
 *     summary: Obter estatísticas dos registros com filtros
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário para filtrar
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do período
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do período
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Status do registro
 *     responses:
 *       200:
 *         description: Estatísticas dos registros
 */
router.get('/registros/estatisticas', async (req, res) => {
  try {
    const { funcionario_id, data_inicio, data_fim, status } = req.query;

    let query = supabaseAdmin
      .from('registros_ponto')
      .select(`
        id,
        horas_trabalhadas,
        horas_extras,
        status,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno, obra_atual_id)
      `);

    // Aplicar mesmos filtros do endpoint principal
    if (funcionario_id) query = query.eq('funcionario_id', funcionario_id);
    if (data_inicio) query = query.gte('data', data_inicio);
    if (data_fim) query = query.lte('data', data_fim);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Calcular estatísticas
    const estatisticas = {
      total_registros: data.length,
      total_horas_trabalhadas: data.reduce((sum, r) => sum + (r.horas_trabalhadas || 0), 0),
      total_horas_extras: data.reduce((sum, r) => sum + (r.horas_extras || 0), 0),
      por_status: {},
      por_funcionario: {},
      por_obra: {}
    };

    // Agrupar por status
    data.forEach(registro => {
      const statusKey = registro.status || 'Indefinido';
      estatisticas.por_status[statusKey] = (estatisticas.por_status[statusKey] || 0) + 1;
    });

    // Agrupar por funcionário
    data.forEach(registro => {
      const funcionarioNome = registro.funcionario?.nome || 'Desconhecido';
      if (!estatisticas.por_funcionario[funcionarioNome]) {
        estatisticas.por_funcionario[funcionarioNome] = {
          registros: 0,
          horas_trabalhadas: 0,
          horas_extras: 0
        };
      }
      estatisticas.por_funcionario[funcionarioNome].registros++;
      estatisticas.por_funcionario[funcionarioNome].horas_trabalhadas += registro.horas_trabalhadas || 0;
      estatisticas.por_funcionario[funcionarioNome].horas_extras += registro.horas_extras || 0;
    });

    res.json({
      success: true,
      data: estatisticas
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});
```

---

### **8. Testes de Integração**

#### **8.1 Testes de Filtros:**
```javascript
// Teste de busca textual
describe('GET /api/ponto-eletronico/registros', () => {
  it('deve filtrar por busca textual', async () => {
    const response = await request(app)
      .get('/api/ponto-eletronico/registros')
      .query({ search: 'João' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  });

  it('deve ordenar por horas extras', async () => {
    const response = await request(app)
      .get('/api/ponto-eletronico/registros')
      .query({ order_by: 'horas_extras', order_direction: 'desc' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('deve filtrar por obra', async () => {
    const response = await request(app)
      .get('/api/ponto-eletronico/registros')
      .query({ obra_id: 1 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

---

## 📋 Checklist de Implementação

### **Prioridade Alta (Implementar Primeiro):**
- [ ] **Busca Textual** (`search` parameter)
- [ ] **Ordenação Avançada** (`order_by`, `order_direction`)
- [ ] **Validação de Parâmetros**
- [ ] **Documentação Swagger Atualizada**

### **Prioridade Média:**
- [ ] **Filtro por Obra** (`obra_id`)
- [ ] **Filtro por Cargo** (`cargo`)
- [ ] **Filtro por Turno** (`turno`)
- [ ] **Índices do Banco de Dados**

### **Prioridade Baixa:**
- [ ] **Filtro por Horas Extras** (`horas_extras_min`, `horas_extras_max`)
- [ ] **Endpoint de Estatísticas**
- [ ] **Testes de Integração**

---

## 🚀 Benefícios Esperados

### **Performance:**
- ✅ **Consultas mais rápidas** com índices otimizados
- ✅ **Menos dados transferidos** com filtros no backend
- ✅ **Paginação eficiente** para grandes volumes

### **Funcionalidade:**
- ✅ **Busca textual** em tempo real
- ✅ **Ordenação flexível** por qualquer campo
- ✅ **Filtros combinados** para análises precisas

### **Experiência do Usuário:**
- ✅ **Filtros instantâneos** sem recarregar página
- ✅ **Busca inteligente** em múltiplos campos
- ✅ **Ordenação personalizada** conforme necessidade

---

## 📝 Próximos Passos

1. **Implementar busca textual** (prioridade alta)
2. **Adicionar ordenação avançada** (prioridade alta)
3. **Criar índices no banco** (prioridade média)
4. **Implementar filtros adicionais** (prioridade média)
5. **Atualizar documentação** (prioridade alta)
6. **Criar testes de integração** (prioridade baixa)

---

## 🎯 Conclusão

Com essas melhorias implementadas, o sistema de filtros estará completamente integrado entre frontend e backend, oferecendo uma experiência de usuário superior e performance otimizada. A implementação deve seguir a ordem de prioridades definida para maximizar o impacto das melhorias.
