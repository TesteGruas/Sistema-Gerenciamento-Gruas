import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';

// Helpers e serviços
import {
  buscarSupervisorPorObra,
  calcularDataLimite,
  validarAprovacaoValida,
  buscarFuncionario,
  verificarPermissaoAprovacao,
  calcularDiasRestantes
} from '../utils/aprovacoes-helpers.js';

import {
  criarNotificacaoNovaAprovacao,
  criarNotificacaoResultado,
  criarNotificacoesLote
} from '../services/notificacoes-horas-extras.js';
import { enviarMensagemAprovacao } from '../services/whatsapp-service.js';

const router = express.Router();

// POST /api/aprovacoes-horas-extras - Criar nova aprovação
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      registro_ponto_id,
      funcionario_id,
      supervisor_id,
      horas_extras,
      data_trabalho,
      observacoes
    } = req.body;

    // Validações
    if (!registro_ponto_id || !funcionario_id || !supervisor_id || !horas_extras || !data_trabalho) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: registro_ponto_id, funcionario_id, supervisor_id, horas_extras, data_trabalho'
      });
    }

    if (horas_extras <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Horas extras deve ser maior que zero'
      });
    }

    // Calcular data limite (7 dias)
    const dataLimite = calcularDataLimite();

    // Criar aprovação
    const { data: aprovacao, error } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .insert({
        registro_ponto_id,
        funcionario_id,
        supervisor_id,
        horas_extras,
        data_trabalho,
        observacoes,
        data_limite: dataLimite.toISOString(),
        status: 'pendente'
      })
      .select()
      .single();

    if (error) throw error;

    // Buscar dados do funcionário
    const funcionario = await buscarFuncionario(funcionario_id);

    // Criar notificação para supervisor
    try {
      await criarNotificacaoNovaAprovacao(aprovacao, funcionario);
    } catch (notifError) {
      console.error('[aprovacoes-horas-extras] Erro ao criar notificação:', notifError);
    }

    // Enviar mensagem WhatsApp (não bloqueia a resposta)
    try {
      const resultadoWhatsApp = await enviarMensagemAprovacao(aprovacao);
      if (resultadoWhatsApp.sucesso) {
        console.log(`[aprovacoes-horas-extras] WhatsApp enviado com sucesso para aprovação ${aprovacao.id}`);
      } else {
        console.warn(`[aprovacoes-horas-extras] Falha ao enviar WhatsApp: ${resultadoWhatsApp.erro}`);
      }
    } catch (whatsappError) {
      // Não falhar a criação da aprovação se WhatsApp falhar
      console.error('[aprovacoes-horas-extras] Erro ao enviar WhatsApp:', whatsappError);
    }

    res.status(201).json({
      success: true,
      message: 'Aprovação de horas extras criada com sucesso',
      data: {
        ...aprovacao,
        dias_restantes: calcularDiasRestantes(aprovacao.data_limite)
      }
    });
  } catch (error) {
    console.error('[aprovacoes-horas-extras] Erro ao criar aprovação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar aprovação de horas extras',
      error: error.message
    });
  }
});

// GET /api/aprovacoes-horas-extras/pendentes - Listar pendentes do supervisor logado
router.get('/pendentes', authenticateToken, async (req, res) => {
  try {
    const supervisorId = req.user.id;

    const { data: aprovacoes, error } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .select(`
        *,
        funcionarios:funcionario_id (
          id,
          nome,
          cpf,
          usuarios (nome, email)
        ),
        registros_ponto:registro_ponto_id (
          entrada,
          saida,
          obra_id
        )
      `)
      .eq('supervisor_id', supervisorId)
      .eq('status', 'pendente')
      .order('data_submissao', { ascending: false });

    if (error) throw error;

    // Adicionar dias restantes a cada aprovação
    const aprovacoesComDiasRestantes = aprovacoes.map(apr => ({
      ...apr,
      dias_restantes: calcularDiasRestantes(apr.data_limite)
    }));

    res.json({
      success: true,
      data: aprovacoesComDiasRestantes,
      total: aprovacoesComDiasRestantes.length
    });
  } catch (error) {
    console.error('[aprovacoes-horas-extras] Erro ao listar pendentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar aprovações pendentes',
      error: error.message
    });
  }
});

// GET /api/aprovacoes-horas-extras/funcionario/:id - Listar por funcionário
router.get('/funcionario/:id', authenticateToken, async (req, res) => {
  try {
    const funcionarioId = parseInt(req.params.id);
    const { status } = req.query;

    let query = supabase
      .from('aprovacoes_horas_extras')
      .select(`
        *,
        supervisor:supervisor_id (
          id,
          nome,
          email,
          role
        )
      `)
      .eq('funcionario_id', funcionarioId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('data_submissao', { ascending: false });

    const { data: aprovacoes, error } = await query;

    if (error) throw error;

    // Adicionar dias restantes para aprovações pendentes
    const aprovacoesComInfo = aprovacoes.map(apr => ({
      ...apr,
      dias_restantes: apr.status === 'pendente' ? calcularDiasRestantes(apr.data_limite) : null
    }));

    res.json({
      success: true,
      data: aprovacoesComInfo,
      total: aprovacoesComInfo.length
    });
  } catch (error) {
    console.error('[aprovacoes-horas-extras] Erro ao listar por funcionário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar aprovações do funcionário',
      error: error.message
    });
  }
});

// PUT /api/aprovacoes-horas-extras/:id/aprovar - Aprovar com assinatura
router.put('/:id/aprovar', authenticateToken, async (req, res) => {
  try {
    const aprovacaoId = req.params.id;
    const { assinatura, observacoes } = req.body;
    const supervisorId = req.user.id;

    // Validação de assinatura obrigatória
    if (!assinatura) {
      return res.status(400).json({
        success: false,
        message: 'Assinatura é obrigatória para aprovar horas extras'
      });
    }

    // Validar aprovação
    const { valida, aprovacao, motivo } = await validarAprovacaoValida(aprovacaoId);

    if (!valida) {
      return res.status(400).json({
        success: false,
        message: motivo
      });
    }

    // Verificar permissão
    if (!verificarPermissaoAprovacao(supervisorId, aprovacao.supervisor_id)) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para aprovar esta solicitação'
      });
    }

    // Hash da assinatura para auditoria
    const assinaturaHash = crypto.createHash('sha256').update(assinatura).digest('hex');

    // Atualizar aprovação
    const { data: aprovacaoAtualizada, error } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .update({
        status: 'aprovado',
        assinatura_supervisor: assinaturaHash,
        observacoes: observacoes || aprovacao.observacoes,
        data_aprovacao: new Date().toISOString()
      })
      .eq('id', aprovacaoId)
      .select()
      .single();

    if (error) throw error;

    // Criar notificação para funcionário
    try {
      await criarNotificacaoResultado(
        aprovacaoAtualizada,
        'aprovado',
        req.user,
        observacoes
      );
    } catch (notifError) {
      console.error('[aprovacoes-horas-extras] Erro ao criar notificação:', notifError);
    }

    res.json({
      success: true,
      message: 'Horas extras aprovadas com sucesso',
      data: aprovacaoAtualizada
    });
  } catch (error) {
    console.error('[aprovacoes-horas-extras] Erro ao aprovar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao aprovar horas extras',
      error: error.message
    });
  }
});

// PUT /api/aprovacoes-horas-extras/:id/rejeitar - Rejeitar com motivo
router.put('/:id/rejeitar', authenticateToken, async (req, res) => {
  try {
    const aprovacaoId = req.params.id;
    const { motivo } = req.body;
    const supervisorId = req.user.id;

    // Validação de motivo obrigatório
    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'Motivo é obrigatório para rejeitar horas extras'
      });
    }

    // Validar aprovação
    const { valida, aprovacao, motivo: motivoErro } = await validarAprovacaoValida(aprovacaoId);

    if (!valida) {
      return res.status(400).json({
        success: false,
        message: motivoErro
      });
    }

    // Verificar permissão
    if (!verificarPermissaoAprovacao(supervisorId, aprovacao.supervisor_id)) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para rejeitar esta solicitação'
      });
    }

    // Atualizar aprovação
    const { data: aprovacaoAtualizada, error } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .update({
        status: 'rejeitado',
        observacoes: motivo,
        data_aprovacao: new Date().toISOString()
      })
      .eq('id', aprovacaoId)
      .select()
      .single();

    if (error) throw error;

    // Criar notificação para funcionário
    try {
      await criarNotificacaoResultado(
        aprovacaoAtualizada,
        'rejeitado',
        req.user,
        motivo
      );
    } catch (notifError) {
      console.error('[aprovacoes-horas-extras] Erro ao criar notificação:', notifError);
    }

    res.json({
      success: true,
      message: 'Horas extras rejeitadas',
      data: aprovacaoAtualizada
    });
  } catch (error) {
    console.error('[aprovacoes-horas-extras] Erro ao rejeitar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao rejeitar horas extras',
      error: error.message
    });
  }
});

// POST /api/aprovacoes-horas-extras/aprovar-lote - Aprovação em massa
router.post('/aprovar-lote', authenticateToken, async (req, res) => {
  try {
    const { ids, assinatura, observacoes } = req.body;
    const supervisorId = req.user.id;

    // Validações
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs das aprovações são obrigatórios'
      });
    }

    if (ids.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Limite de 50 aprovações por lote excedido'
      });
    }

    if (!assinatura) {
      return res.status(400).json({
        success: false,
        message: 'Assinatura é obrigatória para aprovação em lote'
      });
    }

    // Hash da assinatura
    const assinaturaHash = crypto.createHash('sha256').update(assinatura).digest('hex');

    // Buscar aprovações
    const { data: aprovacoes, error: fetchError } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .select('*')
      .in('id', ids)
      .eq('supervisor_id', supervisorId)
      .eq('status', 'pendente');

    if (fetchError) throw fetchError;

    if (!aprovacoes || aprovacoes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhuma aprovação pendente encontrada para os IDs fornecidos'
      });
    }

    // Filtrar aprovações válidas (dentro do prazo)
    const agora = new Date();
    const aprovacoesValidas = aprovacoes.filter(apr => new Date(apr.data_limite) > agora);

    if (aprovacoesValidas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Todas as aprovações selecionadas estão fora do prazo'
      });
    }

    // Atualizar em lote
    const idsValidos = aprovacoesValidas.map(apr => apr.id);
    
    const { data: aprovacoesAtualizadas, error: updateError } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .update({
        status: 'aprovado',
        assinatura_supervisor: assinaturaHash,
        observacoes: observacoes || null,
        data_aprovacao: new Date().toISOString()
      })
      .in('id', idsValidos)
      .select();

    if (updateError) throw updateError;

    // Criar notificações em lote
    try {
      await criarNotificacoesLote(aprovacoesAtualizadas, 'aprovado', req.user);
    } catch (notifError) {
      console.error('[aprovacoes-horas-extras] Erro ao criar notificações em lote:', notifError);
    }

    res.json({
      success: true,
      message: `${aprovacoesAtualizadas.length} aprovações processadas com sucesso`,
      data: {
        aprovadas: aprovacoesAtualizadas.length,
        total_solicitado: ids.length,
        ids_aprovados: idsValidos
      }
    });
  } catch (error) {
    console.error('[aprovacoes-horas-extras] Erro na aprovação em lote:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao aprovar em lote',
      error: error.message
    });
  }
});

// POST /api/aprovacoes-horas-extras/rejeitar-lote - Rejeição em lote
router.post('/rejeitar-lote', authenticateToken, async (req, res) => {
  try {
    const { ids, motivo } = req.body;
    const supervisorId = req.user.id;

    // Validações
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs das aprovações são obrigatórios'
      });
    }

    if (ids.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Limite de 50 aprovações por lote excedido'
      });
    }

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'Motivo é obrigatório para rejeição em lote'
      });
    }

    // Buscar aprovações
    const { data: aprovacoes, error: fetchError } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .select('*')
      .in('id', ids)
      .eq('supervisor_id', supervisorId)
      .eq('status', 'pendente');

    if (fetchError) throw fetchError;

    if (!aprovacoes || aprovacoes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhuma aprovação pendente encontrada para os IDs fornecidos'
      });
    }

    // Atualizar em lote
    const idsValidos = aprovacoes.map(apr => apr.id);
    
    const { data: aprovacoesAtualizadas, error: updateError } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .update({
        status: 'rejeitado',
        observacoes: motivo,
        data_aprovacao: new Date().toISOString()
      })
      .in('id', idsValidos)
      .select();

    if (updateError) throw updateError;

    // Criar notificações em lote
    try {
      await criarNotificacoesLote(aprovacoesAtualizadas, 'rejeitado', req.user);
    } catch (notifError) {
      console.error('[aprovacoes-horas-extras] Erro ao criar notificações em lote:', notifError);
    }

    res.json({
      success: true,
      message: `${aprovacoesAtualizadas.length} aprovações rejeitadas`,
      data: {
        rejeitadas: aprovacoesAtualizadas.length,
        total_solicitado: ids.length,
        ids_rejeitados: idsValidos
      }
    });
  } catch (error) {
    console.error('[aprovacoes-horas-extras] Erro na rejeição em lote:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao rejeitar em lote',
      error: error.message
    });
  }
});

// GET /api/aprovacoes-horas-extras/estatisticas - Estatísticas
router.get('/estatisticas', authenticateToken, async (req, res) => {
  try {
    const { periodo = '30' } = req.query; // dias
    const supervisorId = req.user.id;

    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - parseInt(periodo));

    // Buscar estatísticas
    const { data: aprovacoes, error } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .select('status, horas_extras')
      .eq('supervisor_id', supervisorId)
      .gte('data_submissao', dataInicio.toISOString());

    if (error) throw error;

    // Calcular estatísticas
    const stats = {
      total: aprovacoes.length,
      pendentes: aprovacoes.filter(a => a.status === 'pendente').length,
      aprovadas: aprovacoes.filter(a => a.status === 'aprovado').length,
      rejeitadas: aprovacoes.filter(a => a.status === 'rejeitado').length,
      canceladas: aprovacoes.filter(a => a.status === 'cancelado').length,
      total_horas_aprovadas: aprovacoes
        .filter(a => a.status === 'aprovado')
        .reduce((sum, a) => sum + parseFloat(a.horas_extras), 0)
    };

    res.json({
      success: true,
      data: stats,
      periodo: `últimos ${periodo} dias`
    });
  } catch (error) {
    console.error('[aprovacoes-horas-extras] Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas',
      error: error.message
    });
  }
});

export default router;

