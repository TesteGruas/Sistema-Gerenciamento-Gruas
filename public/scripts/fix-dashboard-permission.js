// Script de correção direta para dashboard:visualizar
// Execute no console do navegador

console.log('🚀 Correção direta para dashboard:visualizar...')

// Função para adicionar dashboard:visualizar se não existir
function fixDashboardPermission() {
  const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
  
  console.log('📋 Permissões atuais:', permissions.length)
  console.log('🔍 Verificando dashboard:visualizar...')
  
  if (!permissions.includes('dashboard:visualizar')) {
    console.log('🔧 Adicionando dashboard:visualizar...')
    permissions.push('dashboard:visualizar')
    localStorage.setItem('user_permissions', JSON.stringify(permissions))
    console.log('✅ dashboard:visualizar adicionado!')
  } else {
    console.log('✅ dashboard:visualizar já existe!')
  }
  
  // Verificar resultado
  const newPermissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
  const hasDashboard = newPermissions.includes('dashboard:visualizar')
  console.log('🎯 Resultado final:', hasDashboard)
  
  return hasDashboard
}

// Função para forçar recarregamento
function forceReload() {
  console.log('🔄 Forçando recarregamento...')
  window.location.reload()
}

// Executar correção
const fixed = fixDashboardPermission()

if (fixed) {
  console.log('🎉 Correção aplicada com sucesso!')
  console.log('⏳ Recarregando página em 2 segundos...')
  setTimeout(forceReload, 2000)
} else {
  console.log('❌ Falha na correção')
}

// Exportar funções
window.fixDashboardPermission = fixDashboardPermission
window.forceReload = forceReload

console.log('📝 Funções disponíveis:')
console.log('- fixDashboardPermission() - Corrigir permissão')
console.log('- forceReload() - Recarregar página')
