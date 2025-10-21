// Script completo de debug do fluxo de autenticação e permissões
// Execute no console do navegador

console.log('🔍 === DEBUG COMPLETO DO FLUXO DE AUTENTICAÇÃO ===')

// Função para verificar estado atual do localStorage
function checkLocalStorageState() {
  console.log('📦 === ESTADO DO LOCALSTORAGE ===')
  
  const keys = ['access_token', 'user_profile', 'user_perfil', 'user_permissoes', 'user_permissions', 'userRole']
  
  keys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) {
      try {
        const parsed = JSON.parse(value)
        console.log(`✅ ${key}:`, typeof parsed === 'object' ? `${Object.keys(parsed).length} propriedades` : parsed)
      } catch {
        console.log(`✅ ${key}:`, value)
      }
    } else {
      console.log(`❌ ${key}: não encontrado`)
    }
  })
}

// Função para verificar permissões específicas
function checkPermissions() {
  console.log('🔐 === VERIFICAÇÃO DE PERMISSÕES ===')
  
  const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
  console.log('📊 Total de permissões:', permissions.length)
  
  // Verificar permissões específicas
  const requiredPermissions = [
    'dashboard:visualizar',
    'usuarios:visualizar',
    'gruas:visualizar',
    'estoque:visualizar',
    'relatorios:visualizar',
    'configuracoes:visualizar',
    'ponto_eletronico:visualizar',
    'assinatura_digital:visualizar'
  ]
  
  console.log('🎯 Verificando permissões específicas:')
  requiredPermissions.forEach(perm => {
    const hasPermission = permissions.includes(perm)
    console.log(`${hasPermission ? '✅' : '❌'} ${perm}: ${hasPermission}`)
  })
  
  // Mostrar todas as permissões
  console.log('📋 Todas as permissões:')
  permissions.forEach((perm, index) => {
    console.log(`  ${index + 1}. ${perm}`)
  })
  
  return permissions
}

// Função para simular login completo
function simulateCompleteLogin() {
  console.log('🚀 === SIMULANDO LOGIN COMPLETO ===')
  
  // Limpar dados antigos
  console.log('🧹 Limpando dados antigos...')
  localStorage.clear()
  
  // Dados do admin
  const adminData = {
    user: {
      id: "6b3cd5a8-2991-40a2-8237-c64afc431320",
      email: "admin@admin.com",
      nome: "Administrador",
      role: "admin"
    },
    perfil: {
      id: 1,
      nome: "Administrador",
      nivel_acesso: 10,
      descricao: "Acesso completo ao sistema",
      status: "Ativo"
    },
    permissoes: [
      { id: 1, nome: "dashboard:visualizar", modulo: "dashboard", acao: "visualizar" },
      { id: 2, nome: "usuarios:visualizar", modulo: "usuarios", acao: "visualizar" },
      { id: 3, nome: "usuarios:criar", modulo: "usuarios", acao: "criar" },
      { id: 4, nome: "usuarios:editar", modulo: "usuarios", acao: "editar" },
      { id: 5, nome: "usuarios:deletar", modulo: "usuarios", acao: "deletar" },
      { id: 6, nome: "usuarios:gerenciar", modulo: "usuarios", acao: "gerenciar" },
      { id: 7, nome: "gruas:visualizar", modulo: "gruas", acao: "visualizar" },
      { id: 8, nome: "gruas:criar", modulo: "gruas", acao: "criar" },
      { id: 9, nome: "gruas:editar", modulo: "gruas", acao: "editar" },
      { id: 10, nome: "gruas:deletar", modulo: "gruas", acao: "deletar" },
      { id: 11, nome: "gruas:gerenciar", modulo: "gruas", acao: "gerenciar" },
      { id: 12, nome: "estoque:visualizar", modulo: "estoque", acao: "visualizar" },
      { id: 13, nome: "estoque:criar", modulo: "estoque", acao: "criar" },
      { id: 14, nome: "estoque:editar", modulo: "estoque", acao: "editar" },
      { id: 15, nome: "estoque:deletar", modulo: "estoque", acao: "deletar" },
      { id: 16, nome: "estoque:gerenciar", modulo: "estoque", acao: "gerenciar" },
      { id: 17, nome: "relatorios:visualizar", modulo: "relatorios", acao: "visualizar" },
      { id: 18, nome: "relatorios:exportar", modulo: "relatorios", acao: "exportar" },
      { id: 19, nome: "configuracoes:visualizar", modulo: "configuracoes", acao: "visualizar" },
      { id: 20, nome: "configuracoes:editar", modulo: "configuracoes", acao: "editar" },
      { id: 21, nome: "ponto_eletronico:visualizar", modulo: "ponto_eletronico", acao: "visualizar" },
      { id: 22, nome: "ponto_eletronico:registrar", modulo: "ponto_eletronico", acao: "registrar" },
      { id: 23, nome: "assinatura_digital:visualizar", modulo: "assinatura_digital", acao: "visualizar" },
      { id: 24, nome: "assinatura_digital:assinar", modulo: "assinatura_digital", acao: "assinar" }
    ]
  }
  
  const adminToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6ImIza0FDV3E2dGdIeTRmQWQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL21naGRrdGtvZWpvYnNtZGJ2c3NsLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI2YjNjZDVhOC0yOTkxLTQwYTItODIzNy1jNjRhZmM0MzEzMjAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYwOTk0OTg5LCJpYXQiOjE3NjA5OTEzODksImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJub21lIjoiQWRtaW5pc3RyYWRvciIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicm9sZSI6ImFkbWluIiwic3ViIjoiNmIzY2Q1YTgtMjk5MS00MGEyLTgyMzctYzY0YWZjNDMxMzIwIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjA5OTEzODl9XSwic2Vzc2lvbl9pZCI6ImRmMzZmNTdjLWU4ZGItNDBhMi05YzVlLTAzZTNhMDJmNzNjNCIsImlzX2Fub255bW91cyI6ZmFsc2V9.TiG90tofCzSTxnaUAxlqQ92y5tUPWhdIKfH6_Jn49MU"
  
  console.log('💾 Salvando dados do admin...')
  
  // Salvar dados
  localStorage.setItem('access_token', adminToken)
  localStorage.setItem('user_profile', JSON.stringify(adminData.user))
  localStorage.setItem('user_perfil', JSON.stringify(adminData.perfil))
  localStorage.setItem('user_permissoes', JSON.stringify(adminData.permissoes))
  localStorage.setItem('userRole', 'admin')
  
  // Converter permissões para formato string
  const permissionStrings = adminData.permissoes.map(p => `${p.modulo}:${p.acao}`)
  localStorage.setItem('user_permissions', JSON.stringify(permissionStrings))
  
  console.log('✅ Dados salvos com sucesso!')
  console.log('📊 Permissões convertidas:', permissionStrings.length)
  
  return permissionStrings
}

// Função para testar verificação de permissão
function testPermissionCheck(permission) {
  console.log(`🧪 === TESTANDO VERIFICAÇÃO DE PERMISSÃO: ${permission} ===`)
  
  const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
  const hasPermission = permissions.includes(permission)
  
  console.log(`📋 Permissões disponíveis: ${permissions.length}`)
  console.log(`🎯 Tem ${permission}? ${hasPermission}`)
  
  if (hasPermission) {
    console.log('✅ Permissão encontrada!')
  } else {
    console.log('❌ Permissão NÃO encontrada!')
    console.log('🔍 Procurando permissões similares...')
    const similar = permissions.filter(p => p.includes(permission.split(':')[0]))
    console.log('🔍 Permissões similares:', similar)
  }
  
  return hasPermission
}

// Função para recarregar página
function reloadPage() {
  console.log('🔄 Recarregando página...')
  window.location.reload()
}

// Executar debug completo
function runCompleteDebug() {
  console.log('🚀 === INICIANDO DEBUG COMPLETO ===')
  
  // 1. Verificar estado atual
  checkLocalStorageState()
  
  // 2. Verificar permissões atuais
  const currentPermissions = checkPermissions()
  
  // 3. Se não tem dashboard:visualizar, simular login
  if (!currentPermissions.includes('dashboard:visualizar')) {
    console.log('🔧 dashboard:visualizar não encontrado, simulando login...')
    const newPermissions = simulateCompleteLogin()
    
    // 4. Verificar se foi salvo corretamente
    console.log('🔍 Verificando se foi salvo corretamente...')
    checkLocalStorageState()
    checkPermissions()
    
    // 5. Testar verificação específica
    testPermissionCheck('dashboard:visualizar')
    
    // 6. Recarregar página
    console.log('⏳ Recarregando página em 3 segundos...')
    setTimeout(reloadPage, 3000)
  } else {
    console.log('✅ dashboard:visualizar já existe!')
    testPermissionCheck('dashboard:visualizar')
  }
}

// Exportar funções
window.checkLocalStorageState = checkLocalStorageState
window.checkPermissions = checkPermissions
window.simulateCompleteLogin = simulateCompleteLogin
window.testPermissionCheck = testPermissionCheck
window.reloadPage = reloadPage
window.runCompleteDebug = runCompleteDebug

// Executar debug automático
runCompleteDebug()

console.log('📝 Funções disponíveis:')
console.log('- checkLocalStorageState() - Verificar localStorage')
console.log('- checkPermissions() - Verificar permissões')
console.log('- simulateCompleteLogin() - Simular login')
console.log('- testPermissionCheck(permission) - Testar permissão específica')
console.log('- reloadPage() - Recarregar página')
console.log('- runCompleteDebug() - Executar debug completo')
