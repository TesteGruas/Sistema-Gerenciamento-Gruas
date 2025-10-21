// Script para testar o sistema de permissões
// Execute no console do navegador após fazer login

console.log('🔐 Testando sistema de permissões...')

// Dados mockados do usuário admin
const mockUserData = {
  user: {
    id: 2,
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

// Simular login
function simulateLogin() {
  console.log('🔐 Simulando login com dados mockados...')
  
  // Salvar dados no localStorage
  localStorage.setItem('access_token', 'mock-token-admin')
  localStorage.setItem('user_profile', JSON.stringify(mockUserData.user))
  localStorage.setItem('user_perfil', JSON.stringify(mockUserData.perfil))
  localStorage.setItem('user_permissoes', JSON.stringify(mockUserData.permissoes))
  
  console.log('✅ Dados salvos no localStorage')
  console.log('👤 Usuário:', mockUserData.user)
  console.log('👥 Perfil:', mockUserData.perfil)
  console.log('🔐 Permissões:', mockUserData.permissoes.length)
  
  // Recarregar a página para aplicar as mudanças
  console.log('🔄 Recarregando página...')
  window.location.reload()
}

// Função para testar permissões específicas
function testPermissions() {
  const permissions = JSON.parse(localStorage.getItem('user_permissoes') || '[]')
  const permissionStrings = permissions.map(p => `${p.modulo}:${p.acao}`)
  
  console.log('🔐 Permissões carregadas:', permissionStrings)
  
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
  
  console.log('🧪 Testando permissões:')
  testCases.forEach(permission => {
    const hasAccess = permissionStrings.includes(permission)
    console.log(`  ${permission}: ${hasAccess ? '✅' : '❌'}`)
  })
}

// Executar teste
console.log('🚀 Para testar o sistema:')
console.log('1. Execute: simulateLogin()')
console.log('2. Após recarregar, execute: testPermissions()')

// Exportar funções para uso no console
window.simulateLogin = simulateLogin
window.testPermissions = testPermissions
