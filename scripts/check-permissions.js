// Script para verificar e corrigir permissões
// Execute no console do navegador

console.log('🔍 Verificando permissões atuais...')

// Verificar permissões no localStorage
const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
console.log('📋 Permissões no localStorage:', permissions)
console.log('📊 Total de permissões:', permissions.length)

// Verificar se dashboard:visualizar está presente
const hasDashboard = permissions.includes('dashboard:visualizar')
console.log('🎯 Tem dashboard:visualizar?', hasDashboard)

// Mostrar todas as permissões que começam com 'dashboard'
const dashboardPerms = permissions.filter(p => p.startsWith('dashboard:'))
console.log('📋 Permissões de dashboard:', dashboardPerms)

// Se não tem dashboard:visualizar, adicionar
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
    console.log('🎉 Correção aplicada! Recarregando página...')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }
} else {
  console.log('✅ dashboard:visualizar já existe!')
  console.log('🤔 O problema pode estar no hook usePermissions...')
  
  // Verificar se o problema está no hook
  console.log('🔍 Testando verificação manual...')
  const testPermission = 'dashboard:visualizar'
  const hasAccess = permissions.includes(testPermission)
  console.log(`🔐 Verificação manual de "${testPermission}":`, hasAccess)
  
  if (hasAccess) {
    console.log('✅ Permissão existe, mas o hook não está reconhecendo')
    console.log('🔄 Recarregando página para forçar atualização...')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }
}

// Exportar função para teste manual
window.checkPermissions = () => {
  const perms = JSON.parse(localStorage.getItem('user_permissions') || '[]')
  console.log('Permissões:', perms)
  console.log('Tem dashboard:visualizar?', perms.includes('dashboard:visualizar'))
  return perms
}

console.log('📝 Função checkPermissions() disponível para teste manual')

