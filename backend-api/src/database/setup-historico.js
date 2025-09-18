/**
 * Script para configurar a tabela de histórico de locações
 * Sistema de Gerenciamento de Gruas
 */

import { supabaseAdmin } from '../config/supabase.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function setupHistoricoLocacoes() {
  try {
    console.log('🔧 Configurando tabela de histórico de locações...')

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'create-historico-locacoes.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    // Executar o SQL
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: sqlContent
    })

    if (error) {
      console.error('❌ Erro ao executar SQL:', error)
      return false
    }

    console.log('✅ Tabela de histórico de locações criada com sucesso!')
    return true

  } catch (error) {
    console.error('❌ Erro ao configurar histórico:', error)
    return false
  }
}

// Função alternativa usando query direta
async function setupHistoricoLocacoesDirect() {
  try {
    console.log('🔧 Configurando tabela de histórico de locações (método direto)...')

    // Verificar se a tabela já existe
    const { data: existingTable, error: checkError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'historico_locacoes')
      .eq('table_schema', 'public')

    if (checkError) {
      console.log('⚠️ Não foi possível verificar tabela existente, tentando criar...')
    } else if (existingTable && existingTable.length > 0) {
      console.log('✅ Tabela historico_locacoes já existe!')
      return true
    }

    // Criar tabela usando query direta
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS historico_locacoes (
        id SERIAL PRIMARY KEY,
        grua_id VARCHAR NOT NULL,
        obra_id INTEGER NOT NULL,
        data_inicio DATE NOT NULL,
        data_fim DATE,
        funcionario_responsavel_id INTEGER,
        tipo_operacao VARCHAR(20) NOT NULL CHECK (tipo_operacao IN ('Início', 'Transferência', 'Fim', 'Pausa', 'Retomada')),
        valor_locacao DECIMAL(10,2),
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Executar criação da tabela
    const { error: createError } = await supabaseAdmin
      .from('historico_locacoes')
      .select('id')
      .limit(1)

    if (createError && createError.code === '42P01') {
      // Tabela não existe, vamos criar
      console.log('📝 Criando tabela historico_locacoes...')
      
      // Como não podemos executar DDL diretamente, vamos usar uma abordagem diferente
      // Vamos tentar inserir um registro de teste para forçar a criação
      console.log('⚠️ Tabela não existe. Execute o SQL manualmente no Supabase:')
      console.log(createTableSQL)
      
      return false
    } else if (createError) {
      console.error('❌ Erro ao verificar/criar tabela:', createError)
      return false
    } else {
      console.log('✅ Tabela historico_locacoes já existe e está acessível!')
      return true
    }

  } catch (error) {
    console.error('❌ Erro ao configurar histórico:', error)
    return false
  }
}

// Função para testar a tabela
async function testarHistoricoLocacoes() {
  try {
    console.log('🧪 Testando tabela de histórico de locações...')

    // Tentar inserir um registro de teste
    const { data, error } = await supabaseAdmin
      .from('historico_locacoes')
      .insert([{
        grua_id: 'TEST001',
        obra_id: 1,
        data_inicio: new Date().toISOString().split('T')[0],
        funcionario_responsavel_id: 1,
        tipo_operacao: 'Início',
        valor_locacao: 1000.00,
        observacoes: 'Registro de teste'
      }])
      .select()

    if (error) {
      console.error('❌ Erro ao inserir teste:', error)
      return false
    }

    console.log('✅ Teste de inserção bem-sucedido:', data)

    // Limpar o registro de teste
    await supabaseAdmin
      .from('historico_locacoes')
      .delete()
      .eq('id', data[0].id)

    console.log('✅ Teste concluído com sucesso!')
    return true

  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return false
  }
}

// Executar setup
async function main() {
  console.log('🚀 Iniciando configuração do histórico de locações...')
  
  const success = await setupHistoricoLocacoesDirect()
  
  if (success) {
    await testarHistoricoLocacoes()
  }
  
  console.log('🏁 Configuração concluída!')
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { setupHistoricoLocacoes, setupHistoricoLocacoesDirect, testarHistoricoLocacoes }
