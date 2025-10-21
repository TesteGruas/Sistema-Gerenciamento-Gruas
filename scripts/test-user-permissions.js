// Script para testar permissões de diferentes tipos de usuário
// Execute no console do navegador

console.log('🧪 === TESTE DE PERMISSÕES POR TIPO DE USUÁRIO ===')

// Função para configurar permissões de operador
function setupOperatorPermissions() {
  console.log('👷 Configurando permissões de operador...')
  
  // Limpar dados antigos
  localStorage.clear()
  
  const operatorData = {
    user: {
      id: "operator-123",
      email: "operador@empresa.com",
      nome: "Operador",
      role: "operador"
    },
    perfil: {
      id: 2,
      nome: "Operador",
      nivel_acesso: 4,
      descricao: "Acesso operacional limitado",
      status: "Ativo"
    },
    permissoes: [
      // Apenas permissões básicas
      { id: 1, nome: "dashboard:visualizar", modulo: "dashboard", acao: "visualizar" },
      { id: 2, nome: "gruas:visualizar", modulo: "gruas", acao: "visualizar" },
      { id: 3, nome: "gruas:criar", modulo: "gruas", acao: "criar" },
      { id: 4, nome: "estoque:visualizar", modulo: "estoque", acao: "visualizar" },
      { id: 5, nome: "obras:visualizar", modulo: "obras", acao: "visualizar" }
    ]
  }
  
  const operatorToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJvcGVyYXRvci0xMjMiLCJlbWFpbCI6Im9wZXJhZG9yQGVtcHJlc2EuY29tIiwicm9sZSI6Im9wZXJhZG9yIiwiaWF0IjoxNjQwOTkwMDAwLCJleHAiOjE2NDA5OTM2MDB9.example"
  
  // Salvar no localStorage
  localStorage.setItem('access_token', operatorToken)
  localStorage.setItem('user_profile', JSON.stringify(operatorData.user))
  localStorage.setItem('user_perfil', JSON.stringify(operatorData.perfil))
  localStorage.setItem('user_permissoes', JSON.stringify(operatorData.permissoes))
  localStorage.setItem('userRole', 'operador')
  
  // Converter permissões para formato string
  const permissionStrings = operatorData.permissoes.map(p => `${p.modulo}:${p.acao}`)
  localStorage.setItem('user_permissions', JSON.stringify(permissionStrings))
  
  console.log('✅ Dados de operador configurados!')
  console.log('📊 Permissões:', permissionStrings.length)
  console.log('👤 Perfil:', operatorData.perfil.nome)
  
  return permissionStrings
}

// Função para configurar permissões de admin
function setupAdminPermissions() {
  console.log('👑 Configurando permissões de admin...')
  
  // Limpar dados antigos
  localStorage.clear()
  
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
      // Todas as permissões
      { id: 1, nome: "dashboard:visualizar", modulo: "dashboard", acao: "visualizar" },
      { id: 2, nome: "notificacoes:visualizar", modulo: "notificacoes", acao: "visualizar" },
      { id: 3, nome: "clientes:visualizar", modulo: "clientes", acao: "visualizar" },
      { id: 4, nome: "obras:visualizar", modulo: "obras", acao: "visualizar" },
      { id: 5, nome: "gruas:visualizar", modulo: "gruas", acao: "visualizar" },
      { id: 6, nome: "livros_gruas:visualizar", modulo: "livros_gruas", acao: "visualizar" },
      { id: 7, nome: "estoque:visualizar", modulo: "estoque", acao: "visualizar" },
      { id: 8, nome: "ponto_eletronico:visualizar", modulo: "ponto_eletronico", acao: "visualizar" },
      { id: 9, nome: "rh:visualizar", modulo: "rh", acao: "visualizar" },
      { id: 10, nome: "financeiro:visualizar", modulo: "financeiro", acao: "visualizar" },
      { id: 11, nome: "relatorios:visualizar", modulo: "relatorios", acao: "visualizar" },
      { id: 12, nome: "historico:visualizar", modulo: "historico", acao: "visualizar" },
      { id: 13, nome: "assinatura_digital:visualizar", modulo: "assinatura_digital", acao: "visualizar" },
      { id: 14, nome: "usuarios:visualizar", modulo: "usuarios", acao: "visualizar" },
      { id: 15, nome: "email:configurar", modulo: "email", acao: "configurar" }
    ]
  }
  
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
function testSpecificPermissions() {
  console.log('🧪 === TESTANDO PERMISSÕES ESPECÍFICAS ===')
  
  const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
  const perfil = JSON.parse(localStorage.getItem('user_perfil') || '{}')
  const userRole = localStorage.getItem('userRole')
  
  console.log('👤 Perfil:', perfil.nome)
  console.log('🎭 Role:', userRole)
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
  
  console.log('🎯 Resultado dos testes:')
  menuPermissions.forEach(perm => {
    const hasPermission = permissions.includes(perm)
    const shouldHave = userRole === 'admin' || permissions.includes(perm)
    const status = hasPermission === shouldHave ? '✅' : '❌'
    console.log(`${status} ${perm}: ${hasPermission} (esperado: ${shouldHave})`)
  })
  
  return { permissions, perfil, userRole }
}

// Função para alternar entre usuários
function switchToOperator() {
  console.log('🔄 Alternando para operador...')
  setupOperatorPermissions()
  testSpecificPermissions()
  console.log('⏳ Recarregando página em 2 segundos...')
  setTimeout(() => window.location.reload(), 2000)
}

function switchToAdmin() {
  console.log('🔄 Alternando para admin...')
  setupAdminPermissions()
  testSpecificPermissions()
  console.log('⏳ Recarregando página em 2 segundos...')
  setTimeout(() => window.location.reload(), 2000)
}

// Exportar funções
window.setupOperatorPermissions = setupOperatorPermissions
window.setupAdminPermissions = setupAdminPermissions
window.testSpecificPermissions = testSpecificPermissions
window.switchToOperator = switchToOperator
window.switchToAdmin = switchToAdmin

// Executar teste inicial
console.log('🚀 Executando teste inicial...')
testSpecificPermissions()

console.log('📝 Funções disponíveis:')
console.log('- setupOperatorPermissions() - Configurar como operador')
console.log('- setupAdminPermissions() - Configurar como admin')
console.log('- testSpecificPermissions() - Testar permissões atuais')
console.log('- switchToOperator() - Alternar para operador e recarregar')
console.log('- switchToAdmin() - Alternar para admin e recarregar')
