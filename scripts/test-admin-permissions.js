// Script para testar permissões de admin
// Execute no console do navegador

console.log('🔧 === TESTE DE PERMISSÕES DE ADMIN ===')

// Função para simular dados de admin completos
function setupAdminPermissions() {
  console.log('🚀 Configurando permissões de admin...')
  
  // Limpar dados antigos
  localStorage.clear()
  
  // Dados completos do admin
  const adminData = {
    user: {
      id: "admin-123",
      email: "admin@admin.com",
      nome: "Administrador",
      role: "admin"
    },
    perfil: {
      id: 1,
      nome: "Admin",
      nivel_acesso: 10,
      descricao: "Acesso completo ao sistema",
      status: "Ativo"
    },
    permissoes: [
      // Dashboard
      { id: 1, nome: "dashboard:visualizar", modulo: "dashboard", acao: "visualizar" },
      
      // Notificações
      { id: 2, nome: "notificacoes:visualizar", modulo: "notificacoes", acao: "visualizar" },
      
      // Operacional
      { id: 3, nome: "clientes:visualizar", modulo: "clientes", acao: "visualizar" },
      { id: 4, nome: "obras:visualizar", modulo: "obras", acao: "visualizar" },
      { id: 5, nome: "gruas:visualizar", modulo: "gruas", acao: "visualizar" },
      { id: 6, nome: "livros_gruas:visualizar", modulo: "livros_gruas", acao: "visualizar" },
      { id: 7, nome: "estoque:visualizar", modulo: "estoque", acao: "visualizar" },
      
      // RH
      { id: 8, nome: "ponto_eletronico:visualizar", modulo: "ponto_eletronico", acao: "visualizar" },
      { id: 9, nome: "rh:visualizar", modulo: "rh", acao: "visualizar" },
      
      // Financeiro
      { id: 10, nome: "financeiro:visualizar", modulo: "financeiro", acao: "visualizar" },
      
      // Relatórios
      { id: 11, nome: "relatorios:visualizar", modulo: "relatorios", acao: "visualizar" },
      { id: 12, nome: "historico:visualizar", modulo: "historico", acao: "visualizar" },
      
      // Documentos
      { id: 13, nome: "assinatura_digital:visualizar", modulo: "assinatura_digital", acao: "visualizar" },
      
      // Admin
      { id: 14, nome: "usuarios:visualizar", modulo: "usuarios", acao: "visualizar" },
      { id: 15, nome: "email:configurar", modulo: "email", acao: "configurar" }
    ]
  }
  
  // Token de exemplo
  const adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi0xMjMiLCJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTY0MDk5MDAwMCwiZXhwIjoxNjQwOTkzNjAwfQ.example"
  
  // Salvar no localStorage
  localStorage.setItem('access_token', adminToken)
  localStorage.setItem('user_profile', JSON.stringify(adminData.user))
  localStorage.setItem('user_perfil', JSON.stringify(adminData.perfil))
  localStorage.setItem('user_permissoes', JSON.stringify(adminData.permissoes))
  localStorage.setItem('userRole', 'admin')
  
  // Converter permissões para formato string
  const permissionStrings = adminData.permissoes.map(p => `${p.modulo}:${p.acao}`)
  localStorage.setItem('user_permissions', JSON.stringify(permissionStrings))
  
  console.log('✅ Dados de admin configurados!')
  console.log('📊 Permissões:', permissionStrings.length)
  console.log('👤 Perfil:', adminData.perfil.nome)
  
  return permissionStrings
}

// Função para testar permissões específicas
function testPermissions() {
  console.log('🧪 === TESTANDO PERMISSÕES ===')
  
  const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
  const perfil = JSON.parse(localStorage.getItem('user_perfil') || '{}')
  
  console.log('📋 Perfil:', perfil.nome)
  console.log('📊 Total de permissões:', permissions.length)
  
  // Testar permissões do menu
  const menuPermissions = [
    'dashboard:visualizar',
    'notificacoes:visualizar',
    'clientes:visualizar',
    'obras:visualizar',
    'gruas:visualizar',
    'livros_gruas:visualizar',
    'estoque:visualizar',
    'ponto_eletronico:visualizar',
    'rh:visualizar',
    'financeiro:visualizar',
    'relatorios:visualizar',
    'historico:visualizar',
    'assinatura_digital:visualizar',
    'usuarios:visualizar',
    'email:configurar'
  ]
  
  console.log('🎯 Testando permissões do menu:')
  menuPermissions.forEach(perm => {
    const hasPermission = permissions.includes(perm)
    console.log(`${hasPermission ? '✅' : '❌'} ${perm}`)
  })
  
  // Verificar se é admin
  const isAdmin = perfil.nome === 'Admin' || perfil.nivel_acesso >= 10
  console.log(`👑 É admin? ${isAdmin}`)
  
  return { permissions, perfil, isAdmin }
}

// Função para recarregar a página
function reloadPage() {
  console.log('🔄 Recarregando página...')
  window.location.reload()
}

// Executar teste completo
function runCompleteTest() {
  console.log('🚀 === INICIANDO TESTE COMPLETO ===')
  
  // 1. Configurar permissões de admin
  const permissions = setupAdminPermissions()
  
  // 2. Testar permissões
  const result = testPermissions()
  
  // 3. Mostrar resumo
  console.log('📊 === RESUMO ===')
  console.log(`Perfil: ${result.perfil.nome}`)
  console.log(`Admin: ${result.isAdmin}`)
  console.log(`Permissões: ${result.permissions.length}`)
  
  // 4. Recarregar página
  console.log('⏳ Recarregando página em 2 segundos...')
  setTimeout(reloadPage, 2000)
}

// Exportar funções
window.setupAdminPermissions = setupAdminPermissions
window.testPermissions = testPermissions
window.reloadPage = reloadPage
window.runCompleteTest = runCompleteTest

// Executar teste
runCompleteTest()

console.log('📝 Funções disponíveis:')
console.log('- setupAdminPermissions() - Configurar permissões de admin')
console.log('- testPermissions() - Testar permissões atuais')
console.log('- reloadPage() - Recarregar página')
console.log('- runCompleteTest() - Executar teste completo')
