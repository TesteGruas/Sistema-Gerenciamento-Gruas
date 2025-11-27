import Joi from 'joi';

// Schema para criação de medição mensal
const medicaoMensalSchema = Joi.object({
  // orcamento_id agora é opcional
  orcamento_id: Joi.number().integer().positive().allow(null).optional().messages({
    'number.base': 'ID do orçamento deve ser um número',
    'number.integer': 'ID do orçamento deve ser um número inteiro',
    'number.positive': 'ID do orçamento deve ser positivo'
  }),
  
  // obra_id é novo campo opcional
  obra_id: Joi.number().integer().positive().allow(null).optional().messages({
    'number.base': 'ID da obra deve ser um número',
    'number.integer': 'ID da obra deve ser um número inteiro',
    'number.positive': 'ID da obra deve ser positivo'
  }),
  numero: Joi.string().min(1).max(50).required().messages({
    'string.min': 'Número da medição deve ter pelo menos 1 caractere',
    'string.max': 'Número da medição deve ter no máximo 50 caracteres',
    'any.required': 'Número da medição é obrigatório'
  }),
  periodo: Joi.string().pattern(/^\d{4}-\d{2}$/).required().messages({
    'string.pattern.base': 'Período deve estar no formato YYYY-MM (ex: 2025-02)',
    'any.required': 'Período é obrigatório'
  }),
  data_medicao: Joi.date().iso().required().messages({
    'date.base': 'Data da medição deve ser uma data válida',
    'any.required': 'Data da medição é obrigatória'
  }),
  mes_referencia: Joi.number().integer().min(1).max(12).required().messages({
    'number.base': 'Mês de referência deve ser um número',
    'number.integer': 'Mês de referência deve ser um número inteiro',
    'number.min': 'Mês de referência deve ser entre 1 e 12',
    'number.max': 'Mês de referência deve ser entre 1 e 12',
    'any.required': 'Mês de referência é obrigatório'
  }),
  ano_referencia: Joi.number().integer().min(2000).max(2100).required().messages({
    'number.base': 'Ano de referência deve ser um número',
    'number.integer': 'Ano de referência deve ser um número inteiro',
    'number.min': 'Ano de referência deve ser maior ou igual a 2000',
    'number.max': 'Ano de referência deve ser menor ou igual a 2100',
    'any.required': 'Ano de referência é obrigatório'
  }),
  valor_mensal_bruto: Joi.number().min(0).precision(2).default(0).messages({
    'number.base': 'Valor mensal bruto deve ser um número',
    'number.min': 'Valor mensal bruto não pode ser negativo'
  }),
  valor_aditivos: Joi.number().min(0).precision(2).default(0).messages({
    'number.base': 'Valor de aditivos deve ser um número',
    'number.min': 'Valor de aditivos não pode ser negativo'
  }),
  valor_custos_extras: Joi.number().min(0).precision(2).default(0).messages({
    'number.base': 'Valor de custos extras deve ser um número',
    'number.min': 'Valor de custos extras não pode ser negativo'
  }),
  valor_descontos: Joi.number().min(0).precision(2).default(0).messages({
    'number.base': 'Valor de descontos deve ser um número',
    'number.min': 'Valor de descontos não pode ser negativo'
  }),
  status: Joi.string().valid('pendente', 'finalizada', 'cancelada', 'enviada').default('pendente').messages({
    'any.only': 'Status deve ser: pendente, finalizada, cancelada ou enviada'
  }),
  observacoes: Joi.string().max(2000).allow('').optional().messages({
    'string.max': 'Observações devem ter no máximo 2000 caracteres'
  }),
  
  // Arrays de itens (opcionais na criação, podem ser adicionados depois)
  custos_mensais: Joi.array().items(
    Joi.object({
      tipo: Joi.string().required(),
      descricao: Joi.string().required(),
      valor_mensal: Joi.number().min(0).precision(2).required(),
      quantidade_meses: Joi.number().min(0).precision(2).default(1),
      valor_total: Joi.number().min(0).precision(2).required(),
      observacoes: Joi.string().allow('').optional()
    })
  ).optional(),
  
  horas_extras: Joi.array().items(
    Joi.object({
      tipo: Joi.string().valid('operador', 'sinaleiro', 'equipamento').required(),
      dia_semana: Joi.string().valid('sabado', 'domingo_feriado', 'normal').required(),
      quantidade_horas: Joi.number().min(0).precision(2).required(),
      valor_hora: Joi.number().min(0).precision(2).required(),
      valor_total: Joi.number().min(0).precision(2).required(),
      observacoes: Joi.string().allow('').optional()
    })
  ).optional(),
  
  servicos_adicionais: Joi.array().items(
    Joi.object({
      tipo: Joi.string().required(),
      descricao: Joi.string().required(),
      quantidade: Joi.number().min(0).precision(2).default(1),
      valor_unitario: Joi.number().min(0).precision(2).required(),
      valor_total: Joi.number().min(0).precision(2).required(),
      observacoes: Joi.string().allow('').optional()
    })
  ).optional(),
  
  aditivos: Joi.array().items(
    Joi.object({
      tipo: Joi.string().valid('adicional', 'desconto').required(),
      descricao: Joi.string().required(),
      valor: Joi.number().precision(2).required(),
      observacoes: Joi.string().allow('').optional()
    })
  ).optional()
}).custom((value, helpers) => {
  // Validação customizada: pelo menos obra_id ou orcamento_id deve ser fornecido
  if (!value.obra_id && !value.orcamento_id) {
    return helpers.error('any.custom', {
      message: 'É necessário fornecer obra_id ou orcamento_id'
    });
  }
  return value;
});

// Schema para atualização de medição mensal
const medicaoMensalUpdateSchema = medicaoMensalSchema.fork(
  ['orcamento_id', 'numero', 'periodo', 'mes_referencia', 'ano_referencia'],
  (schema) => schema.optional()
);

// Schema para filtros de medições mensais
const medicaoMensalFiltersSchema = Joi.object({
  orcamento_id: Joi.number().integer().positive().allow(null).optional(),
  obra_id: Joi.number().integer().positive().allow(null).optional(), // NOVO
  periodo: Joi.string().pattern(/^\d{4}-\d{2}$/).optional(),
  status: Joi.string().valid('pendente', 'finalizada', 'cancelada', 'enviada').optional(),
  data_inicio: Joi.date().iso().optional(),
  data_fim: Joi.date().iso().optional(),
  mes_referencia: Joi.number().integer().min(1).max(12).optional(),
  ano_referencia: Joi.number().integer().min(2000).max(2100).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

// Schema para gerar medição automaticamente a partir do orçamento
const gerarMedicaoAutomaticaSchema = Joi.object({
  orcamento_id: Joi.number().integer().positive().required(),
  periodo: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
  data_medicao: Joi.date().iso().default(() => new Date().toISOString().split('T')[0]),
  incluir_horas_extras: Joi.boolean().default(true),
  incluir_servicos_adicionais: Joi.boolean().default(true),
  aplicar_valores_orcamento: Joi.boolean().default(true)
});

export { 
  medicaoMensalSchema, 
  medicaoMensalUpdateSchema, 
  medicaoMensalFiltersSchema,
  gerarMedicaoAutomaticaSchema
};

