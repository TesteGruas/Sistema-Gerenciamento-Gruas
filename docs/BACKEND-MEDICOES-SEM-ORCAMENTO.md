# Backend: Implementação de Medições Mensais sem Orçamento

## Objetivo
Permitir que medições mensais sejam criadas e gerenciadas diretamente por obra, sem necessidade de ter um orçamento vinculado.

## Mudanças Necessárias

### 1. Modificação do Schema do Banco de Dados

#### 1.1. Alterar Tabela `medicoes_mensais`

**Arquivo:** `backend-api/database/migrations/YYYYMMDD_medicoes_sem_orcamento.sql`

```sql
-- Tornar orcamento_id opcional (permitir NULL)
ALTER TABLE medicoes_mensais 
  ALTER COLUMN orcamento_id DROP NOT NULL;

-- Adicionar coluna obra_id para vincular medições diretamente à obra
ALTER TABLE medicoes_mensais 
  ADD COLUMN IF NOT EXISTS obra_id INTEGER REFERENCES obras(id) ON DELETE CASCADE;

-- Criar índice para melhorar performance de consultas por obra
CREATE INDEX IF NOT EXISTS idx_medicoes_mensais_obra_id 
  ON medicoes_mensais(obra_id);

-- Atualizar constraint de unicidade para considerar obra_id
-- Remover constraint antiga se existir
ALTER TABLE medicoes_mensais 
  DROP CONSTRAINT IF EXISTS medicoes_mensais_orcamento_id_periodo_key;

-- Criar nova constraint que permite:
-- - Uma medição por orcamento/período (se orcamento_id não for NULL)
-- - Uma medição por obra/período (se obra_id não for NULL e orcamento_id for NULL)
CREATE UNIQUE INDEX IF NOT EXISTS medicoes_mensais_orcamento_periodo_unique 
  ON medicoes_mensais(orcamento_id, periodo) 
  WHERE orcamento_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS medicoes_mensais_obra_periodo_unique 
  ON medicoes_mensais(obra_id, periodo) 
  WHERE obra_id IS NOT NULL AND orcamento_id IS NULL;

-- Adicionar constraint para garantir que pelo menos um dos dois (obra_id ou orcamento_id) seja fornecido
ALTER TABLE medicoes_mensais 
  ADD CONSTRAINT medicoes_mensais_obra_ou_orcamento_check 
  CHECK (
    (obra_id IS NOT NULL AND orcamento_id IS NULL) OR 
    (obra_id IS NULL AND orcamento_id IS NOT NULL) OR
    (obra_id IS NOT NULL AND orcamento_id IS NOT NULL)
  );
```

### 2. Atualização dos Schemas de Validação

#### 2.1. Arquivo: `backend-api/src/schemas/medicao-mensal-schemas.js`

```javascript
// Atualizar medicaoMensalSchema
const medicaoMensalSchema = Joi.object({
  // orcamento_id agora é opcional
  orcamento_id: Joi.number().integer().positive().allow(null).optional(),
  
  // obra_id é novo campo opcional
  obra_id: Joi.number().integer().positive().allow(null).optional(),
  
  numero: Joi.string().required(),
  periodo: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
  data_medicao: Joi.date().required(),
  mes_referencia: Joi.number().integer().min(1).max(12).required(),
  ano_referencia: Joi.number().integer().min(2000).required(),
  valor_mensal_bruto: Joi.number().min(0).default(0),
  valor_aditivos: Joi.number().min(0).default(0),
  valor_custos_extras: Joi.number().min(0).default(0),
  valor_descontos: Joi.number().min(0).default(0),
  valor_total: Joi.number().min(0).default(0),
  status: Joi.string().valid('pendente', 'finalizada', 'cancelada', 'enviada').default('pendente'),
  data_finalizacao: Joi.date().allow(null).optional(),
  data_envio: Joi.date().allow(null).optional(),
  observacoes: Joi.string().allow('', null).optional(),
  created_by: Joi.number().integer().positive().optional(),
  updated_by: Joi.number().integer().positive().optional(),
  
  // Itens relacionados
  custos_mensais: Joi.array().items(Joi.object({
    tipo: Joi.string().required(),
    descricao: Joi.string().required(),
    valor_mensal: Joi.number().min(0).required(),
    quantidade_meses: Joi.number().integer().min(1).default(1),
    valor_total: Joi.number().min(0).required(),
    observacoes: Joi.string().allow('', null).optional()
  })).optional(),
  
  horas_extras: Joi.array().items(Joi.object({
    tipo: Joi.string().valid('operador', 'sinaleiro', 'equipamento').required(),
    dia_semana: Joi.string().valid('sabado', 'domingo_feriado', 'normal').required(),
    quantidade_horas: Joi.number().min(0).required(),
    valor_hora: Joi.number().min(0).required(),
    valor_total: Joi.number().min(0).required(),
    observacoes: Joi.string().allow('', null).optional()
  })).optional(),
  
  servicos_adicionais: Joi.array().items(Joi.object({
    tipo: Joi.string().required(),
    descricao: Joi.string().required(),
    quantidade: Joi.number().min(0).required(),
    valor_unitario: Joi.number().min(0).required(),
    valor_total: Joi.number().min(0).required(),
    observacoes: Joi.string().allow('', null).optional()
  })).optional(),
  
  aditivos: Joi.array().items(Joi.object({
    tipo: Joi.string().valid('adicional', 'desconto').required(),
    descricao: Joi.string().required(),
    valor: Joi.number().required(),
    observacoes: Joi.string().allow('', null).optional()
  })).optional()
}).custom((value, helpers) => {
  // Validação customizada: pelo menos obra_id ou orcamento_id deve ser fornecido
  if (!value.obra_id && !value.orcamento_id) {
    return helpers.error('any.custom', {
      message: 'É necessário fornecer obra_id ou orcamento_id'
    });
  }
  return value;
});

// Atualizar medicaoMensalFiltersSchema
const medicaoMensalFiltersSchema = Joi.object({
  orcamento_id: Joi.number().integer().positive().allow(null).optional(),
  obra_id: Joi.number().integer().positive().allow(null).optional(), // NOVO
  periodo: Joi.string().pattern(/^\d{4}-\d{2}$/).optional(),
  status: Joi.string().valid('pendente', 'finalizada', 'cancelada', 'enviada').optional(),
  data_inicio: Joi.date().optional(),
  data_fim: Joi.date().optional(),
  mes_referencia: Joi.number().integer().min(1).max(12).optional(),
  ano_referencia: Joi.number().integer().min(2000).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});
```

### 3. Atualização das Rotas da API

#### 3.1. Arquivo: `backend-api/src/routes/medicoes-mensais.js`

##### 3.1.1. Atualizar GET `/api/medicoes-mensais` (Listar com filtros)

```javascript
router.get('/', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { error: validationError, value } = medicaoMensalFiltersSchema.validate(req.query);
    if (validationError) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        message: validationError.details[0].message
      });
    }

    const { orcamento_id, obra_id, periodo, status, data_inicio, data_fim, mes_referencia, ano_referencia, page, limit } = value;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('medicoes_mensais')
      .select(`
        *,
        orcamentos:orcamento_id (
          id,
          numero,
          cliente_id,
          data_orcamento,
          valor_total,
          total_faturado_acumulado,
          ultima_medicao_periodo,
          clientes:cliente_id (
            id,
            nome,
            cnpj,
            contato_cpf
          )
        ),
        obras:obra_id (
          id,
          nome,
          cliente_id,
          status,
          clientes:cliente_id (
            id,
            nome,
            cnpj
          )
        )
      `, { count: 'exact' });

    // Aplicar filtros
    if (orcamento_id) query = query.eq('orcamento_id', orcamento_id);
    if (obra_id) query = query.eq('obra_id', obra_id); // NOVO
    if (periodo) query = query.eq('periodo', periodo);
    if (status) query = query.eq('status', status);
    if (data_inicio) query = query.gte('data_medicao', data_inicio);
    if (data_fim) query = query.lte('data_medicao', data_fim);
    if (mes_referencia) query = query.eq('mes_referencia', mes_referencia);
    if (ano_referencia) query = query.eq('ano_referencia', ano_referencia);

    // Aplicar paginação e ordenação
    query = query.order('periodo', { ascending: false })
                 .order('data_medicao', { ascending: false })
                 .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar medições mensais',
        message: error.message
      });
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar medições mensais:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});
```

##### 3.1.2. Atualizar POST `/api/medicoes-mensais` (Criar medição)

```javascript
router.post('/', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { error: validationError, value } = medicaoMensalSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    const { 
      custos_mensais, 
      horas_extras, 
      servicos_adicionais, 
      aditivos,
      obra_id,
      orcamento_id,
      ...medicaoData 
    } = value;

    // Validar que pelo menos um dos dois foi fornecido
    if (!obra_id && !orcamento_id) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'É necessário fornecer obra_id ou orcamento_id'
      });
    }

    // Se obra_id foi fornecido, verificar se a obra existe
    if (obra_id) {
      const { data: obra, error: obraError } = await supabaseAdmin
        .from('obras')
        .select('id')
        .eq('id', obra_id)
        .single();

      if (obraError || !obra) {
        return res.status(404).json({
          error: 'Obra não encontrada',
          message: 'A obra especificada não existe'
        });
      }
    }

    // Se orcamento_id foi fornecido, verificar se o orçamento existe
    if (orcamento_id) {
      const { data: orcamento, error: orcamentoError } = await supabaseAdmin
        .from('orcamentos')
        .select('id')
        .eq('id', orcamento_id)
        .single();

      if (orcamentoError || !orcamento) {
        return res.status(404).json({
          error: 'Orçamento não encontrado',
          message: 'O orçamento especificado não existe'
        });
      }
    }

    // Verificar se já existe medição para este período
    let medicaoExistente;
    if (orcamento_id) {
      const { data } = await supabaseAdmin
        .from('medicoes_mensais')
        .select('id')
        .eq('orcamento_id', orcamento_id)
        .eq('periodo', medicaoData.periodo)
        .single();
      medicaoExistente = data;
    } else if (obra_id) {
      const { data } = await supabaseAdmin
        .from('medicoes_mensais')
        .select('id')
        .eq('obra_id', obra_id)
        .eq('periodo', medicaoData.periodo)
        .is('orcamento_id', null)
        .single();
      medicaoExistente = data;
    }

    if (medicaoExistente) {
      return res.status(400).json({
        error: 'Medição já existe',
        message: `Já existe uma medição para o período ${medicaoData.periodo}`,
        data: { medicao_id: medicaoExistente.id }
      });
    }

    // Adicionar obra_id e orcamento_id aos dados da medição
    medicaoData.obra_id = obra_id || null;
    medicaoData.orcamento_id = orcamento_id || null;
    medicaoData.created_by = req.user?.id;

    // Criar medição
    const { data: medicao, error: medicaoError } = await supabaseAdmin
      .from('medicoes_mensais')
      .insert([medicaoData])
      .select()
      .single();

    if (medicaoError) {
      return res.status(500).json({
        error: 'Erro ao criar medição mensal',
        message: medicaoError.message
      });
    }

    // Criar itens relacionados se fornecidos
    const promises = [];

    if (custos_mensais && custos_mensais.length > 0) {
      promises.push(
        supabaseAdmin.from('medicao_custos_mensais')
          .insert(custos_mensais.map(item => ({ ...item, medicao_id: medicao.id })))
      );
    }

    if (horas_extras && horas_extras.length > 0) {
      promises.push(
        supabaseAdmin.from('medicao_horas_extras')
          .insert(horas_extras.map(item => ({ ...item, medicao_id: medicao.id })))
      );
    }

    if (servicos_adicionais && servicos_adicionais.length > 0) {
      promises.push(
        supabaseAdmin.from('medicao_servicos_adicionais')
          .insert(servicos_adicionais.map(item => ({ ...item, medicao_id: medicao.id })))
      );
    }

    if (aditivos && aditivos.length > 0) {
      promises.push(
        supabaseAdmin.from('medicao_aditivos')
          .insert(aditivos.map(item => ({ ...item, medicao_id: medicao.id })))
      );
    }

    // Aguardar todas as inserções
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
      console.error('Erros ao criar itens da medição:', errors);
      // Não falhar a requisição, apenas logar o erro
    }

    res.status(201).json({
      success: true,
      data: medicao,
      message: 'Medição mensal criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar medição mensal:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});
```

##### 3.1.3. Adicionar Nova Rota: GET `/api/medicoes-mensais/obra/:obra_id`

```javascript
/**
 * GET /api/medicoes-mensais/obra/:obra_id
 * Listar todas as medições de uma obra (sem orçamento)
 */
router.get('/obra/:obra_id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { obra_id } = req.params;

    // Verificar se a obra existe
    const { data: obra, error: obraError } = await supabaseAdmin
      .from('obras')
      .select('id, nome')
      .eq('id', obra_id)
      .single();

    if (obraError || !obra) {
      return res.status(404).json({
        error: 'Obra não encontrada',
        message: 'A obra especificada não existe'
      });
    }

    // Buscar medições da obra (sem orçamento)
    const { data: medicoes, error } = await supabaseAdmin
      .from('medicoes_mensais')
      .select('*')
      .eq('obra_id', obra_id)
      .is('orcamento_id', null)
      .order('periodo', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar medições da obra',
        message: error.message
      });
    }

    res.json({
      success: true,
      data: medicoes || [],
      total: medicoes?.length || 0
    });
  } catch (error) {
    console.error('Erro ao buscar medições da obra:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});
```

### 4. Atualização do Frontend (API Client)

#### 4.1. Arquivo: `lib/api-medicoes-mensais.ts`

```typescript
export interface MedicaoMensal {
  id: number;
  orcamento_id?: number | null; // Tornar opcional
  obra_id?: number | null; // NOVO
  numero: string;
  periodo: string;
  // ... resto dos campos
  orcamentos?: {
    // ... campos do orçamento
  };
  obras?: { // NOVO
    id: number;
    nome: string;
    cliente_id: number;
    status: string;
    clientes?: {
      id: number;
      nome: string;
      cnpj?: string;
    };
  };
}

export interface MedicaoMensalCreate {
  orcamento_id?: number | null; // Tornar opcional
  obra_id?: number | null; // NOVO
  numero: string;
  periodo: string;
  // ... resto dos campos
}

export interface MedicaoMensalFilters {
  orcamento_id?: number | null;
  obra_id?: number | null; // NOVO
  periodo?: string;
  // ... resto dos filtros
}

export const medicoesMensaisApi = {
  // ... métodos existentes

  /**
   * Listar todas as medições de uma obra (sem orçamento)
   */
  async listarPorObra(obra_id: number): Promise<{ success: boolean; data: MedicaoMensal[]; total: number }> {
    const response = await api.get(`/medicoes-mensais/obra/${obra_id}`);
    return response.data;
  },
};
```

## Resumo das Mudanças

### Banco de Dados
- ✅ Tornar `orcamento_id` opcional (NULL permitido)
- ✅ Adicionar coluna `obra_id`
- ✅ Criar índices para performance
- ✅ Atualizar constraints de unicidade
- ✅ Adicionar constraint para garantir que pelo menos um dos dois seja fornecido

### Backend (API)
- ✅ Atualizar schemas de validação
- ✅ Atualizar rota GET `/api/medicoes-mensais` para filtrar por `obra_id`
- ✅ Atualizar rota POST `/api/medicoes-mensais` para aceitar `obra_id`
- ✅ Adicionar rota GET `/api/medicoes-mensais/obra/:obra_id`
- ✅ Atualizar validações para garantir que pelo menos `obra_id` ou `orcamento_id` seja fornecido

### Frontend (API Client)
- ✅ Atualizar interfaces TypeScript
- ✅ Adicionar método `listarPorObra()`

## Ordem de Implementação Recomendada

1. **Criar e executar migration do banco de dados**
2. **Atualizar schemas de validação**
3. **Atualizar rotas da API**
4. **Atualizar API client no frontend**
5. **Testar criação de medições sem orçamento**
6. **Testar listagem de medições por obra**

## Testes Necessários

1. ✅ Criar medição com apenas `obra_id` (sem `orcamento_id`)
2. ✅ Criar medição com apenas `orcamento_id` (sem `obra_id`)
3. ✅ Criar medição com ambos `obra_id` e `orcamento_id`
4. ✅ Validar que não permite criar sem nenhum dos dois
5. ✅ Validar unicidade por período (obra ou orçamento)
6. ✅ Listar medições filtradas por `obra_id`
7. ✅ Listar medições filtradas por `orcamento_id`
8. ✅ Verificar que medições antigas continuam funcionando

## Notas Importantes

- As medições existentes que já têm `orcamento_id` continuarão funcionando normalmente
- A constraint de unicidade foi atualizada para permitir ambos os casos
- O frontend já está preparado para essas mudanças
- Recomenda-se fazer backup do banco antes de executar a migration

