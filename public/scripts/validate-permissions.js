// Script final para validar permissões e corrigir problemas
// Execute no console do navegador

console.log('🔍 === VALIDAÇÃO FINAL DE PERMISSÕES ===')

// Função para verificar estado atual
function checkCurrentState() {
  console.log('📦 === ESTADO ATUAL ===')
  
  const state = {
    token: localStorage.getItem('access_token'),
    user: localStorage.getItem('user_profile'),
    perfil: localStorage.getItem('user_perfil'),
    permissoes: localStorage.getItem('user_permissoes'),
    permissions: localStorage.getItem('user_permissions'),
    role: localStorage.getItem('userRole')
  }
  
  Object.entries(state).forEach(([key, value]) => {
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
  
  return state
}

// Função para verificar permissões específicas
function checkSpecificPermissions() {
  console.log('🔐 === VERIFICAÇÃO DE PERMISSÕES ESPECÍFICAS ===')
  
  const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
  console.log('📊 Total de permissões:', permissions.length)
  
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
  
  console.log('🎯 Verificando permissões obrigatórias:')
  const missingPermissions = []
  
  requiredPermissions.forEach(perm => {
    const hasPermission = permissions.includes(perm)
    console.log(`${hasPermission ? '✅' : '❌'} ${perm}: ${hasPermission}`)
    if (!hasPermission) {
      missingPermissions.push(perm)
    }
  })
  
  if (missingPermissions.length > 0) {
    console.log('❌ Permissões faltando:', missingPermissions)
    return false
  } else {
    console.log('✅ Todas as permissões obrigatórias estão presentes!')
    return true
  }
}

// Função para corrigir permissões faltando
function fixMissingPermissions() {
  console.log('🔧 === CORRIGINDO PERMISSÕES FALTANDO ===')
  
  const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
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
  
  let addedCount = 0
  
  requiredPermissions.forEach(perm => {
    if (!permissions.includes(perm)) {
      console.log(`🔧 Adicionando ${perm}...`)
      permissions.push(perm)
      addedCount++
    }
  })
  
  if (addedCount > 0) {
    localStorage.setItem('user_permissions', JSON.stringify(permissions))
    console.log(`✅ ${addedCount} permissões adicionadas!`)
  } else {
    console.log('✅ Todas as permissões já estavam presentes!')
  }
  
  return addedCount
}

// Função para testar verificação de permissão
function testPermissionVerification() {
  console.log('🧪 === TESTANDO VERIFICAÇÃO DE PERMISSÃO ===')
  
  const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]')
  const testPermission = 'dashboard:visualizar'
  
  console.log(`🔍 Testando verificação de ${testPermission}...`)
  console.log(`📋 Permissões disponíveis: ${permissions.length}`)
  console.log(`🎯 Tem ${testPermission}? ${permissions.includes(testPermission)}`)
  
  if (permissions.includes(testPermission)) {
    console.log('✅ Verificação de permissão funcionando!')
    return true
  } else {
    console.log('❌ Verificação de permissão falhou!')
    return false
  }
}

// Função para recarregar página
function reloadPage() {
  console.log('🔄 Recarregando página...')
  window.location.reload()
}

// Função principal de validação
function runValidation() {
  console.log('🚀 === INICIANDO VALIDAÇÃO COMPLETA ===')
  
  // 1. Verificar estado atual
  const state = checkCurrentState()
  
  // 2. Verificar permissões específicas
  const permissionsOk = checkSpecificPermissions()
  
  // 3. Se não estiver ok, corrigir
  if (!permissionsOk) {
    console.log('🔧 Corrigindo permissões...')
    const addedCount = fixMissingPermissions()
    
    if (addedCount > 0) {
      console.log('✅ Permissões corrigidas!')
    }
  }
  
  // 4. Testar verificação
  const verificationOk = testPermissionVerification()
  
  // 5. Resultado final
  console.log('🎯 === RESULTADO FINAL ===')
  console.log(`Estado: ${Object.values(state).every(v => v) ? '✅' : '❌'}`)
  console.log(`Permissões: ${permissionsOk ? '✅' : '❌'}`)
  console.log(`Verificação: ${verificationOk ? '✅' : '❌'}`)
  
  if (permissionsOk && verificationOk) {
    console.log('🎉 Validação bem-sucedida!')
    console.log('⏳ Recarregando página em 3 segundos...')
    setTimeout(reloadPage, 3000)
  } else {
    console.log('❌ Validação falhou, verifique os logs acima')
  }
}

// Exportar funções
window.checkCurrentState = checkCurrentState
window.checkSpecificPermissions = checkSpecificPermissions
window.fixMissingPermissions = fixMissingPermissions
window.testPermissionVerification = testPermissionVerification
window.reloadPage = reloadPage
window.runValidation = runValidation

// Executar validação automática
runValidation()

console.log('📝 Funções disponíveis:')
console.log('- checkCurrentState() - Verificar estado atual')
console.log('- checkSpecificPermissions() - Verificar permissões específicas')
console.log('- fixMissingPermissions() - Corrigir permissões faltando')
console.log('- testPermissionVerification() - Testar verificação')
console.log('- reloadPage() - Recarregar página')
console.log('- runValidation() - Executar validação completa')
