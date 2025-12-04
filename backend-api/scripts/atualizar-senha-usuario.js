/**
 * Script para atualizar senha de usuário
 * Uso: node scripts/atualizar-senha-usuario.js <usuario_id> <nova_senha>
 * Exemplo: node scripts/atualizar-senha-usuario.js 108 123456
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados no .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function atualizarSenha(usuarioId, novaSenha) {
  try {
    console.log(`🔍 Buscando usuário ID ${usuarioId}...`)
    
    // 1. Buscar email do usuário na tabela usuarios
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, email, nome')
      .eq('id', usuarioId)
      .single()

    if (usuarioError || !usuario) {
      console.error('❌ Erro ao buscar usuário:', usuarioError?.message || 'Usuário não encontrado')
      return
    }

    console.log(`✅ Usuário encontrado: ${usuario.nome} (${usuario.email})`)

    // 2. Buscar usuário no Supabase Auth pelo email
    console.log(`🔍 Buscando usuário no Supabase Auth...`)
    const { data: { users }, error: authListError } = await supabase.auth.admin.listUsers()
    
    if (authListError) {
      console.error('❌ Erro ao listar usuários do Auth:', authListError.message)
      return
    }

    const authUser = users.find(u => u.email === usuario.email)

    if (!authUser) {
      console.error(`❌ Usuário não encontrado no Supabase Auth para o email: ${usuario.email}`)
      return
    }

    console.log(`✅ Usuário encontrado no Auth: ${authUser.id}`)

    // 3. Atualizar senha no Supabase Auth
    console.log(`🔐 Atualizando senha...`)
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      { password: novaSenha }
    )

    if (updateError) {
      console.error('❌ Erro ao atualizar senha:', updateError.message)
      return
    }

    console.log(`✅ Senha atualizada com sucesso!`)
    console.log(`\n📋 Resumo:`)
    console.log(`   ID Usuário: ${usuarioId}`)
    console.log(`   Nome: ${usuario.nome}`)
    console.log(`   Email: ${usuario.email}`)
    console.log(`   Nova Senha: ${novaSenha}`)
    console.log(`\n⚠️  IMPORTANTE: Informe ao usuário para alterar a senha no próximo login por segurança.`)

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
  }
}

// Obter argumentos da linha de comando
const usuarioId = process.argv[2]
const novaSenha = process.argv[3]

if (!usuarioId || !novaSenha) {
  console.log('📝 Uso: node scripts/atualizar-senha-usuario.js <usuario_id> <nova_senha>')
  console.log('📝 Exemplo: node scripts/atualizar-senha-usuario.js 108 123456')
  process.exit(1)
}

atualizarSenha(parseInt(usuarioId), novaSenha)


