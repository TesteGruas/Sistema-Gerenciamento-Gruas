// Script para testar e corrigir o sistema de permissões
// Execute no console do navegador

console.log('🔧 Testando e corrigindo sistema de permissões...')

// Função para verificar se dashboard:visualizar está presente
function checkDashboardPermission() {
  const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
  const hasDashboard = permissions.includes('dashboard:visualizar')
  
  console.log('🔍 Verificando permissões:')
  console.log('Total de permissões:', permissions.length)
  console.log('Tem dashboard:visualizar?', hasDashboard)
  console.log('Permissões:', permissions)
  
  return hasDashboard
}

// Função para adicionar dashboard:visualizar se não estiver presente
function fixDashboardPermission() {
  console.log('🔧 Corrigindo permissão dashboard:visualizar...')
  
  const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
  
  if (!permissions.includes('dashboard:visualizar')) {
    permissions.push('dashboard:visualizar')
    localStorage.setItem('user_permissions', JSON.stringify(permissions))
    console.log('✅ Permissão dashboard:visualizar adicionada!')
  } else {
    console.log('✅ Permissão dashboard:visualizar já existe!')
  }
  
  return permissions
}

// Função para recarregar a página
function reload() {
  console.log('🔄 Recarregando página...')
  window.location.reload()
}

// Função para testar o sistema completo
function testSystem() {
  console.log('🧪 Testando sistema completo...')
  
  // Verificar estado atual
  const hasDashboard = checkDashboardPermission()
  
  if (!hasDashboard) {
    console.log('❌ dashboard:visualizar não encontrado, corrigindo...')
    fixDashboardPermission()
  }
  
  // Verificar novamente
  const hasDashboardAfter = checkDashboardPermission()
  
  if (hasDashboardAfter) {
    console.log('✅ Sistema corrigido! Recarregando página...')
    setTimeout(() => {
      reload()
    }, 1000)
  } else {
    console.log('❌ Falha ao corrigir sistema')
  }
}

// Executar teste automático
console.log('🚀 Executando teste automático...')
testSystem()

// Exportar funções
window.checkDashboardPermission = checkDashboardPermission
window.fixDashboardPermission = fixDashboardPermission
window.reload = reload
window.testSystem = testSystem

console.log('📝 Funções disponíveis:')
console.log('- checkDashboardPermission() - Verificar permissão')
console.log('- fixDashboardPermission() - Corrigir permissão')
console.log('- testSystem() - Testar sistema completo')
console.log('- reload() - Recarregar página')

