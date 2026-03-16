import express from 'express'
import Joi from 'joi'
import crypto from 'crypto'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'
import { sendWelcomeEmail } from '../services/email.service.js'

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

function coordenadaValida(valor) {
  return typeof valor === 'number' && Number.isFinite(valor)
}

function montarConsultasEndereco({ endereco, cidade, estado, cep }) {
  const partesBase = [endereco, cidade, estado, 'Brasil']
    .map((item) => (item || '').toString().trim())
    .filter(Boolean)

  const consultas = [
    partesBase.join(', '),
    [endereco, cidade, 'Brasil'].filter(Boolean).join(', '),
    [endereco, estado, 'Brasil'].filter(Boolean).join(', '),
    [endereco, 'Brasil'].filter(Boolean).join(', ')
  ].filter((consulta) => consulta && consulta.length > 5)

  if (cep) {
    const cepLimpo = String(cep).replace(/\D/g, '')
    if (cepLimpo.length >= 8) {
      consultas.push(`CEP ${cepLimpo}, Brasil`)
    }
  }

  // Remover consultas duplicadas
  return [...new Set(consultas)]
}

function montarEnderecoCompleto({ endereco, endereco_rua, endereco_numero, endereco_bairro, endereco_complemento }) {
  const enderecoLegado = (endereco || '').toString().trim()
  if (enderecoLegado) {
    return enderecoLegado
  }

  const rua = (endereco_rua || '').toString().trim()
  const numero = (endereco_numero || '').toString().trim()
  const bairro = (endereco_bairro || '').toString().trim()
  const complemento = (endereco_complemento || '').toString().trim()

  const base = [rua, numero].filter(Boolean).join(', ')
  const comBairro = [base, bairro].filter(Boolean).join(' - ')
  return [comBairro, complemento].filter(Boolean).join(', ')
}

async function buscarCoordenadasPorEndereco({ endereco, cidade, estado, cep }) {
  const consultas = montarConsultasEndereco({ endereco, cidade, estado, cep })
  if (consultas.length === 0) {
    return null
  }

  for (const consulta of consultas) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(consulta)}&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Sistema-Gerenciamento-Gruas/1.0',
            'Accept-Language': 'pt-BR,pt,en'
          }
        }
      )

      if (!response.ok) continue
      const data = await response.json()
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          return {
            latitude: lat,
            longitude: lng,
            endereco_usado_geocoding: consulta,
            endereco_encontrado: data[0].display_name || null
          }
        }
      }
    } catch (error) {
      console.warn('[obras] Falha ao geocodificar consulta:', consulta, error?.message || error)
    }
  }

  return null
}

async function resolverCoordenadasDaObra({ endereco, cidade, estado, cep, latitude, longitude }) {
  const jaTemCoordenadas = coordenadaValida(latitude) && coordenadaValida(longitude)
  if (jaTemCoordenadas) {
    return {
      latitude,
      longitude,
      geocodingAplicado: false,
      geocodingInfo: null
    }
  }

  const coords = await buscarCoordenadasPorEndereco({ endereco, cidade, estado, cep })
  if (!coords) {
    return {
      latitude: coordenadaValida(latitude) ? latitude : null,
      longitude: coordenadaValida(longitude) ? longitude : null,
      geocodingAplicado: false,
      geocodingInfo: null
    }
  }

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    geocodingAplicado: true,
    geocodingInfo: coords
  }
}

const router = express.Router()

// Schema de validação para obras
const obraSchema = Joi.object({
  nome: Joi.string().min(2).required(),
  cliente_id: Joi.number().integer().positive().required(),
  endereco: Joi.string().allow('', null).optional(),
  endereco_rua: Joi.string().allow('', null).optional(),
  endereco_numero: Joi.string().allow('', null).optional(),
  endereco_bairro: Joi.string().allow('', null).optional(),
  endereco_complemento: Joi.string().allow('', null).optional(),
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
  canteiro: Joi.string().allow('', null).optional(),
  data_inicio: Joi.date().allow(null).optional(),
  data_fim: Joi.date().allow(null).optional(),
  orcamento: Joi.number().positive().allow(null).optional(),
  orcamento_id: Joi.number().integer().positive().allow(null).optional(), // ID do orçamento aprovado vinculado
  observacoes: Joi.string().allow('', null).optional(),
  responsavel_id: Joi.number().integer().positive().allow(null).optional(),
  responsavel_nome: Joi.string().allow('', null).optional(),
  created_at: Joi.date().optional(),
  updated_at: Joi.date().optional(),
  // Dados da grua (mantido para compatibilidade)
  grua_id: Joi.string().allow(null, '').optional(),
  grua_valor: Joi.number().min(0).allow(null).optional(),
  grua_mensalidade: Joi.number().min(0).allow(null).optional(),
  // Múltiplas gruas - aceitar ambos os campos para compatibilidade
  gruas: Joi.array().items(
    Joi.object({
      grua_id: Joi.string().required(),
      valor_locacao: Joi.number().min(0).optional(),
      taxa_mensal: Joi.number().min(0).optional(),
      // Campos adicionais de configuração da grua (opcionais)
      tipo_base: Joi.string().allow(null, '').optional(),
      altura_inicial: Joi.number().min(0).allow(null).optional(),
      altura_final: Joi.number().min(0).allow(null).optional(),
      raio_trabalho: Joi.number().min(0).allow(null).optional(),
      velocidade_giro: Joi.number().min(0).allow(null).optional(),
      velocidade_elevacao: Joi.number().min(0).allow(null).optional(),
      velocidade_translacao: Joi.number().min(0).allow(null).optional(),
      potencia_instalada: Joi.number().min(0).allow(null).optional(),
      voltagem: Joi.string().allow(null, '').optional(),
      tipo_ligacao: Joi.string().allow(null, '').optional(),
      capacidade_ponta: Joi.number().min(0).allow(null).optional(),
      capacidade_maxima_raio: Joi.number().min(0).allow(null).optional(),
      capacidade_1_cabo: Joi.number().min(0).allow(null).optional(),
      capacidade_2_cabos: Joi.number().min(0).allow(null).optional(),
      velocidade_rotacao: Joi.number().min(0).allow(null).optional(),
      ano_fabricacao: Joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null).optional(),
      vida_util: Joi.number().min(0).allow(null).optional(),
      manual_operacao: Joi.string().allow(null, '').optional(),
      procedimento_montagem: Joi.boolean().allow(null).optional(),
      procedimento_operacao: Joi.boolean().allow(null).optional(),
      procedimento_desmontagem: Joi.boolean().allow(null).optional(),
      fundacao: Joi.string().allow(null, '').optional(),
      condicoes_ambiente: Joi.string().allow(null, '').optional(),
      raio_operacao: Joi.number().min(0).allow(null).optional(),
      raio: Joi.number().min(0).allow(null).optional(),
      altura: Joi.number().min(0).allow(null).optional(),
      local_instalacao: Joi.string().allow(null, '').optional(),
      observacoes_montagem: Joi.string().allow(null, '').optional(),
      responsavel_tecnico: Joi.string().allow(null, '').optional(),
      crea_responsavel: Joi.string().allow(null, '').optional(),
      valor_operador: Joi.number().min(0).allow(null).optional(),
      valor_manutencao: Joi.number().min(0).allow(null).optional(),
      valor_estaiamento: Joi.number().min(0).allow(null).optional(),
      valor_chumbadores: Joi.number().min(0).allow(null).optional(),
      valor_montagem: Joi.number().min(0).allow(null).optional(),
      valor_desmontagem: Joi.number().min(0).allow(null).optional(),
      valor_transporte: Joi.number().min(0).allow(null).optional(),
      valor_hora_extra: Joi.number().min(0).allow(null).optional(),
      valor_seguro: Joi.number().min(0).allow(null).optional(),
      valor_caucao: Joi.number().min(0).allow(null).optional(),
      guindaste_montagem: Joi.string().allow(null, '').optional(),
      quantidade_viagens: Joi.number().integer().min(0).allow(null).optional(),
      alojamento_alimentacao: Joi.string().allow(null, '').optional(),
      responsabilidade_acessorios: Joi.string().allow(null, '').optional(),
      // Condições comerciais
      prazo_validade: Joi.alternatives().try(
        Joi.string().allow(null, ''),
        Joi.number().allow(null)
      ).optional(),
      forma_pagamento: Joi.string().allow(null, '').optional(),
      multa_atraso: Joi.number().min(0).allow(null).optional(),
      reajuste_indice: Joi.string().allow(null, '').optional(),
      garantia_caucao: Joi.alternatives().try(
        Joi.string().allow(null, ''),
        Joi.number().min(0).allow(null)
      ).optional(),
      retencao_contratual: Joi.number().min(0).allow(null).optional()
    })
  ).allow(null).optional(),
  // Dados dos funcionários
  funcionarios: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      userId: Joi.string().required(),
      role: Joi.string().allow('', null).optional(),
      name: Joi.string().required(),
      gruaId: Joi.string().allow(null, '').optional()
    })
  ).allow(null).optional(),
  // Campos de geolocalização
  latitude: Joi.number().min(-90).max(90).allow(null).optional(),
  longitude: Joi.number().min(-180).max(180).allow(null).optional(),
  raio_permitido: Joi.number().integer().positive().default(500).optional(),
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
  cliente_telefone: Joi.string().allow('', null).optional(),
  // Novos campos obrigatórios
  cno: Joi.string().allow(null, '').optional(),
  cno_arquivo: Joi.string().allow(null, '').optional(),
  art_numero: Joi.string().allow(null, '').optional(),
  art_arquivo: Joi.string().allow(null, '').optional(),
  apolice_numero: Joi.string().allow(null, '').optional(),
  apolice_arquivo: Joi.string().allow(null, '').optional(),
  // Responsável técnico e sinaleiros (para processamento durante criação)
  responsavel_tecnico: Joi.object({
    funcionario_id: Joi.number().integer().positive().optional(),
    nome: Joi.string().min(2).when('funcionario_id', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.optional() }),
    cpf_cnpj: Joi.string().when('funcionario_id', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.optional() }),
    crea: Joi.string().allow(null, '').optional(),
    email: Joi.string().email().allow(null, '').optional(),
    telefone: Joi.string().allow(null, '').optional()
  }).allow(null).optional(),
  sinaleiros: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid().allow(null, '').optional(),
      nome: Joi.string().min(2).allow(null, '').optional(),
      rg_cpf: Joi.string().allow(null, '').optional(),
      telefone: Joi.string().allow(null, '').optional(),
      email: Joi.string().email().allow(null, '').optional(),
      tipo: Joi.string().valid('principal', 'reserva').allow(null, '').optional()
    })
  ).allow(null).optional()
})

// Schema para atualização parcial de obra (PUT/PATCH)
const obraUpdateSchema = Joi.object({
  nome: Joi.string().min(2).optional(),
  cliente_id: Joi.number().integer().positive().optional(),
  endereco: Joi.string().optional(),
  endereco_rua: Joi.string().allow('', null).optional(),
  endereco_numero: Joi.string().allow('', null).optional(),
  endereco_bairro: Joi.string().allow('', null).optional(),
  endereco_complemento: Joi.string().allow('', null).optional(),
  cidade: Joi.string().optional(),
  estado: Joi.string().min(2).max(2).optional(),
  tipo: Joi.string().valid('Residencial', 'Comercial', 'Industrial', 'Infraestrutura').optional(),
  cep: Joi.string().pattern(/^\d{5}-?\d{3}$/).allow(null, '').optional(),
  contato_obra: Joi.string().allow('', null).optional(),
  telefone_obra: Joi.string().allow('', null).optional(),
  email_obra: Joi.string().email().allow('', null).optional(),
  status: Joi.string().valid('Planejamento', 'Em Andamento', 'Pausada', 'Concluída', 'Cancelada').optional(),
  descricao: Joi.string().allow('', null).optional(),
  canteiro: Joi.string().allow('', null).optional(),
  data_inicio: Joi.date().allow(null).optional(),
  data_fim: Joi.date().allow(null).optional(),
  orcamento: Joi.number().positive().allow(null).optional(),
  orcamento_id: Joi.number().integer().positive().allow(null).optional(),
  observacoes: Joi.string().allow('', null).optional(),
  responsavel_id: Joi.number().integer().positive().allow(null).optional(),
  responsavel_nome: Joi.string().allow('', null).optional(),
  latitude: Joi.number().min(-90).max(90).allow(null).optional(),
  longitude: Joi.number().min(-180).max(180).allow(null).optional(),
  raio_permitido: Joi.number().integer().positive().optional(),
  cno: Joi.string().allow(null, '').optional(),
  cno_arquivo: Joi.string().allow(null, '').optional(),
  art_numero: Joi.string().allow(null, '').optional(),
  art_arquivo: Joi.string().allow(null, '').optional(),
  apolice_numero: Joi.string().allow(null, '').optional(),
  apolice_arquivo: Joi.string().allow(null, '').optional(),
  gruas: obraSchema.extract('gruas'),
  funcionarios: obraSchema.extract('funcionarios'),
  responsavel_tecnico: obraSchema.extract('responsavel_tecnico'),
  sinaleiros: obraSchema.extract('sinaleiros')
}).min(1)

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
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user
    const userRole = user.role || user.perfil?.nome || ''
    const userRoleNormalized = userRole
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const { status, cliente_id } = req.query

    // Verificar se usuário tem permissão total ou apenas para suas obras
    const hasFullAccess = ['admin', 'gestores', 'gestor'].includes(userRoleNormalized)
    const isOperador = ['operador', 'operarios'].includes(userRoleNormalized)

    // Verificar se funcionário tem acesso global através do cargo
    let temAcessoGlobal = false
    if (user.funcionario_id) {
      const { data: funcionario } = await supabaseAdmin
        .from('funcionarios')
        .select('cargo_id, cargos(acesso_global_obras)')
        .eq('id', user.funcionario_id)
        .single()

      if (funcionario?.cargos?.acesso_global_obras) {
        temAcessoGlobal = true
      }
    }

    console.log(`🔍 [OBRAS] Listagem - Usuário: ${user.id}, Role: ${userRole} (${userRoleNormalized}), Full Access: ${hasFullAccess}, Acesso Global: ${temAcessoGlobal}`)

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
          tipo_base,
          altura_inicial,
          altura_final,
          raio_trabalho,
          velocidade_giro,
          velocidade_elevacao,
          velocidade_translacao,
          potencia_instalada,
          voltagem,
          tipo_ligacao,
          capacidade_ponta,
          capacidade_maxima_raio,
          velocidade_rotacao,
          ano_fabricacao,
          vida_util,
          guindaste_montagem,
          quantidade_viagens,
          alojamento_alimentacao,
          responsabilidade_acessorios,
          data_montagem,
          data_desmontagem,
          local_instalacao,
          observacoes_montagem,
          grua:gruas (
            id,
            name,
            modelo,
            fabricante,
            tipo,
            tipo_base,
            capacidade,
            altura_trabalho,
            altura_final,
            numero_serie,
            capacidade_1_cabo,
            capacidade_2_cabos,
            potencia_instalada,
            voltagem,
            velocidade_rotacao,
            velocidade_elevacao,
            ano
          )
        ),
        obra_gruas_configuracao:obra_gruas_configuracao (
          id,
          grua_id,
          posicao_x,
          posicao_y,
          posicao_z,
          angulo_rotacao,
          alcance_operacao,
          area_cobertura,
          data_instalacao,
          data_remocao,
          status,
          observacoes,
          grua:gruas (
            id,
            name,
            modelo,
            fabricante,
            tipo,
            capacidade
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

    // Processar dados para combinar grua_obra e obra_gruas_configuracao
    const processedData = (data || []).map(obra => {
      // Combinar grua_obra (tabela antiga) e obra_gruas_configuracao (tabela nova)
      const gruaObraAntiga = obra.grua_obra || []
      const obraGruasConfiguracao = (obra.obra_gruas_configuracao || [])
        .filter(config => config.status === 'ativa') // Apenas configurações ativas
        .map(config => ({
          id: config.id,
          grua_id: config.grua_id,
          // Mapear campos da nova tabela para o formato esperado
          data_inicio_locacao: config.data_instalacao,
          data_fim_locacao: config.data_remocao,
          valor_locacao_mensal: null, // Não existe na nova tabela
          status: config.status === 'ativa' ? 'Ativa' : config.status,
          observacoes: config.observacoes,
          // Campos adicionais da nova tabela
          posicao_x: config.posicao_x,
          posicao_y: config.posicao_y,
          posicao_z: config.posicao_z,
          angulo_rotacao: config.angulo_rotacao,
          alcance_operacao: config.alcance_operacao,
          area_cobertura: config.area_cobertura,
          data_instalacao: config.data_instalacao,
          data_remocao: config.data_remocao,
          grua: config.grua || null
        }))
      
      // Combinar ambas as fontes, removendo duplicatas por grua_id
      const todasGruas = [...gruaObraAntiga, ...obraGruasConfiguracao]
      const gruasUnicas = Array.from(
        new Map(todasGruas.map(g => [g.grua_id, g])).values()
      )
      
      return {
        ...obra,
        grua_obra: gruasUnicas,
        // Manter obra_gruas_configuracao para compatibilidade
        obra_gruas_configuracao: obra.obra_gruas_configuracao || []
      }
    })

    // Se for operador, filtrar apenas obras onde está alocado (a menos que tenha acesso global)
    let filteredData = processedData
    let filteredCount = count

    if (isOperador && user.funcionario_id && !temAcessoGlobal) {
      console.log(`🔍 [OBRAS] Filtrando obras para funcionário ID: ${user.funcionario_id}`)
      
      // Buscar obras onde o funcionário está alocado
      const { data: obrasFuncionario, error: obrasError } = await supabaseAdmin
        .from('funcionarios_obras')
        .select('obra_id')
        .eq('funcionario_id', user.funcionario_id)
        .eq('status', 'ativo')

      if (!obrasError && obrasFuncionario) {
        const obrasIds = obrasFuncionario.map(fo => fo.obra_id)
        console.log(`🔍 [OBRAS] IDs das obras do funcionário:`, obrasIds)
        
        filteredData = filteredData.filter(obra => obrasIds.includes(obra.id))
        filteredCount = filteredData.length
      } else if (obrasError) {
        console.error(`❌ [OBRAS] Erro ao buscar alocações do funcionário ${user.funcionario_id}:`, obrasError)
        filteredData = []
        filteredCount = 0
      }
    } else if (isOperador && temAcessoGlobal) {
      console.log(`✅ [OBRAS] Funcionário tem acesso global - mostrando todas as obras`)
    }

    const totalPages = Math.ceil(filteredCount / limit)

    console.log(`✅ [OBRAS] Retornando ${filteredData.length} obras (Total: ${filteredCount})`)

    res.json({
      success: true,
      data: filteredData,
      pagination: {
        page,
        limit,
        total: filteredCount,
        pages: totalPages
      }
    })
  } catch (error) {
    console.error('❌ Erro ao listar obras:', error)
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
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const user = req.user
    const userRole = user.role || user.perfil?.nome
    const isOperador = userRole === 'Operários'

    // Verificar se funcionário tem acesso global através do cargo
    let temAcessoGlobal = false
    if (user.funcionario_id) {
      const { data: funcionario } = await supabaseAdmin
        .from('funcionarios')
        .select('cargo_id, cargos(acesso_global_obras)')
        .eq('id', user.funcionario_id)
        .single()

      if (funcionario?.cargos?.acesso_global_obras) {
        temAcessoGlobal = true
      }
    }

    console.log(`🔍 [OBRAS] Detalhes - ID: ${id}, Usuário: ${user.id}, Role: ${userRole}, Acesso Global: ${temAcessoGlobal}`)

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
          tipo_base,
          altura_inicial,
          altura_final,
          raio_trabalho,
          velocidade_rotacao,
          velocidade_elevacao,
          velocidade_translacao,
          potencia_instalada,
          voltagem,
          tipo_ligacao,
          capacidade_ponta,
          capacidade_1_cabo,
          capacidade_2_cabos,
          observacoes_montagem,
          grua:gruas (
            id,
            modelo,
            fabricante,
            tipo,
            tipo_base,
            capacidade,
            altura_trabalho,
            altura_final,
            numero_serie,
            capacidade_1_cabo,
            capacidade_2_cabos,
            potencia_instalada,
            voltagem,
            velocidade_rotacao,
            velocidade_elevacao,
            ano
          )
        ),
        obra_gruas_configuracao:obra_gruas_configuracao (
          id,
          grua_id,
          posicao_x,
          posicao_y,
          posicao_z,
          angulo_rotacao,
          alcance_operacao,
          area_cobertura,
          data_instalacao,
          data_remocao,
          status,
          observacoes,
          grua:gruas (
            id,
            name,
            modelo,
            fabricante,
            tipo,
            capacidade
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
        ),
        sinaleiros_obra (
          id,
          obra_id,
          nome,
          rg_cpf,
          telefone,
          email,
          tipo,
          created_at,
          updated_at
        ),
        responsaveis_tecnicos (
          id,
          obra_id,
          nome,
          cpf_cnpj,
          crea,
          email,
          telefone,
          tipo,
          crea_empresa,
          created_at,
          updated_at
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

    // Se for operador, verificar se tem acesso a esta obra (a menos que tenha acesso global)
    if (isOperador && user.funcionario_id && !temAcessoGlobal) {
      console.log(`🔍 [OBRAS] Verificando acesso do funcionário ${user.funcionario_id} à obra ${id}`)
      
      const { data: alocacao, error: alocacaoError } = await supabaseAdmin
        .from('funcionarios_obras')
        .select('*')
        .eq('funcionario_id', user.funcionario_id)
        .eq('obra_id', id)
        .eq('status', 'ativo')
        .single()

      if (alocacaoError || !alocacao) {
        console.log(`❌ [OBRAS] Operador não tem acesso à obra ${id}`)
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Você não tem permissão para visualizar esta obra'
        })
      }
      
      console.log(`✅ [OBRAS] Operador tem acesso à obra ${id}`)
    } else if (isOperador && temAcessoGlobal) {
      console.log(`✅ [OBRAS] Funcionário tem acesso global - permitindo acesso à obra ${id}`)
    }

    // Processar dados para combinar grua_obra e obra_gruas_configuracao
    const gruaObraAntiga = data.grua_obra || []
    const obraGruasConfiguracao = (data.obra_gruas_configuracao || [])
      .filter(config => config.status === 'ativa') // Apenas configurações ativas
      .map(config => ({
        id: config.id,
        grua_id: config.grua_id,
        // Mapear campos da nova tabela para o formato esperado
        data_inicio_locacao: config.data_instalacao,
        data_fim_locacao: config.data_remocao,
        valor_locacao_mensal: null, // Não existe na nova tabela
        status: config.status === 'ativa' ? 'Ativa' : config.status,
        observacoes: config.observacoes,
        // Campos adicionais da nova tabela
        posicao_x: config.posicao_x,
        posicao_y: config.posicao_y,
        posicao_z: config.posicao_z,
        angulo_rotacao: config.angulo_rotacao,
        alcance_operacao: config.alcance_operacao,
        area_cobertura: config.area_cobertura,
        data_instalacao: config.data_instalacao,
        data_remocao: config.data_remocao,
        grua: config.grua || null
      }))
    
    // Combinar ambas as fontes, removendo duplicatas por grua_id
    const todasGruas = [...gruaObraAntiga, ...obraGruasConfiguracao]
    const gruasUnicas = Array.from(
      new Map(todasGruas.map(g => [g.grua_id, g])).values()
    )

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

    // Adicionar totais aos dados e combinar gruas
    const obraComTotais = {
      ...data,
      grua_obra: gruasUnicas,
      // Manter obra_gruas_configuracao para compatibilidade
      obra_gruas_configuracao: data.obra_gruas_configuracao || [],
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

router.post('/:id/resolver-coordenadas', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const obraId = parseInt(id, 10)

    if (Number.isNaN(obraId)) {
      return res.status(400).json({
        success: false,
        error: 'ID da obra inválido'
      })
    }

    const { data: obra, error: obraError } = await supabaseAdmin
      .from('obras')
      .select('id, nome, endereco, cidade, estado, cep, latitude, longitude')
      .eq('id', obraId)
      .single()

    if (obraError || !obra) {
      return res.status(404).json({
        success: false,
        error: 'Obra não encontrada'
      })
    }

    const coordenadasResolvidas = await resolverCoordenadasDaObra({
      endereco: obra.endereco,
      cidade: obra.cidade,
      estado: obra.estado,
      cep: obra.cep,
      latitude: obra.latitude,
      longitude: obra.longitude
    })

    if (!coordenadasResolvidas.latitude || !coordenadasResolvidas.longitude) {
      return res.status(404).json({
        success: false,
        error: 'Não foi possível resolver coordenadas para a obra',
        data: {
          obra_id: obra.id,
          obra_nome: obra.nome,
          geocoding: coordenadasResolvidas.geocodingInfo
        }
      })
    }

    if (coordenadasResolvidas.geocodingAplicado) {
      await supabaseAdmin
        .from('obras')
        .update({
          latitude: coordenadasResolvidas.latitude,
          longitude: coordenadasResolvidas.longitude,
          updated_at: new Date().toISOString()
        })
        .eq('id', obra.id)
    }

    return res.json({
      success: true,
      data: {
        obra_id: obra.id,
        obra_nome: obra.nome,
        coordenadas: {
          lat: coordenadasResolvidas.latitude,
          lng: coordenadasResolvidas.longitude
        },
        mensagem: coordenadasResolvidas.geocodingAplicado
          ? 'Coordenadas geradas e salvas automaticamente.'
          : 'Coordenadas já estavam cadastradas na obra.',
        geocoding: coordenadasResolvidas.geocodingInfo
      }
    })
  } catch (error) {
    console.error('Erro ao resolver coordenadas da obra:', error)
    return res.status(500).json({
      success: false,
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
router.post('/', authenticateToken, requirePermission('obras:criar'), async (req, res) => {
  try {
    // ============================================
    // 📋 LOG COMPLETO - CRIAÇÃO DE OBRA (POST)
    // ============================================
    console.log('\n═══════════════════════════════════════════════════════════')
    console.log('🚀 POST /api/obras - CRIAÇÃO DE OBRA')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('📅 Timestamp:', new Date().toISOString())
    console.log('👤 Usuário:', req.user?.id || 'N/A')
    console.log('\n📥 DADOS RECEBIDOS (req.body):')
    console.log(JSON.stringify(req.body, null, 2))
    
    // Log estruturado por seção
    console.log('\n📊 RESUMO DOS DADOS RECEBIDOS:')
    console.log('  📝 Dados Básicos:')
    console.log('    - Nome:', req.body.nome || 'N/A')
    console.log('    - Cliente ID:', req.body.cliente_id || 'N/A')
    console.log('    - Tipo:', req.body.tipo || 'N/A')
    console.log('    - Status:', req.body.status || 'N/A')
    console.log('    - Endereço:', req.body.endereco || 'N/A')
    console.log('    - Cidade:', req.body.cidade || 'N/A')
    console.log('    - Estado:', req.body.estado || 'N/A')
    console.log('    - CEP:', req.body.cep || 'N/A')
    console.log('  📄 Documentos:')
    console.log('    - CNO:', req.body.cno || 'N/A')
    console.log('    - CNO Arquivo:', req.body.cno_arquivo || 'N/A')
    console.log('    - ART Número:', req.body.art_numero || 'N/A')
    console.log('    - ART Arquivo:', req.body.art_arquivo || 'N/A')
    console.log('    - Apólice Número:', req.body.apolice_numero || 'N/A')
    console.log('    - Apólice Arquivo:', req.body.apolice_arquivo || 'N/A')
    console.log('  🏗️ Gruas:')
    console.log('    - Grua ID (individual):', req.body.grua_id || 'N/A')
    console.log('    - Array de Gruas:', Array.isArray(req.body.gruas) ? `${req.body.gruas.length} grua(s)` : 'N/A')
    if (Array.isArray(req.body.gruas) && req.body.gruas.length > 0) {
      req.body.gruas.forEach((grua, idx) => {
        console.log(`      [${idx + 1}] ID: ${grua.id || grua.grua_id || 'N/A'}, Modelo: ${grua.modelo || 'N/A'}`)
      })
    }
    console.log('  👥 Funcionários:')
    console.log('    - Quantidade:', Array.isArray(req.body.funcionarios) ? req.body.funcionarios.length : 0)
    if (Array.isArray(req.body.funcionarios) && req.body.funcionarios.length > 0) {
      req.body.funcionarios.forEach((func, idx) => {
        console.log(`      [${idx + 1}] ${func.name || func.nome || 'N/A'} (${func.role || func.cargo || 'N/A'})`)
      })
    }
    console.log('  🚦 Sinaleiros:')
    console.log('    - Quantidade:', Array.isArray(req.body.sinaleiros) ? req.body.sinaleiros.length : 0)
    if (Array.isArray(req.body.sinaleiros) && req.body.sinaleiros.length > 0) {
      req.body.sinaleiros.forEach((sinal, idx) => {
        console.log(`      [${idx + 1}] ${sinal.nome || 'N/A'} (${sinal.tipo || 'N/A'}) - ${sinal.rg_cpf || 'N/A'}`)
      })
    }
    console.log('  👨‍💼 Responsável Técnico:')
    if (req.body.responsavel_tecnico) {
      console.log('    - Nome:', req.body.responsavel_tecnico.nome || 'N/A')
      console.log('    - CPF/CNPJ:', req.body.responsavel_tecnico.cpf_cnpj || 'N/A')
      console.log('    - CREA:', req.body.responsavel_tecnico.crea || 'N/A')
      console.log('    - Funcionário ID:', req.body.responsavel_tecnico.funcionario_id || 'N/A')
    } else {
      console.log('    - Nenhum responsável técnico fornecido')
    }
    console.log('  💰 Custos Mensais:')
    console.log('    - Quantidade:', Array.isArray(req.body.custos_mensais) ? req.body.custos_mensais.length : 0)
    if (Array.isArray(req.body.custos_mensais) && req.body.custos_mensais.length > 0) {
      const total = req.body.custos_mensais.reduce((acc, c) => acc + (c.totalOrcamento || c.total_orcamento || 0), 0)
      console.log('    - Total:', total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
    }
    console.log('═══════════════════════════════════════════════════════════\n')
    
    console.log('🔍 DEBUG - Dados recebidos para criação de obra:', JSON.stringify(req.body, null, 2))
    console.log('🔍 DEBUG - Array gruas no req.body:', req.body.gruas)
    console.log('🔍 DEBUG - Tipo de gruas no req.body:', typeof req.body.gruas)
    console.log('🔍 DEBUG - É array?', Array.isArray(req.body.gruas))
    
    const { error, value } = obraSchema.validate(req.body, {
      stripUnknown: false, // Não remover campos desconhecidos
      abortEarly: false // Retornar todos os erros, não apenas o primeiro
    })
    if (error) {
      console.error('❌ Erro de validação:', error.details)
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message,
        allErrors: error.details
      })
    }

    const enderecoFinal = montarEnderecoCompleto({
      endereco: value.endereco,
      endereco_rua: value.endereco_rua,
      endereco_numero: value.endereco_numero,
      endereco_bairro: value.endereco_bairro,
      endereco_complemento: value.endereco_complemento
    })

    if (!enderecoFinal) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: 'Informe o endereço completo da obra (logradouro, número, bairro) ou o campo endereco.'
      })
    }
    
    console.log('✅ Dados validados com sucesso:', value)
    console.log('🔧 Dados da grua recebidos:', {
      grua_id: value.grua_id,
      grua_valor: value.grua_valor,
      grua_mensalidade: value.grua_mensalidade
    })
    console.log('🏗️ Array de gruas recebido:', value.gruas)
    console.log('🏗️ Tipo de gruas:', typeof value.gruas)
    console.log('🏗️ É array?', Array.isArray(value.gruas))
    console.log('🏗️ Length:', value.gruas?.length || 0)
    console.log('👥 Funcionários recebidos:', value.funcionarios)
    console.log('💰 Custos mensais recebidos:', value.custos_mensais)
    console.log('📊 Resumo dos dados recebidos:')
    console.log('  - Obra:', value.nome)
    console.log('  - Cliente ID:', value.cliente_id)
    console.log('  - Grua ID:', value.grua_id || 'Nenhuma')
    console.log('  - Array Gruas:', value.gruas?.length || 0)
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

    const coordenadasResolvidas = await resolverCoordenadasDaObra({
      endereco: enderecoFinal,
      cidade: value.cidade,
      estado: value.estado,
      cep: value.cep,
      latitude: value.latitude,
      longitude: value.longitude
    })

    if (coordenadasResolvidas.geocodingAplicado) {
      console.log('📍 Coordenadas geradas automaticamente para a obra:', coordenadasResolvidas.geocodingInfo)
    } else if (!coordenadaValida(value.latitude) || !coordenadaValida(value.longitude)) {
      console.warn('⚠️ Não foi possível gerar coordenadas automaticamente para a obra.')
    }

    // Preparar dados da obra (incluindo todos os campos da tabela)
    const obraData = {
      nome: value.nome,
      cliente_id: value.cliente_id,
      endereco: enderecoFinal,
      endereco_rua: value.endereco_rua || null,
      endereco_numero: value.endereco_numero || null,
      endereco_bairro: value.endereco_bairro || null,
      endereco_complemento: value.endereco_complemento || null,
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
      orcamento_id: value.orcamento_id, // ID do orçamento aprovado vinculado
      observacoes: value.observacoes,
      responsavel_id: value.responsavel_id,
      responsavel_nome: value.responsavel_nome,
      // Campos de geolocalização
      latitude: coordenadasResolvidas.latitude,
      longitude: coordenadasResolvidas.longitude,
      raio_permitido: value.raio_permitido || 500,
      // Campos obrigatórios (CNO, ART, Apólice)
      cno: value.cno,
      cno_arquivo: value.cno_arquivo,
      art_numero: value.art_numero,
      art_arquivo: value.art_arquivo,
      apolice_numero: value.apolice_numero,
      apolice_arquivo: value.apolice_arquivo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📝 Dados da obra a ser criada:', obraData)

    let { data, error: insertError } = await supabaseAdmin
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
    console.log('🔍 DEBUG - Responsável técnico recebido:', value.responsavel_tecnico)
    console.log('🔍 DEBUG - Sinaleiros recebidos:', value.sinaleiros)
    console.log('🔍 DEBUG - Tipo de sinaleiros:', typeof value.sinaleiros)
    console.log('🔍 DEBUG - Sinaleiros é array?', Array.isArray(value.sinaleiros))
    console.log('🔍 DEBUG - Quantidade de sinaleiros:', value.sinaleiros?.length || 0)

    // Nota: Removida vinculação automática do cliente como supervisor
    // O sistema não utiliza mais o conceito de supervisor

    // Processar responsável técnico se fornecido
    if (value.responsavel_tecnico && (value.responsavel_tecnico.funcionario_id || (value.responsavel_tecnico.nome && value.responsavel_tecnico.cpf_cnpj))) {
      console.log('🔧 Processando responsável técnico...')
      try {
        const { funcionario_id, nome, cpf_cnpj, crea, email, telefone } = value.responsavel_tecnico
        
        if (funcionario_id) {
          // Se vier funcionario_id, atualiza diretamente os campos na tabela obras
          const { data: func, error: errFunc } = await supabaseAdmin
            .from('funcionarios')
            .select('id, nome')
            .eq('id', funcionario_id)
            .single()

          if (!errFunc && func) {
            const { error: errUpdateObra } = await supabaseAdmin
              .from('obras')
              .update({ responsavel_id: func.id, responsavel_nome: func.nome })
              .eq('id', data.id)

            if (errUpdateObra) {
              console.error('❌ Erro ao atualizar responsável técnico na obra:', errUpdateObra)
            } else {
              console.log('✅ Responsável técnico (funcionário) salvo com sucesso')
            }
          }
        } else if (nome && cpf_cnpj) {
          // Criar na tabela responsaveis_tecnicos
          const { data: responsavelCriado, error: errResponsavel } = await supabaseAdmin
            .from('responsaveis_tecnicos')
            .insert({
              obra_id: data.id,
              nome,
              cpf_cnpj,
              crea: crea || null,
              email: email || null,
              telefone: telefone || null
            })
            .select()
            .single()

          if (errResponsavel) {
            console.error('❌ Erro ao criar responsável técnico:', errResponsavel)
          } else {
            // Atualizar também a obra com o nome do responsável
            const { error: errUpdateObra } = await supabaseAdmin
              .from('obras')
              .update({ responsavel_nome: nome })
              .eq('id', data.id)

            if (errUpdateObra) {
              console.error('❌ Erro ao atualizar responsável técnico na obra:', errUpdateObra)
            } else {
              console.log('✅ Responsável técnico salvo com sucesso')
            }
          }
        }
      } catch (responsavelError) {
        console.error('❌ Erro ao processar responsável técnico:', responsavelError)
        // Não falhar a criação da obra por causa do responsável técnico
      }
    }

    // Processar sinaleiros se fornecidos
    console.log('🔍 DEBUG - Verificando sinaleiros antes de processar:')
    console.log('  - value.sinaleiros existe?', !!value.sinaleiros)
    console.log('  - É array?', Array.isArray(value.sinaleiros))
    console.log('  - Length:', value.sinaleiros?.length || 0)
    console.log('  - Conteúdo:', JSON.stringify(value.sinaleiros, null, 2))
    
    // NOTA: Sinaleiros não são mais processados aqui durante a criação da obra
    // Eles devem ser salvos separadamente via endpoint POST /api/obras/:id/sinaleiros
    // Isso evita duplicação e permite validação adequada de documentos
    if (value.sinaleiros && Array.isArray(value.sinaleiros) && value.sinaleiros.length > 0) {
      console.log('ℹ️ Sinaleiros fornecidos na criação da obra serão processados separadamente via endpoint específico')
    }

    // Processar dados das gruas se fornecidos
    // IMPORTANTE: Priorizar array de gruas sobre grua_id individual
    console.log('🔍 DEBUG - Verificando array de gruas antes do processamento:')
    console.log('  - value.gruas existe?', !!value.gruas)
    console.log('  - É array?', Array.isArray(value.gruas))
    console.log('  - Length:', value.gruas?.length || 0)
    console.log('  - Conteúdo:', JSON.stringify(value.gruas, null, 2))
    console.log('  - value.grua_id:', value.grua_id)
    
    // Priorizar array de gruas sobre grua_id individual
    const errosGruas = []
    if (value.gruas && Array.isArray(value.gruas) && value.gruas.length > 0) {
      console.log('🔧 Processando múltiplas gruas...')
      try {
        console.log('📝 Dados das gruas para processar:', value.gruas)
        
        // Processar cada grua
        for (const grua of value.gruas) {
          console.log('🔍 DEBUG - Dados completos da grua recebidos:', JSON.stringify(grua, null, 2))
          
          // Validar se a grua existe antes de tentar criar o relacionamento
          if (!grua.grua_id) {
            console.error('❌ Erro: grua_id não fornecido para uma das gruas')
            continue
          }
          
          console.log('🔍 Verificando se a grua existe:', grua.grua_id)
          const { data: gruaExistente, error: gruaCheckError } = await supabaseAdmin
            .from('gruas')
            .select('id, name, status')
            .eq('id', grua.grua_id)
            .single()
          
          if (gruaCheckError || !gruaExistente) {
            console.error('❌ Erro: Grua não encontrada:', grua.grua_id)
            console.error('❌ Detalhes:', gruaCheckError)
            // Continuar com a próxima grua ao invés de falhar toda a operação
            continue
          }
          
          console.log('✅ Grua encontrada:', gruaExistente.name, 'Status atual:', gruaExistente.status)
          
          // Verificar se já existe um relacionamento ativo para esta grua
          const { data: relacionamentoExistente, error: relacionamentoCheckError } = await supabaseAdmin
            .from('grua_obra')
            .select('id, obra_id, status')
            .eq('grua_id', grua.grua_id)
            .eq('status', 'Ativa')
            .maybeSingle()
          
          if (relacionamentoExistente) {
            console.warn('⚠️ ATENÇÃO: A grua já possui um relacionamento ativo com a obra ID:', relacionamentoExistente.obra_id)
            console.warn('⚠️ Será criado um novo relacionamento. Considere finalizar o relacionamento anterior primeiro.')
            // Continuar mesmo assim - pode ser intencional ter múltiplos relacionamentos
          }
          
          // Função auxiliar para converter valores numéricos
          const parseNumber = (val) => {
            if (val === null || val === undefined || val === '') return null
            const parsed = typeof val === 'string' ? parseFloat(val) : Number(val)
            return isNaN(parsed) ? null : parsed
          }
          
          const parseInteger = (val) => {
            if (val === null || val === undefined || val === '') return null
            const parsed = typeof val === 'string' ? parseInt(val, 10) : Number(val)
            return isNaN(parsed) ? null : parsed
          }
          
          // Função auxiliar para converter data para formato YYYY-MM-DD
          const formatDate = (dateValue) => {
            if (!dateValue) return new Date().toISOString().split('T')[0]
            if (dateValue instanceof Date) return dateValue.toISOString().split('T')[0]
            if (typeof dateValue === 'string') {
              // Se já está no formato YYYY-MM-DD, retornar direto
              if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) return dateValue
              // Se tem T (ISO format), pegar só a parte da data
              if (dateValue.includes('T')) return dateValue.split('T')[0]
              return dateValue
            }
            return new Date().toISOString().split('T')[0]
          }
          
          const tipoLigacaoNormalizada = (() => {
            const valor = grua.tipo_ligacao
            if (!valor) return null
            const texto = String(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
            if (texto.includes('tri')) return 'trifasica'
            if (texto.includes('mono')) return 'monofasica'
            return String(valor)
          })()

          const gruaObraData = {
            obra_id: data.id,
            grua_id: grua.grua_id,
            valor_locacao_mensal: parseNumber(grua.valor_locacao || grua.taxa_mensal) || 0,
            data_inicio_locacao: formatDate(value.data_inicio),
            status: 'Ativa',
            // Parâmetros Técnicos
            tipo_base: grua.tipo_base || null,
            altura_inicial: parseNumber(grua.altura_inicial),
            altura_final: parseNumber(grua.altura_final),
            raio_trabalho: parseNumber(grua.raio_trabalho),
            velocidade_giro: parseNumber(grua.velocidade_giro),
            velocidade_elevacao: parseNumber(grua.velocidade_elevacao),
            velocidade_translacao: parseNumber(grua.velocidade_translacao),
            potencia_instalada: parseNumber(grua.potencia_instalada),
            voltagem: grua.voltagem || null,
            tipo_ligacao: tipoLigacaoNormalizada,
            capacidade_ponta: parseNumber(grua.capacidade_ponta),
            capacidade_maxima_raio: parseNumber(grua.capacidade_maxima_raio),
            capacidade_1_cabo: parseNumber(grua.capacidade_1_cabo),
            capacidade_2_cabos: parseNumber(grua.capacidade_2_cabos),
            velocidade_rotacao: parseNumber(grua.velocidade_rotacao),
            ano_fabricacao: parseInteger(grua.ano_fabricacao),
            vida_util: parseInteger(grua.vida_util),
            manual_operacao: grua.manual_operacao || 'Vinculado à obra',
            procedimento_montagem: typeof grua.procedimento_montagem === 'boolean' ? grua.procedimento_montagem : false,
            procedimento_operacao: typeof grua.procedimento_operacao === 'boolean' ? grua.procedimento_operacao : false,
            procedimento_desmontagem: typeof grua.procedimento_desmontagem === 'boolean' ? grua.procedimento_desmontagem : false,
            fundacao: grua.fundacao || null,
            condicoes_ambiente: grua.condicoes_ambiente || null,
            raio_operacao: parseNumber(grua.raio_operacao ?? grua.raio ?? grua.raio_trabalho),
            raio: parseNumber(grua.raio ?? grua.raio_operacao ?? grua.raio_trabalho),
            altura: parseNumber(grua.altura ?? grua.altura_final),
            local_instalacao: grua.local_instalacao || value.endereco || null,
            observacoes_montagem: grua.observacoes_montagem || grua.observacoes || value.observacoes || null,
            responsavel_tecnico: grua.responsavel_tecnico || null,
            crea_responsavel: grua.crea_responsavel || null,
            // Serviços e Logística
            guindaste_montagem: grua.guindaste_montagem || null,
            quantidade_viagens: parseInteger(grua.quantidade_viagens),
            alojamento_alimentacao: grua.alojamento_alimentacao || null,
            responsabilidade_acessorios: grua.responsabilidade_acessorios || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          console.log('📝 Inserindo grua na tabela grua_obra com todos os campos:', JSON.stringify(gruaObraData, null, 2))
          
          const { data: gruaObraResult, error: gruaObraError } = await supabaseAdmin
            .from('grua_obra')
            .insert(gruaObraData)
            .select()
            .single()
          
          if (gruaObraError) {
            const erroInfo = {
              grua_id: grua.grua_id,
              codigo: gruaObraError.code,
              mensagem: gruaObraError.message,
              detalhes: gruaObraError.details,
              hint: gruaObraError.hint
            }
            errosGruas.push(erroInfo)
            
            console.error('❌ Erro ao inserir grua na tabela grua_obra:', gruaObraError)
            console.error('❌ Detalhes do erro:', JSON.stringify(gruaObraError, null, 2))
            console.error('❌ Código do erro:', gruaObraError.code)
            console.error('❌ Mensagem do erro:', gruaObraError.message)
            console.error('❌ Detalhes completos:', gruaObraError.details)
            
            // Se o erro for de coluna não encontrada, informar sobre a migration
            if (gruaObraError.code === 'PGRST204' || gruaObraError.message?.includes('column') || gruaObraError.message?.includes('does not exist')) {
              console.error('⚠️ ATENÇÃO: Parece que algumas colunas não existem na tabela grua_obra.')
              console.error('⚠️ Execute a migration: 20250202_add_campos_tecnicos_grua_obra.sql')
            }
            
            // Se o erro for de foreign key ou constraint, informar
            if (gruaObraError.code === '23503' || gruaObraError.message?.includes('foreign key')) {
              console.error('⚠️ ATENÇÃO: Erro de foreign key. Verifique se a grua_id está correto.')
            }
            
            // Se o erro for de constraint única (duplicate key)
            if (gruaObraError.code === '23505' || gruaObraError.message?.includes('duplicate') || gruaObraError.message?.includes('unique')) {
              console.error('⚠️ ATENÇÃO: Já existe um relacionamento ativo para esta grua nesta obra ou há uma constraint única violada.')
              console.error('⚠️ Código do erro:', gruaObraError.code)
              console.error('⚠️ Detalhes:', gruaObraError.details)
            }
            
            // Continuar com a próxima grua ao invés de falhar toda a operação
            continue
          } else {
            console.log('✅ Grua inserida na tabela grua_obra:', gruaObraResult)
            
            // Atualizar status da grua para 'em_obra'
            const { error: updateGruaError } = await supabaseAdmin
              .from('gruas')
              .update({
                status: 'em_obra',
                current_obra_id: data.id,
                current_obra_name: data.nome,
                updated_at: new Date().toISOString()
              })
              .eq('id', grua.grua_id)
            
            if (updateGruaError) {
              console.error('❌ Erro ao atualizar status da grua:', updateGruaError)
            } else {
              console.log('✅ Status da grua atualizado para "em_obra"')
            }
          }
        }
        
      } catch (gruaError) {
        console.error('❌ Erro ao processar dados das gruas:', gruaError)
        console.error('❌ Stack trace:', gruaError.stack)
        // Não falhar a criação da obra por causa das gruas
      }
    } else if (value.grua_id) {
      // Processar grua única (compatibilidade com versão anterior)
      console.log('🔧 Processando grua única (compatibilidade)...')
      try {
        // Função auxiliar para converter data para formato YYYY-MM-DD
        const formatDate = (dateValue) => {
          if (!dateValue) return new Date().toISOString().split('T')[0]
          if (dateValue instanceof Date) return dateValue.toISOString().split('T')[0]
          if (typeof dateValue === 'string') {
            // Se já está no formato YYYY-MM-DD, retornar direto
            if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) return dateValue
            // Se tem T (ISO format), pegar só a parte da data
            if (dateValue.includes('T')) return dateValue.split('T')[0]
            return dateValue
          }
          return new Date().toISOString().split('T')[0]
        }
        
        console.log('📝 Dados da grua para processar:', {
          obra_id: data.id,
          grua_id: value.grua_id,
          valor_locacao_mensal: value.grua_mensalidade,
          data_inicio_locacao: formatDate(value.data_inicio),
          status: 'Ativa'
        })
        
        // Validar se a grua existe antes de tentar criar o relacionamento
        console.log('🔍 Verificando se a grua existe:', value.grua_id)
        const { data: gruaExistente, error: gruaCheckError } = await supabaseAdmin
          .from('gruas')
          .select('id, name, status')
          .eq('id', value.grua_id)
          .single()
        
        if (gruaCheckError || !gruaExistente) {
          console.error('❌ Erro: Grua não encontrada:', value.grua_id)
          console.error('❌ Detalhes:', gruaCheckError)
        } else {
          console.log('✅ Grua encontrada:', gruaExistente.name, 'Status atual:', gruaExistente.status)
          
          // Função auxiliar para converter data para formato YYYY-MM-DD
          const formatDate = (dateValue) => {
            if (!dateValue) return new Date().toISOString().split('T')[0]
            if (dateValue instanceof Date) return dateValue.toISOString().split('T')[0]
            if (typeof dateValue === 'string') {
              // Se já está no formato YYYY-MM-DD, retornar direto
              if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) return dateValue
              // Se tem T (ISO format), pegar só a parte da data
              if (dateValue.includes('T')) return dateValue.split('T')[0]
              return dateValue
            }
            return new Date().toISOString().split('T')[0]
          }
          
          const gruaObraData = {
            obra_id: data.id,
            grua_id: value.grua_id,
            valor_locacao_mensal: value.grua_mensalidade || 0,
            data_inicio_locacao: formatDate(value.data_inicio),
            status: 'Ativa',
            tipo_base: value.dados_montagem_equipamento?.tipo_base || null,
            altura_inicial: (() => {
              const val = value.dados_montagem_equipamento?.altura_inicial
              if (val === null || val === undefined || val === '') return null
              const parsed = typeof val === 'string' ? parseFloat(val) : Number(val)
              return Number.isNaN(parsed) ? null : parsed
            })(),
            altura_final: (() => {
              const val = value.dados_montagem_equipamento?.altura_final
              if (val === null || val === undefined || val === '') return null
              const parsed = typeof val === 'string' ? parseFloat(val) : Number(val)
              return Number.isNaN(parsed) ? null : parsed
            })(),
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
            console.error('❌ Código do erro:', gruaObraError.code)
            console.error('❌ Mensagem do erro:', gruaObraError.message)
            console.error('❌ Detalhes completos:', gruaObraError.details)
            
            // Se o erro for de foreign key ou constraint, informar
            if (gruaObraError.code === '23503' || gruaObraError.message?.includes('foreign key')) {
              console.error('⚠️ ATENÇÃO: Erro de foreign key. Verifique se a grua_id está correto.')
            }
          } else {
            console.log('✅ Registro inserido na tabela grua_obra:', gruaObraResult)
            
            // Atualizar status da grua para 'em_obra'
            const { error: updateGruaError } = await supabaseAdmin
              .from('gruas')
              .update({
                status: 'em_obra',
                current_obra_id: data.id,
                current_obra_name: data.nome,
                updated_at: new Date().toISOString()
              })
              .eq('id', value.grua_id)
            
            if (updateGruaError) {
              console.error('❌ Erro ao atualizar status da grua:', updateGruaError)
            } else {
              console.log('✅ Status da grua atualizado para "em_obra"')
            }
          }
        }
        
      } catch (gruaError) {
        console.error('❌ Erro ao processar dados da grua:', gruaError)
        console.error('❌ Stack trace:', gruaError.stack)
        // Não falhar a criação da obra por causa da grua
      }
    } else {
      console.log('⚠️ AVISO: Nenhuma grua foi processada!')
      console.log('  - value.gruas:', value.gruas)
      console.log('  - value.grua_id:', value.grua_id)
      console.log('  - Array gruas é válido?', value.gruas && Array.isArray(value.gruas) && value.gruas.length > 0)
      console.log('  - grua_id existe?', !!value.grua_id)
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
          const cargoFuncionario = funcionario.role && String(funcionario.role).trim()
            ? String(funcionario.role).trim()
            : 'não informado'
          const funcionarioObraData = {
            funcionario_id: parseInt(funcionario.userId),
            obra_id: data.id,
            data_inicio: value.data_inicio || new Date().toISOString().split('T')[0],
            status: 'ativo',
            horas_trabalhadas: 0,
            is_supervisor: false, // Removido: sistema não utiliza mais supervisor
            observacoes: `Funcionário ${funcionario.name} (${cargoFuncionario}) alocado na obra`
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

    // Buscar dados completos da obra incluindo relacionamentos
    console.log('🔍 Buscando dados completos da obra criada...')
    const { data: obraCompleta, error: obraCompletaError } = await supabaseAdmin
      .from('obras')
      .select(`
        *,
        clientes (*),
        grua_obra (
          *,
          grua (*)
        ),
        funcionarios_obras (
          *,
          funcionarios (*)
        ),
        sinaleiros_obra (*),
        responsaveis_tecnicos (*)
      `)
      .eq('id', data.id)
      .single()

    if (obraCompletaError) {
      console.error('⚠️ Erro ao buscar obra completa:', obraCompletaError)
      // Retornar dados básicos mesmo se houver erro ao buscar dados completos
    } else {
      console.log('✅ Obra completa encontrada com', obraCompleta.grua_obra?.length || 0, 'grua(s) vinculada(s)')
      data = obraCompleta
    }

    // Enviar notificações WhatsApp para cliente e gestores (não bloquear criação se falhar)
    try {
      const { enviarMensagemNovaObra } = await import('../services/whatsapp-service.js');
      await enviarMensagemNovaObra(data).catch(whatsappError => {
        console.error('❌ Erro ao enviar mensagens WhatsApp (não bloqueia criação):', whatsappError);
      });
    } catch (importError) {
      console.error('❌ Erro ao importar serviço WhatsApp (não bloqueia criação):', importError);
    }

    // ============================================
    // ✅ LOG FINAL - OBRA CRIADA COM SUCESSO
    // ============================================
    if (!obraCompletaError && obraCompleta) {
      console.log('\n✅ OBRA CRIADA COM SUCESSO - DADOS COMPLETOS:')
      console.log('📋 DADOS FINAIS SALVOS NO BANCO:')
      console.log(JSON.stringify(obraCompleta, null, 2))
      console.log('\n📊 RESUMO FINAL DA OBRA CRIADA:')
      console.log('  - ID:', obraCompleta.id)
      console.log('  - Nome:', obraCompleta.nome)
      console.log('  - Cliente:', obraCompleta.clientes?.nome || 'N/A')
      console.log('  - Status:', obraCompleta.status)
      console.log('  - Tipo:', obraCompleta.tipo)
      console.log('  - CNO:', obraCompleta.cno || 'N/A')
      console.log('  - ART:', obraCompleta.art_numero || 'N/A')
      console.log('  - Apólice:', obraCompleta.apolice_numero || 'N/A')
      console.log('  - Responsável:', obraCompleta.responsavel_nome || 'N/A')
      console.log('  - Gruas vinculadas:', obraCompleta.grua_obra?.length || 0)
      console.log('  - Funcionários vinculados:', obraCompleta.funcionarios_obras?.length || 0)
      console.log('  - Sinaleiros:', obraCompleta.sinaleiros_obra?.length || 0)
      console.log('  - Responsáveis técnicos:', obraCompleta.responsaveis_tecnicos?.length || 0)
      if (errosGruas.length > 0) {
        console.log('  ⚠️ Avisos:', `${errosGruas.length} grua(s) não puderam ser vinculada(s)`)
      }
      console.log('═══════════════════════════════════════════════════════════\n')
    } else {
      console.log('\n✅ OBRA CRIADA COM SUCESSO (dados básicos):')
      console.log('📋 DADOS SALVOS NO BANCO:')
      console.log(JSON.stringify(data, null, 2))
      console.log('\n📊 RESUMO DA OBRA CRIADA:')
      console.log('  - ID:', data.id)
      console.log('  - Nome:', data.nome)
      console.log('  - Cliente ID:', data.cliente_id)
      console.log('  - Status:', data.status)
      console.log('  - Tipo:', data.tipo)
      console.log('  - CNO:', data.cno || 'N/A')
      console.log('  - ART:', data.art_numero || 'N/A')
      console.log('  - Apólice:', data.apolice_numero || 'N/A')
      console.log('  - Responsável:', data.responsavel_nome || 'N/A')
      if (errosGruas.length > 0) {
        console.log('  ⚠️ Avisos:', `${errosGruas.length} grua(s) não puderam ser vinculada(s)`)
      }
      console.log('═══════════════════════════════════════════════════════════\n')
    }

    res.status(201).json({
      success: true,
      data: obraCompleta || data,
      message: 'Obra criada com sucesso',
      warnings: errosGruas.length > 0 ? {
        message: `${errosGruas.length} grua(s) não puderam ser vinculada(s)`,
        erros: errosGruas
      } : undefined
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
router.put('/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params

    // ============================================
    // 📋 LOG COMPLETO - ATUALIZAÇÃO DE OBRA (PUT)
    // ============================================
    console.log('\n═══════════════════════════════════════════════════════════')
    console.log('🔄 PUT /api/obras/:id - ATUALIZAÇÃO DE OBRA')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('📅 Timestamp:', new Date().toISOString())
    console.log('👤 Usuário:', req.user?.id || 'N/A')
    console.log('🆔 Obra ID:', id)
    console.log('\n📥 DADOS RECEBIDOS (req.body):')
    console.log(JSON.stringify(req.body, null, 2))
    
    // Log estruturado por seção
    console.log('\n📊 RESUMO DOS DADOS RECEBIDOS PARA ATUALIZAÇÃO:')
    console.log('  📝 Dados Básicos:')
    console.log('    - Nome:', req.body.nome || 'N/A')
    console.log('    - Cliente ID:', req.body.cliente_id || 'N/A')
    console.log('    - Tipo:', req.body.tipo || 'N/A')
    console.log('    - Status:', req.body.status || 'N/A')
    console.log('    - Endereço:', req.body.endereco || 'N/A')
    console.log('    - Cidade:', req.body.cidade || 'N/A')
    console.log('    - Estado:', req.body.estado || 'N/A')
    console.log('    - CEP:', req.body.cep || 'N/A')
    console.log('  📄 Documentos:')
    console.log('    - CNO:', req.body.cno || 'N/A')
    console.log('    - CNO Arquivo:', req.body.cno_arquivo || 'N/A')
    console.log('    - ART Número:', req.body.art_numero || 'N/A')
    console.log('    - ART Arquivo:', req.body.art_arquivo || 'N/A')
    console.log('    - Apólice Número:', req.body.apolice_numero || 'N/A')
    console.log('    - Apólice Arquivo:', req.body.apolice_arquivo || 'N/A')
    console.log('  👥 Funcionários:')
    console.log('    - Quantidade:', Array.isArray(req.body.funcionarios) ? req.body.funcionarios.length : 'N/A')
    if (Array.isArray(req.body.funcionarios) && req.body.funcionarios.length > 0) {
      req.body.funcionarios.forEach((func, idx) => {
        console.log(`      [${idx + 1}] ${func.name || func.nome || 'N/A'} (${func.role || func.cargo || 'N/A'})`)
      })
    }
    console.log('  👨‍💼 Responsável:')
    console.log('    - Responsável ID:', req.body.responsavel_id || 'N/A')
    console.log('    - Responsável Nome:', req.body.responsavel_nome || 'N/A')
    console.log('═══════════════════════════════════════════════════════════\n')

    const { error, value } = obraUpdateSchema.validate(req.body)
    if (error) {
      console.error('❌ Erro de validação:', error.details)
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { data: obraAtualExistente, error: obraAtualError } = await supabaseAdmin
      .from('obras')
      .select('id, endereco, endereco_rua, endereco_numero, endereco_bairro, endereco_complemento, cidade, estado, cep, latitude, longitude')
      .eq('id', id)
      .single()

    if (obraAtualError || !obraAtualExistente) {
      return res.status(404).json({
        error: 'Obra não encontrada',
        message: 'A obra com o ID especificado não existe'
      })
    }

    const algumCampoEnderecoDetalhadoAtualizado = ['endereco_rua', 'endereco_numero', 'endereco_bairro', 'endereco_complemento']
      .some((campo) => value[campo] !== undefined)

    const enderecoDetalhadoMesclado = {
      endereco_rua: value.endereco_rua !== undefined ? value.endereco_rua : obraAtualExistente.endereco_rua,
      endereco_numero: value.endereco_numero !== undefined ? value.endereco_numero : obraAtualExistente.endereco_numero,
      endereco_bairro: value.endereco_bairro !== undefined ? value.endereco_bairro : obraAtualExistente.endereco_bairro,
      endereco_complemento: value.endereco_complemento !== undefined ? value.endereco_complemento : obraAtualExistente.endereco_complemento
    }

    const enderecoCompostoDetalhado = montarEnderecoCompleto({
      endereco_rua: enderecoDetalhadoMesclado.endereco_rua,
      endereco_numero: enderecoDetalhadoMesclado.endereco_numero,
      endereco_bairro: enderecoDetalhadoMesclado.endereco_bairro,
      endereco_complemento: enderecoDetalhadoMesclado.endereco_complemento
    })

    const enderecoAtualizado = value.endereco !== undefined
      ? value.endereco
      : (algumCampoEnderecoDetalhadoAtualizado ? (enderecoCompostoDetalhado || obraAtualExistente.endereco) : undefined)

    const enderecoParaGeocoding = enderecoAtualizado ?? obraAtualExistente.endereco
    const cidadeParaGeocoding = value.cidade ?? obraAtualExistente.cidade
    const estadoParaGeocoding = value.estado ?? obraAtualExistente.estado
    const cepParaGeocoding = value.cep ?? obraAtualExistente.cep
    const latitudeAtual = value.latitude !== undefined ? value.latitude : obraAtualExistente.latitude
    const longitudeAtual = value.longitude !== undefined ? value.longitude : obraAtualExistente.longitude

    const coordenadasResolvidas = await resolverCoordenadasDaObra({
      endereco: enderecoParaGeocoding,
      cidade: cidadeParaGeocoding,
      estado: estadoParaGeocoding,
      cep: cepParaGeocoding,
      latitude: latitudeAtual,
      longitude: longitudeAtual
    })

    if (coordenadasResolvidas.geocodingAplicado) {
      console.log('📍 Coordenadas geradas automaticamente na atualização da obra:', coordenadasResolvidas.geocodingInfo)
    }

    // Preparar dados da obra (incluindo todos os campos da tabela)
    const updateData = {
      nome: value.nome,
      cliente_id: value.cliente_id,
      endereco: enderecoAtualizado,
      endereco_rua: value.endereco_rua !== undefined ? value.endereco_rua : undefined,
      endereco_numero: value.endereco_numero !== undefined ? value.endereco_numero : undefined,
      endereco_bairro: value.endereco_bairro !== undefined ? value.endereco_bairro : undefined,
      endereco_complemento: value.endereco_complemento !== undefined ? value.endereco_complemento : undefined,
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
      canteiro: value.canteiro,
      data_inicio: value.data_inicio,
      data_fim: value.data_fim,
      orcamento: value.orcamento,
      observacoes: value.observacoes,
      responsavel_id: value.responsavel_id,
      responsavel_nome: value.responsavel_nome,
      // Campos de geolocalização
      latitude: coordenadasResolvidas.latitude ?? undefined,
      longitude: coordenadasResolvidas.longitude ?? undefined,
      raio_permitido: value.raio_permitido !== undefined ? value.raio_permitido : undefined,
      // Campos obrigatórios (CNO, ART, Apólice)
      cno: value.cno !== undefined ? value.cno : undefined,
      cno_arquivo: value.cno_arquivo !== undefined ? value.cno_arquivo : undefined,
      art_numero: value.art_numero !== undefined ? value.art_numero : undefined,
      art_arquivo: value.art_arquivo !== undefined ? value.art_arquivo : undefined,
      apolice_numero: value.apolice_numero !== undefined ? value.apolice_numero : undefined,
      apolice_arquivo: value.apolice_arquivo !== undefined ? value.apolice_arquivo : undefined,
      updated_at: new Date().toISOString()
    }
    
    // Remover campos undefined para não sobrescrever valores existentes
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    console.log('\n📤 DADOS QUE SERÃO ATUALIZADOS NO BANCO:')
    console.log(JSON.stringify(updateData, null, 2))

    const { data, error: updateError } = await supabaseAdmin
      .from('obras')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erro ao atualizar obra:', updateError)
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

    console.log('\n✅ OBRA ATUALIZADA COM SUCESSO:')
    console.log('📋 DADOS SALVOS NO BANCO:')
    console.log(JSON.stringify(data, null, 2))
    console.log('\n📊 RESUMO DA OBRA ATUALIZADA:')
    console.log('  - ID:', data.id)
    console.log('  - Nome:', data.nome)
    console.log('  - Cliente ID:', data.cliente_id)
    console.log('  - Status:', data.status)
    console.log('  - Tipo:', data.tipo)
    console.log('  - CNO:', data.cno || 'N/A')
    console.log('  - ART:', data.art_numero || 'N/A')
    console.log('  - Apólice:', data.apolice_numero || 'N/A')
    console.log('═══════════════════════════════════════════════════════════\n')

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
          const cargoFuncionario = funcionario.role && String(funcionario.role).trim()
            ? String(funcionario.role).trim()
            : 'não informado'
          const funcionarioObraData = {
            funcionario_id: parseInt(funcionario.userId),
            obra_id: parseInt(id),
            data_inicio: value.data_inicio || new Date().toISOString().split('T')[0],
            status: 'ativo',
            horas_trabalhadas: 0,
            is_supervisor: false, // Removido: sistema não utiliza mais supervisor
            observacoes: `Funcionário ${funcionario.name} (${cargoFuncionario}) alocado na obra`
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
            
            // Atualizar obra_atual_id do funcionário quando vinculado a uma obra ativa
            if (funcionarioObraData.status === 'ativo') {
              const { error: updateError } = await supabaseAdmin
                .from('funcionarios')
                .update({ obra_atual_id: parseInt(id) })
                .eq('id', parseInt(funcionario.userId))

              if (updateError) {
                console.error('❌ Erro ao atualizar obra_atual_id:', updateError)
              } else {
                console.log('✅ obra_atual_id atualizado para funcionário:', funcionario.userId)
              }
            }
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
          status: 'Ativa',
          tipo_base: value.dados_montagem_equipamento?.tipo_base || null,
          altura_inicial: (() => {
            const val = value.dados_montagem_equipamento?.altura_inicial
            if (val === null || val === undefined || val === '') return null
            const parsed = typeof val === 'string' ? parseFloat(val) : Number(val)
            return Number.isNaN(parsed) ? null : parsed
          })(),
          altura_final: (() => {
            const val = value.dados_montagem_equipamento?.altura_final
            if (val === null || val === undefined || val === '') return null
            const parsed = typeof val === 'string' ? parseFloat(val) : Number(val)
            return Number.isNaN(parsed) ? null : parsed
          })()
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

    // Buscar dados completos da obra atualizada para log final
    const { data: obraAtualizadaCompleta, error: obraCompletaError } = await supabaseAdmin
      .from('obras')
      .select(`
        *,
        clientes (*),
        grua_obra (
          *,
          grua (*)
        ),
        funcionarios_obras (
          *,
          funcionarios (*)
        ),
        sinaleiros_obra (*),
        responsaveis_tecnicos (*)
      `)
      .eq('id', id)
      .single()

    if (!obraCompletaError && obraAtualizadaCompleta) {
      console.log('\n✅ OBRA ATUALIZADA COM SUCESSO - DADOS COMPLETOS:')
      console.log('📋 DADOS FINAIS SALVOS NO BANCO:')
      console.log(JSON.stringify(obraAtualizadaCompleta, null, 2))
      console.log('\n📊 RESUMO FINAL DA OBRA ATUALIZADA:')
      console.log('  - ID:', obraAtualizadaCompleta.id)
      console.log('  - Nome:', obraAtualizadaCompleta.nome)
      console.log('  - Cliente:', obraAtualizadaCompleta.clientes?.nome || 'N/A')
      console.log('  - Status:', obraAtualizadaCompleta.status)
      console.log('  - Tipo:', obraAtualizadaCompleta.tipo)
      console.log('  - CNO:', obraAtualizadaCompleta.cno || 'N/A')
      console.log('  - ART:', obraAtualizadaCompleta.art_numero || 'N/A')
      console.log('  - Apólice:', obraAtualizadaCompleta.apolice_numero || 'N/A')
      console.log('  - Responsável:', obraAtualizadaCompleta.responsavel_nome || 'N/A')
      console.log('  - Gruas vinculadas:', obraAtualizadaCompleta.grua_obra?.length || 0)
      console.log('  - Funcionários vinculados:', obraAtualizadaCompleta.funcionarios_obras?.length || 0)
      console.log('  - Sinaleiros:', obraAtualizadaCompleta.sinaleiros_obra?.length || 0)
      console.log('  - Responsáveis técnicos:', obraAtualizadaCompleta.responsaveis_tecnicos?.length || 0)
      console.log('═══════════════════════════════════════════════════════════\n')
    }

    res.json({
      success: true,
      data: obraAtualizadaCompleta || data,
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
/**
 * @swagger
 * /api/obras/{id}/notificar-envolvidos:
 *   post:
 *     summary: Notificar envolvidos da obra via WhatsApp
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
 *         description: Notificações enviadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 enviados:
 *                   type: number
 *                 erros:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: Obra não encontrada
 *       500:
 *         description: Erro ao enviar notificações
 */
router.post('/:id/notificar-envolvidos', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;
    const obraId = parseInt(id);

    if (isNaN(obraId)) {
      return res.status(400).json({
        success: false,
        error: 'ID da obra inválido'
      });
    }

    // Buscar dados completos da obra
    const { data: obra, error: obraError } = await supabaseAdmin
      .from('obras')
      .select('*')
      .eq('id', obraId)
      .single();

    if (obraError || !obra) {
      console.error('[obras] Erro ao buscar obra:', obraError);
      return res.status(404).json({
        success: false,
        error: 'Obra não encontrada'
      });
    }

    // Enviar notificações WhatsApp usando a função existente
    try {
      const { enviarMensagemNovaObra } = await import('../services/whatsapp-service.js');
      const resultado = await enviarMensagemNovaObra(obra);

      if (resultado.sucesso) {
        return res.json({
          success: true,
          enviados: resultado.enviados,
          erros: resultado.erros || [],
          message: `Notificações enviadas: ${resultado.enviados} enviada(s), ${resultado.erros?.length || 0} erro(s)`
        });
      } else {
        return res.status(500).json({
          success: false,
          enviados: resultado.enviados || 0,
          erros: resultado.erros || [],
          error: 'Erro ao enviar notificações',
          message: resultado.erros?.join(', ') || 'Erro desconhecido'
        });
      }
    } catch (whatsappError) {
      console.error('[obras] Erro ao enviar notificações WhatsApp:', whatsappError);
      return res.status(500).json({
        success: false,
        enviados: 0,
        erros: [whatsappError.message || 'Erro ao enviar notificações'],
        error: 'Erro ao enviar notificações WhatsApp'
      });
    }
  } catch (error) {
    console.error('[obras] Erro ao processar notificação de envolvidos:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/obras/{id}/finalizar:
 *   post:
 *     summary: Finalizar obra e liberar gruas
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
 *         description: Obra finalizada com sucesso
 *       404:
 *         description: Obra não encontrada
 *       500:
 *         description: Erro ao finalizar obra
 */
router.post('/:id/finalizar', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const obraId = parseInt(id)

    if (isNaN(obraId)) {
      return res.status(400).json({
        success: false,
        error: 'ID da obra inválido'
      })
    }

    // Verificar se a obra existe
    const { data: obra, error: obraError } = await supabaseAdmin
      .from('obras')
      .select('id, nome, status')
      .eq('id', obraId)
      .single()

    if (obraError || !obra) {
      return res.status(404).json({
        success: false,
        error: 'Obra não encontrada'
      })
    }

    // Verificar se a obra já está finalizada
    if (obra.status === 'Concluída') {
      return res.status(400).json({
        success: false,
        error: 'A obra já está finalizada'
      })
    }

    // Buscar todas as gruas vinculadas à obra com status "Ativa" ou "Pausada"
    const { data: gruasObra, error: gruasError } = await supabaseAdmin
      .from('grua_obra')
      .select('id, grua_id, status')
      .eq('obra_id', obraId)
      .in('status', ['Ativa', 'Pausada'])

    if (gruasError) {
      console.error('Erro ao buscar gruas da obra:', gruasError)
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar gruas da obra',
        message: gruasError.message
      })
    }

    const gruasIds = gruasObra?.map(go => go.grua_id) || []

    // Atualizar relacionamentos grua_obra para "Concluída" (tanto "Ativa" quanto "Pausada")
    if (gruasObra && gruasObra.length > 0) {
      const { error: updateRelacionamentosError } = await supabaseAdmin
        .from('grua_obra')
        .update({
          status: 'Concluída',
          data_fim_locacao: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('obra_id', obraId)
        .in('status', ['Ativa', 'Pausada'])

      if (updateRelacionamentosError) {
        console.error('Erro ao atualizar relacionamentos grua_obra:', updateRelacionamentosError)
        return res.status(500).json({
          success: false,
          error: 'Erro ao atualizar relacionamentos',
          message: updateRelacionamentosError.message
        })
      }

      // Atualizar status das gruas para "disponivel" e limpar campos de obra atual
      if (gruasIds.length > 0) {
        const { error: updateGruasError } = await supabaseAdmin
          .from('gruas')
          .update({
            status: 'disponivel',
            current_obra_id: null,
            current_obra_name: null,
            updated_at: new Date().toISOString()
          })
          .in('id', gruasIds)

        if (updateGruasError) {
          console.error('Erro ao atualizar status das gruas:', updateGruasError)
          // Não falhar a operação, apenas logar o erro
        }
      }
    }

    // Atualizar status da obra para "Concluída"
    const { data: obraAtualizada, error: updateObraError } = await supabaseAdmin
      .from('obras')
      .update({
        status: 'Concluída',
        data_fim: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', obraId)
      .select()
      .single()

    if (updateObraError) {
      console.error('Erro ao atualizar status da obra:', updateObraError)
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar status da obra',
        message: updateObraError.message
      })
    }

    res.json({
      success: true,
      data: obraAtualizada,
      message: `Obra finalizada com sucesso. ${gruasIds.length} grua(s) liberada(s).`
    })
  } catch (error) {
    console.error('Erro ao finalizar obra:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

router.delete('/:id', authenticateToken, requirePermission('obras:excluir'), async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se há orçamentos vinculados à obra
    const { data: orcamentos, error: orcamentosError } = await supabaseAdmin
      .from('orcamentos')
      .select('id, numero, status')
      .eq('obra_id', id)

    if (orcamentosError) {
      console.error('Erro ao verificar orçamentos:', orcamentosError)
    }

    // Buscar gruas relacionadas para limpar vínculo e status antes de excluir a obra
    const { data: relacoesGruaObra, error: relacoesError } = await supabaseAdmin
      .from('grua_obra')
      .select('id, grua_id, status')
      .eq('obra_id', id)

    if (relacoesError) {
      console.error('Erro ao buscar relacionamentos grua_obra da obra:', relacoesError)
    }

    const idsGruasRelacionadas = Array.from(new Set((relacoesGruaObra || []).map((r) => r.grua_id).filter(Boolean)))

    // Encerrar relacionamentos ativos para evitar "vínculo fantasma"
    if ((relacoesGruaObra || []).length > 0) {
      const hoje = new Date().toISOString().split('T')[0]
      const { error: encerrarRelacoesError } = await supabaseAdmin
        .from('grua_obra')
        .update({
          status: 'Concluída',
          data_fim_locacao: hoje,
          updated_at: new Date().toISOString()
        })
        .eq('obra_id', id)
        .in('status', ['Ativa', 'Pausada'])

      if (encerrarRelacoesError) {
        console.error('Erro ao encerrar relacionamentos grua_obra:', encerrarRelacoesError)
      }
    }

    // Limpar configuração auxiliar da obra para não deixar pendências
    const { error: removeConfigError } = await supabaseAdmin
      .from('obra_gruas_configuracao')
      .delete()
      .eq('obra_id', id)

    if (removeConfigError) {
      console.error('Erro ao remover obra_gruas_configuracao da obra:', removeConfigError)
    }

    // Liberar gruas que ainda apontam para esta obra como obra atual
    if (idsGruasRelacionadas.length > 0) {
      const { error: liberarGruasError } = await supabaseAdmin
        .from('gruas')
        .update({
          status: 'disponivel',
          current_obra_id: null,
          current_obra_name: null,
          updated_at: new Date().toISOString()
        })
        .in('id', idsGruasRelacionadas)
        .eq('current_obra_id', id)

      if (liberarGruasError) {
        console.error('Erro ao liberar gruas vinculadas à obra excluída:', liberarGruasError)
      }
    }

    // Se houver orçamentos vinculados, desvincular antes de excluir
    if (orcamentos && orcamentos.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('orcamentos')
        .update({ obra_id: null })
        .eq('obra_id', id)

      if (updateError) {
        console.error('Erro ao desvincular orçamentos:', updateError)
        return res.status(500).json({
          error: 'Erro ao excluir obra',
          message: `Não foi possível desvincular ${orcamentos.length} orçamento(s) vinculado(s). Erro: ${updateError.message}`
        })
      }
    }

    // Excluir obra
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
      message: orcamentos && orcamentos.length > 0
        ? `Obra excluída com sucesso. ${orcamentos.length} orçamento(s) foram desvinculados.`
        : 'Obra excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// ==================== RESPONSÁVEL TÉCNICO ====================

/**
 * POST /api/obras/:id/responsavel-tecnico
 * Criar ou atualizar responsável técnico da obra
 */
router.post('/:id/responsavel-tecnico', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { nome, cpf_cnpj, crea, crea_empresa, email, telefone, funcionario_id, tipo } = req.body

    // Validar dados
    const schema = Joi.object({
      funcionario_id: Joi.number().integer().positive().optional(),
      nome: Joi.string().min(2).when('funcionario_id', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
      cpf_cnpj: Joi.string().when('funcionario_id', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.optional() }),
      crea: Joi.string().allow(null, '').optional(),
      crea_empresa: Joi.string().allow(null, '').optional(),
      email: Joi.string().email().allow(null, '').optional(),
      telefone: Joi.string().allow(null, '').optional(),
      tipo: Joi.string().valid('obra', 'irbana_equipamentos', 'irbana_manutencoes', 'irbana_montagem_operacao', 'adicional').default('obra')
    })

    const { error: validationError } = schema.validate({ nome, cpf_cnpj, crea, crea_empresa, email, telefone, funcionario_id, tipo })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const tipoFinal = tipo || 'obra'

    // Se vier funcionario_id, atualiza diretamente os campos na tabela obras (apenas para tipo 'obra')
    if (funcionario_id && tipoFinal === 'obra') {
      const { data: func, error: errFunc } = await supabaseAdmin
        .from('funcionarios')
        .select('id, nome')
        .eq('id', funcionario_id)
        .single()

      if (errFunc) throw errFunc
      if (!func) return res.status(400).json({ error: 'Funcionário não encontrado' })

      const { data: obraAtualizada, error: errUpdateObra } = await supabaseAdmin
        .from('obras')
        .update({ responsavel_id: func.id, responsavel_nome: func.nome })
        .eq('id', id)
        .select('id, responsavel_id, responsavel_nome')
        .single()

      if (errUpdateObra) throw errUpdateObra

      return res.json({ success: true, data: obraAtualizada })
    }

    // Fluxo sem funcionario_id ou para tipos IRBANA: usar tabela responsaveis_tecnicos
    // Buscar responsável existente do mesmo tipo
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('responsaveis_tecnicos')
      .select('id')
      .eq('obra_id', id)
      .eq('tipo', tipoFinal)
      .maybeSingle()

    let result
    if (existing) {
      // Atualizar existente
      const updateData = { nome }
      if (cpf_cnpj) updateData.cpf_cnpj = cpf_cnpj
      if (crea !== undefined) updateData.crea = crea || null
      if (crea_empresa !== undefined) updateData.crea_empresa = crea_empresa || null
      if (email !== undefined) updateData.email = email || null
      if (telefone !== undefined) updateData.telefone = telefone || null

      const { data, error } = await supabaseAdmin
        .from('responsaveis_tecnicos')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Criar novo
      const insertData = {
        obra_id: id,
        nome,
        cpf_cnpj: cpf_cnpj || '',
        crea: crea || null,
        crea_empresa: crea_empresa || null,
        email: email || null,
        telefone: telefone || null,
        tipo: tipoFinal
      }

      const { data, error } = await supabaseAdmin
        .from('responsaveis_tecnicos')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      result = data
    }

    // Atualizar também a obra com o nome do responsável informado manualmente (apenas para tipo 'obra')
    if (tipoFinal === 'obra') {
      const { error: errUpdateObraManual } = await supabaseAdmin
        .from('obras')
        .update({ responsavel_id: null, responsavel_nome: nome })
        .eq('id', id)

      if (errUpdateObraManual) throw errUpdateObraManual
    }

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Erro ao salvar responsável técnico:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * POST /api/obras/:id/responsaveis-tecnicos/lote
 * Criar ou atualizar responsáveis técnicos em lote (incluindo tipos IRBANA e adicionais)
 */
router.post('/:id/responsaveis-tecnicos/lote', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params

    const schema = Joi.object({
      responsaveis: Joi.array().min(1).items(
        Joi.object({
          funcionario_id: Joi.number().integer().positive().optional(),
          nome: Joi.string().min(2).when('funcionario_id', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
          cpf_cnpj: Joi.string().allow(null, '').optional(),
          crea: Joi.string().allow(null, '').optional(),
          crea_empresa: Joi.string().allow(null, '').optional(),
          email: Joi.string().email().allow(null, '').optional(),
          telefone: Joi.string().allow(null, '').optional(),
          tipo: Joi.string().valid('obra', 'irbana_equipamentos', 'irbana_manutencoes', 'irbana_montagem_operacao', 'adicional').default('obra')
        })
      ).required()
    })

    const { error: validationError, value } = schema.validate(req.body, { stripUnknown: true })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const resultados = []

    // Processamento sequencial evita corrida em tipos repetidos (ex: múltiplos "adicional")
    for (const responsavel of value.responsaveis) {
      const { nome, cpf_cnpj, crea, crea_empresa, email, telefone, funcionario_id } = responsavel
      const tipoFinal = responsavel.tipo || 'obra'

      // Compatibilidade com regra atual: tipo "obra" pode vir por funcionário
      if (funcionario_id && tipoFinal === 'obra') {
        const { data: func, error: errFunc } = await supabaseAdmin
          .from('funcionarios')
          .select('id, nome')
          .eq('id', funcionario_id)
          .single()

        if (errFunc) throw errFunc
        if (!func) {
          return res.status(400).json({ error: `Funcionário não encontrado (id=${funcionario_id})` })
        }

        const { data: obraAtualizada, error: errUpdateObra } = await supabaseAdmin
          .from('obras')
          .update({ responsavel_id: func.id, responsavel_nome: func.nome })
          .eq('id', id)
          .select('id, responsavel_id, responsavel_nome')
          .single()

        if (errUpdateObra) throw errUpdateObra

        resultados.push({
          tipo: tipoFinal,
          funcionario_id,
          data: obraAtualizada
        })

        continue
      }

      const { data: existing, error: checkError } = await supabaseAdmin
        .from('responsaveis_tecnicos')
        .select('id')
        .eq('obra_id', id)
        .eq('tipo', tipoFinal)
        .maybeSingle()

      if (checkError) throw checkError

      let result
      if (existing) {
        const updateData = { nome }
        if (cpf_cnpj !== undefined) updateData.cpf_cnpj = cpf_cnpj || ''
        if (crea !== undefined) updateData.crea = crea || null
        if (crea_empresa !== undefined) updateData.crea_empresa = crea_empresa || null
        if (email !== undefined) updateData.email = email || null
        if (telefone !== undefined) updateData.telefone = telefone || null

        const { data, error } = await supabaseAdmin
          .from('responsaveis_tecnicos')
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        const insertData = {
          obra_id: id,
          nome,
          cpf_cnpj: cpf_cnpj || '',
          crea: crea || null,
          crea_empresa: crea_empresa || null,
          email: email || null,
          telefone: telefone || null,
          tipo: tipoFinal
        }

        const { data, error } = await supabaseAdmin
          .from('responsaveis_tecnicos')
          .insert(insertData)
          .select()
          .single()

        if (error) throw error
        result = data
      }

      if (tipoFinal === 'obra') {
        const { error: errUpdateObraManual } = await supabaseAdmin
          .from('obras')
          .update({ responsavel_id: null, responsavel_nome: nome })
          .eq('id', id)

        if (errUpdateObraManual) throw errUpdateObraManual
      }

      resultados.push({
        tipo: tipoFinal,
        data: result
      })
    }

    res.json({
      success: true,
      data: resultados
    })
  } catch (error) {
    console.error('Erro ao salvar responsáveis técnicos em lote:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/obras/:id/responsavel-tecnico
 * Obter responsável técnico da obra
 */
router.get('/:id/responsavel-tecnico', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { tipo } = req.query // Permite filtrar por tipo

    let query = supabaseAdmin
      .from('responsaveis_tecnicos')
      .select('*')
      .eq('obra_id', id)

    // Se especificar tipo, filtrar por tipo. Caso contrário, retornar o primeiro (compatibilidade)
    if (tipo) {
      query = query.eq('tipo', tipo).maybeSingle()
    } else {
      // Por padrão, retornar o responsável da obra (tipo 'obra') para compatibilidade
      query = query.eq('tipo', 'obra').maybeSingle()
    }

    const { data, error } = await query

    if (error && error.code !== 'PGRST116') throw error

    res.json({ success: true, data: data || null })
  } catch (error) {
    console.error('Erro ao obter responsável técnico:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/obras/:id/responsaveis-tecnicos
 * Obter todos os responsáveis técnicos da obra (incluindo IRBANA)
 */
router.get('/:id/responsaveis-tecnicos', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('responsaveis_tecnicos')
      .select('*')
      .eq('obra_id', id)
      .order('tipo', { ascending: true })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao obter responsáveis técnicos:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * PUT /api/obras/:id/documentos
 * Atualiza parcialmente campos de documentos da obra (CNO, ART, Apólice)
 */
router.put('/:id/documentos', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { cno, cno_arquivo, art_numero, art_arquivo, apolice_numero, apolice_arquivo } = req.body

    // Todos opcionais; valida apenas formato básico
    const schema = Joi.object({
      cno: Joi.string().allow('', null).optional(),
      cno_arquivo: Joi.string().allow('', null).optional(),
      art_numero: Joi.string().allow('', null).optional(),
      art_arquivo: Joi.string().allow('', null).optional(),
      apolice_numero: Joi.string().allow('', null).optional(),
      apolice_arquivo: Joi.string().allow('', null).optional()
    })

    const { error: validationError } = schema.validate({ cno, cno_arquivo, art_numero, art_arquivo, apolice_numero, apolice_arquivo })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    // Monta update apenas com os campos presentes
    const updateData = {}
    if (cno !== undefined) updateData.cno = cno
    if (cno_arquivo !== undefined) updateData.cno_arquivo = cno_arquivo
    if (art_numero !== undefined) updateData.art_numero = art_numero
    if (art_arquivo !== undefined) updateData.art_arquivo = art_arquivo
    if (apolice_numero !== undefined) updateData.apolice_numero = apolice_numero
    if (apolice_arquivo !== undefined) updateData.apolice_arquivo = apolice_arquivo

    if (Object.keys(updateData).length === 0) {
      return res.json({ success: true, data: null })
    }

    const { data, error } = await supabaseAdmin
      .from('obras')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error

    return res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao atualizar documentos da obra:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

// ==================== SINALEIROS ====================

/**
 * POST /api/obras/:id/sinaleiros
 * Criar ou atualizar sinaleiros da obra
 */
router.post('/:id/sinaleiros', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    console.log('═══════════════════════════════════════════════════════════')
    console.log('🚦 API: POST /api/obras/:id/sinaleiros - ATRELAR SINALEIROS À OBRA')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('📥 Dados recebidos:')
    console.log('   - Params:', req.params)
    console.log('   - Body:', JSON.stringify(req.body, null, 2))
    console.log('   - Headers:', {
      authorization: req.headers.authorization ? 'Presente' : 'Ausente',
      'content-type': req.headers['content-type']
    })
    
    const { id } = req.params
    const { sinaleiros } = req.body

    console.log('🔍 Validando ID da obra...')
    // Validar ID da obra
    const obraId = parseInt(id)
    console.log('   - ID recebido:', id)
    console.log('   - ID convertido:', obraId)
    console.log('   - É válido?', !isNaN(obraId) && obraId > 0)
    
    if (isNaN(obraId) || obraId <= 0) {
      console.error('❌ ID de obra inválido:', id)
      return res.status(400).json({ 
        error: 'ID de obra inválido',
        message: 'O ID da obra deve ser um número inteiro positivo'
      })
    }

    // Verificar se a obra existe
    console.log('🔍 Verificando se a obra existe...')
    const { data: obra, error: obraError } = await supabaseAdmin
      .from('obras')
      .select('id')
      .eq('id', obraId)
      .single()

    if (obraError || !obra) {
      console.error('❌ Obra não encontrada:', obraError)
      return res.status(404).json({ 
        error: 'Obra não encontrada',
        message: 'A obra especificada não existe no banco de dados'
      })
    }
    
    console.log('✅ Obra encontrada:', obra.id)

    const schema = Joi.object({
      sinaleiros: Joi.array().items(
        Joi.object({
          id: Joi.string().uuid().allow(null, '').optional(),
          nome: Joi.string().min(2).max(255).trim().required(),
          // rg_cpf pode ser RG (7-9 dígitos) ou CPF (11 dígitos), com ou sem formatação
          // Aceita: "1234567", "12.345.678-9", "123.456.789-01", "12345678901", etc.
          rg_cpf: Joi.string()
            .min(7) // Mínimo para RG (7 dígitos)
            .max(20) // Máximo com formatação
            .trim()
            .required()
            .custom((value, helpers) => {
              // Remover formatação para contar apenas dígitos
              const apenasDigitos = value.replace(/\D/g, '')
              
              // Validar se tem pelo menos 7 dígitos (RG mínimo) e no máximo 11 (CPF máximo)
              if (apenasDigitos.length < 7) {
                return helpers.error('any.custom', { 
                  message: `O documento deve ter pelo menos 7 dígitos (RG) ou 11 dígitos (CPF). Valor recebido: "${value}" (${apenasDigitos.length} dígitos)`
                })
              }
              
              // Se tem mais de 11 dígitos, pode ser CNPJ (não esperado para sinaleiro)
              if (apenasDigitos.length > 11) {
                return helpers.error('any.custom', { 
                  message: `O documento não pode ter mais de 11 dígitos (CPF). Valor recebido: "${value}" (${apenasDigitos.length} dígitos)`
                })
              }
              
              return value
            }),
          telefone: Joi.string().pattern(/^[\d\s\(\)\-\+]+$/).allow(null, '').empty('').optional(),
          email: Joi.string().email().max(255).trim().allow(null, '').empty('').optional(),
          tipo: Joi.string().valid('principal', 'reserva').required()
        })
      ).min(0).max(2).required()
    }).options({ stripUnknown: true, abortEarly: false })

    console.log('🔍 Validando dados dos sinaleiros...')
    console.log('   - Quantidade recebida:', sinaleiros?.length || 0)
    console.log('   - Dados recebidos:', JSON.stringify(sinaleiros, null, 2))
    
    // Verificar se sinaleiros é um array válido
    if (!Array.isArray(sinaleiros)) {
      console.error('❌ sinaleiros não é um array:', typeof sinaleiros)
      return res.status(400).json({ 
        error: 'Dados inválidos',
        message: 'O campo "sinaleiros" deve ser um array'
      })
    }
    
    const { error: validationError, value: validatedData } = schema.validate({ sinaleiros }, { 
      abortEarly: false,
      stripUnknown: true 
    })
    
    if (validationError) {
      console.error('❌ Erro de validação:')
      console.error('   - Mensagens:', validationError.details.map(d => d.message))
      console.error('   - Detalhes completos:', JSON.stringify(validationError.details, null, 2))
      return res.status(400).json({ 
        error: 'Dados inválidos',
        message: validationError.details.map(d => d.message).join('; '),
        details: validationError.details
      })
    }
    
    console.log('✅ Dados validados com sucesso')
    console.log('   - Dados validados:', JSON.stringify(validatedData, null, 2))

    // Usar dados validados e sanitizados
    const sinaleirosValidados = validatedData.sinaleiros

    // Validar documentos completos para sinaleiros externos (reserva) antes de vincular
    // IMPORTANTE: Apenas validar se o sinaleiro já existe (tem ID) e é do tipo reserva
    // Sinaleiros novos (sem ID) serão criados e podem ter documentos adicionados depois
    for (const sinaleiroData of sinaleirosValidados) {
      if (sinaleiroData.tipo === 'reserva' && sinaleiroData.id) {
        console.log(`🔍 Validando documentos do sinaleiro existente (ID: ${sinaleiroData.id})`)
        
        // Verificar se o sinaleiro já existe e tem documentos completos
        const { data: documentos, error: documentosError } = await supabaseAdmin
          .from('documentos_sinaleiro')
          .select('tipo, status')
          .eq('sinaleiro_id', sinaleiroData.id)

        if (documentosError) {
          console.error('❌ Erro ao buscar documentos do sinaleiro:', documentosError)
          // Continuar mesmo se houver erro na busca de documentos
        } else if (documentos && documentos.length > 0) {
          const documentosObrigatorios = ['rg_frente', 'rg_verso', 'comprovante_vinculo']
          const documentosEncontrados = documentos.map(d => d.tipo)
          const documentosFaltando = documentosObrigatorios.filter(tipo => !documentosEncontrados.includes(tipo))
          
          // Verificar se todos os documentos obrigatórios estão aprovados
          const documentosAprovados = documentos.filter(d => 
            documentosObrigatorios.includes(d.tipo) && d.status === 'aprovado'
          )

          if (documentosFaltando.length > 0 || documentosAprovados.length < documentosObrigatorios.length) {
            const nomesDocumentos = {
              'rg_frente': 'RG (Frente)',
              'rg_verso': 'RG (Verso)',
              'comprovante_vinculo': 'Comprovante de Vínculo'
            }
            const nomesFaltando = documentosFaltando.map(tipo => nomesDocumentos[tipo] || tipo).join(', ')
            
            console.warn(`⚠️ Sinaleiro "${sinaleiroData.nome}" não pode ser vinculado - documentos incompletos: ${nomesFaltando}`)
            
            return res.status(400).json({ 
              error: 'Documentos incompletos',
              message: `O sinaleiro "${sinaleiroData.nome}" não pode ser vinculado à obra. Documentos faltando ou não aprovados: ${nomesFaltando || 'Documentos não aprovados'}. Complete o cadastro pelo RH antes de vincular à obra.`,
              documentosFaltando
            })
          }
        } else {
          console.log(`ℹ️ Sinaleiro "${sinaleiroData.nome}" não possui documentos cadastrados ainda - permitindo criação`)
        }
      } else if (sinaleiroData.tipo === 'reserva' && !sinaleiroData.id) {
        console.log(`ℹ️ Criando novo sinaleiro reserva "${sinaleiroData.nome}" - documentos podem ser adicionados depois`)
      }
    }

    // Verificar se já existem sinaleiros para esta obra
    console.log(`🔍 Verificando sinaleiros existentes para obra ID: ${obraId}`)
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('sinaleiros_obra')
      .select('id, tipo, nome, rg_cpf')
      .eq('obra_id', obraId)

    if (existingError) {
      console.error('❌ Erro ao verificar sinaleiros existentes:', existingError)
      throw existingError
    }
    
    console.log(`📋 Sinaleiros existentes encontrados: ${existing?.length || 0}`)

    // Criar mapas para verificação de duplicatas:
    // 1. Por tipo (para atualização quando ID é fornecido)
    const existingByType = new Map(existing?.map(s => [s.tipo, s]) || [])
    // 2. Por nome + rg_cpf (para evitar duplicatas reais)
    const existingByNomeRgCpf = new Map(
      existing?.map(s => [`${s.nome}_${s.rg_cpf}`, s]) || []
    )

    console.log('🔄 Processando sinaleiros para salvar/atualizar...')
    const results = []
    for (let i = 0; i < sinaleirosValidados.length; i++) {
      const sinaleiro = sinaleirosValidados[i]
      console.log(`\n📋 Processando sinaleiro ${i + 1}/${sinaleirosValidados.length}:`, {
        id: sinaleiro.id,
        nome: sinaleiro.nome,
        tipo: sinaleiro.tipo,
        rg_cpf: sinaleiro.rg_cpf
      })
      
      const { id: sinaleiroId, ...data } = sinaleiro
      const chaveNomeRgCpf = `${data.nome}_${data.rg_cpf}`

      // Verificar se já existe um sinaleiro com mesmo nome e rg_cpf
      const sinaleiroExistente = existingByNomeRgCpf.get(chaveNomeRgCpf)
      
      if (sinaleiroExistente) {
        // Se já existe, atualizar ao invés de criar duplicata
        console.log(`🔄 Sinaleiro já existe (${data.nome}), atualizando...`)
        const { data: updated, error } = await supabaseAdmin
          .from('sinaleiros_obra')
          .update(data)
          .eq('id', sinaleiroExistente.id)
          .eq('obra_id', obraId)
          .select()
          .single()

        if (error) {
          console.error(`❌ Erro ao atualizar sinaleiro ${data.nome}:`, error)
          throw error
        }
        console.log(`✅ Sinaleiro ${data.nome} atualizado com sucesso`)
        results.push(updated)
      } else if (sinaleiroId && existingByType.has(sinaleiro.tipo)) {
        // Atualizar existente por tipo (quando ID é fornecido)
        const existentePorTipo = existingByType.get(sinaleiro.tipo)
        console.log(`🔄 Atualizando sinaleiro existente por tipo (${sinaleiro.tipo})...`)
        const { data: updated, error } = await supabaseAdmin
          .from('sinaleiros_obra')
          .update(data)
          .eq('id', existentePorTipo.id)
          .eq('obra_id', obraId)
          .select()
          .single()

        if (error) {
          console.error(`❌ Erro ao atualizar sinaleiro por tipo:`, error)
          throw error
        }
        console.log(`✅ Sinaleiro atualizado por tipo com sucesso`)
        results.push(updated)
      } else {
        // Criar novo - garantir que obra_id está sendo passado corretamente
        const dadosInsert = { obra_id: obraId, ...data }
        console.log(`📤 Criando novo sinaleiro para obra ${obraId}:`, dadosInsert)
        
        const { data: created, error } = await supabaseAdmin
          .from('sinaleiros_obra')
          .insert(dadosInsert)
          .select()
          .single()

        if (error) {
          console.error('❌ Erro ao criar sinaleiro:', error)
          console.error('❌ Dados do sinaleiro:', dadosInsert)
          console.error('❌ Obra ID (tipo):', typeof obraId, obraId)
          throw error
        }
        console.log(`✅ Sinaleiro ${data.nome} criado com sucesso:`, created)
        results.push(created)
      }
    }

    console.log('═══════════════════════════════════════════════════════════')
    console.log(`✅ PROCESSAMENTO CONCLUÍDO: ${results.length} sinaleiro(s) processado(s)`)
    console.log('═══════════════════════════════════════════════════════════')
    
    res.json({ success: true, data: results })
  } catch (error) {
    console.error('Erro ao salvar sinaleiros:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/obras/:id/sinaleiros
 * Listar sinaleiros da obra
 */
router.get('/:id/sinaleiros', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    
    // Validar ID da obra
    const obraId = parseInt(id)
    if (isNaN(obraId) || obraId <= 0) {
      return res.status(400).json({ 
        error: 'ID de obra inválido',
        message: 'O ID da obra deve ser um número inteiro positivo'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('sinaleiros_obra')
      .select('*')
      .eq('obra_id', obraId)
      .order('tipo', { ascending: true })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar sinaleiros:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

// ==================== DOCUMENTOS SINALEIRO ====================

/**
 * POST /api/obras/sinaleiros/:id/documentos
 * Upload de documento do sinaleiro
 */
router.post('/sinaleiros/:id/documentos', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { tipo, arquivo, data_validade } = req.body

    // Validar se o ID é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ 
        error: 'ID inválido', 
        message: 'O sinaleiro precisa ser salvo no banco antes de adicionar documentos. O ID fornecido não é um UUID válido.' 
      })
    }

    // Verificar se o sinaleiro existe e obter o tipo
    const { data: sinaleiro, error: sinaleiroError } = await supabaseAdmin
      .from('sinaleiros_obra')
      .select('id, tipo')
      .eq('id', id)
      .single()

    if (sinaleiroError || !sinaleiro) {
      return res.status(404).json({ 
        error: 'Sinaleiro não encontrado', 
        message: 'O sinaleiro especificado não existe no banco de dados.' 
      })
    }

    // Bloquear documentos para sinaleiros internos (tipo='principal')
    if (sinaleiro.tipo === 'principal') {
      return res.status(400).json({ 
        error: 'Documentos não permitidos', 
        message: 'Sinaleiros internos não precisam de documentos. Eles já possuem documentos cadastrados como funcionários.' 
      })
    }

    const schema = Joi.object({
      tipo: Joi.string().min(1).max(100).trim().required(),
      arquivo: Joi.string().uri().max(500).required(),
      data_validade: Joi.date().allow(null).optional()
    })

    const { error: validationError, value: validatedData } = schema.validate({ tipo, arquivo, data_validade })
    if (validationError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        message: validationError.details[0].message,
        details: validationError.details
      })
    }

    // Usar dados validados
    const { tipo: tipoValidado, arquivo: arquivoValidado, data_validade: dataValidadeValidada } = validatedData

    const { data, error } = await supabaseAdmin
      .from('documentos_sinaleiro')
      .insert({ sinaleiro_id: id, tipo: tipoValidado, arquivo: arquivoValidado, data_validade: dataValidadeValidada })
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao criar documento do sinaleiro:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/obras/sinaleiros/:id/documentos
 * Listar documentos do sinaleiro
 */
router.get('/sinaleiros/:id/documentos', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('documentos_sinaleiro')
      .select('*')
      .eq('sinaleiro_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar documentos do sinaleiro:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/obras/sinaleiros/:id/validar-documentos
 * Validar se sinaleiro tem documentos obrigatórios completos
 */
router.get('/sinaleiros/:id/validar-documentos', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se o sinaleiro existe e obter o tipo
    const { data: sinaleiro, error: sinaleiroError } = await supabaseAdmin
      .from('sinaleiros_obra')
      .select('id, tipo')
      .eq('id', id)
      .single()

    if (sinaleiroError || !sinaleiro) {
      return res.status(404).json({ 
        success: false,
        completo: false,
        error: 'Sinaleiro não encontrado'
      })
    }

    // Sinaleiros internos (principal) não precisam de documentos
    if (sinaleiro.tipo === 'principal') {
      return res.json({ 
        success: true,
        completo: true,
        message: 'Sinaleiros internos não precisam de documentos'
      })
    }

    // Documentos obrigatórios para sinaleiros externos (reserva)
    const documentosObrigatorios = ['rg_frente', 'rg_verso', 'comprovante_vinculo']

    // Buscar documentos do sinaleiro
    const { data: documentos, error: documentosError } = await supabaseAdmin
      .from('documentos_sinaleiro')
      .select('tipo, status')
      .eq('sinaleiro_id', id)

    if (documentosError) throw documentosError

    // Verificar quais documentos estão faltando
    const documentosEncontrados = documentos?.map(d => d.tipo) || []
    const documentosFaltando = documentosObrigatorios.filter(tipo => !documentosEncontrados.includes(tipo))

    // Verificar se todos os documentos obrigatórios estão aprovados
    const documentosAprovados = documentos?.filter(d => 
      documentosObrigatorios.includes(d.tipo) && d.status === 'aprovado'
    ) || []

    const completo = documentosFaltando.length === 0 && documentosAprovados.length === documentosObrigatorios.length

    res.json({ 
      success: true,
      completo,
      documentosFaltando: completo ? [] : documentosFaltando,
      documentosAprovados: documentosAprovados.length,
      documentosObrigatorios: documentosObrigatorios.length
    })
  } catch (error) {
    console.error('Erro ao validar documentos do sinaleiro:', error)
    res.status(500).json({ 
      success: false,
      completo: false,
      error: 'Erro interno do servidor', 
      message: error.message 
    })
  }
})

/**
 * PUT /api/obras/documentos-sinaleiro/:id/aprovar
 * Aprovar documento do sinaleiro
 */
router.put('/documentos-sinaleiro/:id/aprovar', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { status, comentarios } = req.body
    const userId = req.user.id

    const schema = Joi.object({
      status: Joi.string().valid('aprovado', 'rejeitado').required(),
      comentarios: Joi.string().max(1000).trim().allow(null, '').optional()
    })

    const { error: validationError, value: validatedData } = schema.validate({ status, comentarios })
    if (validationError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        message: validationError.details[0].message,
        details: validationError.details
      })
    }

    // Usar dados validados
    const { status: statusValidado, comentarios: comentariosValidados } = validatedData

    const updateData = {
      status: statusValidado,
      aprovado_por: userId,
      aprovado_em: new Date().toISOString()
    }

    // Adicionar comentários se fornecidos
    if (comentariosValidados) {
      updateData.observacoes = comentariosValidados
    }

    const { data, error } = await supabaseAdmin
      .from('documentos_sinaleiro')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao aprovar documento:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

// ==================== ALERTAS ====================

/**
 * GET /api/obras/alertas/fim-proximo
 * Listar obras com fim em até 60 dias
 */
router.get('/alertas/fim-proximo', authenticateToken, async (req, res) => {
  try {
    const hoje = new Date()
    const limite = new Date()
    limite.setDate(hoje.getDate() + 60)

    const { data, error } = await supabaseAdmin
      .from('obras')
      .select('id, nome, data_fim, cliente_id, clientes(nome)')
      .not('data_fim', 'is', null)
      .gte('data_fim', hoje.toISOString().split('T')[0])
      .lte('data_fim', limite.toISOString().split('T')[0])
      .order('data_fim', { ascending: true })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar obras com fim próximo:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * POST /api/obras/:id/supervisores
 * REMOVIDO: Sistema não utiliza mais supervisores terceirizados
 */
// Rota removida - sistema não utiliza mais supervisores

router.post('/:id/supervisores', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  return res.status(410).json({
    success: false,
    error: 'Funcionalidade removida',
    message: 'O sistema não utiliza mais supervisores terceirizados. Esta funcionalidade foi removida.'
  })
})

/* CÓDIGO REMOVIDO - SUPERVISORES TERCEIRIZADOS
const supervisorTerceirizadoSchema = Joi.object({
  supervisor_id: Joi.number().integer().optional(),
  nome: Joi.string().min(2).optional(),
  email: Joi.string().email().optional(),
  telefone: Joi.string().allow('', null).optional(),
  observacoes: Joi.string().allow('', null).optional(),
  data_inicio: Joi.date().optional()
}).or('supervisor_id', 'nome', 'email')

router.post('/:id/supervisores', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { error, value } = supervisorTerceirizadoSchema.validate(req.body)

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        message: error.details[0].message
      })
    }

    // Verificar se obra existe
    const { data: obra, error: obraError } = await supabaseAdmin
      .from('obras')
      .select('id, nome')
      .eq('id', id)
      .single()

    if (obraError || !obra) {
      return res.status(404).json({
        success: false,
        error: 'Obra não encontrada',
        message: 'A obra especificada não existe'
      })
    }

    // Se supervisor_id foi fornecido, apenas vincular o supervisor existente à obra
    if (value.supervisor_id) {
      // Verificar se o supervisor existe e é realmente um supervisor
      const { data: supervisor, error: supervisorError } = await supabaseAdmin
        .from('funcionarios')
        .select('id, nome, email, telefone, cargo, status')
        .eq('id', value.supervisor_id)
        .eq('cargo', 'Supervisor')
        .single()

      if (supervisorError || !supervisor) {
        return res.status(404).json({
          success: false,
          error: 'Supervisor não encontrado',
          message: 'O supervisor especificado não existe ou não é um supervisor válido'
        })
      }

      // Verificar se já está vinculado a esta obra
      const { data: jaVinculado } = await supabaseAdmin
        .from('funcionarios_obras')
        .select('id')
        .eq('funcionario_id', value.supervisor_id)
        .eq('obra_id', id)
        .eq('status', 'ativo')
        .maybeSingle()

      if (jaVinculado) {
        return res.status(409).json({
          success: false,
          error: 'Supervisor já vinculado',
          message: 'Este supervisor já está vinculado a esta obra'
        })
      }

      // Vincular supervisor à obra
      const { data: funcionarioObra, error: vincularError } = await supabaseAdmin
        .from('funcionarios_obras')
        .insert({
          funcionario_id: value.supervisor_id,
          obra_id: parseInt(id),
          data_inicio: value.data_inicio || new Date().toISOString().split('T')[0],
          status: 'ativo',
          horas_trabalhadas: 0,
          is_supervisor: true,
          observacoes: value.observacoes || `Supervisor ${supervisor.nome} vinculado à obra`
        })
        .select(`
          *,
          funcionarios(id, nome, email, telefone, cargo)
        `)
        .single()

      if (vincularError) {
        console.error('Erro ao vincular supervisor:', vincularError)
        return res.status(500).json({
          success: false,
          error: 'Erro ao vincular supervisor',
          message: vincularError.message
        })
      }

      return res.json({
        success: true,
        data: {
          funcionario_obra: funcionarioObra,
          funcionario: funcionarioObra.funcionarios,
          obra: obra
        },
        message: 'Supervisor vinculado à obra com sucesso'
      })
    }

    // Se não forneceu supervisor_id, criar novo supervisor (comportamento antigo)
    // Validar que nome e email foram fornecidos
    if (!value.nome || !value.email) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        message: 'Nome e email são obrigatórios quando não fornece supervisor_id'
      })
    }

    // Verificar se email já existe na tabela usuarios
    const { data: usuarioExistente, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, funcionario_id')
      .eq('email', value.email)
      .maybeSingle()

    // Se existe na tabela, verificar se está vinculado a alguma obra ativa como supervisor
    if (usuarioExistente) {
      if (usuarioExistente.funcionario_id) {
        const { data: vinculacoesAtivas } = await supabaseAdmin
          .from('funcionarios_obras')
          .select('id, obra_id, is_supervisor, status')
          .eq('funcionario_id', usuarioExistente.funcionario_id)
          .eq('is_supervisor', true)
          .eq('status', 'ativo')
          .limit(1)

        if (vinculacoesAtivas && vinculacoesAtivas.length > 0) {
          return res.status(409).json({
            success: false,
            error: 'Email já cadastrado',
            message: 'Já existe um supervisor cadastrado com este email vinculado a uma obra ativa'
          })
        }
        
        // Se existe mas não está vinculado como supervisor ativo, permitir reutilização
        // Remover registros antigos para permitir criar novo
        console.log(`⚠️ Email ${value.email} existe mas não está vinculado como supervisor ativo. Limpando registros antigos...`)
        
        // Remover vinculações antigas (se houver)
        await supabaseAdmin
          .from('funcionarios_obras')
          .delete()
          .eq('funcionario_id', usuarioExistente.funcionario_id)
          .eq('is_supervisor', true)
        
        // Remover funcionário antigo
        await supabaseAdmin
          .from('funcionarios')
          .delete()
          .eq('id', usuarioExistente.funcionario_id)
      }
      
      // Remover usuário da tabela (seja com ou sem funcionario_id)
      await supabaseAdmin
        .from('usuarios')
        .delete()
        .eq('id', usuarioExistente.id)
      
      console.log(`✅ Registros antigos removidos para permitir reutilização do email`)
    }

    // Verificar se email já existe no Supabase Auth (pode existir mesmo se não estiver na tabela usuarios)
    const { data: authUsers, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers()
    if (!listUsersError && authUsers && authUsers.users) {
      const userExists = authUsers.users.find(u => u.email?.toLowerCase() === value.email.toLowerCase())
      if (userExists) {
        // Se existe no Auth mas não na tabela (ou foi removido acima), deletar do Auth para permitir reutilização
        console.log(`⚠️ Email ${value.email} existe no Auth. Removendo do Auth para permitir reutilização...`)
        await supabaseAdmin.auth.admin.deleteUser(userExists.id)
        console.log(`✅ Usuário removido do Auth: ${userExists.id}`)
      }
    }

    // Gerar senha temporária
    const senhaTemporaria = generateSecurePassword()

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: value.email,
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: {
        nome: value.nome,
        tipo: 'supervisor_terceirizado'
      }
    })

    if (authError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar usuário no sistema de autenticação',
        message: authError.message
      })
    }

    // 2. Criar usuário na tabela usuarios
    const usuarioData = {
      nome: value.nome,
      email: value.email,
      telefone: value.telefone || null,
      status: 'Ativo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: novoUsuario, error: novoUsuarioError } = await supabaseAdmin
      .from('usuarios')
      .insert(usuarioData)
      .select()
      .single()

    if (novoUsuarioError) {
      // Se falhou ao criar na tabela, remover do Auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar usuário',
        message: novoUsuarioError.message
      })
    }

    // 3. Criar funcionário vinculado ao usuário (necessário para funcionarios_obras)
    const { data: novoFuncionario, error: funcionarioError } = await supabaseAdmin
      .from('funcionarios')
      .insert({
        nome: value.nome,
        email: value.email,
        telefone: value.telefone || null,
        cpf: null, // Supervisor terceirizado pode não ter CPF
        status: 'Ativo',
        cargo: 'Supervisor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (funcionarioError) {
      // Se falhou ao criar funcionário, remover usuário e auth
      await supabaseAdmin.from('usuarios').delete().eq('id', novoUsuario.id)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar funcionário',
        message: funcionarioError.message
      })
    }

    // 4. Atualizar usuário com funcionario_id
    await supabaseAdmin
      .from('usuarios')
      .update({ funcionario_id: novoFuncionario.id })
      .eq('id', novoUsuario.id)

    // 5. Atribuir perfil de Cliente ao usuário (supervisor terceirizado é como cliente)
    const { error: perfilError } = await supabaseAdmin
      .from('usuario_perfis')
      .insert({
        usuario_id: novoUsuario.id,
        perfil_id: 6, // ID do perfil "Cliente"
        status: 'Ativa',
        data_atribuicao: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (perfilError) {
      console.error('Erro ao atribuir perfil ao usuário:', perfilError)
      // Não falhar a criação por causa disso
    }

    // 6. Vincular funcionário à obra como supervisor
    const funcionarioObraData = {
      funcionario_id: novoFuncionario.id,
      obra_id: parseInt(id),
      data_inicio: value.data_inicio || new Date().toISOString().split('T')[0],
      status: 'ativo',
      horas_trabalhadas: 0,
      is_supervisor: true,
      observacoes: value.observacoes || `Supervisor terceirizado ${value.nome} vinculado à obra ${obra.nome}`
    }

    const { data: funcionarioObra, error: funcionarioObraError } = await supabaseAdmin
      .from('funcionarios_obras')
      .insert(funcionarioObraData)
      .select()
      .single()

    if (funcionarioObraError) {
      // Se falhou ao vincular, remover funcionário, usuário e auth
      await supabaseAdmin.from('funcionarios').delete().eq('id', novoFuncionario.id)
      await supabaseAdmin.from('usuarios').delete().eq('id', novoUsuario.id)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      return res.status(500).json({
        success: false,
        error: 'Erro ao vincular supervisor à obra',
        message: funcionarioObraError.message
      })
    }

    // 7. Enviar email com credenciais (de forma assíncrona, não bloqueia a resposta)
    sendWelcomeEmail({
      nome: value.nome,
      email: value.email,
      senha_temporaria: senhaTemporaria
    }).then(() => {
      console.log(`✅ Email de boas-vindas enviado para supervisor terceirizado: ${value.email}`)
    }).catch((emailError) => {
      console.error('❌ Erro ao enviar email de boas-vindas:', emailError)
      // Não falhar a criação se o email falhar
    })

    res.status(201).json({
      success: true,
      data: {
        funcionario_obra: funcionarioObra,
        usuario: novoUsuario,
        funcionario: novoFuncionario
      },
      message: 'Supervisor terceirizado adicionado com sucesso. Email com credenciais será enviado em breve.'
    })
  } catch (error) {
    console.error('Erro ao adicionar supervisor terceirizado:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})
*/

/**
 * PUT /api/obras/:obra_id/supervisores/:id
 * REMOVIDO: Sistema não utiliza mais supervisores terceirizados
 */
router.put('/:obra_id/supervisores/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  return res.status(410).json({
    success: false,
    error: 'Funcionalidade removida',
    message: 'O sistema não utiliza mais supervisores terceirizados. Esta funcionalidade foi removida.'
  })
})

/* CÓDIGO REMOVIDO - ATUALIZAR SUPERVISOR
const atualizarSupervisorSchema = Joi.object({
  nome: Joi.string().min(2).optional(),
  email: Joi.string().email().optional(),
  telefone: Joi.string().allow('', null).optional(),
  observacoes: Joi.string().allow('', null).optional(),
  data_inicio: Joi.date().optional(),
  data_fim: Joi.date().allow(null).optional(),
  reenviar_senha: Joi.boolean().optional()
})

router.put('/:obra_id/supervisores/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { obra_id, id } = req.params
    const { error, value } = atualizarSupervisorSchema.validate(req.body)

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        message: error.details[0].message
      })
    }

    // Buscar funcionario_obra
    const { data: funcionarioObra, error: funcionarioObraError } = await supabaseAdmin
      .from('funcionarios_obras')
      .select('*, funcionarios(id, nome, email, telefone), obras(id, nome)')
      .eq('id', id)
      .eq('obra_id', obra_id)
      .eq('is_supervisor', true)
      .single()

    if (funcionarioObraError || !funcionarioObra) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor não encontrado',
        message: 'O supervisor especificado não existe ou não está vinculado a esta obra'
      })
    }

    const funcionario = funcionarioObra.funcionarios
    if (!funcionario) {
      return res.status(404).json({
        success: false,
        error: 'Funcionário não encontrado'
      })
    }

    // Buscar usuário vinculado
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('id, email')
      .eq('email', funcionario.email)
      .maybeSingle()

    // Atualizar funcionario_obra
    const funcionarioObraUpdate = {}
    if (value.data_inicio !== undefined) funcionarioObraUpdate.data_inicio = value.data_inicio
    if (value.data_fim !== undefined) funcionarioObraUpdate.data_fim = value.data_fim
    if (value.observacoes !== undefined) funcionarioObraUpdate.observacoes = value.observacoes

    if (Object.keys(funcionarioObraUpdate).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('funcionarios_obras')
        .update(funcionarioObraUpdate)
        .eq('id', id)

      if (updateError) throw updateError
    }

    // Atualizar funcionário
    const funcionarioUpdate = {}
    if (value.nome) funcionarioUpdate.nome = value.nome
    if (value.email) funcionarioUpdate.email = value.email
    if (value.telefone !== undefined) funcionarioUpdate.telefone = value.telefone || null

    if (Object.keys(funcionarioUpdate).length > 0) {
      const { error: funcionarioUpdateError } = await supabaseAdmin
        .from('funcionarios')
        .update(funcionarioUpdate)
        .eq('id', funcionario.id)

      if (funcionarioUpdateError) throw funcionarioUpdateError
    }

    // Atualizar usuário
    if (usuario) {
      const usuarioUpdate = {}
      if (value.nome) usuarioUpdate.nome = value.nome
      if (value.email) usuarioUpdate.email = value.email
      if (value.telefone !== undefined) usuarioUpdate.telefone = value.telefone || null

      if (Object.keys(usuarioUpdate).length > 0) {
        await supabaseAdmin
          .from('usuarios')
          .update(usuarioUpdate)
          .eq('id', usuario.id)
      }

      // Atualizar email no Auth se mudou
      if (value.email && value.email !== funcionario.email) {
        // Buscar usuário no Auth
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
        const authUser = users.find(u => u.email === funcionario.email)
        
        if (authUser) {
          await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
            email: value.email
          })
        }
      }

      // Reenviar senha se solicitado
      if (value.reenviar_senha) {
        const senhaTemporaria = generateSecurePassword()
        
        // Buscar usuário no Auth
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
        const emailParaBuscar = value.email || funcionario.email
        const authUser = users.find(u => u.email === emailParaBuscar)
        
        if (authUser) {
          // Atualizar senha no Auth
          await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
            password: senhaTemporaria
          })

          // Enviar email com nova senha (assíncrono)
          sendWelcomeEmail({
            nome: value.nome || funcionario.nome,
            email: emailParaBuscar,
            senha_temporaria: senhaTemporaria
          }).then(() => {
            console.log(`✅ Email com nova senha enviado para: ${emailParaBuscar}`)
          }).catch((emailError) => {
            console.error('❌ Erro ao enviar email:', emailError)
          })
        }
      }
    }

    // Buscar dados atualizados
    const { data: funcionarioObraAtualizado } = await supabaseAdmin
      .from('funcionarios_obras')
      .select(`
        *,
        funcionarios(id, nome, cargo, email, telefone),
        obras(id, nome)
      `)
      .eq('id', id)
      .single()

    res.json({
      success: true,
      data: {
        funcionario_obra: funcionarioObraAtualizado,
        funcionario: funcionarioObraAtualizado?.funcionarios,
        usuario: usuario
      },
      message: value.reenviar_senha 
        ? 'Supervisor atualizado com sucesso. Nova senha será enviada por email em breve.'
        : 'Supervisor atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar supervisor:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})
*/

/**
 * GET /api/obras/supervisores
 * REMOVIDO: Sistema não utiliza mais supervisores terceirizados
 */
router.get('/supervisores', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  return res.status(410).json({
    success: false,
    error: 'Funcionalidade removida',
    message: 'O sistema não utiliza mais supervisores terceirizados. Esta funcionalidade foi removida.',
    data: []
  })
})

/* CÓDIGO REMOVIDO - LISTAR SUPERVISORES
router.get('/supervisores', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { search } = req.query

    // Buscar funcionários que são supervisores terceirizados
    // Supervisores terceirizados são funcionários com cargo 'Supervisor' que têm is_supervisor=true em funcionarios_obras
    let query = supabaseAdmin
      .from('funcionarios')
      .select(`
        id,
        nome,
        email,
        telefone,
        cargo,
        status,
        funcionarios_obras!inner(
          id,
          obra_id,
          is_supervisor,
          status,
          obras(id, nome)
        )
      `)
      .eq('cargo', 'Supervisor')
      .eq('status', 'Ativo')
      .eq('funcionarios_obras.is_supervisor', true)

    // Se houver busca, filtrar por nome ou email
    if (search) {
      query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: funcionarios, error } = await query

    if (error) {
      console.error('Erro ao buscar supervisores:', error)
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar supervisores',
        message: error.message
      })
    }

    // Agrupar por funcionário e incluir obras vinculadas
    const supervisoresMap = new Map()
    
    funcionarios?.forEach((func) => {
      if (!supervisoresMap.has(func.id)) {
        supervisoresMap.set(func.id, {
          id: func.id,
          nome: func.nome,
          email: func.email,
          telefone: func.telefone,
          cargo: func.cargo,
          status: func.status,
          obras: []
        })
      }
      
      // Adicionar obra à lista de obras do supervisor
      if (func.funcionarios_obras && Array.isArray(func.funcionarios_obras)) {
        func.funcionarios_obras.forEach((fo) => {
          if (fo.obras && !supervisoresMap.get(func.id).obras.find((o) => o.id === fo.obras.id)) {
            supervisoresMap.get(func.id).obras.push(fo.obras)
          }
        })
      } else if (func.funcionarios_obras?.obras) {
        const obra = func.funcionarios_obras.obras
        if (!supervisoresMap.get(func.id).obras.find((o) => o.id === obra.id)) {
          supervisoresMap.get(func.id).obras.push(obra)
        }
      }
    })

    const supervisores = Array.from(supervisoresMap.values())

    res.json({
      success: true,
      data: supervisores
    })
  } catch (error) {
    console.error('Erro ao listar supervisores:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})
*/

/**
 * GET /api/obras/:obra_id/supervisores/:id
 * REMOVIDO: Sistema não utiliza mais supervisores terceirizados
 */
router.get('/:obra_id/supervisores/:id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  return res.status(410).json({
    success: false,
    error: 'Funcionalidade removida',
    message: 'O sistema não utiliza mais supervisores terceirizados. Esta funcionalidade foi removida.'
  })
})

/* CÓDIGO REMOVIDO - OBTER SUPERVISOR
router.get('/:obra_id/supervisores/:id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { obra_id, id } = req.params

    // Buscar funcionario_obra com relacionamentos
    const { data: funcionarioObra, error: funcionarioObraError } = await supabaseAdmin
      .from('funcionarios_obras')
      .select(`
        *,
        funcionarios(
          id,
          nome,
          cargo,
          email,
          telefone,
          cpf,
          status
        ),
        obras(
          id,
          nome
        )
      `)
      .eq('id', id)
      .eq('obra_id', obra_id)
      .eq('is_supervisor', true)
      .single()

    if (funcionarioObraError) {
      if (funcionarioObraError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Supervisor não encontrado',
          message: 'O supervisor especificado não existe ou não está vinculado a esta obra'
        })
      }
      throw funcionarioObraError
    }

    // Buscar usuário vinculado
    let usuario = null
    if (funcionarioObra.funcionarios) {
      const { data: usuarioData } = await supabaseAdmin
        .from('usuarios')
        .select('id, nome, email, telefone, status')
        .eq('email', funcionarioObra.funcionarios.email)
        .maybeSingle()
      
      usuario = usuarioData
    }

    res.json({
      success: true,
      data: {
        funcionario_obra: funcionarioObra,
        funcionario: funcionarioObra.funcionarios,
        usuario: usuario,
        obra: funcionarioObra.obras
      }
    })
  } catch (error) {
    console.error('Erro ao buscar supervisor:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})
*/

// ==========================================
// RESPONSÁVEIS DE OBRA
// ==========================================

const responsavelObraSchema = Joi.object({
  nome: Joi.string().min(2).required(),
  usuario: Joi.string().allow('', null).optional(),
  email: Joi.string().email().allow('', null).optional(),
  telefone: Joi.string().allow('', null).optional(),
  ativo: Joi.boolean().optional()
})

/**
 * GET /api/obras/:id/responsaveis-obra
 * Listar responsáveis de uma obra
 */
router.get('/:id/responsaveis-obra', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('responsaveis_obra')
      .select('*')
      .eq('obra_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao buscar responsáveis de obra:', error)
      return res.status(500).json({ success: false, error: 'Erro ao buscar responsáveis de obra', message: error.message })
    }

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar responsáveis de obra:', error)
    res.status(500).json({ success: false, error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * POST /api/obras/:id/responsaveis-obra
 * Adicionar responsável a uma obra, criar usuário no sistema e enviar email com credenciais
 */
router.post('/:id/responsaveis-obra', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { error: validationError, value } = responsavelObraSchema.validate(req.body, { stripUnknown: true })

    if (validationError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', message: validationError.details[0].message })
    }

    // Verificar se a obra existe
    const { data: obra, error: obraError } = await supabaseAdmin
      .from('obras')
      .select('id, nome')
      .eq('id', id)
      .single()

    if (obraError || !obra) {
      return res.status(404).json({ success: false, error: 'Obra não encontrada' })
    }

    // Salvar na tabela responsaveis_obra
    const { data, error } = await supabaseAdmin
      .from('responsaveis_obra')
      .insert({
        obra_id: parseInt(id),
        nome: value.nome,
        usuario: value.usuario || null,
        email: value.email || null,
        telefone: value.telefone || null,
        ativo: value.ativo !== undefined ? value.ativo : true
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar responsável de obra:', error)
      return res.status(500).json({ success: false, error: 'Erro ao criar responsável de obra', message: error.message })
    }

    // Se o responsável tem email, criar conta de acesso e enviar credenciais
    let usuarioCriado = null
    let emailEnviado = false

    if (value.email) {
      try {
        // Verificar se já existe usuário com esse email
        const { data: usuarioExistente } = await supabaseAdmin
          .from('usuarios')
          .select('id, email')
          .eq('email', value.email.toLowerCase())
          .maybeSingle()

        if (usuarioExistente) {
          console.log(`ℹ️ Usuário com email ${value.email} já existe no sistema. Pulando criação de conta.`)
          usuarioCriado = usuarioExistente
        } else {
          // Verificar se existe no Supabase Auth
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
          if (authUsers?.users) {
            const authExistente = authUsers.users.find(u => u.email?.toLowerCase() === value.email.toLowerCase())
            if (authExistente) {
              console.log(`⚠️ Email ${value.email} já existe no Auth. Removendo para reutilização...`)
              await supabaseAdmin.auth.admin.deleteUser(authExistente.id)
            }
          }

          // Gerar senha temporária
          const senhaTemporaria = generateSecurePassword()

          // Criar usuário no Supabase Auth
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: value.email,
            password: senhaTemporaria,
            email_confirm: true,
            user_metadata: {
              nome: value.nome,
              tipo: 'responsavel_obra'
            }
          })

          if (authError) {
            console.error('Erro ao criar usuário no Auth para responsável de obra:', authError)
          } else {
            // Criar na tabela usuarios
            const { data: novoUsuario, error: novoUsuarioError } = await supabaseAdmin
              .from('usuarios')
              .insert({
                nome: value.nome,
                email: value.email,
                telefone: value.telefone || null,
                status: 'Ativo',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single()

            if (novoUsuarioError) {
              console.error('Erro ao criar registro do usuário:', novoUsuarioError)
              await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            } else {
              usuarioCriado = novoUsuario

              // Atribuir perfil de Cliente (para ter acesso limitado)
              await supabaseAdmin
                .from('usuario_perfis')
                .insert({
                  usuario_id: novoUsuario.id,
                  perfil_id: 6,
                  status: 'Ativa',
                  data_atribuicao: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .then(() => console.log(`✅ Perfil atribuído ao responsável de obra: ${value.nome}`))
                .catch(err => console.error('Erro ao atribuir perfil:', err))

              // Enviar email com credenciais (assíncrono)
              sendWelcomeEmail({
                nome: value.nome,
                email: value.email,
                senha_temporaria: senhaTemporaria
              }).then(() => {
                console.log(`✅ Email de acesso enviado para responsável de obra: ${value.email}`)
                emailEnviado = true
              }).catch((emailError) => {
                console.error(`❌ Erro ao enviar email para ${value.email}:`, emailError)
              })
            }
          }
        }
      } catch (userError) {
        console.error('Erro ao criar conta para responsável de obra (não impede o cadastro):', userError)
      }
    }

    res.status(201).json({
      success: true,
      data,
      usuario_criado: !!usuarioCriado,
      message: usuarioCriado
        ? `Responsável cadastrado. ${value.email ? 'Email com credenciais de acesso será enviado em breve.' : ''}`
        : 'Responsável cadastrado com sucesso.'
    })
  } catch (error) {
    console.error('Erro ao adicionar responsável de obra:', error)
    res.status(500).json({ success: false, error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * PUT /api/obras/:obra_id/responsaveis-obra/:id
 * Atualizar responsável de uma obra
 */
router.put('/:obra_id/responsaveis-obra/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { obra_id, id } = req.params
    const { error: validationError, value } = responsavelObraSchema.validate(req.body, { stripUnknown: true })

    if (validationError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', message: validationError.details[0].message })
    }

    const { data, error } = await supabaseAdmin
      .from('responsaveis_obra')
      .update({
        nome: value.nome,
        usuario: value.usuario || null,
        email: value.email || null,
        telefone: value.telefone || null,
        ativo: value.ativo !== undefined ? value.ativo : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('obra_id', obra_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar responsável de obra:', error)
      return res.status(500).json({ success: false, error: 'Erro ao atualizar responsável de obra', message: error.message })
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Responsável não encontrado' })
    }

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao atualizar responsável de obra:', error)
    res.status(500).json({ success: false, error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * DELETE /api/obras/:obra_id/responsaveis-obra/:id
 * Remover responsável de uma obra
 */
router.delete('/:obra_id/responsaveis-obra/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { obra_id, id } = req.params

    const { error } = await supabaseAdmin
      .from('responsaveis_obra')
      .delete()
      .eq('id', id)
      .eq('obra_id', obra_id)

    if (error) {
      console.error('Erro ao remover responsável de obra:', error)
      return res.status(500).json({ success: false, error: 'Erro ao remover responsável de obra', message: error.message })
    }

    res.json({ success: true, message: 'Responsável removido com sucesso' })
  } catch (error) {
    console.error('Erro ao remover responsável de obra:', error)
    res.status(500).json({ success: false, error: 'Erro interno do servidor', message: error.message })
  }
})

export default router
