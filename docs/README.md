# Documentação do Backend - Sistema de Gerenciamento de Gruas

## Visão Geral

Este diretório contém toda a documentação técnica necessária para implementar o backend do Sistema de Gerenciamento de Gruas. A documentação está organizada de forma lógica para facilitar o desenvolvimento e manutenção do sistema.

## 📋 Documentação Disponível

- **📄 README.md** - Este arquivo (visão geral e ordem de implementação)
- **⚙️ supabase-setup.md** - Configuração completa do Supabase
- **👥 modulo-usuarios-backend.md** - Entidades e APIs do módulo de usuários
- **🏗️ modulo-gruas-backend.md** - Entidades e APIs do módulo de gruas
- **📦 modulo-estoque-backend.md** - Entidades e APIs do módulo de estoque

> **⚠️ IMPORTANTE**: Antes de começar a implementação, leia primeiro o arquivo `supabase-setup.md` para configurar corretamente o ambiente Supabase.

## Ordem de Implementação Recomendada

### 1. **Módulo de Usuários** (Base)
📄 **Arquivo**: `modulo-usuarios-backend.md`

**Por que começar aqui:**
- Base fundamental para todo o sistema
- Necessário para autenticação e autorização
- Outros módulos dependem de usuários

**Entidades principais:**
- Usuários, Credenciais, Perfis, Permissões
- Sessões, Logs de Atividade, Configurações
- Sistema de autenticação e autorização

**Implementar primeiro:**
1. Tabelas de usuários e credenciais
2. Sistema de autenticação básico
3. Perfis e permissões básicas
4. APIs de login/logout

---

### 2. **Módulo de Gruas** (Core Business)
📄 **Arquivo**: `modulo-gruas-backend.md`

**Por que em segundo:**
- Funcionalidade principal do sistema
- Base para outros módulos (estoque, contratos)
- Lógica de negócio central

**Entidades principais:**
- Gruas, Clientes, Obras, Contratos
- Funcionários, Equipamentos Auxiliares
- Histórico de Manutenção, Propostas Comerciais

**Implementar em seguida:**
1. Tabelas de gruas e especificações
2. Sistema de clientes e obras
3. Gestão de contratos
4. APIs de CRUD básico

---

### 3. **Módulo de Estoque** (Integração)
📄 **Arquivo**: `modulo-estoque-backend.md`

**Por que em terceiro:**
- Integra com o módulo de gruas
- Depende de usuários para movimentações
- Funcionalidade complementar importante

**Entidades principais:**
- Produtos, Categorias, Fornecedores
- Estoque, Movimentações, Reservas
- Alertas, Histórico de Preços

**Implementar depois:**
1. Tabelas de produtos e categorias
2. Sistema de movimentações
3. Alertas de estoque mínimo
4. Integração com módulo de gruas

---

## Estrutura de Dependências

```mermaid
graph TD
    A[Usuários] --> B[Gruas]
    A --> C[Estoque]
    B --> C
    B --> D[Contratos]
    B --> E[Manutenções]
    C --> F[Movimentações]
    C --> G[Alertas]
    A --> H[Logs/Auditoria]
    B --> H
    C --> H
```

## Ordem de Desenvolvimento Detalhada

### Fase 1: Fundação (Semanas 1-2)
1. **Configuração do Ambiente**
   - Setup do banco de dados
   - Configuração do framework backend
   - Estrutura de pastas e arquivos

2. **Módulo de Usuários - Parte 1**
   - Tabelas: `usuarios`, `credenciais`, `perfis`, `permissoes`
   - Sistema básico de autenticação
   - APIs de login/logout

### Fase 2: Core Business (Semanas 3-5)
3. **Módulo de Usuários - Parte 2**
   - Tabelas: `sessoes`, `logs_atividade`, `configuracoes_usuario`
   - Sistema completo de autorização
   - Middleware de autenticação

4. **Módulo de Gruas - Parte 1**
   - Tabelas: `gruas`, `clientes`, `obras`
   - CRUD básico de gruas
   - APIs de clientes e obras

### Fase 3: Integração (Semanas 6-8)
5. **Módulo de Gruas - Parte 2**
   - Tabelas: `contratos`, `funcionarios`, `equipamentos_auxiliares`
   - Sistema de contratos
   - Gestão de equipes

6. **Módulo de Estoque - Parte 1**
   - Tabelas: `produtos`, `categorias`, `fornecedores`, `estoque`
   - CRUD de produtos
   - Sistema básico de estoque

### Fase 4: Funcionalidades Avançadas (Semanas 9-12)
7. **Módulo de Estoque - Parte 2**
   - Tabelas: `movimentacoes_estoque`, `reservas_estoque`, `alertas_estoque`
   - Sistema de movimentações
   - Alertas automáticos

8. **Integrações e Relatórios**
   - Views e triggers
   - APIs de relatórios
   - Exportação de dados

## Considerações Técnicas

### Banco de Dados
- **SGBD**: Supabase (PostgreSQL)
- **URL**: https://mghdktkoejobsmdbvssl.supabase.co
- **Encoding**: UTF-8 para suporte a caracteres especiais
- **Timezone**: America/Sao_Paulo
- **Backup**: Automático via Supabase
- **Row Level Security (RLS)**: Habilitado para segurança

### Segurança
- **Autenticação**: Supabase Auth (JWT automático)
- **Hash de Senhas**: Automático via Supabase
- **Row Level Security**: Políticas de acesso por usuário
- **HTTPS**: Automático via Supabase
- **Rate Limiting**: Configurável no Supabase

### Performance
- **Índices**: Implementar conforme documentação
- **Cache**: Supabase Edge Functions + CDN
- **Paginação**: Em todas as listagens
- **Real-time**: Supabase Realtime para atualizações
- **Edge Functions**: Para lógica de negócio complexa

## Estrutura de Arquivos do Backend (Supabase)

```
backend/
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_users_table.sql
│   │   ├── 002_create_gruas_table.sql
│   │   ├── 003_create_estoque_table.sql
│   │   └── ...
│   ├── functions/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── gruas/
│   │   │   ├── create-grua/
│   │   │   └── update-status/
│   │   └── estoque/
│   │       ├── movimentar/
│   │       └── gerar-alerta/
│   ├── policies/
│   │   ├── users_policies.sql
│   │   ├── gruas_policies.sql
│   │   └── estoque_policies.sql
│   └── config.toml
├── src/
│   ├── lib/
│   │   ├── supabase.js
│   │   └── auth.js
│   ├── types/
│   │   ├── database.ts
│   │   └── auth.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useGruas.ts
│   │   └── useEstoque.ts
│   └── utils/
│       ├── validators.ts
│       └── helpers.ts
├── .env.local
└── docs/
```

### Configuração do Supabase

```typescript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mghdktkoejobsmdbvssl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1naGRrdGtvZWpvYnNtZGJ2c3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDYzODcsImV4cCI6MjA3MjcyMjM4N30.9XpjiPOnY2BzulrpH6Cw3ZubTSbZ2NH5BH45tarXelA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## APIs Principais por Módulo (Supabase)

### Autenticação (Supabase Auth)
```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Logout
await supabase.auth.signOut()

// Registrar usuário
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})
```

### Usuários (Supabase Database)
```typescript
// Listar usuários
const { data, error } = await supabase
  .from('usuarios')
  .select('*')

// Criar usuário
const { data, error } = await supabase
  .from('usuarios')
  .insert([{ nome: 'João Silva', email: 'joao@example.com' }])

// Atualizar usuário
const { data, error } = await supabase
  .from('usuarios')
  .update({ nome: 'João Santos' })
  .eq('id', userId)
```

### Gruas (Supabase Database)
```typescript
// Listar gruas
const { data, error } = await supabase
  .from('gruas')
  .select(`
    *,
    contratos(*),
    obras(*)
  `)

// Criar grua
const { data, error } = await supabase
  .from('gruas')
  .insert([{
    modelo: 'SITI MI2348',
    fabricante: 'SITI',
    tipo: 'Grua Torre'
  }])
```

### Estoque (Supabase Database + Edge Functions)
```typescript
// Listar estoque
const { data, error } = await supabase
  .from('estoque')
  .select(`
    *,
    produtos(*)
  `)

// Movimentar estoque (Edge Function)
const { data, error } = await supabase.functions.invoke('movimentar-estoque', {
  body: {
    produto_id: 'EST001',
    tipo: 'Saída',
    quantidade: 10,
    obra_id: 1
  }
})
```

## Testes Recomendados

### Testes Unitários
- Modelos de dados
- Serviços de negócio
- Utilitários e helpers

### Testes de Integração
- APIs de autenticação
- CRUD de entidades principais
- Fluxos de negócio complexos

### Testes de Carga
- APIs de consulta
- Sistema de autenticação
- Relatórios e exportações

## Monitoramento e Logs

### Logs Obrigatórios
- Tentativas de login (sucesso/falha)
- Criação/edição/exclusão de registros
- Acessos a dados sensíveis
- Erros de sistema

### Métricas Importantes
- Tempo de resposta das APIs
- Taxa de erro por endpoint
- Uso de recursos do banco
- Sessões ativas

## Deploy e Manutenção

### Ambiente de Desenvolvimento
- Docker para containerização
- Scripts de migração automática
- Dados de teste (seeds)

### Ambiente de Produção
- CI/CD pipeline
- Backup automático
- Monitoramento 24/7
- Rollback automático

## Próximos Passos

### 🚀 Setup Inicial (OBRIGATÓRIO)

1. **📖 Ler configuração do Supabase**
   - Consulte o arquivo `supabase-setup.md` para configuração completa
   - Contém todas as credenciais e comandos necessários

2. **Configurar Supabase CLI**
   ```bash
   npm install -g supabase
   supabase login
   supabase init
   ```

3. **Configurar variáveis de ambiente**
   ```bash
   # .env.local
   PUBLIC_SUPABASE_URL=https://mghdktkoejobsmdbvssl.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1naGRrdGtvZWpvYnNtZGJ2c3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDYzODcsImV4cCI6MjA3MjcyMjM4N30.9XpjiPOnY2BzulrpH6Cw3ZubTSbZ2NH5BH45tarXelA
   ```

4. **Criar primeira migração**
   ```bash
   supabase migration new create_users_table
   ```

### 📋 Implementação

5. **Implementar módulo de usuários primeiro**
6. **Configurar Row Level Security (RLS)**
7. **Seguir a ordem recomendada**
8. **Testar cada módulo antes de prosseguir**

## Contato e Suporte

Para dúvidas sobre a implementação:
- Revisar a documentação específica de cada módulo
- Verificar relacionamentos entre entidades
- Consultar exemplos de APIs fornecidos
- Testar em ambiente de desenvolvimento primeiro

---

**Última atualização**: Janeiro 2024  
**Versão da documentação**: 1.0  
**Status**: Pronto para implementação
