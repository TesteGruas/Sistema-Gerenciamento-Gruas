import express from 'express';
import Joi from 'joi';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Schema de validação
const fornecedorSchema = Joi.object({
  nome: Joi.string().min(1).max(255).required(),
  cnpj: Joi.string().pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/).required(),
  contato: Joi.string().max(255).optional(),
  telefone: Joi.string().max(20).optional(),
  email: Joi.string().email().optional(),
  endereco: Joi.string().max(500).optional(),
  cidade: Joi.string().max(100).optional(),
  estado: Joi.string().length(2).optional(),
  cep: Joi.string().pattern(/^\d{5}-\d{3}$/).optional(),
  categoria: Joi.string().max(100).optional(),
  status: Joi.string()
    .valid('ativo', 'inativo', 'Ativo', 'Inativo', 'ATIVO', 'INATIVO')
    .custom((value, helpers) => {
      // Normalizar para minúsculas
      if (value) {
        return value.toLowerCase().trim();
      }
      return 'ativo';
    })
    .default('ativo'),
  observacoes: Joi.string().max(1000).optional()
});

const fornecedorUpdateSchema = fornecedorSchema.fork(
  ['nome', 'cnpj'],
  (schema) => schema.optional()
);

/**
 * @swagger
 * /api/fornecedores:
 *   get:
 *     summary: Listar fornecedores
 *     tags: [Fornecedores]
 */
router.get('/', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { status, categoria, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('fornecedores')
      .select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (categoria) query = query.eq('categoria', categoria);
    if (search) {
      query = query.or(`nome.ilike.%${search}%,cnpj.ilike.%${search}%,contato.ilike.%${search}%`);
    }

    query = query
      .range(offset, offset + limit - 1)
      .order('nome', { ascending: true });

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/fornecedores/{id}:
 *   get:
 *     summary: Buscar fornecedor por ID
 *     tags: [Fornecedores]
 */
router.get('/:id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('fornecedores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Fornecedor não encontrado'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/fornecedores:
 *   post:
 *     summary: Criar fornecedor
 *     tags: [Fornecedores]
 */
router.post('/', authenticateToken, requirePermission('obras:criar'), async (req, res) => {
  try {
    const { error: validationError, value } = fornecedorSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    // Verificar se CNPJ já existe
    const { data: existingFornecedor } = await supabaseAdmin
      .from('fornecedores')
      .select('id')
      .eq('cnpj', value.cnpj)
      .single();

    if (existingFornecedor) {
      return res.status(400).json({
        error: 'CNPJ já cadastrado',
        message: 'Já existe um fornecedor com este CNPJ'
      });
    }

    // Normalizar status para garantir que seja válido
    let dataToInsert = { ...value };
    
    // Sempre normalizar o status, mesmo se vier do Joi
    if (dataToInsert.status !== undefined && dataToInsert.status !== null) {
      // Converter para string, minúsculas e remover espaços
      dataToInsert.status = String(dataToInsert.status).toLowerCase().trim();
    }
    
    // Se status não for válido ou estiver vazio, usar 'ativo' como padrão
    if (!dataToInsert.status || dataToInsert.status === '' || 
        (dataToInsert.status !== 'ativo' && dataToInsert.status !== 'inativo')) {
      dataToInsert.status = 'ativo';
    }
    
    // Garantir que o status seja exatamente 'ativo' ou 'inativo' (sem espaços extras)
    dataToInsert.status = dataToInsert.status === 'inativo' ? 'inativo' : 'ativo';
    
    // Debug: verificar o status antes de inserir
    console.log('Status normalizado antes de inserir:', JSON.stringify(dataToInsert.status));
    let maxRetries = 3;
    let retryCount = 0;
    let data = null;
    let insertError = null;
    let triedStatusFallback = false;
    
    // Tentar inserir, removendo colunas faltantes automaticamente
    while (retryCount < maxRetries) {
      const { data: resultData, error: resultError } = await supabaseAdmin
        .from('fornecedores')
        .insert(dataToInsert)
        .select()
        .single();

      // Se não houver erro, sucesso!
      if (!resultError) {
        data = resultData;
        break;
      }

      // Se o erro for sobre coluna que não existe, remover e tentar novamente
      if (resultError.message && resultError.message.includes("Could not find the")) {
        const columnMatch = resultError.message.match(/'(\w+)' column/);
        if (columnMatch && columnMatch[1]) {
          const missingColumn = columnMatch[1];
          console.warn(`⚠️  Coluna "${missingColumn}" não encontrada na tabela. Removendo do insert...`);
          
          // Remover a coluna faltante
          const { [missingColumn]: removed, ...rest } = dataToInsert;
          dataToInsert = rest;
          retryCount++;
          
          if (retryCount === 1) {
            console.warn('💡 Execute a migration: database/migrations/20250303_add_categoria_fornecedores.sql');
          }
          continue;
        }
      }
      
      // Se não for erro de coluna faltante, verificar outros erros conhecidos
      if (resultError.message && resultError.message.includes('violates check constraint')) {
        if (resultError.message.includes('fornecedores_status_check')) {
          // Fallback: em alguns bancos a constraint pode estar com valores 'Ativo'/'Inativo'
          if (!triedStatusFallback && (dataToInsert.status === 'ativo' || dataToInsert.status === 'inativo')) {
            triedStatusFallback = true;
            dataToInsert.status = dataToInsert.status === 'inativo' ? 'Inativo' : 'Ativo';
            retryCount++;
            console.warn('⚠️ Constraint de status falhou com minúsculas. Tentando fallback com maiúsculas:', dataToInsert.status);
            continue;
          }
          
          console.error('Erro de constraint de status no POST (após fallback se aplicado):', {
            statusEnviado: dataToInsert.status,
            tipoStatus: typeof dataToInsert.status,
            statusJSON: JSON.stringify(dataToInsert.status),
            statusLength: dataToInsert.status?.length
          });
          return res.status(400).json({
            error: 'Status inválido',
            message: `O status deve ser "ativo" ou "inativo". Valor recebido: "${dataToInsert.status}"`
          });
        }
      }
      
      // Se não for erro de coluna faltante, lançar o erro
      insertError = resultError;
      break;
    }

    if (insertError) throw insertError;

    res.status(201).json({
      success: true,
      data,
      message: 'Fornecedor criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/fornecedores/{id}:
 *   put:
 *     summary: Atualizar fornecedor
 *     tags: [Fornecedores]
 */
router.put('/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = fornecedorUpdateSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    // Se atualizando CNPJ, verificar duplicidade
    if (value.cnpj) {
      const { data: existingFornecedor } = await supabaseAdmin
        .from('fornecedores')
        .select('id')
        .eq('cnpj', value.cnpj)
        .neq('id', id)
        .single();

      if (existingFornecedor) {
        return res.status(400).json({
          error: 'CNPJ já cadastrado',
          message: 'Já existe outro fornecedor com este CNPJ'
        });
      }
    }

    // Normalizar status se estiver sendo atualizado
    let updateData = {
      ...value,
      updated_at: new Date().toISOString()
    };
    
    // Se status estiver sendo atualizado, normalizar para garantir que seja válido
    if (updateData.status !== undefined && updateData.status !== null) {
      // Converter para minúsculas e remover espaços
      updateData.status = String(updateData.status).toLowerCase().trim();
      if (updateData.status !== 'ativo' && updateData.status !== 'inativo') {
        return res.status(400).json({
          error: 'Status inválido',
          message: 'Status deve ser "ativo" ou "inativo"'
        });
      }
    }
    
    let maxRetries = 3;
    let retryCount = 0;
    let data = null;
    let updateError = null;
    let triedStatusFallback = false;

    // Tentar atualizar, removendo colunas faltantes automaticamente
    while (retryCount < maxRetries) {
      const { data: resultData, error: resultError } = await supabaseAdmin
        .from('fornecedores')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      // Se não houver erro, sucesso!
      if (!resultError) {
        data = resultData;
        break;
      }

      // Se o erro for sobre coluna que não existe, remover e tentar novamente
      if (resultError.message && resultError.message.includes("Could not find the")) {
        const columnMatch = resultError.message.match(/'(\w+)' column/);
        if (columnMatch && columnMatch[1]) {
          const missingColumn = columnMatch[1];
          console.warn(`⚠️  Coluna "${missingColumn}" não encontrada na tabela. Removendo do update...`);
          
          // Remover a coluna faltante
          const { [missingColumn]: removed, ...rest } = updateData;
          updateData = rest;
          retryCount++;
          
          if (retryCount === 1) {
            console.warn('💡 Execute a migration: database/migrations/20250303_add_categoria_fornecedores.sql');
          }
          continue;
        }
      }
      
      // Se não for erro de coluna faltante, verificar outros erros conhecidos
      if (resultError.message && resultError.message.includes('violates check constraint')) {
        if (resultError.message.includes('fornecedores_status_check')) {
          // Fallback: tentar com 'Ativo'/'Inativo' se estiver usando minúsculas
          if (!triedStatusFallback && typeof updateData.status === 'string' && (updateData.status === 'ativo' || updateData.status === 'inativo')) {
            triedStatusFallback = true;
            updateData.status = updateData.status === 'inativo' ? 'Inativo' : 'Ativo';
            retryCount++;
            console.warn('⚠️ Constraint de status falhou no UPDATE com minúsculas. Tentando fallback com maiúsculas:', updateData.status);
            continue;
          }
          return res.status(400).json({
            error: 'Status inválido',
            message: 'O status deve ser "ativo" ou "inativo"'
          });
        }
      }
      
      // Se não for erro de coluna faltante, tratar normalmente
      updateError = resultError;
      break;
    }

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Fornecedor não encontrado'
        });
      }
      throw updateError;
    }

    res.json({
      success: true,
      data,
      message: 'Fornecedor atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/fornecedores/{id}:
 *   delete:
 *     summary: Excluir fornecedor
 *     tags: [Fornecedores]
 */
router.delete('/:id', authenticateToken, requirePermission('obras:excluir'), async (req, res) => {
  try {
    const { id } = req.params;

    const { error: deleteError } = await supabaseAdmin
      .from('fornecedores')
      .delete()
      .eq('id', id);

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Fornecedor não encontrado'
        });
      }
      throw deleteError;
    }

    res.json({
      success: true,
      message: 'Fornecedor excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/fornecedores/stats:
 *   get:
 *     summary: Estatísticas de fornecedores
 *     tags: [Fornecedores]
 */
router.get('/stats', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('fornecedores')
      .select('status, categoria');

    if (error) throw error;

    const stats = {
      total: data.length,
      ativos: data.filter(f => f.status === 'ativo').length,
      inativos: data.filter(f => f.status === 'inativo').length,
      porCategoria: data.reduce((acc, f) => {
        acc[f.categoria || 'Sem categoria'] = (acc[f.categoria || 'Sem categoria'] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

export default router;

