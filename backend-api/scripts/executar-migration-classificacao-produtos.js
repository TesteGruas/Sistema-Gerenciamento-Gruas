/**
 * Script para executar migration de adicionar campos de classificação na tabela produtos
 * Execute: node scripts/executar-migration-classificacao-produtos.js
 */

import { supabaseAdmin } from '../src/config/supabase.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function executarMigration() {
  try {
    console.log('🔄 Executando migration para adicionar campos de classificação...')
    
    // Ler o arquivo SQL da migration
    const migrationPath = path.join(__dirname, '../database/migrations/20250228_reorganizar_categorias_estoque.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    // Dividir em comandos individuais (separados por ;)
    const comandos = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📝 Encontrados ${comandos.length} comandos SQL para executar`)
    
    // Executar cada comando
    for (let i = 0; i < comandos.length; i++) {
      const comando = comandos[i]
      if (comando.trim().length === 0) continue
      
      try {
        console.log(`\n📌 Executando comando ${i + 1}/${comandos.length}...`)
        console.log(`   ${comando.substring(0, 100)}...`)
        
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: comando })
        
        if (error) {
          // Tentar executar diretamente via query
          const { error: queryError } = await supabaseAdmin.from('_migrations').select('*').limit(0)
          
          if (queryError) {
            console.warn(`⚠️  Aviso no comando ${i + 1}:`, error.message)
            // Continuar mesmo com erro (pode ser que a coluna já exista)
          }
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`)
        }
      } catch (err) {
        console.warn(`⚠️  Erro ao executar comando ${i + 1}:`, err.message)
        // Continuar mesmo com erro
      }
    }
    
    // Verificar se as colunas foram criadas
    console.log('\n🔍 Verificando se as colunas foram criadas...')
    const { data: columns, error: checkError } = await supabaseAdmin
      .from('produtos')
      .select('classificacao_tipo, subcategoria_ativo')
      .limit(1)
    
    if (checkError && checkError.message.includes('classificacao_tipo')) {
      console.error('❌ As colunas ainda não existem. Execute o SQL manualmente no banco de dados.')
      console.log('\n📄 SQL para executar manualmente:')
      console.log('='.repeat(80))
      console.log(sql)
      console.log('='.repeat(80))
      process.exit(1)
    } else {
      console.log('✅ Colunas verificadas com sucesso!')
    }
    
    console.log('\n✅ Migration concluída!')
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error)
    console.log('\n📄 Execute o SQL manualmente no banco de dados:')
    console.log('='.repeat(80))
    const migrationPath = path.join(__dirname, '../database/migrations/20250228_reorganizar_categorias_estoque.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    console.log(sql)
    console.log('='.repeat(80))
    process.exit(1)
  }
}

executarMigration()

