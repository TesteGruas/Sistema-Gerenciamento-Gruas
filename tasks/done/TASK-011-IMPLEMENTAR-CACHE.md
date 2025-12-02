# 📋 TASK-011: Implementar Cache (Redis)

**ID da Task:** TASK-011  
**Título:** Implementar Sistema de Cache com Redis  
**Fase:** 2  
**Módulo:** Performance - Backend  
**Arquivo(s):** 
- `backend-api/src/config/redis.js` (criar)
- `backend-api/src/middleware/cache.js` (criar)
- `backend-api/src/services/cache-service.js` (criar)
- `backend-api/package.json` (adicionar dependência)

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🟡 MÉDIA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Implementar sistema de cache usando Redis para melhorar performance do sistema. O cache deve ser usado para:
- Dados frequentemente acessados (obras, gruas, clientes)
- Relatórios complexos
- Sessões de usuário
- Dados que mudam pouco

Atualmente, o sistema não tem cache, fazendo com que todas as requisições sejam processadas diretamente no banco de dados.

---

## 🎯 Objetivos

- [ ] Instalar e configurar Redis
- [ ] Criar serviço de cache reutilizável
- [ ] Implementar cache para dados frequentes
- [ ] Implementar cache para relatórios
- [ ] Implementar invalidação de cache
- [ ] Adicionar TTL (Time To Live) apropriado
- [ ] Documentar uso do cache

---

## 📋 Situação Atual

### Cache Existente

- ✅ Cache de autenticação em `lib/auth-cache.ts` (localStorage)
- ❌ Não há cache no backend
- ❌ Não há Redis configurado
- ❌ Dados são sempre buscados do banco

### Integrações Existentes

- ❌ Redis não está instalado/configurado
- ✅ Estrutura permite adicionar cache facilmente
- ⚠️ Necessário decidir estratégia de cache

---

## 🔧 Ações Necessárias

### Backend

- [ ] Instalar dependência:
  ```bash
  npm install redis
  ```

- [ ] Criar configuração Redis (`backend-api/src/config/redis.js`):
  ```javascript
  import redis from 'redis'
  
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD
  })
  
  client.on('error', (err) => {
    console.error('Redis Client Error', err)
  })
  
  client.on('connect', () => {
    console.log('✅ Redis conectado')
  })
  
  await client.connect()
  
  export default client
  ```

- [ ] Criar serviço de cache (`backend-api/src/services/cache-service.js`):
  ```javascript
  import redisClient from '../config/redis.js'
  
  export const cacheService = {
    async get(key) {
      try {
        const data = await redisClient.get(key)
        return data ? JSON.parse(data) : null
      } catch (error) {
        console.error('Erro ao buscar do cache:', error)
        return null
      }
    },
    
    async set(key, value, ttlSeconds = 3600) {
      try {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(value))
      } catch (error) {
        console.error('Erro ao salvar no cache:', error)
      }
    },
    
    async del(key) {
      try {
        await redisClient.del(key)
      } catch (error) {
        console.error('Erro ao deletar do cache:', error)
      }
    },
    
    async delPattern(pattern) {
      try {
        const keys = await redisClient.keys(pattern)
        if (keys.length > 0) {
          await redisClient.del(keys)
        }
      } catch (error) {
        console.error('Erro ao deletar padrão do cache:', error)
      }
    }
  }
  ```

- [ ] Criar middleware de cache (`backend-api/src/middleware/cache.js`):
  ```javascript
  import { cacheService } from '../services/cache-service.js'
  
  export const cacheMiddleware = (ttlSeconds = 3600, keyGenerator) => {
    return async (req, res, next) => {
      const cacheKey = keyGenerator ? keyGenerator(req) : `cache:${req.path}:${JSON.stringify(req.query)}`
      
      // Tentar buscar do cache
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        return res.json(cached)
      }
      
      // Interceptar resposta para cachear
      const originalJson = res.json
      res.json = function(data) {
        cacheService.set(cacheKey, data, ttlSeconds)
        originalJson.call(this, data)
      }
      
      next()
    }
  }
  ```

- [ ] Implementar cache em endpoints específicos:
  - **Dados frequentes (TTL: 1 hora):**
    - `GET /api/obras` (lista)
    - `GET /api/gruas` (lista)
    - `GET /api/clientes` (lista)
    - `GET /api/funcionarios` (lista)
  
  - **Dados individuais (TTL: 30 minutos):**
    - `GET /api/obras/:id`
    - `GET /api/gruas/:id`
    - `GET /api/clientes/:id`
  
  - **Relatórios (TTL: 15 minutos):**
    - `GET /api/relatorios/*`
  
  - **Sessões (TTL: 24 horas):**
    - Dados de autenticação

- [ ] Implementar invalidação de cache:
  - Invalidar ao criar/atualizar/excluir
  - Invalidar por padrão (ex: `cache:obras:*`)

- [ ] Adicionar variáveis de ambiente:
  ```env
  REDIS_URL=redis://localhost:6379
  REDIS_PASSWORD=
  CACHE_ENABLED=true
  ```

### Documentação

- [ ] Documentar:
  - Como usar cache
  - TTLs recomendados
  - Quando invalidar cache
  - Estratégias de cache

---

## 🔌 Estratégias de Cache

### Cache de Dados Frequentes
- **TTL:** 1 hora
- **Invalidar:** Ao criar/atualizar/excluir
- **Uso:** Listas de obras, gruas, clientes

### Cache de Dados Individuais
- **TTL:** 30 minutos
- **Invalidar:** Ao atualizar item específico
- **Uso:** Detalhes de obra, grua, cliente

### Cache de Relatórios
- **TTL:** 15 minutos
- **Invalidar:** Manual ou por TTL
- **Uso:** Relatórios complexos

### Cache de Sessões
- **TTL:** 24 horas
- **Invalidar:** Ao fazer logout
- **Uso:** Dados de autenticação

---

## ✅ Critérios de Aceitação

- [ ] Redis instalado e configurado
- [ ] Serviço de cache criado
- [ ] Middleware de cache criado
- [ ] Cache implementado em endpoints principais
- [ ] Invalidação de cache implementada
- [ ] TTLs configurados apropriadamente
- [ ] Variáveis de ambiente configuradas
- [ ] Documentação atualizada
- [ ] Performance melhorada
- [ ] Testes de cache criados

---

## 🧪 Casos de Teste

### Teste 1: Cache Hit
**Dado:** Dados em cache  
**Quando:** Buscar dados  
**Então:** Deve retornar do cache (mais rápido)

### Teste 2: Cache Miss
**Dado:** Dados não em cache  
**Quando:** Buscar dados  
**Então:** Deve buscar do banco e cachear

### Teste 3: Invalidação
**Dado:** Dados em cache  
**Quando:** Atualizar dados  
**Então:** Cache deve ser invalidado

### Teste 4: TTL
**Dado:** Dados em cache com TTL  
**Quando:** Aguardar TTL expirar  
**Então:** Cache deve expirar e buscar novamente

### Teste 5: Redis Indisponível
**Dado:** Redis indisponível  
**Quando:** Tentar usar cache  
**Então:** Deve funcionar sem cache (fallback)

---

## 🔗 Dependências

### Bloqueada por:
- Nenhuma (pode ser executada independentemente)

### Bloqueia:
- Nenhuma (pode ser executada em paralelo)

### Relacionada com:
- TASK-003 - Criar endpoint performance gruas (cache pode melhorar)
- TASK-010 - Implementar paginação (cache pode melhorar)

---

## 📚 Referências

- `RELATORIO-AUDITORIA-COMPLETA-2025-02-02.md` - Seção "5.2 Cache"
- Documentação Redis
- Documentação node-redis

---

## 💡 Notas Técnicas

1. **Redis Cloud:** Considerar usar Redis Cloud (Supabase oferece) em vez de instalar localmente.

2. **Fallback:** Se Redis estiver indisponível, sistema deve continuar funcionando sem cache.

3. **Serialização:** Usar JSON para serializar dados complexos.

4. **Chaves:** Usar padrão consistente para chaves (ex: `cache:obras:list`, `cache:obra:123`).

5. **Monitoramento:** Monitorar uso de memória do Redis e performance.

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Redis pode ficar indisponível
  - **Mitigação:** Implementar fallback, monitorar saúde do Redis

- **Risco 2:** Cache pode ficar desatualizado
  - **Mitigação:** Invalidar cache adequadamente, usar TTLs apropriados

- **Risco 3:** Redis pode consumir muita memória
  - **Mitigação:** Configurar limites, monitorar uso, usar TTLs

---

## 📊 Estimativas

**Tempo Estimado:** 3-4 dias  
**Complexidade:** Alta  
**Esforço:** Médio

**Breakdown:**
- Configuração Redis: 2 horas
- Criar serviços: 4 horas
- Implementar cache: 2 dias
- Invalidação: 4 horas
- Testes: 4 horas
- Documentação: 2 horas

---

## 🔄 Histórico de Mudanças

| Data | Autor | Mudança |
|------|-------|---------|
| 02/02/2025 | Sistema | Task criada |

---

## ✅ Checklist Final

- [ ] Código implementado
- [ ] Testes passando
- [ ] Code review realizado
- [ ] Documentação atualizada
- [ ] Deploy em dev
- [ ] Testes em dev
- [ ] Deploy em homologação
- [ ] Testes em homologação
- [ ] Aprovação do PO
- [ ] Deploy em produção
- [ ] Verificação em produção
- [ ] Task fechada

---

**Criado em:** 02/02/2025  
**Última Atualização:** 02/02/2025

