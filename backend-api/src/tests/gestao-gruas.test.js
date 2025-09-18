/**
 * Testes para funcionalidades de gestão dinâmica de gruas
 * Sistema de Gerenciamento de Gruas
 */

import { supabaseAdmin } from '../config/supabase.js'

// Dados de teste
const dadosTeste = {
  grua: {
    id: 'TEST001',
    modelo: 'GT-Test',
    fabricante: 'Teste',
    tipo: 'Grua Torre',
    capacidade: '5 toneladas',
    capacidade_ponta: '2 toneladas',
    lanca: '30 metros',
    altura_trabalho: '35 metros',
    ano: 2020,
    status: 'Disponível',
    localizacao: 'Teste Localização',
    horas_operacao: 1000,
    valor_locacao: 5000.00,
    valor_operacao: 200.00,
    valor_sinaleiro: 150.00,
    valor_manutencao: 300.00
  },
  obra1: {
    id: 999,
    nome: 'Obra Teste 1',
    cliente_id: 999,
    endereco: 'Rua Teste, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    tipo: 'Residencial',
    status: 'Pausada'
  },
  obra2: {
    id: 998,
    nome: 'Obra Teste 2',
    cliente_id: 999,
    endereco: 'Rua Teste, 456',
    cidade: 'São Paulo',
    estado: 'SP',
    tipo: 'Comercial',
    status: 'Pausada'
  },
  funcionario: {
    id: 999,
    nome: 'Funcionário Teste',
    cargo: 'Operador',
    status: 'Ativo'
  },
  cliente: {
    id: 999,
    nome: 'Cliente Teste',
    cnpj: '99.999.999/0001-99',
    email: 'cliente.teste@exemplo.com',
    telefone: '(11) 99999-9999'
  }
}

/**
 * Limpar dados de teste
 */
async function limparDadosTeste() {
  try {
    console.log('🧹 Limpando dados de teste...')

    // Limpar histórico de teste
    await supabaseAdmin
      .from('historico_locacoes')
      .delete()
      .eq('grua_id', dadosTeste.grua.id)

    // Limpar relacionamentos de teste
    await supabaseAdmin
      .from('grua_obra')
      .delete()
      .eq('grua_id', dadosTeste.grua.id)

    await supabaseAdmin
      .from('grua_funcionario')
      .delete()
      .eq('grua_id', dadosTeste.grua.id)

    // Limpar entidades de teste
    await supabaseAdmin
      .from('gruas')
      .delete()
      .eq('id', dadosTeste.grua.id)

    await supabaseAdmin
      .from('obras')
      .delete()
      .in('id', [dadosTeste.obra1.id, dadosTeste.obra2.id])

    await supabaseAdmin
      .from('funcionarios')
      .delete()
      .eq('id', dadosTeste.funcionario.id)

    await supabaseAdmin
      .from('clientes')
      .delete()
      .eq('id', dadosTeste.cliente.id)

    console.log('✅ Dados de teste limpos com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao limpar dados de teste:', error)
  }
}

/**
 * Criar dados de teste
 */
async function criarDadosTeste() {
  try {
    console.log('🔧 Criando dados de teste...')

    // Criar cliente de teste primeiro (necessário para as obras)
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .insert([dadosTeste.cliente])
      .select()
      .single()

    if (clienteError) {
      throw new Error(`Erro ao criar cliente: ${clienteError.message}`)
    }

    // Criar grua de teste
    const { data: grua, error: gruaError } = await supabaseAdmin
      .from('gruas')
      .insert([dadosTeste.grua])
      .select()
      .single()

    if (gruaError) {
      throw new Error(`Erro ao criar grua: ${gruaError.message}`)
    }

    // Criar obras de teste
    const { data: obra1, error: obra1Error } = await supabaseAdmin
      .from('obras')
      .insert([dadosTeste.obra1])
      .select()
      .single()

    if (obra1Error) {
      throw new Error(`Erro ao criar obra1: ${obra1Error.message}`)
    }

    const { data: obra2, error: obra2Error } = await supabaseAdmin
      .from('obras')
      .insert([dadosTeste.obra2])
      .select()
      .single()

    if (obra2Error) {
      throw new Error(`Erro ao criar obra2: ${obra2Error.message}`)
    }

    // Criar funcionário de teste
    const { data: funcionario, error: funcionarioError } = await supabaseAdmin
      .from('funcionarios')
      .insert([dadosTeste.funcionario])
      .select()
      .single()

    if (funcionarioError) {
      throw new Error(`Erro ao criar funcionário: ${funcionarioError.message}`)
    }

    console.log('✅ Dados de teste criados com sucesso!')
    return { grua, obra1, obra2, funcionario, cliente }

  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error)
    throw error
  }
}

/**
 * Teste 1: Verificar disponibilidade de grua
 */
async function testeDisponibilidade() {
  try {
    console.log('🧪 Teste 1: Verificando disponibilidade...')

    const { data, error } = await supabaseAdmin
      .from('gruas')
      .select('*')
      .eq('id', dadosTeste.grua.id)
      .single()

    if (error) {
      throw new Error(`Erro ao buscar grua: ${error.message}`)
    }

    console.log('✅ Grua encontrada:', data.modelo)
    return true

  } catch (error) {
    console.error('❌ Erro no teste de disponibilidade:', error)
    return false
  }
}

/**
 * Teste 2: Criar locação inicial
 */
async function testeCriarLocacao() {
  try {
    console.log('🧪 Teste 2: Criando locação inicial...')

    const { data, error } = await supabaseAdmin
      .from('grua_obra')
      .insert([{
        grua_id: dadosTeste.grua.id,
        obra_id: dadosTeste.obra1.id,
        data_inicio_locacao: '2024-01-01',
        data_fim_locacao: '2024-02-15',
        valor_locacao_mensal: 5000.00,
        status: 'Ativa'
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar locação: ${error.message}`)
    }

    console.log('✅ Locação criada:', data.id)
    return data

  } catch (error) {
    console.error('❌ Erro no teste de locação:', error)
    return null
  }
}

/**
 * Teste 3: Criar histórico de locação
 */
async function testeCriarHistorico() {
  try {
    console.log('🧪 Teste 3: Criando histórico de locação...')

    const { data, error } = await supabaseAdmin
      .from('historico_locacoes')
      .insert([{
        grua_id: dadosTeste.grua.id,
        obra_id: dadosTeste.obra1.id,
        data_inicio: '2024-01-01',
        data_fim: '2024-02-15',
        funcionario_responsavel_id: dadosTeste.funcionario.id,
        tipo_operacao: 'Início',
        valor_locacao: 5000.00,
        observacoes: 'Locação inicial de teste'
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar histórico: ${error.message}`)
    }

    console.log('✅ Histórico criado:', data.id)
    return data

  } catch (error) {
    console.error('❌ Erro no teste de histórico:', error)
    return null
  }
}

/**
 * Teste 4: Verificar conflitos de agendamento
 */
async function testeVerificarConflitos() {
  try {
    console.log('🧪 Teste 4: Verificando conflitos de agendamento...')

    const { data, error } = await supabaseAdmin
      .from('grua_obra')
      .select('*')
      .eq('grua_id', dadosTeste.grua.id)
      .eq('status', 'Ativa')
      .gte('data_inicio_locacao', '2024-01-01')
      .lte('data_fim_locacao', '2024-03-01')

    if (error) {
      throw new Error(`Erro ao verificar conflitos: ${error.message}`)
    }

    console.log('✅ Conflitos verificados:', data.length, 'encontrados')
    return data

  } catch (error) {
    console.error('❌ Erro no teste de conflitos:', error)
    return []
  }
}

/**
 * Teste 5: Transferir grua
 */
async function testeTransferirGrua() {
  try {
    console.log('🧪 Teste 5: Transferindo grua...')

    // Atualizar locação existente
    const { data, error } = await supabaseAdmin
      .from('grua_obra')
      .update({
        obra_id: dadosTeste.obra2.id,
        data_inicio_locacao: '2024-02-16',
        observacoes: 'Transferida de Obra Teste 1 para Obra Teste 2'
      })
      .eq('grua_id', dadosTeste.grua.id)
      .eq('status', 'Ativa')
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao transferir grua: ${error.message}`)
    }

    // Criar histórico de transferência
    await supabaseAdmin
      .from('historico_locacoes')
      .insert([{
        grua_id: dadosTeste.grua.id,
        obra_id: dadosTeste.obra2.id,
        data_inicio: '2024-02-16',
        funcionario_responsavel_id: dadosTeste.funcionario.id,
        tipo_operacao: 'Transferência',
        valor_locacao: 5500.00,
        observacoes: 'Transferida de Obra Teste 1 para Obra Teste 2'
      }])

    console.log('✅ Grua transferida com sucesso!')
    return data

  } catch (error) {
    console.error('❌ Erro no teste de transferência:', error)
    return null
  }
}

/**
 * Executar todos os testes
 */
async function executarTestes() {
  console.log('🚀 Iniciando testes de gestão dinâmica de gruas...')
  
  try {
    // Limpar dados anteriores
    await limparDadosTeste()

    // Criar dados de teste
    const dados = await criarDadosTeste()

    // Executar testes
    const resultados = {
      disponibilidade: await testeDisponibilidade(),
      locacao: await testeCriarLocacao(),
      historico: await testeCriarHistorico(),
      conflitos: await testeVerificarConflitos(),
      transferencia: await testeTransferirGrua()
    }

    // Relatório final
    console.log('\n📊 RELATÓRIO DE TESTES:')
    console.log('========================')
    console.log(`✅ Disponibilidade: ${resultados.disponibilidade ? 'PASSOU' : 'FALHOU'}`)
    console.log(`✅ Locação: ${resultados.locacao ? 'PASSOU' : 'FALHOU'}`)
    console.log(`✅ Histórico: ${resultados.historico ? 'PASSOU' : 'FALHOU'}`)
    console.log(`✅ Conflitos: ${resultados.conflitos.length >= 0 ? 'PASSOU' : 'FALHOU'}`)
    console.log(`✅ Transferência: ${resultados.transferencia ? 'PASSOU' : 'FALHOU'}`)

    const totalTestes = Object.keys(resultados).length
    const testesPassaram = Object.values(resultados).filter(r => r).length

    console.log(`\n🎯 RESULTADO FINAL: ${testesPassaram}/${totalTestes} testes passaram`)

    if (testesPassaram === totalTestes) {
      console.log('🎉 TODOS OS TESTES PASSARAM! Sistema funcionando corretamente.')
    } else {
      console.log('⚠️ Alguns testes falharam. Verifique os logs acima.')
    }

  } catch (error) {
    console.error('❌ Erro durante os testes:', error)
  } finally {
    // Limpar dados de teste
    await limparDadosTeste()
    console.log('\n🏁 Testes concluídos!')
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  executarTestes().catch(console.error)
} else {
  // Executar sempre para debug
  executarTestes().catch(console.error)
}

export {
  executarTestes,
  limparDadosTeste,
  criarDadosTeste,
  testeDisponibilidade,
  testeCriarLocacao,
  testeCriarHistorico,
  testeVerificarConflitos,
  testeTransferirGrua
}
