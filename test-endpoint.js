#!/usr/bin/env node

/**
 * Script simples para testar o endpoint de upload
 * Uso: node test-endpoint.js
 */

const http = require('http')
const fs = require('fs')
const path = require('path')

// Configurações
const PORT = 3001
const ASSINATURA_ID = 102

// Criar arquivo de teste
const testContent = Buffer.from('Teste de arquivo PDF assinado')
const testFilePath = path.join(__dirname, 'teste-assinado.pdf')
fs.writeFileSync(testFilePath, testContent)

console.log('🧪 Testando endpoint de upload...')
console.log(`📍 URL: http://localhost:${PORT}/api/assinaturas/${ASSINATURA_ID}/upload-assinado`)

// Criar FormData manualmente
const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2)
const fileContent = fs.readFileSync(testFilePath)

const formData = Buffer.concat([
  Buffer.from(`--${boundary}\r\n`),
  Buffer.from(`Content-Disposition: form-data; name="arquivo"; filename="teste-assinado.pdf"\r\n`),
  Buffer.from(`Content-Type: application/pdf\r\n\r\n`),
  fileContent,
  Buffer.from(`\r\n--${boundary}\r\n`),
  Buffer.from(`Content-Disposition: form-data; name="observacoes"\r\n\r\n`),
  Buffer.from('Teste de upload via script'),
  Buffer.from(`\r\n--${boundary}--\r\n`)
])

// Opções da requisição
const options = {
  hostname: 'localhost',
  port: PORT,
  path: `/api/assinaturas/${ASSINATURA_ID}/upload-assinado`,
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': formData.length,
    'Authorization': 'Bearer test-token' // Token de teste
  }
}

// Fazer requisição
const req = http.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`)
  console.log(`📊 Headers:`, res.headers)
  
  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    console.log('📄 Resposta:', data)
    
    // Limpar arquivo de teste
    fs.unlinkSync(testFilePath)
    console.log('🧹 Arquivo de teste removido')
    
    if (res.statusCode === 200) {
      console.log('✅ Teste bem-sucedido!')
    } else {
      console.log('❌ Teste falhou!')
    }
  })
})

req.on('error', (error) => {
  console.error('💥 Erro na requisição:', error.message)
  
  // Limpar arquivo de teste
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath)
  }
})

// Enviar dados
req.write(formData)
req.end()

console.log('📤 Enviando requisição...')
