import express from 'express';
import multer from 'multer';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import Joi from 'joi';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por arquivo
  },
  fileFilter: (req, file, cb) => {
    // Tipos de arquivo permitidos para boletos
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use PDF ou imagem.'), false);
    }
  }
});

// Schema de validação para boleto
const boletoSchema = Joi.object({
  numero_boleto: Joi.string().min(1).max(100).required(),
  cliente_id: Joi.number().integer().positive().optional(),
  obra_id: Joi.number().integer().positive().optional(),
  medicao_id: Joi.number().integer().positive().optional(),
  nota_fiscal_id: Joi.number().integer().positive().optional(),
  descricao: Joi.string().min(1).max(255).required(),
  valor: Joi.number().min(0).required(),
  data_emissao: Joi.date().required(),
  data_vencimento: Joi.date().required(),
  forma_pagamento: Joi.string().max(50).optional(),
  codigo_barras: Joi.string().max(200).optional(),
  linha_digitavel: Joi.string().max(200).optional(),
  nosso_numero: Joi.string().max(100).optional(),
  banco: Joi.string().max(100).optional(),
  agencia: Joi.string().max(20).optional(),
  conta: Joi.string().max(20).optional(),
  tipo: Joi.string().valid('receber', 'pagar').default('receber'),
  banco_origem_id: Joi.number().integer().positive().optional(),
  observacoes: Joi.string().optional()
});

/**
 * GET /api/boletos
 * Lista todos os boletos
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { cliente_id, obra_id, medicao_id, nota_fiscal_id, status, tipo, search, page = 1, limit = 20, include_medicoes } = req.query;

    let query = supabase
      .from('boletos')
      .select(`
        *,
        clientes(id, nome, cnpj),
        obras(id, nome),
        notas_fiscais(id, numero_nf, serie, tipo),
        contas_bancarias!boletos_banco_origem_id_fkey(id, banco, agencia, conta, tipo_conta)
      `)
      .order('data_vencimento', { ascending: false });

    // Filtros
    if (cliente_id) query = query.eq('cliente_id', cliente_id);
    if (obra_id) query = query.eq('obra_id', obra_id);
    if (medicao_id) query = query.eq('medicao_id', medicao_id);
    if (nota_fiscal_id) query = query.eq('nota_fiscal_id', nota_fiscal_id);
    if (status) query = query.eq('status', status);
    if (tipo) query = query.eq('tipo', tipo);
    // Nota: filtro de tipo será aplicado após combinar com boletos de medições
    if (search) {
      query = query.or(`numero_boleto.ilike.%${search}%,descricao.ilike.%${search}%`);
    }

    // Paginação
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // Se incluir boletos de medições, buscar também da tabela medicao_documentos
    let boletosMedicoes = [];
    if (include_medicoes === 'true') {
      const { data: documentos, error: docError } = await supabase
        .from('medicao_documentos')
        .select(`
          id,
          medicao_id,
          numero_documento,
          valor,
          data_emissao,
          data_vencimento,
          status,
          caminho_arquivo,
          observacoes,
          created_at,
          updated_at,
          medicoes_mensais!medicao_documentos_medicao_id_fkey(
            id,
            numero,
            periodo,
            obra_id,
            obras:obra_id(
              id,
              nome,
              cliente_id,
              clientes:cliente_id(id, nome, cnpj)
            )
          )
        `)
        .eq('tipo_documento', 'boleto');

      if (docError) {
        console.error('Erro ao buscar boletos de medições:', docError);
      }

      if (!docError && documentos) {
        console.log(`Encontrados ${documentos.length} boletos de medições`);
        boletosMedicoes = documentos.map(doc => {
          const medicao = doc.medicoes_mensais;
          // A obra pode vir como objeto ou array dependendo da query do Supabase
          const obra = medicao?.obras ? (Array.isArray(medicao.obras) ? medicao.obras[0] : medicao.obras) : null;
          const cliente = obra?.clientes ? (Array.isArray(obra.clientes) ? obra.clientes[0] : obra.clientes) : null;
          
          return {
            id: `medicao_${doc.id}`,
            numero_boleto: doc.numero_documento || `MED-${doc.medicao_id}-${doc.id}`,
            medicao_id: doc.medicao_id,
            descricao: `Boleto - Medição ${medicao?.numero || doc.medicao_id}`,
            valor: doc.valor || 0,
            data_emissao: doc.data_emissao || doc.created_at,
            data_vencimento: doc.data_vencimento || doc.created_at,
            data_pagamento: doc.status === 'pago' ? doc.updated_at : null,
            status: doc.status === 'pago' ? 'pago' : doc.status === 'cancelado' ? 'cancelado' : 'pendente',
            tipo: 'receber', // Boletos de medições são sempre "a receber"
            arquivo_boleto: doc.caminho_arquivo,
            observacoes: doc.observacoes,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            origem: 'medicao',
            medicoes: medicao ? {
              id: medicao.id,
              numero: medicao.numero,
              periodo: medicao.periodo
            } : null,
            clientes: cliente,
            obras: obra ? {
              id: obra.id,
              nome: obra.nome
            } : null
          };
        });
      } else if (!documentos || documentos.length === 0) {
        console.log('Nenhum boleto de medição encontrado');
      }
    }

    // Combinar boletos da tabela boletos com boletos de medições
    let allBoletos = [...(data || []), ...boletosMedicoes];
    
    console.log(`Total de boletos combinados: ${allBoletos.length} (${data?.length || 0} da tabela boletos + ${boletosMedicoes.length} de medições)`);
    
    // Aplicar filtro de tipo após combinar (para incluir boletos de medições)
    if (req.query.tipo) {
      const antesFiltro = allBoletos.length;
      allBoletos = allBoletos.filter(b => {
        // Boletos de medições são sempre 'receber', então incluir se o filtro for 'receber'
        if (b.origem === 'medicao') {
          return req.query.tipo === 'receber';
        }
        
        // Se o boleto tem nota fiscal vinculada, usar o tipo da nota fiscal
        if (b.notas_fiscais) {
          // Nota fiscal de entrada = boleto a pagar
          // Nota fiscal de saída = boleto a receber
          const tipoEsperado = b.notas_fiscais.tipo === 'entrada' ? 'pagar' : 'receber';
          return tipoEsperado === req.query.tipo;
        }
        
        // Caso contrário, usar o tipo do boleto
        return b.tipo === req.query.tipo;
      });
      console.log(`Após filtro de tipo '${req.query.tipo}': ${allBoletos.length} boletos (era ${antesFiltro})`);
    }

    // Aplicar paginação após todos os filtros
    const totalBoletos = allBoletos.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const boletosPaginados = allBoletos.slice(startIndex, endIndex);

    console.log(`Retornando ${boletosPaginados.length} boletos (página ${page}, total: ${totalBoletos})`);

    res.json({
      success: true,
      data: boletosPaginados,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalBoletos,
        pages: Math.ceil(totalBoletos / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao listar boletos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * GET /api/boletos/:id
 * Busca um boleto por ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Se for boleto de medição (formato: medicao_123)
    if (id.startsWith('medicao_')) {
      const docId = parseInt(id.replace('medicao_', ''));
      const { data, error } = await supabase
        .from('medicao_documentos')
        .select(`
          *,
          medicoes_mensais!medicao_documentos_medicao_id_fkey(
            id,
            numero,
            periodo,
            obras(id, nome, cliente_id),
            clientes:obras!medicoes_mensais_obra_id_fkey(id, nome, cnpj)
          )
        `)
        .eq('id', docId)
        .eq('tipo_documento', 'boleto')
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Boleto não encontrado'
        });
      }

      const boleto = {
        id: `medicao_${data.id}`,
        numero_boleto: data.numero_documento || `MED-${data.medicao_id}-${data.id}`,
        medicao_id: data.medicao_id,
        descricao: `Boleto - Medição ${data.medicoes_mensais?.numero || data.medicao_id}`,
        valor: data.valor || 0,
        data_emissao: data.data_emissao || data.created_at,
        data_vencimento: data.data_vencimento || data.created_at,
        data_pagamento: data.status === 'pago' ? data.updated_at : null,
        status: data.status === 'pago' ? 'pago' : data.status === 'cancelado' ? 'cancelado' : 'pendente',
        tipo: 'receber', // Boletos de medições são sempre "a receber"
        arquivo_boleto: data.caminho_arquivo,
        observacoes: data.observacoes,
        created_at: data.created_at,
        updated_at: data.updated_at,
        origem: 'medicao',
        medicoes: data.medicoes_mensais,
        clientes: data.medicoes_mensais?.obras?.[0]?.clientes,
        obras: data.medicoes_mensais?.obras?.[0]
      };

      return res.json({
        success: true,
        data: boleto
      });
    }

    // Boleto normal
    const { data, error } = await supabase
      .from('boletos')
      .select(`
        *,
        clientes(id, nome, cnpj),
        obras(id, nome),
        medicoes_mensais(id, numero, periodo),
        contas_bancarias!boletos_banco_origem_id_fkey(id, banco, agencia, conta, tipo_conta)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Boleto não encontrado'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao obter boleto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * POST /api/boletos
 * Cria um novo boleto
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error: validationError, value } = boletoSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    // Boletos podem ser criados sem cliente ou obra (opcional)
    // Não precisa de validação obrigatória

    const { data, error } = await supabase
      .from('boletos')
      .insert([value])
      .select(`
        *,
        clientes(id, nome, cnpj),
        obras(id, nome),
        medicoes_mensais(id, numero, periodo),
        contas_bancarias!boletos_banco_origem_id_fkey(id, banco, agencia, conta, tipo_conta)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Boleto criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar boleto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * PUT /api/boletos/:id
 * Atualiza um boleto
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = boletoSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('boletos')
      .update(value)
      .eq('id', id)
      .select(`
        *,
        clientes(id, nome, cnpj),
        obras(id, nome),
        medicoes_mensais(id, numero, periodo),
        contas_bancarias!boletos_banco_origem_id_fkey(id, banco, agencia, conta, tipo_conta)
      `)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Boleto não encontrado'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Boleto atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar boleto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * DELETE /api/boletos/:id
 * Deleta um boleto
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Não permitir deletar boletos de medições
    if (id.startsWith('medicao_')) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir boletos vinculados a medições'
      });
    }

    const { error } = await supabase
      .from('boletos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Boleto excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir boleto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * POST /api/boletos/:id/pagar
 * Marca um boleto como pago
 */
router.post('/:id/pagar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data_pagamento = new Date().toISOString().split('T')[0] } = req.body;

    // Se for boleto de medição
    if (id.startsWith('medicao_')) {
      const docId = parseInt(id.replace('medicao_', ''));
      const { data, error } = await supabase
        .from('medicao_documentos')
        .update({
          status: 'pago',
          updated_at: new Date().toISOString()
        })
        .eq('id', docId)
        .eq('tipo_documento', 'boleto')
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        data,
        message: 'Boleto marcado como pago com sucesso'
      });
    }

    // Boleto normal
    const { data, error } = await supabase
      .from('boletos')
      .update({
        status: 'pago',
        data_pagamento,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        clientes(id, nome, cnpj),
        obras(id, nome),
        medicoes_mensais(id, numero, periodo),
        contas_bancarias!boletos_banco_origem_id_fkey(id, banco, agencia, conta, tipo_conta)
      `)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Boleto não encontrado'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Boleto marcado como pago com sucesso'
    });
  } catch (error) {
    console.error('Erro ao marcar boleto como pago:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * POST /api/boletos/:id/upload
 * Faz upload de arquivo do boleto
 */
router.post('/:id/upload', authenticateToken, upload.single('arquivo'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }

    // Verificar se o boleto existe
    const { data: boleto, error: boletoError } = await supabase
      .from('boletos')
      .select('id')
      .eq('id', id)
      .single();

    if (boletoError || !boleto) {
      return res.status(404).json({
        success: false,
        message: 'Boleto não encontrado'
      });
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.originalname.split('.').pop();
    const fileName = `boleto_${id}_${timestamp}_${randomString}.${extension}`;
    const filePath = `boletos/${id}/${fileName}`;

    // Upload para o Supabase Storage
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

    const arquivoUrl = urlData?.publicUrl || `${process.env.SUPABASE_URL}/storage/v1/object/public/arquivos-obras/${filePath}`;

    // Atualizar boleto com informações do arquivo
    const { data: updatedBoleto, error: updateError } = await supabase
      .from('boletos')
      .update({
        arquivo_boleto: arquivoUrl
      })
      .eq('id', id)
      .select(`
        *,
        clientes(id, nome, cnpj),
        obras(id, nome),
        medicoes_mensais(id, numero, periodo),
        contas_bancarias!boletos_banco_origem_id_fkey(id, banco, agencia, conta, tipo_conta)
      `)
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      data: updatedBoleto,
      message: 'Arquivo enviado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;

