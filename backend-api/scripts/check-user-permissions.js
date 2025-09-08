import { supabase, supabaseAdmin } from '../src/config/supabase.js'

async function checkUserPermissions() {
  try {
    console.log('🔍 Verificando permissões do usuário...')
    
    // Buscar todos os usuários para ver seus roles
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
    
    if (usuariosError) {
      console.error('❌ Erro ao buscar usuários:', usuariosError)
      return
    }
    
    console.log('\n📋 Usuários encontrados:')
    usuarios.forEach(usuario => {
      console.log(`- ${usuario.nome} (${usuario.email}) - Role: ${usuario.role || 'user'}`)
    })
    
    // Verificar se há usuários com role 'user' que precisam ser atualizados
    const usuariosSemPermissao = usuarios.filter(u => !u.role || u.role === 'user')
    
    if (usuariosSemPermissao.length > 0) {
      console.log('\n⚠️  Usuários que precisam de permissões adicionais:')
      usuariosSemPermissao.forEach(usuario => {
        console.log(`- ${usuario.nome} (${usuario.email})`)
      })
      
      console.log('\n🔧 Atualizando roles para "admin"...')
      
      for (const usuario of usuariosSemPermissao) {
        const { error: updateError } = await supabaseAdmin
          .from('usuarios')
          .update({ role: 'admin' })
          .eq('id', usuario.id)
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar ${usuario.nome}:`, updateError)
        } else {
          console.log(`✅ ${usuario.nome} atualizado para admin`)
        }
      }
    } else {
      console.log('\n✅ Todos os usuários já têm permissões adequadas')
    }
    
    // Verificar permissões finais
    console.log('\n📊 Verificação final de permissões:')
    const { data: usuariosFinais, error: finalError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
    
    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError)
      return
    }
    
    usuariosFinais.forEach(usuario => {
      const role = usuario.role || 'user'
      const permissions = getRolePermissions(role)
      console.log(`- ${usuario.nome}: ${role} (${permissions.length} permissões)`)
    })
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

function getRolePermissions(role) {
  const rolePermissions = {
    'admin': [
      'visualizar_estoque', 'criar_produtos', 'editar_produtos', 'excluir_produtos', 'movimentar_estoque',
      'visualizar_clientes', 'criar_clientes', 'editar_clientes', 'excluir_clientes',
      'visualizar_obras', 'criar_obras', 'editar_obras', 'excluir_obras',
      'visualizar_funcionarios', 'criar_funcionarios', 'editar_funcionarios', 'excluir_funcionarios',
      'visualizar_equipamentos', 'criar_equipamentos', 'editar_equipamentos', 'excluir_equipamentos',
      'visualizar_relacionamentos', 'criar_relacionamentos', 'editar_relacionamentos', 'excluir_relacionamentos'
    ],
    'manager': [
      'visualizar_estoque', 'criar_produtos', 'editar_produtos', 'movimentar_estoque',
      'visualizar_clientes', 'criar_clientes', 'editar_clientes'
    ],
    'user': [
      'visualizar_estoque', 'visualizar_clientes'
    ]
  }
  
  return rolePermissions[role] || rolePermissions['user']
}

// Executar o script
checkUserPermissions()
