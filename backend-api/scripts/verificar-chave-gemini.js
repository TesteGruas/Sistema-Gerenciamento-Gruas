#!/usr/bin/env node

/**
 * Script para verificar se a chave de API do Google Gemini está configurada corretamente
 * 
 * Uso: node scripts/verificar-chave-gemini.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

console.log('🔍 Verificando chave de API do Google Gemini...\n');
console.log('📁 Caminho do .env:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Erro ao carregar .env:', result.error.message);
  console.log('\n💡 Tentando carregar .env do diretório atual...');
  dotenv.config();
}

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

console.log('\n📋 Configuração:');
console.log('   Modelo:', model);
console.log('   Chave encontrada:', apiKey ? '✅ Sim' : '❌ Não');

if (!apiKey) {
  console.error('\n❌ ERRO: GOOGLE_GEMINI_API_KEY não encontrada no .env');
  console.log('\n💡 Solução:');
  console.log('   1. Abra o arquivo backend-api/.env');
  console.log('   2. Adicione: GOOGLE_GEMINI_API_KEY=sua_chave_aqui');
  console.log('   3. Execute este script novamente');
  process.exit(1);
}

// Validar formato da chave
console.log('\n🔐 Validação da chave:');
console.log('   Tamanho:', apiKey.length, 'caracteres');
console.log('   Começa com "AIza":', apiKey.startsWith('AIza') ? '✅ Sim' : '❌ Não');

if (!apiKey.startsWith('AIza')) {
  console.error('\n❌ ERRO: A chave não começa com "AIza"');
  console.log('   A chave de API do Google Gemini sempre começa com "AIza"');
  process.exit(1);
}

if (apiKey.length < 30) {
  console.error('\n❌ ERRO: A chave parece muito curta');
  console.log('   Chaves de API geralmente têm mais de 30 caracteres');
  process.exit(1);
}

// Verificar se há espaços
if (apiKey.includes(' ') || apiKey.trim() !== apiKey) {
  console.warn('\n⚠️  AVISO: A chave contém espaços ou espaços extras');
  console.log('   Chave atual:', `"${apiKey}"`);
  console.log('   Chave sem espaços:', `"${apiKey.trim()}"`);
  console.log('   💡 Remova espaços antes e depois da chave no .env');
}

// Testar a chave fazendo uma requisição simples
console.log('\n🧪 Testando chave com a API do Google Gemini...');

try {
  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const modelInstance = genAI.getGenerativeModel({ model: model });
  
  console.log(`   Modelo: ${model}`);
  console.log('   Fazendo requisição de teste...');
  
  const testPrompt = 'Responda apenas: OK';
  const result = await modelInstance.generateContent(testPrompt);
  const response = await result.response;
  const text = response.text();
  
  console.log('\n✅ SUCESSO! A chave está funcionando corretamente!');
  console.log('   Resposta do modelo:', text);
  console.log('\n🎉 Tudo configurado corretamente!');
  
} catch (error) {
  console.error('\n❌ ERRO ao testar a chave:');
  console.error('   Mensagem:', error.message);
  
  const errorMessage = error.message || error.toString() || '';
  
  if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('not valid')) {
    console.error('\n❌ A chave de API é inválida ou foi revogada');
    console.log('\n💡 Soluções:');
    console.log('   1. Verifique se copiou a chave corretamente');
    console.log('   2. Verifique se não há espaços antes ou depois da chave');
    console.log('   3. Crie uma nova chave em: https://aistudio.google.com/apikey');
    console.log('   4. Se a chave foi exposta publicamente, ela pode ter sido desabilitada');
    console.log('      → Veja: docs/CHAT-IA-NOVA-CHAVE-API.md');
  } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
    console.error('\n❌ Acesso negado (403)');
    console.log('\n💡 Possíveis causas:');
    console.log('   1. A chave foi revogada ou desabilitada');
    console.log('   2. A chave foi reportada como vazada');
    console.log('   3. Permissões insuficientes no projeto do Google Cloud');
    console.log('   → Crie uma nova chave em: https://aistudio.google.com/apikey');
  } else if (errorMessage.includes('429') || errorMessage.includes('quota')) {
    console.error('\n❌ Limite de quota excedido');
    console.log('\n💡 Aguarde alguns minutos e tente novamente');
    console.log('   Verifique seu uso em: https://ai.dev/usage?tab=rate-limit');
  } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
    console.error('\n❌ Modelo não encontrado');
    console.log(`\n💡 O modelo "${model}" pode não estar disponível`);
    console.log('   Tente usar: gemini-2.5-flash-lite ou gemini-2.5-flash');
  } else {
    console.error('\n❌ Erro desconhecido');
    console.log('   Detalhes completos:', error);
  }
  
  process.exit(1);
}
