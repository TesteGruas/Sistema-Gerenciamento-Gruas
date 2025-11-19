#!/usr/bin/env node

/**
 * Script de teste para enviar notificação via WhatsApp
 * Testa o envio de notificação para o funcionário Samuel Linkon
 */

import https from 'https'
import http from 'http'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'

// Função auxiliar para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const protocol = urlObj.protocol === 'https:' ? https : http
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }

    const req = protocol.request(requestOptions, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(jsonData),
            text: () => Promise.resolve(data)
          })
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve({}),
            text: () => Promise.resolve(data)
          })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    }

    req.end()
  })
}

async function testarNotificacaoWhatsApp() {
  try {
    console.log('🔑 Fazendo login...')
    
    // 1. Fazer login
    const loginResponse = await makeRequest(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        email: 'admin@admin.com',
        password: 'teste@123'
      }
    })

    if (!loginResponse.ok) {
      const error = await loginResponse.json()
      throw new Error(`Erro no login: ${JSON.stringify(error)}`)
    }

    const loginData = await loginResponse.json()
    const token = loginData.data?.access_token || loginData.token
    
    if (!token) {
      throw new Error('Token não encontrado na resposta do login')
    }

    console.log('✅ Login realizado com sucesso')
    console.log(`📋 Token: ${token.substring(0, 20)}...`)

    // 2. Buscar funcionário Samuel Linkon
    console.log('\n🔍 Buscando funcionário Samuel Linkon...')
    const funcionariosResponse = await makeRequest(`${API_BASE_URL}/api/funcionarios?search=Samuel`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!funcionariosResponse.ok) {
      throw new Error('Erro ao buscar funcionários')
    }

    const funcionariosData = await funcionariosResponse.json()
    const funcionarios = funcionariosData.data || funcionariosData
    
    // Procurar por Samuel Linkon
    const samuel = Array.isArray(funcionarios) 
      ? funcionarios.find(f => 
          f.nome && f.nome.toLowerCase().includes('samuel') && 
          f.nome.toLowerCase().includes('linkon')
        )
      : null

    if (!samuel) {
      console.log('⚠️ Funcionário Samuel Linkon não encontrado. Listando todos os funcionários:')
      console.log(funcionarios.map(f => ({ id: f.id, nome: f.nome, cargo: f.cargo })))
      throw new Error('Funcionário Samuel Linkon não encontrado')
    }

    console.log(`✅ Funcionário encontrado: ${samuel.nome} (ID: ${samuel.id}, Cargo: ${samuel.cargo})`)
    console.log(`📞 Telefone: ${samuel.telefone || 'não informado'}`)
    console.log(`📱 Telefone WhatsApp: ${samuel.telefone_whatsapp || 'não informado'}`)

    // 3. Criar notificação
    console.log('\n📨 Criando notificação...')
    const notificacaoResponse = await makeRequest(`${API_BASE_URL}/api/notificacoes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: {
        titulo: 'Teste de Notificação WhatsApp',
        mensagem: 'Esta é uma mensagem de teste para verificar o envio via WhatsApp. Se você recebeu esta mensagem, a integração está funcionando!',
        tipo: 'info',
        destinatarios: [
          {
            tipo: 'funcionario',
            id: samuel.id.toString(),
            nome: samuel.nome,
            info: samuel.cargo || 'Funcionário'
          }
        ],
        remetente: 'Sistema (Teste)'
      }
    })

    if (!notificacaoResponse.ok) {
      const error = await notificacaoResponse.json()
      throw new Error(`Erro ao criar notificação: ${JSON.stringify(error)}`)
    }

    const notificacaoData = await notificacaoResponse.json()
    
    console.log('✅ Notificação criada com sucesso!')
    console.log('\n📊 Resposta da API:')
    console.log(JSON.stringify(notificacaoData, null, 2))

    if (notificacaoData.whatsapp) {
      console.log('\n📱 Status do WhatsApp:')
      console.log(`   - Total de destinatários: ${notificacaoData.whatsapp.total}`)
      console.log(`   - Mensagens enviadas: ${notificacaoData.whatsapp.enviados}`)
      console.log(`   - Erros: ${notificacaoData.whatsapp.erros}`)
      console.log(`   - Status: ${notificacaoData.whatsapp.status || 'N/A'}`)
    } else {
      console.log('\n⚠️ Campo "whatsapp" não encontrado na resposta')
    }

    console.log('\n✅ Teste concluído!')
    console.log('💡 Verifique os logs do servidor para ver o processo de envio do WhatsApp')
    console.log('💡 Verifique também se a mensagem chegou no WhatsApp do funcionário')

  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message)
    if (error.stack) {
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  }
}

// Executar teste
testarNotificacaoWhatsApp()

