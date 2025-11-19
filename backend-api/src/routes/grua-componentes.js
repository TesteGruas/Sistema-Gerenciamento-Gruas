import express from 'express'
import Joi from 'joi'
import { supabase, supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// Schema de validação para componentes
const componenteSchema = Joi.object({
  grua_id: Joi.string().required(),
  nome: Joi.string().min(2).max(100).required(),
  tipo: Joi.string().valid('Estrutural', 'Hidráulico', 'Elétrico', 'Mecânico', 'Segurança', 'Outro').required(),
  modelo: Joi.string().max(100).allow(null, ''),
  fabricante: Joi.string().max(100).allow(null, ''),
  numero_serie: Joi.string().max(100).allow(null, ''),
  capacidade: Joi.string().max(50).allow(null, ''),
  unidade_medida: Joi.string().max(20).default('unidade'),
  quantidade_total: Joi.number().integer().min(1).default(1),
  quantidade_disponivel: Joi.number().integer().min(0).default(1),
  quantidade_em_uso: Joi.number().integer().min(0).default(0),
  quantidade_danificada: Joi.number().integer().min(0).default(0),
  status: Joi.string().valid('Disponível', 'Em uso', 'Danificado', 'Manutenção', 'Descontinuado').default('Disponível'),
  localizacao: Joi.string().max(200).allow(null, ''),
  localizacao_tipo: Joi.string().valid('Obra X', 'Almoxarifado', 'Oficina', 'Em trânsito', 'Em manutenção').default('Almoxarifado'),
  obra_id: Joi.number().integer().allow(null),
  dimensoes_altura: Joi.number().min(0).allow(null),
  dimensoes_largura: Joi.number().min(0).allow(null),
  dimensoes_comprimento: Joi.number().min(0).allow(null),
  dimensoes_peso: Joi.number().min(0).allow(null),
  vida_util_percentual: Joi.number().integer().min(0).max(100).default(100),
  valor_unitario: Joi.number().min(0).default(0),
  data_instalacao: Joi.date().allow(null),
  data_ultima_manutencao: Joi.date().allow(null),
  data_proxima_manutencao: Joi.date().allow(null),
  observacoes: Joi.string().allow(null, ''),
  anexos: Joi.object().allow(null)
})

// Schema para atualização de componentes (sem grua_id obrigatório)
const componenteUpdateSchema = Joi.object({
  nome: Joi.string().min(2).max(100),
  tipo: Joi.string().valid('Estrutural', 'Hidráulico', 'Elétrico', 'Mecânico', 'Segurança', 'Outro'),
  modelo: Joi.string().max(100).allow(null, ''),
  fabricante: Joi.string().max(100).allow(null, ''),
  numero_serie: Joi.string().max(100).allow(null, ''),
  capacidade: Joi.string().max(50).allow(null, ''),
  unidade_medida: Joi.string().max(20),
  quantidade_total: Joi.number().integer().min(1),
  quantidade_disponivel: Joi.number().integer().min(0),
  quantidade_em_uso: Joi.number().integer().min(0),
  quantidade_danificada: Joi.number().integer().min(0),
  status: Joi.string().valid('Disponível', 'Em uso', 'Danificado', 'Manutenção', 'Descontinuado'),
  localizacao: Joi.string().max(200).allow(null, ''),
  localizacao_tipo: Joi.string().valid('Obra X', 'Almoxarifado', 'Oficina', 'Em trânsito', 'Em manutenção'),
  obra_id: Joi.number().integer().allow(null),
  dimensoes_altura: Joi.number().min(0).allow(null),
  dimensoes_largura: Joi.number().min(0).allow(null),
  dimensoes_comprimento: Joi.number().min(0).allow(null),
  dimensoes_peso: Joi.number().min(0).allow(null),
  vida_util_percentual: Joi.number().integer().min(0).max(100),
  valor_unitario: Joi.number().min(0),
  data_instalacao: Joi.date().allow(null),
  data_ultima_manutencao: Joi.date().allow(null),
  data_proxima_manutencao: Joi.date().allow(null),
  observacoes: Joi.string().allow(null, ''),
  anexos: Joi.object().allow(null)
})

// Schema para movimentação de componentes
const movimentacaoSchema = Joi.object({
  tipo_movimentacao: Joi.string().valid('Instalação', 'Remoção', 'Manutenção', 'Substituição', 'Transferência', 'Ajuste').required(),
  quantidade_movimentada: Joi.number().integer().min(1).required(),
  motivo: Joi.string().min(5).max(200).required(),
  obra_id: Joi.number().integer().allow(null),
  grua_origem_id: Joi.string().allow(null, ''),
  grua_destino_id: Joi.string().allow(null, ''),
  funcionario_responsavel_id: Joi.number().integer().allow(null),
  observacoes: Joi.string().allow(null, ''),
  anexos: Joi.object().allow(null)
})

/**
 * @swagger
 * /api/grua-componentes:
 *   get:
 *     summary: Listar componentes de gruas
 *     tags: [Grua Componentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: grua_id
 *         schema:
 *           type: string
 *         description: ID da grua para filtrar componentes
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [Estrutural, Hidráulico, Elétrico, Mecânico, Segurança, Outro]
 *         description: Tipo do componente
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Disponível, Em uso, Danificado, Manutenção, Descontinuado]
 *         description: Status do componente
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de componentes
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
 *                     $ref: '#/components/schemas/Componente'
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
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const { grua_id, tipo, status } = req.query

    // Construir query
    let query = supabaseAdmin
      .from('grua_componentes')
      .select(`
        *,
        grua:gruas(id, name, modelo, fabricante),
        created_by_user:usuarios!grua_componentes_created_by_fkey(id, nome),
        updated_by_user:usuarios!grua_componentes_updated_by_fkey(id, nome)
      `, { count: 'exact' })

    // Aplicar filtros
    if (grua_id) {
      query = query.eq('grua_id', grua_id)
    }
    if (tipo) {
      query = query.eq('tipo', tipo)
    }
    if (status) {
      query = query.eq('status', status)
    }

    // Aplicar paginação e ordenação
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar componentes',
        message: error.message
      })
    }

    const totalPages = Math.ceil(count / limit)

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count,
        pages: totalPages
      }
    })
  } catch (error) {
    console.error('Erro ao listar componentes:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/grua-componentes/{id}:
 *   get:
 *     summary: Obter componente por ID
 *     tags: [Grua Componentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do componente
 *     responses:
 *       200:
 *         description: Dados do componente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Componente'
 *       404:
 *         description: Componente não encontrado
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data: componente, error } = await supabaseAdmin
      .from('grua_componentes')
      .select(`
        *,
        grua:gruas(id, name, modelo, fabricante),
        created_by_user:usuarios!grua_componentes_created_by_fkey(id, nome),
        updated_by_user:usuarios!grua_componentes_updated_by_fkey(id, nome),
        historico:historico_componentes(
          id,
          tipo_movimentacao,
          quantidade_movimentada,
          motivo,
          data_movimentacao,
          observacoes,
          obra:obras(id, nome),
          funcionario:funcionarios(id, nome)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Componente não encontrado',
          message: 'O componente com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar componente',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: componente
    })
  } catch (error) {
    console.error('Erro ao buscar componente:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/grua-componentes:
 *   post:
 *     summary: Criar novo componente
 *     tags: [Grua Componentes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComponenteInput'
 *     responses:
 *       201:
 *         description: Componente criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = componenteSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se a grua existe
    console.log('Buscando grua com ID:', value.grua_id)
    const { data: grua, error: gruaError } = await supabaseAdmin
      .from('gruas')
      .select('id, name, modelo, fabricante')
      .eq('id', value.grua_id)
      .single()

    console.log('Resultado da busca da grua:', { grua, gruaError })

    if (gruaError || !grua) {
      console.log('Erro ao buscar grua:', gruaError)
      return res.status(400).json({
        error: 'Grua não encontrada',
        message: 'A grua especificada não existe',
        debug: {
          grua_id: value.grua_id,
          error: gruaError?.message,
          data: grua
        }
      })
    }

    // Preparar dados para inserção
    const componenteData = {
      ...value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('grua_componentes')
      .insert(componenteData)
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({
        error: 'Erro ao criar componente',
        message: insertError.message
      })
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Componente criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar componente:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/grua-componentes/{id}:
 *   put:
 *     summary: Atualizar componente
 *     tags: [Grua Componentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do componente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComponenteInput'
 *     responses:
 *       200:
 *         description: Componente atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Componente não encontrado
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Validar dados
    const { error, value } = componenteUpdateSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se o componente existe
    const { data: componenteExistente, error: checkError } = await supabaseAdmin
      .from('grua_componentes')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !componenteExistente) {
      return res.status(404).json({
        error: 'Componente não encontrado',
        message: 'O componente com o ID especificado não existe'
      })
    }

    // Preparar dados para atualização
    const updateData = {
      ...value,
      updated_at: new Date().toISOString()
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('grua_componentes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return res.status(500).json({
        error: 'Erro ao atualizar componente',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      data,
      message: 'Componente atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar componente:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/grua-componentes/{id}:
 *   delete:
 *     summary: Excluir componente
 *     tags: [Grua Componentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do componente
 *     responses:
 *       200:
 *         description: Componente excluído com sucesso
 *       404:
 *         description: Componente não encontrado
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se o componente existe
    const { data: componente, error: checkError } = await supabaseAdmin
      .from('grua_componentes')
      .select('id, nome, quantidade_em_uso')
      .eq('id', id)
      .single()

    if (checkError || !componente) {
      return res.status(404).json({
        error: 'Componente não encontrado',
        message: 'O componente com o ID especificado não existe'
      })
    }

    // Verificar se há componentes em uso
    if (componente.quantidade_em_uso > 0) {
      return res.status(400).json({
        error: 'Não é possível excluir',
        message: `Não é possível excluir o componente "${componente.nome}" pois há ${componente.quantidade_em_uso} unidades em uso`
      })
    }

    const { error } = await supabaseAdmin
      .from('grua_componentes')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao excluir componente',
        message: error.message
      })
    }

    res.json({
      success: true,
      message: 'Componente excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir componente:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/grua-componentes/{id}/movimentar:
 *   post:
 *     summary: Registrar movimentação de componente
 *     tags: [Grua Componentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do componente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MovimentacaoInput'
 *     responses:
 *       200:
 *         description: Movimentação registrada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/:id/movimentar', async (req, res) => {
  try {
    const { id } = req.params

    // Validar dados da movimentação
    const { error, value } = movimentacaoSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Buscar componente atual
    const { data: componente, error: componenteError } = await supabaseAdmin
      .from('grua_componentes')
      .select('*')
      .eq('id', id)
      .single()

    if (componenteError || !componente) {
      return res.status(404).json({
        error: 'Componente não encontrado',
        message: 'O componente especificado não existe'
      })
    }

    // Calcular novas quantidades baseado no tipo de movimentação
    let novaQuantidadeDisponivel = componente.quantidade_disponivel
    let novaQuantidadeEmUso = componente.quantidade_em_uso
    let novaQuantidadeDanificada = componente.quantidade_danificada

    console.log('🔍 DEBUG Movimentação - Dados iniciais:')
    console.log('  - Tipo:', value.tipo_movimentacao)
    console.log('  - Quantidade movimentada:', value.quantidade_movimentada)
    console.log('  - Disponível inicial:', novaQuantidadeDisponivel)
    console.log('  - Em uso inicial:', novaQuantidadeEmUso)

    switch (value.tipo_movimentacao) {
      case 'Instalação':
        novaQuantidadeDisponivel -= value.quantidade_movimentada
        novaQuantidadeEmUso += value.quantidade_movimentada
        break
      case 'Remoção':
        novaQuantidadeEmUso -= value.quantidade_movimentada
        novaQuantidadeDisponivel += value.quantidade_movimentada
        break
      case 'Manutenção':
        // Não altera quantidades, apenas registra
        break
      case 'Substituição':
        novaQuantidadeDanificada -= value.quantidade_movimentada
        novaQuantidadeDisponivel += value.quantidade_movimentada
        break
      case 'Transferência':
        // Lógica específica para transferência entre gruas
        if (value.grua_origem_id && value.grua_destino_id) {
          // Transferência entre gruas diferentes
          if (value.grua_origem_id === componente.grua_id) {
            // Componente saindo desta grua
            novaQuantidadeEmUso -= value.quantidade_movimentada
          } else if (value.grua_destino_id === componente.grua_id) {
            // Componente chegando nesta grua
            novaQuantidadeEmUso += value.quantidade_movimentada
          }
        } else {
          // Transferência interna (mesma grua) - não altera quantidades
          console.log('🔄 Transferência interna - não altera quantidades')
        }
        break
      case 'Ajuste':
        // Ajuste manual das quantidades
        novaQuantidadeDisponivel = value.quantidade_movimentada
        break
    }

    // Validar se as quantidades não ficam negativas
    console.log('🔍 DEBUG Movimentação - Após cálculo:')
    console.log('  - Disponível final:', novaQuantidadeDisponivel)
    console.log('  - Em uso final:', novaQuantidadeEmUso)
    console.log('  - Danificada final:', novaQuantidadeDanificada)

    if (novaQuantidadeDisponivel < 0 || novaQuantidadeEmUso < 0 || novaQuantidadeDanificada < 0) {
      return res.status(400).json({
        error: 'Quantidade insuficiente',
        message: 'A quantidade disponível não é suficiente para esta movimentação'
      })
    }

    // Iniciar transação
    const { data: historicoData, error: historicoError } = await supabaseAdmin
      .from('historico_componentes')
      .insert({
        componente_id: id,
        tipo_movimentacao: value.tipo_movimentacao,
        quantidade_movimentada: value.quantidade_movimentada,
        quantidade_anterior: componente.quantidade_disponivel,
        quantidade_atual: novaQuantidadeDisponivel,
        motivo: value.motivo,
        obra_id: value.obra_id,
        grua_origem_id: value.grua_origem_id || null,
        grua_destino_id: value.grua_destino_id || null,
        funcionario_responsavel_id: value.funcionario_responsavel_id,
        observacoes: value.observacoes,
        anexos: value.anexos
      })
      .select()
      .single()

    if (historicoError) {
      return res.status(500).json({
        error: 'Erro ao registrar movimentação',
        message: historicoError.message
      })
    }

    // Atualizar quantidades do componente
    const { data: componenteAtualizado, error: updateError } = await supabaseAdmin
      .from('grua_componentes')
      .update({
        quantidade_disponivel: novaQuantidadeDisponivel,
        quantidade_em_uso: novaQuantidadeEmUso,
        quantidade_danificada: novaQuantidadeDanificada,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return res.status(500).json({
        error: 'Erro ao atualizar componente',
        message: updateError.message
      })
    }

    console.log('🔍 DEBUG Movimentação - Componente atualizado:')
    console.log('  - Disponível:', componenteAtualizado.quantidade_disponivel)
    console.log('  - Em uso:', componenteAtualizado.quantidade_em_uso)
    console.log('  - Danificada:', componenteAtualizado.quantidade_danificada)

    // Se for transferência entre gruas, atualizar o componente na grua destino
    let componenteDestino = null
    
    console.log('🔍 DEBUG Transferência - Verificando condições:')
    console.log('  - Tipo movimentação:', value.tipo_movimentacao)
    console.log('  - Grua origem:', value.grua_origem_id)
    console.log('  - Grua destino:', value.grua_destino_id)
    console.log('  - Grua atual:', componente.grua_id)
    console.log('  - Condição atendida:', value.tipo_movimentacao === 'Transferência' && value.grua_origem_id && value.grua_destino_id && value.grua_origem_id !== value.grua_destino_id)
    
    if (value.tipo_movimentacao === 'Transferência' && value.grua_origem_id && value.grua_destino_id && value.grua_origem_id !== value.grua_destino_id) {
      try {
        // Buscar componente na grua destino
        const { data: componenteDestinoData, error: componenteDestinoError } = await supabaseAdmin
          .from('grua_componentes')
          .select('*')
          .eq('grua_id', value.grua_destino_id)
          .eq('nome', componente.nome)
          .eq('tipo', componente.tipo)
          .eq('modelo', componente.modelo)
          .eq('fabricante', componente.fabricante)
          .single()

        if (componenteDestinoData && !componenteDestinoError) {
          // Atualizar quantidade na grua destino
          const { data: componenteDestinoAtualizado, error: updateDestinoError } = await supabaseAdmin
            .from('grua_componentes')
            .update({
              quantidade_em_uso: componenteDestinoData.quantidade_em_uso + value.quantidade_movimentada,
              updated_at: new Date().toISOString()
            })
            .eq('id', componenteDestinoData.id)
            .select()
            .single()

          if (!updateDestinoError) {
            componenteDestino = componenteDestinoAtualizado
            console.log('✅ Componente atualizado na grua destino:', value.grua_destino_id)
          } else {
            console.error('❌ Erro ao atualizar componente na grua destino:', updateDestinoError)
          }
        } else {
          console.log('ℹ️ Componente não encontrado na grua destino, criando novo registro...')
          
          // Criar novo componente na grua destino
          const novoComponenteData = {
            grua_id: value.grua_destino_id,
            nome: componente.nome,
            tipo: componente.tipo,
            modelo: componente.modelo,
            fabricante: componente.fabricante,
            numero_serie: componente.numero_serie,
            capacidade: componente.capacidade,
            unidade_medida: componente.unidade_medida,
            quantidade_total: value.quantidade_movimentada,
            quantidade_disponivel: 0,
            quantidade_em_uso: value.quantidade_movimentada,
            quantidade_danificada: 0,
            status: 'Em uso',
            localizacao: componente.localizacao,
            valor_unitario: componente.valor_unitario,
            data_instalacao: new Date().toISOString(),
            data_ultima_manutencao: componente.data_ultima_manutencao,
            data_proxima_manutencao: componente.data_proxima_manutencao,
            observacoes: `Transferido da grua ${value.grua_origem_id} em ${new Date().toISOString()}`,
            anexos: componente.anexos,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const { data: novoComponente, error: createError } = await supabaseAdmin
            .from('grua_componentes')
            .insert(novoComponenteData)
            .select()
            .single()

          if (!createError && novoComponente) {
            componenteDestino = novoComponente
            console.log('✅ Novo componente criado na grua destino:', value.grua_destino_id)
          } else {
            console.error('❌ Erro ao criar componente na grua destino:', createError)
          }
        }
      } catch (error) {
        console.error('❌ Erro ao processar transferência para grua destino:', error)
      }
    }

    res.json({
      success: true,
      data: {
        componente: componenteAtualizado,
        componenteDestino: componenteDestino,
        movimentacao: historicoData
      },
      message: 'Movimentação registrada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
