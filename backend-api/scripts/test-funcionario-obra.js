/**
 * Script de teste para verificar se um funcionário está vinculado a uma obra
 * 
 * Uso: node scripts/test-funcionario-obra.js <email>
 * Exemplo: node scripts/test-funcionario-obra.js samuellinkon+operador@gmail.com
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

async function testFuncionarioObra(email) {
  console.log('='.repeat(80))
  console.log('🔍 TESTE DE VINCULAÇÃO FUNCIONÁRIO-OBRA')
  console.log('='.repeat(80))
  console.log(`📧 Email: ${email}\n`)

  try {
    // 1. Buscar usuário pelo email
    console.log('1️⃣ Buscando usuário pelo email...')
    const { data: usuarios, error: errorUsuarios } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .limit(1)

    if (errorUsuarios) {
      console.error('❌ Erro ao buscar usuário:', errorUsuarios)
      return
    }

    if (!usuarios || usuarios.length === 0) {
      console.log('❌ Usuário não encontrado com este email')
      return
    }

    const usuario = usuarios[0]
    console.log('✅ Usuário encontrado:')
    console.log(`   ID: ${usuario.id}`)
    console.log(`   Nome: ${usuario.nome}`)
    console.log(`   Email: ${usuario.email}`)
    console.log(`   Funcionário ID: ${usuario.funcionario_id || 'NÃO VINCULADO'}\n`)

    // 2. Buscar funcionário vinculado
    let funcionario = null
    if (usuario.funcionario_id) {
      console.log('2️⃣ Buscando funcionário vinculado...')
      const { data: funcionarios, error: errorFuncionarios } = await supabaseAdmin
        .from('funcionarios')
        .select('*')
        .eq('id', usuario.funcionario_id)
        .limit(1)

      if (errorFuncionarios) {
        console.error('❌ Erro ao buscar funcionário:', errorFuncionarios)
      } else if (funcionarios && funcionarios.length > 0) {
        funcionario = funcionarios[0]
        console.log('✅ Funcionário encontrado:')
        console.log(`   ID: ${funcionario.id}`)
        console.log(`   Nome: ${funcionario.nome}`)
        console.log(`   Cargo: ${funcionario.cargo || 'N/A'}`)
        console.log(`   Status: ${funcionario.status || 'N/A'}\n`)
      } else {
        console.log('⚠️ Funcionário não encontrado com ID:', usuario.funcionario_id)
      }
    } else {
      // Tentar buscar funcionário pelo email
      console.log('2️⃣ Buscando funcionário pelo email (fallback)...')
      const { data: funcionarios, error: errorFuncionarios } = await supabaseAdmin
        .from('funcionarios')
        .select('*')
        .eq('email', email)
        .limit(1)

      if (errorFuncionarios) {
        console.error('❌ Erro ao buscar funcionário:', errorFuncionarios)
      } else if (funcionarios && funcionarios.length > 0) {
        funcionario = funcionarios[0]
        console.log('✅ Funcionário encontrado pelo email:')
        console.log(`   ID: ${funcionario.id}`)
        console.log(`   Nome: ${funcionario.nome}`)
        console.log(`   Cargo: ${funcionario.cargo || 'N/A'}`)
        console.log(`   Status: ${funcionario.status || 'N/A'}\n`)
      } else {
        console.log('❌ Funcionário não encontrado pelo email\n')
      }
    }

    if (!funcionario) {
      console.log('❌ Não foi possível encontrar o funcionário vinculado')
      return
    }

    // 3. Buscar alocações ativas
    console.log('3️⃣ Buscando alocações ativas do funcionário...')
    const { data: alocacoes, error: errorAlocacoes } = await supabaseAdmin
      .from('funcionarios_obras')
      .select(`
        *,
        obras (
          id,
          nome,
          cidade,
          estado,
          endereco,
          status
        )
      `)
      .eq('funcionario_id', funcionario.id)
      .eq('status', 'ativo')

    if (errorAlocacoes) {
      console.error('❌ Erro ao buscar alocações:', errorAlocacoes)
      return
    }

    console.log(`\n📊 Resultado: ${alocacoes?.length || 0} alocação(ões) ativa(s) encontrada(s)\n`)

    if (!alocacoes || alocacoes.length === 0) {
      console.log('❌ NENHUMA OBRA ATIVA ENCONTRADA')
      console.log('\n🔍 Verificando todas as alocações (incluindo inativas)...')
      
      const { data: todasAlocacoes, error: errorTodas } = await supabaseAdmin
        .from('funcionarios_obras')
        .select(`
          *,
          obras (
            id,
            nome,
            cidade,
            estado,
            endereco,
            status
          )
        `)
        .eq('funcionario_id', funcionario.id)
        .order('data_inicio', { ascending: false })

      if (!errorTodas && todasAlocacoes && todasAlocacoes.length > 0) {
        console.log(`\n📋 Total de alocações encontradas: ${todasAlocacoes.length}`)
        todasAlocacoes.forEach((aloc, index) => {
          console.log(`\n   Alocação ${index + 1}:`)
          console.log(`   - ID: ${aloc.id}`)
          console.log(`   - Status: ${aloc.status}`)
          console.log(`   - Data Início: ${aloc.data_inicio}`)
          console.log(`   - Data Fim: ${aloc.data_fim || 'N/A'}`)
          if (aloc.obras) {
            console.log(`   - Obra: ${aloc.obras.nome} (ID: ${aloc.obras.id})`)
            console.log(`   - Local: ${aloc.obras.cidade}, ${aloc.obras.estado}`)
          }
        })
      } else {
        console.log('❌ Nenhuma alocação encontrada (nem ativa nem inativa)')
      }
    } else {
      console.log('✅ OBRAS ATIVAS ENCONTRADAS:\n')
      alocacoes.forEach((aloc, index) => {
        console.log(`   Obra ${index + 1}:`)
        console.log(`   - ID da Alocação: ${aloc.id}`)
        console.log(`   - Data Início: ${aloc.data_inicio}`)
        console.log(`   - Data Fim: ${aloc.data_fim || 'N/A'}`)
        console.log(`   - Horas Trabalhadas: ${aloc.horas_trabalhadas || 0}`)
        if (aloc.obras) {
          console.log(`   - Obra ID: ${aloc.obras.id}`)
          console.log(`   - Nome: ${aloc.obras.nome}`)
          console.log(`   - Endereço: ${aloc.obras.endereco || 'N/A'}`)
          console.log(`   - Cidade/Estado: ${aloc.obras.cidade}, ${aloc.obras.estado}`)
          console.log(`   - Status da Obra: ${aloc.obras.status || 'N/A'}`)
        }
        console.log('')
      })
    }

    // 4. Resumo final
    console.log('='.repeat(80))
    console.log('📋 RESUMO:')
    console.log('='.repeat(80))
    console.log(`✅ Usuário: ${usuario.nome} (${usuario.email})`)
    console.log(`✅ Funcionário: ${funcionario.nome} (ID: ${funcionario.id})`)
    console.log(`✅ Alocações Ativas: ${alocacoes?.length || 0}`)
    if (alocacoes && alocacoes.length > 0) {
      console.log(`✅ Obras: ${alocacoes.map(a => a.obras?.nome).filter(Boolean).join(', ')}`)
    } else {
      console.log('❌ Nenhuma obra ativa encontrada - o app não mostrará obra nem ponto')
    }
    console.log('='.repeat(80))

  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    process.exit(1)
  }
}

// Executar script
const email = process.argv[2]

if (!email) {
  console.error('❌ Por favor, forneça o email do usuário')
  console.log('Uso: node scripts/test-funcionario-obra.js <email>')
  console.log('Exemplo: node scripts/test-funcionario-obra.js samuellinkon+operador@gmail.com')
  process.exit(1)
}

testFuncionarioObra(email)
  .then(() => {
    console.log('\n✅ Teste concluído')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro ao executar teste:', error)
    process.exit(1)
  })

