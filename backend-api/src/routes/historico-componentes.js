import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/historico-componentes:
 *   post:
 *     summary: Criar registro de hist?rico de componente
 *     tags: [Hist?rico]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - componente_id
 *               - tipo_movimentacao
 *               - quantidade_movimentada
 *             properties:
 *               componente_id:
 *                 type: integer
 *               tipo_movimentacao:
 *                 type: string
 *               quantidade_movimentada:
 *                 type: integer
 *               quantidade_anterior:
 *                 type: integer
 *               quantidade_atual:
 *                 type: integer
 *               motivo:
 *                 type: string
 *               observacoes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registro criado com sucesso
 *       400:
 *         description: Dados inv?lidos
 */
router.post('/', authenticateToken, requirePermission('historico:visualizar'), async (req, res) => {
  try {
    const {
      componente_id,
      tipo_movimentacao,
      quantidade_movimentada,
      quantidade_anterior,
      quantidade_atual,
      motivo,
      observacoes,
      obra_id,
      grua_origem_id,
      grua_destino_id,
      funcionario_responsavel_id,
      anexos
    } = req.body;

    // Validar campos obrigat?rios
    if (!componente_id || !tipo_movimentacao || quantidade_movimentada === undefined) {
      return res.status(400).json({
        error: 'Dados inv?lidos',
        message: 'componente_id, tipo_movimentacao e quantidade_movimentada s?o obrigat?rios'
      });
    }

    // Obter responsavel_id se n?o fornecido
    let responsavel_id = funcionario_responsavel_id;
    if (!responsavel_id) {
      if (typeof req.user.id === 'number' || !isNaN(parseInt(req.user.id))) {
        responsavel_id = parseInt(req.user.id);
      } else {
        const { data: userData } = await supabaseAdmin
          .from('usuarios')
          .select('id')
          .eq('email', req.user.email)
          .single();
        responsavel_id = userData?.id || 1;
      }
    }

    // Inserir registro no hist?rico
    const { data, error } = await supabaseAdmin
      .from('historico_componentes')
      .insert({
        componente_id: parseInt(componente_id),
        tipo_movimentacao,
        quantidade_movimentada: parseInt(quantidade_movimentada),
        quantidade_anterior: quantidade_anterior !== undefined ? parseInt(quantidade_anterior) : null,
        quantidade_atual: quantidade_atual !== undefined ? parseInt(quantidade_atual) : null,
        motivo: motivo || null,
        observacoes: observacoes || null,
        obra_id: obra_id ? parseInt(obra_id) : null,
        grua_origem_id: grua_origem_id || null,
        grua_destino_id: grua_destino_id || null,
        funcionario_responsavel_id: responsavel_id,
        anexos: anexos || null,
        data_movimentacao: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar hist?rico de componente:', error);
      return res.status(500).json({
        error: 'Erro ao criar hist?rico',
        message: error.message
      });
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Registro de hist?rico criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar hist?rico de componente:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

export default router;
