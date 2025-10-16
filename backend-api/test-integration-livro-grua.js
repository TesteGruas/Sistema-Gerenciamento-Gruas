#!/usr/bin/env node

/**
 * Script de Teste de Integração - Sistema de Livros de Gruas
 * 
 * Este script testa o fluxo completo do sistema de livros de gruas:
 * 1. Login e autenticação
 * 2. Listar relações grua-obra
 * 3. Listar funcionários de uma obra
 * 4. Criar entrada no livro da grua
 * 5. Listar entradas
 * 6. Atualizar entrada
 * 7. Obter estatísticas
 * 8. Exportar CSV
 * 9. Upload de anexo
 * 
 * Uso: node test-integration-livro-grua.js
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Configurações
const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_USER = {
  email: process.env.TEST_EMAIL || 'admin@exemplo.com',
  password: process.env.TEST_PASSWORD || '123456'
};

// Variáveis globais para armazenar dados do teste
let authToken = null;
let testObraId = null;
let testGruaId = null;
let testFuncionarioId = null;
let testLivroGruaId = null;

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Função para fazer requisições HTTP
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  };

  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, finalOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.message || 'Erro desconhecido'}`);
    }
    
    return data;
  } catch (error) {
    throw new Error(`Erro na requisição ${endpoint}: ${error.message}`);
  }
}

// Teste 1: Login e autenticação
async function testLogin() {
  logStep('1', 'Testando login e autenticação...');
  
  try {
    const response = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    });

    if (response.success && response.data.token) {
      authToken = response.data.token;
      logSuccess(`Login realizado com sucesso. Token obtido.`);
      log(`Usuário: ${response.data.user.nome} (${response.data.user.email})`, 'blue');
      return true;
    } else {
      throw new Error('Resposta de login inválida');
    }
  } catch (error) {
    logError(`Falha no login: ${error.message}`);
    return false;
  }
}

// Teste 2: Obter perfil do usuário
async function testGetProfile() {
  logStep('2', 'Testando obtenção do perfil do usuário...');
  
  try {
    const response = await makeRequest('/api/auth/me');
    
    if (response.success && response.data) {
      logSuccess(`Perfil obtido com sucesso.`);
      log(`Permissões: ${response.data.permissions.join(', ')}`, 'blue');
      return true;
    } else {
      throw new Error('Resposta de perfil inválida');
    }
  } catch (error) {
    logError(`Falha ao obter perfil: ${error.message}`);
    return false;
  }
}

// Teste 3: Listar relações grua-obra
async function testListGruaObraRelacoes() {
  logStep('3', 'Testando listagem de relações grua-obra...');
  
  try {
    const response = await makeRequest('/api/livro-grua/relacoes-grua-obra');
    
    if (response.success && Array.isArray(response.data)) {
      logSuccess(`Encontradas ${response.data.length} relações grua-obra.`);
      
      if (response.data.length > 0) {
        const relacao = response.data[0];
        testObraId = relacao.obra_id;
        testGruaId = relacao.grua_id;
        log(`Usando obra ID: ${testObraId}, Grua ID: ${testGruaId}`, 'blue');
      } else {
        logWarning('Nenhuma relação grua-obra encontrada. Criando dados de teste...');
        await createTestData();
      }
      
      return true;
    } else {
      throw new Error('Resposta de relações inválida');
    }
  } catch (error) {
    logError(`Falha ao listar relações: ${error.message}`);
    return false;
  }
}

// Teste 4: Listar funcionários de uma obra
async function testListFuncionariosObra() {
  logStep('4', 'Testando listagem de funcionários por obra...');
  
  if (!testObraId) {
    logError('ID da obra não disponível para teste');
    return false;
  }
  
  try {
    const response = await makeRequest(`/funcionarios/obra/${testObraId}`);
    
    if (response.success && Array.isArray(response.data)) {
      logSuccess(`Encontrados ${response.data.length} funcionários na obra.`);
      
      if (response.data.length > 0) {
        testFuncionarioId = response.data[0].id;
        log(`Usando funcionário ID: ${testFuncionarioId}`, 'blue');
      }
      
      return true;
    } else {
      throw new Error('Resposta de funcionários inválida');
    }
  } catch (error) {
    logError(`Falha ao listar funcionários: ${error.message}`);
    return false;
  }
}

// Teste 5: Criar entrada no livro da grua
async function testCreateLivroGrua() {
  logStep('5', 'Testando criação de entrada no livro da grua...');
  
  if (!testObraId || !testGruaId || !testFuncionarioId) {
    logError('Dados necessários não disponíveis para teste');
    return false;
  }
  
  try {
    const entradaData = {
      obra_id: testObraId,
      grua_id: testGruaId,
      funcionario_id: testFuncionarioId,
      data_entrada: new Date().toISOString().split('T')[0],
      hora_inicio: '08:00',
      hora_fim: '17:00',
      tipo_servico: 'Montagem',
      descricao: 'Teste de integração - Montagem de estrutura',
      observacoes: 'Entrada criada pelo script de teste de integração'
    };

    const response = await makeRequest('/api/livro-grua', {
      method: 'POST',
      body: JSON.stringify(entradaData)
    });
    
    if (response.success && response.data) {
      testLivroGruaId = response.data.id;
      logSuccess(`Entrada criada com sucesso. ID: ${testLivroGruaId}`);
      return true;
    } else {
      throw new Error('Resposta de criação inválida');
    }
  } catch (error) {
    logError(`Falha ao criar entrada: ${error.message}`);
    return false;
  }
}

// Teste 6: Listar entradas do livro
async function testListLivroGrua() {
  logStep('6', 'Testando listagem de entradas do livro...');
  
  try {
    const response = await makeRequest('/api/livro-grua');
    
    if (response.success && Array.isArray(response.data)) {
      logSuccess(`Encontradas ${response.data.length} entradas no livro.`);
      return true;
    } else {
      throw new Error('Resposta de listagem inválida');
    }
  } catch (error) {
    logError(`Falha ao listar entradas: ${error.message}`);
    return false;
  }
}

// Teste 7: Atualizar entrada
async function testUpdateLivroGrua() {
  logStep('7', 'Testando atualização de entrada...');
  
  if (!testLivroGruaId) {
    logError('ID da entrada não disponível para teste');
    return false;
  }
  
  try {
    const updateData = {
      observacoes: 'Entrada atualizada pelo script de teste de integração'
    };

    const response = await makeRequest(`/api/livro-grua/${testLivroGruaId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    
    if (response.success && response.data) {
      logSuccess(`Entrada atualizada com sucesso.`);
      return true;
    } else {
      throw new Error('Resposta de atualização inválida');
    }
  } catch (error) {
    logError(`Falha ao atualizar entrada: ${error.message}`);
    return false;
  }
}

// Teste 8: Obter estatísticas
async function testGetStats() {
  logStep('8', 'Testando obtenção de estatísticas...');
  
  try {
    const response = await makeRequest('/api/livro-grua/stats');
    
    if (response.success && response.data) {
      logSuccess(`Estatísticas obtidas com sucesso.`);
      log(`Total de entradas: ${response.data.total_entradas}`, 'blue');
      log(`Horas trabalhadas: ${response.data.total_horas_trabalhadas}`, 'blue');
      return true;
    } else {
      throw new Error('Resposta de estatísticas inválida');
    }
  } catch (error) {
    logError(`Falha ao obter estatísticas: ${error.message}`);
    return false;
  }
}

// Teste 9: Exportar CSV
async function testExportCSV() {
  logStep('9', 'Testando exportação CSV...');
  
  try {
    const response = await makeRequest('/api/livro-grua/export/csv');
    
    if (response.success && response.data) {
      logSuccess(`CSV exportado com sucesso.`);
      log(`URL do arquivo: ${response.data.url}`, 'blue');
      return true;
    } else {
      throw new Error('Resposta de exportação inválida');
    }
  } catch (error) {
    logError(`Falha ao exportar CSV: ${error.message}`);
    return false;
  }
}

// Teste 10: Upload de anexo
async function testUploadAnexo() {
  logStep('10', 'Testando upload de anexo...');
  
  if (!testLivroGruaId) {
    logError('ID da entrada não disponível para teste');
    return false;
  }
  
  try {
    // Criar um arquivo de teste
    const testContent = 'Este é um arquivo de teste para o sistema de livros de gruas.';
    const testFileName = 'teste-anexo.txt';
    
    const formData = new FormData();
    formData.append('arquivo', new Blob([testContent], { type: 'text/plain' }), testFileName);
    formData.append('descricao', 'Anexo de teste do script de integração');

    const response = await fetch(`${BASE_URL}/api/arquivos/upload/livro-grua/${testLivroGruaId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      logSuccess(`Anexo enviado com sucesso. ID: ${data.data.id}`);
      return true;
    } else {
      throw new Error(data.message || 'Erro no upload');
    }
  } catch (error) {
    logError(`Falha no upload de anexo: ${error.message}`);
    return false;
  }
}

// Função para criar dados de teste se necessário
async function createTestData() {
  logWarning('Criando dados de teste...');
  
  try {
    // Aqui você pode implementar a criação de dados de teste
    // Por enquanto, vamos apenas logar que seria necessário
    log('Dados de teste seriam criados aqui se necessário', 'yellow');
    return true;
  } catch (error) {
    logError(`Falha ao criar dados de teste: ${error.message}`);
    return false;
  }
}

// Função principal
async function runIntegrationTests() {
  log('🚀 Iniciando Testes de Integração - Sistema de Livros de Gruas', 'bright');
  log(`URL Base: ${BASE_URL}`, 'blue');
  log(`Usuário de Teste: ${TEST_USER.email}`, 'blue');
  
  const tests = [
    { name: 'Login', fn: testLogin },
    { name: 'Perfil do Usuário', fn: testGetProfile },
    { name: 'Relações Grua-Obra', fn: testListGruaObraRelacoes },
    { name: 'Funcionários por Obra', fn: testListFuncionariosObra },
    { name: 'Criar Entrada', fn: testCreateLivroGrua },
    { name: 'Listar Entradas', fn: testListLivroGrua },
    { name: 'Atualizar Entrada', fn: testUpdateLivroGrua },
    { name: 'Estatísticas', fn: testGetStats },
    { name: 'Exportar CSV', fn: testExportCSV },
    { name: 'Upload de Anexo', fn: testUploadAnexo }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      } else {
        failedTests++;
      }
    } catch (error) {
      logError(`Erro inesperado no teste ${test.name}: ${error.message}`);
      failedTests++;
    }
  }

  // Resumo final
  log('\n' + '='.repeat(60), 'bright');
  log('📊 RESUMO DOS TESTES', 'bright');
  log('='.repeat(60), 'bright');
  log(`✅ Testes Aprovados: ${passedTests}`, 'green');
  log(`❌ Testes Falharam: ${failedTests}`, 'red');
  log(`📈 Taxa de Sucesso: ${((passedTests / tests.length) * 100).toFixed(1)}%`, 'blue');
  
  if (failedTests === 0) {
    log('\n🎉 Todos os testes passaram! Sistema de Livros de Gruas está funcionando corretamente.', 'green');
  } else {
    log(`\n⚠️  ${failedTests} teste(s) falharam. Verifique os logs acima para detalhes.`, 'yellow');
  }

  return failedTests === 0;
}

// Executar testes se o script for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logError(`Erro fatal: ${error.message}`);
      process.exit(1);
    });
}

export { runIntegrationTests };
