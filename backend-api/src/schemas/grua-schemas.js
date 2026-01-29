import Joi from 'joi'

// ========================================
// SCHEMAS PARA COMPONENTES DE GRUAS
// ========================================

export const componenteSchema = Joi.object({
  grua_id: Joi.string().required().messages({
    'string.empty': 'ID da grua é obrigatório',
    'any.required': 'ID da grua é obrigatório'
  }),
  nome: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 100 caracteres',
    'string.empty': 'Nome é obrigatório',
    'any.required': 'Nome é obrigatório'
  }),
  tipo: Joi.string().valid('Estrutural', 'Hidráulico', 'Elétrico', 'Mecânico', 'Segurança', 'Outro').required().messages({
    'any.only': 'Tipo deve ser: Estrutural, Hidráulico, Elétrico, Mecânico, Segurança ou Outro',
    'any.required': 'Tipo é obrigatório'
  }),
  modelo: Joi.string().max(100).allow(null, '').messages({
    'string.max': 'Modelo deve ter no máximo 100 caracteres'
  }),
  fabricante: Joi.string().max(100).allow(null, '').messages({
    'string.max': 'Fabricante deve ter no máximo 100 caracteres'
  }),
  numero_serie: Joi.string().max(100).allow(null, '').messages({
    'string.max': 'Número de série deve ter no máximo 100 caracteres'
  }),
  capacidade: Joi.string().max(50).allow(null, '').messages({
    'string.max': 'Capacidade deve ter no máximo 50 caracteres'
  }),
  unidade_medida: Joi.string().max(20).default('unidade').messages({
    'string.max': 'Unidade de medida deve ter no máximo 20 caracteres'
  }),
  quantidade_total: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Quantidade total deve ser um número',
    'number.integer': 'Quantidade total deve ser um número inteiro',
    'number.min': 'Quantidade total deve ser pelo menos 1'
  }),
  quantidade_disponivel: Joi.number().integer().min(0).default(1).messages({
    'number.base': 'Quantidade disponível deve ser um número',
    'number.integer': 'Quantidade disponível deve ser um número inteiro',
    'number.min': 'Quantidade disponível não pode ser negativa'
  }),
  quantidade_em_uso: Joi.number().integer().min(0).default(0).messages({
    'number.base': 'Quantidade em uso deve ser um número',
    'number.integer': 'Quantidade em uso deve ser um número inteiro',
    'number.min': 'Quantidade em uso não pode ser negativa'
  }),
  quantidade_danificada: Joi.number().integer().min(0).default(0).messages({
    'number.base': 'Quantidade danificada deve ser um número',
    'number.integer': 'Quantidade danificada deve ser um número inteiro',
    'number.min': 'Quantidade danificada não pode ser negativa'
  }),
  status: Joi.string().valid('Disponível', 'Em uso', 'Danificado', 'Manutenção', 'Descontinuado', 'Devolvido').default('Disponível').messages({
    'any.only': 'Status deve ser: Disponível, Em uso, Danificado, Manutenção, Descontinuado ou Devolvido'
  }),
  localizacao: Joi.string().max(200).allow(null, '').messages({
    'string.max': 'Localização deve ter no máximo 200 caracteres'
  }),
  localizacao_tipo: Joi.string().valid('Obra X', 'Almoxarifado', 'Oficina', 'Em trânsito', 'Em manutenção').default('Almoxarifado').messages({
    'any.only': 'Tipo de localização deve ser: Obra X, Almoxarifado, Oficina, Em trânsito ou Em manutenção'
  }),
  obra_id: Joi.number().integer().allow(null).messages({
    'number.base': 'ID da obra deve ser um número',
    'number.integer': 'ID da obra deve ser um número inteiro'
  }),
  dimensoes_altura: Joi.number().min(0).allow(null).messages({
    'number.base': 'Altura deve ser um número',
    'number.min': 'Altura não pode ser negativa'
  }),
  dimensoes_largura: Joi.number().min(0).allow(null).messages({
    'number.base': 'Largura deve ser um número',
    'number.min': 'Largura não pode ser negativa'
  }),
  dimensoes_comprimento: Joi.number().min(0).allow(null).messages({
    'number.base': 'Comprimento deve ser um número',
    'number.min': 'Comprimento não pode ser negativa'
  }),
  dimensoes_peso: Joi.number().min(0).allow(null).messages({
    'number.base': 'Peso deve ser um número',
    'number.min': 'Peso não pode ser negativa'
  }),
  vida_util_percentual: Joi.number().integer().min(0).max(100).default(100).messages({
    'number.base': 'Vida útil deve ser um número',
    'number.integer': 'Vida útil deve ser um número inteiro',
    'number.min': 'Vida útil não pode ser menor que 0%',
    'number.max': 'Vida útil não pode ser maior que 100%'
  }),
  valor_unitario: Joi.number().min(0).default(0).messages({
    'number.base': 'Valor unitário deve ser um número',
    'number.min': 'Valor unitário não pode ser negativo'
  }),
  data_instalacao: Joi.date().allow(null).messages({
    'date.base': 'Data de instalação deve ser uma data válida'
  }),
  data_ultima_manutencao: Joi.date().allow(null).messages({
    'date.base': 'Data da última manutenção deve ser uma data válida'
  }),
  data_proxima_manutencao: Joi.date().allow(null).messages({
    'date.base': 'Data da próxima manutenção deve ser uma data válida'
  }),
  observacoes: Joi.string().allow(null, '').messages({
    'string.base': 'Observações devem ser um texto'
  }),
  anexos: Joi.object().allow(null).messages({
    'object.base': 'Anexos devem ser um objeto JSON'
  })
})

// Schema para atualização de componente (sem grua_id obrigatório)
export const componenteUpdateSchema = Joi.object({
  nome: Joi.string().min(2).max(100).messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 100 caracteres',
    'string.empty': 'Nome é obrigatório'
  }),
  tipo: Joi.string().valid('Estrutural', 'Hidráulico', 'Elétrico', 'Mecânico', 'Segurança', 'Outro').messages({
    'any.only': 'Tipo deve ser: Estrutural, Hidráulico, Elétrico, Mecânico, Segurança ou Outro'
  }),
  modelo: Joi.string().max(100).allow(null, '').messages({
    'string.max': 'Modelo deve ter no máximo 100 caracteres'
  }),
  fabricante: Joi.string().max(100).allow(null, '').messages({
    'string.max': 'Fabricante deve ter no máximo 100 caracteres'
  }),
  numero_serie: Joi.string().max(100).allow(null, '').messages({
    'string.max': 'Número de série deve ter no máximo 100 caracteres'
  }),
  capacidade: Joi.string().max(50).allow(null, '').messages({
    'string.max': 'Capacidade deve ter no máximo 50 caracteres'
  }),
  unidade_medida: Joi.string().max(20).messages({
    'string.max': 'Unidade de medida deve ter no máximo 20 caracteres'
  }),
  quantidade_total: Joi.number().integer().min(1).messages({
    'number.base': 'Quantidade total deve ser um número',
    'number.integer': 'Quantidade total deve ser um número inteiro',
    'number.min': 'Quantidade total deve ser pelo menos 1'
  }),
  quantidade_disponivel: Joi.number().integer().min(0).messages({
    'number.base': 'Quantidade disponível deve ser um número',
    'number.integer': 'Quantidade disponível deve ser um número inteiro',
    'number.min': 'Quantidade disponível não pode ser negativa'
  }),
  quantidade_em_uso: Joi.number().integer().min(0).messages({
    'number.base': 'Quantidade em uso deve ser um número',
    'number.integer': 'Quantidade em uso deve ser um número inteiro',
    'number.min': 'Quantidade em uso não pode ser negativa'
  }),
  quantidade_danificada: Joi.number().integer().min(0).messages({
    'number.base': 'Quantidade danificada deve ser um número',
    'number.integer': 'Quantidade danificada deve ser um número inteiro',
    'number.min': 'Quantidade danificada não pode ser negativa'
  }),
  status: Joi.string().valid('Disponível', 'Em Uso', 'Manutenção', 'Indisponível').messages({
    'any.only': 'Status deve ser: Disponível, Em Uso, Manutenção ou Indisponível'
  }),
  localizacao: Joi.string().max(100).allow(null, '').messages({
    'string.max': 'Localização deve ter no máximo 100 caracteres'
  }),
  localizacao_tipo: Joi.string().valid('Obra X', 'Almoxarifado', 'Oficina', 'Em trânsito', 'Em manutenção').messages({
    'any.only': 'Tipo de localização deve ser: Obra X, Almoxarifado, Oficina, Em trânsito ou Em manutenção'
  }),
  obra_id: Joi.number().integer().allow(null).messages({
    'number.base': 'ID da obra deve ser um número',
    'number.integer': 'ID da obra deve ser um número inteiro'
  }),
  dimensoes_altura: Joi.number().min(0).allow(null).messages({
    'number.base': 'Altura deve ser um número',
    'number.min': 'Altura não pode ser negativa'
  }),
  dimensoes_largura: Joi.number().min(0).allow(null).messages({
    'number.base': 'Largura deve ser um número',
    'number.min': 'Largura não pode ser negativa'
  }),
  dimensoes_comprimento: Joi.number().min(0).allow(null).messages({
    'number.base': 'Comprimento deve ser um número',
    'number.min': 'Comprimento não pode ser negativa'
  }),
  dimensoes_peso: Joi.number().min(0).allow(null).messages({
    'number.base': 'Peso deve ser um número',
    'number.min': 'Peso não pode ser negativa'
  }),
  vida_util_percentual: Joi.number().integer().min(0).max(100).messages({
    'number.base': 'Vida útil deve ser um número',
    'number.integer': 'Vida útil deve ser um número inteiro',
    'number.min': 'Vida útil não pode ser menor que 0%',
    'number.max': 'Vida útil não pode ser maior que 100%'
  }),
  valor_unitario: Joi.number().precision(2).min(0).messages({
    'number.base': 'Valor unitário deve ser um número',
    'number.min': 'Valor unitário não pode ser negativo'
  }),
  data_instalacao: Joi.date().allow(null, '').messages({
    'date.base': 'Data de instalação deve ser uma data válida'
  }),
  data_ultima_manutencao: Joi.date().allow(null, '').messages({
    'date.base': 'Data da última manutenção deve ser uma data válida'
  }),
  data_proxima_manutencao: Joi.date().allow(null, '').messages({
    'date.base': 'Data da próxima manutenção deve ser uma data válida'
  }),
  observacoes: Joi.string().max(1000).allow(null, '').messages({
    'string.max': 'Observações devem ter no máximo 1000 caracteres'
  }),
  anexos: Joi.object().allow(null).messages({
    'object.base': 'Anexos devem ser um objeto JSON'
  })
})

export const movimentacaoSchema = Joi.object({
  tipo_movimentacao: Joi.string().valid('Instalação', 'Remoção', 'Manutenção', 'Substituição', 'Transferência', 'Ajuste').required().messages({
    'any.only': 'Tipo de movimentação deve ser: Instalação, Remoção, Manutenção, Substituição, Transferência ou Ajuste',
    'any.required': 'Tipo de movimentação é obrigatório'
  }),
  quantidade_movimentada: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantidade movimentada deve ser um número',
    'number.integer': 'Quantidade movimentada deve ser um número inteiro',
    'number.min': 'Quantidade movimentada deve ser pelo menos 1',
    'any.required': 'Quantidade movimentada é obrigatória'
  }),
  motivo: Joi.string().min(5).max(200).required().messages({
    'string.min': 'Motivo deve ter pelo menos 5 caracteres',
    'string.max': 'Motivo deve ter no máximo 200 caracteres',
    'string.empty': 'Motivo é obrigatório',
    'any.required': 'Motivo é obrigatório'
  }),
  obra_id: Joi.number().integer().allow(null).messages({
    'number.base': 'ID da obra deve ser um número',
    'number.integer': 'ID da obra deve ser um número inteiro'
  }),
  grua_origem_id: Joi.string().allow(null, '').messages({
    'string.base': 'ID da grua de origem deve ser uma string'
  }),
  grua_destino_id: Joi.string().allow(null, '').messages({
    'string.base': 'ID da grua de destino deve ser uma string'
  }),
  funcionario_responsavel_id: Joi.number().integer().allow(null).messages({
    'number.base': 'ID do funcionário responsável deve ser um número',
    'number.integer': 'ID do funcionário responsável deve ser um número inteiro'
  }),
  observacoes: Joi.string().allow(null, '').messages({
    'string.base': 'Observações devem ser um texto'
  }),
  anexos: Joi.object().allow(null).messages({
    'object.base': 'Anexos devem ser um objeto JSON'
  })
})

// ========================================
// SCHEMAS PARA CONFIGURAÇÕES DE GRUAS
// ========================================

export const configuracaoSchema = Joi.object({
  grua_id: Joi.string().required().messages({
    'string.empty': 'ID da grua é obrigatório',
    'any.required': 'ID da grua é obrigatório'
  }),
  nome: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 100 caracteres',
    'string.empty': 'Nome é obrigatório',
    'any.required': 'Nome é obrigatório'
  }),
  descricao: Joi.string().allow(null, '').messages({
    'string.base': 'Descrição deve ser um texto'
  }),
  altura_maxima: Joi.number().min(0).allow(null).messages({
    'number.base': 'Altura máxima deve ser um número',
    'number.min': 'Altura máxima não pode ser negativa'
  }),
  alcance_maximo: Joi.number().min(0).allow(null).messages({
    'number.base': 'Alcance máximo deve ser um número',
    'number.min': 'Alcance máximo não pode ser negativo'
  }),
  capacidade_maxima: Joi.number().min(0).allow(null).messages({
    'number.base': 'Capacidade máxima deve ser um número',
    'number.min': 'Capacidade máxima não pode ser negativa'
  }),
  capacidade_ponta: Joi.number().min(0).allow(null).messages({
    'number.base': 'Capacidade na ponta deve ser um número',
    'number.min': 'Capacidade na ponta não pode ser negativa'
  }),
  velocidade_operacao: Joi.number().min(0).allow(null).messages({
    'number.base': 'Velocidade de operação deve ser um número',
    'number.min': 'Velocidade de operação não pode ser negativa'
  }),
  velocidade_rotacao: Joi.number().min(0).allow(null).messages({
    'number.base': 'Velocidade de rotação deve ser um número',
    'number.min': 'Velocidade de rotação não pode ser negativa'
  }),
  potencia_motor: Joi.number().min(0).allow(null).messages({
    'number.base': 'Potência do motor deve ser um número',
    'number.min': 'Potência do motor não pode ser negativa'
  }),
  consumo_energia: Joi.number().min(0).allow(null).messages({
    'number.base': 'Consumo de energia deve ser um número',
    'number.min': 'Consumo de energia não pode ser negativo'
  }),
  peso_total: Joi.number().min(0).allow(null).messages({
    'number.base': 'Peso total deve ser um número',
    'number.min': 'Peso total não pode ser negativo'
  }),
  dimensoes: Joi.string().max(100).allow(null, '').messages({
    'string.max': 'Dimensões devem ter no máximo 100 caracteres'
  }),
  tipo_operacao: Joi.string().valid('Manual', 'Semi-automática', 'Automática').allow(null, '').messages({
    'any.only': 'Tipo de operação deve ser: Manual, Semi-automática ou Automática'
  }),
  nivel_automatizacao: Joi.string().valid('Básico', 'Intermediário', 'Avançado', 'Total').allow(null, '').messages({
    'any.only': 'Nível de automação deve ser: Básico, Intermediário, Avançado ou Total'
  }),
  certificacoes: Joi.array().items(Joi.string()).allow(null).messages({
    'array.base': 'Certificações devem ser um array de strings'
  }),
  normas_tecnicas: Joi.array().items(Joi.string()).allow(null).messages({
    'array.base': 'Normas técnicas devem ser um array de strings'
  }),
  valor_configuracao: Joi.number().min(0).default(0).messages({
    'number.base': 'Valor da configuração deve ser um número',
    'number.min': 'Valor da configuração não pode ser negativo'
  }),
  custo_operacao_mensal: Joi.number().min(0).default(0).messages({
    'number.base': 'Custo de operação mensal deve ser um número',
    'number.min': 'Custo de operação mensal não pode ser negativo'
  }),
  eficiencia_energetica: Joi.string().valid('A', 'B', 'C', 'D', 'E').allow(null, '').messages({
    'any.only': 'Eficiência energética deve ser: A, B, C, D ou E'
  }),
  status: Joi.string().valid('Ativa', 'Inativa', 'Em desenvolvimento').default('Ativa').messages({
    'any.only': 'Status deve ser: Ativa, Inativa ou Em desenvolvimento'
  }),
  observacoes: Joi.string().allow(null, '').messages({
    'string.base': 'Observações devem ser um texto'
  }),
  anexos: Joi.object().allow(null).messages({
    'object.base': 'Anexos devem ser um objeto JSON'
  })
})

export const componenteConfiguracaoSchema = Joi.object({
  configuracao_id: Joi.number().integer().required().messages({
    'number.base': 'ID da configuração deve ser um número',
    'number.integer': 'ID da configuração deve ser um número inteiro',
    'any.required': 'ID da configuração é obrigatório'
  }),
  componente_id: Joi.number().integer().required().messages({
    'number.base': 'ID do componente deve ser um número',
    'number.integer': 'ID do componente deve ser um número inteiro',
    'any.required': 'ID do componente é obrigatório'
  }),
  quantidade_necessaria: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Quantidade necessária deve ser um número',
    'number.integer': 'Quantidade necessária deve ser um número inteiro',
    'number.min': 'Quantidade necessária deve ser pelo menos 1'
  }),
  posicao_instalacao: Joi.string().max(100).allow(null, '').messages({
    'string.max': 'Posição de instalação deve ter no máximo 100 caracteres'
  }),
  ordem_instalacao: Joi.number().integer().min(1).allow(null).messages({
    'number.base': 'Ordem de instalação deve ser um número',
    'number.integer': 'Ordem de instalação deve ser um número inteiro',
    'number.min': 'Ordem de instalação deve ser pelo menos 1'
  }),
  observacoes_instalacao: Joi.string().allow(null, '').messages({
    'string.base': 'Observações de instalação devem ser um texto'
  })
})

// ========================================
// SCHEMAS PARA RELACIONAMENTO GRUA-OBRA
// ========================================

export const gruaObraSchema = Joi.object({
  grua_id: Joi.string().required().messages({
    'string.empty': 'ID da grua é obrigatório',
    'any.required': 'ID da grua é obrigatório'
  }),
  obra_id: Joi.number().integer().required().messages({
    'number.base': 'ID da obra deve ser um número',
    'number.integer': 'ID da obra deve ser um número inteiro',
    'any.required': 'ID da obra é obrigatório'
  }),
  data_inicio_locacao: Joi.date().required().messages({
    'date.base': 'Data de início da locação deve ser uma data válida',
    'any.required': 'Data de início da locação é obrigatória'
  }),
  data_fim_locacao: Joi.date().allow(null).messages({
    'date.base': 'Data de fim da locação deve ser uma data válida'
  }),
  valor_locacao_mensal: Joi.number().min(0).allow(null).messages({
    'number.base': 'Valor de locação mensal deve ser um número',
    'number.min': 'Valor de locação mensal não pode ser negativo'
  }),
  status: Joi.string().valid('Ativa', 'Concluída', 'Suspensa').default('Ativa').messages({
    'any.only': 'Status deve ser: Ativa, Concluída ou Suspensa'
  }),
  observacoes: Joi.string().allow(null, '').messages({
    'string.base': 'Observações devem ser um texto'
  })
})

export const transferenciaSchema = Joi.object({
  grua_id: Joi.string().required().messages({
    'string.empty': 'ID da grua é obrigatório',
    'any.required': 'ID da grua é obrigatório'
  }),
  obra_origem_id: Joi.number().integer().required().messages({
    'number.base': 'ID da obra de origem deve ser um número',
    'number.integer': 'ID da obra de origem deve ser um número inteiro',
    'any.required': 'ID da obra de origem é obrigatório'
  }),
  obra_destino_id: Joi.number().integer().required().messages({
    'number.base': 'ID da obra de destino deve ser um número',
    'number.integer': 'ID da obra de destino deve ser um número inteiro',
    'any.required': 'ID da obra de destino é obrigatório'
  }),
  data_transferencia: Joi.date().default(() => new Date().toISOString().split('T')[0]).messages({
    'date.base': 'Data de transferência deve ser uma data válida'
  }),
  motivo: Joi.string().min(5).max(200).required().messages({
    'string.min': 'Motivo deve ter pelo menos 5 caracteres',
    'string.max': 'Motivo deve ter no máximo 200 caracteres',
    'string.empty': 'Motivo é obrigatório',
    'any.required': 'Motivo é obrigatório'
  }),
  funcionario_responsavel_id: Joi.number().integer().allow(null).messages({
    'number.base': 'ID do funcionário responsável deve ser um número',
    'number.integer': 'ID do funcionário responsável deve ser um número inteiro'
  }),
  observacoes: Joi.string().allow(null, '').messages({
    'string.base': 'Observações devem ser um texto'
  })
})

// ========================================
// SCHEMAS PARA QUERIES E FILTROS
// ========================================

export const queryParamsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Página deve ser um número',
    'number.integer': 'Página deve ser um número inteiro',
    'number.min': 'Página deve ser pelo menos 1'
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limite deve ser um número',
    'number.integer': 'Limite deve ser um número inteiro',
    'number.min': 'Limite deve ser pelo menos 1',
    'number.max': 'Limite deve ser no máximo 100'
  }),
  search: Joi.string().max(100).allow('').messages({
    'string.max': 'Termo de busca deve ter no máximo 100 caracteres'
  }),
  sort: Joi.string().valid('asc', 'desc').default('desc').messages({
    'any.only': 'Ordenação deve ser: asc ou desc'
  }),
  sortBy: Joi.string().max(50).allow('').messages({
    'string.max': 'Campo de ordenação deve ter no máximo 50 caracteres'
  })
})

export const componenteFiltersSchema = queryParamsSchema.keys({
  grua_id: Joi.string().allow('').messages({
    'string.base': 'ID da grua deve ser uma string'
  }),
  tipo: Joi.string().valid('Estrutural', 'Hidráulico', 'Elétrico', 'Mecânico', 'Segurança', 'Outro').allow('').messages({
    'any.only': 'Tipo deve ser: Estrutural, Hidráulico, Elétrico, Mecânico, Segurança ou Outro'
  }),
  status: Joi.string().valid('Disponível', 'Em uso', 'Danificado', 'Manutenção', 'Descontinuado').allow('').messages({
    'any.only': 'Status deve ser: Disponível, Em uso, Danificado, Manutenção ou Descontinuado'
  })
})

export const configuracaoFiltersSchema = queryParamsSchema.keys({
  grua_id: Joi.string().allow('').messages({
    'string.base': 'ID da grua deve ser uma string'
  }),
  status: Joi.string().valid('Ativa', 'Inativa', 'Em desenvolvimento').allow('').messages({
    'any.only': 'Status deve ser: Ativa, Inativa ou Em desenvolvimento'
  }),
  tipo_operacao: Joi.string().valid('Manual', 'Semi-automática', 'Automática').allow('').messages({
    'any.only': 'Tipo de operação deve ser: Manual, Semi-automática ou Automática'
  })
})

export const gruaObraFiltersSchema = queryParamsSchema.keys({
  grua_id: Joi.string().allow('').messages({
    'string.base': 'ID da grua deve ser uma string'
  }),
  obra_id: Joi.number().integer().allow('').messages({
    'number.base': 'ID da obra deve ser um número',
    'number.integer': 'ID da obra deve ser um número inteiro'
  }),
  status: Joi.string().valid('Ativa', 'Concluída', 'Suspensa').allow('').messages({
    'any.only': 'Status deve ser: Ativa, Concluída ou Suspensa'
  })
})

// ========================================
// SCHEMAS PARA VALIDAÇÃO DE IDS
// ========================================

export const idSchema = Joi.object({
  id: Joi.alternatives().try(
    Joi.number().integer().min(1),
    Joi.string().min(1)
  ).required().messages({
    'alternatives.match': 'ID deve ser um número inteiro ou string válida',
    'any.required': 'ID é obrigatório'
  })
})

export const gruaIdSchema = Joi.object({
  grua_id: Joi.string().required().messages({
    'string.empty': 'ID da grua é obrigatório',
    'any.required': 'ID da grua é obrigatório'
  })
})

export const obraIdSchema = Joi.object({
  obra_id: Joi.number().integer().min(1).required().messages({
    'number.base': 'ID da obra deve ser um número',
    'number.integer': 'ID da obra deve ser um número inteiro',
    'number.min': 'ID da obra deve ser pelo menos 1',
    'any.required': 'ID da obra é obrigatório'
  })
})

// ========================================
// SCHEMAS PARA VALIDAÇÃO DE DATAS
// ========================================

export const dateRangeSchema = Joi.object({
  data_inicio: Joi.date().required().messages({
    'date.base': 'Data de início deve ser uma data válida',
    'any.required': 'Data de início é obrigatória'
  }),
  data_fim: Joi.date().min(Joi.ref('data_inicio')).required().messages({
    'date.base': 'Data de fim deve ser uma data válida',
    'date.min': 'Data de fim deve ser posterior à data de início',
    'any.required': 'Data de fim é obrigatória'
  })
})

// ========================================
// SCHEMAS PARA VALIDAÇÃO DE VALORES
// ========================================

export const valorSchema = Joi.object({
  valor: Joi.number().min(0).required().messages({
    'number.base': 'Valor deve ser um número',
    'number.min': 'Valor não pode ser negativo',
    'any.required': 'Valor é obrigatório'
  }),
  moeda: Joi.string().valid('BRL', 'USD', 'EUR').default('BRL').messages({
    'any.only': 'Moeda deve ser: BRL, USD ou EUR'
  })
})

// ========================================
// SCHEMAS PARA VALIDAÇÃO DE ARQUIVOS
// ========================================

export const anexoSchema = Joi.object({
  nome: Joi.string().min(1).max(255).required().messages({
    'string.min': 'Nome do arquivo é obrigatório',
    'string.max': 'Nome do arquivo deve ter no máximo 255 caracteres',
    'any.required': 'Nome do arquivo é obrigatório'
  }),
  tipo: Joi.string().valid('imagem', 'documento', 'manual', 'certificado', 'outro').required().messages({
    'any.only': 'Tipo deve ser: imagem, documento, manual, certificado ou outro',
    'any.required': 'Tipo do arquivo é obrigatório'
  }),
  tamanho: Joi.number().integer().min(1).max(10485760).required().messages({ // 10MB
    'number.base': 'Tamanho do arquivo deve ser um número',
    'number.integer': 'Tamanho do arquivo deve ser um número inteiro',
    'number.min': 'Tamanho do arquivo deve ser pelo menos 1 byte',
    'number.max': 'Tamanho do arquivo deve ser no máximo 10MB',
    'any.required': 'Tamanho do arquivo é obrigatório'
  }),
  url: Joi.string().uri().required().messages({
    'string.uri': 'URL do arquivo deve ser uma URL válida',
    'any.required': 'URL do arquivo é obrigatória'
  })
})

export const anexosArraySchema = Joi.array().items(anexoSchema).max(10).messages({
  'array.max': 'Máximo de 10 anexos permitidos'
})

// ========================================
// SCHEMAS PARA VALIDAÇÃO DE PERMISSÕES
// ========================================

export const permissionSchema = Joi.object({
  action: Joi.string().valid('create', 'read', 'update', 'delete', 'manage').required().messages({
    'any.only': 'Ação deve ser: create, read, update, delete ou manage',
    'any.required': 'Ação é obrigatória'
  }),
  resource: Joi.string().valid('gruas', 'componentes', 'configuracoes', 'obras', 'relacionamentos').required().messages({
    'any.only': 'Recurso deve ser: gruas, componentes, configuracoes, obras ou relacionamentos',
    'any.required': 'Recurso é obrigatório'
  })
})

// ========================================
// SCHEMAS PARA VALIDAÇÃO DE RELATÓRIOS
// ========================================

export const relatorioSchema = Joi.object({
  tipo: Joi.string().valid('componentes', 'configuracoes', 'utilizacao', 'custos', 'manutencao').required().messages({
    'any.only': 'Tipo deve ser: componentes, configuracoes, utilizacao, custos ou manutencao',
    'any.required': 'Tipo do relatório é obrigatório'
  }),
  formato: Joi.string().valid('pdf', 'excel', 'csv', 'json').default('pdf').messages({
    'any.only': 'Formato deve ser: pdf, excel, csv ou json'
  }),
  periodo: dateRangeSchema.required(),
  filtros: Joi.object().allow(null)
})

export default {
  // Componentes
  componenteSchema,
  movimentacaoSchema,
  
  // Configurações
  configuracaoSchema,
  componenteConfiguracaoSchema,
  
  // Relacionamentos
  gruaObraSchema,
  transferenciaSchema,
  
  // Queries e filtros
  queryParamsSchema,
  componenteFiltersSchema,
  configuracaoFiltersSchema,
  gruaObraFiltersSchema,
  
  // Validação de IDs
  idSchema,
  gruaIdSchema,
  obraIdSchema,
  
  // Validação de datas
  dateRangeSchema,
  
  // Validação de valores
  valorSchema,
  
  // Validação de arquivos
  anexoSchema,
  anexosArraySchema,
  
  // Validação de permissões
  permissionSchema,
  
  // Validação de relatórios
  relatorioSchema
}
