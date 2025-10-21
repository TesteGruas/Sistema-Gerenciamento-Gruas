// Script para testar login real com credenciais do admin
// Execute no console do navegador após acessar o frontend

console.log('🔐 Testando login real com admin@admin.com...')

// Dados reais obtidos do backend
const realUserData = {
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

// Token real obtido do login
const realToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6ImIza0FDV3E2dGdIeTRmQWQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL21naGRrdGtvZWpvYnNtZGJ2c3NsLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI2YjNjZDVhOC0yOTkxLTQwYTItODIzNy1jNjRhZmM0MzEzMjAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYwOTk0OTg5LCJpYXQiOjE3NjA5OTEzODksImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJub21lIjoiQWRtaW5pc3RyYWRvciIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicm9sZSI6ImFkbWluIiwic3ViIjoiNmIzY2Q1YTgtMjk5MS00MGEyLTgyMzctYzY0YWZjNDMxMzIwIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjA5OTEzODl9XSwic2Vzc2lvbl9pZCI6ImRmMzZmNTdjLWU4ZGItNDBhMi05YzVlLTAzZTNhMDJmNzNjNCIsImlzX2Fub255bW91cyI6ZmFsc2V9.TiG90tofCzSTxnaUAxlqQ92y5tUPWhdIKfH6_Jn49MU"

// Simular login real
function simulateRealLogin() {
  console.log('🔐 Simulando login real com dados do backend...')
  
  // Salvar dados reais no localStorage
  localStorage.setItem('access_token', realToken)
  localStorage.setItem('user_profile', JSON.stringify(realUserData.user))
  localStorage.setItem('user_perfil', JSON.stringify(realUserData.perfil))
  localStorage.setItem('user_permissoes', JSON.stringify(realUserData.permissoes))
  
  console.log('✅ Dados reais salvos no localStorage')
  console.log('👤 Usuário:', realUserData.user)
  console.log('👥 Perfil:', realUserData.perfil)
  console.log('🔐 Permissões:', realUserData.permissoes.length)
  
  // Recarregar a página para aplicar as mudanças
  console.log('🔄 Recarregando página...')
  window.location.reload()
}

// Função para testar permissões específicas
function testRealPermissions() {
  const permissions = JSON.parse(localStorage.getItem('user_permissoes') || '[]')
  const permissionStrings = permissions.map(p => `${p.modulo}:${p.acao}`)
  
  console.log('🔐 Permissões reais carregadas:', permissionStrings)
  
  const testCases = [
    'dashboard:visualizar',
    'usuarios:visualizar',
    'gruas:visualizar',
    'estoque:visualizar',
    'relatorios:visualizar',
    'configuracoes:visualizar',
    'ponto_eletronico:visualizar',
    'assinatura_digital:visualizar'
  ]
  
  console.log('🧪 Testando permissões reais:')
  testCases.forEach(permission => {
    const hasAccess = permissionStrings.includes(permission)
    console.log(`  ${permission}: ${hasAccess ? '✅' : '❌'}`)
  })
}

// Função para verificar se o sistema está funcionando
function checkSystemStatus() {
  console.log('🔍 Verificando status do sistema...')
  
  const token = localStorage.getItem('access_token')
  const user = localStorage.getItem('user_profile')
  const perfil = localStorage.getItem('user_perfil')
  const permissoes = localStorage.getItem('user_permissoes')
  
  console.log('Token:', token ? '✅ Presente' : '❌ Ausente')
  console.log('Usuário:', user ? '✅ Presente' : '❌ Ausente')
  console.log('Perfil:', perfil ? '✅ Presente' : '❌ Ausente')
  console.log('Permissões:', permissoes ? '✅ Presente' : '❌ Ausente')
  
  if (permissoes) {
    const perms = JSON.parse(permissoes)
    console.log(`Total de permissões: ${perms.length}`)
  }
}

// Executar teste
console.log('🚀 Para testar o sistema com dados reais:')
console.log('1. Execute: simulateRealLogin()')
console.log('2. Após recarregar, execute: testRealPermissions()')
console.log('3. Para verificar status: checkSystemStatus()')

// Exportar funções para uso no console
window.simulateRealLogin = simulateRealLogin
window.testRealPermissions = testRealPermissions
window.checkSystemStatus = checkSystemStatus
