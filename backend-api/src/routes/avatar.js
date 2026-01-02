/**
 * Rotas para gerenciamento de avatares de funcionários
 * Sistema de Gerenciamento de Gruas
 */

import express from 'express'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

/**
 * @swagger
 * /api/avatar/{id}:
 *   get:
 *     summary: Obter avatar do funcionário
 *     tags: [Avatar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do funcionário
 *     responses:
 *       200:
 *         description: Avatar do funcionário (imagem ou redirect)
 *       404:
 *         description: Funcionário não encontrado
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Buscar funcionário
    const { data: funcionario, error } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, foto_url, avatar_url')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Funcionário não encontrado - retornar placeholder via API externa
        const nome = `Funcionário ${id}`
        const initials = nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        const placeholderUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nome)}&size=200&backgroundColor=3b82f6&fontSize=50`
        return res.redirect(302, placeholderUrl)
      }
      throw error
    }

    // Se o funcionário tem foto_url ou avatar_url, redirecionar para ela
    if (funcionario.foto_url || funcionario.avatar_url) {
      const fotoUrl = funcionario.foto_url || funcionario.avatar_url
      // Se for uma URL completa, redirecionar
      if (fotoUrl.startsWith('http://') || fotoUrl.startsWith('https://')) {
        return res.redirect(302, fotoUrl)
      }
      // Se for um caminho do storage, construir URL do Supabase
      if (fotoUrl.startsWith('avatars/') || fotoUrl.startsWith('funcionarios/')) {
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('arquivos-obras')
          .getPublicUrl(fotoUrl)
        return res.redirect(302, publicUrl)
      }
    }

    // Se não tiver foto, gerar avatar baseado no nome usando DiceBear
    const nome = funcionario.nome || `Funcionário ${id}`
    const placeholderUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nome)}&size=200&backgroundColor=3b82f6&fontSize=50`
    return res.redirect(302, placeholderUrl)
  } catch (error) {
    console.error('Erro ao buscar avatar:', error)
    // Em caso de erro, retornar placeholder genérico
    const placeholderUrl = `https://api.dicebear.com/7.x/initials/svg?seed=User&size=200&backgroundColor=9ca3af&fontSize=50`
    return res.redirect(302, placeholderUrl)
  }
})

export default router












