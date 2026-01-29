import express from 'express';
import Joi from 'joi';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Schema de validação
const historicoSchema = Joi.object({
  grua_id: Joi.number().integer().positive().required(),
  data_inicio: Joi.date().optional(),
  data_fim: Joi.date().optional(),
  tipo_operacao: Joi.string().valid('Locacao', 'Transferencia', 'Manutencao').optional()
});

/**
 * @swagger
 * /api/historico/gruas/{gruaId}:
 *   get:
 *     summary: Obter histórico de uma grua específica
 *     tags: [Histórico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gruaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da grua
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do filtro
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do filtro
 *     responses:
 *       200:
 *         description: Histórico da grua
 */
router.get('/gruas/:gruaId', authenticateToken, requirePermission('historico:visualizar'), async (req, res) => {
  try {
    const { gruaId } = req.params;
    const { data_inicio, data_fim } = req.query;

    // Buscar histórico de locações
    let locacoesQuery = supabaseAdmin
      .from('historico_locacoes')
      .select(`
        *,
        obra:obras(id, nome, status, cliente:clientes(nome)),
        funcionario:funcionarios(nome, cargo),
        grua:gruas(name, modelo)
      `)
      .eq('grua_id', gruaId)
      .order('data_inicio', { ascending: false });

    if (data_inicio) {
      locacoesQuery = locacoesQuery.gte('data_inicio', data_inicio);
    }
    if (data_fim) {
      locacoesQuery = locacoesQuery.lte('data_fim', data_fim);
    }

    const { data: locacoes, error: locacoesError } = await locacoesQuery;

    if (locacoesError) {
      return res.status(500).json({
        error: 'Erro ao buscar histórico de locações',
        message: locacoesError.message
      });
    }

    // Buscar entradas do livro da grua
    let livroQuery = supabaseAdmin
      .from('livro_grua')
      .select(`
        *,
        funcionario:funcionarios(nome, cargo)
      `)
      .eq('grua_id', gruaId)
      .order('data_entrada', { ascending: false });

    if (data_inicio) {
      livroQuery = livroQuery.gte('data_entrada', data_inicio);
    }
    if (data_fim) {
      livroQuery = livroQuery.lte('data_entrada', data_fim);
    }

    const { data: livro, error: livroError } = await livroQuery;

    if (livroError) {
      return res.status(500).json({
        error: 'Erro ao buscar livro da grua',
        message: livroError.message
      });
    }

    res.json({
      success: true,
      data: {
        locacoes: locacoes || [],
        livro: livro || []
      }
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/historico/geral:
 *   get:
 *     summary: Listar histórico geral do sistema (logs de auditoria)
 *     tags: [Histórico]
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
 *           default: 20
 *         description: Itens por página
 *       - in: query
 *         name: modulo
 *         schema:
 *           type: string
 *         description: Filtrar por módulo específico
 *       - in: query
 *         name: acao
 *         schema:
 *           type: string
 *         description: Filtrar por ação específica
 *     responses:
 *       200:
 *         description: Lista de histórico geral
 */
router.get('/geral', authenticateToken, requirePermission('historico:visualizar'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { modulo, acao } = req.query;

    const todasAtividades = [];

    // 1. Buscar logs de auditoria
    let queryAuditoria = supabaseAdmin
      .from('logs_auditoria')
      .select('*')
      .order('timestamp', { ascending: false });

    if (modulo && modulo !== 'todos') {
      queryAuditoria = queryAuditoria.eq('entidade', modulo);
    }
    if (acao && acao !== 'todas') {
      queryAuditoria = queryAuditoria.eq('acao', acao);
    }

    const { data: logsAuditoria, error: auditoriaError } = await queryAuditoria;

    if (!auditoriaError && logsAuditoria) {
      logsAuditoria.forEach(log => {
        todasAtividades.push({
          id: `auditoria_${log.id}`,
          tipo: 'auditoria',
          timestamp: log.timestamp,
          usuario_id: log.usuario_id,
          acao: log.acao,
          entidade: log.entidade,
          entidade_id: log.entidade_id,
          dados_anteriores: log.dados_anteriores,
          dados_novos: log.dados_novos,
          ip_address: log.ip_address,
          user_agent: log.user_agent,
          // Campos padronizados
          titulo: `${log.acao} em ${log.entidade}`,
          descricao: log.entidade_id ? `ID: ${log.entidade_id}` : '',
          usuario_nome: log.usuario_id ? `Usuário ${log.usuario_id}` : 'Sistema'
        });
      });
    }

    // 2. Buscar histórico de locações (se não filtrar por módulo específico)
    if (!modulo || modulo === 'todos' || modulo === 'gruas') {
      const { data: locacoes, error: locacoesError } = await supabaseAdmin
        .from('historico_locacoes')
        .select(`
          *,
          obra:obras(nome, cliente:clientes(nome)),
          funcionario:funcionarios(nome, cargo),
          grua:gruas(name, modelo)
        `)
        .order('data_inicio', { ascending: false });

      if (!locacoesError && locacoes) {
        locacoes.forEach(locacao => {
          todasAtividades.push({
            id: `locacao_${locacao.id}`,
            tipo: 'locacao',
            timestamp: locacao.data_inicio,
            usuario_id: locacao.funcionario_id,
            acao: locacao.tipo_operacao,
            entidade: 'gruas',
            entidade_id: locacao.grua_id,
            // Campos específicos da locação
            obra_nome: locacao.obra?.nome,
            cliente_nome: locacao.obra?.cliente?.nome,
            grua_nome: locacao.grua?.name,
            grua_modelo: locacao.grua?.modelo,
            valor_locacao: locacao.valor_locacao,
            // Campos padronizados
            titulo: `Grua ${locacao.grua?.name} ${locacao.tipo_operacao === 'Locacao' ? 'locada' : 'transferida'}`,
            descricao: locacao.obra?.nome ? `para obra ${locacao.obra.nome}` : '',
            usuario_nome: locacao.funcionario?.nome || 'Sistema'
          });
        });
      }
    }

    // 3. Buscar registros de ponto (se não filtrar por módulo específico)
    if (!modulo || modulo === 'todos' || modulo === 'ponto') {
      const { data: registrosPonto, error: pontoError } = await supabaseAdmin
        .from('registros_ponto')
        .select(`
          *,
          funcionario:funcionarios(nome, cargo),
          aprovado_por_usuario:usuarios(nome, email)
        `)
        .order('data', { ascending: false });

      if (!pontoError && registrosPonto) {
        registrosPonto.forEach(registro => {
          todasAtividades.push({
            id: `ponto_${registro.id}`,
            tipo: 'ponto',
            timestamp: registro.data,
            usuario_id: registro.funcionario_id,
            acao: 'registro_ponto',
            entidade: 'ponto',
            entidade_id: registro.id,
            // Campos específicos do ponto
            entrada: registro.entrada,
            saida: registro.saida,
            horas_trabalhadas: registro.horas_trabalhadas,
            status: registro.status,
            // Campos padronizados
            titulo: `Registro de ponto - ${registro.funcionario?.nome}`,
            descricao: `${registro.entrada || 'N/A'} - ${registro.saida || 'N/A'}`,
            usuario_nome: registro.funcionario?.nome || 'Sistema'
          });
        });
      }
    }

    // 4. Buscar histórico de componentes (se não filtrar por módulo específico)
    if (!modulo || modulo === 'todos' || modulo === 'componentes') {
      const { data: componentes, error: componentesError } = await supabaseAdmin
        .from('historico_componentes')
        .select(`
          *,
          componente:grua_componentes(nome, tipo, modelo),
          funcionario:funcionarios(nome, cargo),
          obra:obras(nome, cliente:clientes(nome)),
          grua_origem:gruas!historico_componentes_grua_origem_id_fkey(name, modelo),
          grua_destino:gruas!historico_componentes_grua_destino_id_fkey(name, modelo)
        `)
        .order('data_movimentacao', { ascending: false });

      if (!componentesError && componentes) {
        componentes.forEach(componente => {
          todasAtividades.push({
            id: `componente_${componente.id}`,
            tipo: 'componente',
            timestamp: componente.data_movimentacao,
            usuario_id: componente.funcionario_id,
            acao: componente.tipo_movimentacao,
            entidade: 'componentes',
            entidade_id: componente.componente_id,
            // Campos específicos do componente
            componente_nome: componente.componente?.nome,
            componente_tipo: componente.componente?.tipo,
            grua_origem_nome: componente.grua_origem?.name,
            grua_destino_nome: componente.grua_destino?.name,
            // Campos padronizados
            titulo: `Componente ${componente.componente?.nome} ${componente.tipo_movimentacao}`,
            descricao: componente.grua_origem?.name && componente.grua_destino?.name 
              ? `de ${componente.grua_origem.name} para ${componente.grua_destino.name}`
              : '',
            usuario_nome: componente.funcionario?.nome || 'Sistema'
          });
        });
      }
    }

    // Ordenar todas as atividades por timestamp (mais recente primeiro)
    todasAtividades.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Aplicar paginação
    const total = todasAtividades.length;
    const atividadesPaginadas = todasAtividades.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: atividadesPaginadas,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages
      }
    });
  } catch (error) {
    console.error('Erro ao listar histórico geral:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/historico/gruas:
 *   get:
 *     summary: Listar histórico de todas as gruas
 *     tags: [Histórico]
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
 *           default: 20
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de histórico
 */
router.get('/gruas', authenticateToken, requirePermission('historico:visualizar'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Buscar histórico de locações com paginação
    const { data: locacoes, error: locacoesError, count } = await supabaseAdmin
      .from('historico_locacoes')
      .select(`
        *,
        obra:obras(id, nome, status, cliente:clientes(nome)),
        funcionario:funcionarios(nome, cargo),
        grua:gruas(name, modelo)
      `, { count: 'exact' })
      .order('data_inicio', { ascending: false })
      .range(offset, offset + limit - 1);

    if (locacoesError) {
      return res.status(500).json({
        error: 'Erro ao buscar histórico',
        message: locacoesError.message
      });
    }

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: locacoes || [],
      pagination: {
        page,
        limit,
        total: count,
        pages: totalPages
      }
    });
  } catch (error) {
    console.error('Erro ao listar histórico:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/historico/componentes:
 *   get:
 *     summary: Listar histórico de componentes
 *     tags: [Histórico]
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
 *           default: 20
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de histórico de componentes
 */
router.get('/componentes', authenticateToken, requirePermission('historico:visualizar'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data: componentes, error: componentesError, count } = await supabaseAdmin
      .from('historico_componentes')
      .select(`
        *,
        componente:grua_componentes(nome, tipo, modelo),
        funcionario:funcionarios(nome, cargo),
        obra:obras(nome, cliente:clientes(nome)),
        grua_origem:gruas!historico_componentes_grua_origem_id_fkey(name, modelo),
        grua_destino:gruas!historico_componentes_grua_destino_id_fkey(name, modelo)
      `, { count: 'exact' })
      .order('data_movimentacao', { ascending: false })
      .range(offset, offset + limit - 1);

    if (componentesError) {
      return res.status(500).json({
        error: 'Erro ao buscar histórico de componentes',
        message: componentesError.message
      });
    }

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: componentes || [],
      pagination: {
        page,
        limit,
        total: count,
        pages: totalPages
      }
    });
  } catch (error) {
    console.error('Erro ao listar histórico de componentes:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/historico/componentes:
 *   post:
 *     summary: Criar registro de histórico de componente
 *     tags: [Histórico]
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
 *         description: Dados inválidos
 */
router.post('/componentes', authenticateToken, requirePermission('historico:criar'), async (req, res) => {
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

    // Validar campos obrigatórios
    if (!componente_id || !tipo_movimentacao || quantidade_movimentada === undefined) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'componente_id, tipo_movimentacao e quantidade_movimentada são obrigatórios'
      });
    }

    // Obter responsavel_id se não fornecido
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

    // Inserir registro no histórico
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
      console.error('Erro ao criar histórico de componente:', error);
      return res.status(500).json({
        error: 'Erro ao criar histórico',
        message: error.message
      });
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Registro de histórico criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar histórico de componente:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/historico/ponto:
 *   get:
 *     summary: Listar registros de ponto
 *     tags: [Histórico]
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
 *           default: 20
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de registros de ponto
 */
router.get('/ponto', authenticateToken, requirePermission('historico:visualizar'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data: registros, error: registrosError, count } = await supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios(nome, cargo),
        aprovado_por_usuario:usuarios(nome, email)
      `, { count: 'exact' })
      .order('data', { ascending: false })
      .range(offset, offset + limit - 1);

    if (registrosError) {
      return res.status(500).json({
        error: 'Erro ao buscar registros de ponto',
        message: registrosError.message
      });
    }

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: registros || [],
      pagination: {
        page,
        limit,
        total: count,
        pages: totalPages
      }
    });
  } catch (error) {
    console.error('Erro ao listar registros de ponto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/historico/estatisticas:
 *   get:
 *     summary: Obter estatísticas do histórico
 *     tags: [Histórico]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas do histórico
 */
router.get('/estatisticas', authenticateToken, requirePermission('historico:visualizar'), async (req, res) => {
  try {
    // Estatísticas gerais de auditoria
    const { count: totalLogs, error: logsError } = await supabaseAdmin
      .from('logs_auditoria')
      .select('*', { count: 'exact', head: true });

    // Estatísticas por módulo (logs de auditoria)
    const { data: logsPorModulo, error: moduloError } = await supabaseAdmin
      .from('logs_auditoria')
      .select('entidade')
      .not('entidade', 'is', null);

    // Estatísticas por ação (logs de auditoria)
    const { data: logsPorAcao, error: acaoError } = await supabaseAdmin
      .from('logs_auditoria')
      .select('acao')
      .not('acao', 'is', null);

    // Estatísticas de locações
    const { count: totalLocacoes, error: totalError } = await supabaseAdmin
      .from('historico_locacoes')
      .select('*', { count: 'exact', head: true });

    const { data: porTipoOperacao, error: tipoError } = await supabaseAdmin
      .from('historico_locacoes')
      .select('tipo_operacao')
      .not('tipo_operacao', 'is', null);

    // Estatísticas de componentes
    const { count: totalComponentes, error: componentesError } = await supabaseAdmin
      .from('historico_componentes')
      .select('*', { count: 'exact', head: true });

    const { data: componentesPorTipo, error: componentesTipoError } = await supabaseAdmin
      .from('historico_componentes')
      .select('tipo_movimentacao')
      .not('tipo_movimentacao', 'is', null);

    // Estatísticas de ponto
    const { count: totalRegistrosPonto, error: pontoError } = await supabaseAdmin
      .from('registros_ponto')
      .select('*', { count: 'exact', head: true });

    if (logsError || moduloError || acaoError || totalError || tipoError || 
        componentesError || componentesTipoError || pontoError) {
      console.error('Erros nas consultas:', { 
        logsError, moduloError, acaoError, totalError, tipoError, 
        componentesError, componentesTipoError, pontoError 
      });
      return res.status(500).json({
        error: 'Erro ao buscar estatísticas',
        message: 'Erro ao processar dados estatísticos'
      });
    }

    // Processar estatísticas por módulo
    const estatisticasModulo = logsPorModulo.reduce((acc, item) => {
      acc[item.entidade] = (acc[item.entidade] || 0) + 1;
      return acc;
    }, {});

    // Processar estatísticas por ação
    const estatisticasAcao = logsPorAcao.reduce((acc, item) => {
      acc[item.acao] = (acc[item.acao] || 0) + 1;
      return acc;
    }, {});

    // Processar estatísticas por tipo de operação
    const estatisticasTipo = porTipoOperacao.reduce((acc, item) => {
      acc[item.tipo_operacao] = (acc[item.tipo_operacao] || 0) + 1;
      return acc;
    }, {});

    // Processar estatísticas de componentes por tipo
    const estatisticasComponentes = componentesPorTipo.reduce((acc, item) => {
      acc[item.tipo_movimentacao] = (acc[item.tipo_movimentacao] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        // Totais gerais
        total_logs_auditoria: totalLogs || 0,
        total_locacoes: totalLocacoes || 0,
        total_componentes: totalComponentes || 0,
        total_registros_ponto: totalRegistrosPonto || 0,
        
        // Estatísticas por categoria
        por_modulo: estatisticasModulo,
        por_acao: estatisticasAcao,
        por_tipo_operacao: estatisticasTipo,
        por_tipo_movimentacao_componentes: estatisticasComponentes,
        
        // Resumo
        resumo: {
          total_registros: (totalLogs || 0) + (totalLocacoes || 0) + (totalComponentes || 0) + (totalRegistrosPonto || 0),
          modulos_mais_ativos: Object.entries(estatisticasModulo)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([modulo, count]) => ({ modulo, count })),
          acoes_mais_comuns: Object.entries(estatisticasAcao)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([acao, count]) => ({ acao, count }))
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

export default router;
