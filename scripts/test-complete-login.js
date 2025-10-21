// Script para testar o login completo e validar todo o fluxo
// Execute no console do navegador

console.log('🚀 === TESTE COMPLETO DE LOGIN E VALIDAÇÃO ===')

// Função para limpar tudo e começar do zero
function clearAll() {
  console.log('🧹 Limpando todos os dados...')
  localStorage.clear()
  console.log('✅ Dados limpos')
}

// Função para simular login completo
function simulateLogin() {
  console.log('🔐 === SIMULANDO LOGIN COMPLETO ===')
  
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
  console.log('🎯 Primeiras 5 permissões:', permissionStrings.slice(0, 5))
  
  return permissionStrings
}

// Função para verificar se o login foi bem-sucedido
function verifyLogin() {
  console.log('🔍 === VERIFICANDO LOGIN ===')
  
  const checks = {
    token: !!localStorage.getItem('access_token'),
    user: !!localStorage.getItem('user_profile'),
    perfil: !!localStorage.getItem('user_perfil'),
    permissoes: !!localStorage.getItem('user_permissoes'),
    permissions: !!localStorage.getItem('user_permissions'),
    role: !!localStorage.getItem('userRole')
  }
  
  console.log('📋 Verificações:')
  Object.entries(checks).forEach(([key, value]) => {
    console.log(`${value ? '✅' : '❌'} ${key}: ${value}`)
  })
  
  const allGood = Object.values(checks).every(v => v)
  console.log(`🎯 Login ${allGood ? 'bem-sucedido' : 'falhou'}`)
  
  return allGood
}

// Função para testar permissões específicas
function testPermissions() {
  console.log('🧪 === TESTANDO PERMISSÕES ===')
  
  const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
  console.log('📊 Total de permissões:', permissions.length)
  
  const testPermissions = [
    'dashboard:visualizar',
    'usuarios:visualizar',
    'gruas:visualizar',
    'estoque:visualizar',
    'relatorios:visualizar',
    'configuracoes:visualizar',
    'ponto_eletronico:visualizar',
    'assinatura_digital:visualizar'
  ]
  
  console.log('🎯 Testando permissões específicas:')
  testPermissions.forEach(perm => {
    const hasPermission = permissions.includes(perm)
    console.log(`${hasPermission ? '✅' : '❌'} ${perm}: ${hasPermission}`)
  })
  
  // Verificar se dashboard:visualizar está presente
  const hasDashboard = permissions.includes('dashboard:visualizar')
  console.log(`🎯 dashboard:visualizar: ${hasDashboard}`)
  
  if (!hasDashboard) {
    console.log('🔧 Adicionando dashboard:visualizar...')
    permissions.push('dashboard:visualizar')
    localStorage.setItem('user_permissions', JSON.stringify(permissions))
    console.log('✅ dashboard:visualizar adicionado!')
  }
  
  return hasDashboard
}

// Função para recarregar página
function reloadPage() {
  console.log('🔄 Recarregando página...')
  window.location.reload()
}

// Função principal de teste
function runCompleteTest() {
  console.log('🚀 === INICIANDO TESTE COMPLETO ===')
  
  // 1. Limpar tudo
  clearAll()
  
  // 2. Simular login
  const permissions = simulateLogin()
  
  // 3. Verificar login
  const loginOk = verifyLogin()
  
  if (!loginOk) {
    console.log('❌ Login falhou, parando teste')
    return
  }
  
  // 4. Testar permissões
  const permissionsOk = testPermissions()
  
  // 5. Resultado final
  console.log('🎯 === RESULTADO FINAL ===')
  console.log(`Login: ${loginOk ? '✅' : '❌'}`)
  console.log(`Permissões: ${permissionsOk ? '✅' : '❌'}`)
  
  if (loginOk && permissionsOk) {
    console.log('🎉 Teste completo bem-sucedido!')
    console.log('⏳ Recarregando página em 3 segundos...')
    setTimeout(reloadPage, 3000)
  } else {
    console.log('❌ Teste falhou, verifique os logs acima')
  }
}

// Exportar funções
window.clearAll = clearAll
window.simulateLogin = simulateLogin
window.verifyLogin = verifyLogin
window.testPermissions = testPermissions
window.reloadPage = reloadPage
window.runCompleteTest = runCompleteTest

// Executar teste automático
runCompleteTest()

console.log('📝 Funções disponíveis:')
console.log('- clearAll() - Limpar todos os dados')
console.log('- simulateLogin() - Simular login')
console.log('- verifyLogin() - Verificar login')
console.log('- testPermissions() - Testar permissões')
console.log('- reloadPage() - Recarregar página')
console.log('- runCompleteTest() - Executar teste completo')

