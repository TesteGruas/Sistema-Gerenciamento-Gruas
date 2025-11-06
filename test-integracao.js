#!/usr/bin/env node

/**
 * Script de teste rápido para validar integração frontend/backend
 * 
 * Uso:
 *   node test-integracao.js
 * 
 * Requisitos:
 *   - Backend rodando em http://localhost:3001
 *   - Token de autenticação válido (copie do localStorage após login)
 */

const API_URL = process.env.API_URL || 'http://localhost:3001'
const TOKEN = process.env.TOKEN || ''

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testEndpoint(method, endpoint, description, data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    }

    if (data) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(`${API_URL}${endpoint}`, options)
    const responseData = await response.json()

    if (response.ok) {
      log(`✅ ${description}`, 'green')
      return { success: true, data: responseData }
    } else {
      log(`❌ ${description} - Status: ${response.status}`, 'red')
      log(`   Erro: ${responseData.message || responseData.error}`, 'red')
      return { success: false, error: responseData }
    }
  } catch (error) {
    log(`❌ ${description} - Erro: ${error.message}`, 'red')
    return { success: false, error: error.message }
  }
}

async function runTests() {
  log('\n🧪 Iniciando testes de integração...\n', 'blue')

  if (!TOKEN) {
    log('⚠️  AVISO: Token não fornecido. Use: TOKEN=seu_token node test-integracao.js', 'yellow')
    log('   Ou defina a variável API_URL se necessário: API_URL=http://localhost:3001\n', 'yellow')
  }

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  }

  // Teste 1: Verificar se backend está rodando
  log('📡 Testando conexão com backend...', 'blue')
  try {
    const healthCheck = await fetch(`${API_URL}/api/health`).catch(() => null)
    if (!healthCheck) {
      log('❌ Backend não está respondendo. Verifique se está rodando na porta 3001', 'red')
      return
    }
    log('✅ Backend está rodando\n', 'green')
  } catch (error) {
    log('⚠️  Não foi possível verificar saúde do backend (isso é normal se não houver endpoint /health)\n', 'yellow')
  }

  if (!TOKEN) {
    log('⚠️  Testes que requerem autenticação serão pulados sem token\n', 'yellow')
  }

  // Teste 2: Endpoint de alertas de fim de obra
  log('📋 Testando endpoint de alertas...', 'blue')
  const alertasTest = await testEndpoint(
    'GET',
    '/api/obras/alertas/fim-proximo',
    'GET /api/obras/alertas/fim-proximo'
  )
  if (alertasTest.success) results.passed++
  else if (!TOKEN) results.skipped++
  else results.failed++
  console.log()

  // Teste 3: Verificar estrutura de resposta de obras
  log('📋 Testando estrutura de obras...', 'blue')
  const obrasTest = await testEndpoint(
    'GET',
    '/api/obras?limit=1',
    'GET /api/obras (verificar novos campos)'
  )
  if (obrasTest.success) {
    const obra = obrasTest.data?.data?.[0]
    if (obra) {
      const hasNewFields = obra.cno !== undefined || obra.art_numero !== undefined
      if (hasNewFields) {
        log('✅ Campos novos (CNO, ART, Apólice) presentes na resposta', 'green')
      } else {
        log('⚠️  Campos novos não encontrados na resposta (pode ser obra antiga)', 'yellow')
      }
    }
    results.passed++
  } else if (!TOKEN) {
    results.skipped++
  } else {
    results.failed++
  }
  console.log()

  // Teste 4: Verificar estrutura de cargos
  log('📋 Testando estrutura de cargos...', 'blue')
  const cargosTest = await testEndpoint(
    'GET',
    '/api/cargos?limit=1',
    'GET /api/cargos (verificar acesso_global_obras)'
  )
  if (cargosTest.success) {
    const cargo = cargosTest.data?.data?.[0]
    if (cargo && cargo.acesso_global_obras !== undefined) {
      log('✅ Campo acesso_global_obras presente na resposta', 'green')
    } else {
      log('⚠️  Campo acesso_global_obras não encontrado', 'yellow')
    }
    results.passed++
  } else if (!TOKEN) {
    results.skipped++
  } else {
    results.failed++
  }
  console.log()

  // Resumo
  log('\n📊 Resumo dos Testes:', 'blue')
  log(`✅ Passou: ${results.passed}`, 'green')
  log(`❌ Falhou: ${results.failed}`, 'red')
  log(`⏭️  Pulado: ${results.skipped}`, 'yellow')
  console.log()

  if (results.failed > 0) {
    log('⚠️  Alguns testes falharam. Verifique:', 'yellow')
    log('   1. Backend está rodando?', 'yellow')
    log('   2. Migrations foram aplicadas?', 'yellow')
    log('   3. Token de autenticação está válido?', 'yellow')
    process.exit(1)
  } else if (results.passed > 0) {
    log('✅ Testes básicos passaram!', 'green')
    log('   Para testes completos, use o navegador conforme GUIA-TESTES-INTEGRACAO.md', 'yellow')
  }
}

// Executar testes
runTests().catch(error => {
  log(`\n❌ Erro fatal: ${error.message}`, 'red')
  process.exit(1)
})


