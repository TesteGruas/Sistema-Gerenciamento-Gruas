/**
 * Script para buscar todos os funcionários do sistema via API
 * 
 * Uso:
 *   node scripts/buscar-todos-funcionarios.js
 * 
 * Ou com token personalizado:
 *   TOKEN=seu_token_aqui node scripts/buscar-todos-funcionarios.js
 */

const API_URL = process.env.API_URL || 'http://localhost:3000'
const TOKEN = process.env.TOKEN || 'seu_token_aqui' // Substitua pelo seu token de autenticação

async function buscarTodosFuncionarios() {
  try {
    console.log('🔍 Buscando todos os funcionários...\n')
    
    let todosFuncionarios = []
    let page = 1
    let hasMore = true
    const limit = 100 // Limite máximo permitido pela API
    
    while (hasMore) {
      const url = `${API_URL}/api/funcionarios?page=${page}&limit=${limit}`
      
      console.log(`📄 Buscando página ${page}...`)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        todosFuncionarios = [...todosFuncionarios, ...data.data]
        console.log(`✅ Página ${page}: ${data.data.length} funcionários encontrados`)
        console.log(`   Total acumulado: ${todosFuncionarios.length} funcionários\n`)
        
        // Verificar se há mais páginas
        if (data.pagination && page < data.pagination.pages) {
          page++
        } else {
          hasMore = false
        }
      } else {
        hasMore = false
      }
    }
    
    console.log('='.repeat(80))
    console.log(`✅ Busca concluída! Total de funcionários: ${todosFuncionarios.length}\n`)
    
    // Exibir resumo
    console.log('📊 RESUMO:')
    console.log(`   Total de funcionários: ${todosFuncionarios.length}`)
    
    const porStatus = todosFuncionarios.reduce((acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1
      return acc
    }, {})
    console.log(`   Por status:`, porStatus)
    
    const porCargo = todosFuncionarios.reduce((acc, f) => {
      acc[f.cargo] = (acc[f.cargo] || 0) + 1
      return acc
    }, {})
    console.log(`   Por cargo:`, porCargo)
    
    // Salvar em arquivo JSON (opcional)
    const fs = require('fs')
    const outputFile = 'todos-funcionarios.json'
    fs.writeFileSync(outputFile, JSON.stringify(todosFuncionarios, null, 2))
    console.log(`\n💾 Dados salvos em: ${outputFile}`)
    
    // Exibir lista de funcionários
    console.log('\n👥 LISTA DE FUNCIONÁRIOS:')
    console.log('='.repeat(80))
    todosFuncionarios.forEach((func, index) => {
      console.log(`${index + 1}. ${func.nome} (${func.cargo}) - ${func.status}`)
      if (func.email) console.log(`   Email: ${func.email}`)
      if (func.telefone) console.log(`   Telefone: ${func.telefone}`)
      console.log('')
    })
    
    return todosFuncionarios
    
  } catch (error) {
    console.error('❌ Erro ao buscar funcionários:', error.message)
    process.exit(1)
  }
}

// Executar
buscarTodosFuncionarios()
