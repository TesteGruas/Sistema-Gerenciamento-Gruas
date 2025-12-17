/**
 * Script para atualizar senha do usuário admin@admin.com
 * Uso: node scripts/atualizar-senha-admin.js
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

async function atualizarSenhaAdmin() {
  try {
    const email = 'admin@admin.com'
    const novaSenha = 'teste@123'
    
    console.log(`🔍 Buscando usuário com email ${email}...`)
    
    // 1. Buscar email do usuário na tabela usuarios (se existir)
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, email, nome')
      .eq('email', email)
      .single()

    if (usuarioError && usuarioError.code !== 'PGRST116') {
      console.log('⚠️  Aviso: Não foi possível buscar na tabela usuarios:', usuarioError.message)
    }

    if (usuario) {
      console.log(`✅ Usuário encontrado na tabela: ${usuario.nome} (ID: ${usuario.id})`)
    }

    // 2. Buscar usuário no Supabase Auth pelo email
    console.log(`🔍 Buscando usuário no Supabase Auth...`)
    const { data: { users }, error: authListError } = await supabase.auth.admin.listUsers()
    
    if (authListError) {
      console.error('❌ Erro ao listar usuários do Auth:', authListError.message)
      return
    }

    const authUser = users.find(u => u.email === email)

    if (!authUser) {
      console.error(`❌ Usuário não encontrado no Supabase Auth para o email: ${email}`)
      console.log('\n💡 Usuários disponíveis no Auth:')
      users.slice(0, 10).forEach(u => {
        console.log(`   - ${u.email} (ID: ${u.id})`)
      })
      return
    }

    console.log(`✅ Usuário encontrado no Auth: ${authUser.id}`)

    // 3. Atualizar senha no Supabase Auth
    console.log(`🔐 Atualizando senha para: ${novaSenha}...`)
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
    if (usuario) {
      console.log(`   ID Usuário (tabela): ${usuario.id}`)
      console.log(`   Nome: ${usuario.nome}`)
    }
    console.log(`   Email: ${email}`)
    console.log(`   ID Auth: ${authUser.id}`)
    console.log(`   Nova Senha: ${novaSenha}`)
    console.log(`\n⚠️  IMPORTANTE: Informe ao usuário para alterar a senha no próximo login por segurança.`)

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
    console.error(error.stack)
  }
}

atualizarSenhaAdmin()

