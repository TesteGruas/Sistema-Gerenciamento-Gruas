import { supabase } from '../config/supabase.js';

/**
 * Cria uma movimentação de estoque
 * @param {Object} params - Parâmetros da movimentação
 * @param {string} params.produto_id - ID do produto
 * @param {string} params.tipo - Tipo da movimentação (Entrada, Saída, Ajuste, Transferência)
 * @param {number} params.quantidade - Quantidade movimentada
 * @param {number} params.valor_unitario - Valor unitário do produto
 * @param {number} params.responsavel_id - ID do responsável pela movimentação
 * @param {string} params.motivo - Motivo da movimentação
 * @param {string} params.observacoes - Observações adicionais
 * @param {number} params.venda_id - ID da venda (opcional, para saídas)
 * @param {number} params.compra_id - ID da compra (opcional, para entradas)
 * @param {number} params.obra_id - ID da obra (opcional)
 * @param {string} params.grua_id - ID da grua (opcional)
 * @param {number} params.fornecedor_id - ID do fornecedor (opcional)
 * @param {string} params.numero_documento - Número do documento (opcional)
 * @returns {Promise<Object>} Resultado da operação
 */
export async function criarMovimentacaoEstoque(params) {
  try {
    const {
      produto_id,
      tipo,
      quantidade,
      valor_unitario,
      responsavel_id,
      motivo,
      observacoes = null,
      venda_id = null,
      compra_id = null,
      obra_id = null,
      grua_id = null,
      fornecedor_id = null,
      numero_documento = null
    } = params;

    // Validar parâmetros obrigatórios
    if (!produto_id || !tipo || !quantidade || !responsavel_id || !motivo) {
      throw new Error('Parâmetros obrigatórios não fornecidos');
    }

    // Calcular valor total
    const valor_total = quantidade * valor_unitario;

    // Gerar ID único para a movimentação
    const prefixo = tipo === 'Entrada' ? 'ME' : tipo === 'Saída' ? 'MS' : 'MA';
    const timestamp = Date.now().toString().slice(-6);
    const id = `${prefixo}${timestamp}`;

    // Dados da movimentação
    const movimentacaoData = {
      id,
      produto_id: produto_id.toString(),
      tipo,
      quantidade: quantidade.toString(),
      valor_unitario: valor_unitario.toString(),
      valor_total: valor_total.toString(),
      data_movimentacao: new Date().toISOString(),
      responsavel_id,
      obra_id,
      grua_id,
      fornecedor_id,
      numero_documento,
      observacoes,
      status: 'Confirmada',
      motivo,
      venda_id,
      compra_id,
      created_at: new Date().toISOString()
    };

    console.log('📝 Criando movimentação de estoque:', movimentacaoData);

    // Inserir movimentação
    const { data: movimentacao, error: movimentacaoError } = await supabase
      .from('movimentacoes_estoque')
      .insert(movimentacaoData)
      .select()
      .single();

    if (movimentacaoError) {
      console.error('❌ Erro ao criar movimentação:', movimentacaoError);
      throw new Error(`Erro ao criar movimentação: ${movimentacaoError.message}`);
    }

    console.log('✅ Movimentação criada com sucesso:', movimentacao.id);

    // Verificar se há trigger no banco que atualiza o estoque automaticamente
    const { data: estoqueApos, error: estoqueError } = await supabase
      .from('estoque')
      .select('quantidade_atual, quantidade_disponivel, quantidade_reservada, valor_total')
      .eq('produto_id', produto_id)
      .single();

    if (estoqueError) {
      console.error('❌ Erro ao verificar estoque após movimentação:', estoqueError);
      // Não falha a operação, apenas loga o erro
    } else {
      console.log('📊 Estoque após movimentação:', estoqueApos);
    }

    return {
      success: true,
      data: movimentacao,
      message: 'Movimentação criada com sucesso'
    };

  } catch (error) {
    console.error('❌ Erro na função criarMovimentacaoEstoque:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Cria movimentações de estoque para uma venda
 * @param {Object} venda - Dados da venda
 * @param {Array} itens - Itens da venda
 * @param {number} responsavel_id - ID do responsável
 * @returns {Promise<Array>} Array de movimentações criadas
 */
export async function criarMovimentacoesVenda(venda, itens, responsavel_id) {
  const movimentacoes = [];

  for (const item of itens) {
    if (item.produto_id) {
      // Buscar dados do produto
      const { data: produto, error: produtoError } = await supabase
        .from('produtos')
        .select('id, nome, valor_unitario')
        .eq('id', item.produto_id)
        .single();

      if (produtoError) {
        console.error(`❌ Erro ao buscar produto ${item.produto_id}:`, produtoError);
        continue;
      }

      // Criar movimentação de saída
      const resultado = await criarMovimentacaoEstoque({
        produto_id: item.produto_id,
        tipo: 'Saída',
        quantidade: item.quantidade,
        valor_unitario: produto.valor_unitario,
        responsavel_id,
        motivo: `VENDA - ${venda.numero_venda}`,
        observacoes: `Venda para cliente. Item: ${item.descricao}`,
        venda_id: venda.id,
        obra_id: venda.obra_id,
        numero_documento: venda.numero_venda
      });

      if (resultado.success) {
        movimentacoes.push(resultado.data);
      } else {
        console.error(`❌ Erro ao criar movimentação para produto ${item.produto_id}:`, resultado.error);
      }
    }
  }

  return movimentacoes;
}

/**
 * Cria movimentações de estoque para uma compra
 * @param {Object} compra - Dados da compra
 * @param {Array} itens - Itens da compra
 * @param {number} responsavel_id - ID do responsável
 * @returns {Promise<Array>} Array de movimentações criadas
 */
export async function criarMovimentacoesCompra(compra, itens, responsavel_id) {
  const movimentacoes = [];

  for (const item of itens) {
    if (item.produto_id) {
      // Criar movimentação de entrada
      const resultado = await criarMovimentacaoEstoque({
        produto_id: item.produto_id,
        tipo: 'Entrada',
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        responsavel_id,
        motivo: `COMPRA - ${compra.numero_pedido}`,
        observacoes: `Compra de fornecedor. Item: ${item.descricao}`,
        compra_id: compra.id,
        fornecedor_id: compra.fornecedor_id,
        numero_documento: compra.numero_pedido
      });

      if (resultado.success) {
        movimentacoes.push(resultado.data);
      } else {
        console.error(`❌ Erro ao criar movimentação para produto ${item.produto_id}:`, resultado.error);
      }
    }
  }

  return movimentacoes;
}
