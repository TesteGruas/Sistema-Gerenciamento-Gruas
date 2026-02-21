import express from 'express';
import multer from 'multer';
import Joi from 'joi';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por arquivo
  },
  fileFilter: (req, file, cb) => {
    // Tipos de arquivo permitidos
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Apenas PDF, imagens e planilhas são aceitos.'), false);
    }
  }
});

// Schema de validação
const impostoSchema = Joi.object({
  tipo: Joi.string().min(1).max(100).required(), // Permite qualquer tipo (padrão ou personalizado)
  descricao: Joi.string().min(1).max(500).required(),
  valor: Joi.number().min(0).precision(2).required(),
  valor_base: Joi.number().min(0).precision(2).required(),
  aliquota: Joi.number().min(0).max(100).precision(2).required(),
  competencia: Joi.string().pattern(/^\d{4}-\d{2}$/).required(), // YYYY-MM
  data_vencimento: Joi.date().iso().required(),
  referencia: Joi.string().max(255).allow('').optional(),
  observacoes: Joi.string().max(1000).allow('').optional()
});

const impostoUpdateSchema = impostoSchema.fork(
  ['tipo', 'descricao', 'valor', 'valor_base', 'aliquota', 'competencia', 'data_vencimento'],
  (schema) => schema.optional()
).keys({
  data_pagamento: Joi.date().iso().optional(),
  status: Joi.string().valid('pendente', 'pago', 'atrasado', 'cancelado').optional()
});

const pagamentoSchema = Joi.object({
  valor_pago: Joi.number().min(0).precision(2).required(),
  data_pagamento: Joi.date().iso().required(),
  forma_pagamento: Joi.string().max(100).required(),
  comprovante: Joi.string().max(500).optional(),
  observacoes: Joi.string().max(1000).optional()
});

/**
 * @swagger
 * /api/impostos-financeiros:
 *   get:
 *     summary: Listar impostos
 *     tags: [Impostos]
 */
router.get('/', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { competencia, tipo, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('impostos_financeiros')
      .select('*', { count: 'exact' });

    if (competencia) query = query.eq('competencia', competencia);
    if (tipo) query = query.eq('tipo', tipo);
    if (status) query = query.eq('status', status);

    query = query
      .range(offset, offset + limit - 1)
      .order('data_vencimento', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    // Agregar impostos das notas fiscais (que não existem em impostos_financeiros)
    let impostosNF = [];
    try {
      const { data: notasComItens, error: nfError } = await supabaseAdmin
        .from('notas_fiscais')
        .select(`
          id, numero_nf, serie, tipo, data_emissao, data_vencimento, status,
          notas_fiscais_itens (
            id, valor_icms, percentual_icms, base_calculo_icms,
            valor_issqn, aliquota_issqn, base_calculo_issqn,
            valor_ipi, percentual_ipi,
            valor_inss, valor_cbs, preco_total
          )
        `)
        .neq('status', 'cancelada');

      if (!nfError && notasComItens) {
        const idsJaCadastrados = new Set((data || []).map(i => i.referencia).filter(Boolean));

        for (const nf of notasComItens) {
          if (!nf.notas_fiscais_itens || nf.notas_fiscais_itens.length === 0) continue;
          const refNF = nf.numero_nf;
          const comp = nf.data_emissao ? nf.data_emissao.substring(0, 7) : null;
          if (competencia && comp !== competencia) continue;

          let totalICMS = 0, totalISSQN = 0, totalIPI = 0, totalINSS = 0, totalCBS = 0;
          let baseICMS = 0, baseISSQN = 0, aliqICMS = 0, aliqISSQN = 0;

          for (const item of nf.notas_fiscais_itens) {
            totalICMS += parseFloat(item.valor_icms || 0);
            totalISSQN += parseFloat(item.valor_issqn || 0);
            totalIPI += parseFloat(item.valor_ipi || 0);
            totalINSS += parseFloat(item.valor_inss || 0);
            totalCBS += parseFloat(item.valor_cbs || 0);
            baseICMS += parseFloat(item.base_calculo_icms || item.preco_total || 0);
            baseISSQN += parseFloat(item.base_calculo_issqn || item.preco_total || 0);
            if (item.percentual_icms) aliqICMS = parseFloat(item.percentual_icms);
            if (item.aliquota_issqn) aliqISSQN = parseFloat(item.aliquota_issqn);
          }

          const tipoNF = nf.tipo === 'saida' ? 'Saída' : 'Entrada';
          const statusNF = nf.status === 'paga' ? 'pago' : 'pendente';

          if (totalICMS > 0 && !idsJaCadastrados.has(`ICMS-${refNF}`)) {
            if (!tipo || tipo === 'ICMS') {
              if (!status || status === statusNF) {
                impostosNF.push({
                  id: `nf-icms-${nf.id}`,
                  tipo: 'ICMS',
                  descricao: `ICMS - NF ${refNF} (${tipoNF})`,
                  valor: totalICMS,
                  valor_base: baseICMS,
                  aliquota: aliqICMS,
                  competencia: comp,
                  data_vencimento: nf.data_vencimento || nf.data_emissao,
                  status: statusNF,
                  referencia: `ICMS-${refNF}`,
                  nota_fiscal_id: nf.id,
                  origem: 'nota_fiscal'
                });
              }
            }
          }

          if (totalISSQN > 0 && !idsJaCadastrados.has(`ISSQN-${refNF}`)) {
            if (!tipo || tipo === 'ISSQN' || tipo === 'ISS') {
              if (!status || status === statusNF) {
                impostosNF.push({
                  id: `nf-issqn-${nf.id}`,
                  tipo: 'ISSQN',
                  descricao: `ISSQN - NF ${refNF} (${tipoNF})`,
                  valor: totalISSQN,
                  valor_base: baseISSQN,
                  aliquota: aliqISSQN,
                  competencia: comp,
                  data_vencimento: nf.data_vencimento || nf.data_emissao,
                  status: statusNF,
                  referencia: `ISSQN-${refNF}`,
                  nota_fiscal_id: nf.id,
                  origem: 'nota_fiscal'
                });
              }
            }
          }

          if (totalIPI > 0 && !idsJaCadastrados.has(`IPI-${refNF}`)) {
            if (!tipo || tipo === 'IPI') {
              if (!status || status === statusNF) {
                impostosNF.push({
                  id: `nf-ipi-${nf.id}`,
                  tipo: 'IPI',
                  descricao: `IPI - NF ${refNF} (${tipoNF})`,
                  valor: totalIPI,
                  valor_base: baseICMS,
                  aliquota: 0,
                  competencia: comp,
                  data_vencimento: nf.data_vencimento || nf.data_emissao,
                  status: statusNF,
                  referencia: `IPI-${refNF}`,
                  nota_fiscal_id: nf.id,
                  origem: 'nota_fiscal'
                });
              }
            }
          }
        }
      }
    } catch (nfAggError) {
      console.error('Aviso: erro ao agregar impostos de NFs:', nfAggError.message);
    }

    const todosImpostos = [...(data || []), ...impostosNF];

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataComStatus = todosImpostos.map(imposto => {
      const vencimento = new Date(imposto.data_vencimento);
      vencimento.setHours(0, 0, 0, 0);
      
      if (imposto.status === 'pendente' && vencimento < hoje) {
        return { ...imposto, status: 'atrasado' };
      }
      return imposto;
    });

    res.json({
      success: true,
      data: dataComStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: (count || 0) + impostosNF.length,
        pages: Math.ceil(((count || 0) + impostosNF.length) / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar impostos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/impostos-financeiros/calcular:
 *   post:
 *     summary: Calcular valor de imposto
 *     tags: [Impostos]
 */
router.post('/calcular', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { receita_bruta, tipo_imposto, competencia } = req.body;

    if (!receita_bruta || !tipo_imposto) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: receita_bruta e tipo_imposto'
      });
    }

    // Tabela de alíquotas (simplificada)
    const aliquotas = {
      ISS: 5.0,
      ICMS: 18.0,
      PIS: 0.65,
      COFINS: 3.0,
      IRPJ: 15.0,
      CSLL: 9.0,
      INSS: 11.0
    };

    const aliquota = aliquotas[tipo_imposto] || 0;
    const valor_calculado = receita_bruta * (aliquota / 100);

    res.json({
      success: true,
      data: {
        tipo: tipo_imposto,
        valor_base: receita_bruta,
        aliquota,
        valor_calculado
      }
    });
  } catch (error) {
    console.error('Erro ao calcular imposto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/impostos-financeiros/calcular-mes:
 *   post:
 *     summary: Calcular impostos automaticamente baseado nas receitas do mês
 *     tags: [Impostos]
 */
router.post('/calcular-mes', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { mes, ano } = req.body;

    if (!mes || !ano) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: mes e ano'
      });
    }

    const competencia = `${ano}-${String(mes).padStart(2, '0')}`;

    // Buscar receitas do mês
    const { data: receitas, error: receitasError } = await supabaseAdmin
      .from('receitas')
      .select('valor')
      .eq('status', 'confirmada')
      .ilike('data_receita', `${competencia}%`);

    if (receitasError) {
      console.error('Erro ao buscar receitas:', receitasError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar receitas'
      });
    }

    const totalReceitas = receitas?.reduce((sum, r) => sum + parseFloat(r.valor || 0), 0) || 0;

    // Tabela de alíquotas baseada no regime tributário
    const aliquotasSimples = {
      icms: 0.18,      // 18% ICMS
      iss: 0.05,       // 5% ISS (serviços)
      pis: 0.0165,     // 1.65% PIS
      cofins: 0.076,   // 7.6% COFINS
      irpj: 0.15,      // 15% IRPJ
      csll: 0.09,      // 9% CSLL
      inss: 0.11       // 11% INSS
    };

    // Calcular impostos
    const impostos = {
      icms: totalReceitas * aliquotasSimples.icms,
      iss: totalReceitas * aliquotasSimples.iss,
      pis: totalReceitas * aliquotasSimples.pis,
      cofins: totalReceitas * aliquotasSimples.cofins,
      irpj: totalReceitas * aliquotasSimples.irpj,
      csll: totalReceitas * aliquotasSimples.csll,
      inss: totalReceitas * aliquotasSimples.inss
    };

    const totalImpostos = Object.values(impostos).reduce((sum, i) => sum + i, 0);
    const receitaLiquida = totalReceitas - totalImpostos;
    const cargaTributaria = totalReceitas > 0 ? (totalImpostos / totalReceitas) * 100 : 0;

    res.json({
      success: true,
      data: {
        competencia: `${mes}/${ano}`,
        periodo: competencia,
        receita_bruta: totalReceitas.toFixed(2),
        impostos: {
          icms: impostos.icms.toFixed(2),
          iss: impostos.iss.toFixed(2),
          pis: impostos.pis.toFixed(2),
          cofins: impostos.cofins.toFixed(2),
          irpj: impostos.irpj.toFixed(2),
          csll: impostos.csll.toFixed(2),
          inss: impostos.inss.toFixed(2)
        },
        total_impostos: totalImpostos.toFixed(2),
        receita_liquida: receitaLiquida.toFixed(2),
        carga_tributaria: cargaTributaria.toFixed(2) + '%',
        aliquotas: aliquotasSimples
      }
    });

  } catch (error) {
    console.error('Erro ao calcular impostos do mês:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/impostos-financeiros/relatorio:
 *   get:
 *     summary: Relatório de impostos por período
 *     tags: [Impostos]
 */
router.get('/relatorio', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { mes, ano } = req.query;

    if (!mes || !ano) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: mes e ano'
      });
    }

    const competencia = `${ano}-${String(mes).padStart(2, '0')}`;

    const { data, error } = await supabaseAdmin
      .from('impostos_financeiros')
      .select('*')
      .eq('competencia', competencia)
      .order('tipo');

    if (error) throw error;

    // Agregar impostos de NFs para o período
    let impostosNF = [];
    try {
      const { data: notasComItens, error: nfError } = await supabaseAdmin
        .from('notas_fiscais')
        .select(`
          id, numero_nf, tipo, data_emissao, data_vencimento, status,
          notas_fiscais_itens (
            valor_icms, percentual_icms, base_calculo_icms,
            valor_issqn, aliquota_issqn, base_calculo_issqn,
            valor_ipi, preco_total
          )
        `)
        .neq('status', 'cancelada');

      if (!nfError && notasComItens) {
        const idsJaCadastrados = new Set((data || []).map(i => i.referencia).filter(Boolean));

        for (const nf of notasComItens) {
          if (!nf.notas_fiscais_itens || nf.notas_fiscais_itens.length === 0) continue;
          const comp = nf.data_emissao ? nf.data_emissao.substring(0, 7) : null;
          if (comp !== competencia) continue;

          let totalICMS = 0, totalISSQN = 0, totalIPI = 0;
          let baseICMS = 0, baseISSQN = 0, aliqICMS = 0, aliqISSQN = 0;

          for (const item of nf.notas_fiscais_itens) {
            totalICMS += parseFloat(item.valor_icms || 0);
            totalISSQN += parseFloat(item.valor_issqn || 0);
            totalIPI += parseFloat(item.valor_ipi || 0);
            baseICMS += parseFloat(item.base_calculo_icms || item.preco_total || 0);
            baseISSQN += parseFloat(item.base_calculo_issqn || item.preco_total || 0);
            if (item.percentual_icms) aliqICMS = parseFloat(item.percentual_icms);
            if (item.aliquota_issqn) aliqISSQN = parseFloat(item.aliquota_issqn);
          }

          const tipoNF = nf.tipo === 'saida' ? 'Saída' : 'Entrada';
          const statusNF = nf.status === 'paga' ? 'pago' : 'pendente';

          if (totalICMS > 0 && !idsJaCadastrados.has(`ICMS-${nf.numero_nf}`)) {
            impostosNF.push({
              id: `nf-icms-${nf.id}`, tipo: 'ICMS',
              descricao: `ICMS - NF ${nf.numero_nf} (${tipoNF})`,
              valor: totalICMS, valor_base: baseICMS, aliquota: aliqICMS,
              competencia: comp, data_vencimento: nf.data_vencimento || nf.data_emissao,
              status: statusNF, referencia: `ICMS-${nf.numero_nf}`, origem: 'nota_fiscal'
            });
          }
          if (totalISSQN > 0 && !idsJaCadastrados.has(`ISSQN-${nf.numero_nf}`)) {
            impostosNF.push({
              id: `nf-issqn-${nf.id}`, tipo: 'ISSQN',
              descricao: `ISSQN - NF ${nf.numero_nf} (${tipoNF})`,
              valor: totalISSQN, valor_base: baseISSQN, aliquota: aliqISSQN,
              competencia: comp, data_vencimento: nf.data_vencimento || nf.data_emissao,
              status: statusNF, referencia: `ISSQN-${nf.numero_nf}`, origem: 'nota_fiscal'
            });
          }
          if (totalIPI > 0 && !idsJaCadastrados.has(`IPI-${nf.numero_nf}`)) {
            impostosNF.push({
              id: `nf-ipi-${nf.id}`, tipo: 'IPI',
              descricao: `IPI - NF ${nf.numero_nf} (${tipoNF})`,
              valor: totalIPI, valor_base: baseICMS, aliquota: 0,
              competencia: comp, data_vencimento: nf.data_vencimento || nf.data_emissao,
              status: statusNF, referencia: `IPI-${nf.numero_nf}`, origem: 'nota_fiscal'
            });
          }
        }
      }
    } catch (nfAggError) {
      console.error('Aviso: erro ao agregar impostos de NFs no relatório:', nfAggError.message);
    }

    const todosImpostos = [...(data || []), ...impostosNF];

    const totais = {
      valor_total: 0,
      valor_pago: 0,
      valor_pendente: 0
    };

    todosImpostos.forEach(imposto => {
      totais.valor_total += parseFloat(imposto.valor || 0);
      if (imposto.status === 'pago') {
        totais.valor_pago += parseFloat(imposto.valor || 0);
      } else {
        totais.valor_pendente += parseFloat(imposto.valor || 0);
      }
    });

    res.json({
      success: true,
      data: {
        competencia: `${mes}/${ano}`,
        impostos: todosImpostos,
        totais
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/impostos-financeiros/{id}:
 *   get:
 *     summary: Buscar imposto por ID
 *     tags: [Impostos]
 */
// Helper: resolver imposto virtual de NF para dados reais
async function resolverImpostoNF(virtualId) {
  const match = virtualId.match(/^nf-(icms|issqn|ipi)-(\d+)$/);
  if (!match) return null;

  const tipoImposto = match[1].toUpperCase();
  const nfId = parseInt(match[2]);

  const { data: nf, error } = await supabaseAdmin
    .from('notas_fiscais')
    .select(`
      id, numero_nf, tipo, data_emissao, data_vencimento, status,
      notas_fiscais_itens (
        valor_icms, percentual_icms, base_calculo_icms,
        valor_issqn, aliquota_issqn, base_calculo_issqn,
        valor_ipi, percentual_ipi, preco_total
      )
    `)
    .eq('id', nfId)
    .single();

  if (error || !nf || !nf.notas_fiscais_itens) return null;

  let valor = 0, valorBase = 0, aliquota = 0;
  for (const item of nf.notas_fiscais_itens) {
    if (tipoImposto === 'ICMS') {
      valor += parseFloat(item.valor_icms || 0);
      valorBase += parseFloat(item.base_calculo_icms || item.preco_total || 0);
      if (item.percentual_icms) aliquota = parseFloat(item.percentual_icms);
    } else if (tipoImposto === 'ISSQN') {
      valor += parseFloat(item.valor_issqn || 0);
      valorBase += parseFloat(item.base_calculo_issqn || item.preco_total || 0);
      if (item.aliquota_issqn) aliquota = parseFloat(item.aliquota_issqn);
    } else if (tipoImposto === 'IPI') {
      valor += parseFloat(item.valor_ipi || 0);
      valorBase += parseFloat(item.preco_total || 0);
    }
  }

  const tipoNF = nf.tipo === 'saida' ? 'Saída' : 'Entrada';
  const comp = nf.data_emissao ? nf.data_emissao.substring(0, 7) : null;

  return {
    tipo: tipoImposto,
    descricao: `${tipoImposto} - NF ${nf.numero_nf} (${tipoNF})`,
    valor,
    valor_base: valorBase,
    aliquota,
    competencia: comp,
    data_vencimento: nf.data_vencimento || nf.data_emissao,
    referencia: `${tipoImposto}-${nf.numero_nf}`,
    nota_fiscal_id: nf.id,
    status: nf.status === 'paga' ? 'pago' : 'pendente'
  };
}

// Helper: materializar imposto virtual (criar registro real em impostos_financeiros)
async function materializarImpostoNF(virtualId) {
  const dados = await resolverImpostoNF(virtualId);
  if (!dados) return null;

  const { referencia } = dados;
  const { data: existente } = await supabaseAdmin
    .from('impostos_financeiros')
    .select('id')
    .eq('referencia', referencia)
    .maybeSingle();

  if (existente) return existente.id;

  const { data: novo, error } = await supabaseAdmin
    .from('impostos_financeiros')
    .insert({
      tipo: dados.tipo,
      descricao: dados.descricao,
      valor: dados.valor,
      valor_base: dados.valor_base,
      aliquota: dados.aliquota,
      competencia: dados.competencia,
      data_vencimento: dados.data_vencimento,
      referencia: dados.referencia,
      status: dados.status,
      observacoes: `Gerado automaticamente a partir da NF (nota_fiscal_id: ${dados.nota_fiscal_id})`
    })
    .select('id')
    .single();

  if (error) throw error;
  return novo.id;
}

router.get('/:id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { id } = req.params;

    // Imposto virtual derivado de NF
    if (id.startsWith('nf-')) {
      const dados = await resolverImpostoNF(id);
      if (!dados) {
        return res.status(404).json({ error: 'Imposto não encontrado' });
      }
      return res.json({
        success: true,
        data: { id, ...dados, origem: 'nota_fiscal' }
      });
    }

    const { data, error } = await supabaseAdmin
      .from('impostos_financeiros')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Imposto não encontrado'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao buscar imposto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/impostos-financeiros:
 *   post:
 *     summary: Criar imposto
 *     tags: [Impostos]
 */
router.post('/', authenticateToken, requirePermission('obras:criar'), async (req, res) => {
  try {
    const { error: validationError, value } = impostoSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('impostos_financeiros')
      .insert({
        ...value,
        status: 'pendente'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      success: true,
      data,
      message: 'Imposto criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar imposto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/impostos-financeiros/{id}:
 *   put:
 *     summary: Atualizar imposto
 *     tags: [Impostos]
 */
router.put('/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    let { id } = req.params;
    const { error: validationError, value } = impostoUpdateSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    // Imposto virtual derivado de NF: materializar antes de atualizar
    if (id.startsWith('nf-')) {
      const realId = await materializarImpostoNF(id);
      if (!realId) {
        return res.status(404).json({ error: 'Imposto de NF não encontrado' });
      }
      id = realId;
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('impostos_financeiros')
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
          error: 'Imposto não encontrado'
        });
      }
      throw updateError;
    }

    res.json({
      success: true,
      data,
      message: 'Imposto atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar imposto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/impostos-financeiros/{id}:
 *   delete:
 *     summary: Excluir imposto
 *     tags: [Impostos]
 */
router.delete('/:id', authenticateToken, requirePermission('obras:excluir'), async (req, res) => {
  try {
    let { id } = req.params;

    // Imposto virtual de NF não pode ser excluído diretamente
    if (id.startsWith('nf-')) {
      return res.status(400).json({
        error: 'Impostos derivados de notas fiscais não podem ser excluídos diretamente. Exclua ou altere a nota fiscal correspondente.'
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('impostos_financeiros')
      .delete()
      .eq('id', id);

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Imposto não encontrado'
        });
      }
      throw deleteError;
    }

    res.json({
      success: true,
      message: 'Imposto excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir imposto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/impostos-financeiros/{id}/pagamento:
 *   post:
 *     summary: Registrar pagamento de imposto
 *     tags: [Impostos]
 */
router.post('/:id/pagamento', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = pagamentoSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    // Verificar se o imposto existe
    const { data: imposto, error: impostoError } = await supabaseAdmin
      .from('impostos_financeiros')
      .select('id, valor')
      .eq('id', id)
      .single();

    if (impostoError || !imposto) {
      return res.status(404).json({
        error: 'Imposto não encontrado'
      });
    }

    // Criar registro de pagamento
    const { data: pagamento, error: pagamentoError } = await supabaseAdmin
      .from('impostos_pagamentos')
      .insert({
        imposto_id: id,
        ...value
      })
      .select()
      .single();

    if (pagamentoError) throw pagamentoError;

    // Atualizar status do imposto para pago
    const { error: updateError } = await supabaseAdmin
      .from('impostos_financeiros')
      .update({
        status: 'pago',
        data_pagamento: value.data_pagamento,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    res.status(201).json({
      success: true,
      data: pagamento,
      message: 'Pagamento registrado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/impostos-financeiros/vencendo:
 *   get:
 *     summary: Impostos vencendo em X dias
 *     tags: [Impostos]
 */
router.get('/vencendo', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { dias = 7 } = req.query;
    
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + parseInt(dias));

    const { data, error } = await supabaseAdmin
      .from('impostos_financeiros')
      .select('*')
      .eq('status', 'pendente')
      .lte('data_vencimento', dataLimite.toISOString().split('T')[0])
      .gte('data_vencimento', new Date().toISOString().split('T')[0])
      .order('data_vencimento', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao buscar impostos vencendo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/impostos-financeiros/atrasados:
 *   get:
 *     summary: Impostos atrasados
 *     tags: [Impostos]
 */
router.get('/atrasados', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('impostos_financeiros')
      .select('*')
      .eq('status', 'pendente')
      .lt('data_vencimento', hoje)
      .order('data_vencimento', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao buscar impostos atrasados:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/impostos-financeiros/{id}/arquivo:
 *   post:
 *     summary: Upload de arquivo para um imposto financeiro
 *     tags: [Impostos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do imposto (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - arquivo
 *             properties:
 *               arquivo:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo a ser enviado (PDF, imagem, etc.)
 *     responses:
 *       200:
 *         description: Arquivo enviado com sucesso
 *       400:
 *         description: Nenhum arquivo enviado ou ID inválido
 *       404:
 *         description: Imposto não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/arquivo', authenticateToken, requirePermission('obras:editar'), upload.single('arquivo'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }

    // Validar se o ID é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de imposto inválido. Deve ser um UUID.'
      });
    }

    // Verificar se o imposto existe
    const { data: imposto, error: impostoError } = await supabaseAdmin
      .from('impostos_financeiros')
      .select('id')
      .eq('id', id)
      .single();

    if (impostoError || !imposto) {
      return res.status(404).json({
        success: false,
        message: 'Imposto não encontrado'
      });
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.originalname.split('.').pop();
    const fileName = `imposto_${id}_${timestamp}_${randomString}.${extension}`;
    const filePath = `impostos/${id}/${fileName}`;

    // Upload para o Supabase Storage (usar o bucket 'arquivos-obras' que é o principal)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('arquivos-obras')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao fazer upload do arquivo',
        error: uploadError.message
      });
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabaseAdmin.storage
      .from('arquivos-obras')
      .getPublicUrl(filePath);

    let arquivoUrl = urlData?.publicUrl;
    if (!arquivoUrl && process.env.SUPABASE_URL) {
      arquivoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/arquivos-obras/${filePath}`;
    }

    // Atualizar imposto com o caminho do arquivo
    const updateData = {
      arquivo_anexo: arquivoUrl,
      nome_arquivo: file.originalname,
      updated_at: new Date().toISOString()
    };

    const { data: updatedImposto, error: updateError } = await supabaseAdmin
      .from('impostos_financeiros')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Arquivo enviado e associado ao imposto com sucesso',
      data: updatedImposto
    });

  } catch (error) {
    console.error('Erro ao fazer upload de arquivo para imposto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;

