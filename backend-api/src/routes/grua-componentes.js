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
  quantidade_inicial: Joi.number().integer().min(0).default(0).allow(null),
  quantidade_reservada_inicial: Joi.number().integer().min(0).default(0).allow(null),
  status: Joi.string().valid('Disponível', 'Em uso', 'Danificado', 'Manutenção', 'Descontinuado', 'Devolvido').default('Disponível'),
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
  anexos: Joi.object().allow(null),
  componente_estoque_id: Joi.alternatives().try(
    Joi.string(), // Para produtos (ex: "P0006")
    Joi.number().integer() // Para componentes de grua (ex: 123)
  ).allow(null).optional() // ID do componente no estoque, se foi selecionado
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
  quantidade_inicial: Joi.number().integer().min(0).allow(null),
  quantidade_reservada_inicial: Joi.number().integer().min(0).allow(null),
  status: Joi.string().valid('Disponível', 'Em uso', 'Danificado', 'Manutenção', 'Descontinuado', 'Devolvido'),
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
 *           enum: [Disponível, Em uso, Danificado, Manutenção, Descontinuado, Devolvido]
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
    // Converter strings vazias em campos de data para null
    const bodyData = { ...req.body }
    if (bodyData.data_instalacao === '') bodyData.data_instalacao = null
    if (bodyData.data_ultima_manutencao === '') bodyData.data_ultima_manutencao = null
    if (bodyData.data_proxima_manutencao === '') bodyData.data_proxima_manutencao = null

    // Validar dados
    const { error, value } = componenteSchema.validate(bodyData)
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

    // Preparar dados para inserção (remover apenas campos que não existem na tabela)
    // Guardar componente_estoque_id antes de remover
    const componenteEstoqueId = value.componente_estoque_id
    
    const { 
      quantidade_inicial, 
      quantidade_reservada_inicial,
      ...componenteData 
    } = value
    
    // Guardar quantidade_total antes de inserir (será usado para decrementar estoque)
    const quantidadeTotalParaEstoque = componenteData.quantidade_total
    
    const dadosInsercao = {
      ...componenteData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Incluir componente_estoque_id apenas se existir
    if (componenteEstoqueId) {
      dadosInsercao.componente_estoque_id = componenteEstoqueId
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('grua_componentes')
      .insert(dadosInsercao)
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({
        error: 'Erro ao criar componente',
        message: insertError.message
      })
    }

    // Se o componente foi selecionado do estoque, fazer movimentação de saída
    if (componenteEstoqueId && quantidadeTotalParaEstoque) {
      try {
        console.log(`🔄 Processando movimentação de estoque para componente_estoque_id: ${componenteEstoqueId}, quantidade: ${quantidadeTotalParaEstoque}`)
        // Obter responsavel_id (similar à rota de movimentação de estoque)
        let responsavel_id = null
        if (typeof req.user.id === 'number' || !isNaN(parseInt(req.user.id))) {
          responsavel_id = parseInt(req.user.id)
        } else {
          // Se é um UUID, buscar o ID inteiro da tabela usuarios pelo email
          const { data: userData, error: userError } = await supabaseAdmin
            .from('usuarios')
            .select('id')
            .eq('email', req.user.email)
            .single()
          
          if (userData && !userError) {
            responsavel_id = userData.id
          } else {
            console.warn('⚠️ Usuário não encontrado na tabela usuarios, usando ID 1 como fallback')
            responsavel_id = 1
          }
        }

        // Verificar se componenteEstoqueId é um produto (começa com "P") ou componente de grua (número)
        const isProduto = typeof componenteEstoqueId === 'string' && componenteEstoqueId.startsWith('P')
        console.log(`📦 Tipo identificado: ${isProduto ? 'Produto' : 'Componente'}, ID: ${componenteEstoqueId}`)
        
        let estoqueAtual = null
        let estoqueError = null
        let valorUnitario = value.valor_unitario || 0

        if (isProduto) {
          // É um produto do estoque - buscar por produto_id
          const { data: produto, error: produtoError } = await supabaseAdmin
            .from('produtos')
            .select('id, nome, valor_unitario')
            .eq('id', componenteEstoqueId)
            .single()

          if (produtoError) {
            console.error(`❌ Erro ao buscar produto ${componenteEstoqueId}:`, produtoError)
          } else if (produto) {
            console.log(`✅ Produto encontrado: ${produto.nome}`)
            valorUnitario = produto.valor_unitario || valorUnitario

            // Buscar estoque do produto
            const estoqueResult = await supabaseAdmin
              .from('estoque')
              .select('quantidade_atual, quantidade_disponivel, quantidade_reservada, valor_total')
              .eq('produto_id', componenteEstoqueId)
              .single()

            estoqueAtual = estoqueResult.data
            estoqueError = estoqueResult.error
            
            if (estoqueError) {
              console.error(`❌ Erro ao buscar estoque do produto ${componenteEstoqueId}:`, estoqueError)
            } else if (estoqueAtual) {
              console.log(`📊 Estoque atual do produto ${componenteEstoqueId}:`, {
                quantidade_atual: estoqueAtual.quantidade_atual,
                quantidade_disponivel: estoqueAtual.quantidade_disponivel,
                quantidade_reservada: estoqueAtual.quantidade_reservada
              })
            } else {
              console.warn(`⚠️ Produto ${componenteEstoqueId} não possui registro no estoque`)
            }
          } else {
            console.warn(`⚠️ Produto ${componenteEstoqueId} não encontrado`)
          }
        } else {
          // É um componente de grua - buscar por componente_id
          // Converter para número se necessário (componentes de grua têm IDs numéricos)
          const componenteIdNumero = typeof componenteEstoqueId === 'string' 
            ? parseInt(componenteEstoqueId) 
            : componenteEstoqueId

          const estoqueResult = await supabaseAdmin
            .from('estoque')
            .select('quantidade_atual, quantidade_disponivel, quantidade_reservada, valor_total')
            .eq('componente_id', componenteIdNumero)
            .single()

          estoqueAtual = estoqueResult.data
          estoqueError = estoqueResult.error

          // Obter dados do componente original para valor unitário
          const { data: componenteOriginal } = await supabaseAdmin
            .from('grua_componentes')
            .select('valor_unitario')
            .eq('id', componenteIdNumero)
            .single()

          if (componenteOriginal) {
            valorUnitario = componenteOriginal.valor_unitario || valorUnitario
          }
        }

        if (!estoqueError && estoqueAtual) {
          // Verificar se há estoque disponível suficiente
          if (estoqueAtual.quantidade_disponivel < quantidadeTotalParaEstoque) {
            // Se não há estoque suficiente, remover o componente criado e retornar erro
            await supabaseAdmin
              .from('grua_componentes')
              .delete()
              .eq('id', data.id)

            return res.status(400).json({
              error: 'Estoque insuficiente',
              message: `Estoque disponível: ${estoqueAtual.quantidade_disponivel}, quantidade solicitada: ${quantidadeTotalParaEstoque}`
            })
          }

          // Calcular nova quantidade
          const novaQuantidade = estoqueAtual.quantidade_atual - quantidadeTotalParaEstoque
          const novaQuantidadeDisponivel = estoqueAtual.quantidade_disponivel - quantidadeTotalParaEstoque
          const valorTotal = quantidadeTotalParaEstoque * valorUnitario

          console.log(`📉 Calculando nova quantidade:`, {
            quantidade_atual: estoqueAtual.quantidade_atual,
            quantidade_disponivel: estoqueAtual.quantidade_disponivel,
            quantidadeTotalParaEstoque,
            novaQuantidade,
            novaQuantidadeDisponivel
          })

          // Atualizar estoque
          let updateEstoqueError = null
          if (isProduto) {
            // Atualizar estoque do produto
            console.log(`🔄 Atualizando estoque do produto ${componenteEstoqueId}...`)
            const updateResult = await supabaseAdmin
              .from('estoque')
              .update({
                quantidade_atual: novaQuantidade,
                quantidade_disponivel: novaQuantidadeDisponivel,
                valor_total: novaQuantidade * valorUnitario,
                ultima_movimentacao: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('produto_id', componenteEstoqueId)
            
            updateEstoqueError = updateResult.error
            
            if (updateEstoqueError) {
              console.error(`❌ Erro ao atualizar estoque do produto ${componenteEstoqueId}:`, updateEstoqueError)
            } else {
              console.log(`✅ Estoque do produto ${componenteEstoqueId} atualizado com sucesso! Nova quantidade disponível: ${novaQuantidadeDisponivel}`)
            }
          } else {
            // Atualizar estoque do componente
            // Converter para número se necessário
            const componenteIdNumero = typeof componenteEstoqueId === 'string' 
              ? parseInt(componenteEstoqueId) 
              : componenteEstoqueId

            const updateResult = await supabaseAdmin
              .from('estoque')
              .update({
                quantidade_atual: novaQuantidade,
                quantidade_disponivel: novaQuantidadeDisponivel,
                valor_total: novaQuantidade * valorUnitario,
                ultima_movimentacao: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('componente_id', componenteIdNumero)
            
            updateEstoqueError = updateResult.error
          }

          if (updateEstoqueError) {
            console.error('Erro ao atualizar estoque:', updateEstoqueError)
            throw updateEstoqueError
          }

          // Registrar movimentação de estoque
          // Primeiro, obter o item_id do estoque para usar na movimentação
          let itemIdEstoque = null
          if (isProduto) {
            const { data: estoqueItem } = await supabaseAdmin
              .from('estoque')
              .select('id')
              .eq('produto_id', componenteEstoqueId)
              .single()
            itemIdEstoque = estoqueItem?.id
          } else {
            // Converter para número se necessário
            const componenteIdNumero = typeof componenteEstoqueId === 'string' 
              ? parseInt(componenteEstoqueId) 
              : componenteEstoqueId

            const { data: estoqueItem } = await supabaseAdmin
              .from('estoque')
              .select('id')
              .eq('componente_id', componenteIdNumero)
              .single()
            itemIdEstoque = estoqueItem?.id
          }

          // Tentar inserir movimentação com estrutura completa primeiro
          const movimentacaoData = {
            tipo: 'Saída',
            quantidade: quantidadeTotalParaEstoque,
            valor_unitario: valorUnitario.toString(),
            valor_total: valorTotal.toString(),
            data_movimentacao: new Date().toISOString(),
            responsavel_id: responsavel_id,
            observacoes: `Componente adicionado à grua ${value.grua_id}`,
            status: 'Confirmada',
            motivo: `Adição de componente à grua`,
            created_at: new Date().toISOString()
          }

          if (isProduto) {
            movimentacaoData.produto_id = componenteEstoqueId.toString()
          } else {
            // Converter para número se necessário (componentes de grua têm IDs numéricos)
            const componenteIdNumero = typeof componenteEstoqueId === 'string' 
              ? parseInt(componenteEstoqueId) 
              : componenteEstoqueId
            movimentacaoData.componente_id = componenteIdNumero
          }

          // Se temos item_id do estoque, adicionar também
          if (itemIdEstoque) {
            movimentacaoData.item_id = itemIdEstoque
          }

          try {
            const { error: movimentacaoError } = await supabaseAdmin
              .from('movimentacoes_estoque')
              .insert(movimentacaoData)

            if (movimentacaoError) {
              console.error('Erro ao registrar movimentação (tentativa com estrutura completa):', movimentacaoError)
              
              // Tentar inserir com estrutura mínima se a primeira falhar
              if (itemIdEstoque) {
                const movimentacaoMinima = {
                  item_id: itemIdEstoque,
                  tipo: 'saida',
                  quantidade: quantidadeTotalParaEstoque,
                  motivo: `Adição de componente à grua ${value.grua_id}`,
                  funcionario_id: responsavel_id,
                  data_movimentacao: new Date().toISOString(),
                  observacoes: `Componente adicionado à grua ${value.grua_id}`
                }
                
                const { error: movimentacaoMinimaError } = await supabaseAdmin
                  .from('movimentacoes_estoque')
                  .insert(movimentacaoMinima)
                
                if (movimentacaoMinimaError) {
                  console.error('Erro ao registrar movimentação (estrutura mínima):', movimentacaoMinimaError)
                  // Não falhar a criação do componente se houver erro na movimentação
                } else {
                  console.log(`✅ Movimentação registrada (estrutura mínima): ${quantidadeTotalParaEstoque} unidades`)
                }
              }
            } else {
              console.log(`✅ Estoque decrementado: ${quantidadeTotalParaEstoque} unidades do ${isProduto ? 'produto' : 'componente'} ${componenteEstoqueId}`)
            }
          } catch (error) {
            console.error('Erro ao registrar movimentação:', error)
            // Não falhar a criação do componente se houver erro na movimentação
          }
        } else {
          console.log(`ℹ️ ${isProduto ? 'Produto' : 'Componente'} ${componenteEstoqueId} não possui registro no estoque, pulando movimentação`)
        }
      } catch (error) {
        console.error('❌ Erro ao decrementar estoque:', error)
        console.error('Stack trace:', error.stack)
        // Não falhar a criação do componente se houver erro no estoque
        // Apenas logar o erro e continuar
        // O componente já foi criado, então não vamos reverter
      }
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

    // Converter strings vazias em campos de data para null
    const bodyData = { ...req.body }
    if (bodyData.data_instalacao === '') bodyData.data_instalacao = null
    if (bodyData.data_ultima_manutencao === '') bodyData.data_ultima_manutencao = null
    if (bodyData.data_proxima_manutencao === '') bodyData.data_proxima_manutencao = null

    // Validar dados
    const { error, value } = componenteUpdateSchema.validate(bodyData)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se o componente existe e obter dados atuais
    const { data: componenteExistente, error: checkError } = await supabaseAdmin
      .from('grua_componentes')
      .select('id, componente_estoque_id, quantidade_em_uso')
      .eq('id', id)
      .single()

    if (checkError || !componenteExistente) {
      return res.status(404).json({
        error: 'Componente não encontrado',
        message: 'O componente com o ID especificado não existe'
      })
    }

    // Preparar dados para atualização (remover campos que não existem na tabela)
    const { 
      quantidade_inicial, 
      quantidade_reservada_inicial,
      ...updateData 
    } = value
    
    // Se quantidade_em_uso está sendo atualizada para 0 e o componente tem componente_estoque_id,
    // mudar status para "Devolvido"
    if (updateData.quantidade_em_uso !== undefined && 
        updateData.quantidade_em_uso === 0 && 
        componenteExistente.componente_estoque_id) {
      // Verificar se a observação contém "Devolução" para confirmar que é uma devolução
      const observacoes = updateData.observacoes || value.observacoes || ''
      if (observacoes.includes('Devolução') || observacoes.includes('Devolução') || !updateData.status) {
        // Se não foi especificado um status ou se é uma devolução, mudar para "Devolvido"
        updateData.status = 'Devolvido'
      }
    } else if (updateData.quantidade_em_uso !== undefined && 
               updateData.quantidade_em_uso === 0 && 
               !componenteExistente.componente_estoque_id &&
               !updateData.status) {
      // Se não tem componente_estoque_id mas quantidade_em_uso = 0, status = "Disponível"
      updateData.status = 'Disponível'
    }
    
    updateData.updated_at = new Date().toISOString()

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
/**
 * @swagger
 * /api/grua-componentes/devolver:
 *   post:
 *     summary: Processar devolução de componentes de uma obra
 *     tags: [Grua Componentes]
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
 *               - devolucoes
 *             properties:
 *               obra_id:
 *                 type: integer
 *               devolucoes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - componente_id
 *                     - tipo
 *                   properties:
 *                     componente_id:
 *                       type: integer
 *                     tipo:
 *                       type: string
 *                       enum: [completa, parcial]
 *                     quantidade_devolvida:
 *                       type: integer
 *                     valor:
 *                       type: number
 *                     observacoes:
 *                       type: string
 *     responses:
 *       200:
 *         description: Devoluções processadas com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/devolver', async (req, res) => {
  try {
    const { obra_id, devolucoes } = req.body

    if (!obra_id || !Array.isArray(devolucoes) || devolucoes.length === 0) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'obra_id e devolucoes são obrigatórios'
      })
    }

    // Obter responsavel_id
    let responsavel_id = null
    if (typeof req.user.id === 'number' || !isNaN(parseInt(req.user.id))) {
      responsavel_id = parseInt(req.user.id)
    } else {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', req.user.email)
        .single()
      
      if (userData && !userError) {
        responsavel_id = userData.id
      } else {
        responsavel_id = 1
      }
    }

    const resultados = []

    for (const devolucao of devolucoes) {
      const { componente_id, tipo, quantidade_devolvida, valor, observacoes } = devolucao

      // Buscar componente
      const { data: componente, error: componenteError } = await supabaseAdmin
        .from('grua_componentes')
        .select('*')
        .eq('id', componente_id)
        .single()

      if (componenteError || !componente) {
        resultados.push({
          componente_id,
          sucesso: false,
          erro: 'Componente não encontrado'
        })
        continue
      }

      if (tipo === 'completa') {
        // Devolução completa: incrementar estoque
        const quantidadeDevolver = quantidade_devolvida || componente.quantidade_em_uso
        
        // Atualizar componente: reduzir quantidade_em_uso e aumentar quantidade_disponivel
        const novaQuantidadeEmUso = componente.quantidade_em_uso - quantidadeDevolver
        const novaQuantidadeDisponivel = componente.quantidade_disponivel + quantidadeDevolver

        const { error: updateError } = await supabaseAdmin
          .from('grua_componentes')
          .update({
            quantidade_em_uso: novaQuantidadeEmUso,
            quantidade_disponivel: novaQuantidadeDisponivel,
            updated_at: new Date().toISOString()
          })
          .eq('id', componente_id)

        if (updateError) {
          resultados.push({
            componente_id,
            sucesso: false,
            erro: updateError.message
          })
          continue
        }

        // Incrementar estoque se o componente tiver registro no estoque
        const { data: estoqueAtual } = await supabaseAdmin
          .from('estoque')
          .select('*')
          .eq('componente_id', componente_id)
          .single()

        if (estoqueAtual) {
          const novaQuantidadeEstoque = estoqueAtual.quantidade_atual + quantidadeDevolver
          const novaQuantidadeDisponivelEstoque = estoqueAtual.quantidade_disponivel + quantidadeDevolver
          const novoValorTotal = novaQuantidadeEstoque * componente.valor_unitario

          await supabaseAdmin
            .from('estoque')
            .update({
              quantidade_atual: novaQuantidadeEstoque,
              quantidade_disponivel: novaQuantidadeDisponivelEstoque,
              valor_total: novoValorTotal,
              ultima_movimentacao: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('componente_id', componente_id)

          // Registrar movimentação de estoque (Entrada)
          await supabaseAdmin
            .from('movimentacoes_estoque')
            .insert({
              componente_id: componente_id,
              tipo: 'Entrada',
              quantidade: quantidadeDevolver.toString(),
              valor_unitario: componente.valor_unitario.toString(),
              valor_total: (quantidadeDevolver * componente.valor_unitario).toString(),
              data_movimentacao: new Date().toISOString(),
              responsavel_id: responsavel_id,
              observacoes: `Devolução completa de componente da obra ${obra_id}`,
              status: 'Confirmada',
              motivo: 'Devolução de componente',
              created_at: new Date().toISOString()
            })
        }

        // Registrar movimentação do componente
        await supabaseAdmin
          .from('historico_componentes')
          .insert({
            componente_id: componente_id,
            tipo_movimentacao: 'Remoção',
            quantidade_movimentada: quantidadeDevolver,
            quantidade_anterior: componente.quantidade_em_uso,
            quantidade_atual: novaQuantidadeEmUso,
            motivo: 'Devolução completa à obra',
            obra_id: obra_id,
            funcionario_responsavel_id: responsavel_id,
            observacoes: observacoes || 'Devolução completa do componente',
            created_at: new Date().toISOString()
          })

        resultados.push({
          componente_id,
          sucesso: true,
          mensagem: 'Devolução completa processada'
        })

      } else if (tipo === 'parcial') {
        // Devolução parcial: registrar o que não retornou
        const quantidadeNaoRetornou = componente.quantidade_em_uso - (quantidade_devolvida || 0)
        const quantidadeDevolver = quantidade_devolvida || 0

        if (quantidadeDevolver > 0) {
          // Atualizar componente: reduzir quantidade_em_uso e aumentar quantidade_disponivel apenas do que retornou
          const novaQuantidadeEmUso = componente.quantidade_em_uso - quantidadeDevolver
          const novaQuantidadeDisponivel = componente.quantidade_disponivel + quantidadeDevolver

          const { error: updateError } = await supabaseAdmin
            .from('grua_componentes')
            .update({
              quantidade_em_uso: novaQuantidadeEmUso,
              quantidade_disponivel: novaQuantidadeDisponivel,
              quantidade_danificada: componente.quantidade_danificada + quantidadeNaoRetornou,
              updated_at: new Date().toISOString()
            })
            .eq('id', componente_id)

          if (updateError) {
            resultados.push({
              componente_id,
              sucesso: false,
              erro: updateError.message
            })
            continue
          }

          // Incrementar estoque apenas do que retornou
          const { data: estoqueAtual } = await supabaseAdmin
            .from('estoque')
            .select('*')
            .eq('componente_id', componente_id)
            .single()

          if (estoqueAtual && quantidadeDevolver > 0) {
            const novaQuantidadeEstoque = estoqueAtual.quantidade_atual + quantidadeDevolver
            const novaQuantidadeDisponivelEstoque = estoqueAtual.quantidade_disponivel + quantidadeDevolver
            const novoValorTotal = novaQuantidadeEstoque * componente.valor_unitario

            await supabaseAdmin
              .from('estoque')
              .update({
                quantidade_atual: novaQuantidadeEstoque,
                quantidade_disponivel: novaQuantidadeDisponivelEstoque,
                valor_total: novoValorTotal,
                ultima_movimentacao: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('componente_id', componente_id)

            // Registrar movimentação de estoque (Entrada parcial)
            await supabaseAdmin
              .from('movimentacoes_estoque')
              .insert({
                componente_id: componente_id,
                tipo: 'Entrada',
                quantidade: quantidadeDevolver.toString(),
                valor_unitario: componente.valor_unitario.toString(),
                valor_total: (quantidadeDevolver * componente.valor_unitario).toString(),
                data_movimentacao: new Date().toISOString(),
                responsavel_id: responsavel_id,
                observacoes: `Devolução parcial de componente da obra ${obra_id}. Não retornou: ${quantidadeNaoRetornou} unidades. Valor: R$ ${valor || 0}`,
                status: 'Confirmada',
                motivo: 'Devolução parcial de componente',
                created_at: new Date().toISOString()
              })
          }
        }

        // Registrar movimentação do componente
        await supabaseAdmin
          .from('historico_componentes')
          .insert({
            componente_id: componente_id,
            tipo_movimentacao: 'Remoção',
            quantidade_movimentada: quantidadeDevolver,
            quantidade_anterior: componente.quantidade_em_uso,
            quantidade_atual: componente.quantidade_em_uso - quantidadeDevolver,
            motivo: `Devolução parcial à obra. Não retornou: ${quantidadeNaoRetornou} unidades. Valor: R$ ${valor || 0}`,
            obra_id: obra_id,
            funcionario_responsavel_id: responsavel_id,
            observacoes: observacoes || `Devolução parcial. Quantidade não retornada: ${quantidadeNaoRetornou}. Valor: R$ ${valor || 0}`,
            created_at: new Date().toISOString()
          })

        resultados.push({
          componente_id,
          sucesso: true,
          mensagem: `Devolução parcial processada. Não retornou: ${quantidadeNaoRetornou} unidades. Valor: R$ ${valor || 0}`
        })
      }
    }

    res.json({
      success: true,
      data: resultados,
      message: 'Devoluções processadas com sucesso'
    })
  } catch (error) {
    console.error('Erro ao processar devoluções:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

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
