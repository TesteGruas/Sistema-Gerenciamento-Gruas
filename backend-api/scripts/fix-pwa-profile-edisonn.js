/**
 * Correção one-off: usuario 195 (info@gruascopa.com.br)
 * Limpa vínculos legados de funcionário/supervisor e alinha metadata Auth como Cliente.
 *
 * Uso: node scripts/fix-pwa-profile-edisonn.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { buscarClientePorUsuarioComAutoVinculo } from '../src/utils/cliente-usuario-link.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const USUARIO_ID = 195
const EMAIL = 'info@gruascopa.com.br'
const RESPONSAVEL_OBRA_ID = 28

async function main() {
  console.log(`🔧 Corrigindo usuário ${USUARIO_ID} (${EMAIL})...`)

  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('id, email, nome, funcionario_id, eh_funcionario')
    .eq('id', USUARIO_ID)
    .single()

  if (usuarioError || !usuario) {
    console.error('❌ Usuário não encontrado:', usuarioError?.message)
    process.exit(1)
  }

  console.log('📋 Antes:', usuario)

  const { data: perfis } = await supabase
    .from('usuario_perfis')
    .select('id, perfil_id, status, perfis(nome)')
    .eq('usuario_id', USUARIO_ID)
    .eq('status', 'Ativa')

  console.log('📋 Perfis ativos:', perfis?.map((p) => p.perfis?.nome))

  const { error: updateUsuarioError } = await supabase
    .from('usuarios')
    .update({
      funcionario_id: null,
      eh_funcionario: false,
      cargo: null,
      turno: null,
      data_admissao: null,
      salario: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', USUARIO_ID)

  if (updateUsuarioError) {
    console.error('❌ Erro ao atualizar usuarios:', updateUsuarioError.message)
    process.exit(1)
  }
  console.log('✅ usuarios: funcionario_id e campos RH limpos')

  const { error: respError } = await supabase
    .from('responsaveis_obra')
    .update({ ativo: false, updated_at: new Date().toISOString() })
    .eq('id', RESPONSAVEL_OBRA_ID)

  if (respError) {
    console.warn('⚠️ responsaveis_obra:', respError.message)
  } else {
    console.log(`✅ responsaveis_obra id ${RESPONSAVEL_OBRA_ID} desativado`)
  }

  const { data: authList, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error('❌ listUsers:', listError.message)
    process.exit(1)
  }

  const authUser = authList.users.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase())
  if (!authUser) {
    console.warn('⚠️ Usuário não encontrado no Auth — pulando metadata')
  } else {
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(authUser.id, {
      user_metadata: {
        nome: usuario.nome || authUser.user_metadata?.nome,
        tipo: 'cliente',
        email_verified: authUser.user_metadata?.email_verified ?? true,
      },
    })
    if (authUpdateError) {
      console.error('❌ updateUserById:', authUpdateError.message)
    } else {
      console.log('✅ Auth metadata: tipo=cliente, funcionario_id/cargo removidos')
    }
  }

  const cliente = await buscarClientePorUsuarioComAutoVinculo(
    supabase,
    { usuarioId: USUARIO_ID, email: EMAIL },
    { autoVincular: true }
  )
  if (cliente) {
    console.log(`✅ Cliente vinculado: id ${cliente.id} (${cliente.nome})`)
  } else {
    console.warn('⚠️ Nenhum registro em clientes encontrado para vincular')
  }

  const { data: depois } = await supabase
    .from('usuarios')
    .select('id, email, nome, funcionario_id, eh_funcionario')
    .eq('id', USUARIO_ID)
    .single()

  console.log('📋 Depois:', depois)
  console.log('✅ Correção concluída.')
}

main().catch((err) => {
  console.error('❌ Erro fatal:', err)
  process.exit(1)
})
