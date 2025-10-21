// Script para forçar correção das permissões
// Execute no console do navegador

console.log('🔧 === FORÇANDO CORREÇÃO DE PERMISSÕES ===')

// Função para verificar e corrigir permissões
function forceFixPermissions() {
  console.log('🔍 Verificando estado atual...')
  
  // Verificar permissões atuais
  const currentPermissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
  console.log('📊 Permissões atuais:', currentPermissions.length)
  console.log('🎯 Tem dashboard:visualizar?', currentPermissions.includes('dashboard:visualizar'))
  
  // Lista completa de permissões necessárias
  const requiredPermissions = [
    'dashboard:visualizar',
    'usuarios:visualizar',
    'usuarios:criar',
    'usuarios:editar',
    'usuarios:deletar',
    'usuarios:gerenciar',
    'gruas:visualizar',
    'gruas:criar',
    'gruas:editar',
    'gruas:deletar',
    'gruas:gerenciar',
    'estoque:visualizar',
    'estoque:criar',
    'estoque:editar',
    'estoque:deletar',
    'estoque:gerenciar',
    'relatorios:visualizar',
    'relatorios:exportar',
    'configuracoes:visualizar',
    'configuracoes:editar',
    'ponto_eletronico:visualizar',
    'ponto_eletronico:registrar',
    'assinatura_digital:visualizar',
    'assinatura_digital:assinar'
  ]
  
  console.log('🔧 Adicionando todas as permissões necessárias...')
  
  // Adicionar permissões que não existem
  let addedCount = 0
  requiredPermissions.forEach(perm => {
    if (!currentPermissions.includes(perm)) {
      currentPermissions.push(perm)
      addedCount++
      console.log(`  + ${perm}`)
    }
  })
  
  if (addedCount > 0) {
    console.log(`✅ ${addedCount} permissões adicionadas!`)
  } else {
    console.log('✅ Todas as permissões já existem!')
  }
  
  // Salvar permissões atualizadas
  localStorage.setItem('user_permissions', JSON.stringify(currentPermissions))
  
  // Verificar resultado
  const finalPermissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
  const hasDashboard = finalPermissions.includes('dashboard:visualizar')
  
  console.log('🎯 Resultado final:')
  console.log(`  Total de permissões: ${finalPermissions.length}`)
  console.log(`  Tem dashboard:visualizar? ${hasDashboard}`)
  
  return hasDashboard
}

// Função para forçar recarregamento
function forceReload() {
  console.log('🔄 Forçando recarregamento...')
  window.location.reload()
}

// Executar correção
const fixed = forceFixPermissions()

if (fixed) {
  console.log('🎉 Correção aplicada com sucesso!')
  console.log('⏳ Recarregando página em 2 segundos...')
  setTimeout(forceReload, 2000)
} else {
  console.log('❌ Falha na correção')
}

// Exportar funções
window.forceFixPermissions = forceFixPermissions
window.forceReload = forceReload

console.log('📝 Funções disponíveis:')
console.log('- forceFixPermissions() - Forçar correção')
console.log('- forceReload() - Recarregar página')

