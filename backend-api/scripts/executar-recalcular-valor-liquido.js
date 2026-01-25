/**
 * Script para recalcular valor líquido das notas fiscais
 * Execute: node scripts/executar-recalcular-valor-liquido.js
 */

import { supabaseAdmin } from '../src/config/supabase.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function executarRecalculo() {
  try {
    console.log('🔄 Recalculando valor líquido das notas fiscais...\n')
    
    // Buscar todas as notas fiscais
    const { data: notas, error: notasError } = await supabaseAdmin
      .from('notas_fiscais')
      .select('id, numero_nf, valor_total, valor_liquido')
    
    if (notasError) {
      throw notasError
    }
    
    console.log(`📊 Encontradas ${notas?.length || 0} notas fiscais\n`)
    
    let atualizadas = 0
    let comErro = 0
    
    // Para cada nota fiscal, calcular o valor líquido baseado nos itens
    for (const nota of notas || []) {
      try {
        // Buscar itens da nota fiscal
        const { data: itens, error: itensError } = await supabaseAdmin
          .from('notas_fiscais_itens')
          .select('preco_total, valor_liquido')
          .eq('nota_fiscal_id', nota.id)
        
        if (itensError) {
          console.error(`❌ Erro ao buscar itens da nota ${nota.numero_nf}:`, itensError.message)
          comErro++
          continue
        }
        
        // Calcular valor líquido somando os valores líquidos dos itens
        const valorLiquido = (itens || []).reduce((sum, item) => {
          return sum + parseFloat(item.valor_liquido || item.preco_total || 0)
        }, 0)
        
        // Atualizar a nota fiscal
        const { error: updateError } = await supabaseAdmin
          .from('notas_fiscais')
          .update({ valor_liquido: valorLiquido })
          .eq('id', nota.id)
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar nota ${nota.numero_nf}:`, updateError.message)
          comErro++
        } else {
          console.log(`✅ Nota ${nota.numero_nf}: R$ ${nota.valor_total?.toFixed(2)} → R$ ${valorLiquido.toFixed(2)}`)
          atualizadas++
        }
      } catch (err) {
        console.error(`❌ Erro ao processar nota ${nota.numero_nf}:`, err.message)
        comErro++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log(`✅ Concluído!`)
    console.log(`   📝 Notas atualizadas: ${atualizadas}`)
    console.log(`   ⚠️  Notas com erro: ${comErro}`)
    console.log('='.repeat(60))
    
    // Verificar resultado
    console.log('\n🔍 Verificando resultado...')
    const { data: notasVerificacao, error: verifError } = await supabaseAdmin
      .from('notas_fiscais')
      .select('id, numero_nf, valor_total, valor_liquido')
      .limit(5)
    
    if (!verifError && notasVerificacao) {
      console.log('\n📋 Exemplo de notas atualizadas:')
      notasVerificacao.forEach(nota => {
        console.log(`   NF ${nota.numero_nf}: Total R$ ${nota.valor_total?.toFixed(2)} | Líquido R$ ${nota.valor_liquido?.toFixed(2)}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar recálculo:', error)
    console.log('\n💡 Alternativa: Execute o SQL manualmente no Supabase SQL Editor')
    console.log('='.repeat(80))
    const migrationPath = path.join(__dirname, '../database/migrations/20250125_recalcular_valor_liquido_notas_fiscais.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    console.log(sql)
    console.log('='.repeat(80))
    process.exit(1)
  }
}

executarRecalculo()
