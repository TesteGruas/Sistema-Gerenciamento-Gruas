/**
 * Script de Teste - Integração WhatsApp
 * 
 * Este script ajuda a testar a integração do WhatsApp
 * 
 * Uso:
 *   node scripts/test-whatsapp.js
 * 
 * Requer:
 *   - Token de autenticação (obtenha fazendo login)
 *   - Variável WHATSAPP_WEBHOOK_URL configurada
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:3001';
const WHATSAPP_WEBHOOK_URL = process.env.WHATSAPP_WEBHOOK_URL || 'https://gsouzabd.app.n8n.cloud/webhook/irbana-notify';

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testarEnvioWhatsApp(token, numeroDestinatario) {
  log('\n🧪 TESTE 1: Envio Manual de Mensagem WhatsApp', 'cyan');
  log('─'.repeat(60), 'cyan');

  try {
    const response = await fetch(`${API_URL}/api/whatsapp/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        number: numeroDestinatario,
        text: '🔔 Mensagem de teste do sistema de aprovações WhatsApp\n\nSe você recebeu esta mensagem, a integração está funcionando corretamente!'
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      log('✅ Mensagem de teste enviada com sucesso!', 'green');
      log(`   Número: ${data.data.number}`, 'cyan');
      log(`   Enviado em: ${data.data.sent_at}`, 'cyan');
      return true;
    } else {
      log(`❌ Erro: ${data.message || 'Erro desconhecido'}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erro ao enviar mensagem: ${error.message}`, 'red');
    return false;
  }
}

async function testarCriacaoAprovacao(token, dadosAprovacao) {
  log('\n🧪 TESTE 2: Criação de Aprovação com Envio Automático', 'cyan');
  log('─'.repeat(60), 'cyan');

  try {
    const response = await fetch(`${API_URL}/api/aprovacoes-horas-extras`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dadosAprovacao)
    });

    const data = await response.json();

    if (response.ok && data.success) {
      log('✅ Aprovação criada com sucesso!', 'green');
      log(`   ID: ${data.data.id}`, 'cyan');
      log(`   Status: ${data.data.status}`, 'cyan');
      log(`   Horas Extras: ${data.data.horas_extras}h`, 'cyan');
      log(`   Dias Restantes: ${data.data.dias_restantes}`, 'cyan');
      
      // Verificar se token foi gerado
      if (data.data.token_aprovacao) {
        log(`   Token: ${data.data.token_aprovacao.substring(0, 20)}...`, 'cyan');
        log(`   Link: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/aprovacaop/${data.data.id}?token=${data.data.token_aprovacao}`, 'yellow');
      }

      log('\n📱 Verifique se o WhatsApp foi enviado ao supervisor!', 'yellow');
      return data.data;
    } else {
      log(`❌ Erro: ${data.message || 'Erro desconhecido'}`, 'red');
      if (data.error) {
        log(`   Detalhes: ${data.error}`, 'red');
      }
      return null;
    }
  } catch (error) {
    log(`❌ Erro ao criar aprovação: ${error.message}`, 'red');
    return null;
  }
}

async function testarLinkAprovacao(aprovacaoId, token) {
  log('\n🧪 TESTE 3: Validação de Link Público', 'cyan');
  log('─'.repeat(60), 'cyan');

  try {
    const response = await fetch(`${API_URL}/api/aprovacao/${aprovacaoId}?token=${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      log('✅ Link público válido!', 'green');
      log(`   Funcionário: ${data.data.funcionario.nome}`, 'cyan');
      log(`   Horas Extras: ${data.data.horas_extras}h`, 'cyan');
      log(`   Data Trabalho: ${data.data.data_trabalho}`, 'cyan');
      log(`   Status: ${data.data.status}`, 'cyan');
      return true;
    } else {
      log(`❌ Erro: ${data.message || 'Erro desconhecido'}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erro ao validar link: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🚀 TESTE DE INTEGRAÇÃO WHATSAPP', 'blue');
  log('═'.repeat(60), 'blue');

  // Verificar variáveis de ambiente
  log('\n📋 Verificando Configurações:', 'cyan');
  log(`   API URL: ${API_URL}`, 'cyan');
  log(`   Webhook URL: ${WHATSAPP_WEBHOOK_URL}`, 'cyan');
  log(`   Frontend URL: ${process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000'}`, 'cyan');

  // Solicitar token
  const token = process.argv[2];
  if (!token) {
    log('\n⚠️  Token de autenticação não fornecido!', 'yellow');
    log('   Uso: node scripts/test-whatsapp.js <SEU_TOKEN>', 'yellow');
    log('   Obtenha o token fazendo login e executando no console:', 'yellow');
    log('   localStorage.getItem("access_token")', 'yellow');
    process.exit(1);
  }

  // Solicitar número para teste
  const numeroDestinatario = process.argv[3] || '5511999999999';
  log(`\n📱 Número destinatário: ${numeroDestinatario}`, 'cyan');
  log('   (Passe como terceiro argumento para usar outro número)', 'yellow');

  // Executar testes
  const resultados = {
    teste1: false,
    teste2: null,
    teste3: false
  };

  // TESTE 1: Envio manual
  resultados.teste1 = await testarEnvioWhatsApp(token, numeroDestinatario);

  // TESTE 2: Criação de aprovação (requer dados válidos)
  log('\n⚠️  TESTE 2 requer dados válidos do banco (funcionario_id, supervisor_id, registro_ponto_id)', 'yellow');
  log('   Execute manualmente via API ou interface do sistema', 'yellow');

  // Resumo
  log('\n📊 RESUMO DOS TESTES:', 'blue');
  log('═'.repeat(60), 'blue');
  log(`   Teste 1 (Envio Manual): ${resultados.teste1 ? '✅ PASSOU' : '❌ FALHOU'}`, resultados.teste1 ? 'green' : 'red');
  log(`   Teste 2 (Criação Aprovação): ⚠️  Execute manualmente`, 'yellow');
  log(`   Teste 3 (Link Público): ⚠️  Execute após criar aprovação`, 'yellow');

  log('\n📝 Próximos Passos:', 'cyan');
  log('   1. Verifique se a mensagem chegou no WhatsApp', 'cyan');
  log('   2. Crie uma aprovação via interface do sistema', 'cyan');
  log('   3. Verifique se o WhatsApp foi enviado automaticamente', 'cyan');
  log('   4. Teste o link de aprovação recebido no WhatsApp', 'cyan');

  log('\n✅ Testes concluídos!', 'green');
}

main().catch(console.error);

