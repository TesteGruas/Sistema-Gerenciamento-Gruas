/**
 * Script para atualizar a data_fim de uma alocação
 * 
 * Uso: node scripts/atualizar-alocacao.js <alocacao_id> [nova_data_fim]
 * Exemplo: node scripts/atualizar-alocacao.js 12 2025-12-31
 * Exemplo: node scripts/atualizar-alocacao.js 12 null (para remover data_fim)
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Carregar variáveis de ambiente
const envPath = path.join(__dirname, '../.env')
dotenv.config({ path: envPath })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function atualizarAlocacao(alocacaoId, novaDataFim) {
  console.log('='.repeat(80))
  console.log('🔄 ATUALIZAR DATA_FIM DA ALOCAÇÃO')
  console.log('='.repeat(80))
  console.log(`📋 Alocação ID: ${alocacaoId}`)
  console.log(`📅 Nova data_fim: ${novaDataFim || 'NULL (remover)'}\n`)

  try {
    // 1. Buscar alocação atual
    console.log('1️⃣ Buscando alocação atual...')
    const { data: alocacao, error: errorBuscar } = await supabaseAdmin
      .from('funcionarios_obras')
      .select(`
        *,
        funcionarios(id, nome),
        obras(id, nome)
      `)
      .eq('id', alocacaoId)
      .single()

    if (errorBuscar) {
      console.error('❌ Erro ao buscar alocação:', errorBuscar)
      return
    }

    if (!alocacao) {
      console.log('❌ Alocação não encontrada')
      return
    }

    console.log('✅ Alocação encontrada:')
    console.log(`   Funcionário: ${alocacao.funcionarios?.nome} (ID: ${alocacao.funcionario_id})`)
    console.log(`   Obra: ${alocacao.obras?.nome} (ID: ${alocacao.obra_id})`)
    console.log(`   Data Início: ${alocacao.data_inicio}`)
    console.log(`   Data Fim Atual: ${alocacao.data_fim || 'NULL'}`)
    console.log(`   Status: ${alocacao.status}\n`)

    // 2. Preparar dados para atualização
    const dadosAtualizacao = {}
    if (novaDataFim === 'null' || novaDataFim === null || novaDataFim === '') {
      dadosAtualizacao.data_fim = null
      console.log('📝 Removendo data_fim (definindo como NULL)...')
    } else {
      // Validar formato da data
      const dataTeste = new Date(novaDataFim)
      if (isNaN(dataTeste.getTime())) {
        console.error('❌ Data inválida. Use o formato YYYY-MM-DD')
        return
      }
      dadosAtualizacao.data_fim = novaDataFim
      console.log(`📝 Atualizando data_fim para: ${novaDataFim}...`)
    }

    // 3. Atualizar alocação
    const { data: alocacaoAtualizada, error: errorAtualizar } = await supabaseAdmin
      .from('funcionarios_obras')
      .update(dadosAtualizacao)
      .eq('id', alocacaoId)
      .select()
      .single()

    if (errorAtualizar) {
      console.error('❌ Erro ao atualizar alocação:', errorAtualizar)
      return
    }

    console.log('\n✅ Alocação atualizada com sucesso!')
    console.log(`   Nova data_fim: ${alocacaoAtualizada.data_fim || 'NULL'}`)
    
    // 4. Verificar se agora está ativa
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const dataFim = alocacaoAtualizada.data_fim ? new Date(alocacaoAtualizada.data_fim) : null
    
    if (!dataFim || dataFim >= hoje) {
      console.log('✅ Alocação está ATIVA (sem data_fim ou data_fim no futuro)')
    } else {
      console.log('⚠️ Alocação ainda está INATIVA (data_fim no passado)')
    }

    console.log('='.repeat(80))

  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    process.exit(1)
  }
}

// Executar script
const alocacaoId = process.argv[2]
const novaDataFim = process.argv[3]

if (!alocacaoId) {
  console.error('❌ Por favor, forneça o ID da alocação')
  console.log('Uso: node scripts/atualizar-alocacao.js <alocacao_id> [nova_data_fim]')
  console.log('Exemplo: node scripts/atualizar-alocacao.js 12 2025-12-31')
  console.log('Exemplo: node scripts/atualizar-alocacao.js 12 null (para remover data_fim)')
  process.exit(1)
}

atualizarAlocacao(parseInt(alocacaoId), novaDataFim)
  .then(() => {
    console.log('\n✅ Script concluído')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error)
    process.exit(1)
  })

