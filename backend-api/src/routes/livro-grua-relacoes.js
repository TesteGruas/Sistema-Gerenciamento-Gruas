const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /api/livro-grua/relacoes-grua-obra
 * Listar todas as relações grua-obra para funcionários
 */
router.get('/relacoes-grua-obra', async (req, res) => {
  try {
    const query = `
      SELECT 
        go.id,
        go.grua_id,
        go.obra_id,
        go.data_inicio_locacao,
        go.data_fim_locacao,
        go.status,
        go.valor_locacao_mensal,
        go.observacoes,
        g.id as grua_id_full,
        g.tipo,
        g.modelo,
        g.fabricante,
        o.id as obra_id_full,
        o.nome as obra_nome,
        o.endereco,
        o.cidade,
        o.estado,
        o.status as obra_status
      FROM grua_obra go
      LEFT JOIN gruas g ON go.grua_id = g.id
      LEFT JOIN obras o ON go.obra_id = o.id
      WHERE go.status IN ('Ativa', 'Pausada')
      ORDER BY o.nome, g.id
    `;

    const result = await db.query(query);
    
    // Transformar os dados para o formato esperado
    const relacoes = result.rows.map(row => ({
      id: row.id,
      grua_id: row.grua_id,
      obra_id: row.obra_id,
      data_inicio_locacao: row.data_inicio_locacao,
      data_fim_locacao: row.data_fim_locacao,
      status: row.status,
      valor_locacao_mensal: row.valor_locacao_mensal,
      observacoes: row.observacoes,
      grua: {
        id: row.grua_id_full,
        tipo: row.tipo,
        modelo: row.modelo,
        fabricante: row.fabricante
      },
      obra: {
        id: row.obra_id_full,
        nome: row.obra_nome,
        endereco: row.endereco,
        cidade: row.cidade,
        estado: row.estado,
        status: row.obra_status
      }
    }));

    res.json({
      success: true,
      data: relacoes
    });

  } catch (error) {
    console.error('Erro ao listar relações grua-obra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;
