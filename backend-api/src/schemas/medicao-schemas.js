import Joi from 'joi';

const medicaoSchema = Joi.object({
  numero: Joi.string().min(1).max(50).required(),
  locacao_id: Joi.number().integer().positive().required(),
  periodo: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
  data_medicao: Joi.date().iso().required(),
  valor_base: Joi.number().min(0).precision(2).required(),
  valor_aditivos: Joi.number().min(0).precision(2).default(0),
  valor_total: Joi.number().min(0).precision(2).required(),
  status: Joi.string().valid('pendente', 'finalizada', 'cancelada').default('pendente'),
  observacoes: Joi.string().max(1000).allow('').optional()
});

const medicaoUpdateSchema = medicaoSchema.fork(['numero', 'locacao_id'], (schema) => schema.optional());

const medicaoFiltersSchema = Joi.object({
  locacao_id: Joi.number().integer().positive().optional(),
  periodo: Joi.string().pattern(/^\d{4}-\d{2}$/).optional(),
  status: Joi.string().valid('pendente', 'finalizada', 'cancelada').optional(),
  data_inicio: Joi.date().iso().optional(),
  data_fim: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

export { medicaoSchema, medicaoUpdateSchema, medicaoFiltersSchema };
