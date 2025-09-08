# Guia de Testes - Sistema de Gerenciamento de Gruas API

## 📋 Visão Geral

Este guia estabelece o padrão e estrutura para todos os testes das rotas da API, utilizando Jest e conectando com o banco de homologação real para criar registros que podem ser verificados manualmente.

## 🏗️ Estrutura de Testes

### 1. Configuração Base - Testes REAIS com Banco de Homologação

Todos os arquivos de teste devem seguir esta estrutura baseada no modelo `estoque-real.test.js`:

```javascript
/**
 * Testes REAIS para Rotas de [Nome da Rota]
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

describe('[Nome da Rota] - Testes REAIS com Banco de Homologação', () => {
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
        authToken = loginResponse.body.token
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
    console.log('   Tabela: [nome_da_tabela]')
    console.log('   Filtre por nomes que contenham "Teste Automatizado"')
  })
})
```

### 2. Funções Auxiliares para Testes REAIS

```javascript
// Função auxiliar para criar registro de teste
const createTestRecord = async (data) => {
  const response = await request(API_BASE_URL)
    .post('/api/[nome-da-rota]')
    .set('Authorization', `Bearer ${authToken}`)
    .send(data)
  
  if (response.status === 201) {
    const record = {
      id: response.body.data.id,
      type: '[Nome do Tipo]',
      data: data,
      timestamp: new Date().toISOString()
    }
    testRecords.created.push(record)
    
    console.log(`✅ [Nome do Tipo] criado no banco REAL - ID: ${record.id}`)
  } else {
    console.log(`❌ Erro ao criar [nome do tipo]: ${response.status} - ${JSON.stringify(response.body)}`)
  }
  
  return response
}

// Função auxiliar para atualizar registro de teste
const updateTestRecord = async (id, data) => {
  const response = await request(API_BASE_URL)
    .put(`/api/[nome-da-rota]/${id}`)
    .set('Authorization', `Bearer ${authToken}`)
    .send(data)
  
  if (response.status === 200) {
    const record = {
      id: id,
      type: '[Nome do Tipo]',
      oldData: {},
      newData: data,
      timestamp: new Date().toISOString()
    }
    testRecords.updated.push(record)
    
    console.log(`✅ [Nome do Tipo] atualizado no banco REAL - ID: ${id}`)
  } else {
    console.log(`❌ Erro ao atualizar [nome do tipo]: ${response.status} - ${JSON.stringify(response.body)}`)
  }
  
  return response
}
```

### 3. Categorias de Testes Obrigatórias

Para cada rota, implementar os seguintes grupos de testes:

#### 🔐 **Testes de Autenticação e Autorização**
```javascript
describe('Autenticação e Autorização', () => {
  test('Deve rejeitar requisições sem token', async () => {
    const response = await request(API_BASE_URL)
      .get('/api/[nome-da-rota]')
    
    expect(response.status).toBe(401)
    expect(response.body).toHaveProperty('error')
  })

  test('Deve rejeitar token inválido', async () => {
    const response = await request(API_BASE_URL)
      .get('/api/[nome-da-rota]')
      .set('Authorization', 'Bearer token-invalido')
    
    expect(response.status).toBe(401)
  })

  test('Deve aceitar token válido', async () => {
    const response = await request(API_BASE_URL)
      .get('/api/[nome-da-rota]')
      .set('Authorization', `Bearer ${authToken}`)
    
    expect(response.status).toBe(200)
  })
})
```

#### ✅ **Testes de Validação de Dados**
```javascript
describe('Validação de Dados', () => {
  test('Deve rejeitar dados obrigatórios ausentes', async () => {
    // Teste com campos obrigatórios faltando
  })

  test('Deve rejeitar tipos de dados incorretos', async () => {
    // Teste com tipos inválidos
  })

  test('Deve rejeitar formatos inválidos', async () => {
    // Teste com formatos incorretos (email, CPF, etc.)
  })

  test('Deve aceitar dados válidos', async () => {
    // Teste com dados corretos
  })
})
```

#### 📊 **Testes CRUD Básicos - DEIXA REGISTROS NO BANCO REAL**
```javascript
describe('Testes REAIS - Criação de Registros', () => {
  test('Deve criar registro real no banco de homologação - DEIXA REGISTRO NO BANCO', async () => {
    const timestamp = new Date().toISOString()
    const testData = {
      nome: `Teste Automatizado - Registro Real ${timestamp}`,
      descricao: 'Registro criado por teste automatizado no banco real',
      // ... outros campos obrigatórios específicos da rota
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
      descricao: 'Segundo registro criado por teste automatizado',
      // ... outros campos obrigatórios específicos da rota
    }

    const response = await createTestRecord(testData)
    
    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('data')
    expect(response.body.data).toHaveProperty('id')
    expect(response.body.data.nome).toBe(testData.nome)
  })
})

describe('Testes REAIS - Listagem e Busca', () => {
  test('Deve listar registros reais do banco', async () => {
    const response = await request(API_BASE_URL)
      .get('/api/[nome-da-rota]')
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
})

describe('Testes REAIS - Atualização de Registros', () => {
  let registroParaAtualizar

  beforeAll(async () => {
    // Criar um registro específico para testar atualização
    const timestamp = new Date().toISOString()
    const testData = {
      nome: `Teste Atualização - Registro ${timestamp}`,
      // ... outros campos obrigatórios específicos da rota
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
      descricao: 'Registro atualizado por teste automatizado no banco real',
      // ... outros campos a serem atualizados
    }

    const response = await updateTestRecord(registroParaAtualizar, updateData)
    
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('data')
    expect(response.body.data.nome).toBe(updateData.nome)
  })
})
```

#### 🔍 **Testes de Filtros e Busca**
```javascript
describe('Filtros e Busca', () => {
  test('Deve filtrar por parâmetros específicos', async () => {
    // Teste de filtros
  })

  test('Deve ordenar resultados', async () => {
    // Teste de ordenação
  })

  test('Deve implementar paginação corretamente', async () => {
    // Teste de paginação
  })

  test('Deve buscar por texto livre', async () => {
    // Teste de busca textual
  })
})
```

#### ⚡ **Testes de Performance e Limites**
```javascript
describe('Performance e Limites', () => {
  test('Deve respeitar rate limiting', async () => {
    // Teste de rate limit
  })

  test('Deve responder dentro do tempo esperado', async () => {
    // Teste de performance
  })

  test('Deve limitar tamanho de requisição', async () => {
    // Teste de limites de payload
  })
})
```

#### 🚨 **Testes de Tratamento de Erros**
```javascript
describe('Tratamento de Erros', () => {
  test('Deve retornar erro 400 para dados inválidos', async () => {
    // Teste de erro de validação
  })

  test('Deve retornar erro 401 para não autenticado', async () => {
    // Teste de erro de autenticação
  })

  test('Deve retornar erro 403 para sem permissão', async () => {
    // Teste de erro de autorização
  })

  test('Deve retornar erro 404 para recurso não encontrado', async () => {
    // Teste de erro de não encontrado
  })

  test('Deve retornar erro 500 para erro interno', async () => {
    // Teste de erro de servidor
  })
})
```

### 4. Utilitários de Teste - Modelo Real

#### 🔧 **Helper Functions Baseadas no Modelo Real**
```javascript
// Função para validar estrutura de resposta
const validateResponseStructure = (response, expectedFields) => {
  expectedFields.forEach(field => {
    expect(response.body).toHaveProperty(field)
  })
}

// Função para gerar dados de teste com timestamp único
const generateTestData = (baseData) => {
  const timestamp = new Date().toISOString()
  return {
    ...baseData,
    nome: `Teste Automatizado - ${baseData.nome || 'Registro'} ${timestamp}`,
    timestamp: timestamp
  }
}

// Função para verificar se registro existe na listagem
const verifyRecordInList = (list, recordId, recordName) => {
  const foundRecord = list.find(record => 
    record.id === recordId || record.nome.includes(recordName)
  )
  return foundRecord !== undefined
}

// Função para aguardar processamento assíncrono
const waitForProcessing = (ms = 1000) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

#### 📝 **Dados de Teste Padronizados**
```javascript
const testData = {
  valid: {
    // Dados válidos para cada entidade
  },
  invalid: {
    // Dados inválidos para testes de validação
  },
  edgeCases: {
    // Casos extremos e especiais
  }
}
```

### 4. Configuração de Ambiente

#### 🌍 **Variáveis de Ambiente para Testes**
```javascript
// Carregar .env para testes
dotenv.config()

// Verificar se todas as variáveis necessárias estão definidas
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET'
]

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Variável de ambiente ${envVar} não encontrada`)
  }
})
```

#### 🗄️ **Controle de Registros de Teste no Banco Real**

**IMPORTANTE**: Os testes seguem o modelo `estoque-real.test.js` e criam registros reais no banco de homologação para permitir verificação manual.

```javascript
// Estrutura para controle de registros criados (já incluída no beforeAll)
let testRecords = {
  created: [], // Registros criados com dados completos
  updated: [], // Registros atualizados com dados antigos e novos
  deleted: []  // Registros deletados
}

// Função para marcar registro como criado (já incluída nas funções auxiliares)
const markRecordCreated = (id, type, data) => {
  const record = {
    id,
    type,
    data,
    timestamp: new Date().toISOString()
  }
  testRecords.created.push(record)
  
  console.log(`✅ ${type} criado no banco REAL - ID: ${id}`)
  return record
}

// Função para marcar registro como atualizado (já incluída nas funções auxiliares)
const markRecordUpdated = (id, type, oldData, newData) => {
  const record = {
    id,
    type,
    oldData,
    newData,
    timestamp: new Date().toISOString()
  }
  testRecords.updated.push(record)
  
  console.log(`✅ ${type} atualizado no banco REAL - ID: ${id}`)
  return record
}

// Função para listar todos os registros de teste criados (já incluída no afterAll)
const listTestRecords = () => {
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
  console.log('   Tabela: [nome_da_tabela]')
  console.log('   Filtre por nomes que contenham "Teste Automatizado"')
}
```

**Identificação de Registros de Teste:**
- Use prefixos identificáveis nos nomes: `"Teste Automatizado - "`
- Inclua timestamp para evitar duplicatas
- Use dados claramente identificáveis como de teste
- Exemplo: `nome: "Teste Automatizado - Registro Real 2024-01-15T10:30:00.000Z"`
- **Os registros ficam no banco para análise posterior**

### 5. Estrutura de Arquivos de Teste

```
backend-api/src/routes/tests/
├── auth.test.js              # Testes de autenticação
├── clientes.test.js          # Testes de clientes
├── estoque.test.js           # Testes de estoque (mock)
├── estoque-real.test.js      # Testes REAIS de estoque (modelo)
├── estoque-simple.test.js    # Testes simples de estoque
├── gruas.test.js             # Testes de gruas
├── contratos.test.js         # Testes de contratos
├── obras.test.js             # Testes de obras
├── users.test.js             # Testes de usuários
├── exemplo-teste-com-banco.js # Exemplo de teste com banco
├── Guia-testes.md            # Este guia atualizado
└── utils/
    ├── test-helpers.js       # Funções auxiliares
    ├── test-data.js          # Dados de teste
    └── test-setup.js         # Configuração base
```

### 6. Comandos de Teste

#### 🚀 **Scripts Disponíveis**
```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com coverage
npm run test:coverage

# Executar teste específico
npm test src/routes/tests/[nome-do-arquivo].test.js

# Executar testes REAIS com banco de homologação
npm test src/routes/tests/estoque-real.test.js

# Executar testes simples (mock)
npm test src/routes/tests/estoque-simple.test.js

# Executar testes de integração
npm test src/routes/tests/estoque.test.js
```

### 7. Cobertura de Testes

#### 📊 **Métricas Mínimas**
- **Cobertura de Código**: Mínimo 80%
- **Cobertura de Branches**: Mínimo 70%
- **Cobertura de Funções**: Mínimo 90%
- **Cobertura de Linhas**: Mínimo 80%

#### 🎯 **Critérios de Qualidade**
- Todos os endpoints devem ter testes
- Todos os cenários de erro devem ser testados
- Validações de entrada devem ser cobertas
- Autenticação e autorização devem ser testadas
- Operações CRUD devem ser completamente testadas

### 8. Boas Práticas

#### ✅ **Do's**
- Use dados de teste isolados e limpos
- Teste cenários positivos e negativos
- Valide estrutura de resposta
- Use mocks para dependências externas
- Mantenha testes independentes
- Use nomes descritivos para testes
- Documente casos especiais
- **Siga o modelo do estoque-real.test.js para testes REAIS**
- **Crie registros reais no banco de homologação para POST/PUT**
- **Use prefixos identificáveis nos dados de teste: "Teste Automatizado - "**
- **Registre todos os IDs criados para verificação manual**
- **Inclua timestamp nos dados para evitar duplicatas**
- **Deixe os registros no banco para análise posterior**
- **Use console.log para mostrar IDs dos registros criados**
- **Inclua URL do Supabase Dashboard no resumo final**

#### ❌ **Don'ts**
- Não use dados de produção
- Não faça testes dependentes entre si
- Não ignore erros de validação
- Não teste implementação, teste comportamento
- Não use dados hardcoded desnecessariamente
- **Não delete automaticamente os registros de teste** (deixe para verificação manual)
- **Não use dados que possam conflitar com dados reais**
- **Não esqueça de verificar se o servidor está rodando antes dos testes**

### 9. Template para Resumos

Após completar os testes de cada rota, preencher o arquivo correspondente em `/tests/resumos/`:

```markdown
# Resumo de Testes - [Nome da Rota]

## 📊 Estatísticas Gerais
- **Total de Testes**: X
- **Testes Passando**: X
- **Testes Falhando**: X
- **Cobertura de Código**: X%
- **Data de Execução**: DD/MM/YYYY

## 🧪 Categorias Testadas
- [x] Autenticação e Autorização
- [x] Validação de Dados
- [x] Operações CRUD
- [x] Filtros e Busca
- [x] Performance e Limites
- [x] Tratamento de Erros

## 📋 Endpoints Testados
| Método | Endpoint | Status | Observações |
|--------|----------|--------|-------------|
| GET    | /api/rota | ✅ | Testado com paginação |
| POST   | /api/rota | ✅ | Validação completa |
| PUT    | /api/rota/:id | ✅ | Atualização parcial |
| DELETE | /api/rota/:id | ✅ | Soft delete |

## 🐛 Problemas Identificados
- **Problema 1**: Descrição do problema
- **Problema 2**: Descrição do problema

## 🔧 Melhorias Sugeridas
- **Melhoria 1**: Descrição da melhoria
- **Melhoria 2**: Descrição da melhoria

## 📝 Notas Adicionais
- Observações importantes sobre os testes
- Dependências externas testadas
- Configurações especiais necessárias
```

### 10. Checklist de Implementação

Para cada nova rota, verificar:

- [ ] Arquivo de teste criado seguindo o padrão
- [ ] Todas as categorias de teste implementadas
- [ ] Dados de teste isolados e limpos
- [ ] Cobertura mínima atingida
- [ ] Resumo preenchido em `/tests/resumos/`
- [ ] Documentação atualizada
- [ ] Testes passando em CI/CD

---

## 📚 Recursos Adicionais

- [Documentação Jest](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Express Testing Guide](https://expressjs.com/en/guide/testing.html)
- [Supabase Testing](https://supabase.com/docs/guides/testing)

---

### 11. Modelo de Testes REAIS - Baseado em estoque-real.test.js

#### 🎯 **Características do Modelo Real**

O arquivo `estoque-real.test.js` estabelece o padrão para testes que:

1. **Conectam com banco real**: Usa `API_BASE_URL = 'http://localhost:3001'`
2. **Criam registros permanentes**: Deixa registros no banco para verificação manual
3. **Autenticação real**: Faz login real para obter token válido
4. **Logs detalhados**: Mostra IDs e dados dos registros criados
5. **Resumo final**: Lista todos os registros criados/atualizados

#### 📋 **Estrutura Obrigatória**

```javascript
/**
 * Testes REAIS para Rotas de [Nome da Rota]
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

describe('[Nome da Rota] - Testes REAIS com Banco de Homologação', () => {
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
        authToken = loginResponse.body.token
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
    console.log('   Tabela: [nome_da_tabela]')
    console.log('   Filtre por nomes que contenham "Teste Automatizado"')
  })

  // ... resto dos testes seguindo o padrão
})
```

#### 🚀 **Instruções para Execução**

```bash
# 1. Certifique-se de que o servidor da API está rodando:
npm run dev

# 2. Execute o teste:
npm test src/routes/tests/[nome-da-rota]-real.test.js

# 3. Observe os logs mostrando os IDs dos registros criados

# 4. Acesse o Supabase Dashboard para verificar os registros:
#    - URL: https://mghdktkoejobsmdbvssl.supabase.co
#    - Tabela: [nome_da_tabela]
#    - Filtre por nomes que contenham "Teste Automatizado"

# 5. Verifique manualmente:
#    - Se os registros foram criados corretamente
#    - Se as operações foram executadas corretamente
#    - Se os dados estão consistentes

# 6. Os registros ficam no banco para análise posterior
```

#### 📝 **Template de Comentário Final**

```javascript
/**
 * INSTRUÇÕES PARA EXECUÇÃO:
 * 
 * 1. Certifique-se de que o servidor da API está rodando:
 *    npm run dev
 * 
 * 2. Execute o teste:
 *    npm test src/routes/tests/[nome-da-rota]-real.test.js
 * 
 * 3. Observe os logs mostrando os IDs dos registros criados
 * 
 * 4. Acesse o Supabase Dashboard para verificar os registros:
 *    - URL: https://mghdktkoejobsmdbvssl.supabase.co
 *    - Tabela: [nome_da_tabela]
 *    - Filtre por nomes que contenham "Teste Automatizado"
 * 
 * 5. Verifique manualmente:
 *    - Se os registros foram criados corretamente
 *    - Se as operações foram executadas corretamente
 *    - Se os dados estão consistentes
 * 
 * 6. Os registros ficam no banco para análise posterior
 */
```

---

**Última atualização**: 15/01/2025  
**Versão**: 2.0.0  
**Autor**: Sistema IRBANA  
**Modelo Base**: estoque-real.test.js
