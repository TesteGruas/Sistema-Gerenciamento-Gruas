/**
 * Script para executar migration de cobranças de aluguel
 * Execute: node scripts/executar-migration-cobrancas-aluguel.js
 */

import { supabaseAdmin } from '../src/config/supabase.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function executarMigration() {
  try {
    console.log('🔄 Executando migration para criar tabela de cobranças de aluguel...')
    
    // Ler o arquivo SQL da migration
    const migrationPath = path.join(__dirname, '../database/migrations/20260207_create_cobrancas_aluguel.sql')
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Arquivo de migration não encontrado:', migrationPath)
      process.exit(1)
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Conteúdo da migration carregado')
    console.log('📌 Executando SQL...\n')
    
    // Executar o SQL completo usando Supabase
    // Nota: Supabase não suporta execução direta de SQL múltiplo, então vamos executar via RPC se disponível
    // ou instruir o usuário a executar manualmente
    
    // Tentar executar via query direta (pode não funcionar para múltiplos comandos)
    try {
      // Dividir em comandos individuais
      const comandos = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
      
      console.log(`📊 Total de comandos a executar: ${comandos.length}\n`)
      
      for (let i = 0; i < comandos.length; i++) {
        const comando = comandos[i]
        if (comando.trim().length === 0) continue
        
        try {
          console.log(`\n📌 Executando comando ${i + 1}/${comandos.length}...`)
          
          // Tentar executar via RPC exec_sql se disponível
          const { error: rpcError } = await supabaseAdmin.rpc('exec_sql', { 
            sql_query: comando + ';' 
          })
          
          if (rpcError) {
            // Se RPC não funcionar, tentar método alternativo
            console.warn(`⚠️  RPC não disponível, tentando método alternativo...`)
            console.warn(`   Erro: ${rpcError.message}`)
            
            // Para comandos DDL, pode ser necessário executar manualmente
            if (comando.toUpperCase().includes('CREATE TABLE') || 
                comando.toUpperCase().includes('CREATE INDEX') ||
                comando.toUpperCase().includes('CREATE TRIGGER') ||
                comando.toUpperCase().includes('CREATE FUNCTION')) {
              console.log(`\n⚠️  Comando DDL detectado. Execute manualmente no banco de dados.`)
              console.log(`\n📄 SQL para executar manualmente:`)
              console.log('='.repeat(80))
              console.log(sql)
              console.log('='.repeat(80))
              console.log('\n💡 Instruções:')
              console.log('   1. Conecte-se ao seu banco de dados PostgreSQL')
              console.log('   2. Execute o SQL acima')
              console.log('   3. Ou use o Supabase Dashboard > SQL Editor')
              process.exit(0)
            }
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`)
          }
        } catch (err) {
          console.warn(`⚠️  Erro ao executar comando ${i + 1}:`, err.message)
        }
      }
      
      // Verificar se a tabela foi criada
      console.log('\n🔍 Verificando se a tabela foi criada...')
      const { data, error: checkError } = await supabaseAdmin
        .from('cobrancas_aluguel')
        .select('id')
        .limit(1)
      
      if (checkError && checkError.message.includes('Could not find the table')) {
        console.error('❌ A tabela ainda não existe. Execute o SQL manualmente no banco de dados.')
        console.log('\n📄 SQL para executar manualmente:')
        console.log('='.repeat(80))
        console.log(sql)
        console.log('='.repeat(80))
        process.exit(1)
      } else {
        console.log('✅ Tabela verificada com sucesso!')
      }
      
      console.log('\n✅ Migration concluída!')
    } catch (error) {
      console.error('❌ Erro ao executar migration:', error)
      console.log('\n📄 Execute o SQL manualmente no banco de dados:')
      console.log('='.repeat(80))
      console.log(sql)
      console.log('='.repeat(80))
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Erro ao carregar migration:', error)
    process.exit(1)
  }
}

executarMigration()
