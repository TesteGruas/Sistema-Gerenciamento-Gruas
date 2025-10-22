import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { 
  receitaSchema, 
  receitaUpdateSchema, 
  receitaFiltersSchema,
  receitaResumoSchema,
  receitaExportSchema 
} from '../schemas/receita-schemas.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Receita:
 *       type: object
 *       required:
 *         - obra_id
 *         - tipo
 *         - descricao
 *         - valor
 *         - data_receita
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único da receita
 *         obra_id:
 *           type: integer
 *           description: ID da obra
 *         tipo:
 *           type: string
 *           enum: [locacao, servico, venda]
 *           description: Tipo da receita
 *         descricao:
 *           type: string
 *           description: Descrição da receita
 *         valor:
 *           type: number
 *           format: decimal
 *           description: Valor da receita
 *         data_receita:
 *           type: string
 *           format: date
 *           description: Data da receita
 *         status:
 *           type: string
 *           enum: [pendente, confirmada, cancelada]
 *           default: pendente
 *           description: Status da receita
 *         observacoes:
 *           type: string
 *           description: Observações adicionais
 *         funcionario_id:
 *           type: integer
 *           description: ID do funcionário responsável
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Data de atualização
 */

/**
 * @swagger
 * /api/receitas:
 *   get:
 *     summary: Lista receitas com filtros
 *     tags: [Receitas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Limite de itens por página
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: Filtrar por obra
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [locacao, servico, venda]
 *         description: Filtrar por tipo
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendente, confirmada, cancelada]
 *         description: Filtrar por status
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data início do período
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data fim do período
 *     responses:
 *       200:
 *         description: Lista de receitas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Receita'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    console.log('📋 GET /api/receitas - Query params:', req.query);
    
    const { error: validationError, value } = receitaFiltersSchema.validate(req.query);
    if (validationError) {
      console.error('❌ Erro de validação:', validationError.details[0].message);
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        message: validationError.details[0].message
      });
    }

    console.log('✅ Parâmetros validados:', value);
    
    const { obra_id, tipo, status, data_inicio, data_fim, page = 1, limit = 50 } = value;
    const offset = (page - 1) * limit;
    
    // Converter datas para string ISO se forem objetos Date
    const dataInicioStr = data_inicio instanceof Date ? data_inicio.toISOString().split('T')[0] : data_inicio;
    const dataFimStr = data_fim instanceof Date ? data_fim.toISOString().split('T')[0] : data_fim;
    
    console.log('📅 Datas convertidas:', { dataInicioStr, dataFimStr });

    let query = supabaseAdmin
      .from('receitas')
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `, { count: 'exact' });

    // Aplicar filtros
    if (obra_id) query = query.eq('obra_id', obra_id);
    if (tipo) query = query.eq('tipo', tipo);
    if (status) query = query.eq('status', status);
    if (dataInicioStr) query = query.gte('data_receita', dataInicioStr);
    if (dataFimStr) query = query.lte('data_receita', dataFimStr);

    query = query.order('data_receita', { ascending: false })
                 .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Erro do Supabase:', error);
      throw error;
    }

    console.log(`✅ ${data.length} receitas encontradas`);

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar receitas:', error);
    res.status(500).json({
      error: 'Erro ao buscar receitas',
      message: error.message,
      details: error.details || error.hint || 'Sem detalhes adicionais'
    });
  }
});

/**
 * @swagger
 * /api/receitas/export:
 *   get:
 *     summary: Exportar receitas
 *     tags: [Receitas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, xlsx]
 *           default: csv
 *         description: Formato de exportação
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: Filtrar por obra
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [locacao, servico, venda]
 *         description: Filtrar por tipo
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendente, confirmada, cancelada]
 *         description: Filtrar por status
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data início do período
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data fim do período
 *     responses:
 *       200:
 *         description: Arquivo exportado
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/export', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { error: validationError, value } = receitaExportSchema.validate(req.query);
    if (validationError) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        message: validationError.details[0].message
      });
    }

    const { format = 'csv', obra_id, tipo, status, data_inicio, data_fim } = value;
    
    // Converter datas para string ISO se forem objetos Date
    const dataInicioStr = data_inicio instanceof Date ? data_inicio.toISOString().split('T')[0] : data_inicio;
    const dataFimStr = data_fim instanceof Date ? data_fim.toISOString().split('T')[0] : data_fim;

    let query = supabaseAdmin
      .from('receitas')
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `);

    // Aplicar filtros
    if (obra_id) query = query.eq('obra_id', obra_id);
    if (tipo) query = query.eq('tipo', tipo);
    if (status) query = query.eq('status', status);
    if (dataInicioStr) query = query.gte('data_receita', dataInicioStr);
    if (dataFimStr) query = query.lte('data_receita', dataFimStr);

    query = query.order('data_receita', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar receitas para exportação',
        message: error.message
      });
    }

    if (format === 'csv') {
      // Gerar CSV
      const csvHeader = 'ID,Obra,Cliente,Funcionário,Tipo,Descrição,Valor,Data,Status,Observações\n';
      const csvRows = (data || []).map(receita => {
        const obra = receita.obras?.nome || 'N/A';
        const cliente = receita.obras?.clientes?.nome || 'N/A';
        const funcionario = receita.funcionarios?.nome || 'N/A';
        const valor = parseFloat(receita.valor || 0).toFixed(2).replace('.', ',');
        const dataFormatada = new Date(receita.data_receita).toLocaleDateString('pt-BR');
        const observacoes = (receita.observacoes || '').replace(/"/g, '""');
        
        return `"${receita.id}","${obra}","${cliente}","${funcionario}","${receita.tipo}","${receita.descricao}","${valor}","${dataFormatada}","${receita.status}","${observacoes}"`;
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="receitas-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send('\uFEFF' + csvContent); // BOM para UTF-8
    } else {
      // Para XLSX, retornar JSON por enquanto
      res.json({
        success: true,
        data: data || [],
        message: 'Exportação XLSX não implementada ainda'
      });
    }
  } catch (error) {
    console.error('Erro ao exportar receitas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/receitas/{id}:
 *   get:
 *     summary: Buscar receita por ID
 *     tags: [Receitas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da receita
 *     responses:
 *       200:
 *         description: Dados da receita
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Receita'
 *       404:
 *         description: Receita não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('receitas')
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        error: 'Receita não encontrada'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao buscar receita:', error);
    res.status(500).json({
      error: 'Erro ao buscar receita',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/receitas:
 *   post:
 *     summary: Criar nova receita
 *     tags: [Receitas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - obra_id
 *               - tipo
 *               - descricao
 *               - valor
 *               - data_receita
 *             properties:
 *               obra_id:
 *                 type: integer
 *                 description: ID da obra
 *               tipo:
 *                 type: string
 *                 enum: [locacao, servico, venda]
 *                 description: Tipo da receita
 *               descricao:
 *                 type: string
 *                 description: Descrição da receita
 *               valor:
 *                 type: number
 *                 description: Valor da receita
 *               data_receita:
 *                 type: string
 *                 format: date
 *                 description: Data da receita
 *               funcionario_id:
 *                 type: integer
 *                 description: ID do funcionário responsável
 *               observacoes:
 *                 type: string
 *                 description: Observações adicionais
 *     responses:
 *       201:
 *         description: Receita criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Receita'
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { error: validationError, value } = receitaSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    const { data, error } = await supabaseAdmin
      .from('receitas')
      .insert([value])
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Receita criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar receita:', error);
    res.status(500).json({
      error: 'Erro ao criar receita',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/receitas/{id}:
 *   put:
 *     summary: Atualizar receita
 *     tags: [Receitas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da receita
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               obra_id:
 *                 type: integer
 *                 description: ID da obra
 *               tipo:
 *                 type: string
 *                 enum: [locacao, servico, venda]
 *                 description: Tipo da receita
 *               descricao:
 *                 type: string
 *                 description: Descrição da receita
 *               valor:
 *                 type: number
 *                 description: Valor da receita
 *               data_receita:
 *                 type: string
 *                 format: date
 *                 description: Data da receita
 *               funcionario_id:
 *                 type: integer
 *                 description: ID do funcionário responsável
 *               observacoes:
 *                 type: string
 *                 description: Observações adicionais
 *               status:
 *                 type: string
 *                 enum: [pendente, confirmada, cancelada]
 *                 description: Status da receita
 *     responses:
 *       200:
 *         description: Receita atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Receita'
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Receita não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = receitaUpdateSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    const { data, error } = await supabaseAdmin
      .from('receitas')
      .update(value)
      .eq('id', id)
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        error: 'Receita não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Receita atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar receita:', error);
    res.status(500).json({
      error: 'Erro ao atualizar receita',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/receitas/{id}:
 *   delete:
 *     summary: Excluir receita
 *     tags: [Receitas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da receita
 *     responses:
 *       200:
 *         description: Receita excluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Receita não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('receitas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Receita excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir receita:', error);
    res.status(500).json({
      error: 'Erro ao excluir receita',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/receitas/resumo:
 *   get:
 *     summary: Resumo financeiro de receitas
 *     tags: [Receitas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: Filtrar por obra específica
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data início do período
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data fim do período
 *     responses:
 *       200:
 *         description: Resumo financeiro
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tipo:
 *                         type: string
 *                       total_receitas:
 *                         type: integer
 *                       valor_confirmado:
 *                         type: number
 *                       valor_pendente:
 *                         type: number
 *                       valor_cancelado:
 *                         type: number
 *                       valor_total:
 *                         type: number
 *                       valor_medio:
 *                         type: number
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/resumo', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { error: validationError, value } = receitaResumoSchema.validate(req.query);
    if (validationError) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        message: validationError.details[0].message
      });
    }

    const { obra_id, data_inicio, data_fim } = value;
    
    // Converter datas para string ISO se forem objetos Date
    const dataInicioStr = data_inicio instanceof Date ? data_inicio.toISOString().split('T')[0] : data_inicio;
    const dataFimStr = data_fim instanceof Date ? data_fim.toISOString().split('T')[0] : data_fim;

    let query;
    if (obra_id) {
      // Resumo por obra específica
      query = supabaseAdmin
        .from('vw_receitas_por_obra')
        .select('*')
        .eq('obra_id', obra_id);
    } else {
      // Resumo geral por tipo
      query = supabaseAdmin
        .from('vw_receitas_por_tipo')
        .select('*');
    }

    // Aplicar filtros de data se fornecidos
    if (dataInicioStr || dataFimStr) {
      // Para filtros de data, usar a tabela principal
      let dataQuery = supabaseAdmin
        .from('receitas')
        .select(`
          tipo,
          status,
          valor
        `);

      if (dataInicioStr) dataQuery = dataQuery.gte('data_receita', dataInicioStr);
      if (dataFimStr) dataQuery = dataQuery.lte('data_receita', dataFimStr);

      const { data: receitasData, error: dataError } = await dataQuery;
      if (dataError) throw dataError;

      // Processar dados manualmente
      const resumo = {};
      receitasData.forEach(receita => {
        if (!resumo[receita.tipo]) {
          resumo[receita.tipo] = {
            tipo: receita.tipo,
            total_receitas: 0,
            valor_confirmado: 0,
            valor_pendente: 0,
            valor_cancelado: 0,
            valor_total: 0
          };
        }
        
        resumo[receita.tipo].total_receitas++;
        resumo[receita.tipo].valor_total += parseFloat(receita.valor);
        
        if (receita.status === 'confirmada') {
          resumo[receita.tipo].valor_confirmado += parseFloat(receita.valor);
        } else if (receita.status === 'pendente') {
          resumo[receita.tipo].valor_pendente += parseFloat(receita.valor);
        } else if (receita.status === 'cancelada') {
          resumo[receita.tipo].valor_cancelado += parseFloat(receita.valor);
        }
      });

      // Calcular valor médio
      Object.values(resumo).forEach(item => {
        item.valor_medio = item.total_receitas > 0 ? item.valor_total / item.total_receitas : 0;
      });

      return res.json({
        success: true,
        data: Object.values(resumo)
      });
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao buscar resumo:', error);
    res.status(500).json({
      error: 'Erro ao buscar resumo',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/receitas/{id}/confirm:
 *   patch:
 *     summary: Confirmar receita
 *     tags: [Receitas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da receita
 *     responses:
 *       200:
 *         description: Receita confirmada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Receita'
 *                 message:
 *                   type: string
 *       404:
 *         description: Receita não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.patch('/:id/confirm', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('receitas')
      .update({ status: 'confirmada', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        error: 'Receita não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Receita confirmada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao confirmar receita:', error);
    res.status(500).json({
      error: 'Erro ao confirmar receita',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/receitas/{id}/cancel:
 *   patch:
 *     summary: Cancelar receita
 *     tags: [Receitas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da receita
 *     responses:
 *       200:
 *         description: Receita cancelada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Receita'
 *                 message:
 *                   type: string
 *       404:
 *         description: Receita não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.patch('/:id/cancel', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('receitas')
      .update({ status: 'cancelada', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        error: 'Receita não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Receita cancelada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao cancelar receita:', error);
    res.status(500).json({
      error: 'Erro ao cancelar receita',
      message: error.message
    });
  }
});


export default router;
