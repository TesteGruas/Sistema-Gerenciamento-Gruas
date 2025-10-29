import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import { 
  calcularHorasTrabalhadas, 
  calcularHorasExtras, 
  determinarStatus,
  gerarIdRegistro,
  gerarIdJustificativa,
  validarHorario,
  normalizarHorario,
  validarData,
  calcularResumoPeriodo,
  calcularResumoJustificativas,
  calcularTendenciaMensal,
  agruparJustificativasPor,
  calcularEstatisticasAvancadas
} from '../utils/ponto-eletronico.js';
import { buscarSupervisorPorObra, calcularDataLimite } from '../utils/aprovacoes-helpers.js';
import { criarNotificacaoNovaAprovacao } from '../services/notificacoes-horas-extras.js';

const router = express.Router();

// REMOVIDO: Função verificarSeAdministrador - agora usamos req.user.level do middleware authenticateToken
// A informação de nível já vem normalizada no req.user após autenticação

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

/**
 * @swagger
 * /api/ponto-eletronico/funcionarios:
 *   get:
 *     summary: Lista funcionários disponíveis para registro de ponto
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: usuario_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário para verificar permissões
 *     responses:
 *       200:
 *         description: Lista de funcionários disponíveis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 funcionarios:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: ID do funcionário
 *                       nome:
 *                         type: string
 *                         description: Nome do funcionário
 *                       cargo:
 *                         type: string
 *                         description: Cargo do funcionário
 *                       turno:
 *                         type: string
 *                         description: Turno de trabalho
 *                       status:
 *                         type: string
 *                         description: Status do funcionário
 *                 isAdmin:
 *                   type: boolean
 *                   description: Se o usuário é administrador
 *       400:
 *         description: ID do usuário é obrigatório
 *       404:
 *         description: Funcionário não encontrado para este usuário
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/funcionarios', async (req, res) => {
  try {
    const { usuario_id } = req.query;

    if (!usuario_id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    // Verificar se o usuário é administrador (usando nível do middleware)
    const isAdmin = req.user.level >= 10;

    let query = supabaseAdmin
      .from('funcionarios')
      .select('id, nome, cargo, turno, status')
      .eq('status', 'Ativo');

    // Se não for administrador, mostrar apenas o funcionário associado ao usuário
    if (!isAdmin) {
      // Buscar o funcionário_id do usuário
      const { data: usuario, error: usuarioError } = await supabaseAdmin
        .from('usuarios')
        .select('funcionario_id')
        .eq('id', usuario_id)
        .single();

      if (usuarioError || !usuario?.funcionario_id) {
        return res.status(404).json({ error: 'Funcionário não encontrado para este usuário' });
      }

      query = query.eq('id', usuario.funcionario_id);
    }

    const { data, error } = await query.order('nome');

    if (error) throw error;

    res.status(200).json({
      funcionarios: data,
      isAdmin
    });
  } catch (error) {
    console.error('Erro ao listar funcionários:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/registros:
 *   get:
 *     summary: Lista registros de ponto com filtros opcionais
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário para filtrar
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do período (YYYY-MM-DD)
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do período (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Normal, Pendente Aprovação, Aprovado, Rejeitado, Em Andamento]
 *         description: Status do registro
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca textual (nome, data, status, observações) - mínimo 3 caracteres
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: ID da obra para filtrar
 *       - in: query
 *         name: cargo
 *         schema:
 *           type: string
 *         description: Cargo do funcionário
 *       - in: query
 *         name: turno
 *         schema:
 *           type: string
 *         description: Turno do funcionário
 *       - in: query
 *         name: horas_extras_min
 *         schema:
 *           type: number
 *         description: Mínimo de horas extras
 *       - in: query
 *         name: horas_extras_max
 *         schema:
 *           type: number
 *         description: Máximo de horas extras
 *       - in: query
 *         name: order_by
 *         schema:
 *           type: string
 *           enum: [data, funcionario, horas_trabalhadas, horas_extras, status, created_at]
 *           default: data
 *         description: Campo para ordenação
 *       - in: query
 *         name: order_direction
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Direção da ordenação
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
 *         description: Limite de registros por página
 *     responses:
 *       200:
 *         description: Lista de registros de ponto
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
 *                         type: string
 *                         description: ID do registro
 *                       funcionario_id:
 *                         type: integer
 *                         description: ID do funcionário
 *                       data:
 *                         type: string
 *                         format: date
 *                         description: Data do registro
 *                       entrada:
 *                         type: string
 *                         format: time
 *                         description: Horário de entrada
 *                       saida_almoco:
 *                         type: string
 *                         format: time
 *                         description: Horário de saída para almoço
 *                       volta_almoco:
 *                         type: string
 *                         format: time
 *                         description: Horário de volta do almoço
 *                       saida:
 *                         type: string
 *                         format: time
 *                         description: Horário de saída
 *                       horas_trabalhadas:
 *                         type: number
 *                         description: Total de horas trabalhadas
 *                       horas_extras:
 *                         type: number
 *                         description: Total de horas extras
 *                       status:
 *                         type: string
 *                         description: Status do registro
 *                       observacoes:
 *                         type: string
 *                         description: Observações do registro
 *                       localizacao:
 *                         type: string
 *                         description: Localização do registro
 *                       funcionario:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                           cargo:
 *                             type: string
 *                           turno:
 *                             type: string
 *                       aprovador:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
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
router.get('/registros', async (req, res) => {
  try {
    const { 
      funcionario_id, 
      data_inicio, 
      data_fim, 
      status,
      search,
      obra_id,
      cargo,
      turno,
      horas_extras_min,
      horas_extras_max,
      order_by = 'data',
      order_direction = 'desc',
      page = 1, 
      limit = 50,
      recalcular = 'false'
    } = req.query;

    // ========================================
    // VALIDAÇÕES
    // ========================================
    
    // Validar campos de ordenação
    const validOrderFields = {
      'data': 'data',
      'funcionario': 'funcionario.nome',
      'horas_trabalhadas': 'horas_trabalhadas',
      'horas_extras': 'horas_extras',
      'status': 'status',
      'created_at': 'created_at'
    };

    const validOrderDirections = ['asc', 'desc'];

    if (order_by && !validOrderFields[order_by]) {
      return res.status(400).json({
        success: false,
        message: `Campo de ordenação inválido. Campos válidos: ${Object.keys(validOrderFields).join(', ')}`
      });
    }

    if (order_direction && !validOrderDirections.includes(order_direction)) {
      return res.status(400).json({
        success: false,
        message: 'Direção de ordenação inválida. Use "asc" ou "desc"'
      });
    }

    // Validar busca textual
    if (search && search.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Termo de busca deve ter pelo menos 3 caracteres'
      });
    }

    // Validar filtros numéricos de horas extras
    if (horas_extras_min !== undefined) {
      const min = parseFloat(horas_extras_min);
      if (isNaN(min) || min < 0) {
        return res.status(400).json({
          success: false,
          message: 'horas_extras_min deve ser um número positivo'
        });
      }
    }

    if (horas_extras_max !== undefined) {
      const max = parseFloat(horas_extras_max);
      if (isNaN(max) || max < 0) {
        return res.status(400).json({
          success: false,
          message: 'horas_extras_max deve ser um número positivo'
        });
      }
    }

    if (horas_extras_min !== undefined && horas_extras_max !== undefined) {
      const min = parseFloat(horas_extras_min);
      const max = parseFloat(horas_extras_max);
      if (min > max) {
        return res.status(400).json({
          success: false,
          message: 'horas_extras_min não pode ser maior que horas_extras_max'
        });
      }
    }

    // ========================================
    // CONSTRUIR QUERY
    // ========================================

    let query = supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno, obra_atual_id),
        aprovador:usuarios!registros_ponto_aprovado_por_fkey(nome)
      `, { count: 'exact' });

    // ========================================
    // APLICAR FILTROS EXISTENTES
    // ========================================
    
    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id);
    }

    if (data_inicio) {
      query = query.gte('data', data_inicio);
    }

    if (data_fim) {
      query = query.lte('data', data_fim);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // ========================================
    // APLICAR NOVOS FILTROS
    // ========================================

    // Filtro de horas extras (range)
    if (horas_extras_min !== undefined) {
      query = query.gte('horas_extras', parseFloat(horas_extras_min));
    }

    if (horas_extras_max !== undefined) {
      query = query.lte('horas_extras', parseFloat(horas_extras_max));
    }

    // ========================================
    // APLICAR ORDENAÇÃO
    // ========================================
    
    const ascending = order_direction === 'asc';
    
    // Nota: Para ordenação por campos relacionados (funcionario.nome), 
    // o Supabase não suporta diretamente na query. 
    // Faremos a ordenação desses casos no código após buscar os dados.
    if (order_by === 'funcionario') {
      // Ordenar por nome do funcionário será feito após buscar os dados
      query = query.order('data', { ascending: false });
    } else {
      query = query.order(validOrderFields[order_by], { ascending });
      // Adicionar ordenação secundária por created_at para desempate
      if (order_by !== 'created_at') {
        query = query.order('created_at', { ascending: false });
      }
    }

    // ========================================
    // EXECUTAR QUERY PRINCIPAL
    // ========================================
    
    const { data: allData, error: queryError, count: totalCount } = await query;

    if (queryError) {
      console.error('Erro ao buscar registros de ponto:', queryError);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }

    let filteredData = allData || [];

    // ========================================
    // APLICAR FILTROS QUE REQUEREM DADOS RELACIONADOS
    // ========================================

    // Filtro por busca textual (aplicar nos dados retornados)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(registro => {
        const funcionarioNome = registro.funcionario?.nome?.toLowerCase() || '';
        const data = registro.data?.toLowerCase() || '';
        const status = registro.status?.toLowerCase() || '';
        const observacoes = registro.observacoes?.toLowerCase() || '';
        
        return funcionarioNome.includes(searchLower) ||
               data.includes(searchLower) ||
               status.includes(searchLower) ||
               observacoes.includes(searchLower);
      });
    }

    // Filtro por obra (através do funcionário)
    if (obra_id) {
      filteredData = filteredData.filter(registro => 
        registro.funcionario?.obra_atual_id === parseInt(obra_id)
      );
    }

    // Filtro por cargo
    if (cargo) {
      filteredData = filteredData.filter(registro => 
        registro.funcionario?.cargo === cargo
      );
    }

    // Filtro por turno
    if (turno) {
      filteredData = filteredData.filter(registro => 
        registro.funcionario?.turno === turno
      );
    }

    // Ordenação por nome do funcionário (se solicitado)
    if (order_by === 'funcionario') {
      filteredData.sort((a, b) => {
        const nomeA = a.funcionario?.nome || '';
        const nomeB = b.funcionario?.nome || '';
        return ascending ? nomeA.localeCompare(nomeB) : nomeB.localeCompare(nomeA);
      });
    }

    // ========================================
    // APLICAR PAGINAÇÃO NOS DADOS FILTRADOS
    // ========================================
    
    const totalFiltered = filteredData.length;
    const offset = (page - 1) * limit;
    const paginatedData = filteredData.slice(offset, offset + parseInt(limit));

    const data = paginatedData;
    const count = totalFiltered;

    // Se solicitado, recalcular dados inconsistentes
    if (recalcular === 'true') {
      const registrosRecalculados = await Promise.all(
        (data || []).map(async (registro) => {
          // Verificar se precisa recalcular (horas zeradas mas tem entrada e saída)
          if ((registro.horas_trabalhadas === 0 || registro.horas_trabalhadas === null) 
              && registro.entrada && registro.saida) {
            
            const horasTrabalhadas = calcularHorasTrabalhadas(
              registro.entrada,
              registro.saida,
              registro.saida_almoco,
              registro.volta_almoco
            );

            const horasExtras = calcularHorasExtras(horasTrabalhadas);
            const novoStatus = determinarStatus(
              registro.entrada,
              registro.saida,
              horasExtras,
              horasTrabalhadas
            );

            // Atualizar no banco
            await supabaseAdmin
              .from('registros_ponto')
              .update({
                horas_trabalhadas: horasTrabalhadas,
                horas_extras: horasExtras,
                status: novoStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', registro.id);

            return {
              ...registro,
              horas_trabalhadas: horasTrabalhadas,
              horas_extras: horasExtras,
              status: novoStatus
            };
          }
          return registro;
        })
      );

      return res.json({
        success: true,
        data: registrosRecalculados,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        },
        recalculated: true
      });
    }

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
    console.error('Erro na rota de listagem de registros:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/registros/estatisticas:
 *   get:
 *     summary: Obter estatísticas dos registros com filtros
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário para filtrar
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do período
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do período
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Status do registro
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: ID da obra para filtrar
 *       - in: query
 *         name: cargo
 *         schema:
 *           type: string
 *         description: Cargo do funcionário
 *       - in: query
 *         name: turno
 *         schema:
 *           type: string
 *         description: Turno do funcionário
 *     responses:
 *       200:
 *         description: Estatísticas dos registros
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
 *                     total_registros:
 *                       type: integer
 *                     total_horas_trabalhadas:
 *                       type: number
 *                     total_horas_extras:
 *                       type: number
 *                     por_status:
 *                       type: object
 *                     por_funcionario:
 *                       type: object
 *                     por_obra:
 *                       type: object
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/registros/estatisticas', async (req, res) => {
  try {
    const { 
      funcionario_id, 
      data_inicio, 
      data_fim, 
      status,
      obra_id,
      cargo,
      turno
    } = req.query;

    let query = supabaseAdmin
      .from('registros_ponto')
      .select(`
        id,
        horas_trabalhadas,
        horas_extras,
        status,
        funcionario:funcionarios!fk_registros_ponto_funcionario(id, nome, cargo, turno, obra_atual_id)
      `);

    // Aplicar mesmos filtros do endpoint principal
    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id);
    }
    
    if (data_inicio) {
      query = query.gte('data', data_inicio);
    }
    
    if (data_fim) {
      query = query.lte('data', data_fim);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar registros para estatísticas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    let filteredData = data || [];

    // Aplicar filtros adicionais por relacionamento
    if (obra_id) {
      filteredData = filteredData.filter(registro => 
        registro.funcionario?.obra_atual_id === parseInt(obra_id)
      );
    }

    if (cargo) {
      filteredData = filteredData.filter(registro => 
        registro.funcionario?.cargo === cargo
      );
    }

    if (turno) {
      filteredData = filteredData.filter(registro => 
        registro.funcionario?.turno === turno
      );
    }

    // Calcular estatísticas
    const estatisticas = {
      total_registros: filteredData.length,
      total_horas_trabalhadas: filteredData.reduce((sum, r) => sum + (r.horas_trabalhadas || 0), 0),
      total_horas_extras: filteredData.reduce((sum, r) => sum + (r.horas_extras || 0), 0),
      media_horas_trabalhadas: filteredData.length > 0 
        ? (filteredData.reduce((sum, r) => sum + (r.horas_trabalhadas || 0), 0) / filteredData.length).toFixed(2)
        : 0,
      media_horas_extras: filteredData.length > 0
        ? (filteredData.reduce((sum, r) => sum + (r.horas_extras || 0), 0) / filteredData.length).toFixed(2)
        : 0,
      por_status: {},
      por_funcionario: {},
      por_obra: {}
    };

    // Agrupar por status
    filteredData.forEach(registro => {
      const statusKey = registro.status || 'Indefinido';
      if (!estatisticas.por_status[statusKey]) {
        estatisticas.por_status[statusKey] = {
          quantidade: 0,
          horas_trabalhadas: 0,
          horas_extras: 0
        };
      }
      estatisticas.por_status[statusKey].quantidade++;
      estatisticas.por_status[statusKey].horas_trabalhadas += registro.horas_trabalhadas || 0;
      estatisticas.por_status[statusKey].horas_extras += registro.horas_extras || 0;
    });

    // Agrupar por funcionário
    filteredData.forEach(registro => {
      const funcionarioId = registro.funcionario?.id;
      const funcionarioNome = registro.funcionario?.nome || 'Desconhecido';
      
      if (!estatisticas.por_funcionario[funcionarioId]) {
        estatisticas.por_funcionario[funcionarioId] = {
          nome: funcionarioNome,
          cargo: registro.funcionario?.cargo || '-',
          registros: 0,
          horas_trabalhadas: 0,
          horas_extras: 0
        };
      }
      estatisticas.por_funcionario[funcionarioId].registros++;
      estatisticas.por_funcionario[funcionarioId].horas_trabalhadas += registro.horas_trabalhadas || 0;
      estatisticas.por_funcionario[funcionarioId].horas_extras += registro.horas_extras || 0;
    });

    // Agrupar por obra
    filteredData.forEach(registro => {
      const obraId = registro.funcionario?.obra_atual_id || 'Sem obra';
      
      if (!estatisticas.por_obra[obraId]) {
        estatisticas.por_obra[obraId] = {
          registros: 0,
          horas_trabalhadas: 0,
          horas_extras: 0,
          funcionarios: new Set()
        };
      }
      estatisticas.por_obra[obraId].registros++;
      estatisticas.por_obra[obraId].horas_trabalhadas += registro.horas_trabalhadas || 0;
      estatisticas.por_obra[obraId].horas_extras += registro.horas_extras || 0;
      if (registro.funcionario?.id) {
        estatisticas.por_obra[obraId].funcionarios.add(registro.funcionario.id);
      }
    });

    // Converter Set de funcionários para contagem
    Object.keys(estatisticas.por_obra).forEach(obraId => {
      estatisticas.por_obra[obraId].total_funcionarios = estatisticas.por_obra[obraId].funcionarios.size;
      delete estatisticas.por_obra[obraId].funcionarios;
    });

    res.json({
      success: true,
      data: estatisticas
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/registros/calcular:
 *   post:
 *     summary: Recalcula horas trabalhadas e status de registros
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               funcionario_id:
 *                 type: integer
 *                 description: ID do funcionário (opcional)
 *               data_inicio:
 *                 type: string
 *                 format: date
 *                 description: Data de início do período (opcional)
 *               data_fim:
 *                 type: string
 *                 format: date
 *                 description: Data de fim do período (opcional)
 *               recalcular_todos:
 *                 type: boolean
 *                 default: false
 *                 description: Se true, recalcula todos os registros. Se false, apenas registros com problemas
 *     responses:
 *       200:
 *         description: Registros recalculados com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/registros/calcular', async (req, res) => {
  try {
    const { funcionario_id, data_inicio, data_fim, recalcular_todos = false } = req.body;

    let query = supabaseAdmin
      .from('registros_ponto')
      .select('*');

    // Aplicar filtros se fornecidos
    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id);
    }

    if (data_inicio) {
      query = query.gte('data', data_inicio);
    }

    if (data_fim) {
      query = query.lte('data', data_fim);
    }

    // Se não for para recalcular todos, pegar apenas registros com problemas
    if (!recalcular_todos) {
      query = query.or('horas_trabalhadas.is.null,horas_trabalhadas.eq.0');
    }

    const { data: registros, error } = await query;

    if (error) {
      console.error('Erro ao buscar registros:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar registros',
        error: error.message
      });
    }

    let atualizados = 0;
    const erros = [];

    for (const registro of registros) {
      try {
        // Calcular horas trabalhadas
        const horasTrabalhadas = calcularHorasTrabalhadas(
          registro.entrada,
          registro.saida,
          registro.saida_almoco,
          registro.volta_almoco
        );

        // Calcular horas extras
        const horasExtras = calcularHorasExtras(horasTrabalhadas);

        // Determinar status
        const status = determinarStatus(
          registro.entrada,
          registro.saida,
          horasExtras,
          horasTrabalhadas
        );

        // Atualizar registro
        const { error: updateError } = await supabaseAdmin
          .from('registros_ponto')
          .update({
            horas_trabalhadas: horasTrabalhadas,
            horas_extras: horasExtras,
            status: status,
            updated_at: new Date().toISOString()
          })
          .eq('id', registro.id);

        if (updateError) {
          erros.push({
            id: registro.id,
            error: updateError.message
          });
        } else {
          atualizados++;
        }
      } catch (error) {
        erros.push({
          id: registro.id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `${atualizados} registro(s) atualizado(s)`,
      atualizados,
      total: registros.length,
      erros: erros.length > 0 ? erros : undefined
    });

  } catch (error) {
    console.error('Erro ao recalcular registros:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/registros/validar:
 *   get:
 *     summary: Valida consistência dos registros de ponto
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário (opcional)
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do período (opcional)
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do período (opcional)
 *     responses:
 *       200:
 *         description: Estatísticas de validação dos registros
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/registros/validar', async (req, res) => {
  try {
    const { funcionario_id, data_inicio, data_fim } = req.query;

    let query = supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno)
      `);

    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id);
    }

    if (data_inicio) {
      query = query.gte('data', data_inicio);
    }

    if (data_fim) {
      query = query.lte('data', data_fim);
    }

    const { data: registros, error } = await query;

    if (error) {
      console.error('Erro ao buscar registros:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar registros',
        error: error.message
      });
    }

    const problemas = [];
    const estatisticas = {
      total: registros.length,
      com_problemas: 0,
      sem_entrada: 0,
      sem_saida: 0,
      horas_zeradas: 0,
      status_inconsistente: 0,
      horarios_iguais: 0
    };

    for (const registro of registros) {
      const problemasRegistro = [];

      // Verificar entrada
      if (!registro.entrada) {
        problemasRegistro.push('Sem entrada registrada');
        estatisticas.sem_entrada++;
      }

      // Verificar saída
      if (!registro.saida) {
        problemasRegistro.push('Sem saída registrada');
        estatisticas.sem_saida++;
      }

      // Verificar horas trabalhadas
      if (registro.entrada && registro.saida && 
          (registro.horas_trabalhadas === 0 || registro.horas_trabalhadas === null)) {
        problemasRegistro.push('Horas trabalhadas zeradas com entrada e saída');
        estatisticas.horas_zeradas++;
      }

      // Verificar status
      if (!registro.status) {
        problemasRegistro.push('Status não definido');
        estatisticas.status_inconsistente++;
      }

      // Verificar horários iguais (possível erro de registro)
      if (registro.entrada && registro.saida && 
          registro.entrada === registro.saida) {
        problemasRegistro.push('Horário de entrada igual ao de saída');
        estatisticas.horarios_iguais++;
      }

      // Verificar se entrada = saida_almoco = volta_almoco = saida
      if (registro.entrada && registro.saida && 
          registro.saida_almoco && registro.volta_almoco &&
          registro.entrada === registro.saida_almoco &&
          registro.entrada === registro.volta_almoco &&
          registro.entrada === registro.saida) {
        problemasRegistro.push('Todos os horários são iguais');
        if (!estatisticas.horarios_iguais) {
          estatisticas.horarios_iguais++;
        }
      }

      if (problemasRegistro.length > 0) {
        problemas.push({
          id: registro.id,
          funcionario: registro.funcionario?.nome || 'Desconhecido',
          data: registro.data,
          problemas: problemasRegistro
        });
        estatisticas.com_problemas++;
      }
    }

    res.json({
      success: true,
      estatisticas,
      problemas: problemas.slice(0, 100), // Limitar a 100 problemas na resposta
      total_problemas: problemas.length
    });

  } catch (error) {
    console.error('Erro ao validar registros:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/registros/{id}:
 *   get:
 *     summary: Busca um registro específico por ID
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do registro de ponto
 *     responses:
 *       200:
 *         description: Dados do registro de ponto
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
 *                       type: string
 *                       description: ID do registro
 *                     funcionario_id:
 *                       type: integer
 *                       description: ID do funcionário
 *                     data:
 *                       type: string
 *                       format: date
 *                       description: Data do registro
 *                     entrada:
 *                       type: string
 *                       format: time
 *                       description: Horário de entrada
 *                     saida_almoco:
 *                       type: string
 *                       format: time
 *                       description: Horário de saída para almoço
 *                     volta_almoco:
 *                       type: string
 *                       format: time
 *                       description: Horário de volta do almoço
 *                     saida:
 *                       type: string
 *                       format: time
 *                       description: Horário de saída
 *                     horas_trabalhadas:
 *                       type: number
 *                       description: Total de horas trabalhadas
 *                     horas_extras:
 *                       type: number
 *                       description: Total de horas extras
 *                     status:
 *                       type: string
 *                       description: Status do registro
 *                     observacoes:
 *                       type: string
 *                       description: Observações do registro
 *                     localizacao:
 *                       type: string
 *                       description: Localização do registro
 *                     funcionario:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *                         cargo:
 *                           type: string
 *                         turno:
 *                           type: string
 *                     aprovador:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *       404:
 *         description: Registro não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/registros/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno),
        aprovador:usuarios!registros_ponto_aprovado_por_fkey(nome)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: 'Registro não encontrado' 
        });
      }
      console.error('Erro ao buscar registro:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Erro na rota de busca de registro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/registros:
 *   post:
 *     summary: Cria um novo registro de ponto
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - funcionario_id
 *               - data
 *             properties:
 *               funcionario_id:
 *                 type: integer
 *                 description: ID do funcionário
 *               data:
 *                 type: string
 *                 format: date
 *                 description: Data do registro (YYYY-MM-DD)
 *               entrada:
 *                 type: string
 *                 format: time
 *                 description: Horário de entrada (HH:MM)
 *               saida_almoco:
 *                 type: string
 *                 format: time
 *                 description: Horário de saída para almoço (HH:MM)
 *               volta_almoco:
 *                 type: string
 *                 format: time
 *                 description: Horário de volta do almoço (HH:MM)
 *               saida:
 *                 type: string
 *                 format: time
 *                 description: Horário de saída (HH:MM)
 *               observacoes:
 *                 type: string
 *                 description: Observações do registro
 *               localizacao:
 *                 type: string
 *                 description: Localização do registro
 *     responses:
 *       201:
 *         description: Registro de ponto criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados do registro criado
 *                 message:
 *                   type: string
 *       200:
 *         description: Registro de ponto atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados do registro atualizado
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos ou funcionário/data obrigatórios
 *       404:
 *         description: Funcionário não encontrado ou inativo
 *       409:
 *         description: Conflito - registro já existe ou sequência inválida
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/registros', async (req, res) => {
  try {
    const {
      funcionario_id,
      data,
      entrada,
      saida_almoco,
      volta_almoco,
      saida,
      observacoes,
      localizacao
    } = req.body;

    // Validações
    if (!funcionario_id || !data) {
      return res.status(400).json({
        success: false,
        message: 'Funcionário e data são obrigatórios'
      });
    }

    // Verificar se o funcionário existe na tabela funcionarios
    const { data: funcionario, error: funcionarioError } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, status')
      .eq('id', funcionario_id)
      .eq('status', 'Ativo')
      .single();

    if (funcionarioError || !funcionario) {
      return res.status(404).json({
        success: false,
        message: 'Funcionário não encontrado ou inativo'
      });
    }

    if (!validarData(data)) {
      return res.status(400).json({
        success: false,
        message: 'Data inválida. Use o formato YYYY-MM-DD'
      });
    }

    // Validar horários se fornecidos
    if (entrada && !validarHorario(entrada)) {
      return res.status(400).json({
        success: false,
        message: 'Horário de entrada inválido'
      });
    }

    if (saida_almoco && !validarHorario(saida_almoco)) {
      return res.status(400).json({
        success: false,
        message: 'Horário de saída para almoço inválido'
      });
    }

    if (volta_almoco && !validarHorario(volta_almoco)) {
      return res.status(400).json({
        success: false,
        message: 'Horário de volta do almoço inválido'
      });
    }

    if (saida && !validarHorario(saida)) {
      return res.status(400).json({
        success: false,
        message: 'Horário de saída inválido'
      });
    }

    // Verificar se já existe registro para este funcionário nesta data
    const { data: existingRecord } = await supabaseAdmin
      .from('registros_ponto')
      .select('id, entrada, saida, saida_almoco, volta_almoco, status')
      .eq('funcionario_id', funcionario_id)
      .eq('data', data)
      .single();

    if (existingRecord) {
      // Se está tentando registrar uma entrada e já existe uma entrada sem saída
      if (entrada && existingRecord.entrada && !existingRecord.saida) {
        return res.status(409).json({
          success: false,
          message: 'Não é possível registrar uma nova entrada. O funcionário já possui uma entrada registrada sem saída. Registre a saída primeiro.'
        });
      }

      // Se está tentando registrar saída para almoço e já existe uma entrada para almoço sem volta
      if (saida_almoco && existingRecord.saida_almoco && !existingRecord.volta_almoco) {
        return res.status(409).json({
          success: false,
          message: 'Não é possível registrar uma nova saída para almoço. O funcionário já possui uma saída para almoço registrada sem volta. Registre a volta do almoço primeiro.'
        });
      }

      // Se está tentando registrar volta do almoço sem ter saída para almoço
      if (volta_almoco && !existingRecord.saida_almoco) {
        return res.status(409).json({
          success: false,
          message: 'Não é possível registrar volta do almoço sem ter registrado a saída para almoço primeiro.'
        });
      }

      // Se está tentando registrar saída sem ter entrada
      if (saida && !existingRecord.entrada) {
        return res.status(409).json({
          success: false,
          message: 'Não é possível registrar saída sem ter registrado a entrada primeiro.'
        });
      }

      // Se está tentando registrar saída e já existe uma saída
      if (saida && existingRecord.saida) {
        return res.status(409).json({
          success: false,
          message: 'Já existe uma saída registrada para este funcionário nesta data.'
        });
      }

      // Se chegou até aqui, é uma atualização válida do registro existente
      // Preparar dados para atualização
      const dadosAtualizacao = {
        updated_at: new Date().toISOString()
      };

      // Adicionar apenas os campos que foram fornecidos
      if (entrada) dadosAtualizacao.entrada = entrada;
      if (saida_almoco) dadosAtualizacao.saida_almoco = saida_almoco;
      if (volta_almoco) dadosAtualizacao.volta_almoco = volta_almoco;
      if (saida) dadosAtualizacao.saida = saida;
      if (observacoes) dadosAtualizacao.observacoes = observacoes;
      if (localizacao) dadosAtualizacao.localizacao = localizacao;

      // Recalcular horas trabalhadas e extras com os dados atualizados
      const entradaFinal = entrada || existingRecord.entrada;
      const saidaFinal = saida || existingRecord.saida;
      const saidaAlmocoFinal = saida_almoco || existingRecord.saida_almoco;
      const voltaAlmocoFinal = volta_almoco || existingRecord.volta_almoco;

      const horasTrabalhadas = calcularHorasTrabalhadas(entradaFinal, saidaFinal, saidaAlmocoFinal, voltaAlmocoFinal);
      const horasExtras = calcularHorasExtras(horasTrabalhadas);
      const status = determinarStatus(entradaFinal, saidaFinal, horasExtras);

      dadosAtualizacao.horas_trabalhadas = horasTrabalhadas;
      dadosAtualizacao.horas_extras = horasExtras;
      dadosAtualizacao.status = status;

      // Atualizar registro existente
      const { data: registro, error } = await supabaseAdmin
        .from('registros_ponto')
        .update(dadosAtualizacao)
        .eq('id', existingRecord.id)
        .select(`
          *,
          funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno)
        `)
        .single();

      if (error) {
        console.error('Erro ao atualizar registro:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro ao atualizar registro de ponto'
        });
      }

      // Criar aprovação automática de horas extras se houver
      if (horasExtras > 0 && registro.obra_id) {
        try {
          console.log(`[ponto-eletronico] Detectadas ${horasExtras}h extras, criando aprovação...`);
          const supervisor = await buscarSupervisorPorObra(registro.obra_id);
          if (supervisor) {
            const dataLimite = calcularDataLimite();
            const { data: aprovacaoCriada } = await supabaseAdmin
              .from('aprovacoes_horas_extras')
              .insert({
                registro_ponto_id: registro.id,
                funcionario_id: registro.funcionario_id,
                supervisor_id: supervisor.id,
                horas_extras: horasExtras,
                data_trabalho: registro.data,
                data_limite: dataLimite.toISOString(),
                status: 'pendente',
                observacoes: `Criado automaticamente ao registrar saída com ${horasExtras}h extras`
              })
              .select()
              .single();
            if (aprovacaoCriada) {
              await supabaseAdmin.from('registros_ponto').update({ aprovacao_horas_extras_id: aprovacaoCriada.id }).eq('id', registro.id);
              try {
                await criarNotificacaoNovaAprovacao(aprovacaoCriada, { id: registro.funcionario_id, nome: registro.funcionario?.nome || 'Funcionário' });
              } catch (notifError) {
                console.error('[ponto-eletronico] Erro ao criar notificação:', notifError);
              }
            }
          }
        } catch (errorHorasExtras) {
          console.error('[ponto-eletronico] Erro ao processar horas extras:', errorHorasExtras);
        }
      }

      return res.status(200).json({
        success: true,
        data: registro,
        message: 'Registro de ponto atualizado com sucesso'
      });
    }

    // Se não existe registro, criar um novo
    // Calcular horas trabalhadas e extras
    const horasTrabalhadas = calcularHorasTrabalhadas(entrada, saida, saida_almoco, volta_almoco);
    const horasExtras = calcularHorasExtras(horasTrabalhadas);
    const status = determinarStatus(entrada, saida, horasExtras);

    // Criar registro
    const novoRegistro = {
      id: gerarIdRegistro(),
      funcionario_id,
      data,
      entrada,
      saida_almoco,
      volta_almoco,
      saida,
      horas_trabalhadas: horasTrabalhadas,
      horas_extras: horasExtras,
      status,
      observacoes,
      localizacao,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: registro, error } = await supabaseAdmin
      .from('registros_ponto')
      .insert([novoRegistro])
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno)
      `)
      .single();

    if (error) {
      console.error('Erro ao criar registro:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar registro de ponto'
      });
    }

    // Criar aprovação automática de horas extras se houver
    if (horasExtras > 0 && registro.obra_id) {
      try {
        console.log(`[ponto-eletronico] Detectadas ${horasExtras}h extras, criando aprovação...`);
        const supervisor = await buscarSupervisorPorObra(registro.obra_id);
        if (supervisor) {
          const dataLimite = calcularDataLimite();
          const { data: aprovacaoCriada } = await supabaseAdmin
            .from('aprovacoes_horas_extras')
            .insert({
              registro_ponto_id: registro.id,
              funcionario_id: registro.funcionario_id,
              supervisor_id: supervisor.id,
              horas_extras: horasExtras,
              data_trabalho: registro.data,
              data_limite: dataLimite.toISOString(),
              status: 'pendente',
              observacoes: `Criado automaticamente ao registrar saída com ${horasExtras}h extras`
            })
            .select()
            .single();
          if (aprovacaoCriada) {
            await supabaseAdmin.from('registros_ponto').update({ aprovacao_horas_extras_id: aprovacaoCriada.id }).eq('id', registro.id);
            try {
              await criarNotificacaoNovaAprovacao(aprovacaoCriada, { id: registro.funcionario_id, nome: registro.funcionario?.nome || 'Funcionário' });
            } catch (notifError) {
              console.error('[ponto-eletronico] Erro ao criar notificação:', notifError);
            }
          }
        }
      } catch (errorHorasExtras) {
        console.error('[ponto-eletronico] Erro ao processar horas extras:', errorHorasExtras);
      }
    }

    res.status(201).json({
      success: true,
      data: registro,
      message: 'Registro de ponto criado com sucesso'
    });

  } catch (error) {
    console.error('Erro na rota de criação de registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/registros/{id}:
 *   put:
 *     summary: Atualiza um registro de ponto existente
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do registro de ponto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - justificativa_alteracao
 *             properties:
 *               entrada:
 *                 type: string
 *                 format: time
 *                 description: Horário de entrada (HH:MM)
 *               saida_almoco:
 *                 type: string
 *                 format: time
 *                 description: Horário de saída para almoço (HH:MM)
 *               volta_almoco:
 *                 type: string
 *                 format: time
 *                 description: Horário de volta do almoço (HH:MM)
 *               saida:
 *                 type: string
 *                 format: time
 *                 description: Horário de saída (HH:MM)
 *               observacoes:
 *                 type: string
 *                 description: Observações do registro
 *               localizacao:
 *                 type: string
 *                 description: Localização do registro
 *               justificativa_alteracao:
 *                 type: string
 *                 description: Justificativa para a alteração
 *     responses:
 *       200:
 *         description: Registro de ponto atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados do registro atualizado
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos ou justificativa obrigatória
 *       404:
 *         description: Registro não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/registros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      entrada,
      saida_almoco,
      volta_almoco,
      saida,
      observacoes,
      localizacao,
      justificativa_alteracao,
      status
    } = req.body;

    // Buscar registro atual
    const { data: registroAtual, error: errorBusca } = await supabaseAdmin
      .from('registros_ponto')
      .select('*')
      .eq('id', id)
      .single();

    if (errorBusca) {
      if (errorBusca.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Registro não encontrado'
        });
      }
      console.error('Erro ao buscar registro:', errorBusca);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // Validar justificativa se fornecida
    if (!justificativa_alteracao) {
      return res.status(400).json({
        success: false,
        message: 'Justificativa da alteração é obrigatória'
      });
    }

    // Validar horários se fornecidos
    if (entrada && !validarHorario(entrada)) {
      return res.status(400).json({
        success: false,
        message: 'Horário de entrada inválido'
      });
    }

    if (saida_almoco && !validarHorario(saida_almoco)) {
      return res.status(400).json({
        success: false,
        message: 'Horário de saída para almoço inválido'
      });
    }

    if (volta_almoco && !validarHorario(volta_almoco)) {
      return res.status(400).json({
        success: false,
        message: 'Horário de volta do almoço inválido'
      });
    }

    if (saida && !validarHorario(saida)) {
      return res.status(400).json({
        success: false,
        message: 'Horário de saída inválido'
      });
    }

    // Normalizar horários (remover segundos se existir)
    const entradaNormalizada = entrada ? normalizarHorario(entrada) : null;
    const saidaNormalizada = saida ? normalizarHorario(saida) : null;
    const saidaAlmocoNormalizada = saida_almoco ? normalizarHorario(saida_almoco) : null;
    const voltaAlmocoNormalizada = volta_almoco ? normalizarHorario(volta_almoco) : null;

    // Calcular novas horas trabalhadas e extras
    const novaEntrada = entradaNormalizada || registroAtual.entrada;
    const novaSaida = saidaNormalizada || registroAtual.saida;
    const novaSaidaAlmoco = saidaAlmocoNormalizada || registroAtual.saida_almoco;
    const novaVoltaAlmoco = voltaAlmocoNormalizada || registroAtual.volta_almoco;

    const horasTrabalhadas = calcularHorasTrabalhadas(novaEntrada, novaSaida, novaSaidaAlmoco, novaVoltaAlmoco);
    const horasExtras = calcularHorasExtras(horasTrabalhadas);
    
    // Usar status fornecido se for "Aprovado" ou "Rejeitado", senão calcular automaticamente
    const novoStatus = (status === 'Aprovado' || status === 'Rejeitado') 
      ? status 
      : determinarStatus(novaEntrada, novaSaida, horasExtras);

    // Dados atualizados
    const dadosAtualizados = {
      entrada: novaEntrada,
      saida_almoco: novaSaidaAlmoco,
      volta_almoco: novaVoltaAlmoco,
      saida: novaSaida,
      horas_trabalhadas: horasTrabalhadas,
      horas_extras: horasExtras,
      status: novoStatus,
      observacoes: observacoes || registroAtual.observacoes,
      localizacao: localizacao || registroAtual.localizacao,
      updated_at: new Date().toISOString()
    };

    // Atualizar registro
    const { data: registroAtualizado, error: errorUpdate } = await supabaseAdmin
      .from('registros_ponto')
      .update(dadosAtualizados)
      .eq('id', id)
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno)
      `)
      .single();

    if (errorUpdate) {
      console.error('Erro ao atualizar registro:', errorUpdate);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar registro de ponto'
      });
    }

    // Criar aprovação automática de horas extras se houver
    if (horasExtras > 0 && registroAtualizado.obra_id) {
      try {
        console.log(`[ponto-eletronico] Detectadas ${horasExtras}h extras, criando aprovação...`);
        
        // Buscar supervisor da obra
        const supervisor = await buscarSupervisorPorObra(registroAtualizado.obra_id);
        
        if (supervisor) {
          const dataLimite = calcularDataLimite();
          
          // Criar aprovação
          const { data: aprovacaoCriada, error: errorAprovacao } = await supabaseAdmin
            .from('aprovacoes_horas_extras')
            .insert({
              registro_ponto_id: registroAtualizado.id,
              funcionario_id: registroAtualizado.funcionario_id,
              supervisor_id: supervisor.id,
              horas_extras: horasExtras,
              data_trabalho: registroAtualizado.data,
              data_limite: dataLimite.toISOString(),
              status: 'pendente',
              observacoes: `Criado automaticamente ao registrar saída com ${horasExtras}h extras`
            })
            .select()
            .single();

          if (errorAprovacao) {
            console.error('[ponto-eletronico] Erro ao criar aprovação de horas extras:', errorAprovacao);
          } else {
            console.log('[ponto-eletronico] Aprovação de horas extras criada:', aprovacaoCriada.id);
            
            // Atualizar registro de ponto com ID da aprovação
            await supabaseAdmin
              .from('registros_ponto')
              .update({ aprovacao_horas_extras_id: aprovacaoCriada.id })
              .eq('id', registroAtualizado.id);
            
            // Criar notificação para supervisor
            try {
              const funcionario = { 
                id: registroAtualizado.funcionario_id, 
                nome: registroAtualizado.funcionario?.nome || 'Funcionário' 
              };
              await criarNotificacaoNovaAprovacao(aprovacaoCriada, funcionario);
              console.log('[ponto-eletronico] Notificação criada para supervisor');
            } catch (notifError) {
              console.error('[ponto-eletronico] Erro ao criar notificação:', notifError);
            }
          }
        } else {
          console.warn(`[ponto-eletronico] Supervisor não encontrado para obra ${registroAtualizado.obra_id}`);
        }
      } catch (errorHorasExtras) {
        console.error('[ponto-eletronico] Erro ao processar horas extras:', errorHorasExtras);
        // Não bloquear o registro por erro na aprovação de horas extras
      }
    }

    // Registrar alteração no histórico
    const alteracoes = [];
    if (entradaNormalizada && entradaNormalizada !== registroAtual.entrada) {
      alteracoes.push({
        campo_alterado: 'entrada',
        valor_anterior: registroAtual.entrada,
        valor_novo: entradaNormalizada
      });
    }
    if (saidaAlmocoNormalizada && saidaAlmocoNormalizada !== registroAtual.saida_almoco) {
      alteracoes.push({
        campo_alterado: 'saida_almoco',
        valor_anterior: registroAtual.saida_almoco,
        valor_novo: saidaAlmocoNormalizada
      });
    }
    if (voltaAlmocoNormalizada && voltaAlmocoNormalizada !== registroAtual.volta_almoco) {
      alteracoes.push({
        campo_alterado: 'volta_almoco',
        valor_anterior: registroAtual.volta_almoco,
        valor_novo: voltaAlmocoNormalizada
      });
    }
    if (saidaNormalizada && saidaNormalizada !== registroAtual.saida) {
      alteracoes.push({
        campo_alterado: 'saida',
        valor_anterior: registroAtual.saida,
        valor_novo: saidaNormalizada
      });
    }

    // Inserir histórico de alterações
    if (alteracoes.length > 0) {
      const historicoAlteracoes = alteracoes.map(alteracao => ({
        id: gerarIdRegistro('HIST'),
        registro_ponto_id: id,
        campo_alterado: alteracao.campo_alterado,
        valor_anterior: alteracao.valor_anterior,
        valor_novo: alteracao.valor_novo,
        justificativa_alteracao: justificativa_alteracao,
        alterado_por: req.user.id,
        data_alteracao: new Date().toISOString()
      }));

      await supabaseAdmin
        .from('historico_alteracoes_ponto')
        .insert(historicoAlteracoes);
    }

    res.json({
      success: true,
      data: registroAtualizado,
      message: 'Registro de ponto atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro na rota de atualização de registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/registros/{id}/aprovar:
 *   post:
 *     summary: Aprova horas extras de um registro
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do registro de ponto
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               observacoes_aprovacao:
 *                 type: string
 *                 description: Observações da aprovação
 *     responses:
 *       200:
 *         description: Horas extras aprovadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados do registro aprovado
 *                 message:
 *                   type: string
 *       400:
 *         description: Registro não está pendente de aprovação
 *       404:
 *         description: Registro não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/registros/:id/aprovar', async (req, res) => {
  try {
    const { id } = req.params;
    const { observacoes_aprovacao } = req.body;

    // Buscar registro
    const { data: registro, error: errorBusca } = await supabaseAdmin
      .from('registros_ponto')
      .select('*')
      .eq('id', id)
      .single();

    if (errorBusca) {
      if (errorBusca.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Registro não encontrado'
        });
      }
      console.error('Erro ao buscar registro:', errorBusca);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    if (registro.status !== 'Pendente Aprovação') {
      return res.status(400).json({
        success: false,
        message: 'Este registro não está pendente de aprovação'
      });
    }

    // Atualizar registro
    const { data: registroAtualizado, error: errorUpdate } = await supabaseAdmin
      .from('registros_ponto')
      .update({
        status: 'Aprovado',
        aprovado_por: req.user.id,
        data_aprovacao: new Date().toISOString(),
        observacoes: observacoes_aprovacao || registro.observacoes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno),
        aprovador:usuarios!registros_ponto_aprovado_por_fkey(nome)
      `)
      .single();

    if (errorUpdate) {
      console.error('Erro ao aprovar registro:', errorUpdate);
      return res.status(500).json({
        success: false,
        message: 'Erro ao aprovar registro'
      });
    }

    res.json({
      success: true,
      data: registroAtualizado,
      message: 'Horas extras aprovadas com sucesso'
    });

  } catch (error) {
    console.error('Erro na rota de aprovação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/registros/{id}/rejeitar:
 *   post:
 *     summary: Rejeita horas extras de um registro
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do registro de ponto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - motivo_rejeicao
 *             properties:
 *               motivo_rejeicao:
 *                 type: string
 *                 description: Motivo da rejeição
 *     responses:
 *       200:
 *         description: Horas extras rejeitadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados do registro rejeitado
 *                 message:
 *                   type: string
 *       400:
 *         description: Motivo da rejeição é obrigatório ou registro não está pendente
 *       404:
 *         description: Registro não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/registros/:id/rejeitar', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_rejeicao } = req.body;

    if (!motivo_rejeicao) {
      return res.status(400).json({
        success: false,
        message: 'Motivo da rejeição é obrigatório'
      });
    }

    // Buscar registro
    const { data: registro, error: errorBusca } = await supabaseAdmin
      .from('registros_ponto')
      .select('*')
      .eq('id', id)
      .single();

    if (errorBusca) {
      if (errorBusca.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Registro não encontrado'
        });
      }
      console.error('Erro ao buscar registro:', errorBusca);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    if (registro.status !== 'Pendente Aprovação') {
      return res.status(400).json({
        success: false,
        message: 'Este registro não está pendente de aprovação'
      });
    }

    // Atualizar registro
    const { data: registroAtualizado, error: errorUpdate } = await supabaseAdmin
      .from('registros_ponto')
      .update({
        status: 'Rejeitado',
        aprovado_por: req.user.id,
        data_aprovacao: new Date().toISOString(),
        observacoes: `${registro.observacoes || ''}\n\nMotivo da rejeição: ${motivo_rejeicao}`.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno),
        aprovador:usuarios!registros_ponto_aprovado_por_fkey(nome)
      `)
      .single();

    if (errorUpdate) {
      console.error('Erro ao rejeitar registro:', errorUpdate);
      return res.status(500).json({
        success: false,
        message: 'Erro ao rejeitar registro'
      });
    }

    res.json({
      success: true,
      data: registroAtualizado,
      message: 'Horas extras rejeitadas'
    });

  } catch (error) {
    console.error('Erro na rota de rejeição:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/justificativas:
 *   get:
 *     summary: Lista justificativas com filtros opcionais
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário para filtrar
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do período (YYYY-MM-DD)
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do período (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pendente, Aprovada, Rejeitada]
 *         description: Status da justificativa
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [Atraso, Falta, Saída Antecipada, Ausência Parcial]
 *         description: Tipo da justificativa
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
 *         description: Limite de registros por página
 *     responses:
 *       200:
 *         description: Lista de justificativas
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
 *                         type: string
 *                         description: ID da justificativa
 *                       funcionario_id:
 *                         type: integer
 *                         description: ID do funcionário
 *                       data:
 *                         type: string
 *                         format: date
 *                         description: Data da justificativa
 *                       tipo:
 *                         type: string
 *                         description: Tipo da justificativa
 *                       motivo:
 *                         type: string
 *                         description: Motivo da justificativa
 *                       status:
 *                         type: string
 *                         description: Status da justificativa
 *                       aprovado_por:
 *                         type: integer
 *                         description: ID do usuário que aprovou
 *                       data_aprovacao:
 *                         type: string
 *                         format: date-time
 *                         description: Data da aprovação
 *                       funcionario:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                           cargo:
 *                             type: string
 *                           turno:
 *                             type: string
 *                       aprovador:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
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
router.get('/justificativas', async (req, res) => {
  try {
    const { 
      funcionario_id, 
      data_inicio, 
      data_fim, 
      status, 
      tipo,
      page = 1, 
      limit = 50 
    } = req.query;

    let query = supabaseAdmin
      .from('justificativas')
      .select(`
        *,
        funcionario:funcionarios!fk_justificativas_funcionario(nome, cargo, turno),
        aprovador:usuarios!justificativas_aprovado_por_fkey(nome)
      `)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id);
    }

    if (data_inicio) {
      query = query.gte('data', data_inicio);
    }

    if (data_fim) {
      query = query.lte('data', data_fim);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar justificativas:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }

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
    console.error('Erro na rota de listagem de justificativas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/justificativas:
 *   post:
 *     summary: Cria uma nova justificativa
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - funcionario_id
 *               - data
 *               - tipo
 *               - motivo
 *             properties:
 *               funcionario_id:
 *                 type: integer
 *                 description: ID do funcionário
 *               data:
 *                 type: string
 *                 format: date
 *                 description: Data da justificativa (YYYY-MM-DD)
 *               tipo:
 *                 type: string
 *                 enum: [Atraso, Falta, Saída Antecipada, Ausência Parcial]
 *                 description: Tipo da justificativa
 *               motivo:
 *                 type: string
 *                 description: Motivo da justificativa
 *     responses:
 *       201:
 *         description: Justificativa criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados da justificativa criada
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos ou campos obrigatórios
 *       404:
 *         description: Funcionário não encontrado ou inativo
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/justificativas', async (req, res) => {
  try {
    const {
      funcionario_id,
      data,
      tipo,
      motivo
    } = req.body;

    // Validações
    if (!funcionario_id || !data || !tipo || !motivo) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }

    // Verificar se o funcionário existe na tabela funcionarios
    const { data: funcionario, error: funcionarioError } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, status')
      .eq('id', funcionario_id)
      .eq('status', 'Ativo')
      .single();

    if (funcionarioError || !funcionario) {
      return res.status(404).json({
        success: false,
        message: 'Funcionário não encontrado ou inativo'
      });
    }

    if (!validarData(data)) {
      return res.status(400).json({
        success: false,
        message: 'Data inválida. Use o formato YYYY-MM-DD'
      });
    }

    const tiposValidos = ['Atraso', 'Falta', 'Saída Antecipada', 'Ausência Parcial'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de justificativa inválido'
      });
    }

    // Criar justificativa
    const novaJustificativa = {
      id: gerarIdJustificativa(),
      funcionario_id,
      data,
      tipo,
      motivo,
      status: 'Pendente',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: justificativa, error } = await supabaseAdmin
      .from('justificativas')
      .insert([novaJustificativa])
      .select(`
        *,
        funcionario:funcionarios!fk_justificativas_funcionario(nome, cargo, turno)
      `)
      .single();

    if (error) {
      console.error('Erro ao criar justificativa:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar justificativa'
      });
    }

    res.status(201).json({
      success: true,
      data: justificativa,
      message: 'Justificativa criada com sucesso'
    });

  } catch (error) {
    console.error('Erro na rota de criação de justificativa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/justificativas/{id}/aprovar:
 *   post:
 *     summary: Aprova uma justificativa
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da justificativa
 *     responses:
 *       200:
 *         description: Justificativa aprovada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados da justificativa aprovada
 *                 message:
 *                   type: string
 *       400:
 *         description: Justificativa não está pendente
 *       404:
 *         description: Justificativa não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/justificativas/:id/aprovar', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar justificativa
    const { data: justificativa, error: errorBusca } = await supabaseAdmin
      .from('justificativas')
      .select('*')
      .eq('id', id)
      .single();

    if (errorBusca) {
      if (errorBusca.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Justificativa não encontrada'
        });
      }
      console.error('Erro ao buscar justificativa:', errorBusca);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    if (justificativa.status !== 'Pendente') {
      return res.status(400).json({
        success: false,
        message: 'Esta justificativa não está pendente'
      });
    }

    // Atualizar justificativa
    const { data: justificativaAtualizada, error: errorUpdate } = await supabaseAdmin
      .from('justificativas')
      .update({
        status: 'Aprovada',
        aprovado_por: req.user.id,
        data_aprovacao: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        funcionario:funcionarios!fk_justificativas_funcionario(nome, cargo, turno),
        aprovador:usuarios!justificativas_aprovado_por_fkey(nome)
      `)
      .single();

    if (errorUpdate) {
      console.error('Erro ao aprovar justificativa:', errorUpdate);
      return res.status(500).json({
        success: false,
        message: 'Erro ao aprovar justificativa'
      });
    }

    res.json({
      success: true,
      data: justificativaAtualizada,
      message: 'Justificativa aprovada com sucesso'
    });

  } catch (error) {
    console.error('Erro na rota de aprovação de justificativa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/justificativas/{id}/rejeitar:
 *   post:
 *     summary: Rejeita uma justificativa
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da justificativa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - motivo_rejeicao
 *             properties:
 *               motivo_rejeicao:
 *                 type: string
 *                 description: Motivo da rejeição
 *     responses:
 *       200:
 *         description: Justificativa rejeitada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados da justificativa rejeitada
 *                 message:
 *                   type: string
 *       400:
 *         description: Motivo da rejeição é obrigatório ou justificativa não está pendente
 *       404:
 *         description: Justificativa não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/justificativas/:id/rejeitar', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_rejeicao } = req.body;

    if (!motivo_rejeicao) {
      return res.status(400).json({
        success: false,
        message: 'Motivo da rejeição é obrigatório'
      });
    }

    // Buscar justificativa
    const { data: justificativa, error: errorBusca } = await supabaseAdmin
      .from('justificativas')
      .select('*')
      .eq('id', id)
      .single();

    if (errorBusca) {
      if (errorBusca.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Justificativa não encontrada'
        });
      }
      console.error('Erro ao buscar justificativa:', errorBusca);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    if (justificativa.status !== 'Pendente') {
      return res.status(400).json({
        success: false,
        message: 'Esta justificativa não está pendente'
      });
    }

    // Atualizar justificativa
    const { data: justificativaAtualizada, error: errorUpdate } = await supabaseAdmin
      .from('justificativas')
      .update({
        status: 'Rejeitada',
        aprovado_por: req.user.id,
        data_aprovacao: new Date().toISOString(),
        motivo: `${justificativa.motivo}\n\nMotivo da rejeição: ${motivo_rejeicao}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        funcionario:funcionarios!fk_justificativas_funcionario(nome, cargo, turno),
        aprovador:usuarios!justificativas_aprovado_por_fkey(nome)
      `)
      .single();

    if (errorUpdate) {
      console.error('Erro ao rejeitar justificativa:', errorUpdate);
      return res.status(500).json({
        success: false,
        message: 'Erro ao rejeitar justificativa'
      });
    }

    res.json({
      success: true,
      data: justificativaAtualizada,
      message: 'Justificativa rejeitada'
    });

  } catch (error) {
    console.error('Erro na rota de rejeição de justificativa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// RELATÓRIOS DE JUSTIFICATIVAS
// ============================================================================

/**
 * @swagger
 * /api/ponto-eletronico/relatorios/justificativas/mensal:
 *   get:
 *     summary: Gera relatório mensal de justificativas
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mes
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Mês do relatório (1-12)
 *       - in: query
 *         name: ano
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ano do relatório
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário para filtrar
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: ID da obra para filtrar
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pendente, Aprovada, Rejeitada]
 *         description: Status das justificativas
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [Atraso, Falta, Saída Antecipada, Ausência Parcial]
 *         description: Tipo das justificativas
 *     responses:
 *       200:
 *         description: Relatório mensal de justificativas
 *       400:
 *         description: Mês e ano são obrigatórios
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/relatorios/justificativas/mensal', authenticateToken, async (req, res) => {
  try {
    const { funcionario_id, mes, ano, obra_id, status, tipo } = req.query;

    // Validar parâmetros obrigatórios
    if (!mes || !ano) {
      return res.status(400).json({
        success: false,
        message: 'Mês e ano são obrigatórios'
      });
    }

    // Validar formato do mês e ano
    const mesNum = parseInt(mes);
    const anoNum = parseInt(ano);

    if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'Mês deve ser um número entre 1 e 12'
      });
    }

    if (isNaN(anoNum) || anoNum < 2000 || anoNum > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Ano inválido'
      });
    }

    // Calcular datas de início e fim do mês
    const dataInicio = `${anoNum}-${mesNum.toString().padStart(2, '0')}-01`;
    const ultimoDiaMes = new Date(anoNum, mesNum, 0).getDate();
    const dataFim = `${anoNum}-${mesNum.toString().padStart(2, '0')}-${ultimoDiaMes}`;

    // Construir query
    let query = supabaseAdmin
      .from('justificativas')
      .select(`
        *,
        funcionario:funcionarios!fk_justificativas_funcionario(
          id,
          nome,
          cargo,
          turno,
          obra_atual_id
        ),
        aprovador:usuarios!justificativas_aprovado_por_fkey(nome)
      `)
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: true });

    // Aplicar filtros opcionais
    if (funcionario_id) {
      query = query.eq('funcionario_id', parseInt(funcionario_id));
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data: justificativas, error } = await query;

    if (error) {
      console.error('Erro ao buscar justificativas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // Filtrar por obra se necessário (através do funcionário)
    let justificativasFiltradas = justificativas || [];
    if (obra_id) {
      justificativasFiltradas = justificativasFiltradas.filter(just => 
        just.funcionario?.obra_atual_id === parseInt(obra_id)
      );
    }

    // Calcular resumo
    const resumo = calcularResumoJustificativas(justificativasFiltradas, dataInicio, dataFim);
    
    // Calcular tendência mensal
    const tendencia = await calcularTendenciaMensal(mesNum, anoNum, justificativasFiltradas.length, supabaseAdmin);
    resumo.tendencia_mensal = tendencia;

    res.json({
      success: true,
      data: {
        periodo: {
          mes: mesNum,
          ano: anoNum,
          data_inicio: dataInicio,
          data_fim: dataFim
        },
        resumo,
        justificativas: justificativasFiltradas
      }
    });

  } catch (error) {
    console.error('Erro na rota de relatório mensal de justificativas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/relatorios/justificativas/periodo:
 *   get:
 *     summary: Gera relatório de justificativas por período
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: data_inicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início (YYYY-MM-DD)
 *       - in: query
 *         name: data_fim
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim (YYYY-MM-DD)
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário para filtrar
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: ID da obra para filtrar
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pendente, Aprovada, Rejeitada]
 *         description: Status das justificativas
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [Atraso, Falta, Saída Antecipada, Ausência Parcial]
 *         description: Tipo das justificativas
 *       - in: query
 *         name: agrupar_por
 *         schema:
 *           type: string
 *           enum: [funcionario, tipo, status, dia, semana]
 *         description: Critério de agrupamento
 *     responses:
 *       200:
 *         description: Relatório por período de justificativas
 *       400:
 *         description: Datas são obrigatórias
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/relatorios/justificativas/periodo', authenticateToken, async (req, res) => {
  try {
    const { data_inicio, data_fim, funcionario_id, obra_id, status, tipo, agrupar_por } = req.query;

    // Validar parâmetros obrigatórios
    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        success: false,
        message: 'Data de início e data de fim são obrigatórias'
      });
    }

    // Validar formato das datas
    if (!validarData(data_inicio) || !validarData(data_fim)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de data inválido. Use YYYY-MM-DD'
      });
    }

    // Validar que data_fim >= data_inicio
    if (new Date(data_fim) < new Date(data_inicio)) {
      return res.status(400).json({
        success: false,
        message: 'Data de fim deve ser maior ou igual à data de início'
      });
    }

    // Construir query
    let query = supabaseAdmin
      .from('justificativas')
      .select(`
        *,
        funcionario:funcionarios!fk_justificativas_funcionario(
          id,
          nome,
          cargo,
          turno,
          obra_atual_id
        ),
        aprovador:usuarios!justificativas_aprovado_por_fkey(nome)
      `)
      .gte('data', data_inicio)
      .lte('data', data_fim)
      .order('data', { ascending: true });

    // Aplicar filtros opcionais
    if (funcionario_id) {
      query = query.eq('funcionario_id', parseInt(funcionario_id));
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data: justificativas, error } = await query;

    if (error) {
      console.error('Erro ao buscar justificativas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // Filtrar por obra se necessário
    let justificativasFiltradas = justificativas || [];
    if (obra_id) {
      justificativasFiltradas = justificativasFiltradas.filter(just => 
        just.funcionario?.obra_atual_id === parseInt(obra_id)
      );
    }

    // Calcular dias úteis e totais
    const inicio = new Date(data_inicio);
    const fim = new Date(data_fim);
    const diasTotais = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calcular dias úteis (aproximado - segunda a sexta)
    let diasUteis = 0;
    let currentDate = new Date(inicio);
    while (currentDate <= fim) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Não é domingo nem sábado
        diasUteis++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calcular resumo
    const resumo = {
      total_justificativas: justificativasFiltradas.length,
      media_diaria: diasUteis > 0 ? (justificativasFiltradas.length / diasUteis).toFixed(2) : 0,
      por_status: {},
      por_tipo: {},
      taxa_aprovacao: 0,
      funcionarios_com_justificativas: 0
    };

    // Calcular distribuições
    const funcionariosUnicos = new Set();
    let totalAprovadas = 0;

    justificativasFiltradas.forEach(just => {
      // Status
      if (!resumo.por_status[just.status]) {
        resumo.por_status[just.status] = 0;
      }
      resumo.por_status[just.status]++;

      // Tipo
      if (!resumo.por_tipo[just.tipo]) {
        resumo.por_tipo[just.tipo] = 0;
      }
      resumo.por_tipo[just.tipo]++;

      // Funcionários únicos
      funcionariosUnicos.add(just.funcionario_id);

      // Aprovadas
      if (just.status === 'Aprovada') {
        totalAprovadas++;
      }
    });

    resumo.funcionarios_com_justificativas = funcionariosUnicos.size;
    resumo.taxa_aprovacao = justificativasFiltradas.length > 0 
      ? parseFloat(((totalAprovadas / justificativasFiltradas.length) * 100).toFixed(1))
      : 0;

    // Aplicar agrupamento se solicitado
    let agrupamento = {};
    if (agrupar_por && ['funcionario', 'tipo', 'status', 'dia', 'semana'].includes(agrupar_por)) {
      agrupamento = agruparJustificativasPor(justificativasFiltradas, agrupar_por);
    }

    res.json({
      success: true,
      data: {
        periodo: {
          data_inicio,
          data_fim,
          dias_uteis: diasUteis,
          dias_totais: diasTotais
        },
        resumo,
        agrupamento,
        justificativas: justificativasFiltradas
      }
    });

  } catch (error) {
    console.error('Erro na rota de relatório por período de justificativas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/relatorios/justificativas/estatisticas:
 *   get:
 *     summary: Gera relatório de estatísticas de justificativas
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [ultimo_mes, ultimos_3_meses, ultimo_ano]
 *         description: Período pré-definido para análise
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário para filtrar
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: ID da obra para filtrar
 *     responses:
 *       200:
 *         description: Estatísticas de justificativas
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/relatorios/justificativas/estatisticas', authenticateToken, async (req, res) => {
  try {
    const { periodo = 'ultimo_mes', funcionario_id, obra_id } = req.query;

    // Calcular range de datas baseado no período
    const hoje = new Date();
    let data_inicio, data_fim;

    switch (periodo) {
      case 'ultimos_3_meses':
        data_inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
        break;
      case 'ultimo_ano':
        data_inicio = new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1);
        break;
      case 'ultimo_mes':
      default:
        data_inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        break;
    }

    data_fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0); // Último dia do mês atual

    const dataInicioStr = data_inicio.toISOString().split('T')[0];
    const dataFimStr = data_fim.toISOString().split('T')[0];

    // Construir query
    let query = supabaseAdmin
      .from('justificativas')
      .select(`
        *,
        funcionario:funcionarios!fk_justificativas_funcionario(
          id,
          nome,
          cargo,
          turno,
          obra_atual_id
        ),
        aprovador:usuarios!justificativas_aprovado_por_fkey(nome)
      `)
      .gte('data', dataInicioStr)
      .lte('data', dataFimStr)
      .order('data', { ascending: true });

    // Aplicar filtros opcionais
    if (funcionario_id) {
      query = query.eq('funcionario_id', parseInt(funcionario_id));
    }

    const { data: justificativas, error } = await query;

    if (error) {
      console.error('Erro ao buscar justificativas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // Filtrar por obra se necessário
    let justificativasFiltradas = justificativas || [];
    if (obra_id) {
      justificativasFiltradas = justificativasFiltradas.filter(just => 
        just.funcionario?.obra_atual_id === parseInt(obra_id)
      );
    }

    // Calcular estatísticas avançadas
    const estatisticas = calcularEstatisticasAvancadas(justificativasFiltradas, {
      data_inicio: dataInicioStr,
      data_fim: dataFimStr
    });

    res.json({
      success: true,
      data: {
        periodo: {
          data_inicio: dataInicioStr,
          data_fim: dataFimStr
        },
        estatisticas
      }
    });

  } catch (error) {
    console.error('Erro na rota de estatísticas de justificativas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/relatorios/mensal:
 *   get:
 *     summary: Gera relatório mensal de ponto
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário para filtrar
 *       - in: query
 *         name: mes
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Mês do relatório (1-12)
 *       - in: query
 *         name: ano
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ano do relatório
 *     responses:
 *       200:
 *         description: Relatório mensal de ponto
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
 *                     periodo:
 *                       type: object
 *                       properties:
 *                         mes:
 *                           type: integer
 *                         ano:
 *                           type: integer
 *                         data_inicio:
 *                           type: string
 *                           format: date
 *                         data_fim:
 *                           type: string
 *                           format: date
 *                     resumo:
 *                       type: object
 *                       description: Resumo do período calculado
 *                     registros:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Registros de ponto do período
 *       400:
 *         description: Mês e ano são obrigatórios
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/relatorios/mensal', async (req, res) => {
  try {
    const { 
      funcionario_id, 
      mes, 
      ano 
    } = req.query;

    if (!mes || !ano) {
      return res.status(400).json({
        success: false,
        message: 'Mês e ano são obrigatórios'
      });
    }

    const dataInicio = `${ano}-${mes.padStart(2, '0')}-01`;
    const dataFim = `${ano}-${mes.padStart(2, '0')}-31`;

    let query = supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno)
      `)
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: true });

    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id);
    }

    const { data: registros, error } = await query;

    if (error) {
      console.error('Erro ao buscar registros para relatório:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // Calcular resumo
    const resumo = calcularResumoPeriodo(registros || [], dataInicio, dataFim);

    res.json({
      success: true,
      data: {
        periodo: {
          mes: parseInt(mes),
          ano: parseInt(ano),
          data_inicio: dataInicio,
          data_fim: dataFim
        },
        resumo,
        registros: registros || []
      }
    });

  } catch (error) {
    console.error('Erro na rota de relatório mensal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/relatorios/horas-extras:
 *   get:
 *     summary: Gera relatório de horas extras
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: data_inicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do período (YYYY-MM-DD)
 *       - in: query
 *         name: data_fim
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do período (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pendente Aprovação, Aprovado, Rejeitado]
 *           default: Pendente Aprovação
 *         description: Status dos registros para filtrar
 *     responses:
 *       200:
 *         description: Relatório de horas extras
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
 *                     periodo:
 *                       type: object
 *                       properties:
 *                         data_inicio:
 *                           type: string
 *                           format: date
 *                         data_fim:
 *                           type: string
 *                           format: date
 *                     total_registros:
 *                       type: integer
 *                       description: Total de registros com horas extras
 *                     total_horas_extras:
 *                       type: number
 *                       description: Total de horas extras no período
 *                     registros:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Registros com horas extras
 *       400:
 *         description: Data de início e fim são obrigatórias
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/relatorios/horas-extras', async (req, res) => {
  try {
    const { 
      data_inicio, 
      data_fim, 
      status = 'Pendente Aprovação' 
    } = req.query;

    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        success: false,
        message: 'Data de início e fim são obrigatórias'
      });
    }

    let query = supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno),
        aprovador:usuarios!registros_ponto_aprovado_por_fkey(nome)
      `)
      .gte('data', data_inicio)
      .lte('data', data_fim)
      .gt('horas_extras', 0)
      .order('data', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: registros, error } = await query;

    if (error) {
      console.error('Erro ao buscar registros de horas extras:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // Calcular totais
    const totalHorasExtras = (registros || []).reduce((total, registro) => {
      return total + parseFloat(registro.horas_extras || 0);
    }, 0);

    res.json({
      success: true,
      data: {
        periodo: {
          data_inicio: data_inicio,
          data_fim: data_fim
        },
        total_registros: (registros || []).length,
        total_horas_extras: totalHorasExtras,
        registros: registros || []
      }
    });

  } catch (error) {
    console.error('Erro na rota de relatório de horas extras:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/historico/{registro_id}:
 *   get:
 *     summary: Busca histórico de alterações de um registro
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registro_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do registro de ponto
 *     responses:
 *       200:
 *         description: Histórico de alterações do registro
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
 *                         type: string
 *                         description: ID do histórico
 *                       registro_ponto_id:
 *                         type: string
 *                         description: ID do registro de ponto
 *                       campo_alterado:
 *                         type: string
 *                         description: Nome do campo alterado
 *                       valor_anterior:
 *                         type: string
 *                         description: Valor anterior do campo
 *                       valor_novo:
 *                         type: string
 *                         description: Novo valor do campo
 *                       justificativa_alteracao:
 *                         type: string
 *                         description: Justificativa da alteração
 *                       alterado_por:
 *                         type: integer
 *                         description: ID do usuário que fez a alteração
 *                       data_alteracao:
 *                         type: string
 *                         format: date-time
 *                         description: Data e hora da alteração
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/historico/:registro_id', async (req, res) => {
  try {
    const { registro_id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('historico_alteracoes_ponto')
      .select(`
        *,
        alterado_por:usuarios!historico_alteracoes_ponto_alterado_por_fkey(nome)
      `)
      .eq('registro_ponto_id', registro_id)
      .order('data_alteracao', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    res.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Erro na rota de histórico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/obras/{obra_id}/gestores:
 *   get:
 *     summary: Lista gestores disponíveis para uma obra específica
 *     tags: [Ponto Eletrônico]
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
 *         description: Lista de gestores da obra
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
 *                         description: ID do funcionário
 *                       nome:
 *                         type: string
 *                         description: Nome do funcionário
 *                       cargo:
 *                         type: string
 *                         description: Cargo do funcionário
 *                       email:
 *                         type: string
 *                         description: Email do funcionário
 *                       telefone:
 *                         type: string
 *                         description: Telefone do funcionário
 *                       status:
 *                         type: string
 *                         description: Status do funcionário
 *       404:
 *         description: Obra não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/obras/:obra_id/gestores', async (req, res) => {
  try {
    const { obra_id } = req.params;

    // Verificar se a obra existe
    const { data: obra, error: obraError } = await supabaseAdmin
      .from('obras')
      .select('id, nome')
      .eq('id', obra_id)
      .single();

    if (obraError || !obra) {
      return res.status(404).json({
        success: false,
        message: 'Obra não encontrada'
      });
    }

    // Buscar funcionários que são gestores na obra
    const { data, error } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, cargo, email, telefone, status')
      .eq('obra_atual_id', obra_id)
      .eq('status', 'Ativo')
      .in('cargo', ['Supervisor', 'Técnico Manutenção', 'Gerente', 'Coordenador']);

    if (error) {
      console.error('Erro ao buscar gestores:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    res.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Erro na rota de gestores por obra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/registros/{id}/enviar-aprovacao:
 *   post:
 *     summary: Envia um registro para aprovação de horas extras
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do registro de ponto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gestor_id
 *             properties:
 *               gestor_id:
 *                 type: integer
 *                 description: ID do gestor que irá aprovar
 *               observacoes:
 *                 type: string
 *                 description: Observações do funcionário
 *     responses:
 *       200:
 *         description: Registro enviado para aprovação com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados do registro atualizado
 *                 message:
 *                   type: string
 *       400:
 *         description: Registro não tem horas extras ou gestor inválido
 *       404:
 *         description: Registro ou gestor não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/registros/:id/enviar-aprovacao', async (req, res) => {
  try {
    const { id } = req.params;
    const { gestor_id, observacoes } = req.body;

    if (!gestor_id) {
      return res.status(400).json({
        success: false,
        message: 'ID do gestor é obrigatório'
      });
    }

    // Buscar registro
    const { data: registro, error: errorBusca } = await supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, obra_atual_id)
      `)
      .eq('id', id)
      .single();

    if (errorBusca) {
      if (errorBusca.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Registro não encontrado'
        });
      }
      console.error('Erro ao buscar registro:', errorBusca);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // Verificar se tem horas extras
    if (!registro.horas_extras || registro.horas_extras <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Este registro não possui horas extras para aprovação'
      });
    }

    // Verificar se o gestor existe e pertence à mesma obra
    const { data: gestor, error: gestorError } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, cargo, obra_atual_id')
      .eq('id', gestor_id)
      .eq('status', 'Ativo')
      .single();

    if (gestorError || !gestor) {
      return res.status(404).json({
        success: false,
        message: 'Gestor não encontrado ou inativo'
      });
    }

    // Verificar se o gestor pertence à mesma obra do funcionário
    if (gestor.obra_atual_id !== registro.funcionario.obra_atual_id) {
      return res.status(400).json({
        success: false,
        message: 'O gestor deve pertencer à mesma obra do funcionário'
      });
    }

    // Atualizar registro para pendente de aprovação
    const { data: registroAtualizado, error: errorUpdate } = await supabaseAdmin
      .from('registros_ponto')
      .update({
        status: 'Pendente Aprovação',
        observacoes: observacoes || registro.observacoes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno)
      `)
      .single();

    if (errorUpdate) {
      console.error('Erro ao atualizar registro:', errorUpdate);
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar registro para aprovação'
      });
    }

    // Criar notificação para o gestor
    const { error: notifError } = await supabaseAdmin
      .from('notificacoes')
      .insert({
        usuario_id: gestor_id,
        tipo: 'warning',
        titulo: 'Aprovação de Horas Extras',
        mensagem: `${registro.funcionario.nome} tem ${registro.horas_extras}h extras para aprovar`,
        link: `/pwa/aprovacoes/${id}`,
        lida: false,
        created_at: new Date().toISOString()
      });

    if (notifError) {
      console.error('Erro ao criar notificação:', notifError);
      // Não falhar a operação por causa da notificação
    }

    res.json({
      success: true,
      data: registroAtualizado,
      message: 'Registro enviado para aprovação com sucesso'
    });

  } catch (error) {
    console.error('Erro na rota de envio para aprovação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/registros/{id}/aprovar-assinatura:
 *   post:
 *     summary: Aprova horas extras com assinatura digital
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do registro de ponto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gestor_id
 *               - assinatura_digital
 *             properties:
 *               gestor_id:
 *                 type: integer
 *                 description: ID do gestor que está aprovando
 *               assinatura_digital:
 *                 type: string
 *                 description: Assinatura digital em base64
 *               observacoes_aprovacao:
 *                 type: string
 *                 description: Observações da aprovação
 *     responses:
 *       200:
 *         description: Horas extras aprovadas com assinatura digital
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados do registro aprovado
 *                 message:
 *                   type: string
 *       400:
 *         description: Assinatura digital é obrigatória ou registro não está pendente
 *       404:
 *         description: Registro ou gestor não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/registros/:id/aprovar-assinatura', async (req, res) => {
  try {
    const { id } = req.params;
    const { gestor_id, assinatura_digital, observacoes_aprovacao } = req.body;

    if (!gestor_id || !assinatura_digital) {
      return res.status(400).json({
        success: false,
        message: 'ID do gestor e assinatura digital são obrigatórios'
      });
    }

    // Buscar registro
    const { data: registro, error: errorBusca } = await supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, obra_atual_id)
      `)
      .eq('id', id)
      .single();

    if (errorBusca) {
      if (errorBusca.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Registro não encontrado'
        });
      }
      console.error('Erro ao buscar registro:', errorBusca);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    if (registro.status !== 'Pendente Aprovação') {
      return res.status(400).json({
        success: false,
        message: 'Este registro não está pendente de aprovação'
      });
    }

    // Verificar se o gestor existe
    const { data: gestor, error: gestorError } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, cargo')
      .eq('id', gestor_id)
      .eq('status', 'Ativo')
      .single();

    if (gestorError || !gestor) {
      return res.status(404).json({
        success: false,
        message: 'Gestor não encontrado ou inativo'
      });
    }

    // Salvar assinatura digital no storage
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `assinatura_${id}_${gestor_id}_${timestamp}.png`;
    
    // Converter base64 para buffer
    const base64Data = assinatura_digital.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('assinaturas-digitais')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Erro ao fazer upload da assinatura:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao salvar assinatura digital'
      });
    }

    // Atualizar registro para aprovado
    const { data: registroAtualizado, error: errorUpdate } = await supabaseAdmin
      .from('registros_ponto')
      .update({
        status: 'Aprovado',
        aprovado_por: gestor_id,
        data_aprovacao: new Date().toISOString(),
        observacoes: observacoes_aprovacao || registro.observacoes,
        assinatura_digital_path: uploadData.path,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno),
        aprovador:usuarios!registros_ponto_aprovado_por_fkey(nome)
      `)
      .single();

    if (errorUpdate) {
      console.error('Erro ao aprovar registro:', errorUpdate);
      return res.status(500).json({
        success: false,
        message: 'Erro ao aprovar registro'
      });
    }

    // Criar notificação para o funcionário
    const { error: notifError } = await supabaseAdmin
      .from('notificacoes')
      .insert({
        usuario_id: registro.funcionario_id,
        tipo: 'success',
        titulo: 'Horas Extras Aprovadas',
        mensagem: `Suas horas extras de ${registro.data} foram aprovadas por ${gestor.nome}`,
        link: `/dashboard/ponto`,
        lida: false,
        created_at: new Date().toISOString()
      });

    if (notifError) {
      console.error('Erro ao criar notificação:', notifError);
      // Não falhar a operação por causa da notificação
    }

    res.json({
      success: true,
      data: registroAtualizado,
      message: 'Horas extras aprovadas com assinatura digital'
    });

  } catch (error) {
    console.error('Erro na rota de aprovação com assinatura:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/horas-extras:
 *   get:
 *     summary: Lista registros pendentes de aprovação (todas ou filtradas por gestor)
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: gestor_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: ID do gestor (opcional - se não informado, retorna todas as aprovações pendentes)
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
 *           default: 20
 *         description: Limite de registros por página
 *     responses:
 *       200:
 *         description: Lista de registros pendentes de aprovação
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
 *                         type: string
 *                         description: ID do registro
 *                       funcionario_id:
 *                         type: integer
 *                         description: ID do funcionário
 *                       data:
 *                         type: string
 *                         format: date
 *                         description: Data do registro
 *                       horas_extras:
 *                         type: number
 *                         description: Horas extras
 *                       observacoes:
 *                         type: string
 *                         description: Observações
 *                       funcionario:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                           cargo:
 *                             type: string
 *                           turno:
 *                             type: string
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
 *       400:
 *         description: Gestor não possui obra atribuída
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/horas-extras', async (req, res) => {
  try {
    const { funcionario_id, data_inicio, data_fim, status, page = 1, limit = 20 } = req.query;

    let query = supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(id, nome, cargo, turno, obra_atual_id),
        aprovador:usuarios!registros_ponto_aprovado_por_fkey(id, nome)
      `, { count: 'exact' })
      .gt('horas_extras', 0)
      .order('data', { ascending: false });

    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id);
    }

    if (data_inicio) {
      query = query.gte('data', data_inicio);
    }

    if (data_fim) {
      query = query.lte('data', data_fim);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar registros com horas extras:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

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
    console.error('Erro na rota de horas extras:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/horas-extras:
 *   get:
 *     summary: Lista apenas registros com horas extras
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário para filtrar
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do período (YYYY-MM-DD)
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do período (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pendente Aprovação, Aprovado, Rejeitado]
 *         description: Status do registro
 *       - in: query
 *         name: ordenacao
 *         schema:
 *           type: string
 *           enum: [maior, menor, data]
 *           default: data
 *         description: Ordenação dos resultados
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
 *         description: Limite de registros por página
 *     responses:
 *       200:
 *         description: Lista de registros com horas extras
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/horas-extras', async (req, res) => {
  try {
    const { 
      funcionario_id, 
      data_inicio, 
      data_fim, 
      status,
      ordenacao = 'data',
      page = 1, 
      limit = 50 
    } = req.query;

    let query = supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno, departamento),
        aprovador:usuarios!registros_ponto_aprovado_por_fkey(nome)
      `, { count: 'exact' })
      .gt('horas_extras', 0);

    // Aplicar filtros
    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id);
    }

    if (data_inicio) {
      query = query.gte('data', data_inicio);
    }

    if (data_fim) {
      query = query.lte('data', data_fim);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Aplicar ordenação
    switch (ordenacao) {
      case 'maior':
        query = query.order('horas_extras', { ascending: false });
        break;
      case 'menor':
        query = query.order('horas_extras', { ascending: true });
        break;
      case 'data':
      default:
        query = query.order('data', { ascending: false });
        break;
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar registros de horas extras:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }

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
    console.error('Erro na rota de horas extras:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/horas-extras/estatisticas:
 *   get:
 *     summary: Retorna estatísticas agregadas de horas extras
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [mes, trimestre, ano]
 *           default: mes
 *         description: Período para estatísticas
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário para filtrar (opcional)
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *         description: Mês específico (1-12)
 *       - in: query
 *         name: ano
 *         schema:
 *           type: integer
 *         description: Ano específico
 *     responses:
 *       200:
 *         description: Estatísticas de horas extras
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/horas-extras/estatisticas', async (req, res) => {
  try {
    const { 
      periodo = 'mes',
      funcionario_id,
      mes,
      ano
    } = req.query;

    // Determinar período
    const hoje = new Date();
    let dataInicio, dataFim;

    if (mes && ano) {
      // Período específico
      dataInicio = `${ano}-${mes.toString().padStart(2, '0')}-01`;
      const ultimoDia = new Date(ano, mes, 0).getDate();
      dataFim = `${ano}-${mes.toString().padStart(2, '0')}-${ultimoDia}`;
    } else {
      // Período baseado no tipo
      switch (periodo) {
        case 'trimestre':
          dataInicio = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3, 1).toISOString().split('T')[0];
          dataFim = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3 + 3, 0).toISOString().split('T')[0];
          break;
        case 'ano':
          dataInicio = `${hoje.getFullYear()}-01-01`;
          dataFim = `${hoje.getFullYear()}-12-31`;
          break;
        case 'mes':
        default:
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
          dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
          break;
      }
    }

    let query = supabaseAdmin
      .from('registros_ponto')
      .select('horas_extras, funcionario_id, data')
      .gt('horas_extras', 0)
      .gte('data', dataInicio)
      .lte('data', dataFim);

    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar estatísticas de horas extras:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }

    // Calcular estatísticas
    const registros = data || [];
    const totalRegistros = registros.length;
    const totalHorasExtras = registros.reduce((sum, r) => sum + parseFloat(r.horas_extras || 0), 0);
    const funcionariosUnicos = new Set(registros.map(r => r.funcionario_id)).size;
    const mediaHorasExtras = totalRegistros > 0 ? totalHorasExtras / totalRegistros : 0;
    const maxHorasExtras = registros.length > 0 ? Math.max(...registros.map(r => parseFloat(r.horas_extras || 0))) : 0;
    const mediaPorFuncionario = funcionariosUnicos > 0 ? totalHorasExtras / funcionariosUnicos : 0;

    res.json({
      success: true,
      data: {
        periodo: {
          tipo: periodo,
          data_inicio: dataInicio,
          data_fim: dataFim
        },
        total_registros: totalRegistros,
        total_horas_extras: parseFloat(totalHorasExtras.toFixed(2)),
        media_horas_extras: parseFloat(mediaHorasExtras.toFixed(2)),
        max_horas_extras: parseFloat(maxHorasExtras.toFixed(2)),
        total_funcionarios: funcionariosUnicos,
        media_por_funcionario: parseFloat(mediaPorFuncionario.toFixed(2))
      }
    });

  } catch (error) {
    console.error('Erro na rota de estatísticas de horas extras:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/horas-extras/aprovar-lote:
 *   post:
 *     summary: Aprova múltiplos registros de horas extras em lote
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registro_ids
 *             properties:
 *               registro_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de IDs dos registros a aprovar
 *               observacoes:
 *                 type: string
 *                 description: Observações da aprovação
 *     responses:
 *       200:
 *         description: Registros aprovados com sucesso
 *       400:
 *         description: Dados inválidos ou registros não pendentes
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/horas-extras/aprovar-lote', async (req, res) => {
  try {
    const { registro_ids, observacoes } = req.body;

    if (!registro_ids || !Array.isArray(registro_ids) || registro_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array de IDs de registros é obrigatório'
      });
    }

    // Buscar todos os registros
    const { data: registros, error: errorBusca } = await supabaseAdmin
      .from('registros_ponto')
      .select('id, status, horas_extras')
      .in('id', registro_ids);

    if (errorBusca) {
      console.error('Erro ao buscar registros:', errorBusca);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar registros'
      });
    }

    // Validar que todos os registros existem
    if (registros.length !== registro_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Alguns registros não foram encontrados'
      });
    }

    // Validar que todos estão pendentes de aprovação
    const naosPendentes = registros.filter(r => r.status !== 'Pendente Aprovação');
    if (naosPendentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${naosPendentes.length} registro(s) não estão pendentes de aprovação`,
        registros_invalidos: naosPendentes.map(r => r.id)
      });
    }

    // Aprovar todos os registros
    const { data: registrosAtualizados, error: errorUpdate } = await supabaseAdmin
      .from('registros_ponto')
      .update({
        status: 'Aprovado',
        aprovado_por: req.user.id,
        data_aprovacao: new Date().toISOString(),
        observacoes: observacoes || null,
        updated_at: new Date().toISOString()
      })
      .in('id', registro_ids)
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno)
      `);

    if (errorUpdate) {
      console.error('Erro ao aprovar registros:', errorUpdate);
      return res.status(500).json({
        success: false,
        message: 'Erro ao aprovar registros'
      });
    }

    res.json({
      success: true,
      data: registrosAtualizados,
      message: `${registrosAtualizados.length} registro(s) aprovado(s) com sucesso`
    });

  } catch (error) {
    console.error('Erro na rota de aprovação em lote:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/horas-extras/rejeitar-lote:
 *   post:
 *     summary: Rejeita múltiplos registros de horas extras em lote
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registro_ids
 *               - motivo
 *             properties:
 *               registro_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de IDs dos registros a rejeitar
 *               motivo:
 *                 type: string
 *                 description: Motivo da rejeição (obrigatório)
 *     responses:
 *       200:
 *         description: Registros rejeitados com sucesso
 *       400:
 *         description: Dados inválidos ou motivo obrigatório
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/horas-extras/rejeitar-lote', async (req, res) => {
  try {
    const { registro_ids, motivo } = req.body;

    if (!registro_ids || !Array.isArray(registro_ids) || registro_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array de IDs de registros é obrigatório'
      });
    }

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'Motivo da rejeição é obrigatório'
      });
    }

    // Buscar todos os registros
    const { data: registros, error: errorBusca } = await supabaseAdmin
      .from('registros_ponto')
      .select('id, status, horas_extras, observacoes')
      .in('id', registro_ids);

    if (errorBusca) {
      console.error('Erro ao buscar registros:', errorBusca);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar registros'
      });
    }

    // Validar que todos os registros existem
    if (registros.length !== registro_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Alguns registros não foram encontrados'
      });
    }

    // Validar que todos estão pendentes de aprovação
    const naosPendentes = registros.filter(r => r.status !== 'Pendente Aprovação');
    if (naosPendentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${naosPendentes.length} registro(s) não estão pendentes de aprovação`,
        registros_invalidos: naosPendentes.map(r => r.id)
      });
    }

    // Rejeitar todos os registros
    const registrosComMotivo = registros.map(r => ({
      id: r.id,
      observacoes: `${r.observacoes || ''}\n\nMotivo da rejeição: ${motivo}`.trim()
    }));

    // Atualizar cada registro com seu motivo
    const promises = registrosComMotivo.map(r => 
      supabaseAdmin
        .from('registros_ponto')
        .update({
          status: 'Rejeitado',
          aprovado_por: req.user.id,
          data_aprovacao: new Date().toISOString(),
          observacoes: r.observacoes,
          updated_at: new Date().toISOString()
        })
        .eq('id', r.id)
    );

    await Promise.all(promises);

    // Buscar registros atualizados para retornar
    const { data: registrosAtualizados, error: errorSelect } = await supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno)
      `)
      .in('id', registro_ids);

    if (errorSelect) {
      console.error('Erro ao buscar registros atualizados:', errorSelect);
    }

    res.json({
      success: true,
      data: registrosAtualizados || [],
      message: `${registro_ids.length} registro(s) rejeitado(s) com sucesso`
    });

  } catch (error) {
    console.error('Erro na rota de rejeição em lote:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/relatorios/mensal/funcionario/{id}:
 *   get:
 *     summary: Relatório mensal detalhado por funcionário
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do funcionário
 *       - in: query
 *         name: mes
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Mês do relatório (1-12)
 *       - in: query
 *         name: ano
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ano do relatório
 *       - in: query
 *         name: incluir_graficos
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir dados para gráficos
 *     responses:
 *       200:
 *         description: Relatório detalhado do funcionário
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       404:
 *         description: Funcionário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/relatorios/mensal/funcionario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { mes, ano, incluir_graficos = false } = req.query;

    if (!mes || !ano) {
      return res.status(400).json({
        success: false,
        message: 'Mês e ano são obrigatórios'
      });
    }

    // Verificar se o funcionário existe
    const { data: funcionario, error: funcError } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, cargo, turno, departamento, data_admissao, salario')
      .eq('id', id)
      .single();

    if (funcError || !funcionario) {
      return res.status(404).json({
        success: false,
        message: 'Funcionário não encontrado'
      });
    }

    const dataInicio = `${ano}-${mes.padStart(2, '0')}-01`;
    const dataFim = `${ano}-${mes.padStart(2, '0')}-31`;

    // Buscar registros do período
    const { data: registros, error } = await supabaseAdmin
      .from('registros_ponto')
      .select('*')
      .eq('funcionario_id', id)
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: true });

    if (error) {
      console.error('Erro ao buscar registros:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // Calcular resumo
    const resumo = calcularResumoPeriodo(registros || [], dataInicio, dataFim);

    // Adicionar dados do funcionário ao resumo
    resumo.funcionario = {
      nome: funcionario.nome,
      cargo: funcionario.cargo,
      turno: funcionario.turno,
      departamento: funcionario.departamento
    };

    // Buscar justificativas do período
    const { data: justificativas } = await supabaseAdmin
      .from('justificativas')
      .select('*')
      .eq('funcionario_id', id)
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: false });

    let dadosGraficos = null;
    if (incluir_graficos === 'true' || incluir_graficos === true) {
      // Preparar dados para gráficos
      const horasPorDia = {};
      registros.forEach(r => {
        horasPorDia[r.data] = {
          horas_trabalhadas: parseFloat(r.horas_trabalhadas || 0),
          horas_extras: parseFloat(r.horas_extras || 0)
        };
      });

      dadosGraficos = {
        horas_por_dia: Object.entries(horasPorDia).map(([data, valores]) => ({
          data,
          ...valores
        }))
      };
    }

    res.json({
      success: true,
      data: {
        funcionario,
        periodo: {
          mes: parseInt(mes),
          ano: parseInt(ano),
          data_inicio: dataInicio,
          data_fim: dataFim
        },
        resumo,
        registros: registros || [],
        justificativas: justificativas || [],
        graficos: dadosGraficos
      }
    });

  } catch (error) {
    console.error('Erro na rota de relatório mensal por funcionário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/relatorios/frequencia:
 *   get:
 *     summary: Relatório de frequência com presenças, faltas e atrasos
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mes
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Mês do relatório (1-12)
 *       - in: query
 *         name: ano
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ano do relatório
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário (opcional)
 *       - in: query
 *         name: departamento
 *         schema:
 *           type: string
 *         description: Filtrar por departamento (opcional)
 *     responses:
 *       200:
 *         description: Relatório de frequência
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/relatorios/frequencia', async (req, res) => {
  try {
    const { mes, ano, funcionario_id, departamento } = req.query;

    if (!mes || !ano) {
      return res.status(400).json({
        success: false,
        message: 'Mês e ano são obrigatórios'
      });
    }

    const dataInicio = `${ano}-${mes.padStart(2, '0')}-01`;
    const dataFim = `${ano}-${mes.padStart(2, '0')}-31`;

    // Buscar todos os funcionários ativos
    let queryFunc = supabaseAdmin
      .from('funcionarios')
      .select('id, nome, cargo, turno, departamento')
      .eq('status', 'Ativo');

    if (funcionario_id) {
      queryFunc = queryFunc.eq('id', funcionario_id);
    }

    if (departamento) {
      queryFunc = queryFunc.eq('departamento', departamento);
    }

    const { data: funcionarios, error: funcError } = await queryFunc;

    if (funcError) {
      console.error('Erro ao buscar funcionários:', funcError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // Buscar registros do período
    const { data: registros, error: regError } = await supabaseAdmin
      .from('registros_ponto')
      .select('funcionario_id, status, horas_trabalhadas, horas_extras, data')
      .gte('data', dataInicio)
      .lte('data', dataFim);

    if (regError) {
      console.error('Erro ao buscar registros:', regError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // Processar dados por funcionário
    const relatorio = funcionarios.map(func => {
      const registrosFunc = registros.filter(r => r.funcionario_id === func.id);
      
      const presencas = registrosFunc.filter(r => r.status === 'Completo' || r.status === 'Aprovado').length;
      const faltas = registrosFunc.filter(r => r.status === 'Falta').length;
      const atrasos = registrosFunc.filter(r => r.status === 'Atraso').length;
      const totalHoras = registrosFunc.reduce((sum, r) => sum + parseFloat(r.horas_trabalhadas || 0), 0);
      const horasExtras = registrosFunc.reduce((sum, r) => sum + parseFloat(r.horas_extras || 0), 0);

      // Calcular taxa de presença (considerando dias úteis aproximados)
      const diasUteis = 22; // Média de dias úteis por mês
      const taxaPresenca = diasUteis > 0 ? ((presencas / diasUteis) * 100).toFixed(1) : 0;

      return {
        funcionario: {
          id: func.id,
          nome: func.nome,
          cargo: func.cargo,
          turno: func.turno,
          departamento: func.departamento
        },
        frequencia: {
          presencas,
          faltas,
          atrasos,
          taxa_presenca: parseFloat(taxaPresenca),
          total_horas: parseFloat(totalHoras.toFixed(2)),
          horas_extras: parseFloat(horasExtras.toFixed(2)),
          dias_uteis: diasUteis
        }
      };
    });

    res.json({
      success: true,
      data: {
        periodo: {
          mes: parseInt(mes),
          ano: parseInt(ano),
          data_inicio: dataInicio,
          data_fim: dataFim
        },
        relatorio
      }
    });

  } catch (error) {
    console.error('Erro na rota de relatório de frequência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/relatorios/atrasos:
 *   get:
 *     summary: Relatório detalhado de atrasos com análise de padrões
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mes
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Mês do relatório (1-12)
 *       - in: query
 *         name: ano
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ano do relatório
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário (opcional)
 *     responses:
 *       200:
 *         description: Relatório de atrasos
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/relatorios/atrasos', async (req, res) => {
  try {
    const { mes, ano, funcionario_id } = req.query;

    if (!mes || !ano) {
      return res.status(400).json({
        success: false,
        message: 'Mês e ano são obrigatórios'
      });
    }

    const dataInicio = `${ano}-${mes.padStart(2, '0')}-01`;
    const dataFim = `${ano}-${mes.padStart(2, '0')}-31`;

    let query = supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno, departamento)
      `)
      .eq('status', 'Atraso')
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: true });

    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id);
    }

    const { data: atrasos, error } = await query;

    if (error) {
      console.error('Erro ao buscar atrasos:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // Agrupar por funcionário
    const atrasosPorFuncionario = {};
    (atrasos || []).forEach(atraso => {
      const funcId = atraso.funcionario_id;
      if (!atrasosPorFuncionario[funcId]) {
        atrasosPorFuncionario[funcId] = {
          funcionario: {
            nome: atraso.funcionario?.nome || 'Desconhecido',
            cargo: atraso.funcionario?.cargo || '',
            turno: atraso.funcionario?.turno || '',
            departamento: atraso.funcionario?.departamento || ''
          },
          total_atrasos: 0,
          atrasos_detalhados: []
        };
      }

      atrasosPorFuncionario[funcId].total_atrasos += 1;
      atrasosPorFuncionario[funcId].atrasos_detalhados.push({
        data: atraso.data,
        dia_semana: new Date(atraso.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' }),
        hora_entrada: atraso.entrada,
        observacoes: atraso.observacoes
      });
    });

    // Análise de padrões
    const analise = {
      total_atrasos: (atrasos || []).length,
      funcionarios_com_atraso: Object.keys(atrasosPorFuncionario).length,
      media_atrasos_por_funcionario: Object.keys(atrasosPorFuncionario).length > 0
        ? parseFloat(((atrasos || []).length / Object.keys(atrasosPorFuncionario).length).toFixed(2))
        : 0
    };

    // Atrasos por dia da semana
    const atrasosPorDiaSemana = {};
    (atrasos || []).forEach(atraso => {
      const diaSemana = new Date(atraso.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' });
      atrasosPorDiaSemana[diaSemana] = (atrasosPorDiaSemana[diaSemana] || 0) + 1;
    });

    analise.atrasos_por_dia_semana = atrasosPorDiaSemana;

    res.json({
      success: true,
      data: {
        periodo: {
          mes: parseInt(mes),
          ano: parseInt(ano),
          data_inicio: dataInicio,
          data_fim: dataFim
        },
        analise,
        atrasos_por_funcionario: Object.values(atrasosPorFuncionario)
      }
    });

  } catch (error) {
    console.error('Erro na rota de relatório de atrasos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/relatorios/exportar:
 *   get:
 *     summary: Exporta relatórios em diferentes formatos
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [csv, json, pdf]
 *         description: Formato de exportação
 *       - in: query
 *         name: formato
 *         required: true
 *         schema:
 *           type: string
 *           enum: [mensal, semanal, diario]
 *         description: Formato do relatório
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *         description: Mês (1-12)
 *       - in: query
 *         name: ano
 *         schema:
 *           type: integer
 *         description: Ano
 *     responses:
 *       200:
 *         description: Relatório exportado
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/relatorios/exportar', async (req, res) => {
  try {
    const { tipo = 'json', formato = 'mensal', mes, ano } = req.query;

    if (!['csv', 'json', 'pdf'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de exportação inválido. Use: csv, json ou pdf'
      });
    }

    // Calcular período baseado no formato
    const hoje = new Date();
    let dataInicio, dataFim;

    if (formato === 'mensal') {
      const mesUso = mes || (hoje.getMonth() + 1);
      const anoUso = ano || hoje.getFullYear();
      dataInicio = `${anoUso}-${mesUso.toString().padStart(2, '0')}-01`;
      const ultimoDia = new Date(anoUso, mesUso, 0).getDate();
      dataFim = `${anoUso}-${mesUso.toString().padStart(2, '0')}-${ultimoDia}`;
    } else if (formato === 'semanal') {
      const diaSemana = hoje.getDay();
      const primeiroDia = new Date(hoje);
      primeiroDia.setDate(hoje.getDate() - diaSemana);
      dataInicio = primeiroDia.toISOString().split('T')[0];
      
      const ultimoDia = new Date(primeiroDia);
      ultimoDia.setDate(primeiroDia.getDate() + 6);
      dataFim = ultimoDia.toISOString().split('T')[0];
    } else {
      // diario
      dataInicio = hoje.toISOString().split('T')[0];
      dataFim = dataInicio;
    }

    // Buscar dados
    const { data: registros, error } = await supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios(nome, cargo, turno, departamento)
      `)
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: true });

    if (error) {
      console.error('Erro ao buscar registros para exportação:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // Log para debug
    console.log('📊 Exportação - Total de registros:', registros?.length);
    if (registros?.length > 0) {
      console.log('📊 Exemplo de registro:', {
        id: registros[0].id,
        funcionario_id: registros[0].funcionario_id,
        funcionario: registros[0].funcionario
      });
    }

    if (tipo === 'csv') {
      // Gerar CSV
      const headers = [
        'ID',
        'Data',
        'Funcionário',
        'Cargo',
        'Turno',
        'Departamento',
        'Entrada',
        'Saída Almoço',
        'Volta Almoço',
        'Saída',
        'Horas Trabalhadas',
        'Horas Extras',
        'Status',
        'Observações',
        'Localização'
      ];

      const linhas = registros.map(r => {
        // Extrair dados do funcionário de forma segura
        const nomeFuncionario = r.funcionario?.nome || 'N/A';
        const cargoFuncionario = r.funcionario?.cargo || 'N/A';
        const turnoFuncionario = r.funcionario?.turno || 'N/A';
        const departamentoFuncionario = r.funcionario?.departamento || 'N/A';

        return [
          r.id || '',
          r.data || '',
          nomeFuncionario,
          cargoFuncionario,
          turnoFuncionario,
          departamentoFuncionario,
          r.entrada || '',
          r.saida_almoco || '',
          r.volta_almoco || '',
          r.saida || '',
          (r.horas_trabalhadas || 0).toString(),
          (r.horas_extras || 0).toString(),
          r.status || '',
          (r.observacoes || '').replace(/\n/g, ' ').replace(/"/g, '""'),
          r.localizacao || ''
        ];
      });

      const csv = [
        headers.join(','),
        ...linhas.map(linha => linha.map(campo => `"${campo}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_ponto_${formato}_${dataInicio}.csv`);
      return res.send('\uFEFF' + csv); // BOM para UTF-8
    }

    if (tipo === 'pdf') {
      // Gerar PDF
      const doc = new PDFDocument({ 
        size: 'A4', 
        layout: 'landscape',
        margin: 40
      });

      // Headers para o PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_ponto_${formato}_${dataInicio}.pdf`);
      
      // Pipe do PDF para a resposta
      doc.pipe(res);

      // Função auxiliar para formatar data
      const formatarData = (data) => {
        if (!data) return '-';
        const d = new Date(data + 'T00:00:00');
        return d.toLocaleDateString('pt-BR');
      };

      // Função auxiliar para formatar hora
      const formatarHora = (hora) => {
        if (!hora) return '-';
        return hora.substring(0, 5); // HH:MM
      };

      // Função auxiliar para formatar número
      const formatarNumero = (num) => {
        if (!num || num === 0) return '-';
        return num.toFixed(2);
      };

      // Função para desenhar cabeçalho
      const desenharCabecalho = () => {
        doc.fontSize(18).font('Helvetica-Bold').text('Relatório de Ponto Eletrônico', 40, 40, { align: 'center', width: doc.page.width - 80 });
        
        const periodoTexto = formato === 'mensal' ? 'Mensal' : formato === 'semanal' ? 'Semanal' : 'Diário';
        doc.fontSize(11).font('Helvetica').text(`Período: ${periodoTexto} - ${formatarData(dataInicio)} a ${formatarData(dataFim)}`, { align: 'center', width: doc.page.width - 80 });
        doc.fontSize(9).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center', width: doc.page.width - 80 });
        doc.moveDown(1.5);
      };

      // Desenhar cabeçalho inicial
      desenharCabecalho();

      // Estatísticas gerais
      const totalRegistros = registros.length;
      const totalHoras = registros.reduce((sum, r) => sum + (r.horas_trabalhadas || 0), 0);
      const totalHorasExtras = registros.reduce((sum, r) => sum + (r.horas_extras || 0), 0);
      const totalAtrasos = registros.filter(r => r.status === 'Atraso').length;
      const totalFaltas = registros.filter(r => r.status === 'Falta').length;

      doc.fontSize(9).font('Helvetica-Bold');
      doc.text(`Resumo: ${totalRegistros} registros | ${totalHoras.toFixed(2)}h trabalhadas | ${totalHorasExtras.toFixed(2)}h extras | ${totalAtrasos} atrasos | ${totalFaltas} faltas`, 
        40, doc.y, { align: 'center', width: doc.page.width - 80 });
      doc.moveDown(1);

      // Configurações da tabela
      const margemEsq = 40;
      const larguraUtil = doc.page.width - 80;
      
      // Larguras proporcionais das colunas
      const colWidths = [55, 80, 50, 40, 40, 40, 40, 45, 45, 65, 80];
      const totalWidth = colWidths.reduce((a, b) => a + b, 0);
      
      const rowHeight = 25;
      const headerHeight = 30;
      
      // Headers da tabela
      const headers = ['Data', 'Funcionário', 'Cargo', 'Entrada', 'Almoço', 'Volta', 'Saída', 'H.Trab', 'H.Ext', 'Status', 'Obs'];

      // Função para desenhar header da tabela
      const desenharHeaderTabela = (y) => {
        doc.rect(margemEsq, y, totalWidth, headerHeight).fillAndStroke('#1e3a8a', '#1e3a8a');
        
        let x = margemEsq;
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF');
        
        headers.forEach((header, i) => {
          doc.text(header, x + 3, y + 10, { 
            width: colWidths[i] - 6, 
            height: headerHeight - 6,
            align: 'left',
            ellipsis: true,
            lineBreak: false
          });
          x += colWidths[i];
        });
        
        return y + headerHeight;
      };

      // Desenhar header da tabela
      let currentY = desenharHeaderTabela(doc.y);

      // Desenhar linhas
      registros.forEach((registro, index) => {
        // Verificar se precisa de nova página
        if (currentY + rowHeight > doc.page.height - 60) {
          doc.addPage({ size: 'A4', layout: 'landscape', margin: 40 });
          currentY = desenharHeaderTabela(60);
        }

        // Cor de fundo alternada
        const bgColor = index % 2 === 0 ? '#f3f4f6' : '#FFFFFF';
        doc.rect(margemEsq, currentY, totalWidth, rowHeight).fillAndStroke(bgColor, '#d1d5db');

        // Dados da linha
        let x = margemEsq;
        doc.fontSize(7).font('Helvetica').fillColor('#000000');

        const nomeFuncionario = registro.funcionario?.nome || 'N/A';
        const cargoFuncionario = registro.funcionario?.cargo || '-';

        const valores = [
          formatarData(registro.data),
          nomeFuncionario.length > 14 ? nomeFuncionario.substring(0, 14) : nomeFuncionario,
          cargoFuncionario.length > 10 ? cargoFuncionario.substring(0, 10) : cargoFuncionario,
          formatarHora(registro.entrada),
          formatarHora(registro.saida_almoco),
          formatarHora(registro.volta_almoco),
          formatarHora(registro.saida),
          formatarNumero(registro.horas_trabalhadas),
          formatarNumero(registro.horas_extras),
          (registro.status || '-').length > 12 ? (registro.status || '-').substring(0, 12) : (registro.status || '-'),
          (registro.observacoes || '-').length > 15 ? (registro.observacoes || '-').substring(0, 15) + '...' : (registro.observacoes || '-')
        ];

        valores.forEach((valor, i) => {
          doc.text(String(valor), x + 3, currentY + 8, { 
            width: colWidths[i] - 6, 
            height: rowHeight - 6,
            align: 'left',
            ellipsis: true,
            lineBreak: false
          });
          x += colWidths[i];
        });

        currentY += rowHeight;
      });

      // Rodapé em todas as páginas
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).font('Helvetica').fillColor('#666666');
        doc.text(
          `Página ${i + 1} de ${range.count}`,
          0,
          doc.page.height - 50,
          { align: 'center', width: doc.page.width }
        );
      }

      // Finalizar PDF
      doc.end();
      return;
    }

    // Retornar JSON
    res.json({
      success: true,
      data: {
        periodo: {
          formato,
          data_inicio: dataInicio,
          data_fim: dataFim
        },
        registros: registros || []
      }
    });

  } catch (error) {
    console.error('Erro na rota de exportação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;
