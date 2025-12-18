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

    // Atualizar status para atrasado se vencido
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataComStatus = (data || []).map(imposto => {
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
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
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

    // Calcular totais
    const totais = {
      valor_total: 0,
      valor_pago: 0,
      valor_pendente: 0
    };

    data.forEach(imposto => {
      totais.valor_total += parseFloat(imposto.valor || 0);
      if (imposto.status === 'pago') {
        totais.valor_pago += parseFloat(imposto.valor_pago || 0);
      } else {
        totais.valor_pendente += parseFloat(imposto.valor || 0);
      }
    });

    res.json({
      success: true,
      data: {
        competencia: `${mes}/${ano}`,
        impostos: data,
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
router.get('/:id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { id } = req.params;

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
    const { id } = req.params;
    const { error: validationError, value } = impostoUpdateSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
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
    const { id } = req.params;

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

