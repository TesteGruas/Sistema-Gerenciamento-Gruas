import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { lerTokenAssinaturaResponsavel } from '../utils/token-assinatura-ponto.js';
import {
  notificarFuncionarioPontoAssinado,
  notificarFuncionarioPontoRejeitado,
  resolverObraIdParaNotificacao,
} from '../utils/notificacoes-ponto.js';

const router = express.Router();

function erroHttp(status, message) {
  const erro = new Error(message);
  erro.status = status;
  return erro;
}

function formatarDataBr(data) {
  const texto = String(data || '').slice(0, 10);
  const partes = texto.split('-');
  if (partes.length !== 3) return texto || '—';
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

function statusRecusado(status) {
  return String(status || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim() === 'pendente correcao';
}

function formatarHoras(valor) {
  if (valor == null || valor === '') return '0';
  const numero = Number(valor);
  if (Number.isNaN(numero)) return String(valor);
  return Number.isInteger(numero) ? String(numero) : numero.toFixed(2).replace(/\.?0+$/, '');
}

async function carregarContextoToken(token) {
  const payload = lerTokenAssinaturaResponsavel(token);

  const { data: registro, error } = await supabaseAdmin
    .from('registros_ponto')
    .select(
      'id, data, entrada, saida, saida_almoco, volta_almoco, horas_trabalhadas, horas_extras, status, obra_id, funcionario_id, observacoes, assinatura_responsavel_path, funcionario:funcionarios!fk_registros_ponto_funcionario(id, nome, cargo, obra_atual_id)'
    )
    .eq('id', payload.registro_id)
    .maybeSingle();

  if (error || !registro) throw erroHttp(404, 'Registro de ponto não encontrado.');

  const obraId = await resolverObraIdParaNotificacao(registro, registro.funcionario);
  if (!obraId || Number(obraId) !== Number(payload.obra_id)) {
    throw erroHttp(403, 'Este link não corresponde à obra do ponto.');
  }

  let responsavel = null;
  if (payload.responsavel_obra_id) {
    const { data } = await supabaseAdmin
      .from('responsaveis_obra')
      .select('id, nome, email, obra_id, ativo')
      .eq('id', payload.responsavel_obra_id)
      .maybeSingle();
    responsavel = data;
  } else if (payload.usuario_id) {
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('id, nome, email')
      .eq('id', payload.usuario_id)
      .maybeSingle();
    if (usuario?.email) {
      const { data } = await supabaseAdmin
        .from('responsaveis_obra')
        .select('id, nome, email, obra_id, ativo')
        .eq('obra_id', obraId)
        .ilike('email', usuario.email)
        .limit(1);
      responsavel = data?.[0] || null;
    }
  }

  if (!responsavel || !responsavel.ativo || Number(responsavel.obra_id) !== Number(obraId)) {
    throw erroHttp(403, 'Este link não pertence a um responsável ativo desta obra.');
  }

  const { data: obra } = await supabaseAdmin
    .from('obras')
    .select('id, nome')
    .eq('id', obraId)
    .maybeSingle();

  let usuarioId = payload.usuario_id || null;
  if (!usuarioId && responsavel.email) {
    const { data: usuarios } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .ilike('email', responsavel.email)
      .is('deleted_at', null)
      .order('id', { ascending: true })
      .limit(1);
    usuarioId = usuarios?.[0]?.id || null;
  }

  return {
    payload,
    registro,
    responsavel,
    obra,
    usuarioId,
    publico: {
      registro_id: registro.id,
      funcionario_nome: registro.funcionario?.nome || 'Funcionário',
      obra_nome: obra?.nome || `Obra #${obraId}`,
      data: formatarDataBr(registro.data),
      entrada: registro.entrada || '—',
      saida: registro.saida || '—',
      saida_almoco: registro.saida_almoco || '—',
      volta_almoco: registro.volta_almoco || '—',
      horas_trabalhadas: formatarHoras(registro.horas_trabalhadas),
      horas_extras: formatarHoras(registro.horas_extras),
      responsavel_nome: responsavel.nome || 'Responsável',
      ja_assinado: Boolean(registro.assinatura_responsavel_path),
      ja_recusado: statusRecusado(registro.status),
      status: registro.status || null,
    },
  };
}

router.get('/assinatura-responsavel', async (req, res) => {
  try {
    const ctx = await carregarContextoToken(req.query.token);
    res.json({ success: true, data: ctx.publico });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : 'Não foi possível abrir o ponto.',
    });
  }
});

router.post('/assinatura-responsavel', async (req, res) => {
  try {
    const { token, assinatura_digital, observacoes } = req.body || {};
    if (!assinatura_digital || typeof assinatura_digital !== 'string') {
      return res.status(400).json({ success: false, message: 'Assinatura digital é obrigatória.' });
    }

    const ctx = await carregarContextoToken(token);
    if (ctx.registro.assinatura_responsavel_path) {
      return res.status(409).json({
        success: false,
        message: 'Este ponto já foi assinado pelo responsável.',
        data: ctx.publico,
      });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `assinatura_responsavel_${ctx.registro.id}_${timestamp}.png`;
    const base64Data = assinatura_digital.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    if (!buffer.length) {
      return res.status(400).json({ success: false, message: 'Assinatura digital inválida.' });
    }

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('assinaturas-digitais')
      .upload(fileName, buffer, { contentType: 'image/png', upsert: false });

    if (uploadError) {
      console.error('[assinatura-responsavel-token] Erro upload:', uploadError);
      return res.status(500).json({ success: false, message: 'Erro ao salvar a assinatura.' });
    }

    const nota = typeof observacoes === 'string' ? observacoes.trim() : '';
    const { data: registroAtualizado, error: errorUpdate } = await supabaseAdmin
      .from('registros_ponto')
      .update({
        assinatura_responsavel_path: uploadData.path,
        assinatura_responsavel_por: ctx.usuarioId,
        data_assinatura_responsavel: new Date().toISOString(),
        status: 'Pendente Assinatura Funcionário',
        observacoes: nota || ctx.registro.observacoes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ctx.registro.id)
      .is('assinatura_responsavel_path', null)
      .select('*, funcionario:funcionarios!fk_registros_ponto_funcionario(id, nome, cargo, turno, email, telefone_whatsapp, telefone)')
      .maybeSingle();

    if (errorUpdate) {
      console.error('[assinatura-responsavel-token] Erro update:', errorUpdate);
      return res.status(500).json({ success: false, message: 'Erro ao validar o ponto.' });
    }

    if (!registroAtualizado) {
      return res.status(409).json({
        success: false,
        message: 'Este ponto já foi assinado pelo responsável.',
      });
    }

    notificarFuncionarioPontoAssinado(
      registroAtualizado,
      registroAtualizado.funcionario || { id: ctx.registro.funcionario_id },
      { nome: ctx.responsavel.nome }
    ).catch((e) => console.error('[assinatura-responsavel-token] Erro notificação funcionário:', e.message));

    res.json({
      success: true,
      message: 'Ponto assinado. O funcionário já pode confirmar a assinatura.',
      data: { ...ctx.publico, ja_assinado: true, status: 'Pendente Assinatura Funcionário' },
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : 'Não foi possível assinar o ponto.',
    });
  }
});

router.post('/assinatura-responsavel/rejeitar', async (req, res) => {
  try {
    const { token, comentario } = req.body || {};
    const motivo = typeof comentario === 'string' ? comentario.trim() : '';
    if (!motivo) {
      return res.status(400).json({ success: false, message: 'Informe o motivo da recusa.' });
    }

    const ctx = await carregarContextoToken(token);
    if (ctx.registro.assinatura_responsavel_path || ctx.publico.ja_assinado) {
      return res.status(409).json({
        success: false,
        message: 'Este ponto já foi assinado pelo responsável.',
      });
    }
    if (ctx.publico.ja_recusado) {
      return res.status(409).json({
        success: false,
        message: 'Este ponto já foi recusado.',
      });
    }

    const responsavelNome = ctx.responsavel.nome || 'Responsável';
    const { data: registroAtualizado, error: errorUpdate } = await supabaseAdmin
      .from('registros_ponto')
      .update({
        status: 'Pendente Correção',
        observacoes: `[Não concordo — ${responsavelNome}]: ${motivo}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ctx.registro.id)
      .is('assinatura_responsavel_path', null)
      .select('*, funcionario:funcionarios!fk_registros_ponto_funcionario(id, nome, cargo, turno, email, telefone_whatsapp, telefone)')
      .maybeSingle();

    if (errorUpdate) {
      console.error('[assinatura-responsavel-token] Erro ao recusar:', errorUpdate);
      return res.status(500).json({ success: false, message: 'Erro ao recusar o ponto.' });
    }
    if (!registroAtualizado) {
      return res.status(409).json({
        success: false,
        message: 'Este ponto já foi assinado ou recusado.',
      });
    }

    try {
      await notificarFuncionarioPontoRejeitado(
        registroAtualizado,
        registroAtualizado.funcionario || { id: ctx.registro.funcionario_id },
        { nome: responsavelNome },
        motivo
      );
    } catch (e) {
      console.error('[assinatura-responsavel-token] Erro ao avisar recusa:', e?.message || e);
    }

    res.json({
      success: true,
      message: 'Ponto recusado. O funcionário será avisado para corrigir os horários.',
      data: { ...ctx.publico, ja_assinado: false, ja_recusado: true, status: 'Pendente Correção' },
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : 'Não foi possível recusar o ponto.',
    });
  }
});

export default router;
