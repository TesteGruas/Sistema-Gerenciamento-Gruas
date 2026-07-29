import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

/**
 * @param {string} texto
 * @returns {string}
 */
export function slugifyCodigoEstoque(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50)
}

/**
 * CRUD genérico para tabelas de taxonomia do estoque (código + nome).
 * @param {{
 *   tabela: string
 *   campoProduto: 'classificacao_tipo' | 'subcategoria_ativo'
 *   label: string
 *   comExigeSubcategoria?: boolean
 * }} cfg
 */
export function createEstoqueTaxonomiaRouter(cfg) {
  const router = express.Router()
  const schemaBase = {
    nome: Joi.string().min(2).max(120).required(),
    codigo: Joi.string().min(2).max(50).pattern(/^[a-z0-9_]+$/).optional(),
    descricao: Joi.string().allow('').optional(),
    status: Joi.string().valid('Ativa', 'Inativa').default('Ativa')
  }
  if (cfg.comExigeSubcategoria) {
    schemaBase.exige_subcategoria = Joi.boolean().default(false)
  }
  const schema = Joi.object(schemaBase)

  router.get('/', authenticateToken, requirePermission('estoque:visualizar'), async (req, res) => {
    try {
      const status = req.query.status
      const limit = Math.min(parseInt(req.query.limit, 10) || 500, 1000)

      let query = supabaseAdmin.from(cfg.tabela).select('*').order('nome', { ascending: true }).limit(limit)
      if (status) query = query.eq('status', status)

      const { data, error } = await query
      if (error) {
        return res.status(500).json({ error: `Erro ao buscar ${cfg.label}`, message: error.message })
      }

      res.json({ success: true, data: data || [] })
    } catch (error) {
      console.error(`Erro ao listar ${cfg.label}:`, error)
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
    }
  })

  router.post('/', authenticateToken, requirePermission('estoque:criar'), async (req, res) => {
    try {
      const { error, value } = schema.validate(req.body)
      if (error) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.details[0].message })
      }

      const codigo = value.codigo || slugifyCodigoEstoque(value.nome)
      if (!codigo) {
        return res.status(400).json({ error: 'Código inválido', message: 'Informe um nome ou código válido' })
      }

      const row = {
        codigo,
        nome: value.nome.trim(),
        descricao: value.descricao || null,
        status: value.status || 'Ativa',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      if (cfg.comExigeSubcategoria) {
        row.exige_subcategoria = Boolean(value.exige_subcategoria)
      }

      const { data, error: insertError } = await supabaseAdmin
        .from(cfg.tabela)
        .insert(row)
        .select()
        .single()

      if (insertError) {
        if (insertError.code === '23505') {
          return res.status(409).json({
            error: 'Código já existe',
            message: `Já existe um(a) ${cfg.label} com o código "${codigo}"`
          })
        }
        return res.status(500).json({ error: `Erro ao criar ${cfg.label}`, message: insertError.message })
      }

      res.status(201).json({ success: true, data, message: `${cfg.label} criado(a) com sucesso` })
    } catch (error) {
      console.error(`Erro ao criar ${cfg.label}:`, error)
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
    }
  })

  router.put('/:id', authenticateToken, requirePermission('estoque:editar'), async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10)
      if (!id) return res.status(400).json({ error: 'ID inválido' })

      const { error, value } = schema.validate(req.body)
      if (error) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.details[0].message })
      }

      const { data: atual, error: findError } = await supabaseAdmin
        .from(cfg.tabela)
        .select('*')
        .eq('id', id)
        .single()

      if (findError || !atual) {
        return res.status(404).json({ error: 'Não encontrado', message: `${cfg.label} não encontrado(a)` })
      }

      const novoCodigo = value.codigo || atual.codigo
      const updateData = {
        nome: value.nome.trim(),
        codigo: novoCodigo,
        descricao: value.descricao || null,
        status: value.status || 'Ativa',
        updated_at: new Date().toISOString()
      }
      if (cfg.comExigeSubcategoria) {
        updateData.exige_subcategoria = Boolean(value.exige_subcategoria)
      }

      const { data, error: updateError } = await supabaseAdmin
        .from(cfg.tabela)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        if (updateError.code === '23505') {
          return res.status(409).json({
            error: 'Código já existe',
            message: `Já existe um(a) ${cfg.label} com o código "${novoCodigo}"`
          })
        }
        return res.status(500).json({ error: `Erro ao atualizar ${cfg.label}`, message: updateError.message })
      }

      if (novoCodigo !== atual.codigo) {
        const { error: syncError } = await supabaseAdmin
          .from('produtos')
          .update({ [cfg.campoProduto]: novoCodigo, updated_at: new Date().toISOString() })
          .eq(cfg.campoProduto, atual.codigo)
        if (syncError) {
          console.error(`Erro ao sincronizar produtos após rename de ${cfg.label}:`, syncError)
        }
      }

      res.json({ success: true, data, message: `${cfg.label} atualizado(a) com sucesso` })
    } catch (error) {
      console.error(`Erro ao atualizar ${cfg.label}:`, error)
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
    }
  })

  router.delete('/:id', authenticateToken, requirePermission('estoque:excluir'), async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10)
      if (!id) return res.status(400).json({ error: 'ID inválido' })

      const { data: atual, error: findError } = await supabaseAdmin
        .from(cfg.tabela)
        .select('*')
        .eq('id', id)
        .single()

      if (findError || !atual) {
        return res.status(404).json({ error: 'Não encontrado', message: `${cfg.label} não encontrado(a)` })
      }

      const { data: emUso, error: usoError } = await supabaseAdmin
        .from('produtos')
        .select('id')
        .eq(cfg.campoProduto, atual.codigo)
        .limit(1)

      if (usoError) {
        return res.status(500).json({ error: 'Erro ao verificar uso', message: usoError.message })
      }

      if (emUso && emUso.length > 0) {
        return res.status(400).json({
          error: 'Em uso',
          message: `Não é possível excluir: há produtos usando este(a) ${cfg.label}`
        })
      }

      const { error } = await supabaseAdmin.from(cfg.tabela).delete().eq('id', id)
      if (error) {
        return res.status(500).json({ error: `Erro ao excluir ${cfg.label}`, message: error.message })
      }

      res.json({ success: true, message: `${cfg.label} excluído(a) com sucesso` })
    } catch (error) {
      console.error(`Erro ao excluir ${cfg.label}:`, error)
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
    }
  })

  return router
}

export const estoqueClassificacoesRouter = createEstoqueTaxonomiaRouter({
  tabela: 'estoque_classificacoes',
  campoProduto: 'classificacao_tipo',
  label: 'classificação',
  comExigeSubcategoria: true
})

export const estoqueSubcategoriasAtivoRouter = createEstoqueTaxonomiaRouter({
  tabela: 'estoque_subcategorias_ativo',
  campoProduto: 'subcategoria_ativo',
  label: 'subcategoria de ativo',
  comExigeSubcategoria: false
})
