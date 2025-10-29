import Joi from 'joi';

// Schema de validação para criação de receita
const receitaSchema = Joi.object({
  obra_id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'ID da obra deve ser um número',
      'number.integer': 'ID da obra deve ser um número inteiro',
      'number.positive': 'ID da obra deve ser um número positivo',
      'any.required': 'ID da obra é obrigatório'
    }),
  
  tipo: Joi.string().valid('locacao', 'servico', 'venda').required()
    .messages({
      'string.base': 'Tipo deve ser uma string',
      'any.only': 'Tipo deve ser: locacao, servico ou venda',
      'any.required': 'Tipo é obrigatório'
    }),
  
  descricao: Joi.string().min(1).max(500).required()
    .messages({
      'string.base': 'Descrição deve ser uma string',
      'string.min': 'Descrição deve ter pelo menos 1 caractere',
      'string.max': 'Descrição deve ter no máximo 500 caracteres',
      'any.required': 'Descrição é obrigatória'
    }),
  
  valor: Joi.number().min(0).precision(2).required()
    .messages({
      'number.base': 'Valor deve ser um número',
      'number.min': 'Valor deve ser maior ou igual a zero',
      'any.required': 'Valor é obrigatório'
    }),
  
  data_receita: Joi.date().iso().required()
    .messages({
      'date.base': 'Data da receita deve ser uma data válida',
      'date.format': 'Data da receita deve estar no formato ISO (YYYY-MM-DD)',
      'any.required': 'Data da receita é obrigatória'
    }),
  
  funcionario_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'ID do funcionário deve ser um número',
      'number.integer': 'ID do funcionário deve ser um número inteiro',
      'number.positive': 'ID do funcionário deve ser um número positivo'
    }),
  
  grua_id: Joi.string().optional()
    .messages({
      'string.base': 'ID da grua deve ser uma string'
    }),
  
  status: Joi.string().valid('pendente', 'confirmada', 'cancelada').default('pendente')
    .messages({
      'string.base': 'Status deve ser uma string',
      'any.only': 'Status deve ser: pendente, confirmada ou cancelada'
    }),
  
  observacoes: Joi.string().max(1000).allow('').optional()
    .messages({
      'string.base': 'Observações devem ser uma string',
      'string.max': 'Observações devem ter no máximo 1000 caracteres'
    })
});

// Schema de validação para atualização de receita
const receitaUpdateSchema = receitaSchema.fork(['obra_id', 'tipo'], (schema) => schema.optional());

// Schema de validação para filtros de busca
const receitaFiltersSchema = Joi.object({
  obra_id: Joi.number().integer().positive().optional(),
  tipo: Joi.string().valid('locacao', 'servico', 'venda').optional(),
  status: Joi.string().valid('pendente', 'confirmada', 'cancelada').optional(),
  data_inicio: Joi.date().iso().optional(),
  data_fim: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50)
});

// Schema de validação para resumo
const receitaResumoSchema = Joi.object({
  obra_id: Joi.number().integer().positive().optional(),
  data_inicio: Joi.date().iso().optional(),
  data_fim: Joi.date().iso().optional()
});

// Schema de validação para exportação
const receitaExportSchema = Joi.object({
  format: Joi.string().valid('csv', 'xlsx').default('csv'),
  obra_id: Joi.number().integer().positive().optional(),
  tipo: Joi.string().valid('locacao', 'servico', 'venda').optional(),
  status: Joi.string().valid('pendente', 'confirmada', 'cancelada').optional(),
  data_inicio: Joi.date().iso().optional(),
  data_fim: Joi.date().iso().optional()
});

export {
  receitaSchema,
  receitaUpdateSchema,
  receitaFiltersSchema,
  receitaResumoSchema,
  receitaExportSchema
};
