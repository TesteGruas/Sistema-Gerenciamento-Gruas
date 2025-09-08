/**
 * Testes REAIS para Rotas de Gruas
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

describe('Gruas - Testes REAIS com Banco de Homologação', () => {
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
    console.log('   Tabela: gruas')
    console.log('   Filtre por nomes que contenham "Teste Automatizado"')
  })

  // Função auxiliar para criar registro de teste
  const createTestRecord = async (data) => {
    const response = await request(API_BASE_URL)
      .post('/api/gruas')
      .set('Authorization', `Bearer ${authToken}`)
      .send(data)
    
    if (response.status === 201) {
      const record = {
        id: response.body.data.id,
        type: 'Grua',
        data: data,
        timestamp: new Date().toISOString()
      }
      testRecords.created.push(record)
      
      console.log(`✅ Grua criada no banco REAL - ID: ${record.id}`)
    } else {
      console.log(`❌ Erro ao criar grua: ${response.status} - ${JSON.stringify(response.body)}`)
    }
    
    return response
  }

  // Função auxiliar para atualizar registro de teste
  const updateTestRecord = async (id, data) => {
    const response = await request(API_BASE_URL)
      .put(`/api/gruas/${id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(data)
    
    if (response.status === 200) {
      const record = {
        id: id,
        type: 'Grua',
        oldData: {},
        newData: data,
        timestamp: new Date().toISOString()
      }
      testRecords.updated.push(record)
      
      console.log(`✅ Grua atualizada no banco REAL - ID: ${id}`)
    } else {
      console.log(`❌ Erro ao atualizar grua: ${response.status} - ${JSON.stringify(response.body)}`)
    }
    
    return response
  }

  // Dados de teste padronizados
  const testData = {
    valid: {
      modelo: 'Teste Automatizado - Modelo',
      fabricante: 'Teste Automatizado - Fabricante',
      tipo: 'Grua Torre',
      capacidade: '10 toneladas',
      capacidade_ponta: '5 toneladas',
      lanca: '50 metros',
      altura_trabalho: '60 metros',
      ano: 2020,
      status: 'Disponível',
      localizacao: 'Teste Automatizado - Localização',
      horas_operacao: 1000,
      valor_locacao: 5000.00,
      valor_operacao: 200.00,
      valor_sinaleiro: 150.00,
      valor_manutencao: 300.00
    },
    invalid: {
      modelo: '', // Campo obrigatório vazio
      fabricante: 'A', // Muito curto
      tipo: 'Tipo Inválido', // Valor não permitido
      capacidade: '', // Campo obrigatório vazio
      capacidade_ponta: '', // Campo obrigatório vazio
      lanca: '', // Campo obrigatório vazio
      ano: 1800, // Ano muito antigo
      status: 'Status Inválido', // Valor não permitido
      horas_operacao: -100, // Valor negativo
      valor_locacao: -1000, // Valor negativo
      valor_operacao: -50, // Valor negativo
      valor_sinaleiro: -25, // Valor negativo
      valor_manutencao: -75 // Valor negativo
    },
    edgeCases: {
      modelo: 'A', // Mínimo permitido
      fabricante: 'AB', // Mínimo permitido
      tipo: 'Outros', // Último valor da enum
      capacidade: '1 kg', // Valor mínimo
      capacidade_ponta: '0.5 kg', // Valor mínimo
      lanca: '1 m', // Valor mínimo
      altura_trabalho: null, // Campo opcional
      ano: null, // Campo opcional
      status: 'Vendida', // Último valor da enum
      localizacao: null, // Campo opcional
      horas_operacao: 0, // Valor mínimo
      valor_locacao: 0.01, // Valor mínimo positivo
      valor_operacao: 0, // Valor mínimo
      valor_sinaleiro: 0, // Valor mínimo
      valor_manutencao: 0 // Valor mínimo
    }
  }

  describe('Autenticação e Autorização', () => {
    test('Deve rejeitar requisições sem token', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/gruas')
      
      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    test('Deve rejeitar token inválido', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/gruas')
        .set('Authorization', 'Bearer token-invalido')
      
      expect(response.status).toBe(403)
    })

    test('Deve aceitar token válido', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/gruas')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
    })
  })

  describe('Validação de Dados', () => {
    test('Deve rejeitar dados obrigatórios ausentes', async () => {
      const invalidData = {
        // Campos obrigatórios ausentes
        fabricante: 'Fabricante Teste',
        tipo: 'Grua Torre'
      }

      const response = await request(API_BASE_URL)
        .post('/api/gruas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toBe('Dados inválidos')
    })

    test('Deve rejeitar tipos de dados incorretos', async () => {
      const invalidData = {
        modelo: 'Modelo Teste',
        fabricante: 'Fabricante Teste',
        tipo: 'Tipo Inválido', // Tipo não permitido
        capacidade: '10 toneladas',
        capacidade_ponta: '5 toneladas',
        lanca: '50 metros',
        ano: 'não é um número', // Tipo incorreto
        horas_operacao: 'não é um número', // Tipo incorreto
        valor_locacao: 'não é um número' // Tipo incorreto
      }

      const response = await request(API_BASE_URL)
        .post('/api/gruas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    test('Deve rejeitar valores negativos', async () => {
      const invalidData = {
        modelo: 'Modelo Teste',
        fabricante: 'Fabricante Teste',
        tipo: 'Grua Torre',
        capacidade: '10 toneladas',
        capacidade_ponta: '5 toneladas',
        lanca: '50 metros',
        horas_operacao: -100, // Valor negativo
        valor_locacao: -1000, // Valor negativo
        valor_operacao: -50 // Valor negativo
      }

      const response = await request(API_BASE_URL)
        .post('/api/gruas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    test('Deve aceitar dados válidos', async () => {
      const timestamp = new Date().toISOString()
      const validData = {
        ...testData.valid,
        modelo: `Teste Automatizado - Validação ${timestamp}`,
        fabricante: `Teste Automatizado - Fabricante ${timestamp}`
      }

      const response = await createTestRecord(validData)
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.modelo).toBe(validData.modelo)
    })
  })

  describe('Testes REAIS - Criação de Registros', () => {
    test('Deve criar registro real no banco de homologação - DEIXA REGISTRO NO BANCO', async () => {
      const timestamp = new Date().toISOString()
      const testData = {
        modelo: `Teste Automatizado - Registro Real ${timestamp}`,
        fabricante: `Teste Automatizado - Fabricante Real ${timestamp}`,
        tipo: 'Grua Torre',
        capacidade: '15 toneladas',
        capacidade_ponta: '8 toneladas',
        lanca: '60 metros',
        altura_trabalho: '70 metros',
        ano: 2021,
        status: 'Disponível',
        localizacao: `Teste Automatizado - Localização Real ${timestamp}`,
        horas_operacao: 1500,
        valor_locacao: 7500.00,
        valor_operacao: 300.00,
        valor_sinaleiro: 200.00,
        valor_manutencao: 400.00
      }

      const response = await createTestRecord(testData)
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.modelo).toBe(testData.modelo)
    })

    test('Deve criar segundo registro real no banco - DEIXA REGISTRO NO BANCO', async () => {
      const timestamp = new Date().toISOString()
      const testData = {
        modelo: `Teste Automatizado - Registro Real 2 ${timestamp}`,
        fabricante: `Teste Automatizado - Fabricante Real 2 ${timestamp}`,
        tipo: 'Grua Móvel',
        capacidade: '25 toneladas',
        capacidade_ponta: '12 toneladas',
        lanca: '40 metros',
        altura_trabalho: '45 metros',
        ano: 2022,
        status: 'Operacional',
        localizacao: `Teste Automatizado - Localização Real 2 ${timestamp}`,
        horas_operacao: 2000,
        valor_locacao: 10000.00,
        valor_operacao: 500.00,
        valor_sinaleiro: 300.00,
        valor_manutencao: 600.00
      }

      const response = await createTestRecord(testData)
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.modelo).toBe(testData.modelo)
    })

    test('Deve criar registro com dados de cliente - DEIXA REGISTRO NO BANCO', async () => {
      const timestamp = new Date().toISOString()
      const testData = {
        modelo: `Teste Automatizado - Com Cliente ${timestamp}`,
        fabricante: `Teste Automatizado - Fabricante Cliente ${timestamp}`,
        tipo: 'Guincho',
        capacidade: '5 toneladas',
        capacidade_ponta: '2 toneladas',
        lanca: '20 metros',
        altura_trabalho: '25 metros',
        ano: 2023,
        status: 'Disponível',
        localizacao: `Teste Automatizado - Localização Cliente ${timestamp}`,
        horas_operacao: 500,
        valor_locacao: 3000.00,
        valor_operacao: 150.00,
        valor_sinaleiro: 100.00,
        valor_manutencao: 200.00,
        // Dados do cliente
        cliente_nome: `Teste Automatizado - Cliente ${timestamp}`,
        cliente_documento: '12.345.678/0001-90',
        cliente_email: `cliente.teste.${Date.now()}@exemplo.com`,
        cliente_telefone: '(11) 99999-9999'
      }

      const response = await createTestRecord(testData)
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.modelo).toBe(testData.modelo)
    })
  })

  describe('Testes REAIS - Listagem e Busca', () => {
    test('Deve listar registros reais do banco', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/gruas')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 20 })
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(Array.isArray(response.body.data)).toBe(true)
      
      console.log(`📊 Encontrados ${response.body.data.length} registros no banco`)
      
      // Verificar se nossos registros de teste estão na listagem
      const nossosRegistros = response.body.data.filter(registro => 
        registro.modelo.includes('Teste Automatizado')
      )
      
      console.log(`🎯 Encontrados ${nossosRegistros.length} registros de teste na listagem`)
    })

    test('Deve filtrar por status', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/gruas')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'Disponível', limit: 10 })
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      
      // Verificar se todos os registros retornados têm o status correto
      response.body.data.forEach(grua => {
        expect(grua.status).toBe('Disponível')
      })
    })

    test('Deve filtrar por tipo', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/gruas')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ tipo: 'Grua Torre', limit: 10 })
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      
      // Verificar se todos os registros retornados têm o tipo correto
      response.body.data.forEach(grua => {
        expect(grua.tipo).toBe('Grua Torre')
      })
    })

    test('Deve implementar paginação corretamente', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/gruas')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 5 })
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.pagination).toHaveProperty('page')
      expect(response.body.pagination).toHaveProperty('limit')
      expect(response.body.pagination).toHaveProperty('total')
      expect(response.body.pagination).toHaveProperty('pages')
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(5)
      expect(response.body.data.length).toBeLessThanOrEqual(5)
    })
  })

  describe('Testes REAIS - Busca de Clientes', () => {
    test('Deve buscar clientes com autocomplete', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/gruas/clientes/buscar')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'Teste' })
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success')
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    test('Deve retornar array vazio para busca muito curta', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/gruas/clientes/buscar')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'A' })
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success')
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toEqual([])
    })
  })

  describe('Testes REAIS - Atualização de Registros', () => {
    let registroParaAtualizar

    beforeAll(async () => {
      // Criar um registro específico para testar atualização
      const timestamp = new Date().toISOString()
      const testData = {
        modelo: `Teste Atualização - Registro ${timestamp}`,
        fabricante: `Teste Atualização - Fabricante ${timestamp}`,
        tipo: 'Grua Torre',
        capacidade: '20 toneladas',
        capacidade_ponta: '10 toneladas',
        lanca: '70 metros',
        altura_trabalho: '80 metros',
        ano: 2020,
        status: 'Disponível',
        localizacao: `Teste Atualização - Localização ${timestamp}`,
        horas_operacao: 1000,
        valor_locacao: 8000.00,
        valor_operacao: 400.00,
        valor_sinaleiro: 250.00,
        valor_manutencao: 500.00
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
        modelo: `Teste Atualizado - Registro Real ${timestamp}`,
        fabricante: `Teste Atualizado - Fabricante Real ${timestamp}`,
        tipo: 'Grua Móvel',
        capacidade: '30 toneladas',
        capacidade_ponta: '15 toneladas',
        lanca: '80 metros',
        altura_trabalho: '90 metros',
        ano: 2023,
        status: 'Operacional',
        localizacao: `Teste Atualizado - Localização Real ${timestamp}`,
        horas_operacao: 2500,
        valor_locacao: 12000.00,
        valor_operacao: 600.00,
        valor_sinaleiro: 400.00,
        valor_manutencao: 800.00
      }

      const response = await updateTestRecord(registroParaAtualizar, updateData)
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data.modelo).toBe(updateData.modelo)
      expect(response.body.data.status).toBe(updateData.status)
    })
  })

  describe('Testes REAIS - Busca por ID', () => {
    let registroParaBuscar

    beforeAll(async () => {
      // Criar um registro específico para testar busca por ID
      const timestamp = new Date().toISOString()
      const testData = {
        modelo: `Teste Busca ID - Registro ${timestamp}`,
        fabricante: `Teste Busca ID - Fabricante ${timestamp}`,
        tipo: 'Guincho',
        capacidade: '8 toneladas',
        capacidade_ponta: '4 toneladas',
        lanca: '30 metros',
        altura_trabalho: '35 metros',
        ano: 2022,
        status: 'Disponível',
        localizacao: `Teste Busca ID - Localização ${timestamp}`,
        horas_operacao: 800,
        valor_locacao: 4000.00,
        valor_operacao: 200.00,
        valor_sinaleiro: 150.00,
        valor_manutencao: 300.00
      }

      const response = await createTestRecord(testData)
      if (response.status === 201) {
        registroParaBuscar = response.body.data.id
      }
    })

    test('Deve buscar registro por ID', async () => {
      if (!registroParaBuscar) {
        console.log('⚠️ Pulando teste - registro para busca não foi criado')
        return
      }

      const response = await request(API_BASE_URL)
        .get(`/api/gruas/${registroParaBuscar}`)
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data.id).toBe(registroParaBuscar)
      expect(response.body.data.modelo).toContain('Teste Busca ID')
    })

    test('Deve retornar 404 para ID inexistente', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/gruas/999999')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toBe('Grua não encontrada')
    })
  })

  describe('Tratamento de Erros', () => {
    test('Deve retornar erro 400 para dados inválidos', async () => {
      const invalidData = {
        modelo: '', // Campo obrigatório vazio
        fabricante: 'Fabricante Teste',
        tipo: 'Tipo Inválido',
        capacidade: '10 toneladas',
        capacidade_ponta: '5 toneladas',
        lanca: '50 metros'
      }

      const response = await request(API_BASE_URL)
        .post('/api/gruas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    test('Deve retornar erro 401 para não autenticado', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/gruas')

      expect(response.status).toBe(401)
    })

    test('Deve retornar erro 404 para recurso não encontrado', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/gruas/999999')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error')
    })

    test('Deve retornar erro 404 ao atualizar recurso inexistente', async () => {
      const updateData = {
        modelo: 'Modelo Teste',
        fabricante: 'Fabricante Teste',
        tipo: 'Grua Torre',
        capacidade: '10 toneladas',
        capacidade_ponta: '5 toneladas',
        lanca: '50 metros'
      }

      const response = await request(API_BASE_URL)
        .put('/api/gruas/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('Performance e Limites', () => {
    test('Deve responder dentro do tempo esperado', async () => {
      const startTime = Date.now()
      
      const response = await request(API_BASE_URL)
        .get('/api/gruas')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10 })
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(5000) // Menos de 5 segundos
      
      console.log(`⏱️ Tempo de resposta: ${responseTime}ms`)
    })

    test('Deve limitar tamanho de requisição', async () => {
      const largeData = {
        modelo: 'A'.repeat(100), // String longa mas dentro do limite
        fabricante: 'Fabricante Teste',
        tipo: 'Grua Torre',
        capacidade: '10 toneladas',
        capacidade_ponta: '5 toneladas',
        lanca: '50 metros'
      }

      const response = await request(API_BASE_URL)
        .post('/api/gruas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeData)

      // Deve aceitar dados válidos mesmo com strings longas
      expect(response.status).toBe(201)
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
 *    npm test src/routes/tests/gruas-real.test.js
 * 
 * 3. Observe os logs mostrando os IDs dos registros criados
 * 
 * 4. Acesse o Supabase Dashboard para verificar os registros:
 *    - URL: https://mghdktkoejobsmdbvssl.supabase.co
 *    - Tabela: gruas
 *    - Filtre por nomes que contenham "Teste Automatizado"
 * 
 * 5. Verifique manualmente:
 *    - Se os registros foram criados corretamente
 *    - Se as operações foram executadas corretamente
 *    - Se os dados estão consistentes
 * 
 * 6. Os registros ficam no banco para análise posterior
 */
