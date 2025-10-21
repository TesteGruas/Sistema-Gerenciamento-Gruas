// Script para testar o sistema de permissões
// Execute no console do navegador

console.log('🧪 Testando sistema de permissões...')

// Função para simular login com dados reais
function simulateLogin() {
  console.log('🔐 Simulando login com dados reais...')
  
  // Dados reais do admin
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
      descricao: "Acesso completo ao sistema"
    },
    permissoes: [
      { id: 1, nome: "usuarios:visualizar", modulo: "usuarios", acao: "visualizar" },
      { id: 2, nome: "usuarios:criar", modulo: "usuarios", acao: "criar" },
      { id: 3, nome: "usuarios:editar", modulo: "usuarios", acao: "editar" },
      { id: 4, nome: "usuarios:deletar", modulo: "usuarios", acao: "deletar" },
      { id: 6, nome: "usuarios:gerenciar_permissoes", modulo: "usuarios", acao: "gerenciar" },
      { id: 7, nome: "gruas:visualizar", modulo: "gruas", acao: "visualizar" },
      { id: 8, nome: "gruas:criar", modulo: "gruas", acao: "criar" },
      { id: 9, nome: "gruas:editar", modulo: "gruas", acao: "editar" },
      { id: 10, nome: "gruas:deletar", modulo: "gruas", acao: "deletar" },
      { id: 11, nome: "gruas:gerar_proposta", modulo: "gruas", acao: "gerenciar" },
      { id: 12, nome: "gruas:gerenciar_contratos", modulo: "gruas", acao: "gerenciar" },
      { id: 13, nome: "gruas:gerenciar_manutencoes", modulo: "gruas", acao: "gerenciar" },
      { id: 14, nome: "estoque:visualizar", modulo: "estoque", acao: "visualizar" },
      { id: 15, nome: "estoque:criar", modulo: "estoque", acao: "criar" },
      { id: 16, nome: "estoque:editar", modulo: "estoque", acao: "editar" },
      { id: 17, nome: "estoque:deletar", modulo: "estoque", acao: "deletar" },
      { id: 18, nome: "estoque:movimentar", modulo: "estoque", acao: "gerenciar" },
      { id: 19, nome: "estoque:reservar", modulo: "estoque", acao: "gerenciar" },
      { id: 20, nome: "estoque:exportar", modulo: "estoque", acao: "exportar" },
      { id: 21, nome: "relatorios:visualizar", modulo: "relatorios", acao: "visualizar" },
      { id: 22, nome: "relatorios:exportar", modulo: "relatorios", acao: "exportar" },
      { id: 23, nome: "configuracoes:visualizar", modulo: "configuracoes", acao: "visualizar" },
      { id: 24, nome: "configuracoes:editar", modulo: "configuracoes", acao: "editar" }
    ]
  }

  const adminToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6ImIza0FDV3E2dGdIeTRmQWQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL21naGRrdGtvZWpvYnNtZGJ2c3NsLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI2YjNjZDVhOC0yOTkxLTQwYTItODIzNy1jNjRhZmM0MzEzMjAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYwOTk0OTg5LCJpYXQiOjE3NjA5OTEzODksImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJub21lIjoiQWRtaW5pc3RyYWRvciIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicm9sZSI6ImFkbWluIiwic3ViIjoiNmIzY2Q1YTgtMjk5MS00MGEyLTgyMzctYzY0YWZjNDMxMzIwIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjA5OTEzODl9XSwic2Vzc2lvbl9pZCI6ImRmMzZmNTdjLWU4ZGItNDBhMi05YzVlLTAzZTNhMDJmNzNjNCIsImlzX2Fub255bW91cyI6ZmFsc2V9.TiG90tofCzSTxnaUAxlqQ92y5tUPWhdIKfH6_Jn49MU"

  // Limpar dados antigos
  localStorage.clear()
  
  // Salvar dados corretos
  localStorage.setItem('access_token', adminToken)
  localStorage.setItem('user_profile', JSON.stringify(adminData.user))
  localStorage.setItem('user_perfil', JSON.stringify(adminData.perfil))
  localStorage.setItem('user_permissoes', JSON.stringify(adminData.permissoes))
  
  // Converter permissões para formato string
  const permissionStrings = adminData.permissoes.map(p => `${p.modulo}:${p.acao}`)
  localStorage.setItem('user_permissions', JSON.stringify(permissionStrings))
  
  console.log('✅ Login simulado com sucesso!')
  console.log('👤 Usuário:', adminData.user.nome)
  console.log('👥 Perfil:', adminData.perfil.nome)
  console.log('🔐 Permissões:', permissionStrings.length)
  console.log('🎯 Tem dashboard:visualizar?', permissionStrings.includes('dashboard:visualizar'))
  
  return permissionStrings
}

// Função para verificar estado atual
function checkState() {
  console.log('🔍 Verificando estado atual...')
  
  const token = localStorage.getItem('access_token')
  const user = localStorage.getItem('user_profile')
  const perfil = localStorage.getItem('user_perfil')
  const permissoes = localStorage.getItem('user_permissoes')
  const permissions = localStorage.getItem('user_permissions')
  
  console.log('Token:', token ? '✅' : '❌')
  console.log('User:', user ? '✅' : '❌')
  console.log('Perfil:', perfil ? '✅' : '❌')
  console.log('Permissões (array):', permissoes ? '✅' : '❌')
  console.log('Permissões (strings):', permissions ? '✅' : '❌')
  
  if (permissions) {
    const perms = JSON.parse(permissions)
    console.log('Total de permissões:', perms.length)
    console.log('Tem dashboard:visualizar?', perms.includes('dashboard:visualizar'))
    console.log('Primeiras 5 permissões:', perms.slice(0, 5))
  }
  
  return { token, user, perfil, permissoes, permissions }
}

// Função para testar permissão específica
function testPermission(permission) {
  const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
  const hasAccess = permissions.includes(permission)
  console.log(`🔐 Teste "${permission}": ${hasAccess ? '✅' : '❌'}`)
  return hasAccess
}

// Função para recarregar a página
function reload() {
  console.log('🔄 Recarregando página...')
  window.location.reload()
}

// Executar teste automático
console.log('🚀 Executando teste automático...')
const permissions = simulateLogin()
checkState()

console.log('📝 Funções disponíveis:')
console.log('- simulateLogin() - Simular login')
console.log('- checkState() - Verificar estado')
console.log('- testPermission("dashboard:visualizar") - Testar permissão')
console.log('- reload() - Recarregar página')

// Exportar funções
window.simulateLogin = simulateLogin
window.checkState = checkState
window.testPermission = testPermission
window.reload = reload

console.log('✅ Sistema de teste carregado!')
