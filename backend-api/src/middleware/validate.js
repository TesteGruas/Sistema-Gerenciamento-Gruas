/**
 * Middleware de validação genérico usando Joi
 * Facilita a validação de requisições em todas as rotas
 */

import Joi from 'joi'

/**
 * Middleware para validar body da requisição
 * @param {Joi.ObjectSchema} schema - Schema Joi para validação
 * @param {Object} options - Opções de validação
 * @returns {Function} Middleware Express
 */
export const validateBody = (schema, options = {}) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      ...options
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))

      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
        details: errors
      })
    }

    // Substituir req.body pelos valores validados e sanitizados
    req.body = value
    next()
  }
}

/**
 * Middleware para validar query parameters
 * @param {Joi.ObjectSchema} schema - Schema Joi para validação
 * @param {Object} options - Opções de validação
 * @returns {Function} Middleware Express
 */
export const validateQuery = (schema, options = {}) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      ...options
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))

      return res.status(400).json({
        success: false,
        error: 'Erro de validação de parâmetros',
        details: errors
      })
    }

    req.query = value
    next()
  }
}

/**
 * Middleware para validar parâmetros da URL
 * @param {Joi.ObjectSchema} schema - Schema Joi para validação
 * @param {Object} options - Opções de validação
 * @returns {Function} Middleware Express
 */
export const validateParams = (schema, options = {}) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      ...options
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))

      return res.status(400).json({
        success: false,
        error: 'Erro de validação de parâmetros da URL',
        details: errors
      })
    }

    req.params = value
    next()
  }
}

/**
 * Schemas comuns de validação para reutilização
 */
export const commonSchemas = {
  // Validação de ID (UUID ou integer)
  id: Joi.alternatives().try(
    Joi.string().uuid(),
    Joi.number().integer().positive()
  ),

  // Validação de paginação
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).optional()
  }),

  // Validação de datas
  dateRange: Joi.object({
    data_inicio: Joi.date().optional(),
    data_fim: Joi.date().min(Joi.ref('data_inicio')).optional()
  }),

  // Validação de CPF
  cpf: Joi.string().pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/),

  // Validação de CNPJ
  cnpj: Joi.string().pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/),

  // Validação de CEP
  cep: Joi.string().pattern(/^\d{5}-?\d{3}$/),

  // Validação de email
  email: Joi.string().email(),

  // Validação de telefone brasileiro
  telefone: Joi.string().pattern(/^[\d\s\(\)\-\+]+$/),

  // Validação de estado brasileiro (UF)
  estado: Joi.string().length(2).uppercase()
}

