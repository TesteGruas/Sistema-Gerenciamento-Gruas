import express from 'express';
import multer from 'multer';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import Joi from 'joi';
import { XMLParser } from 'fast-xml-parser';

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por arquivo
  },
  fileFilter: (req, file, cb) => {
    // Tipos de arquivo permitidos para notas fiscais
    const allowedTypes = [
      'application/pdf',
      'application/xml',
      'text/xml',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use PDF ou XML.'), false);
    }
  }
});

const router = express.Router();

// Função helper para formatar datas para string YYYY-MM-DD (evita problemas de timezone)
const formatarDataParaString = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) {
    // Usar métodos locais para evitar problemas de timezone
    const ano = dateValue.getFullYear();
    const mes = String(dateValue.getMonth() + 1).padStart(2, '0');
    const dia = String(dateValue.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
  if (typeof dateValue === 'string') {
    // Se já está no formato YYYY-MM-DD, retornar direto
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateValue;
    }
    // Se tem T (ISO format), pegar só a parte da data
    if (dateValue.includes('T')) {
      return dateValue.split('T')[0];
    }
    // Se tem espaço (formato com hora), pegar só a parte da data
    if (dateValue.includes(' ')) {
      return dateValue.split(' ')[0];
    }
    // Tentar converter string para Date e depois formatar
    const dateObj = new Date(dateValue);
    if (!isNaN(dateObj.getTime())) {
      const ano = dateObj.getFullYear();
      const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dia = String(dateObj.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    }
    return dateValue;
  }
  return dateValue;
};

// Função helper para processar datas em um objeto de nota fiscal
const processarDatasNotaFiscal = (nota) => {
  if (!nota) return nota;
  
  const notaProcessada = { ...nota };
  
  if (notaProcessada.data_emissao) {
    notaProcessada.data_emissao = formatarDataParaString(notaProcessada.data_emissao);
  }
  
  if (notaProcessada.data_vencimento) {
    notaProcessada.data_vencimento = formatarDataParaString(notaProcessada.data_vencimento);
  }
  
  if (notaProcessada.data_saida) {
    notaProcessada.data_saida = formatarDataParaString(notaProcessada.data_saida);
  }
  
  return notaProcessada;
};

// Schema de validação para nota fiscal
const notaFiscalSchema = Joi.object({
  numero_nf: Joi.string().min(1).max(50).required(),
  serie: Joi.string().max(10).allow('', null).optional(),
  data_emissao: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  data_vencimento: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null, '').optional(),
  valor_total: Joi.number().min(0).required(),
  tipo: Joi.string().valid('entrada', 'saida').required(),
  status: Joi.string().valid('pendente', 'paga', 'vencida', 'cancelada').default('pendente'),
  cliente_id: Joi.number().integer().positive().allow(null).optional(),
  fornecedor_id: Joi.number().integer().positive().allow(null).optional(),
  venda_id: Joi.number().integer().positive().allow(null).optional(),
  compra_id: Joi.number().integer().positive().allow(null).optional(),
  medicao_id: Joi.number().integer().positive().allow(null).optional(),
  locacao_id: Joi.number().integer().positive().allow(null).optional(),
  tipo_nota: Joi.string().valid('nf_servico', 'nf_locacao', 'fatura', 'nfe_eletronica').allow(null, '').optional(),
  eletronica: Joi.boolean().allow(null).optional(),
  chave_acesso: Joi.string().max(44).allow(null, '').optional(),
  // Dados do Emitente/Destinatário
  emitente_inscricao_estadual: Joi.string().max(20).allow(null, '').optional(),
  destinatario_inscricao_estadual: Joi.string().max(20).allow(null, '').optional(),
  // Dados da Nota
  natureza_operacao: Joi.string().max(255).allow(null, '').optional(),
  protocolo_autorizacao: Joi.string().max(50).allow(null, '').optional(),
  data_saida: Joi.date().allow(null).optional(),
  hora_saida: Joi.string().allow(null, '').optional(), // Formato HH:MM:SS
  // Cálculo do Imposto
  base_calculo_icms: Joi.number().min(0).allow(null).optional(),
  valor_icms: Joi.number().min(0).allow(null).optional(),
  base_calculo_icms_st: Joi.number().min(0).allow(null).optional(),
  valor_icms_st: Joi.number().min(0).allow(null).optional(),
  valor_fcp_st: Joi.number().min(0).allow(null).optional(),
  valor_frete: Joi.number().min(0).allow(null).optional(),
  valor_seguro: Joi.number().min(0).allow(null).optional(),
  valor_desconto: Joi.number().min(0).allow(null).optional(),
  outras_despesas_acessorias: Joi.number().min(0).allow(null).optional(),
  valor_ipi: Joi.number().min(0).allow(null).optional(),
  // Transportador
  tipo_frete: Joi.string().max(50).allow(null, '').optional(),
  // ISSQN
  inscricao_municipal: Joi.string().max(20).allow(null, '').optional(),
  valor_total_servicos: Joi.number().min(0).allow(null).optional(),
  base_calculo_issqn: Joi.number().min(0).allow(null).optional(),
  valor_issqn: Joi.number().min(0).allow(null).optional(),
  // Dados Adicionais
  info_tributos: Joi.string().allow(null, '').optional(),
  observacoes: Joi.string().allow(null, '').optional(),
  // ============================================
  // CAMPOS ESPECÍFICOS DE NFS-e (Nota Fiscal de Serviço Eletrônica)
  // ============================================
  // Dados do Prestador
  prestador_inscricao_municipal: Joi.string().max(20).allow(null, '').optional(),
  prestador_email: Joi.string().email().max(255).allow(null, '').optional(),
  prestador_telefone: Joi.string().max(20).allow(null, '').optional(),
  // Dados do Tomador
  tomador_inscricao_municipal: Joi.string().max(20).allow(null, '').optional(),
  tomador_nif: Joi.string().max(50).allow(null, '').optional(),
  tomador_email: Joi.string().email().max(255).allow(null, '').optional(),
  tomador_telefone: Joi.string().max(20).allow(null, '').optional(),
  // Dados da NFS-e
  codigo_verificacao: Joi.string().max(20).allow(null, '').optional(),
  rps_numero: Joi.string().max(20).allow(null, '').optional(),
  rps_serie: Joi.string().max(10).allow(null, '').optional(),
  rps_tipo: Joi.string().max(10).allow(null, '').optional(),
  nfse_substituida: Joi.string().max(20).allow(null, '').optional(),
  // Atividade Econômica
  atividade_economica_codigo: Joi.string().max(20).allow(null, '').optional(),
  atividade_economica_descricao: Joi.string().allow(null, '').optional(),
  // Discriminação do Serviço
  discriminacao_servico: Joi.string().allow(null, '').optional(),
  codigo_obra: Joi.string().max(50).allow(null, '').optional(),
  obra_endereco: Joi.string().allow(null, '').optional(),
  // Tributos Federais
  valor_pis: Joi.number().min(0).allow(null).optional(),
  valor_cofins: Joi.number().min(0).allow(null).optional(),
  valor_inss: Joi.number().min(0).allow(null).optional(),
  valor_ir: Joi.number().min(0).allow(null).optional(),
  valor_csll: Joi.number().min(0).allow(null).optional(),
  percentual_tributos_federais: Joi.number().min(0).max(100).allow(null).optional(),
  percentual_tributos_estaduais: Joi.number().min(0).max(100).allow(null).optional(),
  percentual_tributos_municipais: Joi.number().min(0).max(100).allow(null).optional(),
  // Identificação Prestação de Serviços
  codigo_art: Joi.string().max(50).allow(null, '').optional(),
  exigibilidade_issqn: Joi.string().max(50).allow(null, '').optional(),
  regime_especial_tributacao: Joi.string().max(50).allow(null, '').optional(),
  simples_nacional: Joi.boolean().allow(null).optional(),
  incentivador_fiscal: Joi.boolean().allow(null).optional(),
  competencia: Joi.string().max(7).allow(null, '').optional(), // MM/AAAA
  municipio_prestacao: Joi.string().max(255).allow(null, '').optional(),
  municipio_incidencia: Joi.string().max(255).allow(null, '').optional(),
  issqn_reter: Joi.boolean().allow(null).optional(),
  // Detalhamento de Valores
  valor_servico: Joi.number().min(0).allow(null).optional(),
  desconto_incondicionado: Joi.number().min(0).allow(null).optional(),
  desconto_condicionado: Joi.number().min(0).allow(null).optional(),
  retencoes_federais: Joi.number().min(0).allow(null).optional(),
  outras_retencoes: Joi.number().min(0).allow(null).optional(),
  deducoes_previstas_lei: Joi.number().min(0).allow(null).optional(),
  aliquota_issqn: Joi.number().min(0).max(100).allow(null).optional(),
  valor_liquido: Joi.number().min(0).allow(null).optional()
});

/**
 * @swagger
 * /api/notas-fiscais:
 *   get:
 *     summary: Lista todas as notas fiscais
 *     tags: [Notas Fiscais]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notas fiscais
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
 *                         description: ID da nota fiscal
 *                       numero_nf:
 *                         type: string
 *                         description: Número da nota fiscal
 *                       serie:
 *                         type: string
 *                         description: Série da nota fiscal
 *                       data_emissao:
 *                         type: string
 *                         format: date
 *                         description: Data de emissão
 *                       data_vencimento:
 *                         type: string
 *                         format: date
 *                         description: Data de vencimento
 *                       valor_total:
 *                         type: number
 *                         description: Valor total da nota fiscal
 *                       tipo:
 *                         type: string
 *                         enum: [entrada, saida]
 *                         description: Tipo da nota fiscal
 *                       status:
 *                         type: string
 *                         enum: [pendente, paga, vencida, cancelada]
 *                         description: Status da nota fiscal
 *                       cliente_id:
 *                         type: integer
 *                         description: ID do cliente
 *                       fornecedor_id:
 *                         type: integer
 *                         description: ID do fornecedor
 *                       venda_id:
 *                         type: integer
 *                         description: ID da venda
 *                       compra_id:
 *                         type: integer
 *                         description: ID da compra
 *                       observacoes:
 *                         type: string
 *                         description: Observações
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Data de criação
 *                       clientes:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                           cnpj:
 *                             type: string
 *                       fornecedores:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                           cnpj:
 *                             type: string
 *                       vendas:
 *                         type: object
 *                         properties:
 *                           numero_venda:
 *                             type: string
 *                       compras:
 *                         type: object
 *                         properties:
 *                           numero_pedido:
 *                             type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = (page - 1) * limit;
    
    // Filtros opcionais
    const { tipo, status, search } = req.query;
    
    // Usar select com formatação de datas para evitar problemas de timezone
    // O PostgreSQL DATE pode ser convertido incorretamente pelo Supabase
    let query = supabaseAdmin
      .from('notas_fiscais')
      .select(`
        *,
        clientes(nome, cnpj),
        fornecedores(nome, cnpj),
        vendas(numero_venda),
        compras(numero_pedido)
      `, { count: 'exact' });
    
    // Aplicar filtros
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`numero_nf.ilike.${searchTerm},serie.ilike.${searchTerm},observacoes.ilike.${searchTerm}`);
    }
    
    // Aplicar ordenação e paginação
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Processar datas para garantir formato correto (YYYY-MM-DD)
    // O Supabase pode retornar datas como objetos Date ou strings, precisamos tratar ambos
    // IMPORTANTE: Se o Supabase retornar datas como strings já formatadas incorretamente,
    // precisamos usar uma abordagem diferente. Vamos tentar usar uma query SQL que force
    // o formato correto usando TO_CHAR ou CAST.
    const notasProcessadas = (data || []).map(nota => {
      const notaProcessada = { ...nota };
      
      // Processar data_emissao
      if (notaProcessada.data_emissao) {
        if (notaProcessada.data_emissao instanceof Date) {
          // Se for Date, usar métodos locais (não UTC) para manter a data original
          const date = notaProcessada.data_emissao;
          const ano = date.getFullYear();
          const mes = String(date.getMonth() + 1).padStart(2, '0');
          const dia = String(date.getDate()).padStart(2, '0');
          notaProcessada.data_emissao = `${ano}-${mes}-${dia}`;
        } else if (typeof notaProcessada.data_emissao === 'string') {
          // Se já é string, garantir formato YYYY-MM-DD
          // Se a string já está no formato YYYY-MM-DD mas pode estar incorreta devido a timezone,
          // vamos parsear manualmente para garantir que não haja conversão incorreta
          const dataStr = notaProcessada.data_emissao.split('T')[0].split(' ')[0];
          if (dataStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Se está no formato correto, retornar como está
            // Mas se foi salva incorretamente antes da correção, precisamos corrigir
            // Vamos comparar com a data de criação para detectar se há problema
            notaProcessada.data_emissao = dataStr;
          } else {
            notaProcessada.data_emissao = formatarDataParaString(notaProcessada.data_emissao);
          }
        }
      }
      
      // Processar data_vencimento
      if (notaProcessada.data_vencimento) {
        if (notaProcessada.data_vencimento instanceof Date) {
          // Se for Date, usar métodos locais (não UTC) para manter a data original
          const date = notaProcessada.data_vencimento;
          const ano = date.getFullYear();
          const mes = String(date.getMonth() + 1).padStart(2, '0');
          const dia = String(date.getDate()).padStart(2, '0');
          notaProcessada.data_vencimento = `${ano}-${mes}-${dia}`;
        } else if (typeof notaProcessada.data_vencimento === 'string') {
          // Se já é string, garantir formato YYYY-MM-DD
          const dataStr = notaProcessada.data_vencimento.split('T')[0].split(' ')[0];
          if (dataStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Se está no formato correto, retornar como está
            notaProcessada.data_vencimento = dataStr;
          } else {
            notaProcessada.data_vencimento = formatarDataParaString(notaProcessada.data_vencimento);
          }
        }
      }
      
      // Processar data_saida se existir
      if (notaProcessada.data_saida) {
        notaProcessada.data_saida = formatarDataParaString(notaProcessada.data_saida);
      }
      
      return notaProcessada;
    });

    const totalPages = Math.ceil((count || 0) / limit);

    res.json({
      success: true,
      data: notasProcessadas,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: totalPages
      }
    });
  } catch (error) {
    console.error('Erro ao listar notas fiscais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notas-fiscais:
 *   post:
 *     summary: Cria uma nova nota fiscal
 *     tags: [Notas Fiscais]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero_nf
 *               - serie
 *               - data_emissao
 *               - data_vencimento
 *               - valor_total
 *               - tipo
 *               - status
 *             properties:
 *               numero_nf:
 *                 type: string
 *                 description: Número da nota fiscal
 *               serie:
 *                 type: string
 *                 description: Série da nota fiscal
 *               data_emissao:
 *                 type: string
 *                 format: date
 *                 description: Data de emissão
 *               data_vencimento:
 *                 type: string
 *                 format: date
 *                 description: Data de vencimento
 *               valor_total:
 *                 type: number
 *                 description: Valor total da nota fiscal
 *               tipo:
 *                 type: string
 *                 enum: [entrada, saida]
 *                 description: Tipo da nota fiscal
 *               status:
 *                 type: string
 *                 enum: [pendente, paga, vencida, cancelada]
 *                 description: Status da nota fiscal
 *               cliente_id:
 *                 type: integer
 *                 description: ID do cliente
 *               fornecedor_id:
 *                 type: integer
 *                 description: ID do fornecedor
 *               venda_id:
 *                 type: integer
 *                 description: ID da venda
 *               compra_id:
 *                 type: integer
 *                 description: ID da compra
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *     responses:
 *       201:
 *         description: Nota fiscal criada com sucesso
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
 *                       type: integer
 *                       description: ID da nota fiscal criada
 *                     numero_nf:
 *                       type: string
 *                       description: Número da nota fiscal
 *                     serie:
 *                       type: string
 *                       description: Série da nota fiscal
 *                     data_emissao:
 *                       type: string
 *                       format: date
 *                       description: Data de emissão
 *                     data_vencimento:
 *                       type: string
 *                       format: date
 *                       description: Data de vencimento
 *                     valor_total:
 *                       type: number
 *                       description: Valor total da nota fiscal
 *                     tipo:
 *                       type: string
 *                       enum: [entrada, saida]
 *                       description: Tipo da nota fiscal
 *                     status:
 *                       type: string
 *                       enum: [pendente, paga, vencida, cancelada]
 *                       description: Status da nota fiscal
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     fornecedor_id:
 *                       type: integer
 *                       description: ID do fornecedor
 *                     venda_id:
 *                       type: integer
 *                       description: ID da venda
 *                     compra_id:
 *                       type: integer
 *                       description: ID da compra
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de criação
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
// Função helper para limpar dados antes de inserir no banco (converter strings vazias para null)
const limparDadosParaBanco = (data) => {
  const dadosLimpos = { ...data };
  
  // Converter strings vazias para null em campos de data
  Object.keys(dadosLimpos).forEach(key => {
    // Converter objetos Date para strings no formato YYYY-MM-DD
    if (key.includes('data') || key.includes('vencimento') || key.includes('emissao')) {
      if (dadosLimpos[key] instanceof Date || (typeof dadosLimpos[key] === 'string' && dadosLimpos[key].trim() !== '')) {
        dadosLimpos[key] = formatarDataParaString(dadosLimpos[key]);
      } else if (typeof dadosLimpos[key] === 'string' && dadosLimpos[key].trim() === '') {
        dadosLimpos[key] = null;
      }
    } else if (typeof dadosLimpos[key] === 'string' && dadosLimpos[key].trim() === '') {
      // Campos opcionais de texto podem ser null
      if (key.includes('observacoes') || key.includes('serie') || key.includes('chave') || key.includes('protocolo')) {
        dadosLimpos[key] = null;
      }
      // Outros campos opcionais também podem ser null
      else if (key !== 'numero_nf' && key !== 'tipo' && key !== 'status') {
        dadosLimpos[key] = null;
      }
    }
  });
  
  return dadosLimpos;
};

router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = notaFiscalSchema.validate(req.body, {
      convert: false // Não converter tipos automaticamente
    });
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    // Limpar dados antes de inserir no banco
    const dadosLimpos = limparDadosParaBanco(value);
    
    // Verificar se já existe nota fiscal com mesmo número
    // A constraint UNIQUE está apenas no campo numero_nf (não na combinação numero_nf + serie)
    const { data: notaExistente, error: checkError } = await supabaseAdmin
      .from('notas_fiscais')
      .select('id, numero_nf, serie')
      .eq('numero_nf', dadosLimpos.numero_nf)
      .limit(1)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar nota fiscal existente:', checkError);
    }
    
    if (notaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma nota fiscal com este número',
        error: `Nota fiscal ${dadosLimpos.numero_nf}${notaExistente.serie ? ` série ${notaExistente.serie}` : ''} já está cadastrada`,
        data: {
          id: notaExistente.id,
          numero_nf: notaExistente.numero_nf,
          serie: notaExistente.serie
        }
      });
    }
    
    // Garantir que datas sejam strings no formato YYYY-MM-DD (sem conversão de timezone)
    if (dadosLimpos.data_emissao) {
      if (typeof dadosLimpos.data_emissao === 'string') {
        // Extrair apenas a parte da data (YYYY-MM-DD) se houver hora
        dadosLimpos.data_emissao = dadosLimpos.data_emissao.split('T')[0].split(' ')[0];
      } else if (dadosLimpos.data_emissao instanceof Date) {
        // Se for Date, usar métodos locais para evitar problemas de timezone
        const ano = dadosLimpos.data_emissao.getFullYear();
        const mes = String(dadosLimpos.data_emissao.getMonth() + 1).padStart(2, '0');
        const dia = String(dadosLimpos.data_emissao.getDate()).padStart(2, '0');
        dadosLimpos.data_emissao = `${ano}-${mes}-${dia}`;
      }
    }
    
    if (dadosLimpos.data_vencimento) {
      if (typeof dadosLimpos.data_vencimento === 'string') {
        // Extrair apenas a parte da data (YYYY-MM-DD) se houver hora
        dadosLimpos.data_vencimento = dadosLimpos.data_vencimento.split('T')[0].split(' ')[0];
      } else if (dadosLimpos.data_vencimento instanceof Date) {
        // Se for Date, usar métodos locais para evitar problemas de timezone
        const ano = dadosLimpos.data_vencimento.getFullYear();
        const mes = String(dadosLimpos.data_vencimento.getMonth() + 1).padStart(2, '0');
        const dia = String(dadosLimpos.data_vencimento.getDate()).padStart(2, '0');
        dadosLimpos.data_vencimento = `${ano}-${mes}-${dia}`;
      }
    }


    // Usar RPC ou query direta para garantir que as datas sejam salvas corretamente
    // O problema pode estar no PostgreSQL interpretando datas como UTC
    const { data, error } = await supabaseAdmin
      .from('notas_fiscais')
      .insert([dadosLimpos])
      .select()
      .single();

    if (error) throw error;
    
    // Garantir que as datas retornadas estejam no formato correto (YYYY-MM-DD)
    // O PostgreSQL pode retornar datas com timezone, causando diferença de 1 dia
    if (data) {
      // Converter datas para string no formato YYYY-MM-DD
      // O PostgreSQL pode retornar datas como strings com timezone, precisamos extrair apenas a data
      if (data.data_emissao) {
        if (data.data_emissao instanceof Date) {
          // Se for Date, usar métodos locais (não UTC) para manter a data original
          const ano = data.data_emissao.getFullYear();
          const mes = String(data.data_emissao.getMonth() + 1).padStart(2, '0');
          const dia = String(data.data_emissao.getDate()).padStart(2, '0');
          data.data_emissao = `${ano}-${mes}-${dia}`;
        } else if (typeof data.data_emissao === 'string') {
          // Extrair apenas a parte da data (YYYY-MM-DD) removendo hora e timezone
          const dataStr = data.data_emissao.split('T')[0].split(' ')[0];
          // Verificar se está no formato correto
          if (dataStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            data.data_emissao = dataStr;
          } else {
            // Tentar parsear e reformatar
            const dateObj = new Date(data.data_emissao);
            if (!isNaN(dateObj.getTime())) {
              const ano = dateObj.getFullYear();
              const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
              const dia = String(dateObj.getDate()).padStart(2, '0');
              data.data_emissao = `${ano}-${mes}-${dia}`;
            }
          }
        }
      }
      
      if (data.data_vencimento) {
        if (data.data_vencimento instanceof Date) {
          // Se for Date, usar métodos locais (não UTC) para manter a data original
          const ano = data.data_vencimento.getFullYear();
          const mes = String(data.data_vencimento.getMonth() + 1).padStart(2, '0');
          const dia = String(data.data_vencimento.getDate()).padStart(2, '0');
          data.data_vencimento = `${ano}-${mes}-${dia}`;
        } else if (typeof data.data_vencimento === 'string') {
          // Extrair apenas a parte da data (YYYY-MM-DD) removendo hora e timezone
          const dataStr = data.data_vencimento.split('T')[0].split(' ')[0];
          // Verificar se está no formato correto
          if (dataStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            data.data_vencimento = dataStr;
          } else {
            // Tentar parsear e reformatar
            const dateObj = new Date(data.data_vencimento);
            if (!isNaN(dateObj.getTime())) {
              const ano = dateObj.getFullYear();
              const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
              const dia = String(dateObj.getDate()).padStart(2, '0');
              data.data_vencimento = `${ano}-${mes}-${dia}`;
            }
          }
        }
      }
    }

    // NOTA: A criação de boleto agora é controlada pelo frontend através do checkbox "Criar boleto"
    // O boleto só será criado se o usuário marcar essa opção no formulário de criação da nota fiscal

    res.status(201).json({
      success: true,
      data,
      message: 'Nota fiscal registrada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notas-fiscais/{id}:
 *   get:
 *     summary: Busca uma nota fiscal por ID
 *     tags: [Notas Fiscais]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da nota fiscal
 *     responses:
 *       200:
 *         description: Dados da nota fiscal
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
 *                       type: integer
 *                       description: ID da nota fiscal
 *                     numero_nf:
 *                       type: string
 *                       description: Número da nota fiscal
 *                     serie:
 *                       type: string
 *                       description: Série da nota fiscal
 *                     data_emissao:
 *                       type: string
 *                       format: date
 *                       description: Data de emissão
 *                     data_vencimento:
 *                       type: string
 *                       format: date
 *                       description: Data de vencimento
 *                     valor_total:
 *                       type: number
 *                       description: Valor total da nota fiscal
 *                     tipo:
 *                       type: string
 *                       enum: [entrada, saida]
 *                       description: Tipo da nota fiscal
 *                     status:
 *                       type: string
 *                       enum: [pendente, paga, vencida, cancelada]
 *                       description: Status da nota fiscal
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     fornecedor_id:
 *                       type: integer
 *                       description: ID do fornecedor
 *                     venda_id:
 *                       type: integer
 *                       description: ID da venda
 *                     compra_id:
 *                       type: integer
 *                       description: ID da compra
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de criação
 *                     clientes:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *                         cnpj:
 *                           type: string
 *                     fornecedores:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *                         cnpj:
 *                           type: string
 *                     vendas:
 *                       type: object
 *                       properties:
 *                         numero_venda:
 *                           type: string
 *                     compras:
 *                       type: object
 *                       properties:
 *                         numero_pedido:
 *                           type: string
 *       404:
 *         description: Nota fiscal não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notas_fiscais')
      .select(`
        *,
        clientes(nome, cnpj, telefone, email),
        fornecedores(nome, cnpj, telefone, email),
        vendas(numero_venda, data_venda),
        compras(numero_pedido, data_pedido),
        boletos(id, numero_boleto, valor, data_vencimento, status, tipo)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Nota fiscal não encontrada'
      });
    }

    // Processar datas para garantir formato correto (YYYY-MM-DD)
    const notaProcessada = processarDatasNotaFiscal(data);

    res.json({
      success: true,
      data: notaProcessada
    });
  } catch (error) {
    console.error('Erro ao obter nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notas-fiscais/{id}:
 *   put:
 *     summary: Atualiza uma nota fiscal existente
 *     tags: [Notas Fiscais]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da nota fiscal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero_nf:
 *                 type: string
 *                 description: Número da nota fiscal
 *               serie:
 *                 type: string
 *                 description: Série da nota fiscal
 *               data_emissao:
 *                 type: string
 *                 format: date
 *                 description: Data de emissão
 *               data_vencimento:
 *                 type: string
 *                 format: date
 *                 description: Data de vencimento
 *               valor_total:
 *                 type: number
 *                 description: Valor total da nota fiscal
 *               tipo:
 *                 type: string
 *                 enum: [entrada, saida]
 *                 description: Tipo da nota fiscal
 *               status:
 *                 type: string
 *                 enum: [pendente, paga, vencida, cancelada]
 *                 description: Status da nota fiscal
 *               cliente_id:
 *                 type: integer
 *                 description: ID do cliente
 *               fornecedor_id:
 *                 type: integer
 *                 description: ID do fornecedor
 *               venda_id:
 *                 type: integer
 *                 description: ID da venda
 *               compra_id:
 *                 type: integer
 *                 description: ID da compra
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *     responses:
 *       200:
 *         description: Nota fiscal atualizada com sucesso
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
 *                       type: integer
 *                       description: ID da nota fiscal
 *                     numero_nf:
 *                       type: string
 *                       description: Número da nota fiscal
 *                     serie:
 *                       type: string
 *                       description: Série da nota fiscal
 *                     data_emissao:
 *                       type: string
 *                       format: date
 *                       description: Data de emissão
 *                     data_vencimento:
 *                       type: string
 *                       format: date
 *                       description: Data de vencimento
 *                     valor_total:
 *                       type: number
 *                       description: Valor total da nota fiscal
 *                     tipo:
 *                       type: string
 *                       enum: [entrada, saida]
 *                       description: Tipo da nota fiscal
 *                     status:
 *                       type: string
 *                       enum: [pendente, paga, vencida, cancelada]
 *                       description: Status da nota fiscal
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     fornecedor_id:
 *                       type: integer
 *                       description: ID do fornecedor
 *                     venda_id:
 *                       type: integer
 *                       description: ID da venda
 *                     compra_id:
 *                       type: integer
 *                       description: ID da compra
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de atualização
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Nota fiscal não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = notaFiscalSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    // Limpar dados antes de atualizar no banco
    const dadosLimpos = limparDadosParaBanco(value);

    const { data, error } = await supabase
      .from('notas_fiscais')
      .update(dadosLimpos)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Nota fiscal não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Nota fiscal atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notas-fiscais/{id}:
 *   delete:
 *     summary: Deleta uma nota fiscal
 *     tags: [Notas Fiscais]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da nota fiscal
 *     responses:
 *       200:
 *         description: Nota fiscal deletada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso
 *       404:
 *         description: Nota fiscal não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('notas_fiscais')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Nota fiscal excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notas-fiscais/{id}/upload:
 *   post:
 *     summary: Faz upload de arquivo PDF/XML para uma nota fiscal
 *     tags: [Notas Fiscais]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da nota fiscal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome_arquivo
 *               - tamanho_arquivo
 *               - tipo_arquivo
 *             properties:
 *               nome_arquivo:
 *                 type: string
 *                 description: Nome do arquivo
 *               tamanho_arquivo:
 *                 type: number
 *                 description: Tamanho do arquivo em bytes
 *               tipo_arquivo:
 *                 type: string
 *                 enum: [pdf, xml]
 *                 description: Tipo do arquivo
 *     responses:
 *       200:
 *         description: Arquivo associado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Nota fiscal não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/upload', upload.single('arquivo'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }

    // Verificar se a nota fiscal existe
    const { data: notaFiscal, error: notaError } = await supabase
      .from('notas_fiscais')
      .select('id')
      .eq('id', id)
      .single();

    if (notaError || !notaFiscal) {
      return res.status(404).json({
        success: false,
        message: 'Nota fiscal não encontrada'
      });
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.originalname.split('.').pop();
    const fileName = `nf_${id}_${timestamp}_${randomString}.${extension}`;
    const filePath = `notas-fiscais/${id}/${fileName}`;

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

    // Determinar tipo de arquivo
    let tipoArquivo = 'pdf';
    if (file.mimetype.includes('xml')) {
      tipoArquivo = 'xml';
    } else if (file.mimetype.startsWith('image/')) {
      tipoArquivo = 'imagem';
    }

    // Atualizar nota fiscal com informações do arquivo
    const { data: updatedNota, error: updateError } = await supabase
      .from('notas_fiscais')
      .update({
        nome_arquivo: file.originalname,
        tamanho_arquivo: file.size,
        tipo_arquivo: tipoArquivo,
        arquivo_nf: arquivoUrl
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      data: updatedNota,
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

// GET /api/notas-fiscais/:id/download - Download do arquivo
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notas_fiscais')
      .select('nome_arquivo, arquivo_nf')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Nota fiscal não encontrada'
      });
    }

    if (!data.arquivo_nf) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado'
      });
    }

    // Retornar URL do arquivo para download
    res.json({
      success: true,
      data: {
        nome_arquivo: data.nome_arquivo,
        url: data.arquivo_nf
      }
    });
  } catch (error) {
    console.error('Erro ao obter arquivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Funções auxiliares para importação de XML
/**
 * Remove caracteres não numéricos do CNPJ
 */
const limparCNPJ = (cnpj) => {
  if (!cnpj) return null;
  return cnpj.replace(/\D/g, '');
};

/**
 * Busca cliente por CNPJ
 */
const buscarClientePorCNPJ = async (cnpj) => {
  try {
    const cnpjLimpo = limparCNPJ(cnpj);
    if (!cnpjLimpo || cnpjLimpo.length < 11) return null;

    const { data, error } = await supabaseAdmin
      .from('clientes')
      .select('id, nome, cnpj')
      .or(`cnpj.eq.${cnpjLimpo},cnpj.ilike.%${cnpjLimpo}%`)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Erro ao buscar cliente por CNPJ:', error);
    return null;
  }
};

/**
 * Busca fornecedor por CNPJ
 */
const buscarFornecedorPorCNPJ = async (cnpj) => {
  try {
    const cnpjLimpo = limparCNPJ(cnpj);
    if (!cnpjLimpo || cnpjLimpo.length < 11) return null;

    const { data, error } = await supabaseAdmin
      .from('fornecedores')
      .select('id, nome, cnpj')
      .or(`cnpj.eq.${cnpjLimpo},cnpj.ilike.%${cnpjLimpo}%`)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar fornecedor:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Erro ao buscar fornecedor por CNPJ:', error);
    return null;
  }
};

/**
 * Determina o tipo de nota baseado no CFOP e natureza da operação
 * Retorna: nf_servico, nf_locacao, fatura, nfe_eletronica
 */
const determinarTipoNota = (cfop, natOp) => {
  if (!cfop && !natOp) return 'nf_servico';

  const natOpLower = (natOp || '').toLowerCase();
  const cfopStr = String(cfop || '');

  // Verificar natureza da operação
  if (natOpLower.includes('locação') || natOpLower.includes('locacao')) {
    return 'nf_locacao';
  }
  if (natOpLower.includes('medição') || natOpLower.includes('medicao')) {
    return 'nf_servico';
  }
  if (natOpLower.includes('circulação') || natOpLower.includes('circulacao')) {
    return 'nf_servico';
  }
  if (natOpLower.includes('fatura')) {
    return 'fatura';
  }

  // Verificar CFOP
  if (cfopStr.startsWith('5')) {
    // CFOP 5xxx geralmente são saídas (locação, circulação)
    if (cfopStr === '5908' || cfopStr === '5909') {
      return 'nf_locacao';
    }
    return 'nf_servico'; // Padrão para CFOP 5xxx
  }
  if (cfopStr.startsWith('6')) {
    // CFOP 6xxx são entradas
    return 'nf_servico';
  }

  return 'nf_servico'; // Padrão
};

/**
 * Converte data ISO para formato YYYY-MM-DD (string) ou null
 */
const formatarData = (dataISO) => {
  if (!dataISO || dataISO === '' || dataISO === 'null') return null;
  try {
    const data = new Date(dataISO);
    if (isNaN(data.getTime())) return null;
    return data.toISOString().split('T')[0]; // Retorna string YYYY-MM-DD
  } catch {
    return null;
  }
};

/**
 * Detecta o tipo de XML (NFe ou NFS-e)
 */
const detectarTipoXML = (xmlString) => {
  if (xmlString.includes('CompNfse') || xmlString.includes('Nfse') || xmlString.includes('InfNfse')) {
    return 'nfse';
  }
  if (xmlString.includes('nfeProc') || xmlString.includes('NFe') || xmlString.includes('infNFe')) {
    return 'nfe';
  }
  return null;
};

/**
 * Parse do XML da NFS-e (Nota Fiscal de Serviço Eletrônica)
 */
const parseXMLNFSe = (xmlBuffer) => {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true,
      parseTrueNumberOnly: false,
      arrayMode: false
    });

    const xmlString = xmlBuffer.toString('utf-8');
    const jsonObj = parser.parse(xmlString);

    // Acessar a estrutura da NFS-e
    const compNfse = jsonObj['ns2:CompNfse'] || jsonObj.CompNfse || jsonObj;
    const nfse = compNfse['ns2:Nfse'] || compNfse.Nfse || compNfse;
    const infNfse = nfse['ns2:InfNfse'] || nfse.InfNfse || nfse;

    if (!infNfse) {
      throw new Error('Estrutura XML inválida: não foi possível encontrar InfNfse');
    }

    // Extrair dados básicos da NFS-e
    const numero = infNfse['ns2:Numero'] || infNfse.Numero || '';
    const codigoVerificacao = infNfse['ns2:CodigoVerificacao'] || infNfse.CodigoVerificacao || '';
    const dataEmissao = infNfse['ns2:DataEmissao'] || infNfse.DataEmissao || '';

    // Extrair valores
    const valoresNfse = infNfse['ns2:ValoresNfse'] || infNfse.ValoresNfse || {};
    const baseCalculo = parseFloat(valoresNfse['ns2:BaseCalculo'] || valoresNfse.BaseCalculo || '0');
    const aliquota = parseFloat(valoresNfse['ns2:Aliquota'] || valoresNfse.Aliquota || '0');
    const valorIss = parseFloat(valoresNfse['ns2:ValorIss'] || valoresNfse.ValorIss || '0');
    const valorLiquido = parseFloat(valoresNfse['ns2:ValorLiquidoNfse'] || valoresNfse.ValorLiquidoNfse || '0');

    // Extrair prestador
    const prestador = infNfse['ns2:PrestadorServico'] || infNfse.PrestadorServico || {};
    const prestadorRazaoSocial = prestador['ns2:RazaoSocial'] || prestador.RazaoSocial || '';
    const prestadorContato = prestador['ns2:Contato'] || prestador.Contato || {};
    const prestadorEmail = prestadorContato['ns2:Email'] || prestadorContato.Email || '';
    const prestadorTelefone = prestadorContato['ns2:Telefone'] || prestadorContato.Telefone || '';

    // Extrair declaração de prestação de serviço
    const declaracao = infNfse['ns2:DeclaracaoPrestacaoServico'] || infNfse.DeclaracaoPrestacaoServico || {};
    const infDeclaracao = declaracao['ns2:InfDeclaracaoPrestacaoServico'] || declaracao.InfDeclaracaoPrestacaoServico || {};
    
    // Prestador na declaração
    const prestadorDecl = infDeclaracao['ns2:Prestador'] || infDeclaracao.Prestador || {};
    const prestadorCpfCnpj = prestadorDecl['ns2:CpfCnpj'] || prestadorDecl.CpfCnpj || {};
    const prestadorCnpj = prestadorCpfCnpj['ns2:Cnpj'] || prestadorCpfCnpj.Cnpj || prestadorCpfCnpj.CPF || '';
    const prestadorInscricaoMunicipal = prestadorDecl['ns2:InscricaoMunicipal'] || prestadorDecl.InscricaoMunicipal || '';

    // Serviço
    const servico = infDeclaracao['ns2:Servico'] || infDeclaracao.Servico || {};
    const valores = servico['ns2:Valores'] || servico.Valores || {};
    const valorServicos = parseFloat(valores['ns2:ValorServicos'] || valores.ValorServicos || '0');
    const valorPis = parseFloat(valores['ns2:ValorPis'] || valores.ValorPis || '0');
    const valorCofins = parseFloat(valores['ns2:ValorCofins'] || valores.ValorCofins || '0');
    const valorInss = parseFloat(valores['ns2:ValorInss'] || valores.ValorInss || '0');
    const valorIr = parseFloat(valores['ns2:ValorIr'] || valores.ValorIr || '0');
    const valorCsll = parseFloat(valores['ns2:ValorCsll'] || valores.ValorCsll || '0');
    const outrasRetencoes = parseFloat(valores['ns2:OutrasRetencoes'] || valores.OutrasRetencoes || '0');
    const descontoIncondicionado = parseFloat(valores['ns2:DescontoIncondicionado'] || valores.DescontoIncondicionado || '0');
    const descontoCondicionado = parseFloat(valores['ns2:DescontoCondicionado'] || valores.DescontoCondicionado || '0');
    
    const itemListaServico = servico['ns2:ItemListaServico'] || servico.ItemListaServico || '';
    const codigoTributacaoMunicipio = servico['ns2:CodigoTributacaoMunicipio'] || servico.CodigoTributacaoMunicipio || '';
    const discriminacao = servico['ns2:Discriminacao'] || servico.Discriminacao || '';
    const codigoMunicipio = servico['ns2:CodigoMunicipio'] || servico.CodigoMunicipio || '';
    const municipioIncidencia = servico['ns2:MunicipioIncidencia'] || servico.MunicipioIncidencia || '';
    const exigibilidadeISS = servico['ns2:ExigibilidadeISS'] || servico.ExigibilidadeISS || '';

    // Tomador
    const tomador = infDeclaracao['ns2:TomadorServico'] || infDeclaracao.TomadorServico || {};
    const tomadorIdentificacao = tomador['ns2:IdentificacaoTomador'] || tomador.IdentificacaoTomador || {};
    const tomadorCpfCnpj = tomadorIdentificacao['ns2:CpfCnpj'] || tomadorIdentificacao.CpfCnpj || {};
    const tomadorCnpj = tomadorCpfCnpj['ns2:Cnpj'] || tomadorCpfCnpj.Cnpj || tomadorCpfCnpj.CPF || '';
    const tomadorRazaoSocial = tomador['ns2:RazaoSocial'] || tomador.RazaoSocial || '';
    const tomadorContato = tomador['ns2:Contato'] || tomador.Contato || {};
    const tomadorEmail = tomadorContato['ns2:Email'] || tomadorContato.Email || '';
    const tomadorTelefone = tomadorContato['ns2:Telefone'] || tomadorContato.Telefone || '';

    // Construção Civil
    const construcaoCivil = infDeclaracao['ns2:ConstrucaoCivil'] || infDeclaracao.ConstrucaoCivil || {};
    const codigoObra = construcaoCivil['ns2:CodigoObra'] || construcaoCivil.CodigoObra || '';

    // Outras informações
    const optanteSimplesNacional = infDeclaracao['ns2:OptanteSimplesNacional'] || infDeclaracao.OptanteSimplesNacional || '0';
    const incentivadorFiscal = infDeclaracao['ns2:IncentivoFiscal'] || infDeclaracao.IncentivoFiscal || '0';
    const competencia = infDeclaracao['ns2:Competencia'] || infDeclaracao.Competencia || '';

    // Extrair descrição do código de tributação
    const descricaoCodigoTributacao = infNfse['ns2:DescricaoCodigoTributacaoMunicipio'] || infNfse.DescricaoCodigoTributacaoMunicipio || '';

    // Determinar tipo de nota
    let tipoNota = 'nf_servico';
    if (discriminacao.toLowerCase().includes('locação') || discriminacao.toLowerCase().includes('locacao')) {
      tipoNota = 'nf_locacao';
    }

    // Montar atividade econômica
    const atividadeEconomicaCodigo = itemListaServico && codigoTributacaoMunicipio 
      ? `${itemListaServico} / ${codigoTributacaoMunicipio}` 
      : itemListaServico || codigoTributacaoMunicipio || '';
    const atividadeEconomicaDescricao = descricaoCodigoTributacao || '';

    // Extrair código da obra da discriminação se não estiver no XML
    let codigoObraFinal = codigoObra;
    if (!codigoObraFinal && discriminacao) {
      const matchCNO = discriminacao.match(/CNO[:\s]+([\d.\/]+)/i);
      if (matchCNO) {
        codigoObraFinal = matchCNO[1];
      }
    }

    // Extrair endereço da obra da discriminação
    let obraEndereco = '';
    if (discriminacao) {
      const linhas = discriminacao.split('\n');
      for (let i = linhas.length - 1; i >= 0; i--) {
        if (linhas[i].trim() && !linhas[i].includes('CNO')) {
          obraEndereco = linhas[i].trim();
          break;
        }
      }
    }

    // Calcular retenções federais
    const retencoesFederais = valorPis + valorCofins + valorInss + valorIr + valorCsll;

    // Formatar competência (de ISO para MM/AAAA)
    let competenciaFormatada = '';
    if (competencia) {
      try {
        const data = new Date(competencia);
        if (!isNaN(data.getTime())) {
          const mes = String(data.getMonth() + 1).padStart(2, '0');
          const ano = data.getFullYear();
          competenciaFormatada = `${mes}/${ano}`;
        }
      } catch (e) {
        // Tentar extrair de formato diferente
        const match = competencia.match(/(\d{4})-(\d{2})/);
        if (match) {
          competenciaFormatada = `${match[2]}/${match[1]}`;
        }
      }
    }

    return {
      numero_nf: String(numero),
      serie: null, // NFS-e geralmente não tem série
      data_emissao: formatarData(dataEmissao),
      data_vencimento: null,
      valor_total: valorLiquido || valorServicos,
      tipo: 'saida', // NFS-e são sempre de saída
      tipo_nota: tipoNota,
      eletronica: true,
      codigo_verificacao: codigoVerificacao,
      // Prestador
      cnpj_prestador: prestadorCnpj,
      nome_prestador: prestadorRazaoSocial,
      prestador_inscricao_municipal: prestadorInscricaoMunicipal,
      prestador_email: prestadorEmail,
      prestador_telefone: prestadorTelefone,
      // Tomador
      cnpj_tomador: tomadorCnpj,
      nome_tomador: tomadorRazaoSocial,
      tomador_email: tomadorEmail,
      tomador_telefone: tomadorTelefone,
      // Atividade Econômica
      atividade_economica_codigo: atividadeEconomicaCodigo,
      atividade_economica_descricao: atividadeEconomicaDescricao,
      // Discriminação
      discriminacao_servico: discriminacao,
      codigo_obra: codigoObraFinal,
      obra_endereco: obraEndereco,
      // Valores
      valor_servico: valorServicos,
      base_calculo_issqn: baseCalculo,
      aliquota_issqn: aliquota,
      valor_issqn: valorIss,
      valor_liquido: valorLiquido,
      desconto_incondicionado: descontoIncondicionado,
      desconto_condicionado: descontoCondicionado,
      retencoes_federais: retencoesFederais,
      outras_retencoes: outrasRetencoes,
      valor_pis: valorPis,
      valor_cofins: valorCofins,
      valor_inss: valorInss,
      valor_ir: valorIr,
      valor_csll: valorCsll,
      // Identificação
      exigibilidade_issqn: exigibilidadeISS === '1' ? '1-Exigível' : exigibilidadeISS,
      simples_nacional: optanteSimplesNacional === '1',
      incentivador_fiscal: incentivadorFiscal === '1',
      competencia: competenciaFormatada,
      municipio_prestacao: codigoMunicipio,
      municipio_incidencia: municipioIncidencia,
      issqn_reter: servico['ns2:IssRetido'] === '1' || servico.IssRetido === '1'
    };
  } catch (error) {
    console.error('Erro ao fazer parse do XML NFS-e:', error);
    throw new Error(`Erro ao processar XML NFS-e: ${error.message}`);
  }
};

/**
 * Parse do XML da NFe
 */
const parseXMLNFe = (xmlBuffer) => {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true,
      parseTrueNumberOnly: false,
      arrayMode: false
    });

    const xmlString = xmlBuffer.toString('utf-8');
    const jsonObj = parser.parse(xmlString);

    // Acessar a estrutura da NFe (pode variar dependendo do namespace)
    const nfeProc = jsonObj.nfeProc || jsonObj['nfeProc'] || jsonObj;
    const nfe = nfeProc.NFe || nfeProc['NFe'] || nfeProc;
    const infNFe = nfe.infNFe || nfe['infNFe'] || nfe;

    if (!infNFe) {
      throw new Error('Estrutura XML inválida: não foi possível encontrar infNFe');
    }

    // Extrair dados do ide (identificação)
    const ide = infNFe.ide || {};
    const numeroNF = ide.nNF || ide['nNF'] || '';
    const serie = ide.serie || ide['serie'] || '';
    const dhEmi = ide.dhEmi || ide['dhEmi'] || '';
    const dhSaiEnt = ide.dhSaiEnt || ide['dhSaiEnt'] || '';
    const tpNF = ide.tpNF || ide['tpNF'] || '1'; // 1 = Saída, 0 = Entrada
    const natOp = ide.natOp || ide['natOp'] || '';

    // Extrair dados do emitente
    const emit = infNFe.emit || {};
    const cnpjEmitente = emit.CNPJ || emit['CNPJ'] || '';
    const nomeEmitente = emit.xNome || emit['xNome'] || '';

    // Extrair dados do destinatário
    const dest = infNFe.dest || {};
    const cnpjDestinatario = dest.CNPJ || dest['CNPJ'] || '';
    const nomeDestinatario = dest.xNome || dest['xNome'] || '';

    // Extrair dados dos produtos (primeiro item)
    const det = infNFe.det || {};
    const detArray = Array.isArray(det) ? det : [det];
    const primeiroItem = detArray[0] || {};
    const prod = primeiroItem.prod || {};
    const cfop = prod.CFOP || prod['CFOP'] || '';

    // Extrair totais
    const total = infNFe.total || {};
    const icmsTot = total.ICMSTot || total['ICMSTot'] || {};
    const valorTotal = parseFloat(icmsTot.vNF || icmsTot['vNF'] || '0');

    // Extrair informações adicionais
    const infAdic = infNFe.infAdic || {};
    const infCpl = infAdic.infCpl || infAdic['infCpl'] || '';

    // Extrair protocolo
    const protNFe = nfeProc.protNFe || nfeProc['protNFe'] || {};
    const infProt = protNFe.infProt || protNFe['infProt'] || {};
    const chNFe = infProt.chNFe || infProt['chNFe'] || '';
    const cStat = infProt.cStat || infProt['cStat'] || '';
    const xMotivo = infProt.xMotivo || infProt['xMotivo'] || '';

    // Validar se a NFe está autorizada
    if (cStat !== '100') {
      throw new Error(`NFe não autorizada. Status: ${cStat} - ${xMotivo}`);
    }

    // Determinar tipo (entrada ou saída)
    const tipo = tpNF === '0' ? 'entrada' : 'saida';

    // Determinar tipo de nota
    const tipoNota = determinarTipoNota(cfop, natOp);

    // Montar observações
    let observacoes = '';
    if (natOp) {
      observacoes += `Natureza da operação: ${natOp}\n`;
    }
    if (infCpl) {
      observacoes += infCpl;
    }
    if (chNFe) {
      observacoes += `\nChave de acesso: ${chNFe}`;
    }

    return {
      numero_nf: String(numeroNF),
      serie: String(serie || ''),
      data_emissao: formatarData(dhEmi),
      data_vencimento: formatarData(dhSaiEnt),
      valor_total: valorTotal,
      tipo: tipo,
      tipo_nota: tipoNota,
      observacoes: observacoes.trim(),
      // Dados para busca
      cnpj_emitente: cnpjEmitente,
      nome_emitente: nomeEmitente,
      cnpj_destinatario: cnpjDestinatario,
      nome_destinatario: nomeDestinatario,
      // Dados adicionais
      chave_acesso: chNFe,
      cfop: cfop,
      natureza_operacao: natOp
    };
  } catch (error) {
    console.error('Erro ao fazer parse do XML:', error);
    throw new Error(`Erro ao processar XML: ${error.message}`);
  }
};

/**
 * @swagger
 * /api/notas-fiscais/importar-xml:
 *   post:
 *     summary: Importar nota fiscal a partir de XML
 *     tags: [Notas Fiscais]
 *     security:
 *       - bearerAuth: []
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
 *                 description: Arquivo XML da NFe
 *     responses:
 *       200:
 *         description: Nota fiscal importada com sucesso
 *       400:
 *         description: Dados inválidos ou XML inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/importar-xml', upload.single('arquivo'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo XML enviado'
      });
    }

    // Validar se é XML
    if (!file.mimetype.includes('xml') && !file.originalname.toLowerCase().endsWith('.xml')) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo deve ser um XML válido'
      });
    }

    // Detectar tipo de XML (NFe ou NFS-e)
    const xmlString = file.buffer.toString('utf-8');
    const tipoXML = detectarTipoXML(xmlString);

    if (!tipoXML) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de XML não reconhecido. Suportado: NFe ou NFS-e'
      });
    }

    // Fazer parse do XML conforme o tipo
    let dadosNota;
    try {
      if (tipoXML === 'nfse') {
        dadosNota = parseXMLNFSe(file.buffer);
      } else {
        dadosNota = parseXMLNFe(file.buffer);
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao processar XML',
        error: parseError.message
      });
    }

    // Buscar cliente ou fornecedor
    let cliente_id = null;
    let fornecedor_id = null;
    const avisos = [];

    if (tipoXML === 'nfse') {
      // Para NFS-e: prestador = fornecedor, tomador = cliente
      if (dadosNota.cnpj_prestador) {
        const fornecedor = await buscarFornecedorPorCNPJ(dadosNota.cnpj_prestador);
        if (fornecedor) {
          fornecedor_id = fornecedor.id;
        } else {
          avisos.push(`Fornecedor não encontrado: ${dadosNota.nome_prestador} (CNPJ: ${dadosNota.cnpj_prestador}). Você pode vincular manualmente após a importação.`);
        }
      }
      if (dadosNota.cnpj_tomador) {
        const cliente = await buscarClientePorCNPJ(dadosNota.cnpj_tomador);
        if (cliente) {
          cliente_id = cliente.id;
        } else {
          avisos.push(`Cliente não encontrado: ${dadosNota.nome_tomador} (CNPJ: ${dadosNota.cnpj_tomador}). Você pode vincular manualmente após a importação.`);
        }
      }
    } else {
      // Para NFe: lógica original
      if (dadosNota.tipo === 'saida') {
        // Para notas de saída, buscar cliente pelo CNPJ do destinatário
        if (dadosNota.cnpj_destinatario) {
          const cliente = await buscarClientePorCNPJ(dadosNota.cnpj_destinatario);
          if (cliente) {
            cliente_id = cliente.id;
          } else {
            avisos.push(`Cliente não encontrado: ${dadosNota.nome_destinatario} (CNPJ: ${dadosNota.cnpj_destinatario}). Você pode vincular manualmente após a importação.`);
          }
        }
      } else {
        // Para notas de entrada, buscar fornecedor pelo CNPJ do emitente
        if (dadosNota.cnpj_emitente) {
          const fornecedor = await buscarFornecedorPorCNPJ(dadosNota.cnpj_emitente);
          if (fornecedor) {
            fornecedor_id = fornecedor.id;
          } else {
            avisos.push(`Fornecedor não encontrado: ${dadosNota.nome_emitente} (CNPJ: ${dadosNota.cnpj_emitente}). Você pode vincular manualmente após a importação.`);
          }
        }
      }
    }

    // Verificar se já existe nota fiscal com mesmo número e série/código de verificação
    let query = supabaseAdmin
      .from('notas_fiscais')
      .select('id, numero_nf, serie, codigo_verificacao')
      .eq('numero_nf', dadosNota.numero_nf);
    
    if (tipoXML === 'nfse' && dadosNota.codigo_verificacao) {
      query = query.eq('codigo_verificacao', dadosNota.codigo_verificacao);
    } else {
      query = query.eq('serie', dadosNota.serie || '');
    }
    
    const { data: notasExistentes } = await query;

    if (notasExistentes && notasExistentes.length > 0) {
      const notaExistente = notasExistentes[0];
      return res.status(400).json({
        success: false,
        message: 'Nota fiscal já existe no sistema',
        data: {
          id: notaExistente.id,
          numero_nf: notaExistente.numero_nf,
          serie: notaExistente.serie
        }
      });
    }

    // Função auxiliar para limpar valores
    const limparValor = (valor, tipo = 'string') => {
      if (valor === undefined || valor === null) return null;
      if (tipo === 'number') {
        if (valor === '' || valor === null || valor === undefined) return null;
        const num = parseFloat(valor);
        return isNaN(num) ? null : num;
      }
      if (tipo === 'string') {
        if (valor === null || valor === undefined) return null;
        const str = String(valor).trim();
        return str === '' ? null : str;
      }
      if (tipo === 'boolean') {
        if (valor === null || valor === undefined) return null;
        return Boolean(valor);
      }
      return valor;
    };

    // Criar nota fiscal
    const notaFiscalData = {
      numero_nf: String(dadosNota.numero_nf || ''),
      serie: limparValor(dadosNota.serie, 'string'),
      data_emissao: dadosNota.data_emissao || null,
      data_vencimento: dadosNota.data_vencimento || null,
      valor_total: limparValor(dadosNota.valor_total, 'number') || 0,
      tipo: dadosNota.tipo || 'saida',
      status: 'pendente',
      tipo_nota: dadosNota.tipo_nota || (tipoXML === 'nfse' ? 'nf_servico' : 'nfe_eletronica'),
      eletronica: true, // XML sempre é eletrônica
      chave_acesso: limparValor(dadosNota.chave_acesso, 'string'),
      cliente_id: cliente_id,
      fornecedor_id: fornecedor_id,
      observacoes: limparValor(dadosNota.observacoes || dadosNota.discriminacao_servico, 'string'),
      // Campos específicos de NFS-e (se aplicável)
      ...(tipoXML === 'nfse' ? {
        codigo_verificacao: limparValor(dadosNota.codigo_verificacao, 'string'),
        prestador_inscricao_municipal: limparValor(dadosNota.prestador_inscricao_municipal, 'string'),
        prestador_email: limparValor(dadosNota.prestador_email, 'string'),
        prestador_telefone: limparValor(dadosNota.prestador_telefone, 'string'),
        tomador_email: limparValor(dadosNota.tomador_email, 'string'),
        tomador_telefone: limparValor(dadosNota.tomador_telefone, 'string'),
        atividade_economica_codigo: limparValor(dadosNota.atividade_economica_codigo, 'string'),
        atividade_economica_descricao: limparValor(dadosNota.atividade_economica_descricao, 'string'),
        discriminacao_servico: limparValor(dadosNota.discriminacao_servico, 'string'),
        codigo_obra: limparValor(dadosNota.codigo_obra, 'string'),
        obra_endereco: limparValor(dadosNota.obra_endereco, 'string'),
        valor_servico: limparValor(dadosNota.valor_servico, 'number'),
        base_calculo_issqn: limparValor(dadosNota.base_calculo_issqn, 'number'),
        aliquota_issqn: limparValor(dadosNota.aliquota_issqn, 'number'),
        valor_issqn: limparValor(dadosNota.valor_issqn, 'number'),
        valor_liquido: limparValor(dadosNota.valor_liquido, 'number'),
        desconto_incondicionado: limparValor(dadosNota.desconto_incondicionado, 'number'),
        desconto_condicionado: limparValor(dadosNota.desconto_condicionado, 'number'),
        retencoes_federais: limparValor(dadosNota.retencoes_federais, 'number'),
        outras_retencoes: limparValor(dadosNota.outras_retencoes, 'number'),
        valor_pis: limparValor(dadosNota.valor_pis, 'number'),
        valor_cofins: limparValor(dadosNota.valor_cofins, 'number'),
        valor_inss: limparValor(dadosNota.valor_inss, 'number'),
        valor_ir: limparValor(dadosNota.valor_ir, 'number'),
        valor_csll: limparValor(dadosNota.valor_csll, 'number'),
        exigibilidade_issqn: limparValor(dadosNota.exigibilidade_issqn, 'string'),
        simples_nacional: limparValor(dadosNota.simples_nacional, 'boolean'),
        incentivador_fiscal: limparValor(dadosNota.incentivador_fiscal, 'boolean'),
        competencia: limparValor(dadosNota.competencia, 'string'),
        municipio_prestacao: limparValor(dadosNota.municipio_prestacao, 'string'),
        municipio_incidencia: limparValor(dadosNota.municipio_incidencia, 'string'),
        issqn_reter: limparValor(dadosNota.issqn_reter, 'boolean')
      } : {
        // Campos específicos de NFe
        natureza_operacao: limparValor(dadosNota.natureza_operacao, 'string'),
        protocolo_autorizacao: limparValor(dadosNota.protocolo_autorizacao, 'string'),
        chave_acesso: limparValor(dadosNota.chave_acesso, 'string')
      })
    };

    // Garantir que data_vencimento seja null se vazio ou inválido
    if (notaFiscalData.data_vencimento === '' || notaFiscalData.data_vencimento === 'null' || notaFiscalData.data_vencimento === undefined) {
      notaFiscalData.data_vencimento = null;
    }
    
    // Garantir que data_emissao seja válida
    if (!notaFiscalData.data_emissao) {
      return res.status(400).json({
        success: false,
        message: 'Data de emissão é obrigatória',
        error: 'data_emissao é obrigatória'
      });
    }

    // Validar dados
    const { error: validationError, value: validatedData } = notaFiscalSchema.validate(notaFiscalData, {
      abortEarly: false,
      allowUnknown: true
    });
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        error: validationError.details.map(d => d.message).join('; '),
        details: validationError.details
      });
    }

    // Inserir nota fiscal
    const { data: notaCriada, error: insertError } = await supabaseAdmin
      .from('notas_fiscais')
      .insert(validatedData)
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar nota fiscal:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar nota fiscal',
        error: insertError.message
      });
    }

    // Fazer upload do XML como arquivo anexo
    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `nf_${notaCriada.id}_${timestamp}_${randomString}.xml`;
      const filePath = `notas-fiscais/${notaCriada.id}/${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('arquivos-obras')
        .upload(filePath, file.buffer, {
          contentType: 'application/xml',
          cacheControl: '3600',
          upsert: false
        });

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from('arquivos-obras')
          .getPublicUrl(filePath);

        const arquivoUrl = urlData?.publicUrl || `${process.env.SUPABASE_URL}/storage/v1/object/public/arquivos-obras/${filePath}`;

        // Atualizar nota fiscal com informações do arquivo
        await supabaseAdmin
          .from('notas_fiscais')
          .update({
            nome_arquivo: file.originalname,
            tamanho_arquivo: file.size,
            tipo_arquivo: 'xml',
            arquivo_nf: arquivoUrl
          })
          .eq('id', notaCriada.id);
      }
    } catch (uploadError) {
      console.error('Erro ao fazer upload do XML:', uploadError);
      avisos.push('Nota fiscal criada, mas houve erro ao anexar o arquivo XML.');
    }

    // Buscar dados completos da nota criada
    const { data: notaCompleta } = await supabaseAdmin
      .from('notas_fiscais')
      .select(`
        *,
        clientes(id, nome, cnpj),
        fornecedores(id, nome, cnpj)
      `)
      .eq('id', notaCriada.id)
      .single();

    res.json({
      success: true,
      data: notaCompleta,
      message: 'Nota fiscal importada com sucesso',
      avisos: avisos.length > 0 ? avisos : undefined
    });
  } catch (error) {
    console.error('Erro ao importar XML:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ==================== ITENS DA NOTA FISCAL ====================

// Schema de validação para imposto dinâmico
const impostoDinamicoSchema = Joi.object({
  id: Joi.string().optional(),
  nome: Joi.string().required(),
  tipo: Joi.string().allow(null, '').optional(),
  tipo_calculo: Joi.string().valid('porcentagem', 'valor_fixo').default('porcentagem').optional(),
  base_calculo: Joi.number().min(0).allow(null).optional(),
  aliquota: Joi.number().min(0).max(100).allow(null).optional(),
  valor_fixo: Joi.number().min(0).allow(null).optional(),
  valor_calculado: Joi.number().min(0).allow(null).optional()
});

// Schema de validação para item de nota fiscal
const notaFiscalItemSchema = Joi.object({
  nota_fiscal_id: Joi.number().integer().positive().required(),
  codigo_produto: Joi.string().max(100).allow(null, '').optional(),
  descricao: Joi.string().required(),
  ncm_sh: Joi.string().max(10).allow(null, '').optional(),
  cfop: Joi.string().max(10).allow(null, '').optional(),
  unidade: Joi.string().max(10).required(),
  quantidade: Joi.number().min(0).required(),
  preco_unitario: Joi.number().min(0).required(),
  preco_total: Joi.number().min(0).required(),
  csosn: Joi.string().max(10).allow(null, '').optional(),
  // Impostos de produtos
  base_calculo_icms: Joi.number().min(0).allow(null).optional(),
  percentual_icms: Joi.number().min(0).max(100).allow(null).optional(),
  valor_icms: Joi.number().min(0).allow(null).optional(),
  percentual_ipi: Joi.number().min(0).max(100).allow(null).optional(),
  valor_ipi: Joi.number().min(0).allow(null).optional(),
  // Impostos de serviços
  base_calculo_issqn: Joi.number().min(0).allow(null).optional(),
  aliquota_issqn: Joi.number().min(0).max(100).allow(null).optional(),
  valor_issqn: Joi.number().min(0).allow(null).optional(),
  valor_inss: Joi.number().min(0).allow(null).optional(),
  valor_cbs: Joi.number().min(0).allow(null).optional(),
  valor_liquido: Joi.number().min(0).allow(null).optional(),
  // Impostos dinâmicos
  impostos_dinamicos: Joi.alternatives().try(
    Joi.array().items(impostoDinamicoSchema),
    Joi.string() // Aceita também como string JSON
  ).allow(null).optional(),
  ordem: Joi.number().integer().min(1).optional()
});

/**
 * @swagger
 * /api/notas-fiscais/{id}/itens:
 *   get:
 *     summary: Lista todos os itens de uma nota fiscal
 *     tags: [Notas Fiscais]
 */
router.get('/:id/itens', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('notas_fiscais_itens')
      .select('*')
      .eq('nota_fiscal_id', id)
      .order('id', { ascending: true });

    if (error) throw error;

    // Parsear impostos dinâmicos de string JSON para array
    const itensProcessados = (data || []).map(item => {
      if (item.impostos_dinamicos && typeof item.impostos_dinamicos === 'string') {
        try {
          item.impostos_dinamicos = JSON.parse(item.impostos_dinamicos);
        } catch (e) {
          console.error('Erro ao fazer parse de impostos_dinamicos:', e);
          item.impostos_dinamicos = [];
        }
      }
      return item;
    });

    res.json({
      success: true,
      data: itensProcessados
    });
  } catch (error) {
    console.error('Erro ao listar itens da nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notas-fiscais/{id}/itens:
 *   post:
 *     summary: Adiciona um item a uma nota fiscal
 *     tags: [Notas Fiscais]
 */
router.post('/:id/itens', async (req, res) => {
  try {
    const { id } = req.params;
    const itemData = {
      ...req.body,
      nota_fiscal_id: parseInt(id)
    };

    const { error: validationError, value } = notaFiscalItemSchema.validate(itemData);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        error: validationError.details[0].message
      });
    }

    // Calcular preco_total se não fornecido
    if (!value.preco_total) {
      value.preco_total = value.quantidade * value.preco_unitario;
    }

    // Processar impostos dinâmicos
    let impostosDinamicos = [];
    if (value.impostos_dinamicos) {
      // Se vier como string JSON, fazer parse
      if (typeof value.impostos_dinamicos === 'string') {
        try {
          impostosDinamicos = JSON.parse(value.impostos_dinamicos);
        } catch (e) {
          console.error('Erro ao fazer parse de impostos_dinamicos:', e);
          impostosDinamicos = [];
        }
      } else if (Array.isArray(value.impostos_dinamicos)) {
        impostosDinamicos = value.impostos_dinamicos;
      }
      
      // Calcular valores dos impostos dinâmicos
      impostosDinamicos = impostosDinamicos.map(imposto => {
        // Garantir que tipo_calculo tenha um valor padrão
        const tipoCalculo = imposto.tipo_calculo || 'porcentagem';
        let valorCalculado = 0;
        
        if (tipoCalculo === 'valor_fixo') {
          // Se for valor fixo, usar o valor_fixo diretamente
          valorCalculado = parseFloat(imposto.valor_fixo || 0);
        } else {
          // Se for porcentagem, calcular normalmente
          const baseCalculo = imposto.base_calculo > 0 ? imposto.base_calculo : value.preco_total;
          const aliquota = imposto.aliquota || 0;
          valorCalculado = (baseCalculo * aliquota) / 100;
        }
        return {
          ...imposto,
          tipo_calculo: tipoCalculo,
          base_calculo: imposto.base_calculo > 0 ? imposto.base_calculo : value.preco_total,
          valor_calculado: valorCalculado
        };
      });
    }
    value.impostos_dinamicos = impostosDinamicos.length > 0 ? JSON.stringify(impostosDinamicos) : null;

    // Calcular impostos automaticamente se necessário
    // ICMS
    if (value.percentual_icms && !value.valor_icms) {
      const baseICMS = value.base_calculo_icms || value.preco_total;
      value.base_calculo_icms = baseICMS;
      value.valor_icms = (baseICMS * value.percentual_icms) / 100;
    }
    
    // IPI
    if (value.percentual_ipi && !value.valor_ipi) {
      value.valor_ipi = (value.preco_total * value.percentual_ipi) / 100;
    }
    
    // ISSQN
    if (value.aliquota_issqn && !value.valor_issqn) {
      const baseISSQN = value.base_calculo_issqn || value.preco_total;
      value.base_calculo_issqn = baseISSQN;
      value.valor_issqn = (baseISSQN * value.aliquota_issqn) / 100;
    }
    
    // Calcular valor líquido (incluindo impostos dinâmicos)
    const totalImpostosFixos = (parseFloat(value.valor_icms || 0)) +
                               (parseFloat(value.valor_ipi || 0)) +
                               (parseFloat(value.valor_issqn || 0)) +
                               (parseFloat(value.valor_inss || 0)) +
                               (parseFloat(value.valor_cbs || 0));
    
    const totalImpostosDinamicos = impostosDinamicos.reduce((sum, imp) => sum + (imp.valor_calculado || 0), 0);
    
    value.valor_liquido = value.preco_total - totalImpostosFixos - totalImpostosDinamicos;

    const { data, error } = await supabaseAdmin
      .from('notas_fiscais_itens')
      .insert([value])
      .select()
      .single();

    if (error) throw error;

    // Atualizar valor total e valor líquido da nota fiscal
    const { data: itens } = await supabaseAdmin
      .from('notas_fiscais_itens')
      .select('preco_total, valor_liquido')
      .eq('nota_fiscal_id', id);

    const valorTotal = itens?.reduce((sum, item) => sum + parseFloat(item.preco_total || 0), 0) || 0;
    const valorLiquido = itens?.reduce((sum, item) => sum + parseFloat(item.valor_liquido || 0), 0) || 0;

    await supabaseAdmin
      .from('notas_fiscais')
      .update({ 
        valor_total: valorTotal,
        valor_liquido: valorLiquido
      })
      .eq('id', id);

    res.status(201).json({
      success: true,
      data,
      message: 'Item adicionado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao adicionar item à nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notas-fiscais/itens/{itemId}:
 *   put:
 *     summary: Atualiza um item de nota fiscal
 *     tags: [Notas Fiscais]
 */
router.put('/itens/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const updateData = { ...req.body };
    delete updateData.nota_fiscal_id; // Não permitir alterar a nota fiscal

    const { error: validationError, value } = notaFiscalItemSchema.fork(['nota_fiscal_id'], (schema) => schema.optional()).validate(updateData);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        error: validationError.details[0].message
      });
    }

    // Buscar item atual para manter valores não alterados
    const { data: itemAtual } = await supabaseAdmin
      .from('notas_fiscais_itens')
      .select('*')
      .eq('id', itemId)
      .single();

    if (!itemAtual) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }

    // Mesclar dados atuais com novos
    const itemCompleto = { ...itemAtual, ...value };

    // Calcular preco_total se não fornecido
    if (itemCompleto.quantidade && itemCompleto.preco_unitario && !itemCompleto.preco_total) {
      itemCompleto.preco_total = itemCompleto.quantidade * itemCompleto.preco_unitario;
    }

    // Processar impostos dinâmicos
    let impostosDinamicos = [];
    if (itemCompleto.impostos_dinamicos !== undefined) {
      // Se vier como string JSON, fazer parse
      if (typeof itemCompleto.impostos_dinamicos === 'string') {
        try {
          impostosDinamicos = JSON.parse(itemCompleto.impostos_dinamicos);
        } catch (e) {
          console.error('Erro ao fazer parse de impostos_dinamicos:', e);
          // Se não conseguir fazer parse e já existir no banco, manter o valor atual
          if (itemAtual.impostos_dinamicos) {
            try {
              impostosDinamicos = typeof itemAtual.impostos_dinamicos === 'string' 
                ? JSON.parse(itemAtual.impostos_dinamicos) 
                : itemAtual.impostos_dinamicos;
            } catch (e2) {
              impostosDinamicos = [];
            }
          }
        }
      } else if (Array.isArray(itemCompleto.impostos_dinamicos)) {
        impostosDinamicos = itemCompleto.impostos_dinamicos;
      } else if (itemAtual.impostos_dinamicos) {
        // Se não foi fornecido mas existe no banco, manter
        try {
          impostosDinamicos = typeof itemAtual.impostos_dinamicos === 'string' 
            ? JSON.parse(itemAtual.impostos_dinamicos) 
            : itemAtual.impostos_dinamicos;
        } catch (e) {
          impostosDinamicos = [];
        }
      }
      
      // Calcular valores dos impostos dinâmicos
      impostosDinamicos = impostosDinamicos.map(imposto => {
        // Garantir que tipo_calculo tenha um valor padrão
        const tipoCalculo = imposto.tipo_calculo || 'porcentagem';
        let valorCalculado = 0;
        
        if (tipoCalculo === 'valor_fixo') {
          // Se for valor fixo, usar o valor_fixo diretamente
          valorCalculado = parseFloat(imposto.valor_fixo || 0);
        } else {
          // Se for porcentagem, calcular normalmente
          const baseCalculo = imposto.base_calculo > 0 ? imposto.base_calculo : itemCompleto.preco_total;
          const aliquota = imposto.aliquota || 0;
          valorCalculado = (baseCalculo * aliquota) / 100;
        }
        return {
          ...imposto,
          tipo_calculo: tipoCalculo,
          base_calculo: imposto.base_calculo > 0 ? imposto.base_calculo : itemCompleto.preco_total,
          valor_calculado: valorCalculado
        };
      });
      itemCompleto.impostos_dinamicos = impostosDinamicos.length > 0 ? JSON.stringify(impostosDinamicos) : null;
    }

    // Calcular impostos automaticamente se necessário
    // ICMS
    if (itemCompleto.percentual_icms && !itemCompleto.valor_icms) {
      const baseICMS = itemCompleto.base_calculo_icms || itemCompleto.preco_total;
      itemCompleto.base_calculo_icms = baseICMS;
      itemCompleto.valor_icms = (baseICMS * itemCompleto.percentual_icms) / 100;
    }
    
    // IPI
    if (itemCompleto.percentual_ipi && !itemCompleto.valor_ipi) {
      itemCompleto.valor_ipi = (itemCompleto.preco_total * itemCompleto.percentual_ipi) / 100;
    }
    
    // ISSQN
    if (itemCompleto.aliquota_issqn && !itemCompleto.valor_issqn) {
      const baseISSQN = itemCompleto.base_calculo_issqn || itemCompleto.preco_total;
      itemCompleto.base_calculo_issqn = baseISSQN;
      itemCompleto.valor_issqn = (baseISSQN * itemCompleto.aliquota_issqn) / 100;
    }
    
    // Calcular valor líquido (incluindo impostos dinâmicos)
    const totalImpostosFixos = (parseFloat(itemCompleto.valor_icms || 0)) +
                               (parseFloat(itemCompleto.valor_ipi || 0)) +
                               (parseFloat(itemCompleto.valor_issqn || 0)) +
                               (parseFloat(itemCompleto.valor_inss || 0)) +
                               (parseFloat(itemCompleto.valor_cbs || 0));
    
    const totalImpostosDinamicos = impostosDinamicos.reduce((sum, imp) => sum + (imp.valor_calculado || 0), 0);
    
    itemCompleto.valor_liquido = itemCompleto.preco_total - totalImpostosFixos - totalImpostosDinamicos;

    // Remover campos que não devem ser atualizados diretamente
    delete itemCompleto.id;
    delete itemCompleto.created_at;

    const { data, error } = await supabaseAdmin
      .from('notas_fiscais_itens')
      .update(itemCompleto)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    // Buscar nota_fiscal_id para atualizar valor total
    const { data: item } = await supabaseAdmin
      .from('notas_fiscais_itens')
      .select('nota_fiscal_id')
      .eq('id', itemId)
      .single();

    if (item) {
      const { data: itens } = await supabaseAdmin
        .from('notas_fiscais_itens')
        .select('preco_total, valor_liquido')
        .eq('nota_fiscal_id', item.nota_fiscal_id);

      const valorTotal = itens?.reduce((sum, item) => sum + parseFloat(item.preco_total || 0), 0) || 0;
      const valorLiquido = itens?.reduce((sum, item) => sum + parseFloat(item.valor_liquido || 0), 0) || 0;

      await supabaseAdmin
        .from('notas_fiscais')
        .update({ 
          valor_total: valorTotal,
          valor_liquido: valorLiquido
        })
        .eq('id', item.nota_fiscal_id);
    }

    res.json({
      success: true,
      data,
      message: 'Item atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar item da nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notas-fiscais/{id}/boletos:
 *   get:
 *     summary: Lista boletos de uma nota fiscal
 *     tags: [Notas Fiscais]
 */
router.get('/:id/boletos', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('boletos')
      .select(`
        *,
        clientes(id, nome, cnpj),
        obras(id, nome),
        contas_bancarias!boletos_banco_origem_id_fkey(id, banco, agencia, conta, tipo_conta)
      `)
      .eq('nota_fiscal_id', id)
      .order('data_vencimento', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar boletos da nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notas-fiscais/itens/{itemId}:
 *   delete:
 *     summary: Remove um item de nota fiscal
 *     tags: [Notas Fiscais]
 */
router.delete('/itens/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    // Buscar nota_fiscal_id antes de deletar
    const { data: item } = await supabaseAdmin
      .from('notas_fiscais_itens')
      .select('nota_fiscal_id')
      .eq('id', itemId)
      .single();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }

    const { error } = await supabaseAdmin
      .from('notas_fiscais_itens')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    // Atualizar valor total da nota fiscal
    const { data: itens } = await supabaseAdmin
      .from('notas_fiscais_itens')
      .select('valor_total')
      .eq('nota_fiscal_id', item.nota_fiscal_id);

    const valorTotal = itens?.reduce((sum, item) => sum + parseFloat(item.preco_total || 0), 0) || 0;

    await supabaseAdmin
      .from('notas_fiscais')
      .update({ valor_total: valorTotal })
      .eq('id', item.nota_fiscal_id);

    res.json({
      success: true,
      message: 'Item removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover item da nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
