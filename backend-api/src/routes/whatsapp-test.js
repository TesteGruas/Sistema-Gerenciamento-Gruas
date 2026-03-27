import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { getPublicFrontendUrl } from '../config/public-frontend-url.js';
import { calcularDataLimite } from '../utils/aprovacoes-helpers.js';
import { gerarTokenAprovacao } from '../utils/approval-tokens.js';
import { enviarMensagemAprovacao } from '../services/whatsapp-service.js';
import crypto from 'crypto';

/**
 * Gera um ID único para registros de ponto
 * @param {string} prefix - Prefixo do ID (padrão: 'REG')
 * @returns {string} ID único
 */
function gerarIdRegistro(prefix = 'REG') {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}${timestamp.slice(-6)}${random}`;
}

const router = express.Router();

const WHATSAPP_WEBHOOK_URL = process.env.WHATSAPP_WEBHOOK_URL || 'https://gsouzabd.app.n8n.cloud/webhook/irbana-notify';

function replaceTemplateVars(template, data = {}) {
  let out = String(template || '');
  Object.keys(data || {}).forEach((key) => {
    out = out.replace(new RegExp(`{{${key}}}`, 'g'), data[key] == null ? '' : String(data[key]));
  });
  return out.replace(/\|/g, '\n');
}

function normalizarNumeroWhatsApp(valor) {
  const digits = String(valor || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_templates')
      .select('id, tipo, nome, texto_template, variaveis, ativo, updated_at')
      .order('tipo', { ascending: true });

    if (error) throw error;
    return res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('[whatsapp-templates] Erro ao listar templates:', error);
    return res.status(500).json({ success: false, message: 'Erro ao listar templates de WhatsApp' });
  }
});

router.get('/templates/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const { data, error } = await supabaseAdmin
      .from('whatsapp_templates')
      .select('*')
      .eq('tipo', type)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Template de WhatsApp não encontrado' });
    }
    return res.json({ success: true, data });
  } catch (error) {
    console.error('[whatsapp-templates] Erro ao buscar template:', error);
    return res.status(500).json({ success: false, message: 'Erro ao buscar template de WhatsApp' });
  }
});

router.put('/templates/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const { nome, texto_template, ativo } = req.body || {};

    if (!nome || typeof nome !== 'string' || !String(nome).trim()) {
      return res.status(400).json({ success: false, message: 'Nome é obrigatório' });
    }
    if (!texto_template || typeof texto_template !== 'string' || !String(texto_template).trim()) {
      return res.status(400).json({ success: false, message: 'Texto do template é obrigatório' });
    }
    if (typeof ativo !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Campo ativo deve ser booleano' });
    }

    const { data, error } = await supabaseAdmin
      .from('whatsapp_templates')
      .update({
        nome: String(nome).trim(),
        texto_template: String(texto_template),
        ativo,
        updated_at: new Date().toISOString(),
        updated_by: req.user?.id || null
      })
      .eq('tipo', type)
      .select('*')
      .single();

    if (error) throw error;
    return res.json({ success: true, data, message: 'Template de WhatsApp atualizado com sucesso' });
  } catch (error) {
    console.error('[whatsapp-templates] Erro ao atualizar template:', error);
    return res.status(500).json({ success: false, message: 'Erro ao atualizar template de WhatsApp' });
  }
});

router.post('/templates/:type/preview', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const { texto_template: textoDraft, dados_teste } = req.body || {};

    const { data: row, error } = await supabaseAdmin
      .from('whatsapp_templates')
      .select('tipo, texto_template, variaveis')
      .eq('tipo', type)
      .single();

    if (error || !row) {
      return res.status(404).json({ success: false, message: 'Template de WhatsApp não encontrado' });
    }

    const template = typeof textoDraft === 'string' && textoDraft.trim()
      ? textoDraft
      : row.texto_template;
    const vars = Array.isArray(row.variaveis) ? row.variaveis : [];
    const dados = (dados_teste && typeof dados_teste === 'object') ? { ...dados_teste } : {};
    vars.forEach((v) => {
      if (dados[v] == null) dados[v] = `(${v})`;
    });

    return res.json({
      success: true,
      data: {
        tipo: type,
        mensagem: replaceTemplateVars(template, dados)
      }
    });
  } catch (error) {
    console.error('[whatsapp-templates] Erro ao gerar preview:', error);
    return res.status(500).json({ success: false, message: 'Erro ao gerar preview do template' });
  }
});
/**
 * POST /api/whatsapp/test
 * Envia mensagem de teste via webhook n8n
 * Requer autenticação
 */
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { number, text } = req.body;

    // Validações
    if (!number) {
      return res.status(400).json({
        success: false,
        message: 'Número destinatário é obrigatório'
      });
    }

    // Validar formato do número (apenas dígitos)
    const numeroLimpo = normalizarNumeroWhatsApp(number);
    if (numeroLimpo.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Número inválido. Informe DDD + número (ex.: 81987440990)'
      });
    }

    const mensagem = text || '🔔 Mensagem de teste do sistema de aprovações WhatsApp\n\nSe você recebeu esta mensagem, a integração está funcionando corretamente!';

    // Usar a função enviarMensagemWebhook do whatsapp-service que já inclui instance_name e apikey
    try {
      const { enviarMensagemWebhook } = await import('../services/whatsapp-service.js');
      const resultado = await enviarMensagemWebhook(
        numeroLimpo,
        mensagem,
        null,
        {
          tipo: 'teste'
        }
      );

      if (resultado.sucesso) {
        return res.json({
          success: true,
          message: 'Mensagem de teste enviada com sucesso!',
          data: {
            number: numeroLimpo,
            sent_at: new Date().toISOString()
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          message: resultado.erro || 'Erro ao enviar mensagem de teste'
        });
      }
    } catch (error) {
      console.error('[whatsapp-test] Erro ao enviar teste:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao enviar mensagem de teste'
      });
    }
  } catch (error) {
    console.error('[whatsapp-test] Erro ao enviar mensagem de teste:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao enviar mensagem de teste'
    });
  }
});

/**
 * POST /api/whatsapp/test-completo
 * Cria uma aprovação de teste completa e envia WhatsApp
 * Requer autenticação
 */
router.post('/test-completo', authenticateToken, async (req, res) => {
  try {
    const { numero_destinatario, supervisor_id } = req.body;

    // Validar número destinatário
    if (!numero_destinatario) {
      return res.status(400).json({
        success: false,
        message: 'Número destinatário é obrigatório'
      });
    }

    const numeroLimpo = String(numero_destinatario).replace(/\D/g, '');
    if (numeroLimpo.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Número inválido. Deve conter código do país + DDD + número'
      });
    }

    // Buscar funcionário e supervisor para teste
    let funcionarioId, supervisorId;

    if (supervisor_id) {
      supervisorId = supervisor_id;
    } else {
      // Buscar primeiro supervisor disponível
      const { data: supervisor, error: supervisorError } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .limit(1)
        .single();

      if (supervisorError || !supervisor) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum supervisor encontrado. Informe um supervisor_id'
        });
      }

      supervisorId = supervisor.id;
    }

    // Buscar primeiro funcionário disponível
    const { data: funcionario, error: funcionarioError } = await supabaseAdmin
      .from('funcionarios')
      .select('id')
      .limit(1)
      .single();

    if (funcionarioError || !funcionario) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum funcionário encontrado no sistema'
      });
    }

    funcionarioId = funcionario.id;

    // Criar registro de ponto de teste
    const hoje = new Date().toISOString().split('T')[0];
    
    // Verificar se já existe registro para este funcionário nesta data
    const { data: registroExistente, error: errorBusca } = await supabaseAdmin
      .from('registros_ponto')
      .select('*')
      .eq('funcionario_id', funcionarioId)
      .eq('data', hoje)
      .single();

    let registroPonto;

    if (registroExistente && !errorBusca) {
      // Usar registro existente
      registroPonto = registroExistente;
      console.log('[whatsapp-test] Usando registro de ponto existente:', registroPonto.id);
    } else {
      // Não criar mais registros de teste automaticamente
      // O registro deve ser criado manualmente ou através do sistema de ponto eletrônico
      return res.status(400).json({
        success: false,
        message: 'Não é possível criar registro de teste automaticamente. Crie o registro de ponto manualmente primeiro.'
      });
    }

    // Criar aprovação de teste
    // Nota: registro_ponto_id precisa ser UUID, mas registros_ponto.id é VARCHAR
    // Gerar UUID e armazenar o ID real do registro nas observações
    const uuidRegistroPonto = crypto.randomUUID();
    const dataLimite = calcularDataLimite();
    const { data: aprovacao, error: aprovacaoError } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .insert({
        registro_ponto_id: uuidRegistroPonto, // Usar UUID gerado
        funcionario_id: funcionarioId,
        supervisor_id: supervisorId,
        horas_extras: 3,
        data_trabalho: hoje,
        data_limite: dataLimite.toISOString(),
        status: 'pendente',
        observacoes: `Aprovação de teste criada automaticamente para validação do sistema WhatsApp. Registro original: ${registroPonto.id}`
      })
      .select()
      .single();

    if (aprovacaoError) {
      console.error('[whatsapp-test] Erro ao criar aprovação:', aprovacaoError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar aprovação de teste'
      });
    }

    // Atualizar telefone do supervisor temporariamente para o teste
    // (não modifica o banco, apenas usa o número fornecido)
    const aprovacaoComTelefone = {
      ...aprovacao,
      supervisor_id: supervisorId,
      _telefone_teste: numeroLimpo
    };

    // Gerar token
    const token = await gerarTokenAprovacao(aprovacao.id);

    // Enviar WhatsApp usando o número fornecido (sobrescrevendo o do banco)
    try {
      // Buscar dados do funcionário
      const { data: funcionarioData } = await supabaseAdmin
        .from('funcionarios')
        .select('nome, cpf')
        .eq('id', funcionarioId)
        .single();

      // Enviar WhatsApp usando o serviço (que registra logs automaticamente)
      // Criar objeto de aprovação com telefone de teste
      const aprovacaoComTelefone = {
        ...aprovacao,
        supervisor_id: supervisorId
      };

      // Enviar mensagem usando o número fornecido (não o do supervisor)
      const linkAprovacao = `${getPublicFrontendUrl()}/aprovacaop/${aprovacao.id}?token=${token}`;
      
      // Buscar dados do funcionário para a mensagem
      const mensagem = `🔔 *Nova Solicitação de Aprovação de Horas Extras*

👤 *Funcionário:* ${funcionarioData?.nome || 'Funcionário de Teste'}
📅 *Data do Trabalho:* ${new Date(hoje).toLocaleDateString('pt-BR')}
⏰ *Horas Extras:* 3.00h
📋 *Status:* Pendente

⏳ *Prazo para aprovação:* 7 dias

Clique no link abaixo para aprovar ou rejeitar:

${linkAprovacao}

---
_Sistema de Gestão de Gruas - Teste_`;

      // Usar a função enviarMensagemWebhook do whatsapp-service que já inclui instance_name e apikey
      let envioSucesso = false;
      let erroEnvio = null;

      try {
        const { enviarMensagemWebhook } = await import('../services/whatsapp-service.js');
        const resultado = await enviarMensagemWebhook(
          numeroLimpo,
          mensagem,
          linkAprovacao,
          {
            tipo: 'aprovacao',
            aprovacao_id: aprovacao.id
          }
        );

        if (resultado.sucesso) {
          envioSucesso = true;
          console.log(`[whatsapp-test] Notificação de teste completa enviada para ${numeroLimpo}`);
        } else {
          throw new Error(resultado.erro || 'Erro ao enviar mensagem');
        }
      } catch (error) {
        erroEnvio = error;
        console.error('[whatsapp-test] Erro ao enviar WhatsApp:', error);
      }

      // Nota: enviarMensagemWebhook() já registra o log automaticamente, não é necessário registrar novamente

      if (!envioSucesso) {
        throw erroEnvio;
      }

      return res.json({
        success: true,
        message: 'Aprovação de teste criada e WhatsApp enviado com sucesso!',
        data: {
          aprovacao_id: aprovacao.id,
          token: token,
          link_aprovacao: linkAprovacao,
          numero_destinatario: numeroLimpo,
          funcionario_id: funcionarioId,
          supervisor_id: supervisorId,
          horas_extras: 3,
          data_trabalho: hoje
        }
      });
    } catch (error) {
      console.error('[whatsapp-test] Erro ao enviar WhatsApp:', error);
      // Aprovação foi criada, mas WhatsApp falhou - retornar link mesmo assim
      return res.json({
        success: true,
        message: 'Aprovação de teste criada, mas WhatsApp falhou ao enviar',
        warning: error.message,
        data: {
          aprovacao_id: aprovacao.id,
          token: token,
          link_aprovacao: `${getPublicFrontendUrl()}/aprovacaop/${aprovacao.id}?token=${token}`,
          numero_destinatario: numeroLimpo
        }
      });
    }
  } catch (error) {
    console.error('[whatsapp-test] Erro ao criar teste completo:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao criar teste completo'
    });
  }
});

/**
 * POST /api/whatsapp/seed-horas-extras
 * Gera registros de ponto com horas extras para testes
 * Requer autenticação
 */
router.post('/seed-horas-extras', authenticateToken, async (req, res) => {
  try {
    const { quantidade = 10, dias = 7, limpar = false } = req.body;

    // Validar parâmetros
    if (quantidade < 1 || quantidade > 100) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade deve estar entre 1 e 100'
      });
    }

    if (dias < 1 || dias > 30) {
      return res.status(400).json({
        success: false,
        message: 'Dias deve estar entre 1 e 30'
      });
    }

    console.log(`[whatsapp-test] Iniciando seed de horas extras: quantidade=${quantidade}, dias=${dias}, limpar=${limpar}`);

    // Buscar funcionários e supervisores
    const { data: funcionarios, error: errorFuncionarios } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, user_id')
      .eq('status', 'Ativo')
      .limit(20);

    if (errorFuncionarios || !funcionarios || funcionarios.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum funcionário ativo encontrado. Crie funcionários primeiro.'
      });
    }

    const { data: supervisores, error: errorSupervisores } = await supabaseAdmin
      .from('usuarios')
      .select('id, nome, email')
      .limit(10);

    if (errorSupervisores || !supervisores || supervisores.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum supervisor encontrado. Crie usuários primeiro.'
      });
    }

    // Limpar registros existentes se solicitado
    if (limpar) {
      const { data: aprovacoes } = await supabaseAdmin
        .from('aprovacoes_horas_extras')
        .select('registro_ponto_id')
        .like('observacoes', '%Seed - Teste%');

      if (aprovacoes && aprovacoes.length > 0) {
        const registroIds = aprovacoes.map(a => a.registro_ponto_id).filter(Boolean);
        
        await supabaseAdmin
          .from('aprovacoes_horas_extras')
          .delete()
          .like('observacoes', '%Seed - Teste%');

        if (registroIds.length > 0) {
          await supabaseAdmin
            .from('registros_ponto')
            .delete()
            .in('id', registroIds);
        }
      }
    }

    // Gerar datas retroativas
    const hoje = new Date();
    const datas = [];
    for (let i = 0; i < dias; i++) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      datas.push(data.toISOString().split('T')[0]);
    }

    // Horários base que geram horas extras
    const horariosBase = [
      { entrada: '07:00', saida: '18:00', horas_trabalhadas: 11, horas_extras: 3 },
      { entrada: '06:00', saida: '17:00', horas_trabalhadas: 11, horas_extras: 3 },
      { entrada: '08:00', saida: '20:00', horas_trabalhadas: 12, horas_extras: 4 },
      { entrada: '07:30', saida: '19:30', horas_trabalhadas: 12, horas_extras: 4 },
      { entrada: '06:30', saida: '18:30', horas_trabalhadas: 12, horas_extras: 4 },
      { entrada: '05:00', saida: '18:00', horas_trabalhadas: 13, horas_extras: 5 },
    ];

    const registrosCriados = [];
    const aprovacoesCriadas = [];
    let erros = 0;

    for (let i = 0; i < quantidade; i++) {
      try {
        const funcionario = funcionarios[Math.floor(Math.random() * funcionarios.length)];
        const supervisor = supervisores[Math.floor(Math.random() * supervisores.length)];
        const data = datas[Math.floor(Math.random() * datas.length)];
        const horario = horariosBase[Math.floor(Math.random() * horariosBase.length)];

        // Verificar se já existe registro
        const { data: registroExistente } = await supabaseAdmin
          .from('registros_ponto')
          .select('id')
          .eq('funcionario_id', funcionario.id)
          .eq('data', data)
          .single();

        let registro;
        if (registroExistente) {
          registro = registroExistente;
        } else {
          const registroId = gerarIdRegistro('SEED');
          const { data: novoRegistro, error: registroError } = await supabaseAdmin
            .from('registros_ponto')
            .insert({
              id: registroId,
              funcionario_id: funcionario.id,
              data: data,
              entrada: horario.entrada,
              saida: horario.saida,
              horas_trabalhadas: horario.horas_trabalhadas,
              horas_extras: horario.horas_extras,
              status: 'Pendente Aprovação',
              observacoes: 'Seed - Teste: Registro gerado automaticamente para testes de horas extras'
            })
            .select()
            .single();

          if (registroError) throw registroError;
          registro = novoRegistro;
        }

        registrosCriados.push(registro);

        // Criar aprovação
        const dataLimite = calcularDataLimite();
        const { data: aprovacao, error: aprovacaoError } = await supabaseAdmin
          .from('aprovacoes_horas_extras')
          .insert({
            registro_ponto_id: registro.id,
            funcionario_id: funcionario.id,
            supervisor_id: supervisor.id,
            horas_extras: horario.horas_extras,
            data_trabalho: data,
            data_limite: dataLimite.toISOString(),
            status: 'pendente',
            observacoes: 'Seed - Teste: Aprovação gerada automaticamente para testes do sistema WhatsApp'
          })
          .select()
          .single();

        if (aprovacaoError) throw aprovacaoError;
        aprovacoesCriadas.push(aprovacao);

      } catch (error) {
        erros++;
        console.error(`[whatsapp-test] Erro ao criar registro ${i + 1}:`, error);
      }
    }

    console.log(`[whatsapp-test] Seed concluído: ${registrosCriados.length} registros, ${aprovacoesCriadas.length} aprovações, ${erros} erros`);

    return res.json({
      success: true,
      message: `Seed executado com sucesso!`,
      data: {
        registros_criados: registrosCriados.length,
        aprovacoes_criadas: aprovacoesCriadas.length,
        erros: erros,
        quantidade_solicitada: quantidade
      }
    });
  } catch (error) {
    console.error('[whatsapp-test] Erro ao executar seed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao executar seed de horas extras'
    });
  }
});

export default router;

