/**
 * Testes REAIS para Rotas de Relacionamentos
 * Sistema de Gerenciamento de Gruas API
 * 
 * Este arquivo contém testes que conectam com o banco de homologação real
 * e criam registros reais para verificação manual
 */

const request = require('supertest')
const dotenv = require('dotenv')

// Carregar variáveis de ambiente
dotenv.config()

// URL da API real (servidor deve estar rodando)
const API_BASE_URL = 'http://localhost:3001'

describe('Relacionamentos - Testes REAIS com Banco de Homologação', () => {
  let authToken
  let testRecords = {
    created: [],
    updated: [],
    deleted: []
  }
  let testGruaId
  let testObraId
  let testFuncionarioId
  let testEquipamentoId

  beforeAll(async () => {
    console.log('🔑 Obtendo token de autenticação...')
    
    try {
      // Fazer login para obter token
      const loginResponse = await request(API_BASE_URL)
        .post('/api/auth/login')
        .send({
          email: 'admin@admin.com',
          password: 'teste@123'
        })
      
      if (loginResponse.status === 200) {
        authToken = loginResponse.body.data.access_token
        console.log('✅ Token de autenticação obtido com sucesso')
      } else {
        console.log('❌ Erro ao obter token:', loginResponse.body)
        throw new Error('Falha na autenticação')
      }

      // Obter IDs de registros existentes para testes
      await setupTestData()
    } catch (error) {
      console.log('❌ Erro ao conectar com a API:', error.message)
      console.log('💡 Certifique-se de que o servidor está rodando: npm run dev')
      throw error
    }
  })

  afterAll(() => {
    // Listar todos os registros criados para verificação manual
    console.log('\n📋 RESUMO DOS REGISTROS DE TESTE CRIADOS NO BANCO REAL:')
    console.log('=======================================================')
    
    if (testRecords.created.length > 0) {
      console.log('\n🆕 REGISTROS CRIADOS:')
      testRecords.created.forEach(record => {
        console.log(`   ${record.type} - ID: ${record.id} - ${record.timestamp}`)
        console.log(`   Dados: ${JSON.stringify(record.data, null, 2)}`)
      })
    }
    
    if (testRecords.updated.length > 0) {
      console.log('\n🔄 REGISTROS ATUALIZADOS:')
      testRecords.updated.forEach(record => {
        console.log(`   ${record.type} - ID: ${record.id} - ${record.timestamp}`)
        console.log(`   Dados novos: ${JSON.stringify(record.newData, null, 2)}`)
      })
    }
    
    console.log('\n💡 Verifique estes registros no Supabase Dashboard:')
    console.log('   https://mghdktkoejobsmdbvssl.supabase.co')
    console.log('   Tabelas: grua_obra, grua_funcionario, grua_equipamento')
    console.log('   Filtre por observações que contenham "Teste Automatizado"')
  })

  // Função para configurar dados de teste
  const setupTestData = async () => {
    console.log('🔧 Configurando dados de teste...')
    
    try {
      // Obter uma grua existente
      const gruasResponse = await request(API_BASE_URL)
        .get('/api/gruas')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 1 })
      
      if (gruasResponse.status === 200 && gruasResponse.body.data.length > 0) {
        testGruaId = gruasResponse.body.data[0].id
        console.log(`✅ Grua encontrada: ${testGruaId}`)
      }

      // Obter uma obra existente
      const obrasResponse = await request(API_BASE_URL)
        .get('/api/obras')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 1 })
      
      if (obrasResponse.status === 200 && obrasResponse.body.data.length > 0) {
        testObraId = obrasResponse.body.data[0].id
        console.log(`✅ Obra encontrada: ${testObraId}`)
      }

      // Criar um funcionário de teste se não existir
      const funcionarioResponse = await request(API_BASE_URL)
        .post('/api/funcionarios')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Teste Automatizado - Funcionário Relacionamento',
          cargo: 'Operador',
          telefone: '81999999999',
          email: 'relacionamento@teste.com',
          cpf: '55555555555',
          turno: 'Diurno',
          status: 'Ativo'
        })
      
      if (funcionarioResponse.status === 201) {
        testFuncionarioId = funcionarioResponse.body.data.id
        console.log(`✅ Funcionário criado: ${testFuncionarioId}`)
      }

      // Criar um equipamento de teste se não existir
      const equipamentoResponse = await request(API_BASE_URL)
        .post('/api/equipamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Teste Automatizado - Equipamento Relacionamento',
          tipo: 'Garra',
          capacidade: '1000kg',
          status: 'Disponível'
        })
      
      if (equipamentoResponse.status === 201) {
        testEquipamentoId = equipamentoResponse.body.data.id
        console.log(`✅ Equipamento criado: ${testEquipamentoId}`)
      }

    } catch (error) {
      console.log('⚠️ Erro ao configurar dados de teste:', error.message)
    }
  }

  // Função auxiliar para criar relacionamento de teste
  const createTestRelacionamento = async (endpoint, data) => {
    const response = await request(API_BASE_URL)
      .post(`/api/relacionamentos/${endpoint}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(data)
    
    if (response.status === 201) {
      const record = {
        id: response.body.data.id,
        type: `Relacionamento ${endpoint}`,
        data: data,
        timestamp: new Date().toISOString()
      }
      testRecords.created.push(record)
      
      console.log(`✅ Relacionamento ${endpoint} criado no banco REAL - ID: ${record.id}`)
    } else {
      console.log(`❌ Erro ao criar relacionamento ${endpoint}: ${response.status} - ${JSON.stringify(response.body)}`)
    }
    
    return response
  }

  // =====================================================
  // TESTES DE AUTENTICAÇÃO E AUTORIZAÇÃO
  // =====================================================
  describe('Autenticação e Autorização', () => {
    test('Deve rejeitar requisições sem token', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/relacionamentos/grua-obra')
      
      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    test('Deve rejeitar token inválido', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/relacionamentos/grua-obra')
        .set('Authorization', 'Bearer token-invalido')
      
      expect(response.status).toBe(403)
    })

    test('Deve aceitar token válido', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/relacionamentos/grua-obra')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
    })
  })

  // =====================================================
  // TESTES DE VALIDAÇÃO DE DADOS
  // =====================================================
  describe('Validação de Dados', () => {
    test('Deve rejeitar dados obrigatórios ausentes para grua-obra', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/relacionamentos/grua-obra')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          valor_locacao_mensal: 5000
          // Faltando grua_id, obra_id e data_inicio_locacao obrigatórios
        })
      
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })

    test('Deve rejeitar tipos de dados incorretos', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/relacionamentos/grua-funcionario')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          grua_id: 123, // Deveria ser string
          funcionario_id: 'não é número', // Deveria ser number
          data_inicio: 'data inválida' // Deveria ser date
        })
      
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })

    test('Deve aceitar dados válidos para grua-obra', async () => {
      if (!testGruaId || !testObraId) {
        console.log('⚠️ Pulando teste - dados de teste não configurados')
        return
      }

      const timestamp = new Date().toISOString()
      const testData = {
        grua_id: testGruaId,
        obra_id: testObraId,
        data_inicio_locacao: '2024-01-01',
        valor_locacao_mensal: 5000.00,
        status: 'Ativa',
        observacoes: `Teste Automatizado - Validação ${timestamp}`
      }

      const response = await createTestRelacionamento('grua-obra', testData)
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('id')
    })
  })

  // =====================================================
  // TESTES REAIS - CRIAÇÃO DE RELACIONAMENTOS
  // =====================================================
  describe('Testes REAIS - Criação de Relacionamentos', () => {
    test('Deve criar relacionamento grua-obra real no banco - DEIXA REGISTRO NO BANCO', async () => {
      if (!testGruaId || !testObraId) {
        console.log('⚠️ Pulando teste - dados de teste não configurados')
        return
      }

      const timestamp = new Date().toISOString()
      const testData = {
        grua_id: testGruaId,
        obra_id: testObraId,
        data_inicio_locacao: '2024-01-01',
        data_fim_locacao: '2024-12-31',
        valor_locacao_mensal: 8000.00,
        status: 'Ativa',
        observacoes: `Teste Automatizado - Relacionamento Real ${timestamp}`
      }

      const response = await createTestRelacionamento('grua-obra', testData)
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.grua_id).toBe(testData.grua_id)
      expect(response.body.data.obra_id).toBe(testData.obra_id)
    })

    test('Deve criar relacionamento grua-funcionário real no banco - DEIXA REGISTRO NO BANCO', async () => {
      if (!testGruaId || !testFuncionarioId) {
        console.log('⚠️ Pulando teste - dados de teste não configurados')
        return
      }

      const timestamp = new Date().toISOString()
      const testData = {
        grua_id: testGruaId,
        funcionario_id: testFuncionarioId,
        obra_id: testObraId,
        data_inicio: '2024-01-01',
        data_fim: '2024-12-31',
        status: 'Ativo',
        observacoes: `Teste Automatizado - Relacionamento Real 2 ${timestamp}`
      }

      const response = await createTestRelacionamento('grua-funcionario', testData)
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.grua_id).toBe(testData.grua_id)
      expect(response.body.data.funcionario_id).toBe(testData.funcionario_id)
    })

    test('Deve criar relacionamento grua-equipamento real no banco - DEIXA REGISTRO NO BANCO', async () => {
      if (!testGruaId || !testEquipamentoId) {
        console.log('⚠️ Pulando teste - dados de teste não configurados')
        return
      }

      const timestamp = new Date().toISOString()
      const testData = {
        grua_id: testGruaId,
        equipamento_id: testEquipamentoId,
        obra_id: testObraId,
        data_inicio: '2024-01-01',
        data_fim: '2024-12-31',
        status: 'Ativo',
        observacoes: `Teste Automatizado - Relacionamento Real 3 ${timestamp}`
      }

      const response = await createTestRelacionamento('grua-equipamento', testData)
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.grua_id).toBe(testData.grua_id)
      expect(response.body.data.equipamento_id).toBe(testData.equipamento_id)
    })
  })

  // =====================================================
  // TESTES REAIS - LISTAGEM E BUSCA
  // =====================================================
  describe('Testes REAIS - Listagem e Busca', () => {
    test('Deve listar relacionamentos grua-obra reais do banco', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/relacionamentos/grua-obra')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      
      console.log(`📊 Encontrados ${response.body.data.length} relacionamentos grua-obra no banco`)
      
      // Verificar se nossos relacionamentos de teste estão na listagem
      const nossosRelacionamentos = response.body.data.filter(rel => 
        rel.observacoes && rel.observacoes.includes('Teste Automatizado')
      )
      
      console.log(`🎯 Encontrados ${nossosRelacionamentos.length} relacionamentos de teste na listagem`)
    })

    test('Deve listar relacionamentos grua-funcionário reais do banco', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/relacionamentos/grua-funcionario')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      
      console.log(`📊 Encontrados ${response.body.data.length} relacionamentos grua-funcionário no banco`)
    })

    test('Deve listar relacionamentos grua-equipamento reais do banco', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/relacionamentos/grua-equipamento')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      
      console.log(`📊 Encontrados ${response.body.data.length} relacionamentos grua-equipamento no banco`)
    })
  })

  // =====================================================
  // TESTES DE FILTROS E BUSCA
  // =====================================================
  describe('Filtros e Busca', () => {
    test('Deve filtrar relacionamentos grua-obra por grua_id', async () => {
      if (!testGruaId) {
        console.log('⚠️ Pulando teste - grua_id não configurado')
        return
      }

      const response = await request(API_BASE_URL)
        .get('/api/relacionamentos/grua-obra')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ grua_id: testGruaId })
      
      expect(response.status).toBe(200)
      expect(response.body.data.every(rel => rel.grua_id === testGruaId)).toBe(true)
    })

    test('Deve filtrar relacionamentos por status', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/relacionamentos/grua-obra')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'Ativa' })
      
      expect(response.status).toBe(200)
      expect(response.body.data.every(rel => rel.status === 'Ativa')).toBe(true)
    })

    test('Deve ordenar resultados por data', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/relacionamentos/grua-obra')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10 })
      
      expect(response.status).toBe(200)
      
      // Verificar se está ordenado por data_inicio_locacao (descendente)
      const datas = response.body.data.map(rel => new Date(rel.data_inicio_locacao))
      for (let i = 1; i < datas.length; i++) {
        expect(datas[i-1].getTime()).toBeGreaterThanOrEqual(datas[i].getTime())
      }
    })
  })

  // =====================================================
  // TESTES DE PERFORMANCE E LIMITES
  // =====================================================
  describe('Performance e Limites', () => {
    test('Deve respeitar rate limiting', async () => {
      // Fazer várias requisições rapidamente
      const promises = Array(5).fill().map(() => 
        request(API_BASE_URL)
          .get('/api/relacionamentos/grua-obra')
          .set('Authorization', `Bearer ${authToken}`)
      )
      
      const responses = await Promise.all(promises)
      
      // Todas devem ser bem-sucedidas (rate limit é 100/15min)
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    test('Deve responder dentro do tempo esperado', async () => {
      const startTime = Date.now()
      
      const response = await request(API_BASE_URL)
        .get('/api/relacionamentos/grua-obra')
        .set('Authorization', `Bearer ${authToken}`)
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(5000) // Menos de 5 segundos
      
      console.log(`⏱️ Tempo de resposta: ${responseTime}ms`)
    })
  })

  // =====================================================
  // TESTES DE TRATAMENTO DE ERROS
  // =====================================================
  describe('Tratamento de Erros', () => {
    test('Deve retornar erro 400 para dados inválidos', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/relacionamentos/grua-obra')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          grua_id: '', // Grua ID vazio
          obra_id: 'não é número', // Obra ID inválido
          data_inicio_locacao: 'data inválida' // Data inválida
        })
      
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })

    test('Deve retornar erro 401 para não autenticado', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/relacionamentos/grua-obra')
      
      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    test('Deve retornar erro 400 para grua não encontrada', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/relacionamentos/grua-obra')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          grua_id: 'GRUA_INEXISTENTE',
          obra_id: 1,
          data_inicio_locacao: '2024-01-01'
        })
      
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Grua não encontrada')
    })

    test('Deve retornar erro 400 para obra não encontrada', async () => {
      if (!testGruaId) {
        console.log('⚠️ Pulando teste - grua_id não configurado')
        return
      }

      const response = await request(API_BASE_URL)
        .post('/api/relacionamentos/grua-obra')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          grua_id: testGruaId,
          obra_id: 99999, // Obra que não existe
          data_inicio_locacao: '2024-01-01'
        })
      
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Obra não encontrada')
    })

    test('Deve retornar erro 400 para relacionamento duplicado', async () => {
      if (!testGruaId || !testObraId) {
        console.log('⚠️ Pulando teste - dados de teste não configurados')
        return
      }

      // Criar primeiro relacionamento
      const response1 = await createTestRelacionamento('grua-obra', {
        grua_id: testGruaId,
        obra_id: testObraId,
        data_inicio_locacao: '2024-01-01',
        status: 'Ativa',
        observacoes: 'Teste Automatizado - Relacionamento Duplicado'
      })

      if (response1.status === 201) {
        // Tentar criar relacionamento duplicado
        const response2 = await request(API_BASE_URL)
          .post('/api/relacionamentos/grua-obra')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            grua_id: testGruaId,
            obra_id: testObraId,
            data_inicio_locacao: '2024-01-01',
            status: 'Ativa',
            observacoes: 'Teste Automatizado - Relacionamento Duplicado 2'
          })
        
        expect(response2.status).toBe(400)
        expect(response2.body).toHaveProperty('error', 'Relacionamento já existe')
      }
    })
  })
})

/**
 * INSTRUÇÕES PARA EXECUÇÃO:
 * 
 * 1. Certifique-se de que o servidor da API está rodando:
 *    npm run dev
 * 
 * 2. Execute o teste:
 *    npm test src/routes/tests/relacionamentos-real.test.js
 * 
 * 3. Observe os logs mostrando os IDs dos registros criados
 * 
 * 4. Acesse o Supabase Dashboard para verificar os registros:
 *    - URL: https://mghdktkoejobsmdbvssl.supabase.co
 *    - Tabelas: grua_obra, grua_funcionario, grua_equipamento
 *    - Filtre por observações que contenham "Teste Automatizado"
 * 
 * 5. Verifique manualmente:
 *    - Se os relacionamentos foram criados corretamente
 *    - Se as operações foram executadas corretamente
 *    - Se os dados estão consistentes
 * 
 * 6. Os registros ficam no banco para análise posterior
 */
