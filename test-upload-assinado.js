#!/usr/bin/env node

/**
 * Script de teste para verificar o endpoint de upload de arquivo assinado
 * Uso: node test-upload-assinado.js
 */

import fetch from 'node-fetch'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'

const API_BASE = 'http://localhost:3001/api'
const ASSINATURA_ID = 102

async function testUploadAssinado() {
  console.log('🧪 Testando endpoint de upload de arquivo assinado...')
  console.log(`📍 URL: ${API_BASE}/assinaturas/${ASSINATURA_ID}/upload-assinado`)
  
  try {
    // Criar um arquivo PDF de teste (simulado)
    const testContent = 'Teste de arquivo PDF assinado'
    const testFilePath = path.join(process.cwd(), 'teste-assinado.pdf')
    
    // Escrever arquivo de teste
    fs.writeFileSync(testFilePath, testContent)
    console.log('✅ Arquivo de teste criado:', testFilePath)
    
    // Criar FormData
    const formData = new FormData()
    formData.append('arquivo', fs.createReadStream(testFilePath))
    formData.append('observacoes', 'Teste de upload via script')
    
    console.log('📤 Enviando requisição...')
    
    // Fazer requisição
    const response = await fetch(`${API_BASE}/assinaturas/${ASSINATURA_ID}/upload-assinado`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Bearer test-token', // Token de teste
        ...formData.getHeaders()
      }
    })
    
    console.log('📊 Status da resposta:', response.status)
    console.log('📊 Headers da resposta:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('📄 Conteúdo da resposta:', responseText)
    
    // Limpar arquivo de teste
    fs.unlinkSync(testFilePath)
    console.log('🧹 Arquivo de teste removido')
    
    if (response.ok) {
      console.log('✅ Teste bem-sucedido!')
    } else {
      console.log('❌ Teste falhou!')
    }
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Verificar se o servidor está rodando
async function checkServer() {
  try {
    console.log('🔍 Verificando se o servidor está rodando...')
    const response = await fetch(`${API_BASE}/health`, { 
      method: 'GET',
      timeout: 5000 
    })
    
    if (response.ok) {
      console.log('✅ Servidor está rodando!')
      return true
    } else {
      console.log('⚠️ Servidor respondeu com status:', response.status)
      return false
    }
  } catch (error) {
    console.log('❌ Servidor não está acessível:', error.message)
    return false
  }
}

// Executar testes
async function main() {
  console.log('🚀 Iniciando testes de upload de arquivo assinado...\n')
  
  const serverRunning = await checkServer()
  if (!serverRunning) {
    console.log('❌ Servidor não está rodando. Inicie o servidor primeiro!')
    console.log('💡 Execute: cd backend-api && npm start')
    process.exit(1)
  }
  
  await testUploadAssinado()
  
  console.log('\n🏁 Testes concluídos!')
}

main().catch(console.error)
