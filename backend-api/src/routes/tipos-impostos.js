import express from 'express';
import Joi from 'joi';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Schema de validação
const tipoImpostoSchema = Joi.object({
  nome: Joi.string().min(1).max(100).required(),
  descricao: Joi.string().max(500).optional().allow('', null),
  ativo: Joi.boolean().optional()
});

const tipoImpostoUpdateSchema = tipoImpostoSchema.fork(
  ['nome', 'descricao', 'ativo'],
  (schema) => schema.optional()
);

/**
 * @swagger
 * /api/tipos-impostos:
 *   get:
 *     summary: Listar tipos de impostos
 *     tags: [Tipos de Impostos]
 */
router.get('/', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { ativo } = req.query;
    
    let query = supabaseAdmin
      .from('tipos_impostos')
      .select('*')
      .order('nome', { ascending: true });

    if (ativo !== undefined) {
      query = query.eq('ativo', ativo === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar tipos de impostos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/tipos-impostos/{id}:
 *   get:
 *     summary: Buscar tipo de imposto por ID
 *     tags: [Tipos de Impostos]
 */
router.get('/:id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('tipos_impostos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Tipo de imposto não encontrado'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao buscar tipo de imposto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/tipos-impostos:
 *   post:
 *     summary: Criar tipo de imposto
 *     tags: [Tipos de Impostos]
 */
router.post('/', authenticateToken, requirePermission('obras:criar'), async (req, res) => {
  try {
    const { error: validationError, value } = tipoImpostoSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    // Verificar se já existe um tipo com o mesmo nome
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('tipos_impostos')
      .select('id')
      .eq('nome', value.nome)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      return res.status(409).json({
        error: 'Tipo de imposto já existe',
        message: `Já existe um tipo de imposto com o nome "${value.nome}"`
      });
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('tipos_impostos')
      .insert({
        ...value,
        ativo: value.ativo !== undefined ? value.ativo : true
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      success: true,
      data,
      message: 'Tipo de imposto criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar tipo de imposto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/tipos-impostos/{id}:
 *   put:
 *     summary: Atualizar tipo de imposto
 *     tags: [Tipos de Impostos]
 */
router.put('/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = tipoImpostoUpdateSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    // Se estiver atualizando o nome, verificar se não existe outro com o mesmo nome
    if (value.nome) {
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('tipos_impostos')
        .select('id')
        .eq('nome', value.nome)
        .neq('id', id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        return res.status(409).json({
          error: 'Tipo de imposto já existe',
          message: `Já existe um tipo de imposto com o nome "${value.nome}"`
        });
      }
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('tipos_impostos')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Tipo de imposto não encontrado'
        });
      }
      throw updateError;
    }

    res.json({
      success: true,
      data,
      message: 'Tipo de imposto atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar tipo de imposto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/tipos-impostos/{id}:
 *   delete:
 *     summary: Excluir tipo de imposto
 *     tags: [Tipos de Impostos]
 */
router.delete('/:id', authenticateToken, requirePermission('obras:excluir'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se existem impostos usando este tipo
    const { data: impostos, error: checkError } = await supabaseAdmin
      .from('impostos_financeiros')
      .select('id')
      .eq('tipo', id)
      .limit(1);

    if (checkError) throw checkError;

    if (impostos && impostos.length > 0) {
      return res.status(409).json({
        error: 'Não é possível excluir',
        message: 'Existem impostos cadastrados com este tipo. Desative o tipo ao invés de excluí-lo.'
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('tipos_impostos')
      .delete()
      .eq('id', id);

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Tipo de imposto não encontrado'
        });
      }
      throw deleteError;
    }

    res.json({
      success: true,
      message: 'Tipo de imposto excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir tipo de imposto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

export default router;





