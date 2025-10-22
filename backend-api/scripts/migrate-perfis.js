/**
 * Script de Validação e Migração de Perfis
 * 
 * Este script valida o estado do banco antes e depois da migração,
 * gerando relatórios detalhados sobre usuários afetados.
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_KEY não configurada')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Mapeamento de perfis antigos para novos
const PERFIL_MAPPING = {
  'Administrador': 'Admin',
  'Gerente': 'Gestores',
  'Supervisor': 'Supervisores',
  'Operador': 'Operários',
  'Cliente': 'Clientes',
  'Visualizador': 'Operários' // Visualizador será migrado para Operários
}

/**
 * Valida estado PRÉ-migração
 */
async function validatePreMigration() {
  console.log('\n📊 VALIDAÇÃO PRÉ-MIGRAÇÃO\n')
  console.log('='.repeat(60))

  try {
    // 1. Buscar todos os perfis
    const { data: perfis, error: perfisError } = await supabase
      .from('perfis')
      .select('*')
      .order('nivel_acesso', { ascending: false })

    if (perfisError) throw perfisError

    console.log(`\n✓ Total de perfis: ${perfis.length}`)
    console.log('\nPerfis encontrados:')
    perfis.forEach(p => {
      console.log(`  - ${p.nome} (nível ${p.nivel_acesso}, status: ${p.status})`)
    })

    // 2. Contar usuários por perfil
    const { data: usuarioPerfis, error: upError } = await supabase
      .from('usuario_perfis')
      .select(`
        perfil_id,
        perfis!inner(nome),
        status
      `)
      .eq('status', 'Ativa')

    if (upError) throw upError

    const usuariosPorPerfil = {}
    usuarioPerfis.forEach(up => {
      const perfilNome = up.perfis.nome
      usuariosPorPerfil[perfilNome] = (usuariosPorPerfil[perfilNome] || 0) + 1
    })

    console.log('\n✓ Usuários ativos por perfil:')
    Object.entries(usuariosPorPerfil).forEach(([perfil, count]) => {
      const novoNome = PERFIL_MAPPING[perfil] || perfil
      const migracaoInfo = novoNome !== perfil ? ` → será migrado para "${novoNome}"` : ''
      console.log(`  - ${perfil}: ${count} usuário(s)${migracaoInfo}`)
    })

    // 3. Identificar usuários sem perfil
    const { data: usuariosSemPerfil, error: uspError } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .not('id', 'in', 
        supabase.from('usuario_perfis')
          .select('usuario_id')
          .eq('status', 'Ativa')
      )
      .limit(10)

    if (uspError && uspError.code !== 'PGRST116') { // Ignorar erro de "not in" vazio
      console.warn('⚠️  Não foi possível verificar usuários sem perfil')
    } else if (usuariosSemPerfil && usuariosSemPerfil.length > 0) {
      console.log(`\n⚠️  ATENÇÃO: ${usuariosSemPerfil.length} usuário(s) sem perfil ativo encontrado(s):`)
      usuariosSemPerfil.forEach(u => {
        console.log(`  - ${u.nome} (${u.email})`)
      })
      console.log('\n  Estes usuários precisarão de um perfil atribuído após a migração!')
    } else {
      console.log('\n✓ Todos os usuários possuem perfil ativo')
    }

    // 4. Salvar relatório
    const report = {
      timestamp: new Date().toISOString(),
      perfis: perfis,
      usuariosPorPerfil: usuariosPorPerfil,
      usuariosSemPerfil: usuariosSemPerfil || [],
      totalUsuarios: Object.values(usuariosPorPerfil).reduce((a, b) => a + b, 0)
    }

    const reportPath = path.join(__dirname, '../database/migrations/pre-migration-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n✓ Relatório salvo em: ${reportPath}`)

    console.log('\n' + '='.repeat(60))
    console.log('✅ Validação pré-migração concluída com sucesso!')
    
    return report

  } catch (error) {
    console.error('\n❌ Erro na validação pré-migração:', error.message)
    process.exit(1)
  }
}

/**
 * Valida estado PÓS-migração
 */
async function validatePostMigration() {
  console.log('\n📊 VALIDAÇÃO PÓS-MIGRAÇÃO\n')
  console.log('='.repeat(60))

  try {
    // 1. Verificar se os 5 perfis principais existem
    const { data: perfis, error: perfisError } = await supabase
      .from('perfis')
      .select('*')
      .in('nome', ['Admin', 'Gestores', 'Supervisores', 'Operários', 'Clientes'])
      .order('nivel_acesso', { ascending: false })

    if (perfisError) throw perfisError

    if (perfis.length !== 5) {
      console.error(`❌ ERRO: Esperado 5 perfis principais, encontrado ${perfis.length}`)
      process.exit(1)
    }

    console.log('\n✓ Os 5 perfis principais foram criados/atualizados:')
    perfis.forEach(p => {
      console.log(`  - ${p.nome} (nível ${p.nivel_acesso}, status: ${p.status})`)
      console.log(`    Descrição: ${p.descricao}`)
    })

    // 2. Verificar níveis de acesso
    const niveisEsperados = {
      'Admin': 10,
      'Gestores': 9,
      'Supervisores': 6,
      'Operários': 4,
      'Clientes': 1
    }

    let niveisCorretos = true
    perfis.forEach(p => {
      if (p.nivel_acesso !== niveisEsperados[p.nome]) {
        console.error(`  ❌ Nível incorreto para ${p.nome}: ${p.nivel_acesso} (esperado: ${niveisEsperados[p.nome]})`)
        niveisCorretos = false
      }
    })

    if (niveisCorretos) {
      console.log('\n✓ Todos os níveis de acesso estão corretos')
    }

    // 3. Contar usuários por novo perfil
    const { data: usuarioPerfis, error: upError } = await supabase
      .from('usuario_perfis')
      .select(`
        perfil_id,
        perfis!inner(nome),
        status
      `)
      .eq('status', 'Ativa')

    if (upError) throw upError

    const usuariosPorPerfil = {}
    usuarioPerfis.forEach(up => {
      const perfilNome = up.perfis.nome
      usuariosPorPerfil[perfilNome] = (usuariosPorPerfil[perfilNome] || 0) + 1
    })

    console.log('\n✓ Distribuição de usuários após migração:')
    Object.entries(usuariosPorPerfil).forEach(([perfil, count]) => {
      console.log(`  - ${perfil}: ${count} usuário(s)`)
    })

    // 4. Verificar perfil "Visualizador"
    const { data: visualizador, error: vizError } = await supabase
      .from('perfis')
      .select('*')
      .eq('nome', 'Visualizador')
      .single()

    if (!vizError && visualizador) {
      if (visualizador.status === 'Inativo') {
        console.log('\n✓ Perfil "Visualizador" marcado como Inativo')
      } else {
        console.warn('\n⚠️  Perfil "Visualizador" ainda está Ativo (deveria estar Inativo)')
      }

      // Verificar se ainda há usuários com perfil Visualizador
      const { data: usuariosViz, error: uVizError } = await supabase
        .from('usuario_perfis')
        .select('count')
        .eq('perfil_id', visualizador.id)
        .eq('status', 'Ativa')
        .single()

      if (!uVizError && usuariosViz && usuariosViz.count > 0) {
        console.warn(`  ⚠️  ${usuariosViz.count} usuário(s) ainda associado(s) ao perfil Visualizador`)
      } else {
        console.log('  ✓ Nenhum usuário ativo associado ao perfil Visualizador')
      }
    }

    // 5. Salvar relatório
    const report = {
      timestamp: new Date().toISOString(),
      perfis: perfis,
      usuariosPorPerfil: usuariosPorPerfil,
      totalUsuarios: Object.values(usuariosPorPerfil).reduce((a, b) => a + b, 0),
      niveisCorretos: niveisCorretos
    }

    const reportPath = path.join(__dirname, '../database/migrations/post-migration-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n✓ Relatório salvo em: ${reportPath}`)

    console.log('\n' + '='.repeat(60))
    console.log('✅ Validação pós-migração concluída com sucesso!')
    
    return report

  } catch (error) {
    console.error('\n❌ Erro na validação pós-migração:', error.message)
    process.exit(1)
  }
}

/**
 * Compara relatórios pré e pós migração
 */
async function compareReports() {
  try {
    const preReport = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../database/migrations/pre-migration-report.json'),
        'utf-8'
      )
    )
    const postReport = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../database/migrations/post-migration-report.json'),
        'utf-8'
      )
    )

    console.log('\n📊 COMPARAÇÃO PRÉ vs PÓS MIGRAÇÃO\n')
    console.log('='.repeat(60))

    console.log('\nTotal de usuários:')
    console.log(`  Antes: ${preReport.totalUsuarios}`)
    console.log(`  Depois: ${postReport.totalUsuarios}`)

    if (preReport.totalUsuarios === postReport.totalUsuarios) {
      console.log('  ✓ Nenhum usuário perdido na migração')
    } else {
      console.warn(`  ⚠️  Diferença de ${Math.abs(preReport.totalUsuarios - postReport.totalUsuarios)} usuários`)
    }

    console.log('\n' + '='.repeat(60))

  } catch (error) {
    console.warn('⚠️  Não foi possível comparar relatórios:', error.message)
  }
}

// CLI
const command = process.argv[2]

switch (command) {
  case 'pre':
    validatePreMigration()
    break
  case 'post':
    validatePostMigration()
    break
  case 'compare':
    compareReports()
    break
  default:
    console.log(`
📝 Script de Validação de Migração de Perfis

Uso:
  node migrate-perfis.js <comando>

Comandos:
  pre      - Validação PRÉ-migração (execute antes de rodar a migration SQL)
  post     - Validação PÓS-migração (execute após rodar a migration SQL)
  compare  - Compara relatórios pré e pós migração

Exemplos:
  npm run migrate:perfis:pre
  npm run migrate:perfis:post
  npm run migrate:perfis:compare
`)
    break
}


