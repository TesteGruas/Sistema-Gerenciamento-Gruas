import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
  calcularHorasTrabalhadas, 
  calcularHorasExtras, 
  determinarStatus,
  gerarIdRegistro,
  gerarIdJustificativa,
  validarHorario,
  validarData,
  calcularResumoPeriodo
} from '../utils/ponto-eletronico.js';

const router = express.Router();

// Função para verificar se o usuário é administrador
const verificarSeAdministrador = async (usuarioId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('usuario_perfis')
      .select(`
        perfil_id,
        perfis!inner(nome, nivel_acesso)
      `)
      .eq('usuario_id', usuarioId)
      .eq('status', 'Ativa')
      .single();

    if (error || !data) return false;
    
    return data.perfis.nome === 'Administrador' && data.perfis.nivel_acesso >= 10;
  } catch (error) {
    console.error('Erro ao verificar perfil de administrador:', error);
    return false;
  }
};

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

    // Verificar se o usuário é administrador
    const isAdmin = await verificarSeAdministrador(parseInt(usuario_id));

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
 *           enum: [Normal, Pendente Aprovação, Aprovado, Rejeitado]
 *         description: Status do registro
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
      page = 1, 
      limit = 50 
    } = req.query;

    let query = supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno),
        aprovador:usuarios!registros_ponto_aprovado_por_fkey(nome)
      `, { count: 'exact' })
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

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar registros de ponto:', error);
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
    console.error('Erro na rota de listagem de registros:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
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

    // Calcular novas horas trabalhadas e extras
    const novaEntrada = entrada || registroAtual.entrada;
    const novaSaida = saida || registroAtual.saida;
    const novaSaidaAlmoco = saida_almoco || registroAtual.saida_almoco;
    const novaVoltaAlmoco = volta_almoco || registroAtual.volta_almoco;

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

    // Registrar alteração no histórico
    const alteracoes = [];
    if (entrada && entrada !== registroAtual.entrada) {
      alteracoes.push({
        campo_alterado: 'entrada',
        valor_anterior: registroAtual.entrada,
        valor_novo: entrada
      });
    }
    if (saida_almoco && saida_almoco !== registroAtual.saida_almoco) {
      alteracoes.push({
        campo_alterado: 'saida_almoco',
        valor_anterior: registroAtual.saida_almoco,
        valor_novo: saida_almoco
      });
    }
    if (volta_almoco && volta_almoco !== registroAtual.volta_almoco) {
      alteracoes.push({
        campo_alterado: 'volta_almoco',
        valor_anterior: registroAtual.volta_almoco,
        valor_novo: volta_almoco
      });
    }
    if (saida && saida !== registroAtual.saida) {
      alteracoes.push({
        campo_alterado: 'saida',
        valor_anterior: registroAtual.saida,
        valor_novo: saida
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
 *                       alterado_por:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                             description: Nome do usuário que fez a alteração
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
 * /api/ponto-eletronico/registros/pendentes-aprovacao:
 *   get:
 *     summary: Lista registros pendentes de aprovação para um gestor
 *     tags: [Ponto Eletrônico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: gestor_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do gestor
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
 *         description: ID do gestor é obrigatório
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/registros/pendentes-aprovacao', async (req, res) => {
  try {
    const { gestor_id, page = 1, limit = 20 } = req.query;

    if (!gestor_id) {
      return res.status(400).json({
        success: false,
        message: 'ID do gestor é obrigatório'
      });
    }

    // Buscar a obra do gestor
    const { data: gestor, error: gestorError } = await supabaseAdmin
      .from('funcionarios')
      .select('obra_atual_id')
      .eq('id', gestor_id)
      .eq('status', 'Ativo')
      .single();

    if (gestorError || !gestor) {
      return res.status(404).json({
        success: false,
        message: 'Gestor não encontrado'
      });
    }

    // Buscar registros pendentes de aprovação da mesma obra
    let query = supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, turno, obra_atual_id)
      `)
      .eq('status', 'Pendente Aprovação')
      .eq('funcionario.obra_atual_id', gestor.obra_atual_id)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false });

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar registros pendentes:', error);
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
    console.error('Erro na rota de registros pendentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;
