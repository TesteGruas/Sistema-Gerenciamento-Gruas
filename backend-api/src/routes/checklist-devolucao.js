import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configuração do multer para upload de fotos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/checklists/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'checklist-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

// GET /api/checklist-devolucao - Lista todos os checklists
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { grua_id, status, data_inicio, data_fim } = req.query;

    let query = supabaseAdmin
      .from('checklist_devolucao')
      .select(`
        *,
        grua:gruas(id, name, modelo),
        obra:obras(id, nome),
        responsavel:usuarios(id, nome, email)
      `);

    if (grua_id) query = query.eq('grua_id', grua_id);
    if (status) query = query.eq('status', status);
    if (data_inicio) query = query.gte('data_checklist', data_inicio);
    if (data_fim) query = query.lte('data_checklist', data_fim);

    query = query.order('data_checklist', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar checklists:', error);
      return res.status(500).json({ 
        error: 'Erro ao buscar checklists',
        message: error.message 
      });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Erro ao buscar checklists:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar checklists',
      message: error.message 
    });
  }
});

// GET /api/checklist-devolucao/:id - Busca checklist por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: checklist, error: checklistError } = await supabaseAdmin
      .from('checklist_devolucao')
      .select(`
        *,
        grua:gruas(id, name, modelo, capacidade),
        obra:obras(id, nome),
        responsavel:usuarios(id, nome, email)
      `)
      .eq('id', id)
      .single();

    if (checklistError) {
      if (checklistError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Checklist não encontrado' });
      }
      console.error('Erro ao buscar checklist:', checklistError);
      return res.status(500).json({ 
        error: 'Erro ao buscar checklist',
        message: checklistError.message 
      });
    }

    // Buscar itens do checklist
    const { data: itens, error: itensError } = await supabaseAdmin
      .from('checklist_itens')
      .select('*')
      .eq('checklist_id', id)
      .order('ordem', { ascending: true });

    if (itensError) {
      console.error('Erro ao buscar itens:', itensError);
      return res.status(500).json({ 
        error: 'Erro ao buscar itens',
        message: itensError.message 
      });
    }

    res.json({ ...checklist, itens: itens || [] });
  } catch (error) {
    console.error('Erro ao buscar checklist:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar checklist',
      message: error.message 
    });
  }
});

// POST /api/checklist-devolucao - Cria novo checklist
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { grua_id, obra_id, responsavel_id, observacoes, itens } = req.body;

    if (!grua_id || !obra_id || !responsavel_id) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'grua_id, obra_id e responsavel_id são obrigatórios' 
      });
    }

    // Criar checklist
    const { data: checklist, error: checklistError } = await supabaseAdmin
      .from('checklist_devolucao')
      .insert({
        grua_id,
        obra_id,
        responsavel_id,
        data_checklist: new Date().toISOString(),
        status: 'em_andamento',
        observacoes,
        percentual_conclusao: 0
      })
      .select()
      .single();

    if (checklistError) {
      console.error('Erro ao criar checklist:', checklistError);
      return res.status(500).json({ 
        error: 'Erro ao criar checklist',
        message: checklistError.message 
      });
    }

    // Criar itens do checklist (se fornecidos)
    if (itens && itens.length > 0) {
      const itensParaInserir = itens.map((item, index) => ({
        checklist_id: checklist.id,
        categoria: item.categoria,
        descricao: item.descricao,
        status: item.status || 'pendente',
        observacoes: item.observacoes,
        ordem: index + 1
      }));

      const { error: itensError } = await supabaseAdmin
        .from('checklist_itens')
        .insert(itensParaInserir);

      if (itensError) {
        console.error('Erro ao criar itens:', itensError);
        // Não retorna erro, pois o checklist já foi criado
      }
    }

    res.status(201).json(checklist);
  } catch (error) {
    console.error('Erro ao criar checklist:', error);
    res.status(500).json({ 
      error: 'Erro ao criar checklist',
      message: error.message 
    });
  }
});

// PUT /api/checklist-devolucao/:id - Atualiza checklist
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('checklist_devolucao')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Checklist não encontrado' });
      }
      console.error('Erro ao atualizar checklist:', error);
      return res.status(500).json({ 
        error: 'Erro ao atualizar checklist',
        message: error.message 
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar checklist:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar checklist',
      message: error.message 
    });
  }
});

// DELETE /api/checklist-devolucao/:id - Deleta checklist
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Deletar itens primeiro (cascade)
    await supabaseAdmin
      .from('checklist_itens')
      .delete()
      .eq('checklist_id', id);

    // Deletar checklist
    const { error } = await supabaseAdmin
      .from('checklist_devolucao')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar checklist:', error);
      return res.status(500).json({ 
        error: 'Erro ao deletar checklist',
        message: error.message 
      });
    }

    res.json({ message: 'Checklist deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar checklist:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar checklist',
      message: error.message 
    });
  }
});

// POST /api/checklist-devolucao/:id/finalizar - Finaliza checklist
router.post('/:id/finalizar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se todos os itens estão concluídos
    const { data: itens, error: itensError } = await supabaseAdmin
      .from('checklist_itens')
      .select('status')
      .eq('checklist_id', id);

    if (itensError) {
      console.error('Erro ao verificar itens:', itensError);
      return res.status(500).json({ 
        error: 'Erro ao verificar itens',
        message: itensError.message 
      });
    }

    const todosAprovados = itens.every(item => item.status === 'aprovado');
    const algumReprovado = itens.some(item => item.status === 'reprovado');

    let novoStatus = 'finalizado';
    if (algumReprovado) {
      novoStatus = 'com_pendencias';
    }

    // Atualizar checklist
    const { data, error } = await supabaseAdmin
      .from('checklist_devolucao')
      .update({
        status: novoStatus,
        data_finalizacao: new Date().toISOString(),
        percentual_conclusao: 100
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao finalizar checklist:', error);
      return res.status(500).json({ 
        error: 'Erro ao finalizar checklist',
        message: error.message 
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao finalizar checklist:', error);
    res.status(500).json({ 
      error: 'Erro ao finalizar checklist',
      message: error.message 
    });
  }
});

// GET /api/checklist-devolucao/:id/itens - Lista itens do checklist
router.get('/:id/itens', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('checklist_itens')
      .select('*')
      .eq('checklist_id', id)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Erro ao buscar itens:', error);
      return res.status(500).json({ 
        error: 'Erro ao buscar itens',
        message: error.message 
      });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Erro ao buscar itens:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar itens',
      message: error.message 
    });
  }
});

// PUT /api/checklist-devolucao/itens/:itemId - Atualiza item do checklist
router.put('/itens/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('checklist_itens')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Item não encontrado' });
      }
      console.error('Erro ao atualizar item:', error);
      return res.status(500).json({ 
        error: 'Erro ao atualizar item',
        message: error.message 
      });
    }

    // Atualizar percentual de conclusão do checklist
    const { data: item } = await supabaseAdmin
      .from('checklist_itens')
      .select('checklist_id')
      .eq('id', itemId)
      .single();

    if (item) {
      await atualizarPercentualConclusao(item.checklist_id);
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar item',
      message: error.message 
    });
  }
});

// POST /api/checklist-devolucao/itens/:itemId/foto - Upload de foto do item
router.post('/itens/:itemId/foto', authenticateToken, upload.single('foto'), async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma foto foi enviada' });
    }

    const fotoUrl = `/uploads/checklists/${req.file.filename}`;

    const { data, error } = await supabaseAdmin
      .from('checklist_itens')
      .update({ foto_url: fotoUrl })
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar foto:', error);
      return res.status(500).json({ 
        error: 'Erro ao atualizar foto',
        message: error.message 
      });
    }

    res.json({ message: 'Foto enviada com sucesso', foto_url: fotoUrl, item: data });
  } catch (error) {
    console.error('Erro ao fazer upload de foto:', error);
    res.status(500).json({ 
      error: 'Erro ao fazer upload de foto',
      message: error.message 
    });
  }
});

// GET /api/checklist-devolucao/:id/relatorio - Gera relatório do checklist
router.get('/:id/relatorio', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: checklist, error: checklistError } = await supabaseAdmin
      .from('checklist_devolucao')
      .select(`
        *,
        grua:gruas(id, name, modelo, capacidade),
        obra:obras(id, nome),
        responsavel:usuarios(id, nome, email)
      `)
      .eq('id', id)
      .single();

    if (checklistError) {
      if (checklistError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Checklist não encontrado' });
      }
      console.error('Erro ao buscar checklist:', checklistError);
      return res.status(500).json({ 
        error: 'Erro ao buscar checklist',
        message: checklistError.message 
      });
    }

    const { data: itens, error: itensError } = await supabaseAdmin
      .from('checklist_itens')
      .select('*')
      .eq('checklist_id', id)
      .order('ordem', { ascending: true });

    if (itensError) {
      console.error('Erro ao buscar itens:', itensError);
      return res.status(500).json({ 
        error: 'Erro ao buscar itens',
        message: itensError.message 
      });
    }

    // Calcular estatísticas
    const totalItens = itens.length;
    const itensAprovados = itens.filter(i => i.status === 'aprovado').length;
    const itensReprovados = itens.filter(i => i.status === 'reprovado').length;
    const itensPendentes = itens.filter(i => i.status === 'pendente').length;

    const relatorio = {
      ...checklist,
      itens,
      estatisticas: {
        total_itens: totalItens,
        itens_aprovados: itensAprovados,
        itens_reprovados: itensReprovados,
        itens_pendentes: itensPendentes,
        percentual_aprovacao: totalItens > 0 ? (itensAprovados / totalItens) * 100 : 0
      }
    };

    res.json(relatorio);
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar relatório',
      message: error.message 
    });
  }
});

// GET /api/checklist-devolucao/grua/:gruaId/historico - Histórico de devoluções da grua
router.get('/grua/:gruaId/historico', authenticateToken, async (req, res) => {
  try {
    const { gruaId } = req.params;
    const { limite = 10 } = req.query;

    const { data, error } = await supabaseAdmin
      .from('checklist_devolucao')
      .select(`
        *,
        obra:obras(id, nome),
        responsavel:usuarios(id, nome, email)
      `)
      .eq('grua_id', gruaId)
      .order('data_checklist', { ascending: false })
      .limit(parseInt(limite));

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return res.status(500).json({ 
        error: 'Erro ao buscar histórico',
        message: error.message 
      });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar histórico',
      message: error.message 
    });
  }
});

// Função auxiliar para atualizar percentual de conclusão
async function atualizarPercentualConclusao(checklistId) {
  try {
    const { data: itens } = await supabaseAdmin
      .from('checklist_itens')
      .select('status')
      .eq('checklist_id', checklistId);

    if (itens && itens.length > 0) {
      const itensConcluidos = itens.filter(i => i.status !== 'pendente').length;
      const percentual = Math.round((itensConcluidos / itens.length) * 100);

      await supabaseAdmin
        .from('checklist_devolucao')
        .update({ percentual_conclusao: percentual })
        .eq('id', checklistId);
    }
  } catch (error) {
    console.error('Erro ao atualizar percentual:', error);
  }
}

export default router;
