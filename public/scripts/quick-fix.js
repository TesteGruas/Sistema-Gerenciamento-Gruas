// Script de correção rápida para o sistema de permissões
// Execute no console do navegador

console.log('⚡ Correção rápida do sistema de permissões...')

// Verificar se dashboard:visualizar está presente
const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
const hasDashboard = permissions.includes('dashboard:visualizar')

console.log('🔍 Estado atual:')
console.log('- Total de permissões:', permissions.length)
console.log('- Tem dashboard:visualizar?', hasDashboard)

if (!hasDashboard) {
  console.log('🔧 Adicionando dashboard:visualizar...')
  permissions.push('dashboard:visualizar')
  localStorage.setItem('user_permissions', JSON.stringify(permissions))
  console.log('✅ dashboard:visualizar adicionado!')
  
  // Verificar novamente
  const newPermissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
  const hasDashboardNow = newPermissions.includes('dashboard:visualizar')
  console.log('✅ Verificação final:', hasDashboardNow)
  
  if (hasDashboardNow) {
    console.log('🎉 Correção aplicada com sucesso! Recarregando página...')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }
} else {
  console.log('✅ dashboard:visualizar já existe! Recarregando página...')
  setTimeout(() => {
    window.location.reload()
  }, 1000)
}
