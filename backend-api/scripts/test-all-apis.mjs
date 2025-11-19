#!/usr/bin/env node

/**
 * Script de Teste Completo de APIs
 * 
 * Este script faz login e testa todas as APIs do sistema
 * Organizado por módulos/telas do sistema
 * 
 * Uso:
 *   node scripts/test-all-apis.js
 * 
 * Variáveis de ambiente (opcional):
 *   API_URL=http://localhost:3001
 *   TEST_EMAIL=seu@email.com
 *   TEST_PASSWORD=suasenha
 */

import axios from 'axios'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '../backend-api/.env') })

// Configuração
const API_URL = process.env.API_URL || 'http://127.0.0.1:3001'
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@admin.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'teste@123'

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
}

// Estatísticas
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
}

let authToken = null
let userId = null

  // Função para fazer requisições
async function makeRequest(method, endpoint, data = null, requiresAuth = true) {
  const url = `${API_URL}${endpoint}`
  
  const config = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      ...(requiresAuth && authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
    },
    ...(data ? { data } : {}),
    timeout: 30000,
    validateStatus: function (status) {
      return status < 500 // Não lançar erro para status < 500
    }
  }

  try {
    const response = await axios(config)
    return { success: true, status: response.status, data: response.data, error: null }
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      data: error.response?.data || null,
      error: error.message
    }
  }
}

// Função para testar uma rota
async function testRoute(name, method, endpoint, data = null, requiresAuth = true, expectedStatus = 200) {
  stats.total++
  process.stdout.write(`  ${colors.gray}→${colors.reset} ${name}... `)

  const result = await makeRequest(method, endpoint, data, requiresAuth)

  if (result.success && (result.status === expectedStatus || result.status < 400)) {
    stats.passed++
    console.log(`${colors.green}✓${colors.reset} (${result.status})`)
    return { success: true, result }
  } else {
    stats.failed++
    const statusMsg = result.status ? ` (${result.status})` : ''
    console.log(`${colors.red}✗${colors.reset}${statusMsg}`)
    if (result.error) {
      console.log(`    ${colors.red}Erro: ${result.error}${colors.reset}`)
    }
    if (result.data?.message) {
      console.log(`    ${colors.yellow}Mensagem: ${result.data.message}${colors.reset}`)
    }
    return { success: false, result }
  }
}

// Função para pular teste
function skipTest(name, reason = '') {
  stats.total++
  stats.skipped++
  console.log(`  ${colors.yellow}⊘${colors.reset} ${name} ${colors.gray}${reason}${colors.reset}`)
}

// Função para imprimir seção
function printSection(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`)
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`)
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`)
}

// ============================================
// TESTES
// ============================================

async function testAuth() {
  printSection('🔐 AUTENTICAÇÃO')

  // Login
  const loginResult = await testRoute(
    'Login',
    'POST',
    '/api/auth/login',
    { email: TEST_EMAIL, password: TEST_PASSWORD },
    false,
    200
  )

  // A API retorna: {success: true, data: {access_token: ..., user: ..., profile: ...}}
  const apiResponse = loginResult.result?.data
  const responseData = apiResponse?.data || apiResponse
  const token = responseData?.access_token || 
                responseData?.session?.access_token || 
                responseData?.token
  
  if (loginResult.success && token) {
    authToken = token
    userId = responseData?.user?.id || 
             responseData?.profile?.id ||
             responseData?.user?.user_metadata?.sub
    console.log(`  ${colors.green}Token obtido com sucesso!${colors.reset}`)
    console.log(`  ${colors.gray}User ID: ${userId}${colors.reset}\n`)
  } else {
    console.log(`  ${colors.red}ERRO: Não foi possível fazer login. Abortando testes.${colors.reset}`)
    console.log(`  ${colors.yellow}Debug - Estrutura completa: ${JSON.stringify(loginResult.result?.data).substring(0, 500)}${colors.reset}`)
    process.exit(1)
  }

  // Verificar token
  await testRoute('Verificar Token', 'GET', '/api/auth/me', null, true, 200)
}

async function testUsuarios() {
  printSection('👥 USUÁRIOS')

  await testRoute('Listar Usuários', 'GET', '/api/users?page=1&limit=10')
  
  // Buscar um usuário válido (integer) da lista
  const usersResult = await makeRequest('GET', '/api/users?limit=1', null, true)
  let validUserId = null
  
  if (usersResult.success && usersResult.data?.data?.length > 0) {
    validUserId = usersResult.data.data[0].id
    await testRoute('Buscar Usuário por ID', 'GET', `/api/users/${validUserId}`)
  } else {
    skipTest('Buscar Usuário por ID', '(nenhum usuário encontrado)')
  }
}

async function testGruas() {
  printSection('🏗️ GRUAS')

  await testRoute('Listar Gruas', 'GET', '/api/gruas?page=1&limit=10')
  
  // Buscar uma grua para testes
  const gruasResult = await makeRequest('GET', '/api/gruas?limit=1', null, true)
  let gruaId = null
  
  if (gruasResult.success && gruasResult.data?.data?.length > 0) {
    gruaId = gruasResult.data.data[0].id
    await testRoute('Buscar Grua por ID', 'GET', `/api/gruas/${gruaId}`)
    await testRoute('Listar Componentes da Grua', 'GET', `/api/grua-componentes?grua_id=${gruaId}`)
    await testRoute('Listar Configurações da Grua', 'GET', `/api/grua-configuracoes?grua_id=${gruaId}`)
  } else {
    skipTest('Buscar Grua por ID', '(nenhuma grua encontrada)')
    skipTest('Listar Componentes', '(nenhuma grua encontrada)')
  }
}

async function testComponentes() {
  printSection('🔧 COMPONENTES DE GRUA')

  await testRoute('Listar Componentes', 'GET', '/api/grua-componentes?page=1&limit=10')
}

async function testObras() {
  printSection('🏢 OBRAS')

  await testRoute('Listar Obras', 'GET', '/api/obras?page=1&limit=10')
  
  const obrasResult = await makeRequest('GET', '/api/obras?limit=1', null, true)
  let obraId = null
  
  if (obrasResult.success && obrasResult.data?.data?.length > 0) {
    obraId = obrasResult.data.data[0].id
    await testRoute('Buscar Obra por ID', 'GET', `/api/obras/${obraId}`)
    await testRoute('Listar Gruas da Obra', 'GET', `/api/obra-gruas?obra_id=${obraId}`)
  } else {
    skipTest('Buscar Obra por ID', '(nenhuma obra encontrada)')
  }
}

async function testClientes() {
  printSection('👤 CLIENTES')

  await testRoute('Listar Clientes', 'GET', '/api/clientes?page=1&limit=10')
  
  const clientesResult = await makeRequest('GET', '/api/clientes?limit=1', null, true)
  let clienteId = null
  
  if (clientesResult.success && clientesResult.data?.data?.length > 0) {
    clienteId = clientesResult.data.data[0].id
    await testRoute('Buscar Cliente por ID', 'GET', `/api/clientes/${clienteId}`)
  } else {
    skipTest('Buscar Cliente por ID', '(nenhum cliente encontrado)')
  }
}

async function testOrcamentos() {
  printSection('💰 ORÇAMENTOS')

  await testRoute('Listar Orçamentos', 'GET', '/api/orcamentos?page=1&limit=10')
  
  const orcamentosResult = await makeRequest('GET', '/api/orcamentos?limit=1', null, true)
  let orcamentoId = null
  
  if (orcamentosResult.success && orcamentosResult.data?.data?.length > 0) {
    orcamentoId = orcamentosResult.data.data[0].id
    await testRoute('Buscar Orçamento por ID', 'GET', `/api/orcamentos/${orcamentoId}`)
    await testRoute('Gerar PDF do Orçamento', 'GET', `/api/relatorios/orcamentos/${orcamentoId}/pdf`)
    await testRoute('Listar Medições do Orçamento', 'GET', `/api/medicoes-mensais/orcamento/${orcamentoId}`)
  } else {
    skipTest('Buscar Orçamento por ID', '(nenhum orçamento encontrado)')
  }
}

async function testMedicoes() {
  printSection('📊 MEDIÇÕES MENSAIS')

  await testRoute('Listar Medições Mensais', 'GET', '/api/medicoes-mensais?page=1&limit=10')
  
  const medicoesResult = await makeRequest('GET', '/api/medicoes-mensais?limit=1', null, true)
  let medicaoId = null
  
  if (medicoesResult.success && medicoesResult.data?.data?.length > 0) {
    medicaoId = medicoesResult.data.data[0].id
    await testRoute('Buscar Medição por ID', 'GET', `/api/medicoes-mensais/${medicaoId}`)
  } else {
    skipTest('Buscar Medição por ID', '(nenhuma medição encontrada)')
  }
}

async function testEstoque() {
  printSection('📦 ESTOQUE')

  await testRoute('Listar Itens em Estoque', 'GET', '/api/estoque?page=1&limit=10')
  await testRoute('Listar Movimentações', 'GET', '/api/estoque/movimentacoes?page=1&limit=10')
}

async function testProdutos() {
  printSection('🛍️ PRODUTOS')

  await testRoute('Listar Produtos', 'GET', '/api/produtos?page=1&limit=10')
}

async function testFuncionarios() {
  printSection('👷 FUNCIONÁRIOS')

  await testRoute('Listar Funcionários', 'GET', '/api/funcionarios?page=1&limit=10')
  
  const funcionariosResult = await makeRequest('GET', '/api/funcionarios?limit=1', null, true)
  let funcionarioId = null
  
  if (funcionariosResult.success && funcionariosResult.data?.data?.length > 0) {
    funcionarioId = funcionariosResult.data.data[0].id
    await testRoute('Buscar Funcionário por ID', 'GET', `/api/funcionarios/${funcionarioId}`)
  } else {
    skipTest('Buscar Funcionário por ID', '(nenhum funcionário encontrado)')
  }
}

async function testPontoEletronico() {
  printSection('⏰ PONTO ELETRÔNICO')

  await testRoute('Listar Registros de Ponto', 'GET', '/api/ponto-eletronico?page=1&limit=10')
  await testRoute('Gráficos de Ponto', 'GET', '/api/ponto-eletronico/graficos?mes=2025-02')
}

async function testContratos() {
  printSection('📄 CONTRATOS')

  await testRoute('Listar Contratos', 'GET', '/api/contratos?page=1&limit=10')
}

async function testLocacoes() {
  printSection('🚚 LOCAÇÕES')

  await testRoute('Listar Locações', 'GET', '/api/locacoes?page=1&limit=10')
}

async function testVendas() {
  printSection('💵 VENDAS')

  await testRoute('Listar Vendas', 'GET', '/api/vendas?page=1&limit=10')
}

async function testCompras() {
  printSection('🛒 COMPRAS')

  await testRoute('Listar Compras', 'GET', '/api/compras?page=1&limit=10')
}

async function testFinanceiro() {
  printSection('💳 FINANCEIRO')

  await testRoute('Dados Financeiros', 'GET', '/api/financial-data')
  await testRoute('Listar Receitas', 'GET', '/api/receitas?page=1&limit=10')
  await testRoute('Listar Contas a Receber', 'GET', '/api/contas-receber?page=1&limit=10')
  await testRoute('Listar Contas a Pagar', 'GET', '/api/contas-pagar?page=1&limit=10')
  await testRoute('Rentabilidade', 'GET', '/api/rentabilidade?data_inicio=2025-01-01&data_fim=2025-12-31')
}

async function testRelatorios() {
  printSection('📋 RELATÓRIOS')

  const orcamentosResult = await makeRequest('GET', '/api/orcamentos?limit=1', null, true)
  let orcamentoId = null
  
  if (orcamentosResult.success && orcamentosResult.data?.data?.length > 0) {
    orcamentoId = orcamentosResult.data.data[0].id
    await testRoute('Relatório de Medições (PDF)', 'GET', `/api/relatorios/medicoes/${orcamentoId}/pdf`)
  } else {
    skipTest('Relatório de Medições', '(nenhum orçamento encontrado)')
  }
  
  await testRoute('Relatório de Componentes (PDF)', 'GET', '/api/relatorios/componentes-estoque/pdf')
}

async function testNotificacoes() {
  printSection('🔔 NOTIFICAÇÕES')

  await testRoute('Listar Notificações', 'GET', '/api/notificacoes?page=1&limit=10')
}

async function testBuscaGlobal() {
  printSection('🔍 BUSCA GLOBAL')

  await testRoute('Busca Global', 'GET', '/api/busca-global?q=teste')
}

async function testPermissoes() {
  printSection('🔐 PERMISSÕES')

  await testRoute('Listar Permissões', 'GET', '/api/permissoes')
  await testRoute('Listar Cargos', 'GET', '/api/cargos')
}

async function testRH() {
  printSection('👔 RECURSOS HUMANOS')

  await testRoute('Dados RH', 'GET', '/api/rh/dashboard')
  await testRoute('Listar Férias', 'GET', '/api/ferias?page=1&limit=10')
  await testRoute('Listar Vales', 'GET', '/api/vales?page=1&limit=10')
  await testRoute('Listar Remunerações', 'GET', '/api/remuneracao?page=1&limit=10')
}

async function testManutencoes() {
  printSection('🔧 MANUTENÇÕES')

  await testRoute('Listar Manutenções', 'GET', '/api/manutencoes?page=1&limit=10')
}

async function testLivroGrua() {
  printSection('📖 LIVRO DE GRUA')

  await testRoute('Listar Registros do Livro', 'GET', '/api/livro-grua?page=1&limit=10')
}

async function testChecklist() {
  printSection('✅ CHECKLIST')

  await testRoute('Listar Checklists Diários', 'GET', '/api/checklist-diario?page=1&limit=10')
  await testRoute('Listar Checklists de Devolução', 'GET', '/api/checklist-devolucao?page=1&limit=10')
}

// ============================================
// EXECUÇÃO PRINCIPAL
// ============================================

async function main() {
  console.log(`\n${colors.bright}${colors.blue}`)
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║     TESTE COMPLETO DE APIs - Sistema de Gerenciamento     ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log(`${colors.reset}`)
  console.log(`${colors.gray}API URL: ${API_URL}${colors.reset}`)
  console.log(`${colors.gray}Email: ${TEST_EMAIL}${colors.reset}\n`)

  const startTime = Date.now()

  try {
    // Testes principais
    await testAuth()
    await testUsuarios()
    await testGruas()
    await testComponentes()
    await testObras()
    await testClientes()
    await testOrcamentos()
    await testMedicoes()
    await testEstoque()
    await testProdutos()
    await testFuncionarios()
    await testPontoEletronico()
    await testContratos()
    await testLocacoes()
    await testVendas()
    await testCompras()
    await testFinanceiro()
    await testRelatorios()
    await testNotificacoes()
    await testBuscaGlobal()
    await testPermissoes()
    await testRH()
    await testManutencoes()
    await testLivroGrua()
    await testChecklist()

    // Resumo
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`)
    console.log(`${colors.bright}RESUMO DOS TESTES${colors.reset}`)
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`)

    console.log(`  Total de testes:     ${colors.bright}${stats.total}${colors.reset}`)
    console.log(`  ${colors.green}✓ Passou:            ${stats.passed}${colors.reset}`)
    console.log(`  ${colors.red}✗ Falhou:            ${stats.failed}${colors.reset}`)
    console.log(`  ${colors.yellow}⊘ Pulado:            ${stats.skipped}${colors.reset}`)
    console.log(`  Tempo de execução:   ${duration}s\n`)

    const successRate = ((stats.passed / (stats.total - stats.skipped)) * 100).toFixed(1)
    console.log(`  Taxa de sucesso:     ${successRate >= 80 ? colors.green : successRate >= 50 ? colors.yellow : colors.red}${successRate}%${colors.reset}\n`)

    if (stats.failed > 0) {
      console.log(`${colors.yellow}⚠ Alguns testes falharam. Verifique os logs acima.${colors.reset}\n`)
      process.exit(1)
    } else {
      console.log(`${colors.green}✓ Todos os testes passaram!${colors.reset}\n`)
      process.exit(0)
    }

  } catch (error) {
    console.error(`\n${colors.red}ERRO FATAL: ${error.message}${colors.reset}`)
    console.error(error.stack)
    process.exit(1)
  }
}

// Executar
main()

