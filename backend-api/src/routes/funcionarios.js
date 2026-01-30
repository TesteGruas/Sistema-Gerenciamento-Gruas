/**
 * Rotas para gerenciamento de funcionários
 * Sistema de Gerenciamento de Gruas
 */

import express from 'express'
import Joi from 'joi'
import crypto from 'crypto'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'
import { sendPasswordResetEmail } from '../services/email.service.js'

// Função auxiliar para gerar senha segura aleatória
function generateSecurePassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  const randomBytes = crypto.randomBytes(length)
  
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length]
  }
  
  return password
}

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// Log para debug - verificar se as rotas estão sendo registradas
console.log('✅ Rotas de funcionários registradas')

// Schema de validação para funcionários
const funcionarioSchema = Joi.object({
  nome: Joi.string().min(2).max(255).required(),
  cargo: Joi.string().min(2).max(255).required(), // Validação dinâmica - aceita qualquer cargo do banco
  telefone: Joi.string().max(20).allow(null, '').optional(),
  email: Joi.string().email().allow(null, '').optional(),
  cpf: Joi.string().pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/).allow(null, '').optional(),
  turno: Joi.string().valid('Diurno', 'Noturno', 'Sob Demanda').default('Diurno'),
  status: Joi.string().valid('Ativo', 'Inativo', 'Férias').default('Ativo'),
  data_admissao: Joi.date().allow(null).optional(),
  salario: Joi.number().min(0).allow(null).optional(),
  observacoes: Joi.string().allow(null, '').optional(),
  // Campo para indicar se é supervisor (usado como informação auxiliar)
  eh_supervisor: Joi.boolean().default(false).optional(),
  // Campos para criação do usuário
  criar_usuario: Joi.boolean().default(true).optional(),
  usuario_senha: Joi.string().min(6).optional().allow('', null)
})

// Schema para atualização (campos opcionais e sem validação de senha)
const funcionarioUpdateSchema = Joi.object({
  nome: Joi.string().min(2).max(255).optional(),
  cargo: Joi.string().min(2).max(255).optional(), // Validação dinâmica - aceita qualquer cargo do banco
  telefone: Joi.string().max(20).allow(null, '').optional(),
  email: Joi.string().email().allow(null, '').optional(),
  cpf: Joi.string().pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/).allow(null, '').optional(),
  turno: Joi.string().valid('Diurno', 'Noturno', 'Sob Demanda').optional(),
  status: Joi.string().valid('Ativo', 'Inativo', 'Férias').optional(),
  data_admissao: Joi.date().allow(null).optional(),
  salario: Joi.number().min(0).allow(null).optional(),
  observacoes: Joi.string().allow(null, '').optional()
  // Não incluir criar_usuario e usuario_senha no update
})

/**
 * @swagger
 * /funcionarios:
 *   get:
 *     summary: Listar todos os funcionários
 *     tags: [Funcionários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativo, Inativo, Férias]
 *         description: Filtrar por status
 *       - in: query
 *         name: cargo
 *         schema:
 *           type: string
 *           enum: [Operador, Sinaleiro, Técnico Manutenção, Supervisor, Mecânico, Engenheiro, Chefe de Obras]
 *         description: Filtrar por cargo
 *       - in: query
 *         name: turno
 *         schema:
 *           type: string
 *           enum: [Diurno, Noturno, Sob Demanda]
 *         description: Filtrar por turno
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome, email, telefone, CPF ou cargo (LIKE)
 *     responses:
 *       200:
 *         description: Lista de funcionários
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
 *                     $ref: '#/components/schemas/Funcionario'
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
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('='.repeat(80))
    console.log('[FUNCIONARIOS] Rota GET / chamada')
    console.log('[FUNCIONARIOS] Query params:', JSON.stringify(req.query, null, 2))
    console.log('[FUNCIONARIOS] Headers:', {
      authorization: req.headers.authorization ? 'presente' : 'ausente',
      'content-type': req.headers['content-type']
    })
    
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const offset = (page - 1) * limit
    
    console.log('[FUNCIONARIOS] Paginação:', { page, limit, offset })

    // Construir filtros para funcionários
    let query = supabaseAdmin
      .from('funcionarios')
      .select(`
        *,
        cargo_info:cargos!cargo_id(
          id,
          nome,
          nivel,
          descricao
        ),
        usuario:usuarios!funcionario_id(
          id,
          nome,
          email,
          status
        ),
        funcionarios_obras(
          id,
          obra_id,
          data_inicio,
          data_fim,
          status,
          obras(
            id,
            nome,
            status
          )
        )
      `, { count: 'exact' })

    // Excluir supervisores (são terceirizados do cliente, não funcionários)
    // Usar apenas eh_supervisor como filtro principal, pois alguns funcionários podem ter cargo NULL
    // (quando usam apenas cargo_id, o campo cargo pode ser NULL)
    query = query.eq('eh_supervisor', false)

    // Aplicar filtros
    if (req.query.status) {
      query = query.eq('status', req.query.status)
    }
    if (req.query.cargo) {
      query = query.eq('cargo', req.query.cargo)
    }
    if (req.query.turno) {
      query = query.eq('turno', req.query.turno)
    }
    // Aceitar tanto 'search' quanto 'q' para compatibilidade
    // Decodificar o termo de busca (pode vir com + ou %20 para espaços)
    let searchTermParam = req.query.search || req.query.q
    console.log('[FUNCIONARIOS] Termo de busca original:', searchTermParam)
    
    if (searchTermParam) {
      // Decodificar URL (substituir + por espaço e decodificar %20, etc)
      searchTermParam = decodeURIComponent(searchTermParam.replace(/\+/g, ' '))
      console.log(`[FUNCIONARIOS] Termo de busca decodificado: "${searchTermParam}"`)
      
      // Remover caracteres não numéricos para busca em CPF e telefone
      const numerosLimpos = searchTermParam.replace(/\D/g, '')
      const telefoneLimpo = numerosLimpos
      const cpfLimpo = numerosLimpos
      
      // Construir condições de busca: nome, email, telefone, CPF e cargo
      const condicoes = [
        `nome.ilike.%${searchTermParam}%`,
        `email.ilike.%${searchTermParam}%`,
        `cargo.ilike.%${searchTermParam}%`
      ]
      
      // Adicionar busca por telefone se tiver pelo menos 3 dígitos
      if (telefoneLimpo.length >= 3) {
        condicoes.push(`telefone.ilike.%${telefoneLimpo}%`)
      }
      
      // Adicionar busca por CPF se tiver pelo menos 3 dígitos
      if (cpfLimpo.length >= 3) {
        condicoes.push(`cpf.ilike.%${cpfLimpo}%`)
      }
      
      // Aplicar busca com OR entre todas as condições
      query = query.or(condicoes.join(','))
      console.log(`[FUNCIONARIOS] Query com busca aplicada - condições: ${condicoes.length}`)
    } else {
      console.log('[FUNCIONARIOS] Nenhum termo de busca fornecido')
    }

    // Aplicar ordenação (ID descendente para mostrar os mais recentes primeiro)
    // NÃO aplicar paginação aqui - será aplicada depois de combinar com usuários
    query = query.order('id', { ascending: false })

    console.log('[FUNCIONARIOS] Executando query no Supabase...')
    const { data: funcionariosData, error: funcionariosError, count: funcionariosCount } = await query

    if (funcionariosError) {
      console.error('[FUNCIONARIOS] ❌ Erro ao buscar funcionários:', funcionariosError)
      console.error('[FUNCIONARIOS] Detalhes do erro:', JSON.stringify(funcionariosError, null, 2))
      return res.status(500).json({
        error: 'Erro ao buscar funcionários',
        message: funcionariosError.message
      })
    }

    console.log(`[FUNCIONARIOS] ✅ Query executada com sucesso`)
    console.log(`[FUNCIONARIOS] Termo de busca: "${searchTermParam || 'nenhum'}"`)
    console.log(`[FUNCIONARIOS] Status filtro: "${req.query.status || 'nenhum'}"`)
    console.log(`[FUNCIONARIOS] Funcionários encontrados: ${funcionariosData?.length || 0}`)
    console.log(`[FUNCIONARIOS] Total no banco: ${funcionariosCount || 0}`)
    
    // Debug: listar IDs dos funcionários encontrados
    if (funcionariosData && funcionariosData.length > 0) {
      const ids = funcionariosData.map(f => f.id).join(', ')
      console.log(`[FUNCIONARIOS] IDs encontrados: ${ids}`)
    } else {
      console.log(`[FUNCIONARIOS] ⚠️ Nenhum funcionário encontrado na query`)
    }

    // Buscar também usuários sem funcionario_id vinculado (como operadores)
    // que podem não estar na tabela funcionarios
    let usuariosSemFuncionario = []
    try {
      // Decodificar o termo de busca se ainda não foi decodificado
      let searchTermClean = searchTermParam
      if (searchTermClean) {
        if (searchTermClean.includes('+') || searchTermClean.includes('%')) {
          searchTermClean = decodeURIComponent(searchTermClean.replace(/\+/g, ' '))
        }
      }
      
      console.log(`[DEBUG] Buscando usuários sem funcionario_id com termo: "${searchTermClean || 'nenhum'}"`)
      
      // Fazer a query completa
      let usuariosQuery = supabaseAdmin
        .from('usuarios')
        .select(`
          *,
          usuario_perfis(
            id,
            perfil_id,
            status,
            data_atribuicao,
            perfis(
              id,
              nome,
              descricao,
              nivel_acesso
            )
          )
        `)
        .is('funcionario_id', null)
      
      // Aplicar filtro de status se fornecido
      if (req.query.status) {
        usuariosQuery = usuariosQuery.eq('status', req.query.status)
        console.log(`[DEBUG] Filtro de status aplicado: ${req.query.status}`)
      }
      
      // Aplicar busca por nome, email, telefone e CPF se houver termo de busca
      if (searchTermClean) {
        const numerosLimpos = searchTermClean.replace(/\D/g, '')
        const telefoneLimpo = numerosLimpos
        const cpfLimpo = numerosLimpos
        
        const condicoes = [
          `nome.ilike.%${searchTermClean}%`,
          `email.ilike.%${searchTermClean}%`
        ]
        
        // Adicionar busca por telefone se tiver pelo menos 3 dígitos
        if (telefoneLimpo.length >= 3) {
          condicoes.push(`telefone.ilike.%${telefoneLimpo}%`)
        }
        
        // Adicionar busca por CPF se tiver pelo menos 3 dígitos (se o campo existir na tabela usuarios)
        if (cpfLimpo.length >= 3) {
          condicoes.push(`cpf.ilike.%${cpfLimpo}%`)
        }
        
        usuariosQuery = usuariosQuery.or(condicoes.join(','))
      }
      
      // NÃO aplicar paginação aqui - será aplicada depois de combinar com funcionários
      // Apenas aplicar ordenação
      usuariosQuery = usuariosQuery.order('created_at', { ascending: false })
      
      console.log(`[DEBUG] Query final de usuários:`, {
        termo: searchTermClean || 'nenhum',
        status: req.query.status || 'nenhum',
        funcionario_id: 'null',
        offset: 'não aplicado (paginação será feita depois)',
        limit: 'não aplicado (paginação será feita depois)'
      })
      
      console.log(`[DEBUG] Query de usuários construída, executando...`)

      const { data: usuariosData, error: usuariosError } = await usuariosQuery

      if (usuariosError) {
        console.error('[DEBUG] Erro ao buscar usuários sem funcionario_id:', usuariosError)
        console.error('[DEBUG] Detalhes do erro:', JSON.stringify(usuariosError, null, 2))
        console.error('[DEBUG] Código do erro:', usuariosError.code)
        console.error('[DEBUG] Mensagem do erro:', usuariosError.message)
        console.error('[DEBUG] Detalhes completos:', usuariosError.details)
      } else {
        console.log(`[DEBUG] Query de usuários executada com sucesso. Resultados: ${usuariosData?.length || 0}`)
        if (usuariosData && usuariosData.length > 0) {
          console.log(`[DEBUG] ✅ Encontrados ${usuariosData.length} usuários sem funcionario_id`)
          if (usuariosData.length > 0) {
            console.log(`[DEBUG] Primeiro usuário encontrado:`, {
              id: usuariosData[0].id,
              nome: usuariosData[0].nome,
              email: usuariosData[0].email,
              telefone: usuariosData[0].telefone,
              status: usuariosData[0].status,
              funcionario_id: usuariosData[0].funcionario_id
            })
          }
        
          // Converter usuários para formato de funcionário
          // Excluir supervisores (são terceirizados do cliente, não funcionários)
          usuariosSemFuncionario = usuariosData
            .filter(usuario => {
              const cargo = usuario.cargo || null
              return cargo !== 'Supervisor'
            })
            .map(usuario => {
              const perfil = usuario.usuario_perfis?.[0]?.perfis
              return {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                telefone: usuario.telefone,
                cpf: usuario.cpf,
                status: usuario.status,
                cargo: usuario.cargo || null, // Usar cargo do usuário se existir
                turno: usuario.turno || null,
                data_admissao: usuario.data_admissao || null,
                salario: usuario.salario || null,
                funcionario_id: null,
                usuario_existe: true,
                usuario_criado: true,
                perfil_usuario: perfil ? {
                  id: perfil.id,
                  nome: perfil.nome,
                  nivel_acesso: perfil.nivel_acesso
                } : null,
                funcionarios_obras: [],
                obra_atual: null,
                obras_vinculadas: []
              }
            })
        } else {
          console.log('[DEBUG] Nenhum usuário sem funcionario_id encontrado')
        }
      }
    } catch (error) {
      console.error('Erro ao processar busca de usuários sem funcionario_id:', error)
    }

    // Combinar funcionários e usuários sem funcionario_id
    // Remover duplicatas baseado no ID (caso um funcionário esteja em ambas as tabelas)
    const funcionariosMap = new Map()
    
    // Adicionar funcionários da tabela funcionarios
    if (funcionariosData) {
      funcionariosData.forEach(func => {
        funcionariosMap.set(func.id, func)
      })
    }
    
    // Adicionar usuários sem funcionario_id (só se não existir já na tabela funcionarios)
    usuariosSemFuncionario.forEach(usuario => {
      if (!funcionariosMap.has(usuario.id)) {
        funcionariosMap.set(usuario.id, usuario)
      }
    })
    
    const todosFuncionarios = Array.from(funcionariosMap.values())
    
    console.log(`[FUNCIONARIOS] Total combinado (sem duplicatas): ${todosFuncionarios.length}`)
    console.log(`[FUNCIONARIOS] - Funcionários da tabela funcionarios: ${funcionariosData?.length || 0}`)
    console.log(`[FUNCIONARIOS] - Usuários sem funcionario_id: ${usuariosSemFuncionario.length}`)

    // Buscar registros de ponto eletrônico para verificar quais funcionários têm registros
    const funcionarioIds = todosFuncionarios.map(f => f.id).filter(id => id != null)
    let funcionariosComRegistrosPonto = new Set() // Set de funcionario_ids que têm registros de ponto
    
    if (funcionarioIds.length > 0) {
      try {
        const { data: registrosPonto, error: pontoError } = await supabaseAdmin
          .from('registros_ponto')
          .select('funcionario_id')
          .in('funcionario_id', funcionarioIds)
        
        if (!pontoError && registrosPonto) {
          // Criar Set de funcionários que têm pelo menos um registro de ponto
          registrosPonto.forEach(registro => {
            funcionariosComRegistrosPonto.add(registro.funcionario_id)
          })
        }
      } catch (error) {
        console.error('[FUNCIONARIOS] Erro ao buscar registros de ponto:', error)
      }
    }

    // Adicionar informações sobre usuário existente e obra atual para cada funcionário
    const funcionariosComUsuario = todosFuncionarios.map(funcionario => {
      const alocacoesAtivas = funcionario.funcionarios_obras?.filter(fo => fo.status === 'ativo') || []
      
      // obra_atual só aparece se o funcionário tiver pelo menos um registro de ponto eletrônico
      // e tiver uma alocação ativa
      const temRegistrosPonto = funcionariosComRegistrosPonto.has(funcionario.id)
      const obraAtual = (temRegistrosPonto && alocacoesAtivas.length > 0) 
        ? alocacoesAtivas[0].obras 
        : null
      
      // obras_vinculadas só inclui obras se houver registros de ponto
      const obrasVinculadas = temRegistrosPonto ? alocacoesAtivas : []
      
      // Popular campo cargo com o nome do cargo do cargo_info
      if (funcionario.cargo_info && !funcionario.cargo) {
        funcionario.cargo = funcionario.cargo_info.nome
      }
      
      return {
        ...funcionario,
        usuario_existe: funcionario.usuario_existe ?? !!funcionario.usuario,
        usuario_criado: funcionario.usuario_criado ?? !!funcionario.usuario,
        obra_atual: obraAtual,
        obras_vinculadas: obrasVinculadas // Apenas se houver registros de ponto
      }
    })

    // Ordenar por ID descendente
    funcionariosComUsuario.sort((a, b) => (b.id || 0) - (a.id || 0))

    // Calcular total correto
    // O total é sempre o tamanho da lista combinada (já filtrada se houver busca)
    // Isso garante que o total corresponde exatamente aos itens disponíveis
    const totalItems = funcionariosComUsuario.length
    
    const totalPages = Math.ceil(totalItems / limit)
    const paginatedData = funcionariosComUsuario.slice(offset, offset + limit)

    console.log(`[FUNCIONARIOS] 📤 Enviando resposta: ${paginatedData.length} itens`)
    console.log(`[FUNCIONARIOS] Paginação: página ${page} de ${totalPages}, total: ${totalItems}`)
    console.log('='.repeat(80))
    
    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: totalItems,
        pages: totalPages
      }
    })
  } catch (error) {
    console.error('Erro ao listar funcionários:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /funcionarios/buscar:
 *   get:
 *     summary: Buscar funcionários para autocomplete
 *     tags: [Funcionários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Termo de busca (nome ou cargo)
 *       - in: query
 *         name: cargo
 *         schema:
 *           type: string
 *           enum: [Operador, Sinaleiro, Técnico Manutenção, Supervisor, Mecânico, Engenheiro, Chefe de Obras]
 *         description: Filtrar por cargo
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativo, Inativo, Férias]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de funcionários encontrados
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
 *                       cargo:
 *                         type: string
 *                       status:
 *                         type: string
 *       400:
 *         description: Parâmetro de busca não fornecido
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/buscar', async (req, res) => {
  try {
    const { q, cargo, status } = req.query

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Termo de busca inválido',
        message: 'O termo de busca deve ter pelo menos 2 caracteres'
      })
    }

    let query = supabaseAdmin
      .from('funcionarios')
      .select('id, nome, cargo, status')
      .or(`nome.ilike.%${q}%,cargo.ilike.%${q}%`)
      .limit(20)

    // Excluir supervisores (são terceirizados do cliente, não funcionários)
    query = query.neq('cargo', 'Supervisor')
    query = query.eq('eh_supervisor', false)

    // Aplicar filtros adicionais
    if (cargo) {
      query = query.eq('cargo', cargo)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('nome')

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar funcionários',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * GET /funcionarios/:id/documentos
 * Listar documentos de obras onde o funcionário é assinante
 * IMPORTANTE: Esta rota deve vir ANTES de /:id para evitar conflito
 */
router.get('/:id/documentos', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const userRole = user?.role?.toLowerCase() || '';
    const isCliente = userRole.includes('cliente') || user?.level === 1;
    
    // Se for cliente, buscar documentos das obras desse cliente
    if (isCliente) {
      // Buscar cliente vinculado ao usuário
      const { data: cliente, error: clienteError } = await supabaseAdmin
        .from('clientes')
        .select('id, nome')
        .eq('contato_usuario_id', user.id)
        .single();

      if (clienteError || !cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente não encontrado para este usuário'
        });
      }

      // Buscar obras do cliente
      const { data: obras, error: obrasError } = await supabaseAdmin
        .from('obras')
        .select('id, nome')
        .eq('cliente_id', cliente.id);

      if (obrasError) {
        console.error('Erro ao buscar obras do cliente:', obrasError);
        throw obrasError;
      }

      const obraIds = obras?.map(o => o.id) || [];

      if (obraIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          cliente: cliente.nome,
          total: 0
        });
      }

      // Buscar documentos das obras do cliente
      const { data: documentos, error: documentosError } = await supabaseAdmin
        .from('obras_documentos')
        .select('id, titulo, descricao, arquivo_original, caminho_arquivo, tipo, status, obra_id, created_at, updated_at')
        .in('obra_id', obraIds)
        .order('created_at', { ascending: false });

      if (documentosError) {
        console.error('Erro ao buscar documentos das obras:', documentosError);
        throw documentosError;
      }

      // Buscar assinaturas dos documentos onde o cliente é assinante
      const documentoIds = documentos?.map(doc => doc.id) || [];
      let assinaturas = [];

      if (documentoIds.length > 0) {
        // Buscar assinaturas do cliente (pode ser UUID do auth ou ID numérico)
        const userIdString = user.id?.toString() || '';
        
        // Buscar assinaturas com o UUID do usuário
        const { data: assinaturasData, error: assinaturasError } = await supabaseAdmin
          .from('obras_documento_assinaturas')
          .select('documento_id, ordem, status, data_assinatura, arquivo_assinado, observacoes, tipo, created_at, updated_at, user_id')
          .in('documento_id', documentoIds)
          .eq('user_id', userIdString)
          .order('created_at', { ascending: false });

        if (!assinaturasError && assinaturasData) {
          assinaturas = assinaturasData;
        }
      }

      // Criar mapa de obras para acesso rápido
      const obrasMap = new Map((obras || []).map(obra => [obra.id, obra.nome]));

      // Combinar documentos com suas assinaturas
      const documentosComAssinaturas = (documentos || []).map(doc => {
        const assinaturaDoCliente = assinaturas.find(a => a.documento_id === doc.id);
        
        return {
          ...doc,
          assinatura: assinaturaDoCliente || null,
          obra_nome: obrasMap.get(doc.obra_id) || null
        };
      });

      return res.json({
        success: true,
        data: documentosComAssinaturas,
        cliente: cliente.nome,
        total: documentosComAssinaturas.length
      });
    }

    // Se não for cliente, tratar como funcionário
    // Verificar se o ID é um UUID formatado (ex: "00000000-0000-0000-0000-000000000144")
    // Se for UUID, extrair o número do final
    let funcionarioId;
    const uuidPattern = /^00000000-0000-0000-0000-(\d+)$/;
    const uuidMatch = id.match(uuidPattern);
    
    if (uuidMatch) {
      // Extrair o número do UUID formatado
      funcionarioId = parseInt(uuidMatch[1], 10);
    } else {
      // Tentar converter diretamente para número
      funcionarioId = parseInt(id, 10);
    }
    
    // Validar se o ID é um número válido
    if (isNaN(funcionarioId) || funcionarioId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID do funcionário inválido',
        error: 'O ID deve ser um número inteiro positivo ou UUID formatado'
      });
    }

    // Verificar se funcionário existe
    const { data: funcionario, error: funcionarioError } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome')
      .eq('id', funcionarioId)
      .single();

    if (funcionarioError || !funcionario) {
      return res.status(404).json({
        success: false,
        message: 'Funcionário não encontrado'
      });
    }

    // Buscar documentos de obras onde o funcionário é assinante
    // O user_id na tabela obras_documento_assinaturas é VARCHAR(255) e pode ser:
    // - UUID (string) para usuários do Supabase Auth
    // - ID numérico (string) para funcionários (ex: "123")
    // - UUID formatado para funcionários (ex: "00000000-0000-0000-0000-000000000123")
    const funcionarioIdString = funcionarioId.toString();
    const funcionarioIdUuid = `00000000-0000-0000-0000-${funcionarioIdString.padStart(12, '0')}`;
    
    console.log(`[DEBUG] Buscando documentos para funcionário ID: ${funcionarioId}`);
    console.log(`[DEBUG] Formatos de busca: "${funcionarioIdString}" e "${funcionarioIdUuid}"`);
    
    // Buscar assinaturas do funcionário
    // Primeiro tentar buscar pelo ID numérico como string
    let assinaturas = [];
    let assinaturasError = null;
    
    // Tentar buscar pelo formato string primeiro (mais comum)
    const { data: assinaturasString, error: errorString } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .select('documento_id, ordem, status, data_assinatura, arquivo_assinado, observacoes, tipo, created_at, updated_at, user_id')
      .eq('user_id', funcionarioIdString)
      .order('created_at', { ascending: false });
    
    if (errorString) {
      console.error(`[DEBUG] Erro ao buscar com string "${funcionarioIdString}":`, errorString);
    } else if (assinaturasString && assinaturasString.length > 0) {
      assinaturas = assinaturasString;
      console.log(`[DEBUG] Encontradas ${assinaturas.length} assinaturas com formato string`);
    } else {
      // Se não encontrou com string, tentar com UUID formatado
      console.log(`[DEBUG] Nenhuma assinatura encontrada com string, tentando UUID formatado: "${funcionarioIdUuid}"`);
      const { data: assinaturasUuid, error: errorUuid } = await supabaseAdmin
        .from('obras_documento_assinaturas')
        .select('documento_id, ordem, status, data_assinatura, arquivo_assinado, observacoes, tipo, created_at, updated_at, user_id')
        .eq('user_id', funcionarioIdUuid)
        .order('created_at', { ascending: false });
      
      if (errorUuid) {
        console.error(`[DEBUG] Erro ao buscar com UUID "${funcionarioIdUuid}":`, errorUuid);
        assinaturasError = errorUuid;
      } else {
        assinaturas = assinaturasUuid || [];
        console.log(`[DEBUG] Encontradas ${assinaturas.length} assinaturas com formato UUID`);
      }
    }
    
    // Se houve erro em ambas as tentativas, usar o último erro
    if (assinaturasError && assinaturas.length === 0) {
      assinaturasError = errorString || assinaturasError;
    }
    
    console.log(`[DEBUG] Assinaturas encontradas: ${assinaturas?.length || 0}`);
    if (assinaturas && assinaturas.length > 0) {
      console.log(`[DEBUG] Primeira assinatura user_id: ${assinaturas[0].user_id}`);
    }

    if (assinaturasError) {
      console.error('Erro ao buscar assinaturas:', assinaturasError);
      throw assinaturasError;
    }

    if (!assinaturas || assinaturas.length === 0) {
      return res.json({
        success: true,
        data: [],
        funcionario: funcionario.nome,
        total: 0
      });
    }

    // Buscar os documentos relacionados
    const documentoIds = assinaturas.map(a => a.documento_id).filter(id => id != null);
    
    if (documentoIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        funcionario: funcionario.nome,
        total: 0
      });
    }
    
    // Buscar documentos sem join para evitar problemas de tipo
    // Garantir que documentoIds são UUIDs válidos (não inteiros)
    const { data: documentos, error: documentosError } = await supabaseAdmin
      .from('obras_documentos')
      .select('id, titulo, descricao, arquivo_original, caminho_arquivo, tipo, status, obra_id, created_at, updated_at')
      .in('id', documentoIds)
      .order('created_at', { ascending: false });

    if (documentosError) {
      console.error('Erro ao buscar documentos:', documentosError);
      throw documentosError;
    }

    // Buscar informações das obras separadamente
    // Filtrar apenas IDs válidos (números inteiros)
    const obraIds = [...new Set(documentos.map(doc => doc.obra_id).filter(id => {
      if (!id) return false;
      // Tentar converter para número
      const parsed = parseInt(id, 10);
      return !isNaN(parsed) && parsed > 0;
    }))];
    
    if (obraIds.length === 0) {
      return res.json({
        success: true,
        data: documentos.map(doc => ({
          ...doc,
          assinatura: assinaturas.find(a => a.documento_id === doc.id) || null,
          obra_nome: null
        })),
        funcionario: funcionario.nome,
        total: documentos.length
      });
    }
    
    // Garantir que todos os IDs de obras são inteiros válidos
    const obraIdsInteiros = obraIds
      .map(id => {
        // Se já é número, usar diretamente
        if (typeof id === 'number') return id;
        // Tentar converter string para número
        const parsed = parseInt(String(id), 10);
        return isNaN(parsed) ? null : parsed;
      })
      .filter(id => id != null && id > 0);
    
    if (obraIdsInteiros.length === 0) {
      return res.json({
        success: true,
        data: documentos.map(doc => ({
          ...doc,
          assinatura: assinaturas.find(a => a.documento_id === doc.id) || null,
          obra_nome: null
        })),
        funcionario: funcionario.nome,
        total: documentos.length
      });
    }
    
    const { data: obras, error: obrasError } = await supabaseAdmin
      .from('obras')
      .select('id, nome')
      .in('id', obraIdsInteiros);

    if (obrasError) {
      console.error('Erro ao buscar obras:', obrasError);
      // Não falhar se não conseguir buscar obras, apenas continuar sem o nome
    }

    // Criar mapa de obras para acesso rápido
    const obrasMap = new Map((obras || []).map(obra => [obra.id, obra.nome]));

    // Combinar documentos com suas assinaturas
    const documentosComAssinaturas = documentos.map(doc => {
      const assinaturaDoFuncionario = assinaturas.find(a => a.documento_id === doc.id);
      
      return {
        ...doc,
        assinatura: assinaturaDoFuncionario || null,
        obra_nome: obrasMap.get(doc.obra_id) || null
      };
    });

    res.json({
      success: true,
      data: documentosComAssinaturas,
      funcionario: funcionario.nome,
      total: documentosComAssinaturas.length
    });

  } catch (error) {
    console.error('Erro ao listar documentos do funcionário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar documentos do funcionário',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /funcionarios/{id}:
 *   get:
 *     summary: Obter funcionário por ID
 *     tags: [Funcionários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do funcionário
 *     responses:
 *       200:
 *         description: Dados do funcionário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Funcionario'
 *       404:
 *         description: Funcionário não encontrado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Validar se o ID é um número válido
    const funcionarioId = parseInt(id, 10)
    if (isNaN(funcionarioId) || funcionarioId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido',
        message: 'O ID do funcionário deve ser um número inteiro positivo'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('funcionarios')
      .select(`
        *,
        cargo_info:cargos!cargo_id(
          id,
          nome,
          nivel,
          descricao
        ),
        usuario:usuarios!funcionario_id(
          id,
          nome,
          email,
          status
        ),
        funcionarios_obras(
          id,
          obra_id,
          data_inicio,
          data_fim,
          status,
          horas_trabalhadas,
          valor_hora,
          total_receber,
          obras(
            id,
            nome,
            cidade,
            estado,
            status,
            cliente:clientes(
              id,
              nome,
              cnpj
            )
          )
        )
      `)
      .eq('id', funcionarioId)
      .maybeSingle()

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar funcionário',
        message: error.message
      })
    }

    if (!data) {
      return res.status(404).json({
        error: 'Funcionário não encontrado',
        message: 'O funcionário com o ID especificado não existe'
      })
    }

    // Filtrar apenas alocações ativas
    const alocacoesAtivas = data.funcionarios_obras?.filter(fo => fo.status === 'ativo') || []
    
    // Verificar se o funcionário tem registros de ponto eletrônico
    const { data: registrosPonto, error: pontoError } = await supabaseAdmin
      .from('registros_ponto')
      .select('id')
      .eq('funcionario_id', funcionarioId)
      .limit(1)
    
    const temRegistrosPonto = !pontoError && registrosPonto && registrosPonto.length > 0
    
    // obra_atual só aparece se houver pelo menos um registro de ponto eletrônico
    const obraAtual = (temRegistrosPonto && alocacoesAtivas.length > 0) 
      ? alocacoesAtivas[0].obras 
      : null

    // Adicionar todas as obras (incluindo finalizadas) para histórico completo
    const todasObras = data.funcionarios_obras || []

    // Popular campo cargo com o nome do cargo do cargo_info
    if (data.cargo_info) {
      data.cargo = data.cargo_info.nome
    }

    // Adicionar informações sobre o usuário vinculado e obra atual
    const responseData = {
      ...data,
      usuario_existe: !!data.usuario,
      usuario_criado: !!data.usuario,
      obra_atual: obraAtual,
      obras_vinculadas: temRegistrosPonto ? alocacoesAtivas : [], // Apenas se houver registros de ponto
      historico_obras: todasObras // Todas as obras, incluindo finalizadas
    }

    res.json({
      success: true,
      data: responseData
    })
  } catch (error) {
    console.error('Erro ao buscar funcionário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /funcionarios:
 *   post:
 *     summary: Criar novo funcionário
 *     tags: [Funcionários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FuncionarioInput'
 *     responses:
 *       201:
 *         description: Funcionário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Funcionario'
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = funcionarioSchema.validate(req.body, {
      abortEarly: false,
      messages: {
        'string.min': 'O campo {#label} deve ter no mínimo {#limit} caracteres',
        'string.max': 'O campo {#label} deve ter no máximo {#limit} caracteres',
        'string.email': 'O email fornecido é inválido',
        'any.required': 'O campo {#label} é obrigatório',
        'string.pattern.base': 'O formato do campo {#label} é inválido'
      }
    })
    
    if (error) {
      // Mapear mensagens de erro para português mais amigável
      const mensagensErro = {
        'usuario_senha': 'A senha do usuário deve ter no mínimo 6 caracteres',
        'nome': 'O nome é obrigatório e deve ter no mínimo 2 caracteres',
        'cargo': 'O cargo é obrigatório',
        'email': 'O email fornecido é inválido',
        'cpf': 'O CPF fornecido é inválido'
      }
      
      const primeiroErro = error.details[0]
      const campo = primeiroErro.path[0]
      const mensagemAmigavel = mensagensErro[campo] || primeiroErro.message
      
      return res.status(400).json({
        error: 'Dados inválidos',
        message: mensagemAmigavel,
        details: primeiroErro.message,
        field: campo
      })
    }

    const { criar_usuario, usuario_senha, ...funcionarioData } = value

    // Validar se cargo existe e está ativo
    let cargoInfo = null
    if (value.cargo) {
      const { data: cargoExiste, error: cargoError } = await supabaseAdmin
        .from('cargos')
        .select('id, nome, ativo, perfil_id')
        .eq('nome', value.cargo)
        .single()

      if (cargoError || !cargoExiste) {
        return res.status(400).json({
          error: 'Cargo inválido',
          message: 'O cargo especificado não existe no sistema'
        })
      }

      if (!cargoExiste.ativo) {
        return res.status(400).json({
          error: 'Cargo inativo',
          message: 'O cargo especificado está inativo e não pode ser utilizado'
        })
      }

      // Guardar informações do cargo (incluindo perfil_id)
      cargoInfo = cargoExiste

      // Adicionar cargo_id ao funcionarioData e remover o campo cargo (string)
      // para evitar violação da constraint CHECK no banco de dados
      // O campo cargo_id é suficiente e o campo cargo pode ser NULL ou ter valor padrão
      funcionarioData.cargo_id = cargoExiste.id
      delete funcionarioData.cargo
    }

    // Verificar se CPF já existe (se fornecido)
    if (value.cpf) {
      const { data: existingFuncionario } = await supabaseAdmin
        .from('funcionarios')
        .select('id')
        .eq('cpf', value.cpf)
        .single()

      if (existingFuncionario) {
        return res.status(400).json({
          error: 'CPF já cadastrado',
          message: 'Já existe um funcionário cadastrado com este CPF'
        })
      }
    }

    // Iniciar transação
    let usuarioId = null

    // Criar usuário se solicitado
    if (criar_usuario && value.email) {
      try {
        // Verificar se já existe um usuário com este email
        const { data: existingUser } = await supabaseAdmin
          .from('usuarios')
          .select('id')
          .eq('email', value.email)
          .single()

        if (existingUser) {
          return res.status(400).json({
            error: 'Email já cadastrado',
            message: 'Já existe um usuário cadastrado com este email'
          })
        }

        // Criar funcionário primeiro
        const { data: novoFuncionario, error: funcionarioError } = await supabaseAdmin
          .from('funcionarios')
          .insert([funcionarioData])
          .select()
          .single()

        if (funcionarioError) {
          return res.status(500).json({
            error: 'Erro ao criar funcionário',
            message: funcionarioError.message
          })
        }

        // Mapear turno da tabela funcionarios para usuarios
        const mapearTurno = (turnoFuncionario) => {
          switch (turnoFuncionario) {
            case 'Diurno': return 'Manhã'
            case 'Noturno': return 'Noite'
            case 'Sob Demanda': return 'Integral'
            default: return 'Manhã' // Valor padrão
          }
        }

        // Gerar senha temporária
        const senhaTemporaria = generateSecurePassword()

        // 1. Criar usuário no Supabase Auth primeiro
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: value.email,
          password: senhaTemporaria,
          email_confirm: true, // Confirmar email automaticamente
          user_metadata: {
            nome: value.nome,
            cargo: value.cargo,
            funcionario_id: novoFuncionario.id
          }
        })

        if (authError) {
          // Se falhou ao criar no Auth, remover o funcionário criado
          await supabaseAdmin
            .from('funcionarios')
            .delete()
            .eq('id', novoFuncionario.id)
          
          return res.status(500).json({
            error: 'Erro ao criar usuário no sistema de autenticação',
            message: authError.message
          })
        }

        // 2. Criar usuário vinculado ao funcionário na tabela
        const usuarioData = {
          nome: value.nome,
          email: value.email,
          cpf: value.cpf || null,
          telefone: value.telefone || null,
          cargo: value.cargo,
          turno: mapearTurno(value.turno),
          data_admissao: value.data_admissao || null,
          salario: value.salario || null,
          status: value.status,
          funcionario_id: novoFuncionario.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data: novoUsuario, error: usuarioError } = await supabaseAdmin
          .from('usuarios')
          .insert(usuarioData)
          .select()
          .single()

        if (usuarioError) {
          // Se falhou ao criar na tabela, remover do Auth e o funcionário
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
          await supabaseAdmin
            .from('funcionarios')
            .delete()
            .eq('id', novoFuncionario.id)
          
          return res.status(500).json({
            error: 'Erro ao criar usuário',
            message: usuarioError.message
          })
        }

        usuarioId = novoUsuario.id

        // Atribuir perfil baseado no cargo do funcionário
        let perfilId = 4 // Operador por padrão (fallback)
        
        // Se cargo tem perfil_id definido, usar esse perfil
        if (cargoInfo && cargoInfo.perfil_id) {
          perfilId = cargoInfo.perfil_id
        } else {
          // Fallback: usar lógica antiga baseada no nome do cargo
          switch (value.cargo) {
            case 'Supervisor':
              perfilId = 3
              break
            case 'Operador':
              perfilId = 4
              break
            default:
              perfilId = 4 // Operador para outros cargos
          }
        }

        const { error: perfilError } = await supabaseAdmin
          .from('usuario_perfis')
          .insert({
            usuario_id: usuarioId,
            perfil_id: perfilId,
            status: 'Ativa',
            data_atribuicao: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (perfilError) {
          console.error('Erro ao atribuir perfil ao usuário:', perfilError)
          // Não falhar a criação do funcionário por causa disso
        }

        // Enviar email de boas-vindas com senha temporária
        console.log('📧 Tentando enviar email de boas-vindas para funcionário...')
        console.log('📧 Dados:', { nome: value.nome, email: value.email, senha: '***' })
        
        try {
          const emailResult = await sendWelcomeEmail({
            nome: value.nome,
            email: value.email,
            senha_temporaria: senhaTemporaria
          })
          console.log(`✅ Email de boas-vindas enviado com sucesso para ${value.email}`, emailResult)
        } catch (emailError) {
          console.error('❌ Erro ao enviar email de boas-vindas:', emailError)
          console.error('❌ Stack trace:', emailError.stack)
          // Não falha a criação do funcionário se o email falhar
        }

        // Buscar dados completos do funcionário com JOIN
        const { data: funcionarioCompleto } = await supabaseAdmin
          .from('funcionarios')
          .select(`
            *,
            cargo_info:cargos!cargo_id(
              id,
              nome,
              nivel,
              descricao
            )
          `)
          .eq('id', novoFuncionario.id)
          .single()

        // Popular campo cargo com o nome do cargo do cargo_info
        if (funcionarioCompleto) {
          if (funcionarioCompleto.cargo_info) {
            funcionarioCompleto.cargo = funcionarioCompleto.cargo_info.nome
          } else if (cargoInfo) {
            funcionarioCompleto.cargo = cargoInfo.nome
          }
        }

        // Enviar mensagem WhatsApp com instruções de acesso (não bloquear criação se falhar)
        try {
          const { enviarMensagemNovoUsuarioFuncionario } = await import('../services/whatsapp-service.js');
          await enviarMensagemNovoUsuarioFuncionario(
            funcionarioCompleto || novoFuncionario,
            value.email,
            senhaTemporaria
          ).catch(whatsappError => {
            console.error('❌ Erro ao enviar mensagem WhatsApp (não bloqueia criação):', whatsappError);
          });
        } catch (importError) {
          console.error('❌ Erro ao importar serviço WhatsApp (não bloqueia criação):', importError);
        }

        res.status(201).json({
          success: true,
          data: {
            ...(funcionarioCompleto || novoFuncionario),
            usuario_criado: true,
            usuario_id: usuarioId
            // Por segurança, NÃO retornar senha_temporaria - foi enviada por email e WhatsApp
          },
          message: 'Funcionário e usuário criados com sucesso. Email e WhatsApp com senha temporária enviados.'
        })

      } catch (usuarioError) {
        console.error('Erro ao criar usuário:', usuarioError)
        return res.status(500).json({
          error: 'Erro ao criar usuário',
          message: usuarioError.message
        })
      }
    } else {
      // Criar apenas funcionário sem usuário
      const { data, error: createError } = await supabaseAdmin
        .from('funcionarios')
        .insert([funcionarioData])
        .select()
        .single()

      if (createError) {
        return res.status(500).json({
          error: 'Erro ao criar funcionário',
          message: createError.message
        })
      }

      // Buscar dados completos do funcionário com JOIN
      const { data: funcionarioCompleto } = await supabaseAdmin
        .from('funcionarios')
        .select(`
          *,
          cargo_info:cargos!cargo_id(
            id,
            nome,
            nivel,
            descricao
          )
        `)
        .eq('id', data.id)
        .single()

      // Popular campo cargo com o nome do cargo do cargo_info
      if (funcionarioCompleto) {
        if (funcionarioCompleto.cargo_info) {
          funcionarioCompleto.cargo = funcionarioCompleto.cargo_info.nome
        } else if (cargoInfo) {
          funcionarioCompleto.cargo = cargoInfo.nome
        }
      }

      res.status(201).json({
        success: true,
        data: {
          ...(funcionarioCompleto || data),
          usuario_criado: false
        },
        message: 'Funcionário criado com sucesso'
      })
    }
  } catch (error) {
    console.error('Erro ao criar funcionário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /funcionarios/{id}:
 *   put:
 *     summary: Atualizar funcionário
 *     tags: [Funcionários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do funcionário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FuncionarioInput'
 *     responses:
 *       200:
 *         description: Funcionário atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Funcionario'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Funcionário não encontrado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Validar se o ID é um número válido
    const funcionarioId = parseInt(id, 10)
    if (isNaN(funcionarioId) || funcionarioId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido',
        message: 'O ID do funcionário deve ser um número inteiro positivo'
      })
    }

    // Validar dados
    const { error, value } = funcionarioUpdateSchema.validate(req.body, {
      abortEarly: false,
      messages: {
        'string.min': 'O campo {#label} deve ter no mínimo {#limit} caracteres',
        'string.max': 'O campo {#label} deve ter no máximo {#limit} caracteres',
        'string.email': 'O email fornecido é inválido',
        'any.required': 'O campo {#label} é obrigatório',
        'string.pattern.base': 'O formato do campo {#label} é inválido'
      }
    })
    if (error) {
      // Mapear mensagens de erro para português mais amigável
      const mensagensErro = {
        'nome': 'O nome deve ter no mínimo 2 caracteres',
        'cargo': 'O cargo é obrigatório',
        'email': 'O email fornecido é inválido',
        'cpf': 'O CPF fornecido é inválido',
        'telefone': 'O telefone fornecido é inválido'
      }
      
      const primeiroErro = error.details[0]
      const campo = primeiroErro.path[0]
      const mensagemAmigavel = mensagensErro[campo] || primeiroErro.message
      
      return res.status(400).json({
        error: 'Dados inválidos',
        message: mensagemAmigavel,
        details: primeiroErro.message
      })
    }

    // Filtrar campos que não devem ser salvos na tabela funcionarios
    const { criar_usuario, usuario_senha, ...funcionarioData } = value

    // Validar se cargo existe e está ativo (se fornecido)
    let cargoInfo = null
    let cargoMudou = false
    if (value.cargo) {
      // Buscar cargo atual do funcionário para comparar
      const { data: funcionarioAtual } = await supabaseAdmin
        .from('funcionarios')
        .select('cargo_id')
        .eq('id', funcionarioId)
        .single()

      const { data: cargoExiste, error: cargoError } = await supabaseAdmin
        .from('cargos')
        .select('id, nome, ativo, perfil_id')
        .eq('nome', value.cargo)
        .single()

      if (cargoError || !cargoExiste) {
        return res.status(400).json({
          error: 'Cargo inválido',
          message: 'O cargo especificado não existe no sistema'
        })
      }

      if (!cargoExiste.ativo) {
        return res.status(400).json({
          error: 'Cargo inativo',
          message: 'O cargo especificado está inativo e não pode ser utilizado'
        })
      }

      // Verificar se cargo mudou
      if (funcionarioAtual && funcionarioAtual.cargo_id !== cargoExiste.id) {
        cargoMudou = true
      }

      // Guardar informações do cargo (incluindo perfil_id)
      cargoInfo = cargoExiste

      // Adicionar cargo_id ao funcionarioData e remover o campo cargo (string)
      // para evitar violação da constraint CHECK no banco de dados
      // O campo cargo_id é suficiente e o campo cargo pode ser NULL ou ter valor padrão
      funcionarioData.cargo_id = cargoExiste.id
      delete funcionarioData.cargo
    }

    // Verificar se CPF já existe em outro funcionário (se fornecido)
    if (value.cpf) {
      const { data: existingFuncionario } = await supabaseAdmin
        .from('funcionarios')
        .select('id')
        .eq('cpf', value.cpf)
        .neq('id', funcionarioId)
        .single()

      if (existingFuncionario) {
        return res.status(400).json({
          error: 'CPF já cadastrado',
          message: 'Já existe outro funcionário cadastrado com este CPF'
        })
      }
    }

    // Atualizar funcionário
    const { data, error: updateError } = await supabaseAdmin
      .from('funcionarios')
      .update({
        ...funcionarioData,
        updated_at: new Date().toISOString()
      })
      .eq('id', funcionarioId)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Funcionário não encontrado',
          message: 'O funcionário com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar funcionário',
        message: updateError.message
      })
    }

    // Se cargo mudou e funcionário tem usuário, atualizar perfil do usuário
    if (cargoMudou && cargoInfo && cargoInfo.perfil_id) {
      // Buscar usuário vinculado ao funcionário
      const { data: usuarioFuncionario } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('funcionario_id', id)
        .single()

      if (usuarioFuncionario) {
        // Desativar perfil atual
        await supabaseAdmin
          .from('usuario_perfis')
          .update({ 
            status: 'Inativa',
            updated_at: new Date().toISOString()
          })
          .eq('usuario_id', usuarioFuncionario.id)
          .eq('status', 'Ativa')

        // Verificar se já existe associação com este perfil
        const { data: perfilExistente } = await supabaseAdmin
          .from('usuario_perfis')
          .select('id')
          .eq('usuario_id', usuarioFuncionario.id)
          .eq('perfil_id', cargoInfo.perfil_id)
          .single()

        if (perfilExistente) {
          // Ativar perfil existente
          await supabaseAdmin
            .from('usuario_perfis')
            .update({
              status: 'Ativa',
              data_atribuicao: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', perfilExistente.id)
        } else {
          // Criar nova associação
          await supabaseAdmin
            .from('usuario_perfis')
            .insert({
              usuario_id: usuarioFuncionario.id,
              perfil_id: cargoInfo.perfil_id,
              status: 'Ativa',
              data_atribuicao: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
        }
      }
    }

    // Buscar dados completos do funcionário com JOIN
    const { data: funcionarioCompleto } = await supabaseAdmin
      .from('funcionarios')
      .select(`
        *,
        cargo_info:cargos!cargo_id(
          id,
          nome,
          nivel,
          descricao
        )
      `)
      .eq('id', funcionarioId)
      .single()

    // Popular campo cargo com o nome do cargo do cargo_info
    if (funcionarioCompleto) {
      if (funcionarioCompleto.cargo_info) {
        funcionarioCompleto.cargo = funcionarioCompleto.cargo_info.nome
      } else if (cargoInfo) {
        funcionarioCompleto.cargo = cargoInfo.nome
      }
    }

    res.json({
      success: true,
      data: funcionarioCompleto || data
    })
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /funcionarios/{id}:
 *   delete:
 *     summary: Excluir funcionário
 *     tags: [Funcionários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do funcionário
 *     responses:
 *       200:
 *         description: Funcionário excluído com sucesso
 *       404:
 *         description: Funcionário não encontrado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Validar se o ID é um número válido
    const funcionarioId = parseInt(id, 10)
    if (isNaN(funcionarioId) || funcionarioId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido',
        message: 'O ID do funcionário deve ser um número inteiro positivo'
      })
    }

    // Verificar se funcionário existe
    const { data: funcionario, error: checkError } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome')
      .eq('id', funcionarioId)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Funcionário não encontrado',
          message: 'O funcionário com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao verificar funcionário',
        message: checkError.message
      })
    }

    // Verificar se funcionário está associado a alguma grua (diretamente ou através de obra)
    const { data: associacoes } = await supabaseAdmin
      .from('grua_funcionario')
      .select(`
        id,
        grua_id,
        obra_id,
        status,
        data_inicio,
        data_fim,
        observacoes,
        gruas (
          id,
          modelo,
          fabricante,
          tipo,
          status
        ),
        obras (
          id,
          nome
        )
      `)
      .eq('funcionario_id', id)
      .eq('status', 'Ativo')

    // Verificar se funcionário tem usuário associado
    const { data: usuarioAssociado } = await supabaseAdmin
      .from('usuarios')
      .select('id, email')
      .eq('funcionario_id', id)
      .single()

    if (usuarioAssociado) {
      console.log(`🔧 Funcionário ${funcionario.nome} possui usuário associado (${usuarioAssociado.email}). Excluindo usuário...`)
      
      // Excluir usuário associado
      const { error: deleteUsuarioError } = await supabaseAdmin
        .from('usuarios')
        .delete()
        .eq('funcionario_id', id)

      if (deleteUsuarioError) {
        console.error('❌ Erro ao excluir usuário do funcionário:', deleteUsuarioError)
        return res.status(500).json({
          error: 'Erro ao excluir usuário',
          message: 'Erro ao excluir usuário associado ao funcionário',
          details: deleteUsuarioError.message
        })
      }

      console.log(`✅ Usuário ${usuarioAssociado.email} do funcionário ${funcionario.nome} excluído com sucesso`)
    }

    if (associacoes && associacoes.length > 0) {
      console.log(`🔧 Funcionário ${funcionario.nome} possui ${associacoes.length} associação(ões) ativa(s). Excluindo automaticamente...`)
      
      // Excluir todas as associações ativas do funcionário
      const { error: deleteAssociationsError } = await supabaseAdmin
        .from('grua_funcionario')
        .delete()
        .eq('funcionario_id', id)
        .eq('status', 'Ativo')

      if (deleteAssociationsError) {
        console.error('❌ Erro ao excluir associações do funcionário:', deleteAssociationsError)
        return res.status(500).json({
          error: 'Erro ao excluir associações',
          message: 'Erro ao excluir associações ativas do funcionário',
          details: deleteAssociationsError.message
        })
      }

      console.log(`✅ ${associacoes.length} associação(ões) do funcionário ${funcionario.nome} excluída(s) com sucesso`)
    }

    // Excluir funcionário
    const { error: deleteError } = await supabaseAdmin
      .from('funcionarios')
      .delete()
      .eq('id', funcionarioId)

    if (deleteError) {
      return res.status(500).json({
        error: 'Erro ao excluir funcionário',
        message: deleteError.message
      })
    }

    // Preparar mensagem de sucesso
    let mensagem = `Funcionário ${funcionario.nome} excluído com sucesso`
    let detalhes = []
    
    if (usuarioAssociado) {
      detalhes.push(`usuário ${usuarioAssociado.email}`)
    }
    
    if (associacoes && associacoes.length > 0) {
      detalhes.push(`${associacoes.length} associação(ões)`)
    }
    
    if (detalhes.length > 0) {
      mensagem += `. ${detalhes.join(' e ')} foram excluído(s) automaticamente.`
    }

    res.json({
      success: true,
      message: mensagem,
      desassociacoes_realizadas: associacoes ? associacoes.length : 0,
      usuario_excluido: usuarioAssociado ? {
        id: usuarioAssociado.id,
        email: usuarioAssociado.email
      } : null
    })
  } catch (error) {
    console.error('Erro ao excluir funcionário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /funcionarios/{id}/desassociar-gruas:
 *   post:
 *     summary: Desassociar funcionário de todas as gruas ativas
 *     tags: [Funcionários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do funcionário
 *     responses:
 *       200:
 *         description: Funcionário desassociado das gruas com sucesso
 *       404:
 *         description: Funcionário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
/**
 * POST /api/funcionarios/:id/reset-password
 * Resetar senha do funcionário e enviar senha temporária por email e WhatsApp
 * IMPORTANTE: Esta rota deve estar ANTES das rotas genéricas /:id para evitar conflitos
 */
router.post('/:id/reset-password', requirePermission('rh:editar'), async (req, res) => {
  console.log('🔐 Rota reset-password chamada para funcionário ID:', req.params.id)
  try {
    const { id } = req.params

    // Buscar funcionário com relação ao usuário
    const { data: funcionario, error: funcionarioError } = await supabaseAdmin
      .from('funcionarios')
      .select(`
        id, 
        nome, 
        email, 
        telefone, 
        telefone_whatsapp,
        usuario:usuarios!funcionario_id(
          id,
          nome,
          email,
          status
        )
      `)
      .eq('id', id)
      .single()

    if (funcionarioError) {
      console.error('❌ Erro ao buscar funcionário:', {
        id: id,
        error: funcionarioError,
        code: funcionarioError.code
      })
      if (funcionarioError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Funcionário não encontrado'
        })
      }
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar funcionário',
        error: funcionarioError.message
      })
    }

    if (!funcionario) {
      console.error('❌ Funcionário não encontrado (data é null):', { id })
      return res.status(404).json({
        success: false,
        message: 'Funcionário não encontrado'
      })
    }

    // Verificar se o funcionário tem usuário vinculado
    // O usuário pode vir como objeto (array) ou null
    const usuario = Array.isArray(funcionario.usuario) 
      ? funcionario.usuario[0] 
      : funcionario.usuario

    console.log('✅ Funcionário encontrado:', { 
      id: funcionario.id, 
      nome: funcionario.nome, 
      usuario_id: usuario?.id 
    })

    if (!usuario || !usuario.id) {
      return res.status(400).json({
        success: false,
        message: 'Funcionário não possui usuário vinculado. Crie um usuário primeiro.'
      })
    }

    // Gerar senha temporária
    const senhaTemporaria = generateSecurePassword(12)

    // Usar email do funcionário ou do usuário vinculado
    const emailParaEnvio = funcionario.email || usuario.email

    if (!emailParaEnvio) {
      return res.status(400).json({
        success: false,
        message: 'Funcionário não possui email cadastrado. Não é possível resetar a senha.'
      })
    }

    // Buscar usuário no Supabase Auth pelo email
    // O ID da tabela usuarios pode não ser o mesmo UUID do Auth
    let authUserId = null
    let usuarioCriadoNoAuth = false
    try {
      const { data: { users }, error: authListError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (authListError) {
        console.error('Erro ao listar usuários do Auth:', authListError)
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar usuário no sistema de autenticação',
          error: authListError.message
        })
      }

      // Buscar usuário no Auth (comparação case-insensitive)
      const authUser = users.find(u => u.email?.toLowerCase() === emailParaEnvio?.toLowerCase())
      
      if (!authUser) {
        // Usuário não existe no Auth, mas existe na tabela usuarios
        // Criar usuário no Auth automaticamente
        console.log(`⚠️ Usuário não encontrado no Auth. Criando usuário no Auth para ${emailParaEnvio}...`)
        
        try {
          const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: emailParaEnvio,
            password: senhaTemporaria,
            email_confirm: true, // Confirmar email automaticamente
            user_metadata: {
              nome: funcionario.nome,
              funcionario_id: funcionario.id,
              usuario_id: usuario.id,
              created_via: 'reset_password'
            }
          })

          if (createError) {
            console.error('Erro ao criar usuário no Auth:', createError)
            return res.status(500).json({
              success: false,
              message: 'Erro ao criar usuário no sistema de autenticação',
              error: createError.message
            })
          }

          authUserId = authData.user.id
          usuarioCriadoNoAuth = true
          console.log('✅ Usuário criado no Auth com sucesso:', { email: emailParaEnvio, authUserId })
        } catch (createError) {
          console.error('Erro ao criar usuário no Auth:', createError)
          return res.status(500).json({
            success: false,
            message: 'Erro ao criar usuário no sistema de autenticação',
            error: createError.message
          })
        }
      } else {
        authUserId = authUser.id
        console.log('✅ Usuário encontrado no Auth:', { email: emailParaEnvio, authUserId })
      }
    } catch (listError) {
      console.error('Erro ao buscar usuário no Auth:', listError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar usuário no sistema de autenticação',
        error: listError.message
      })
    }

    // Atualizar senha no Supabase Auth usando o UUID correto
    // Se o usuário foi criado agora, a senha já foi definida, mas vamos atualizar para garantir
    if (!usuarioCriadoNoAuth) {
      try {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          authUserId,
          { password: senhaTemporaria }
        )

        if (authError) {
          console.error('Erro ao atualizar senha no Supabase Auth:', authError)
          return res.status(500).json({
            success: false,
            message: 'Erro ao atualizar senha no sistema de autenticação',
            error: authError.message
          })
        }
        
        console.log('✅ Senha atualizada com sucesso no Auth')
      } catch (authError) {
        console.error('Erro ao atualizar senha:', authError)
        return res.status(500).json({
          success: false,
          message: 'Erro ao atualizar senha',
          error: authError.message
        })
      }
    }

    // Enviar email com senha temporária
    let emailEnviado = false
    if (emailParaEnvio) {
      try {
        console.log(`📧 Tentando enviar email de reset de senha para ${emailParaEnvio}...`)
        const resultadoEmail = await sendPasswordResetEmail({
          nome: funcionario.nome,
          email: emailParaEnvio,
          senha_temporaria: senhaTemporaria
        })
        emailEnviado = true
        console.log(`✅ Email de reset de senha enviado com sucesso para ${emailParaEnvio}`, resultadoEmail)
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de reset de senha:', emailError)
        console.error('❌ Detalhes do erro:', {
          message: emailError.message,
          stack: emailError.stack,
          email: emailParaEnvio,
          nome: funcionario.nome
        })
        // Não falha a operação se o email falhar
      }
    } else {
      console.warn('⚠️ Email não enviado: emailParaEnvio está vazio ou undefined')
    }

    // Enviar WhatsApp com senha temporária
    let whatsappEnviado = false
    if (emailParaEnvio) {
      try {
        const { enviarMensagemResetSenhaFuncionario } = await import('../services/whatsapp-service.js')
        await enviarMensagemResetSenhaFuncionario(
          funcionario,
          emailParaEnvio,
          senhaTemporaria
        )
        whatsappEnviado = true
        console.log(`✅ WhatsApp de reset de senha enviado com sucesso para ${funcionario.nome}`)
      } catch (whatsappError) {
        console.error('❌ Erro ao enviar WhatsApp de reset de senha:', whatsappError)
        // Não falha a operação se o WhatsApp falhar
      }
    }

    // Retornar sucesso mesmo se algum envio falhar (senha foi resetada)
    const mensagemSucesso = usuarioCriadoNoAuth
      ? 'Usuário criado no sistema de autenticação e senha resetada com sucesso. Senha temporária enviada por email e WhatsApp.'
      : 'Senha resetada com sucesso. Senha temporária enviada por email e WhatsApp.'
    
    res.json({
      success: true,
      message: mensagemSucesso,
      data: {
        email_enviado: emailEnviado,
        whatsapp_enviado: whatsappEnviado,
        usuario_criado_no_auth: usuarioCriadoNoAuth,
        // Por segurança, NÃO retornar a senha temporária
      }
    })

  } catch (error) {
    console.error('Erro ao resetar senha do funcionário:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

router.post('/:id/desassociar-gruas', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se funcionário existe
    const { data: funcionario, error: checkError } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome')
      .eq('id', id)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Funcionário não encontrado',
          message: 'O funcionário com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao verificar funcionário',
        message: checkError.message
      })
    }

    // Buscar todas as associações ativas
    const { data: associacoes } = await supabaseAdmin
      .from('grua_funcionario')
      .select(`
        id,
        grua_id,
        obra_id,
        status,
        data_inicio,
        data_fim,
        observacoes,
        gruas (
          id,
          modelo,
          fabricante,
          tipo,
          status
        ),
        obras (
          id,
          nome
        )
      `)
      .eq('funcionario_id', id)
      .eq('status', 'Ativo')

    if (!associacoes || associacoes.length === 0) {
      return res.json({
        success: true,
        message: 'Funcionário não possui associações ativas com gruas',
        desassociacoes: 0
      })
    }

    // Excluir todas as associações ativas do funcionário
    const { error: deleteError } = await supabaseAdmin
      .from('grua_funcionario')
      .delete()
      .eq('funcionario_id', id)
      .eq('status', 'Ativo')

    if (deleteError) {
      return res.status(500).json({
        error: 'Erro ao excluir associações do funcionário',
        message: deleteError.message
      })
    }

    // Preparar informações das associações que foram desassociadas
    const desassociacoes = associacoes.map(assoc => {
      if (assoc.grua_id) {
        // Associação direta com grua
        return {
          id: assoc.grua_id,
          modelo: assoc.gruas?.modelo || 'Modelo não informado',
          fabricante: assoc.gruas?.fabricante || 'Fabricante não informado',
          tipo: assoc.gruas?.tipo || 'Tipo não informado',
          data_fim: new Date().toISOString().split('T')[0],
          tipo_associacao: 'grua_direta'
        }
      } else if (assoc.obra_id) {
        // Associação com obra
        return {
          id: `obra_${assoc.obra_id}`,
          modelo: 'N/A',
          fabricante: 'N/A',
          tipo: 'Associação com Obra',
          data_fim: new Date().toISOString().split('T')[0],
          tipo_associacao: 'obra',
          obra_id: assoc.obra_id,
          obra_nome: assoc.obras?.nome || 'Obra não informada'
        }
      }
      return null
    }).filter(Boolean)

    res.json({
      success: true,
      message: `Funcionário ${funcionario.nome} teve ${associacoes.length} associação(ões) excluída(s) com sucesso`,
      desassociacoes: associacoes.length,
      detalhes_desassociacoes: desassociacoes
    })
  } catch (error) {
    console.error('Erro ao desassociar funcionário das gruas:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * components:
 *   schemas:
 *     Funcionario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do funcionário
 *         nome:
 *           type: string
 *           description: Nome completo do funcionário
 *         cargo:
 *           type: string
 *           enum: [Operador, Sinaleiro, Técnico Manutenção, Supervisor, Mecânico, Engenheiro, Chefe de Obras]
 *           description: Cargo do funcionário
 *         telefone:
 *           type: string
 *           description: Telefone de contato
 *         email:
 *           type: string
 *           format: email
 *           description: Email de contato
 *         cpf:
 *           type: string
 *           description: CPF do funcionário
 *         turno:
 *           type: string
 *           enum: [Diurno, Noturno, Sob Demanda]
 *           description: Turno de trabalho
 *         status:
 *           type: string
 *           enum: [Ativo, Inativo, Férias]
 *           description: Status do funcionário
 *         data_admissao:
 *           type: string
 *           format: date
 *           description: Data de admissão
 *         salario:
 *           type: number
 *           description: Salário do funcionário
 *         observacoes:
 *           type: string
 *           description: Observações adicionais
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *     
 *     FuncionarioInput:
 *       type: object
 *       required:
 *         - nome
 *         - cargo
 *       properties:
 *         nome:
 *           type: string
 *           minLength: 2
 *           maxLength: 255
 *           description: Nome completo do funcionário
 *         cargo:
 *           type: string
 *           enum: [Operador, Sinaleiro, Técnico Manutenção, Supervisor, Mecânico, Engenheiro, Chefe de Obras]
 *           description: Cargo do funcionário
 *         telefone:
 *           type: string
 *           maxLength: 20
 *           description: Telefone de contato
 *         email:
 *           type: string
 *           format: email
 *           description: Email de contato
 *         cpf:
 *           type: string
 *           pattern: '^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$'
 *           description: CPF do funcionário (formato 000.000.000-00 ou 00000000000)
 *         turno:
 *           type: string
 *           enum: [Diurno, Noturno, Sob Demanda]
 *           default: Diurno
 *           description: Turno de trabalho
 *         status:
 *           type: string
 *           enum: [Ativo, Inativo, Férias]
 *           default: Ativo
 *           description: Status do funcionário
 *         data_admissao:
 *           type: string
 *           format: date
 *           description: Data de admissão
 *         salario:
 *           type: number
 *           minimum: 0
 *           description: Salário do funcionário
 *         observacoes:
 *           type: string
 *           description: Observações adicionais
 */

/**
 * @swagger
 * /funcionarios/obra/{obra_id}:
 *   get:
 *     summary: Listar funcionários alocados em uma obra específica
 *     tags: [Funcionários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: obra_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *     responses:
 *       200:
 *         description: Lista de funcionários da obra
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
 *                       cargo:
 *                         type: string
 *                       telefone:
 *                         type: string
 *                       email:
 *                         type: string
 *                       cpf:
 *                         type: string
 *                       turno:
 *                         type: string
 *                       status:
 *                         type: string
 *                       data_admissao:
 *                         type: string
 *                         format: date
 *                       salario:
 *                         type: number
 *                       observacoes:
 *                         type: string
 *                       data_inicio:
 *                         type: string
 *                         format: date
 *                       data_fim:
 *                         type: string
 *                         format: date
 *                       horas_trabalhadas:
 *                         type: number
 *       400:
 *         description: Erro na requisição
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Obra não encontrada
 */
/**
 * @swagger
 * /api/funcionarios/{id}/historico-obras:
 *   get:
 *     summary: Obter histórico de obras de um funcionário
 *     tags: [Funcionários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do funcionário
 *     responses:
 *       200:
 *         description: Histórico de obras do funcionário
 *       404:
 *         description: Funcionário não encontrado
 */
router.get('/:id/historico-obras', async (req, res) => {
  try {
    const { id } = req.params

    // Buscar todas as alocações do funcionário (incluindo finalizadas)
    const { data: alocacoes, error } = await supabaseAdmin
      .from('funcionarios_obras')
      .select(`
        id,
        obra_id,
        data_inicio,
        data_fim,
        status,
        horas_trabalhadas,
        valor_hora,
        total_receber,
        observacoes,
        obras(
          id,
          nome,
          cidade,
          estado,
          status,
          data_inicio,
          data_fim,
          cliente:clientes(
            id,
            nome,
            cnpj
          )
        )
      `)
      .eq('funcionario_id', id)
      .order('data_inicio', { ascending: false })

    if (error) {
      console.error('Erro ao buscar histórico de obras:', error)
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar histórico de obras',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: alocacoes || [],
      total: alocacoes?.length || 0
    })
  } catch (error) {
    console.error('Erro ao buscar histórico de obras:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

router.get('/obra/:obra_id', async (req, res) => {
  try {
    const { obra_id } = req.params;
    const userId = req.user.id;

    // Verificar se a obra existe
    const obraExists = await db.query(
      'SELECT id FROM obras WHERE id = $1',
      [obra_id]
    );

    if (obraExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Obra não encontrada'
      });
    }

    // Buscar funcionários alocados na obra
    const query = `
      SELECT 
        f.id,
        f.nome,
        f.cargo,
        f.telefone,
        f.email,
        f.cpf,
        f.turno,
        f.status,
        f.data_admissao,
        f.salario,
        f.observacoes,
        fo.data_inicio,
        fo.data_fim,
        fo.horas_trabalhadas
      FROM funcionarios f
      INNER JOIN funcionarios_obras fo ON f.id = fo.funcionario_id
      WHERE fo.obra_id = $1 
        AND fo.status = 'ativo'
        AND f.status = 'Ativo'
      ORDER BY f.nome
    `;

    const result = await db.query(query, [obra_id]);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Erro ao buscar funcionários da obra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router
