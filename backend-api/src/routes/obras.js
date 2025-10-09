import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Schema de validação para obras
const obraSchema = Joi.object({
  nome: Joi.string().min(2).required(),
  cliente_id: Joi.number().integer().positive().required(),
  endereco: Joi.string().required(),
  cidade: Joi.string().required(),
  estado: Joi.string().min(2).max(2).required(),
  tipo: Joi.string().valid('Residencial', 'Comercial', 'Industrial', 'Infraestrutura').required(), // NOT NULL na tabela
  cep: Joi.string().pattern(/^\d{5}-?\d{3}$/).allow(null, '').optional(),
  contato_obra: Joi.string().allow('', null).optional(),
  telefone_obra: Joi.string().allow('', null).optional(),
  email_obra: Joi.string().email().allow('', null).optional(),
  status: Joi.string().valid('Planejamento', 'Em Andamento', 'Pausada', 'Concluída', 'Cancelada').default('Planejamento'),
  // Novos campos adicionados - todos opcionais conforme tabela
  descricao: Joi.string().allow('', null).optional(),
  data_inicio: Joi.date().allow(null).optional(),
  data_fim: Joi.date().allow(null).optional(),
  orcamento: Joi.number().positive().allow(null).optional(),
  observacoes: Joi.string().allow('', null).optional(),
  responsavel_id: Joi.number().integer().positive().allow(null).optional(),
  responsavel_nome: Joi.string().allow('', null).optional(),
  created_at: Joi.date().optional(),
  updated_at: Joi.date().optional(),
  // Dados da grua (mantido para compatibilidade)
  grua_id: Joi.string().allow(null, '').optional(),
  grua_valor: Joi.number().positive().allow(null).optional(),
  grua_mensalidade: Joi.number().positive().allow(null).optional(),
  // Múltiplas gruas
  gruas: Joi.array().items(
    Joi.object({
      grua_id: Joi.string().required(),
      valor_locacao: Joi.number().positive().required(),
      taxa_mensal: Joi.number().positive().required()
    })
  ).allow(null).optional(),
  // Dados dos funcionários
  funcionarios: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      userId: Joi.string().required(),
      role: Joi.string().required(),
      name: Joi.string().required(),
      gruaId: Joi.string().allow(null, '').optional()
    })
  ).allow(null).optional(),
  // Custos mensais
  custos_mensais: Joi.array().items(
    Joi.object({
      item: Joi.string().required(),
      descricao: Joi.string().required(),
      unidade: Joi.string().required(),
      quantidadeOrcamento: Joi.number().positive().required(),
      valorUnitario: Joi.number().positive().required(),
      totalOrcamento: Joi.number().positive().required(),
      mes: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
      tipo: Joi.string().valid('contrato', 'aditivo').default('contrato')
    })
  ).allow(null).optional(),
  // Campos adicionais para criação automática de cliente
  cliente_nome: Joi.string().allow(null, '').optional(),
  cliente_cnpj: Joi.string().allow(null, '').optional(),
  cliente_email: Joi.string().email().allow('', null).optional(),
  cliente_telefone: Joi.string().allow('', null).optional()
})

/**
 * @swagger
 * /api/obras:
 *   get:
 *     summary: Listar todas as obras
 *     tags: [Obras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Planejamento, Em Andamento, Pausada, Concluída, Cancelada]
 *         description: Filtrar por status
 *       - in: query
 *         name: responsavel_id
 *         schema:
 *           type: integer
 *         description: Filtrar por responsável
 *       - in: query
 *         name: cliente_id
 *         schema:
 *           type: integer
 *         description: Filtrar por cliente
 *     responses:
 *       200:
 *         description: Lista de obras com relacionamentos incluídos
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
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       cliente_id:
 *                         type: integer
 *                       endereco:
 *                         type: string
 *                       cidade:
 *                         type: string
 *                       estado:
 *                         type: string
 *                       tipo:
 *                         type: string
 *                       status:
 *                         type: string
 *                       clientes:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *                           cnpj:
 *                             type: string
 *                           email:
 *                             type: string
 *                           telefone:
 *                             type: string
 *                       grua_obra:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             grua_id:
 *                               type: string
 *                             data_inicio_locacao:
 *                               type: string
 *                               format: date
 *                             data_fim_locacao:
 *                               type: string
 *                               format: date
 *                             valor_locacao_mensal:
 *                               type: number
 *                             status:
 *                               type: string
 *                             observacoes:
 *                               type: string
 *                             grua:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 modelo:
 *                                   type: string
 *                                 fabricante:
 *                                   type: string
 *                                 tipo:
 *                                   type: string
 *                       grua_funcionario:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             grua_id:
 *                               type: string
 *                             funcionario_id:
 *                               type: integer
 *                             data_inicio:
 *                               type: string
 *                               format: date
 *                             data_fim:
 *                               type: string
 *                               format: date
 *                             status:
 *                               type: string
 *                             observacoes:
 *                               type: string
 *                             funcionario:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 nome:
 *                                   type: string
 *                                 cargo:
 *                                   type: string
 *                                 status:
 *                                   type: string
 *                             grua:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 modelo:
 *                                   type: string
 *                                 fabricante:
 *                                   type: string
 *                                 tipo:
 *                                   type: string
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
router.get('/', authenticateToken, requirePermission('visualizar_obras'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const { status, cliente_id } = req.query

    let query = supabaseAdmin
      .from('obras')
      .select(`
        *,
        clientes (
          id,
          nome,
          cnpj,
          email,
          telefone
        ),
        grua_obra (
          id,
          grua_id,
          data_inicio_locacao,
          data_fim_locacao,
          valor_locacao_mensal,
          status,
          observacoes,
          grua:gruas (
            id,
            modelo,
            fabricante,
            tipo
          )
        ),
        grua_funcionario (
          id,
          grua_id,
          funcionario_id,
          data_inicio,
          data_fim,
          status,
          observacoes,
          funcionario:funcionarios (
            id,
            nome,
            cargo,
            status
          ),
          grua:gruas (
            id,
            modelo,
            fabricante,
            tipo
          )
        )
      `, { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }
    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id)
    }

    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar obras',
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
    console.error('Erro ao listar obras:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras/{id}:
 *   get:
 *     summary: Obter obra por ID
 *     tags: [Obras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *     responses:
 *       200:
 *         description: Dados da obra com relacionamentos incluídos
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
 *                     id:
 *                       type: integer
 *                     nome:
 *                       type: string
 *                     cliente_id:
 *                       type: integer
 *                     endereco:
 *                       type: string
 *                     cidade:
 *                       type: string
 *                     estado:
 *                       type: string
 *                     tipo:
 *                       type: string
 *                     status:
 *                       type: string
 *                     clientes:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nome:
 *                           type: string
 *                         cnpj:
 *                           type: string
 *                         email:
 *                           type: string
 *                         telefone:
 *                           type: string
 *                     grua_obra:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           grua_id:
 *                             type: string
 *                           data_inicio_locacao:
 *                             type: string
 *                             format: date
 *                           data_fim_locacao:
 *                             type: string
 *                             format: date
 *                           valor_locacao_mensal:
 *                             type: number
 *                           status:
 *                             type: string
 *                           observacoes:
 *                             type: string
 *                           grua:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               modelo:
 *                                 type: string
 *                               fabricante:
 *                                 type: string
 *                               tipo:
 *                                 type: string
 *                               numero_serie:
 *                                 type: string
 *                     grua_funcionario:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           grua_id:
 *                             type: string
 *                           funcionario_id:
 *                             type: integer
 *                           data_inicio:
 *                             type: string
 *                             format: date
 *                           data_fim:
 *                             type: string
 *                             format: date
 *                           status:
 *                             type: string
 *                           observacoes:
 *                             type: string
 *                           funcionario:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               nome:
 *                                 type: string
 *                               cargo:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                           grua:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               modelo:
 *                                 type: string
 *                               fabricante:
 *                                 type: string
 *                               tipo:
 *                                 type: string
 *       404:
 *         description: Obra não encontrada
 */
router.get('/:id', authenticateToken, requirePermission('visualizar_obras'), async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('obras')
      .select(`
        *,
        clientes (
          id,
          nome,
          cnpj,
          email,
          telefone
        ),
        grua_obra (
          id,
          grua_id,
          data_inicio_locacao,
          data_fim_locacao,
          valor_locacao_mensal,
          status,
          observacoes,
          grua:gruas (
            id,
            modelo,
            fabricante,
            tipo
          )
        ),
        grua_funcionario (
          id,
          grua_id,
          funcionario_id,
          data_inicio,
          data_fim,
          status,
          observacoes,
          funcionario:funcionarios (
            id,
            nome,
            cargo,
            status
          ),
          grua:gruas (
            id,
            modelo,
            fabricante,
            tipo
          )
        ),
        custos_mensais (
          id,
          item,
          descricao,
          unidade,
          quantidade_orcamento,
          valor_unitario,
          total_orcamento,
          mes,
          quantidade_realizada,
          valor_realizado,
          quantidade_acumulada,
          valor_acumulado,
          quantidade_saldo,
          valor_saldo,
          tipo
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Obra não encontrada',
          message: 'A obra com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar obra',
        message: error.message
      })
    }

    // Calcular totais dos custos
    const totalCustosMensais = data.custos_mensais?.reduce((total, custo) => 
      total + parseFloat(custo.total_orcamento || 0), 0) || 0

    // Buscar custos gerais (tabela custos)
    const { data: custosGerais, error: custosError } = await supabaseAdmin
      .from('custos')
      .select('valor')
      .eq('obra_id', id)
      .eq('status', 'confirmado')

    const totalCustosGerais = custosGerais?.reduce((total, custo) => 
      total + parseFloat(custo.valor || 0), 0) || 0

    // Adicionar totais aos dados
    const obraComTotais = {
      ...data,
      total_custos_mensais: totalCustosMensais,
      total_custos_gerais: totalCustosGerais,
      custos_iniciais: totalCustosMensais, // Para compatibilidade com frontend
      custos_adicionais: totalCustosGerais,
      total_custos: totalCustosMensais + totalCustosGerais
    }

    res.json({
      success: true,
      data: obraComTotais
    })
  } catch (error) {
    console.error('Erro ao buscar obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras:
 *   post:
 *     summary: Criar nova obra
 *     tags: [Obras]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - cliente_id
 *               - endereco
 *               - cidade
 *               - estado
 *               - tipo
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               cliente_id:
 *                 type: integer
 *               endereco:
 *                 type: string
 *               cidade:
 *                 type: string
 *               estado:
 *                 type: string
 *               tipo:
 *                 type: string
 *               cep:
 *                 type: string
 *               contato_obra:
 *                 type: string
 *               telefone_obra:
 *                 type: string
 *               email_obra:
 *                 type: string
 *               data_inicio:
 *                 type: string
 *                 format: date
 *               data_fim:
 *                 type: string
 *                 format: date
 *               orcamento:
 *                 type: number
 *               observacoes:
 *                 type: string
 *               responsavel_id:
 *                 type: integer
 *               responsavel_nome:
 *                 type: string
 *               grua_id:
 *                 type: string
 *               grua_valor:
 *                 type: number
 *               grua_mensalidade:
 *                 type: number
 *               funcionarios:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     role:
 *                       type: string
 *                     name:
 *                       type: string
 *               custos_mensais:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     item:
 *                       type: string
 *                     descricao:
 *                       type: string
 *                     unidade:
 *                       type: string
 *                     quantidadeOrcamento:
 *                       type: number
 *                     valorUnitario:
 *                       type: number
 *                     totalOrcamento:
 *                       type: number
 *                     mes:
 *                       type: string
 *                       pattern: '^\d{4}-\d{2}$'
 *                     tipo:
 *                       type: string
 *                       enum: [contrato, aditivo]
 *               status:
 *                 type: string
 *                 enum: [Planejamento, Em Andamento, Pausada, Concluída, Cancelada]
 *     responses:
 *       201:
 *         description: Obra criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', authenticateToken, requirePermission('criar_obras'), async (req, res) => {
  try {
    console.log('🔍 DEBUG - Dados recebidos para criação de obra:', req.body)
    
    const { error, value } = obraSchema.validate(req.body)
    if (error) {
      console.error('❌ Erro de validação:', error.details)
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message,
        allErrors: error.details
      })
    }
    
    console.log('✅ Dados validados com sucesso:', value)
    console.log('🔧 Dados da grua recebidos:', {
      grua_id: value.grua_id,
      grua_valor: value.grua_valor,
      grua_mensalidade: value.grua_mensalidade
    })
    console.log('👥 Funcionários recebidos:', value.funcionarios)
    console.log('💰 Custos mensais recebidos:', value.custos_mensais)
    console.log('📊 Resumo dos dados recebidos:')
    console.log('  - Obra:', value.nome)
    console.log('  - Cliente ID:', value.cliente_id)
    console.log('  - Grua ID:', value.grua_id || 'Nenhuma')
    console.log('  - Funcionários:', value.funcionarios?.length || 0)
    console.log('  - Custos mensais:', value.custos_mensais?.length || 0)

    // Verificar se cliente existe
    console.log('🔍 DEBUG - Verificando se cliente existe:', value.cliente_id)
    
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .select('id, nome')
      .eq('id', value.cliente_id)
      .single()

    console.log('📊 Resultado da consulta do cliente:')
    console.log('  - Cliente encontrado:', cliente)
    console.log('  - Erro:', clienteError)

    if (clienteError || !cliente) {
      console.log('❌ Cliente não encontrado, tentando criar automaticamente...')
      
      // Se o cliente não existe, tentar criar automaticamente
      // Verificar se há dados do cliente no corpo da requisição
      const { cliente_nome, cliente_cnpj, cliente_email, cliente_telefone } = req.body
      
      if (cliente_nome && cliente_cnpj) {
        console.log('🔧 Criando cliente automaticamente com dados:', {
          nome: cliente_nome,
          cnpj: cliente_cnpj,
          email: cliente_email,
          telefone: cliente_telefone
        })
        
        // Verificar se cliente já existe pelo CNPJ
        const { data: clienteExistente, error: clienteExistenteError } = await supabaseAdmin
          .from('clientes')
          .select('id, nome, cnpj')
          .eq('cnpj', cliente_cnpj)
          .single()

        if (clienteExistente) {
          console.log('✅ Cliente já existe pelo CNPJ:', clienteExistente)
          // Atualizar o cliente_id para usar o cliente existente
          value.cliente_id = clienteExistente.id
        } else {
          // Criar novo cliente
          const clienteData = {
            nome: cliente_nome,
            cnpj: cliente_cnpj,
            email: cliente_email || null,
            telefone: cliente_telefone || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          console.log('📝 Dados do cliente a ser criado:', clienteData)

          const { data: novoCliente, error: insertClienteError } = await supabaseAdmin
            .from('clientes')
            .insert(clienteData)
            .select()
            .single()

          if (insertClienteError) {
            console.error('❌ Erro ao criar cliente:', insertClienteError)
            return res.status(500).json({
              error: 'Erro ao criar cliente',
              message: insertClienteError.message
            })
          }

          console.log('✅ Cliente criado com sucesso:', novoCliente?.id)
          // Atualizar o cliente_id para usar o novo cliente
          value.cliente_id = novoCliente.id
        }
      } else {
        console.log('❌ Dados insuficientes para criar cliente automaticamente')
        return res.status(404).json({
          error: 'Cliente não encontrado',
          message: 'O cliente especificado não existe e não há dados suficientes para criar um novo'
        })
      }
    } else {
      console.log('✅ Cliente encontrado:', cliente.nome)
    }

    // Preparar dados da obra (incluindo todos os campos da tabela)
    const obraData = {
      nome: value.nome,
      cliente_id: value.cliente_id,
      endereco: value.endereco,
      cidade: value.cidade,
      estado: value.estado,
      tipo: value.tipo,
      cep: value.cep,
      contato_obra: value.contato_obra,
      telefone_obra: value.telefone_obra,
      email_obra: value.email_obra,
      status: value.status,
      // Novos campos adicionados
      descricao: value.descricao,
      data_inicio: value.data_inicio,
      data_fim: value.data_fim,
      orcamento: value.orcamento,
      observacoes: value.observacoes,
      responsavel_id: value.responsavel_id,
      responsavel_nome: value.responsavel_nome,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📝 Dados da obra a ser criada:', obraData)

    const { data, error: insertError } = await supabaseAdmin
      .from('obras')
      .insert(obraData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Erro ao criar obra:', insertError)
      return res.status(500).json({
        error: 'Erro ao criar obra',
        message: insertError.message
      })
    }

    console.log('✅ Obra criada com sucesso:', data?.id)

    // Processar dados das gruas se fornecidos
    if (value.gruas && value.gruas.length > 0) {
      console.log('🔧 Processando múltiplas gruas...')
      try {
        console.log('📝 Dados das gruas para processar:', value.gruas)
        
        // Processar cada grua
        for (const grua of value.gruas) {
          const gruaObraData = {
            obra_id: data.id,
            grua_id: grua.grua_id,
            valor_locacao_mensal: grua.taxa_mensal,
            data_inicio_locacao: value.data_inicio || new Date().toISOString().split('T')[0],
            status: 'Ativa',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          console.log('📝 Inserindo grua na tabela grua_obra:', gruaObraData)
          
          const { data: gruaObraResult, error: gruaObraError } = await supabaseAdmin
            .from('grua_obra')
            .insert(gruaObraData)
            .select()
            .single()
          
          if (gruaObraError) {
            console.error('❌ Erro ao inserir grua na tabela grua_obra:', gruaObraError)
          } else {
            console.log('✅ Grua inserida na tabela grua_obra:', gruaObraResult)
          }
        }
        
      } catch (gruaError) {
        console.error('❌ Erro ao processar dados das gruas:', gruaError)
        // Não falhar a criação da obra por causa das gruas
      }
    } else if (value.grua_id) {
      // Processar grua única (compatibilidade com versão anterior)
      console.log('🔧 Processando grua única (compatibilidade)...')
      try {
        console.log('📝 Dados da grua para processar:', {
          obra_id: data.id,
          grua_id: value.grua_id,
          valor_locacao_mensal: value.grua_mensalidade,
          data_inicio_locacao: value.data_inicio || new Date().toISOString().split('T')[0],
          status: 'Ativa'
        })
        
        const gruaObraData = {
          obra_id: data.id,
          grua_id: value.grua_id,
          valor_locacao_mensal: value.grua_mensalidade,
          data_inicio_locacao: value.data_inicio || new Date().toISOString().split('T')[0],
          status: 'Ativa',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        console.log('📝 Inserindo dados na tabela grua_obra:', gruaObraData)
        
        const { data: gruaObraResult, error: gruaObraError } = await supabaseAdmin
          .from('grua_obra')
          .insert(gruaObraData)
          .select()
          .single()
        
        if (gruaObraError) {
          console.error('❌ Erro ao inserir na tabela grua_obra:', gruaObraError)
        } else {
          console.log('✅ Registro inserido na tabela grua_obra:', gruaObraResult)
        }
        
      } catch (gruaError) {
        console.error('❌ Erro ao processar dados da grua:', gruaError)
        // Não falhar a criação da obra por causa da grua
      }
    }

    // Processar dados dos funcionários se fornecidos
    if (value.funcionarios && value.funcionarios.length > 0) {
      console.log('👥 Processando dados dos funcionários...')
      try {
        console.log('📝 Funcionários para processar:', value.funcionarios.map(f => ({
          obra_id: data.id,
          funcionario_id: f.userId,
          cargo: f.role,
          nome: f.name
        })))
        
        // Salvar funcionários na tabela funcionarios_obras
        for (const funcionario of value.funcionarios) {
          const funcionarioObraData = {
            funcionario_id: parseInt(funcionario.userId),
            obra_id: data.id,
            data_inicio: value.data_inicio || new Date().toISOString().split('T')[0],
            status: 'ativo',
            horas_trabalhadas: 0,
            observacoes: `Funcionário ${funcionario.name} (${funcionario.role}) alocado na obra`
          }
          
          console.log('📝 Inserindo funcionário na tabela funcionarios_obras:', funcionarioObraData)
          
          const { data: funcionarioObraResult, error: funcionarioObraError } = await supabaseAdmin
            .from('funcionarios_obras')
            .insert(funcionarioObraData)
            .select()
            .single()
          
          if (funcionarioObraError) {
            console.error('❌ Erro ao inserir funcionário na tabela funcionarios_obras:', funcionarioObraError)
          } else {
            console.log('✅ Funcionário inserido na tabela funcionarios_obras:', funcionarioObraResult)
          }
        }
        
      } catch (funcionarioError) {
        console.error('❌ Erro ao processar dados dos funcionários:', funcionarioError)
        // Não falhar a criação da obra por causa dos funcionários
      }
    }

    // Processar custos mensais se fornecidos
    if (value.custos_mensais && value.custos_mensais.length > 0) {
      console.log('💰 Processando custos mensais...')
      try {
        console.log('📝 Custos mensais para processar:', value.custos_mensais.map(c => ({
          obra_id: data.id,
          item: c.item,
          descricao: c.descricao,
          unidade: c.unidade,
          quantidade_orcamento: c.quantidadeOrcamento,
          valor_unitario: c.valorUnitario,
          total_orcamento: c.totalOrcamento,
          mes: c.mes,
          tipo: c.tipo
        })))
        
        // Criar custos mensais
        for (const custo of value.custos_mensais) {
          const custoMensalData = {
            obra_id: data.id,
            item: custo.item,
            descricao: custo.descricao,
            unidade: custo.unidade,
            quantidade_orcamento: custo.quantidadeOrcamento,
            valor_unitario: custo.valorUnitario,
            total_orcamento: custo.totalOrcamento,
            mes: custo.mes,
            quantidade_realizada: 0,
            valor_realizado: 0,
            quantidade_acumulada: 0,
            valor_acumulado: 0,
            quantidade_saldo: custo.quantidadeOrcamento,
            valor_saldo: custo.totalOrcamento,
            tipo: custo.tipo || 'contrato',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          console.log('📝 Inserindo custo mensal:', custoMensalData)
          
          const { data: custoResult, error: custoError } = await supabaseAdmin
            .from('custos_mensais')
            .insert(custoMensalData)
            .select()
            .single()
          
          if (custoError) {
            console.error('❌ Erro ao inserir custo mensal:', custoError)
          } else {
            console.log('✅ Custo mensal inserido:', custoResult)
          }
        }
        
      } catch (custoError) {
        console.error('❌ Erro ao processar custos mensais:', custoError)
        // Não falhar a criação da obra por causa dos custos
      }
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Obra criada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras/{id}:
 *   put:
 *     summary: Atualizar obra
 *     tags: [Obras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               endereco:
 *                 type: string
 *               cidade:
 *                 type: string
 *               estado:
 *                 type: string
 *               tipo:
 *                 type: string
 *               cep:
 *                 type: string
 *               contato_obra:
 *                 type: string
 *               telefone_obra:
 *                 type: string
 *               email_obra:
 *                 type: string
 *               data_inicio:
 *                 type: string
 *                 format: date
 *               data_fim:
 *                 type: string
 *                 format: date
 *               orcamento:
 *                 type: number
 *               observacoes:
 *                 type: string
 *               responsavel_id:
 *                 type: integer
 *               responsavel_nome:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Planejamento, Em Andamento, Pausada, Concluída, Cancelada]
 *     responses:
 *       200:
 *         description: Obra atualizada com sucesso
 *       404:
 *         description: Obra não encontrada
 */
router.put('/:id', authenticateToken, requirePermission('editar_obras'), async (req, res) => {
  try {
    const { id } = req.params

    const { error, value } = obraSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Preparar dados da obra (incluindo todos os campos da tabela)
    const updateData = {
      nome: value.nome,
      cliente_id: value.cliente_id,
      endereco: value.endereco,
      cidade: value.cidade,
      estado: value.estado,
      tipo: value.tipo,
      cep: value.cep,
      contato_obra: value.contato_obra,
      telefone_obra: value.telefone_obra,
      email_obra: value.email_obra,
      status: value.status,
      // Novos campos adicionados
      descricao: value.descricao,
      data_inicio: value.data_inicio,
      data_fim: value.data_fim,
      orcamento: value.orcamento,
      observacoes: value.observacoes,
      responsavel_id: value.responsavel_id,
      responsavel_nome: value.responsavel_nome,
      updated_at: new Date().toISOString()
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('obras')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Obra não encontrada',
          message: 'A obra com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar obra',
        message: updateError.message
      })
    }

    // Processar dados dos funcionários (incluindo quando vier array vazio)
    if (value.funcionarios !== undefined) {
      console.log('👥 Atualizando funcionários da obra...')
      try {
        // Primeiro, remover funcionários existentes da obra
        const { error: deleteError } = await supabaseAdmin
          .from('funcionarios_obras')
          .delete()
          .eq('obra_id', id)
        
        if (deleteError) {
          console.error('❌ Erro ao remover funcionários antigos:', deleteError)
        } else {
          console.log('✅ Funcionários antigos removidos')
        }
        
        // Inserir novos funcionários se houver
        if (value.funcionarios && value.funcionarios.length > 0) {
          for (const funcionario of value.funcionarios) {
          const funcionarioObraData = {
            funcionario_id: parseInt(funcionario.userId),
            obra_id: parseInt(id),
            data_inicio: value.data_inicio || new Date().toISOString().split('T')[0],
            status: 'ativo',
            horas_trabalhadas: 0,
            observacoes: `Funcionário ${funcionario.name} (${funcionario.role}) alocado na obra`
          }
          
          console.log('📝 Inserindo funcionário na tabela funcionarios_obras:', funcionarioObraData)
          
          const { data: funcionarioObraResult, error: funcionarioObraError } = await supabaseAdmin
            .from('funcionarios_obras')
            .insert(funcionarioObraData)
            .select()
            .single()
          
          if (funcionarioObraError) {
            console.error('❌ Erro ao inserir funcionário:', funcionarioObraError)
          } else {
            console.log('✅ Funcionário inserido:', funcionarioObraResult)
          }
          }
        }
        
      } catch (funcionarioError) {
        console.error('❌ Erro ao processar funcionários:', funcionarioError)
        // Não falhar a atualização da obra por causa dos funcionários
      }
    }

    // Processar dados da grua se fornecidos
    if (value.grua_id) {
      console.log('🏗️ Atualizando grua da obra...')
      try {
        // Remover gruas antigas
        await supabaseAdmin
          .from('grua_obra')
          .delete()
          .eq('obra_id', id)
        
        // Inserir nova grua
        const gruaObraData = {
          obra_id: parseInt(id),
          grua_id: value.grua_id,
          valor_locacao_mensal: value.grua_mensalidade,
          data_inicio_locacao: value.data_inicio || new Date().toISOString().split('T')[0],
          status: 'Ativa'
        }
        
        const { error: gruaError } = await supabaseAdmin
          .from('grua_obra')
          .insert(gruaObraData)
        
        if (gruaError) {
          console.error('❌ Erro ao inserir grua:', gruaError)
        } else {
          console.log('✅ Grua atualizada')
        }
      } catch (gruaError) {
        console.error('❌ Erro ao processar grua:', gruaError)
      }
    }

    // Processar custos mensais se fornecidos
    if (value.custos_mensais !== undefined) {
      console.log('💰 Atualizando custos mensais...')
      try {
        // Remover custos antigos
        await supabaseAdmin
          .from('custos_mensais')
          .delete()
          .eq('obra_id', id)
        
        // Inserir novos custos
        if (value.custos_mensais && value.custos_mensais.length > 0) {
          for (const custo of value.custos_mensais) {
            const custoMensalData = {
              obra_id: parseInt(id),
              item: custo.item,
              descricao: custo.descricao,
              unidade: custo.unidade,
              quantidade_orcamento: custo.quantidadeOrcamento,
              valor_unitario: custo.valorUnitario,
              total_orcamento: custo.totalOrcamento,
              mes: custo.mes,
              quantidade_realizada: 0,
              valor_realizado: 0,
              quantidade_acumulada: 0,
              valor_acumulado: 0,
              quantidade_saldo: custo.quantidadeOrcamento,
              valor_saldo: custo.totalOrcamento,
              tipo: custo.tipo || 'contrato'
            }
            
            const { error: custoError } = await supabaseAdmin
              .from('custos_mensais')
              .insert(custoMensalData)
            
            if (custoError) {
              console.error('❌ Erro ao inserir custo mensal:', custoError)
            }
          }
          console.log('✅ Custos mensais atualizados')
        }
      } catch (custoError) {
        console.error('❌ Erro ao processar custos mensais:', custoError)
      }
    }

    res.json({
      success: true,
      data,
      message: 'Obra atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras/{id}:
 *   delete:
 *     summary: Excluir obra
 *     tags: [Obras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *     responses:
 *       200:
 *         description: Obra excluída com sucesso
 *       404:
 *         description: Obra não encontrada
 */
router.delete('/:id', authenticateToken, requirePermission('excluir_obras'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('obras')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao excluir obra',
        message: error.message
      })
    }

    res.json({
      success: true,
      message: 'Obra excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})


export default router
