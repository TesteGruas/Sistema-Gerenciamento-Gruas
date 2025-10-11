/**
 * Script de Migração: Sincronizar usuários da tabela usuarios com Supabase Auth
 * 
 * Este script:
 * 1. Busca todos os usuários da tabela usuarios que não têm email no Auth
 * 2. Cria contas no Supabase Auth para cada um
 * 3. Gera senha temporária aleatória
 * 4. (Opcional) Envia email de boas-vindas com link para definir senha
 * 
 * Uso:
 *   node scripts/sync-users-to-auth.js
 *   node scripts/sync-users-to-auth.js --dry-run  (para teste sem criar)
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

// Configurar cliente Supabase Admin (tem permissões especiais)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Função para gerar senha segura aleatória
function generateSecurePassword(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  const randomBytes = crypto.randomBytes(length)
  
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length]
  }
  
  return password
}

async function syncUsersToAuth() {
  const isDryRun = process.argv.includes('--dry-run')
  
  console.log('🚀 Iniciando sincronização de usuários...')
  console.log(`📋 Modo: ${isDryRun ? 'DRY RUN (sem criar)' : 'PRODUÇÃO (vai criar)'}\n`)

  try {
    // 1. Buscar todos os usuários ativos da tabela
    console.log('📊 Buscando usuários da tabela usuarios...')
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, nome, status')
      .eq('status', 'Ativo')
      .order('id')

    if (usuariosError) {
      throw new Error(`Erro ao buscar usuários: ${usuariosError.message}`)
    }

    console.log(`✅ Encontrados ${usuarios.length} usuários ativos na tabela\n`)

    // 2. Buscar usuários existentes no Auth
    console.log('🔍 Verificando usuários no Supabase Auth...')
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      throw new Error(`Erro ao listar usuários do Auth: ${authError.message}`)
    }

    const authEmails = new Set(authUsers.map(u => u.email?.toLowerCase()))
    console.log(`✅ Encontrados ${authUsers.length} usuários no Auth\n`)

    // 3. Identificar usuários que precisam ser sincronizados
    const usuariosParaSincronizar = usuarios.filter(u => {
      return u.email && !authEmails.has(u.email.toLowerCase())
    })

    console.log(`🎯 ${usuariosParaSincronizar.length} usuários precisam ser sincronizados\n`)

    if (usuariosParaSincronizar.length === 0) {
      console.log('✅ Todos os usuários já estão sincronizados!')
      return
    }

    // 4. Sincronizar usuários
    const resultados = {
      sucesso: [],
      erro: [],
      senhas: []
    }

    for (const usuario of usuariosParaSincronizar) {
      const senhaTemporaria = generateSecurePassword()

      console.log(`\n📝 Processando: ${usuario.nome} (${usuario.email})`)

      if (isDryRun) {
        console.log(`   [DRY RUN] Seria criado no Auth com senha temporária`)
        resultados.sucesso.push({
          usuario: usuario.email,
          senha: senhaTemporaria
        })
        continue
      }

      try {
        // Criar usuário no Supabase Auth
        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: usuario.email,
          password: senhaTemporaria,
          email_confirm: true, // Confirmar email automaticamente
          user_metadata: {
            nome: usuario.nome,
            migrated: true,
            migrated_at: new Date().toISOString()
          }
        })

        if (createError) {
          console.log(`   ❌ Erro: ${createError.message}`)
          resultados.erro.push({
            usuario: usuario.email,
            erro: createError.message
          })
        } else {
          console.log(`   ✅ Criado com sucesso no Auth`)
          resultados.sucesso.push({
            usuario: usuario.email,
            senha: senhaTemporaria,
            auth_id: authData.user.id
          })
        }
      } catch (err) {
        console.log(`   ❌ Erro inesperado: ${err.message}`)
        resultados.erro.push({
          usuario: usuario.email,
          erro: err.message
        })
      }

      // Pequeno delay para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // 5. Relatório final
    console.log('\n' + '='.repeat(60))
    console.log('📊 RELATÓRIO FINAL')
    console.log('='.repeat(60))
    console.log(`✅ Sincronizados com sucesso: ${resultados.sucesso.length}`)
    console.log(`❌ Erros: ${resultados.erro.length}`)
    console.log('='.repeat(60))

    if (resultados.sucesso.length > 0) {
      console.log('\n🔑 SENHAS TEMPORÁRIAS GERADAS:')
      console.log('⚠️  IMPORTANTE: Salve estas senhas em local seguro!\n')
      
      resultados.sucesso.forEach(({ usuario, senha }) => {
        console.log(`${usuario}`)
        console.log(`  Senha: ${senha}`)
        console.log('')
      })
      
      console.log('\n💡 PRÓXIMOS PASSOS:')
      console.log('1. Envie as senhas temporárias para os usuários')
      console.log('2. Instrua-os a fazer login e alterar a senha')
      console.log('3. Ou configure o sistema para forçar redefinição de senha no primeiro login')
    }

    if (resultados.erro.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:\n')
      resultados.erro.forEach(({ usuario, erro }) => {
        console.log(`${usuario}: ${erro}`)
      })
    }

    console.log('\n✅ Sincronização concluída!')

  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message)
    process.exit(1)
  }
}

// Executar script
syncUsersToAuth()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })

