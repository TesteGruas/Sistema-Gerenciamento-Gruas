#!/usr/bin/env node

/**
 * Script de verificação da configuração do backend
 * Uso: node check-setup.js
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Carregar variáveis de ambiente
dotenv.config()

console.log('🔍 Verificando configuração do backend...\n')

// 1. Verificar variáveis de ambiente
console.log('1️⃣ Verificando variáveis de ambiente...')
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'PORT'
]

let envVarsOk = true
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`❌ ${varName} não configurada`)
    envVarsOk = false
  } else {
    console.log(`✅ ${varName} configurada`)
  }
})

if (!envVarsOk) {
  console.log('\n❌ Variáveis de ambiente não configuradas corretamente!')
  console.log('💡 Verifique o arquivo .env')
  process.exit(1)
}

// 2. Verificar conexão com Supabase
console.log('\n2️⃣ Verificando conexão com Supabase...')
try {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  // Testar conexão
  const { data, error } = await supabase
    .from('obras_documentos')
    .select('count')
    .limit(1)
  
  if (error) {
    console.log('❌ Erro na conexão com Supabase:', error.message)
  } else {
    console.log('✅ Conexão com Supabase OK')
  }
} catch (error) {
  console.log('❌ Erro ao conectar com Supabase:', error.message)
}

// 3. Verificar tabelas necessárias
console.log('\n3️⃣ Verificando tabelas do banco de dados...')
const requiredTables = [
  'obras_documentos',
  'obras_documento_assinaturas',
  'obras_documento_historico'
]

for (const table of requiredTables) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`❌ Tabela ${table} não encontrada:`, error.message)
    } else {
      console.log(`✅ Tabela ${table} existe`)
    }
  } catch (error) {
    console.log(`❌ Erro ao verificar tabela ${table}:`, error.message)
  }
}

// 4. Verificar Supabase Storage
console.log('\n4️⃣ Verificando Supabase Storage...')
try {
  const { data, error } = await supabase.storage
    .from('arquivos-obras')
    .list('', { limit: 1 })
  
  if (error) {
    console.log('❌ Bucket arquivos-obras não encontrado:', error.message)
    console.log('💡 Execute: INSERT INTO storage.buckets (id, name, public) VALUES (\'arquivos-obras\', \'arquivos-obras\', true);')
  } else {
    console.log('✅ Bucket arquivos-obras configurado')
  }
} catch (error) {
  console.log('❌ Erro ao verificar storage:', error.message)
}

// 5. Verificar arquivos do projeto
console.log('\n5️⃣ Verificando arquivos do projeto...')
const requiredFiles = [
  'src/routes/assinaturas.js',
  'src/routes/obras-documentos.js',
  'src/middleware/auth.js',
  'src/config/supabase.js',
  'src/server.js',
  'package.json'
]

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} existe`)
  } else {
    console.log(`❌ ${file} não encontrado`)
  }
})

// 6. Verificar dependências
console.log('\n6️⃣ Verificando dependências...')
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const requiredDeps = [
    'express',
    'multer',
    'joi',
    'uuid',
    '@supabase/supabase-js',
    'jsonwebtoken'
  ]
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} instalada`)
    } else {
      console.log(`❌ ${dep} não instalada`)
    }
  })
} catch (error) {
  console.log('❌ Erro ao verificar package.json:', error.message)
}

// 7. Testar servidor
console.log('\n7️⃣ Testando servidor...')
try {
  const response = await fetch(`http://localhost:${process.env.PORT || 3001}/api/health`)
  if (response.ok) {
    console.log('✅ Servidor está rodando')
  } else {
    console.log('❌ Servidor não está respondendo corretamente')
  }
} catch (error) {
  console.log('❌ Servidor não está rodando:', error.message)
  console.log('💡 Execute: npm start')
}

console.log('\n🏁 Verificação concluída!')
console.log('\n📋 Próximos passos:')
console.log('1. Configure as variáveis de ambiente no .env')
console.log('2. Execute as migrações SQL no Supabase')
console.log('3. Configure o bucket arquivos-obras no Supabase Storage')
console.log('4. Execute: npm install')
console.log('5. Execute: npm start')
