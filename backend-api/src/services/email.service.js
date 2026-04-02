/**
 * ==============================================
 * Email Service
 * ==============================================
 * Serviço para envio de emails com templates
 * personalizáveis e criptografia de credenciais
 */

import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { getPublicFrontendUrl } from '../config/public-frontend-url.js';

// Chave de criptografia (deve estar no .env)
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || 'default-key-32-chars-minimum!!';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

/**
 * Criptografa texto usando AES-256-CBC
 * @param {string} text - Texto a ser criptografado
 * @returns {string} Texto criptografado
 */
function encrypt(text) {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Erro ao criptografar:', error);
    throw new Error('Falha na criptografia');
  }
}

/**
 * Descriptografa texto usando AES-256-CBC
 * @param {string} text - Texto criptografado
 * @returns {string} Texto original
 */
function decrypt(text) {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    throw new Error('Falha na descriptografia');
  }
}

/**
 * Busca configurações de email do banco de dados
 * @returns {Promise<Object>} Configurações SMTP
 */
async function getEmailConfig() {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_configs')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      throw new Error('Configurações de email não encontradas');
    }
    
    // Descriptografar credenciais
    const config = {
      ...data,
      smtp_user: decrypt(data.smtp_user),
      smtp_pass: decrypt(data.smtp_pass)
    };
    
    return config;
  } catch (error) {
    console.error('Erro ao buscar configurações de email:', error);
    throw error;
  }
}

/**
 * Cria transporter do nodemailer com as configurações do banco
 * @returns {Promise<Object>} Transporter configurado
 */
async function createTransporter() {
  try {
    console.log('[createTransporter] Buscando configurações de email...');
    const config = await getEmailConfig();
    
    if (!config.email_enabled) {
      const erro = 'Envio de emails está desativado nas configurações';
      console.error('[createTransporter]', erro);
      throw new Error(erro);
    }
    
    // Debug: Log das configurações (sem expor senha)
    console.log('[createTransporter] Configurações SMTP:', {
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_secure,
      user: config.smtp_user ? '***' : 'não definido',
      email_enabled: config.email_enabled,
      email_from: config.email_from
    });
    
    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_secure, // false para porta 2525, true para porta 465
      auth: {
        user: config.smtp_user,
        pass: config.smtp_pass
      },
      // Adicionar opções extras para debug
      logger: true,
      debug: false
    });
    
    console.log('[createTransporter] Transporter criado com sucesso');
    return { transporter, config };
  } catch (error) {
    console.error('[createTransporter] Erro ao criar transporter:', error);
    console.error('[createTransporter] Stack trace:', error.stack);
    throw error;
  }
}

/**
 * Busca template de email do banco
 * @param {string} tipo - Tipo do template (welcome, reset_password, password_changed)
 * @returns {Promise<Object>} Template com variáveis
 */
async function getTemplate(tipo) {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('tipo', tipo)
      .eq('ativo', true)
      .single();
    
    if (error || !data) {
      throw new Error(`Template '${tipo}' não encontrado ou inativo`);
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar template:', error);
    throw error;
  }
}

/**
 * Substitui variáveis no template
 * @param {string} template - Template HTML ou texto
 * @param {Object} data - Dados para substituir
 * @returns {string} Template com variáveis substituídas
 */
function replaceVariables(template, data) {
  let result = template;
  
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, data[key] || '');
  });
  
  return result;
}

/**
 * Template ativo por tipo (ou null se não existir / inativo)
 * @param {string} tipo
 */
async function getActiveTemplateRow(tipo) {
  const { data, error } = await supabaseAdmin
    .from('email_templates')
    .select('*')
    .eq('tipo', tipo)
    .eq('ativo', true)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

/** Template por tipo (ativo ou não) — preview no painel mesmo com template inativo */
async function getTemplateRowAny(tipo) {
  const { data, error } = await supabaseAdmin
    .from('email_templates')
    .select('*')
    .eq('tipo', tipo)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Dados fictícios para preview/teste de substituição {{variavel}}.
 * `dadosTeste` sobrescreve valores (útil na API de teste).
 */
function buildFakeVarsForTemplatePreview(tipo, variaveisJson, publicUrl, destinatario = '', dadosTeste = {}) {
  const dt = dadosTeste && typeof dadosTeste === 'object' ? dadosTeste : {};
  const year = new Date().getFullYear();
  const empresa = dt.empresa || 'Sistema de Gerenciamento de Gruas';
  const baseUrl = String(publicUrl || '').replace(/\/+$/, '');

  const knownByTipo = {
    welcome: {
      nome: 'Maria Silva',
      email: destinatario || 'usuario@exemplo.com',
      senha_temporaria: 'Teste@123',
      link_login: `${baseUrl}/login`,
      empresa,
      ano: year
    },
    reset_password: {
      nome: 'João Teste',
      email: destinatario || 'usuario@exemplo.com',
      reset_link: `${baseUrl}/auth/reset-password/token-teste`,
      expiry_time: '1 hora',
      empresa,
      ano: year
    },
    password_changed: {
      nome: 'João Teste',
      email: destinatario || 'usuario@exemplo.com',
      data_alteracao: new Date().toLocaleString('pt-BR'),
      empresa,
      ano: year
    },
    notificacao_ponto_responsavel: {
      funcionario_nome: 'Carlos Funcionário',
      funcionario_cargo: 'Operador',
      obra_nome: 'Obra Exemplo',
      data_formatada: '26/03/2026',
      entrada: '07:30',
      saida_almoco: '12:00',
      volta_almoco: '13:00',
      saida: '17:30',
      horas_trabalhadas: '8.0',
      horas_extras: '1.0',
      link_assinar: `${baseUrl}/pwa/aprovacao-assinatura?id=0`
    },
    notificacao_ponto_pendente_generica: {
      responsavel_nome: 'Responsável Exemplo',
      obra_nome: 'Obra Exemplo',
      link_aprovacoes: `${baseUrl}/pwa/aprovacoes`
    },
    notificacao_ponto_funcionario: {
      responsavel_nome: 'Responsável Exemplo',
      data_formatada: '26/03/2026',
      horas_trabalhadas: '8.0',
      horas_extras: '1.0',
      link_assinar: `${baseUrl}/pwa/aprovacao-assinatura?id=0`
    },
    notificacao_ponto_rejeicao: {
      responsavel_nome: 'Responsável Exemplo',
      comentario: 'Horário de saída divergente do registro.',
      data_formatada: '26/03/2026',
      entrada: '07:30',
      saida_almoco: '12:00',
      volta_almoco: '13:00',
      saida: '18:00',
      horas_trabalhadas: '8.0',
      horas_extras: '2.0',
      link_corrigir: `${baseUrl}/pwa/aprovacao-assinatura?id=0`
    },
    nota_fiscal_enviada: {
      cliente_nome: 'Cliente Exemplo LTDA',
      empresa,
      numero_nf: 'ND20261466',
      serie: 'NFS-e',
      tipo_nota_label: 'NF de locação',
      data_emissao_fmt: '17/03/2026',
      data_vencimento_fmt: '08/04/2026',
      valor_liquido_fmt: '115.380,90',
      valor_total_fmt: '115.380,90',
      boleto_numero: 'Boleto NF-6-ND20261466',
      boleto_vencimento_fmt: '08/04/2026',
      boleto_valor_fmt: '115.380,90',
      tem_boleto: 'Sim',
      texto_anexos: 'Seguem em anexo o arquivo da nota fiscal e o boleto para pagamento.',
      observacoes_html: '',
      ano: year
    }
  };

  const out = { ...(knownByTipo[tipo] || {}) };
  const keys = Array.isArray(variaveisJson) ? variaveisJson : [];
  for (const k of keys) {
    if (out[k] === undefined) {
      out[k] = dt[k] !== undefined && dt[k] !== null ? String(dt[k]) : `(${k})`;
    }
  }
  return { ...out, ...dt };
}

/**
 * Preview: medição usa payload fictício completo; demais usam template + dados fictícios.
 */
async function previewEmailTemplateByType({ tipo, assuntoDraft, htmlDraft }) {
  if (tipo === 'medicao_enviada') {
    return previewMedicaoEmail({ assunto: assuntoDraft, html_template: htmlDraft });
  }
  if (tipo === 'nota_fiscal_enviada') {
    return previewNotaFiscalEmail({ assunto: assuntoDraft, html_template: htmlDraft });
  }
  const row = await getTemplateRowAny(tipo);
  if (!row) {
    throw new Error(`Template '${tipo}' não encontrado`);
  }
  const assuntoSrc = (assuntoDraft && String(assuntoDraft).trim()) ? assuntoDraft : row.assunto;
  const htmlSrc = (htmlDraft && String(htmlDraft).trim()) ? htmlDraft : row.html_template;
  const vars = buildFakeVarsForTemplatePreview(tipo, row.variaveis, getPublicFrontendUrl(), '', {});
  return {
    assunto: replaceVariables(assuntoSrc, vars),
    html: replaceVariables(htmlSrc, vars)
  };
}

/**
 * Monta assunto/HTML para e-mail de teste (medição ou template genérico do banco).
 */
async function buildTestEmailContent({ tipo, destinatario, dados_teste: dadosTeste }) {
  const dt = dadosTeste && typeof dadosTeste === 'object' ? dadosTeste : {};
  if (tipo === 'medicao_enviada') {
    const agora = new Date().toISOString();
    const medicaoFake = {
      numero: dt.numero ?? '12',
      periodo: dt.periodo ?? '2026-03',
      valor_total: dt.valor_total ?? 39719.03,
      valor_mensal_bruto: dt.valor_mensal_bruto ?? 35000,
      valor_aditivos: dt.valor_aditivos ?? 0,
      valor_custos_extras: dt.valor_custos_extras ?? 4719.03,
      valor_descontos: dt.valor_descontos ?? 0,
      data_inicio_emissao: dt.data_inicio_emissao || '2026-03-01',
      data_medicao: dt.data_medicao || '2026-03-31',
      created_at: dt.created_at || agora,
      data_envio: dt.data_envio || agora,
      data_aprovacao: dt.data_aprovacao || agora,
      status: 'enviada',
      status_aprovacao: dt.status_aprovacao || 'pendente',
      observacoes_aprovacao: dt.observacoes_aprovacao || null,
      updated_at: agora,
      obras: dt.obra_nome ? { nome: dt.obra_nome } : { nome: 'Obra Vereda' },
      orcamentos: null,
      gruas: dt.grua_nome
        ? { name: dt.grua_nome, modelo: dt.grua_modelo != null ? String(dt.grua_modelo) : '' }
        : { name: "Grua 00'", modelo: 'Liebheer 67' }
    };
    const clienteFake = {
      nome: dt.cliente_nome || 'Cliente Teste'
    };
    const linkPdf = dt.link_pdf || `${getPublicFrontendUrl()}/api/relatorios/medicao/publico/pdf/token-demo`;
    const documentosTeste = Array.isArray(dt.documentos)
      ? dt.documentos
      : [
          { tipo_documento: 'nf_servico', valor: 2500, status: 'pendente' },
          { tipo_documento: 'nf_locacao', valor: 37219.03, status: 'pendente' }
        ];
    return buildMedicaoClienteEmail({
      medicao: medicaoFake,
      linkPdfPublico: linkPdf,
      cliente: clienteFake,
      empresaNome: dt.empresa || 'Sistema de Gerenciamento de Gruas',
      documentos: documentosTeste
    });
  }

  if (tipo === 'nota_fiscal_enviada') {
    const notaFake = {
      numero_nf: dt.numero_nf ?? 'ND20261466',
      serie: dt.serie ?? 'NFS-e',
      tipo_nota: dt.tipo_nota ?? 'nf_locacao',
      data_emissao: dt.data_emissao || new Date().toISOString(),
      data_vencimento: dt.data_vencimento || new Date().toISOString(),
      valor_liquido: dt.valor_liquido ?? 115380.9,
      valor_total: dt.valor_total ?? 115380.9,
      observacoes: dt.observacoes ?? ''
    };
    const clienteFake = {
      nome: dt.cliente_nome || 'Cliente Exemplo LTDA'
    };
    const boletoFake = {
      numero_boleto: dt.boleto_numero || 'Boleto NF-6-ND20261466',
      data_vencimento: dt.boleto_vencimento || new Date().toISOString(),
      valor: dt.boleto_valor ?? 115380.9,
      arquivo_boleto: 'https://exemplo.invalido/boleto.pdf'
    };
    return buildNotaFiscalClienteEmail({
      nota: notaFake,
      cliente: clienteFake,
      boleto: boletoFake,
      empresaNome: dt.empresa || 'Sistema de Gerenciamento de Gruas'
    });
  }

  const row = await getTemplateRowAny(tipo);
  if (!row) {
    throw new Error(`Template '${tipo}' não encontrado`);
  }
  if (!row.ativo) {
    throw new Error('Template inativo — ative o template para enviar teste');
  }
  const vars = buildFakeVarsForTemplatePreview(
    tipo,
    row.variaveis,
    getPublicFrontendUrl(),
    destinatario,
    dt
  );
  return {
    assunto: replaceVariables(row.assunto, vars),
    html: replaceVariables(row.html_template, vars)
  };
}

function escapeHtmlMedicao(s) {
  if (s == null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Mesma regra da tela da medição: nome + " - " + modelo quando houver modelo. */
function formatGruaLinhaMedicaoEmail(medicao) {
  const g = medicao?.gruas;
  if (!g) return '—';
  const name = (g.name || '').trim();
  const modelo = (g.modelo || '').trim();
  if (!name && !modelo) return '—';
  if (name && modelo) return `${name} - ${modelo}`;
  return name || modelo;
}

function fmtMoneyBrlMedicao(n) {
  const v = parseFloat(n || 0);
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDateTimePtMedicao(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function labelStatusMedicaoStr(s) {
  const m = { pendente: 'Pendente', finalizada: 'Finalizada', cancelada: 'Cancelada', enviada: 'Enviada' };
  return m[s] || (s ? String(s) : '-');
}

function labelAprovacaoStr(s) {
  const m = { pendente: 'Pendente', aprovada: 'Aprovada', rejeitada: 'Rejeitada' };
  return m[s] || (s ? String(s) : 'Pendente');
}

function labelDocStatusMedicao(s) {
  const m = {
    pendente: 'Pendente',
    gerado: 'Gerado',
    enviado: 'Enviado',
    pago: 'Pago',
    cancelado: 'Cancelado'
  };
  return m[s] || (s ? String(s) : 'Pendente');
}

/** Nomes dos meses para assunto (ex.: MARÇO/2026) */
const MESES_ASSUNTO_MEDICAO = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

/** Nomes para texto corrido (ex.: março, fevereiro) */
const MESES_TEXTO_MEDICAO = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

function parsePeriodoMedicao(periodo) {
  if (!periodo || typeof periodo !== 'string') return null;
  const m = periodo.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  return { ano: parseInt(m[1], 10), mes: parseInt(m[2], 10) };
}

/** Ex.: 2026-03 → MARÇO/2026 */
function periodoParaAssuntoMedicao(periodo) {
  const p = parsePeriodoMedicao(periodo);
  if (!p || p.mes < 1 || p.mes > 12) return String(periodo || '');
  return `${MESES_ASSUNTO_MEDICAO[p.mes - 1]}/${p.ano}`;
}

/** Ex.: 2026-03 → março */
function periodoParaMesNomeMinusculo(periodo) {
  const p = parsePeriodoMedicao(periodo);
  if (!p || p.mes < 1 || p.mes > 12) return '';
  return MESES_TEXTO_MEDICAO[p.mes - 1];
}

/** Mês anterior ao período (para texto de horas extras), ex.: 2026-03 → fevereiro */
function mesAnteriorAoPeriodoNome(periodo) {
  const p = parsePeriodoMedicao(periodo);
  if (!p) return '';
  let mes = p.mes - 1;
  if (mes < 1) mes = 12;
  return MESES_TEXTO_MEDICAO[mes - 1];
}

/** Ex.: 2026-04 → Abril 2026 (igual `medicoesUtils.formatPeriodo` no frontend) */
const MESES_NOME_CAPITALIZADO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function formatPeriodoMesAnoMedicao(periodo) {
  const p = parsePeriodoMedicao(periodo);
  if (!p || p.mes < 1 || p.mes > 12) return String(periodo || '');
  return `${MESES_NOME_CAPITALIZADO[p.mes - 1]} ${p.ano}`;
}

/** Dias corridos entre duas datas YYYY-MM-DD (inclusive), igual ao formulário de medição. */
function calcularDiasPeriodoEmissaoNode(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return 0;
  const [ai, mi, di] = String(dataInicio).split('-').map(Number);
  const [af, mf, df] = String(dataFim).split('-').map(Number);
  const inicio = new Date(ai, mi - 1, di);
  const fim = new Date(af, mf - 1, df);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim < inicio) return 0;
  return Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function extrairIntervaloEmissaoMedicao(medicao) {
  const dataFimStr = medicao.data_medicao ? String(medicao.data_medicao).split('T')[0] : '';
  let dataInicioStr = medicao.data_inicio_emissao
    ? String(medicao.data_inicio_emissao).split('T')[0]
    : '';
  if (!dataInicioStr && medicao.periodo && /^\d{4}-\d{2}$/.test(String(medicao.periodo))) {
    dataInicioStr = `${medicao.periodo}-01`;
  }
  return { dataInicioStr, dataFimStr };
}

function saudacaoDoDiaMedicao() {
  const h = new Date().getHours();
  if (h < 12) return 'bom dia';
  if (h < 18) return 'boa tarde';
  return 'boa noite';
}

function pickValorDocumentoMedicao(documentos, tipo) {
  const list = Array.isArray(documentos) ? documentos : [];
  const d = list.find((x) => x.tipo_documento === tipo);
  if (d && d.valor != null && d.valor !== '') {
    const v = parseFloat(d.valor);
    if (!Number.isNaN(v)) return v;
  }
  return null;
}

/**
 * Valores NF serviço e fatura locação: prioriza documentos; completa pela diferença do total.
 */
function resolverValoresNfELocacaoMedicao(documentos, valorTotal) {
  let nf = pickValorDocumentoMedicao(documentos, 'nf_servico');
  let loc = pickValorDocumentoMedicao(documentos, 'nf_locacao');
  if (loc == null) loc = pickValorDocumentoMedicao(documentos, 'nf_produto');
  const total = Math.round(parseFloat(valorTotal || 0) * 100) / 100;
  if (nf != null && loc == null && total > 0) {
    loc = Math.round((total - nf) * 100) / 100;
    if (loc < 0) loc = null;
  } else if (loc != null && nf == null && total > 0) {
    nf = Math.round((total - loc) * 100) / 100;
    if (nf < 0) nf = null;
  }
  return { nf, loc };
}

const TEXTO_RETENCOES_NF_SERVICO =
  '(contém retenção de INSS 11% e ISS 5% sobre o valor total)';

/**
 * Bloco no estilo do e-mail comercial manual: saudação, texto, resumo NF + locação, fechamento.
 */
function buildBlocoComercialMedicaoHtml(medicao, documentos) {
  const mesRef = periodoParaMesNomeMinusculo(medicao.periodo);
  const mesHe = mesAnteriorAoPeriodoNome(medicao.periodo);
  const saud = saudacaoDoDiaMedicao();
  const { nf, loc } = resolverValoresNfELocacaoMedicao(documentos, medicao.valor_total);
  const totalFmt = fmtMoneyBrlMedicao(medicao.valor_total);

  const p1 =
    mesRef && mesHe
      ? `Encaminho em anexo a medição referente ao mês de <strong>${escapeHtmlMedicao(mesRef)}</strong>, contendo horas extras correspondentes ao período de <strong>${escapeHtmlMedicao(mesHe)}</strong>.`
      : `Encaminho em anexo a medição referente ao período <strong>${escapeHtmlMedicao(String(medicao.periodo || ''))}</strong>.`;

  let resumoLinhas =
    `<p style="margin:16px 0 0;font-size:14px;color:#111827;line-height:1.5;"><strong>Resumo da medição e modo a faturar</strong></p>` +
    `<p style="margin:10px 0 0;font-size:14px;color:#374151;">Valor total da medição: R$ ${totalFmt}</p>`;

  if (nf != null) {
    resumoLinhas +=
      `<p style="margin:8px 0 0;font-size:14px;color:#374151;">- Nota Fiscal de Serviço (salário do operador): R$ ${fmtMoneyBrlMedicao(nf)} ` +
      `<span style="font-size:11px;color:#6b7280;">${TEXTO_RETENCOES_NF_SERVICO}</span></p>`;
  }
  if (loc != null) {
    resumoLinhas += `<p style="margin:8px 0 0;font-size:14px;color:#374151;">- Fatura de Locação: R$ ${fmtMoneyBrlMedicao(loc)}</p>`;
  }

  return (
    `<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">Prezado(a), ${saud}!</p>` +
    `<p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.6;">${p1}</p>` +
    `<p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">Ficamos no aguardo da aprovação para que possamos dar sequência ao faturamento.</p>` +
    resumoLinhas +
    `<p style="margin:20px 0 0;font-size:14px;color:#374151;line-height:1.6;">Qualquer dúvida ou necessidade de ajuste, por favor, me informe.</p>` +
    `<p style="margin:16px 0 0;font-size:14px;color:#374151;line-height:1.6;">—<br/>Atenciosamente,</p>`
  );
}

const DOC_TIPO_LABEL_MEDICAO = {
  medicao_pdf: 'PDF da medição',
  nf_servico: 'NF de serviço',
  nf_locacao: 'NF de locação',
  nf_produto: 'NF produto',
  boleto_nf_servico_1: 'Boleto (NF serviço)',
  boleto_nf_servico_2: 'Boleto NF serviço (2º)',
  boleto_nf_locacao_1: 'Boleto (locação)',
  boleto_nf_locacao_2: 'Boleto locação (2º)'
};

const DOC_DISPLAY_ORDER_MEDICAO = [
  'medicao_pdf',
  'nf_servico',
  'nf_locacao',
  'nf_produto',
  'boleto_nf_servico_1',
  'boleto_nf_servico_2',
  'boleto_nf_locacao_1',
  'boleto_nf_locacao_2'
];

function buildHistoricoStatusHtmlMedicao(medicao) {
  const rows = [];
  if (medicao.created_at) {
    rows.push(
      '<div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px;background:#f9fafb;margin-bottom:8px;">' +
        '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
        '<td valign="top"><p style="margin:0;font-size:14px;font-weight:600;">Criada</p>' +
        '<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Registro inicial da medição</p></td>' +
        '<td style="text-align:right;white-space:nowrap;font-size:12px;color:#4b5563;">' +
        escapeHtmlMedicao(fmtDateTimePtMedicao(medicao.created_at)) +
        '</td></tr></table></div>'
    );
  }
  if (medicao.data_envio) {
    rows.push(
      '<div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px;background:#f9fafb;margin-bottom:8px;">' +
        '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
        '<td valign="top"><p style="margin:0;font-size:14px;font-weight:600;">Enviada ao Cliente</p>' +
        '<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Aguardando aprovação/rejeição</p></td>' +
        '<td style="text-align:right;white-space:nowrap;font-size:12px;color:#4b5563;">' +
        escapeHtmlMedicao(fmtDateTimePtMedicao(medicao.data_envio)) +
        '</td></tr></table></div>'
    );
  }
  const st = escapeHtmlMedicao(labelStatusMedicaoStr(medicao.status));
  const apr = escapeHtmlMedicao(labelAprovacaoStr(medicao.status_aprovacao || 'pendente'));
  const obs = medicao.observacoes_aprovacao
    ? escapeHtmlMedicao(medicao.observacoes_aprovacao)
    : '';
  const obsBlock = obs
    ? `<p style="margin:8px 0 0;font-size:12px;color:#4b5563;white-space:pre-wrap;">Observação: ${obs}</p>`
    : '';
  const dataLinha = medicao.data_aprovacao || medicao.updated_at;
  const dataDir = dataLinha
    ? `<td style="text-align:right;vertical-align:top;white-space:nowrap;font-size:12px;color:#4b5563;">${escapeHtmlMedicao(fmtDateTimePtMedicao(dataLinha))}</td>`
    : '<td></td>';
  const showApr =
    medicao.status === 'enviada' || medicao.status_aprovacao;
  rows.push(
    '<div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px;background:#f9fafb;">' +
      '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
      '<td valign="top" style="padding-right:8px;">' +
      '<p style="margin:0;font-size:14px;font-weight:600;">Status atual</p>' +
      '<p style="margin:8px 0 0;">' +
      `<span style="display:inline-block;border-radius:9999px;padding:4px 10px;font-size:11px;font-weight:600;background:#e5e7eb;color:#374151;">${st}</span>` +
      (showApr
        ? `<span style="display:inline-block;margin-left:6px;border-radius:9999px;padding:4px 10px;font-size:11px;font-weight:600;background:#2563eb;color:#fff;">${apr}</span>`
        : '') +
      '</p>' +
      obsBlock +
      '</td>' +
      dataDir +
      '</tr></table></div>'
  );
  return rows.join('');
}

function buildDocumentosResumoHtmlMedicao(documentos, _medicaoNumero) {
  const list = Array.isArray(documentos) ? documentos : [];
  const byTipo = {};
  for (const d of list) {
    const t = d.tipo_documento;
    if (t && !byTipo[t]) byTipo[t] = d;
  }
  const rows = [];
  for (const tipo of DOC_DISPLAY_ORDER_MEDICAO) {
    const label = DOC_TIPO_LABEL_MEDICAO[tipo] || tipo;
    const d = byTipo[tipo];
    const temArquivo = !!(d && d.caminho_arquivo && String(d.caminho_arquivo).trim());
    const mark = temArquivo ? '✓' : '○';
    const cor = temArquivo ? '#15803d' : '#9ca3af';
    rows.push(
      '<tr>' +
        `<td style="padding:3px 10px 3px 0;font-size:15px;color:${cor};vertical-align:top;width:1.25em;">${mark}</td>` +
        `<td style="padding:3px 0;font-size:13px;color:#374151;line-height:1.35;">${escapeHtmlMedicao(label)}` +
        (temArquivo
          ? ` <span style="color:#6b7280;font-size:12px;">(${escapeHtmlMedicao(labelDocStatusMedicao(d.status))})</span>`
          : ' <span style="color:#9ca3af;font-size:12px;">(sem arquivo)</span>') +
        '</td>' +
        '</tr>'
    );
  }
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0;">' +
      rows.join('') +
      '</table>' +
    '<p style="margin:10px 0 0;font-size:11px;color:#6b7280;line-height:1.4;">' +
      '✓ cadastrado com arquivo · ○ sem arquivo. Os PDFs disponíveis seguem em anexo a este e-mail.' +
    '</p>'
  );
}

function getDefaultMedicaoEnviadaTemplateHtml() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medição</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:16px 8px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;border-bottom:2px solid #2563eb;text-align:center;">
              <p style="margin:0;font-size:20px;font-weight:bold;color:#1e3a8a;">{{empresa}}</p>
              <p style="margin:10px 0 0;font-size:14px;color:#4b5563;">Medição — análise e faturamento</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;">
              <div style="margin-bottom:4px;">{{bloco_comercial_html}}</div>
              <p style="margin:20px 0 12px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.03em;">Detalhes no sistema</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px;" />

              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">Informações básicas</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="50%" style="padding:6px 8px 6px 0;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Número</p>
                    <p style="margin:4px 0 0;font-size:14px;font-weight:600;">{{numero}}</p>
                  </td>
                  <td width="50%" style="padding:6px 0 6px 8px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Período (mês/ano)</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{periodo_formatado}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 8px 6px 0;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Data Início Emissão</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{data_inicio_emissao}}</p>
                  </td>
                  <td style="padding:6px 0 6px 8px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Data Fim Emissão</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{data_fim_emissao}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 8px 6px 0;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Total de Dias</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{total_dias_emissao}}</p>
                  </td>
                  <td style="padding:6px 0 6px 8px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Grua</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{grua_linha}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 8px 6px 0;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Obra</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{obra_nome}}</p>
                  </td>
                  <td style="padding:6px 0 6px 8px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Valor Total</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#2563eb;">R$ {{valor_total}}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">Valores</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td width="25%" style="padding:6px 4px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Valor mensal bruto</p>
                    <p style="margin:4px 0 0;font-size:13px;font-weight:600;">R$ {{valor_mensal_bruto}}</p>
                  </td>
                  <td width="25%" style="padding:6px 4px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Aditivos</p>
                    <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#16a34a;">R$ {{valor_aditivos}}</p>
                  </td>
                  <td width="25%" style="padding:6px 4px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Custos extras</p>
                    <p style="margin:4px 0 0;font-size:13px;font-weight:600;">R$ {{valor_custos_extras}}</p>
                  </td>
                  <td width="25%" style="padding:6px 4px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Descontos</p>
                    <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#dc2626;">R$ {{valor_descontos}}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">Histórico de status da medição</p>
              <div style="margin-bottom:20px;">{{historico_status_html}}</div>

              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">Checklist de documentos</p>
              <div style="margin-bottom:16px;">{{documentos_resumo_html}}</div>

              <div style="background:#f8f9fa;padding:14px;border-left:4px solid #007bff;margin:16px 0;">
                <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#333;">PDF público da medição</p>
                <p style="margin:0 0 8px;font-size:12px;color:#555;">Copie o endereço abaixo e abra no <strong>navegador</strong>. Links em e-mail costumam não abrir o app PWA corretamente.</p>
                <p style="margin:0;font-size:11px;word-break:break-all;font-family:Consolas,monospace;color:#111;">{{link_pdf}}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af;">
              E-mail automático — {{empresa}} · © {{ano}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Variáveis {{...}} para template de medição (reutilizável em preview).
 */
function buildMedicaoEmailVars({ medicao, linkPdfPublico, cliente, empresaNome, documentos = [] }) {
  const valorNum = parseFloat(medicao.valor_total || 0);
  const valorBr = fmtMoneyBrlMedicao(valorNum);
  const { dataInicioStr, dataFimStr } = extrairIntervaloEmissaoMedicao(medicao);
  const fmtDia = (ymd) => {
    if (!ymd) return '—';
    const d = new Date(`${ymd}T12:00:00`);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
  };
  const data_inicio_emissao = fmtDia(dataInicioStr);
  const data_fim_emissao = fmtDia(dataFimStr);
  const diasN = dataInicioStr && dataFimStr ? calcularDiasPeriodoEmissaoNode(dataInicioStr, dataFimStr) : 0;
  const total_dias_emissao = diasN > 0 ? `${diasN} dia(s)` : '—';
  const periodo_formatado = formatPeriodoMesAnoMedicao(medicao.periodo);
  const dataMed = data_fim_emissao !== '—' ? data_fim_emissao : medicao.data_medicao
    ? new Date(medicao.data_medicao).toLocaleDateString('pt-BR')
    : '-';
  const obraNome = medicao.obras?.nome
    || (medicao.orcamentos?.numero != null ? `Orçamento ${medicao.orcamentos.numero}` : '-');
  const clienteNome = cliente?.nome || '-';
  const gruaNomeCurto = medicao.gruas?.name || '-';
  const gruaLinha = formatGruaLinhaMedicaoEmail(medicao);
  const gruaLinhaHtml = escapeHtmlMedicao(gruaLinha);
  const empresa = empresaNome || 'Sistema de Gerenciamento de Gruas';

  const historico_status_html = buildHistoricoStatusHtmlMedicao(medicao);
  const documentos_resumo_html = buildDocumentosResumoHtmlMedicao(documentos, medicao.numero);
  const bloco_comercial_html = buildBlocoComercialMedicaoHtml(medicao, documentos);
  const periodo_assunto = periodoParaAssuntoMedicao(medicao.periodo);
  const obra_nome_assunto = String(obraNome || '-').toUpperCase();
  const grua_nome_assunto = String(gruaNomeCurto || '-').toUpperCase();

  return {
    numero: escapeHtmlMedicao(String(medicao.numero ?? '')),
    periodo: String(medicao.periodo ?? ''),
    periodo_formatado,
    periodo_assunto: periodo_assunto,
    obra_nome_assunto: obra_nome_assunto,
    grua_nome_assunto: grua_nome_assunto,
    valor_total: valorBr,
    valor_mensal_bruto: fmtMoneyBrlMedicao(medicao.valor_mensal_bruto),
    valor_aditivos: fmtMoneyBrlMedicao(medicao.valor_aditivos),
    valor_custos_extras: fmtMoneyBrlMedicao(medicao.valor_custos_extras),
    valor_descontos: fmtMoneyBrlMedicao(medicao.valor_descontos),
    /** Texto exibido como na tela (nome + modelo); HTML escapado. */
    grua_nome: gruaLinhaHtml,
    grua_linha: gruaLinhaHtml,
    obra_nome: escapeHtmlMedicao(obraNome),
    cliente_nome: escapeHtmlMedicao(clienteNome),
    data_medicao: dataMed,
    data_inicio_emissao,
    data_fim_emissao,
    total_dias_emissao,
    link_pdf: linkPdfPublico,
    empresa: escapeHtmlMedicao(empresa),
    ano: String(new Date().getFullYear()),
    historico_status_html,
    documentos_resumo_html,
    bloco_comercial_html
  };
}

function getFakeMedicaoPreviewPayload() {
  const agora = new Date().toISOString();
  return {
    medicao: {
      numero: '12',
      periodo: '2026-03',
      valor_total: 39719.03,
      valor_mensal_bruto: 35000,
      valor_aditivos: 0,
      valor_custos_extras: 4719.03,
      valor_descontos: 0,
      data_inicio_emissao: '2026-03-01',
      data_medicao: '2026-03-31',
      created_at: agora,
      data_envio: agora,
      data_aprovacao: null,
      status: 'enviada',
      status_aprovacao: 'pendente',
      observacoes_aprovacao: null,
      updated_at: agora,
      obras: { nome: 'Obra Vereda' },
      orcamentos: null,
      gruas: { name: "Grua 00'", modelo: 'Liebheer 67' }
    },
    cliente: { nome: 'Cliente Exemplo LTDA' },
    documentos: [
      { tipo_documento: 'nf_servico', valor: 2500, status: 'pendente' },
      { tipo_documento: 'nf_locacao', valor: 37219.03, status: 'pendente' }
    ],
    linkPdfPublico: `${getPublicFrontendUrl()}/api/relatorios/medicao/publico/pdf/preview-demo`,
    empresaNome: 'Sistema de Gerenciamento de Gruas'
  };
}

/**
 * Preview com dados fictícios. Se assunto e html_template forem enviados (rascunho do editor), aplica variáveis neles;
 * caso contrário usa o template ativo do banco (ou HTML padrão).
 */
async function previewMedicaoEmail({ assunto: assuntoDraft, html_template: htmlDraft } = {}) {
  const { medicao, cliente, documentos, linkPdfPublico, empresaNome } = getFakeMedicaoPreviewPayload();
  const vars = buildMedicaoEmailVars({
    medicao,
    linkPdfPublico,
    cliente,
    empresaNome,
    documentos
  });

  const hasDraft =
    typeof assuntoDraft === 'string' &&
    typeof htmlDraft === 'string' &&
    assuntoDraft.trim() !== '' &&
    htmlDraft.trim() !== '';

  if (hasDraft) {
    return {
      assunto: replaceVariables(assuntoDraft, vars),
      html: replaceVariables(htmlDraft, vars)
    };
  }

  const tpl = await getActiveTemplateRow('medicao_enviada');
  if (tpl) {
    return {
      assunto: replaceVariables(tpl.assunto, vars),
      html: replaceVariables(tpl.html_template, vars)
    };
  }

  return {
    assunto: `MEDIÇÃO ${vars.numero} - ${vars.periodo_assunto} - ${vars.obra_nome_assunto} - ${vars.grua_nome_assunto}`,
    html: replaceVariables(getDefaultMedicaoEnviadaTemplateHtml(), vars)
  };
}

/**
 * Monta assunto e HTML do e-mail de medição enviada ao cliente (template DB ou padrão).
 * @param {Object} params
 * @param {Object} params.medicao
 * @param {string} params.linkPdfPublico
 * @param {Object} params.cliente
 * @param {string} [params.empresaNome]
 * @param {Array} [params.documentos]
 */
async function buildMedicaoClienteEmail({ medicao, linkPdfPublico, cliente, empresaNome, documentos = [] }) {
  const vars = buildMedicaoEmailVars({ medicao, linkPdfPublico, cliente, empresaNome, documentos });

  const tpl = await getActiveTemplateRow('medicao_enviada');
  if (tpl) {
    return {
      assunto: replaceVariables(tpl.assunto, vars),
      html: replaceVariables(tpl.html_template, vars)
    };
  }

  return {
    assunto: `MEDIÇÃO ${vars.numero} - ${vars.periodo_assunto} - ${vars.obra_nome_assunto} - ${vars.grua_nome_assunto}`,
    html: replaceVariables(getDefaultMedicaoEnviadaTemplateHtml(), vars)
  };
}

function labelTipoNotaFiscal(tipoNota) {
  const m = {
    nf_servico: 'NF de serviço',
    nf_locacao: 'NF de locação',
    fatura: 'Fatura',
    nfe_eletronica: 'NF-e'
  };
  return m[tipoNota] || (tipoNota ? String(tipoNota) : '-');
}

/**
 * Variáveis {{...}} para template de nota fiscal enviada ao cliente.
 */
function buildNotaFiscalEmailVars({ nota, cliente, boleto, empresaNome }) {
  const empresa = empresaNome || 'Sistema de Gerenciamento de Gruas';
  const fmtDate = (d) => {
    if (!d) return '-';
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? '-' : x.toLocaleDateString('pt-BR');
  };
  const vl = parseFloat(nota.valor_liquido != null ? nota.valor_liquido : nota.valor_total || 0);
  const vt = parseFloat(nota.valor_total || 0);
  const valorLiquidoFmt = fmtMoneyBrlMedicao(vl);
  const valorTotalFmt = fmtMoneyBrlMedicao(vt);
  const temBoleto = Boolean(boleto && boleto.arquivo_boleto);
  const textoAnexos = temBoleto
    ? 'Seguem em anexo o arquivo da nota fiscal e o boleto para pagamento.'
    : 'Segue em anexo o arquivo da nota fiscal.';
  const observacoesHtml = (nota.observacoes && String(nota.observacoes).trim())
    ? `<p style="margin:16px 0 0;font-size:13px;color:#374151;"><strong>Observações:</strong><br/>${escapeHtmlMedicao(nota.observacoes)}</p>`
    : '';

  let boletoNumero = '-';
  let boletoVenc = '-';
  let boletoValor = '-';
  if (boleto) {
    boletoNumero = String(boleto.numero_boleto || '-');
    boletoVenc = fmtDate(boleto.data_vencimento);
    boletoValor = fmtMoneyBrlMedicao(boleto.valor);
  }

  return {
    cliente_nome: cliente?.nome || '-',
    empresa,
    numero_nf: String(nota.numero_nf || ''),
    serie: nota.serie && String(nota.serie).trim() ? String(nota.serie) : '-',
    tipo_nota_label: labelTipoNotaFiscal(nota.tipo_nota),
    data_emissao_fmt: fmtDate(nota.data_emissao),
    data_vencimento_fmt: fmtDate(nota.data_vencimento),
    valor_liquido_fmt: valorLiquidoFmt,
    valor_total_fmt: valorTotalFmt,
    boleto_numero: boletoNumero,
    boleto_vencimento_fmt: boletoVenc,
    boleto_valor_fmt: boletoValor,
    tem_boleto: temBoleto ? 'Sim' : 'Não',
    texto_anexos: textoAnexos,
    observacoes_html: observacoesHtml,
    ano: new Date().getFullYear()
  };
}

function getDefaultNotaFiscalEnviadaTemplateHtml() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nota fiscal</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:16px 8px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;border-bottom:2px solid #0d9488;text-align:center;">
              <p style="margin:0;font-size:20px;font-weight:bold;color:#134e4a;">{{empresa}}</p>
              <p style="margin:10px 0 0;font-size:14px;color:#4b5563;">Nota fiscal e cobrança</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:15px;color:#111827;">Olá, <strong>{{cliente_nome}}</strong>,</p>
              <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.5;">{{texto_anexos}}</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                <tr>
                  <td width="50%" style="padding:6px 8px 6px 0;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Número</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:600;">{{numero_nf}}</p>
                  </td>
                  <td width="50%" style="padding:6px 0 6px 8px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Série</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{serie}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 8px 6px 0;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Tipo</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{tipo_nota_label}}</p>
                  </td>
                  <td style="padding:6px 0 6px 8px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Valor líquido</p>
                    <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#0d9488;">R$ {{valor_liquido_fmt}}</p>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:8px 0 0;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Emissão · Vencimento</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{data_emissao_fmt}} · {{data_vencimento_fmt}}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 8px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Boleto vinculado</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:12px;">
                <tr>
                  <td style="padding:4px 0;">
                    <span style="font-size:12px;color:#6b7280;">Referência:</span>
                    <span style="font-size:13px;font-weight:600;margin-left:6px;">{{boleto_numero}}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">
                    <span style="font-size:12px;color:#6b7280;">Vencimento:</span>
                    <span style="font-size:13px;margin-left:6px;">{{boleto_vencimento_fmt}}</span>
                    <span style="font-size:12px;color:#6b7280;margin-left:16px;">Valor:</span>
                    <span style="font-size:13px;font-weight:600;margin-left:6px;">R$ {{boleto_valor_fmt}}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0 0;font-size:12px;color:#6b7280;">Há boleto em anexo: {{tem_boleto}}</td>
                </tr>
              </table>
              {{observacoes_html}}
              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">© {{ano}} {{empresa}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getFakeNotaFiscalPreviewPayload() {
  const agora = new Date().toISOString();
  return {
    nota: {
      numero_nf: 'ND20261466',
      serie: 'NFS-e',
      tipo_nota: 'nf_locacao',
      data_emissao: agora,
      data_vencimento: agora,
      valor_liquido: 115380.9,
      valor_total: 115380.9,
      observacoes: ''
    },
    cliente: { nome: 'Cliente Exemplo LTDA' },
    boleto: {
      numero_boleto: 'Boleto NF-6-ND20261466',
      data_vencimento: agora,
      valor: 115380.9,
      arquivo_boleto: 'https://exemplo.invalido/boleto.pdf'
    },
    empresaNome: 'Sistema de Gerenciamento de Gruas'
  };
}

/**
 * Preview do e-mail de nota fiscal (dados fictícios ou rascunho do editor).
 */
async function previewNotaFiscalEmail({ assunto: assuntoDraft, html_template: htmlDraft } = {}) {
  const { nota, cliente, boleto, empresaNome } = getFakeNotaFiscalPreviewPayload();
  const vars = buildNotaFiscalEmailVars({ nota, cliente, boleto, empresaNome });

  const hasDraft =
    typeof assuntoDraft === 'string' &&
    typeof htmlDraft === 'string' &&
    assuntoDraft.trim() !== '' &&
    htmlDraft.trim() !== '';

  if (hasDraft) {
    return {
      assunto: replaceVariables(assuntoDraft, vars),
      html: replaceVariables(htmlDraft, vars)
    };
  }

  const tpl = await getActiveTemplateRow('nota_fiscal_enviada');
  if (tpl) {
    return {
      assunto: replaceVariables(tpl.assunto, vars),
      html: replaceVariables(tpl.html_template, vars)
    };
  }

  return {
    assunto: `Nota fiscal ${vars.numero_nf} — ${vars.empresa}`,
    html: replaceVariables(getDefaultNotaFiscalEnviadaTemplateHtml(), vars)
  };
}

/**
 * Monta assunto e HTML do e-mail de nota fiscal (template DB ou padrão).
 * @param {Object} params.nota
 * @param {Object} params.cliente
 * @param {Object} [params.boleto] — boleto com arquivo_boleto quando houver
 * @param {string} [params.empresaNome]
 */
async function buildNotaFiscalClienteEmail({ nota, cliente, boleto, empresaNome }) {
  const vars = buildNotaFiscalEmailVars({ nota, cliente, boleto, empresaNome });

  const tpl = await getActiveTemplateRow('nota_fiscal_enviada');
  if (tpl) {
    return {
      assunto: replaceVariables(tpl.assunto, vars),
      html: replaceVariables(tpl.html_template, vars)
    };
  }

  return {
    assunto: `Nota fiscal ${vars.numero_nf} — ${vars.empresa}`,
    html: replaceVariables(getDefaultNotaFiscalEnviadaTemplateHtml(), vars)
  };
}

/**
 * Registra log de email no banco
 * @param {Object} logData - Dados do log
 */
async function logEmail(logData) {
  try {
    await supabaseAdmin
      .from('email_logs')
      .insert({
        tipo: logData.tipo,
        destinatario: logData.destinatario,
        assunto: logData.assunto,
        status: logData.status,
        erro: logData.erro || null,
        tentativas: logData.tentativas || 1,
        enviado_em: logData.status === 'enviado' ? new Date().toISOString() : null
      });
  } catch (error) {
    console.error('Erro ao registrar log de email:', error);
  }
}

/**
 * Envia email genérico
 * @param {Object} options - Opções do email
 * @param {string} options.to - Destinatário
 * @param {string} options.subject - Assunto
 * @param {string} options.html - Conteúdo HTML
 * @param {string} options.tipo - Tipo para log (opcional)
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendEmail(options) {
  try {
    console.log('[sendEmail] Iniciando envio de email para:', options.to);
    const { transporter, config } = await createTransporter();
    
    const mailOptions = {
      from: `"${config.email_from_name}" <${config.email_from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    if (Array.isArray(options.attachments) && options.attachments.length > 0) {
      mailOptions.attachments = options.attachments;
    }
    
    console.log('[sendEmail] Opções do email:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      html_length: mailOptions.html?.length,
      attachments_count: mailOptions.attachments?.length || 0
    });
    
    const info = await transporter.sendMail(mailOptions);
    console.log('[sendEmail] Email enviado com sucesso:', {
      messageId: info.messageId,
      response: info.response
    });
    
    // Registrar log de sucesso
    await logEmail({
      tipo: options.tipo || 'custom',
      destinatario: options.to,
      assunto: options.subject,
      status: 'enviado',
      tentativas: 1
    });
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('[sendEmail] Erro ao enviar email:', error);
    console.error('[sendEmail] Stack trace:', error.stack);
    console.error('[sendEmail] Detalhes do erro:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Registrar log de falha
    try {
      await logEmail({
        tipo: options.tipo || 'custom',
        destinatario: options.to,
        assunto: options.subject,
        status: 'falha',
        erro: error.message,
        tentativas: 1
      });
    } catch (logError) {
      console.error('[sendEmail] Erro ao registrar log de email:', logError);
    }
    
    throw error;
  }
}

/**
 * Envia email de boas-vindas com senha temporária
 * @param {Object} userData - Dados do usuário
 * @param {string} userData.nome - Nome do usuário
 * @param {string} userData.email - Email do usuário
 * @param {string} userData.senha_temporaria - Senha temporária gerada
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendWelcomeEmail(userData) {
  try {
    const template = await getTemplate('welcome');
    
    const data = {
      nome: userData.nome,
      email: userData.email,
      senha_temporaria: userData.senha_temporaria,
      link_login: `${getPublicFrontendUrl()}/login`,
      empresa: 'Sistema de Gerenciamento de Gruas',
      ano: new Date().getFullYear()
    };
    
    const html = replaceVariables(template.html_template, data);
    const assunto = replaceVariables(template.assunto, data);
    
    return await sendEmail({
      to: userData.email,
      subject: assunto,
      html: html,
      tipo: 'welcome'
    });
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    throw error;
  }
}

/**
 * Envia email de reset de senha com nova senha temporária
 * @param {Object} userData - Dados do usuário
 * @param {string} userData.nome - Nome do usuário
 * @param {string} userData.email - Email do usuário
 * @param {string} userData.senha_temporaria - Nova senha temporária gerada
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendPasswordResetEmail(userData) {
  try {
    // Validação de entrada
    if (!userData) {
      throw new Error('Dados do usuário não fornecidos');
    }
    
    if (!userData.email) {
      throw new Error('Email do usuário não fornecido');
    }
    
    if (!userData.senha_temporaria) {
      throw new Error('Senha temporária não fornecida');
    }
    
    const nome = userData.nome || 'Usuário';
    const email = userData.email;
    const senhaTemporaria = userData.senha_temporaria;
    const linkLogin = `${getPublicFrontendUrl()}/login`;
    const ano = new Date().getFullYear();
    
    console.log(`[sendPasswordResetEmail] Preparando envio de email para ${email}`);
    
    // Template HTML específico para reset de senha
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinição de Senha - Sistema de Gerenciamento de Gruas</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 24px;
        }
        .content {
            margin-bottom: 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
        }
        .credentials {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .credentials h2 {
            color: #2c3e50;
            font-size: 16px;
            margin-top: 0;
        }
        .credential-item {
            margin: 10px 0;
        }
        .credential-label {
            font-weight: bold;
            color: #555;
        }
        .password {
            font-family: monospace;
            font-size: 18px;
            color: #e74c3c;
            font-weight: bold;
            background-color: #fff;
            padding: 5px 10px;
            border-radius: 3px;
            display: inline-block;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .button {
            display: inline-block;
            background-color: #3498db;
            color: #ffffff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .button:hover {
            background-color: #2980b9;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #777;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Redefinição de Senha</h1>
        </div>
        <div class="content">
            <div class="greeting">
                Olá, <strong>${nome}</strong>! 👋
            </div>
            <p>Sua senha foi redefinida com sucesso!</p>
            
            <div class="credentials">
                <h2>📧 Suas Credenciais de Acesso</h2>
                <div class="credential-item">
                    <span class="credential-label">Email:</span> ${email}
                </div>
                <div class="credential-item">
                    <span class="credential-label">Nova Senha Temporária:</span>
                    <div class="password">${senhaTemporaria}</div>
                </div>
            </div>
            
            <div class="warning">
                ⚠️ <strong>Importante:</strong> Altere sua senha no próximo acesso ao sistema.
            </div>
            
            <div style="text-align: center;">
                <a href="${linkLogin}" class="button">Acessar o Sistema</a>
            </div>
        </div>
        <div class="footer">
            <p><strong>Redefinição de Senha - Sistema de Gerenciamento de Gruas</strong></p>
            <p>© ${ano} - Todos os direitos reservados</p>
        </div>
    </div>
</body>
</html>`;
    
    const assunto = `🔐 Redefinição de Senha - Sistema de Gerenciamento de Gruas`;
    
    console.log(`[sendPasswordResetEmail] Chamando sendEmail para ${email}`);
    const resultado = await sendEmail({
      to: email,
      subject: assunto,
      html: html,
      tipo: 'reset_password'
    });
    
    console.log(`[sendPasswordResetEmail] Email enviado com sucesso para ${email}`, resultado);
    return resultado;
  } catch (error) {
    console.error('[sendPasswordResetEmail] Erro ao enviar email de reset de senha:', error);
    console.error('[sendPasswordResetEmail] Stack trace:', error.stack);
    console.error('[sendPasswordResetEmail] Dados recebidos:', {
      nome: userData?.nome,
      email: userData?.email,
      tem_senha: !!userData?.senha_temporaria
    });
    throw error;
  }
}

/**
 * Envia email de redefinição de senha com token (para forgot-password)
 * @param {Object} userData - Dados do usuário
 * @param {string} userData.nome - Nome do usuário
 * @param {string} userData.email - Email do usuário
 * @param {string} userData.token - Token de redefinição
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendResetPasswordEmail(userData) {
  try {
    const template = await getTemplate('reset_password');
    
    const data = {
      nome: userData.nome,
      email: userData.email,
      reset_link: `${getPublicFrontendUrl()}/auth/reset-password/${userData.token}`,
      expiry_time: '1 hora',
      empresa: 'Sistema de Gerenciamento de Gruas',
      ano: new Date().getFullYear()
    };
    
    const html = replaceVariables(template.html_template, data);
    const assunto = replaceVariables(template.assunto, data);
    
    return await sendEmail({
      to: userData.email,
      subject: assunto,
      html: html,
      tipo: 'reset_password'
    });
  } catch (error) {
    console.error('Erro ao enviar email de redefinição:', error);
    throw error;
  }
}

/**
 * Envia email de confirmação de alteração de senha
 * @param {Object} userData - Dados do usuário
 * @param {string} userData.nome - Nome do usuário
 * @param {string} userData.email - Email do usuário
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendPasswordChangedEmail(userData) {
  try {
    const template = await getTemplate('password_changed');
    
    const data = {
      nome: userData.nome,
      email: userData.email,
      data_alteracao: new Date().toLocaleString('pt-BR'),
      empresa: 'Sistema de Gerenciamento de Gruas',
      ano: new Date().getFullYear()
    };
    
    const html = replaceVariables(template.html_template, data);
    const assunto = replaceVariables(template.assunto, data);
    
    return await sendEmail({
      to: userData.email,
      subject: assunto,
      html: html,
      tipo: 'password_changed'
    });
  } catch (error) {
    console.error('Erro ao enviar email de confirmação:', error);
    throw error;
  }
}

export {
  encrypt,
  decrypt,
  sendEmail,
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  getEmailConfig,
  getTemplate,
  getActiveTemplateRow,
  replaceVariables,
  logEmail,
  buildMedicaoClienteEmail,
  buildNotaFiscalClienteEmail,
  previewMedicaoEmail,
  previewEmailTemplateByType,
  buildTestEmailContent
};

