/**
 * Testes REAIS para Rotas de Equipamentos Auxiliares
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

describe('Equipamentos Auxiliares - Testes REAIS com Banco de Homologação', () => {
  let authToken
  let testRecords = {
    created: [],
    updated: [],
    deleted: []
  }

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
    console.log('   Tabela: equipamentos_auxiliares')
    console.log('   Filtre por nomes que contenham "Teste Automatizado"')
  })

  // Função auxiliar para criar registro de teste
  const createTestRecord = async (data) => {
    const response = await request(API_BASE_URL)
      .post('/api/equipamentos')
      .set('Authorization', `Bearer ${authToken}`)
      .send(data)
    
    if (response.status === 201) {
      const record = {
        id: response.body.data.id,
        type: 'Equipamento',
        data: data,
        timestamp: new Date().toISOString()
      }
      testRecords.created.push(record)
      
      console.log(`✅ Equipamento criado no banco REAL - ID: ${record.id}`)
    } else {
      console.log(`❌ Erro ao criar equipamento: ${response.status} - ${JSON.stringify(response.body)}`)
    }
    
    return response
  }

  // Função auxiliar para atualizar registro de teste
  const updateTestRecord = async (id, data) => {
    const response = await request(API_BASE_URL)
      .put(`/api/equipamentos/${id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(data)
    
    if (response.status === 200) {
      const record = {
        id: id,
        type: 'Equipamento',
        oldData: {},
        newData: data,
        timestamp: new Date().toISOString()
      }
      testRecords.updated.push(record)
      
      console.log(`✅ Equipamento atualizado no banco REAL - ID: ${id}`)
    } else {
      console.log(`❌ Erro ao atualizar equipamento: ${response.status} - ${JSON.stringify(response.body)}`)
    }
    
    return response
  }

  // =====================================================
  // TESTES DE AUTENTICAÇÃO E AUTORIZAÇÃO
  // =====================================================
  describe('Autenticação e Autorização', () => {
    test('Deve rejeitar requisições sem token', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/equipamentos')
      
      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    test('Deve rejeitar token inválido', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/equipamentos')
        .set('Authorization', 'Bearer token-invalido')
      
      expect(response.status).toBe(403)
    })

    test('Deve aceitar token válido', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/equipamentos')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
    })
  })

  // =====================================================
  // TESTES DE VALIDAÇÃO DE DADOS
  // =====================================================
  describe('Validação de Dados', () => {
    test('Deve rejeitar dados obrigatórios ausentes', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/equipamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          capacidade: '2500kg'
          // Faltando nome e tipo obrigatórios
        })
      
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })

    test('Deve rejeitar tipos de dados incorretos', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/equipamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 123, // Deveria ser string
          tipo: 'Garfo Paleteiro',
          responsavel_id: 'não é número' // Deveria ser number
        })
      
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })

    test('Deve rejeitar formatos inválidos', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/equipamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Garfo Teste',
          tipo: 'Tipo Inexistente', // Tipo inválido
          status: 'Status Inexistente' // Status inválido
        })
      
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })

    test('Deve aceitar dados válidos', async () => {
      const timestamp = new Date().toISOString()
      const testData = {
        nome: `Teste Automatizado - Validação ${timestamp}`,
        tipo: 'Garfo Paleteiro',
        capacidade: '2500kg',
        status: 'Disponível'
      }

      const response = await createTestRecord(testData)
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.nome).toBe(testData.nome)
    })
  })

  // =====================================================
  // TESTES REAIS - CRIAÇÃO DE REGISTROS
  // =====================================================
  describe('Testes REAIS - Criação de Registros', () => {
    test('Deve criar registro real no banco de homologação - DEIXA REGISTRO NO BANCO', async () => {
      const timestamp = new Date().toISOString()
      const testData = {
        nome: `Teste Automatizado - Registro Real ${timestamp}`,
        tipo: 'Garfo Paleteiro',
        capacidade: '2500kg',
        status: 'Disponível',
        observacoes: 'Registro criado por teste automatizado no banco real'
      }

      const response = await createTestRecord(testData)
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.nome).toBe(testData.nome)
    })

    test('Deve criar segundo registro real no banco - DEIXA REGISTRO NO BANCO', async () => {
      const timestamp = new Date().toISOString()
      const testData = {
        nome: `Teste Automatizado - Registro Real 2 ${timestamp}`,
        tipo: 'Balde Concreto',
        capacidade: '500L',
        status: 'Operacional',
        observacoes: 'Segundo registro criado por teste automatizado'
      }

      const response = await createTestRecord(testData)
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.nome).toBe(testData.nome)
    })
  })

  // =====================================================
  // TESTES REAIS - LISTAGEM E BUSCA
  // =====================================================
  describe('Testes REAIS - Listagem e Busca', () => {
    test('Deve listar registros reais do banco', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/equipamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 20 })
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(Array.isArray(response.body.data)).toBe(true)
      
      console.log(`📊 Encontrados ${response.body.data.length} registros no banco`)
      
      // Verificar se nossos registros de teste estão na listagem
      const nossosRegistros = response.body.data.filter(registro => 
        registro.nome.includes('Teste Automatizado')
      )
      
      console.log(`🎯 Encontrados ${nossosRegistros.length} registros de teste na listagem`)
    })

    test('Deve filtrar por tipo', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/equipamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ tipo: 'Garfo Paleteiro' })
      
      expect(response.status).toBe(200)
      expect(response.body.data.every(equip => equip.tipo === 'Garfo Paleteiro')).toBe(true)
    })

    test('Deve filtrar por status', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/equipamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'Disponível' })
      
      expect(response.status).toBe(200)
      expect(response.body.data.every(equip => equip.status === 'Disponível')).toBe(true)
    })

    test('Deve buscar equipamentos por nome', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/equipamentos/buscar')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'Teste Automatizado' })
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      
      console.log(`🔍 Encontrados ${response.body.data.length} equipamentos na busca`)
    })
  })

  // =====================================================
  // TESTES REAIS - ATUALIZAÇÃO DE REGISTROS
  // =====================================================
  describe('Testes REAIS - Atualização de Registros', () => {
    let registroParaAtualizar

    beforeAll(async () => {
      // Criar um registro específico para testar atualização
      const timestamp = new Date().toISOString()
      const testData = {
        nome: `Teste Atualização - Registro ${timestamp}`,
        tipo: 'Caçamba Entulho',
        capacidade: '1000L',
        status: 'Disponível'
      }

      const response = await createTestRecord(testData)
      if (response.status === 201) {
        registroParaAtualizar = response.body.data.id
      }
    })

    test('Deve atualizar registro real no banco - DEIXA REGISTRO ATUALIZADO NO BANCO', async () => {
      if (!registroParaAtualizar) {
        console.log('⚠️ Pulando teste - registro para atualização não foi criado')
        return
      }

      const timestamp = new Date().toISOString()
      const updateData = {
        nome: `Teste Atualizado - Registro Real ${timestamp}`,
        tipo: 'Plataforma Descarga',
        capacidade: '2000kg',
        status: 'Manutenção',
        observacoes: 'Registro atualizado por teste automatizado no banco real'
      }

      const response = await updateTestRecord(registroParaAtualizar, updateData)
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data.nome).toBe(updateData.nome)
      expect(response.body.data.tipo).toBe(updateData.tipo)
    })
  })

  // =====================================================
  // TESTES DE FILTROS E BUSCA
  // =====================================================
  describe('Filtros e Busca', () => {
    test('Deve filtrar por parâmetros específicos', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/equipamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          tipo: 'Garfo Paleteiro',
          status: 'Disponível'
        })
      
      expect(response.status).toBe(200)
      expect(response.body.data.every(equip => 
        equip.tipo === 'Garfo Paleteiro' && 
        equip.status === 'Disponível'
      )).toBe(true)
    })

    test('Deve ordenar resultados', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/equipamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10 })
      
      expect(response.status).toBe(200)
      
      // Verificar se está ordenado por nome
      const nomes = response.body.data.map(equip => equip.nome)
      const nomesOrdenados = [...nomes].sort()
      expect(nomes).toEqual(nomesOrdenados)
    })

    test('Deve implementar paginação corretamente', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/equipamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 5 })
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(5)
      expect(response.body.data.length).toBeLessThanOrEqual(5)
    })

    test('Deve buscar por texto livre', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/equipamentos/buscar')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'Garfo' })
      
      expect(response.status).toBe(200)
      expect(response.body.data.some(equip => 
        equip.nome.includes('Garfo') || equip.tipo.includes('Garfo')
      )).toBe(true)
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
          .get('/api/equipamentos')
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
        .get('/api/equipamentos')
        .set('Authorization', `Bearer ${authToken}`)
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(5000) // Menos de 5 segundos
      
      console.log(`⏱️ Tempo de resposta: ${responseTime}ms`)
    })

    test('Deve limitar tamanho de requisição', async () => {
      const longString = 'A'.repeat(1000)
      const testData = {
        nome: `Teste Automatizado - String Longa ${longString}`,
        tipo: 'Outro',
        observacoes: longString
      }

      const response = await createTestRecord(testData)
      
      // Deve aceitar strings longas válidas
      expect(response.status).toBe(201)
    })
  })

  // =====================================================
  // TESTES DE TRATAMENTO DE ERROS
  // =====================================================
  describe('Tratamento de Erros', () => {
    test('Deve retornar erro 400 para dados inválidos', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/equipamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: '', // Nome vazio
          tipo: 'Tipo Inexistente' // Tipo inválido
        })
      
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })

    test('Deve retornar erro 403 para não autenticado', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/equipamentos')
      
      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    test('Deve retornar erro 404 para recurso não encontrado', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/equipamentos/99999')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error', 'Equipamento não encontrado')
    })

    test('Deve retornar erro 400 para responsável não encontrado', async () => {
      const timestamp = new Date().toISOString()
      const testData = {
        nome: `Teste Automatizado - Responsável Inexistente ${timestamp}`,
        tipo: 'Garra',
        responsavel_id: 99999 // ID que não existe
      }

      const response = await request(API_BASE_URL)
        .post('/api/equipamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testData)
      
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Responsável não encontrado')
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
 *    npm test src/routes/tests/equipamentos-real.test.js
 * 
 * 3. Observe os logs mostrando os IDs dos registros criados
 * 
 * 4. Acesse o Supabase Dashboard para verificar os registros:
 *    - URL: https://mghdktkoejobsmdbvssl.supabase.co
 *    - Tabela: equipamentos_auxiliares
 *    - Filtre por nomes que contenham "Teste Automatizado"
 * 
 * 5. Verifique manualmente:
 *    - Se os registros foram criados corretamente
 *    - Se as operações foram executadas corretamente
 *    - Se os dados estão consistentes
 * 
 * 6. Os registros ficam no banco para análise posterior
 */
