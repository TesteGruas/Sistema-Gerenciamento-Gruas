# README Backend - Sistema de Gerenciamento de Gruas

## 📋 Status Atual do Backend

### ✅ **IMPLEMENTADO**
- Estrutura básica do servidor (Express.js)
- Sistema de autenticação JWT
- Middleware de autenticação
- Conexão com PostgreSQL
- Estrutura de rotas básica

### ❌ **PENDENTE - CRÍTICO**

## 🗄️ **1. BANCO DE DADOS**

### Schema Completo
**Arquivo:** `backend-api/database/schema.sql` ✅ **CRIADO**

**Tabelas Implementadas:**
- ✅ `users` - Usuários do sistema
- ✅ `funcionarios` - Funcionários
- ✅ `clientes` - Clientes
- ✅ `obras` - Obras
- ✅ `gruas` - Gruas
- ✅ `registros_ponto` - Ponto eletrônico
- ✅ `justificativas` - Justificativas
- ✅ `estoque` - Estoque
- ✅ `contas_receber` - Contas a receber
- ✅ `contas_pagar` - Contas a pagar
- ✅ `transferencias_bancarias` - Transferências
- ✅ `notificacoes` - Notificações
- ✅ `assinaturas_digitais` - Assinaturas
- ✅ `relatorios` - Relatórios
- ✅ `configuracoes` - Configurações

### Migrações Pendentes
```sql
-- Executar no PostgreSQL
\i backend-api/database/schema.sql
```

## 🔌 **2. APIs FALTANTES**

### **2.1 Sistema Financeiro**
```javascript
// backend-api/src/routes/financeiro.js

// ❌ PENDENTE: GET /api/financeiro/dashboard
// ❌ PENDENTE: GET /api/financeiro/fluxo-caixa
// ❌ PENDENTE: POST /api/financeiro/transferencia
// ❌ PENDENTE: GET /api/financeiro/contas-receber
// ❌ PENDENTE: GET /api/financeiro/contas-pagar
// ❌ PENDENTE: POST /api/financeiro/contas-receber
// ❌ PENDENTE: POST /api/financeiro/contas-pagar
// ❌ PENDENTE: PUT /api/financeiro/contas-receber/:id
// ❌ PENDENTE: PUT /api/financeiro/contas-pagar/:id
```

### **2.2 Ponto Eletrônico**
```javascript
// backend-api/src/routes/ponto-eletronico.js

// ❌ PENDENTE: GET /api/ponto-eletronico/registros
// ❌ PENDENTE: POST /api/ponto-eletronico/registrar
// ❌ PENDENTE: GET /api/ponto-eletronico/espelho-ponto
// ❌ PENDENTE: POST /api/ponto-eletronico/justificativa
// ❌ PENDENTE: GET /api/ponto-eletronico/justificativas
// ❌ PENDENTE: PUT /api/ponto-eletronico/justificativa/:id/aprovar
// ❌ PENDENTE: POST /api/ponto-eletronico/espelho-ponto/enviar-email
```

### **2.3 Gestão de Gruas**
```javascript
// backend-api/src/routes/gruas.js

// ❌ PENDENTE: GET /api/gruas
// ❌ PENDENTE: POST /api/gruas
// ❌ PENDENTE: GET /api/gruas/:id
// ❌ PENDENTE: PUT /api/gruas/:id
// ❌ PENDENTE: DELETE /api/gruas/:id
// ❌ PENDENTE: POST /api/gruas/:id/manutencao
// ❌ PENDENTE: GET /api/gruas/:id/historico
```

### **2.4 Gestão de Obras**
```javascript
// backend-api/src/routes/obras.js

// ❌ PENDENTE: GET /api/obras
// ❌ PENDENTE: POST /api/obras
// ❌ PENDENTE: GET /api/obras/:id
// ❌ PENDENTE: PUT /api/obras/:id
// ❌ PENDENTE: DELETE /api/obras/:id
// ❌ PENDENTE: POST /api/obras/:id/gruas
// ❌ PENDENTE: DELETE /api/obras/:id/gruas/:gruaId
```

### **2.5 Gestão de Funcionários**
```javascript
// backend-api/src/routes/funcionarios.js

// ❌ PENDENTE: GET /api/funcionarios
// ❌ PENDENTE: POST /api/funcionarios
// ❌ PENDENTE: GET /api/funcionarios/:id
// ❌ PENDENTE: PUT /api/funcionarios/:id
// ❌ PENDENTE: DELETE /api/funcionarios/:id
// ❌ PENDENTE: GET /api/funcionarios/:id/ponto
// ❌ PENDENTE: GET /api/funcionarios/:id/relatorios
```

### **2.6 Gestão de Clientes**
```javascript
// backend-api/src/routes/clientes.js

// ❌ PENDENTE: GET /api/clientes
// ❌ PENDENTE: POST /api/clientes
// ❌ PENDENTE: GET /api/clientes/:id
// ❌ PENDENTE: PUT /api/clientes/:id
// ❌ PENDENTE: DELETE /api/clientes/:id
// ❌ PENDENTE: GET /api/clientes/:id/obras
```

### **2.7 Gestão de Estoque**
```javascript
// backend-api/src/routes/estoque.js

// ❌ PENDENTE: GET /api/estoque
// ❌ PENDENTE: POST /api/estoque
// ❌ PENDENTE: GET /api/estoque/:id
// ❌ PENDENTE: PUT /api/estoque/:id
// ❌ PENDENTE: DELETE /api/estoque/:id
// ❌ PENDENTE: POST /api/estoque/:id/movimentacao
// ❌ PENDENTE: GET /api/estoque/:id/movimentacoes
```

### **2.8 Sistema de Notificações**
```javascript
// backend-api/src/routes/notificacoes.js

// ❌ PENDENTE: GET /api/notificacoes
// ❌ PENDENTE: POST /api/notificacoes
// ❌ PENDENTE: PUT /api/notificacoes/:id/lida
// ❌ PENDENTE: DELETE /api/notificacoes/:id
// ❌ PENDENTE: POST /api/notificacoes/push/enviar
// ❌ PENDENTE: GET /api/notificacoes/nao-lidas
```

### **2.9 Sistema de Exportação**
```javascript
// backend-api/src/routes/exportar.js

// ❌ PENDENTE: POST /api/exportar/gruas
// ❌ PENDENTE: POST /api/exportar/obras
// ❌ PENDENTE: POST /api/exportar/funcionarios
// ❌ PENDENTE: POST /api/exportar/financeiro
// ❌ PENDENTE: POST /api/exportar/estoque
// ❌ PENDENTE: POST /api/exportar/ponto
// ❌ PENDENTE: POST /api/exportar/relatorios
```

### **2.10 Sistema de Assinaturas**
```javascript
// backend-api/src/routes/assinaturas.js

// ❌ PENDENTE: POST /api/assinaturas/validar
// ❌ PENDENTE: POST /api/assinaturas/salvar
// ❌ PENDENTE: GET /api/assinaturas/:id
// ❌ PENDENTE: GET /api/assinaturas/documento/:tipo/:id
```

## 📊 **3. DADOS MOCKADOS FALTANTES**

### **3.1 Dados de Funcionários**
```javascript
// backend-api/src/data/mock-funcionarios.js

const funcionariosMock = [
  {
    id: 1,
    nome: "João Silva",
    cpf: "123.456.789-00",
    cargo: "Operador de Grua",
    salario: 3500.00,
    data_admissao: "2023-01-15",
    status: "ativo"
  },
  {
    id: 2,
    nome: "Maria Santos",
    cpf: "987.654.321-00",
    cargo: "Supervisora",
    salario: 4500.00,
    data_admissao: "2022-06-10",
    status: "ativo"
  }
  // ... mais funcionários
];
```

### **3.2 Dados de Clientes**
```javascript
// backend-api/src/data/mock-clientes.js

const clientesMock = [
  {
    id: 1,
    nome: "Construtora ABC Ltda",
    cnpj: "12.345.678/0001-90",
    telefone: "(11) 99999-9999",
    email: "contato@construtoraabc.com",
    status: "ativo"
  }
  // ... mais clientes
];
```

### **3.3 Dados de Obras**
```javascript
// backend-api/src/data/mock-obras.js

const obrasMock = [
  {
    id: 1,
    nome: "Edifício Residencial Horizonte",
    endereco: "Rua das Flores, 123 - São Paulo/SP",
    cliente_id: 1,
    data_inicio: "2024-01-15",
    data_fim: "2024-12-31",
    status: "ativa",
    valor_total: 1500000.00
  }
  // ... mais obras
];
```

### **3.4 Dados de Gruas**
```javascript
// backend-api/src/data/mock-gruas.js

const gruasMock = [
  {
    id: 1,
    nome: "Grua 001",
    modelo: "Liebherr 1000",
    capacidade: 1000.00,
    altura_maxima: 50.00,
    alcance_maximo: 40.00,
    status: "disponivel",
    obra_atual_id: null
  }
  // ... mais gruas
];
```

### **3.5 Dados de Ponto Eletrônico**
```javascript
// backend-api/src/data/mock-ponto.js

const registrosPontoMock = [
  {
    id: 1,
    funcionario_id: 1,
    data: "2024-10-15",
    entrada: "08:00",
    saida_almoco: "12:00",
    volta_almoco: "13:00",
    saida: "17:00",
    horas_trabalhadas: 8.00,
    horas_extras: 0.00,
    status: "completo"
  }
  // ... mais registros
];
```

### **3.6 Dados Financeiros**
```javascript
// backend-api/src/data/mock-financeiro.js

const dadosFinanceirosMock = {
  receberHoje: 15000.00,
  pagarHoje: 8500.00,
  recebimentosAtraso: 2500.00,
  pagamentosAtraso: 1200.00,
  saldoAtual: 125000.00,
  fluxoCaixa: [
    { mes: "Jan", entrada: 45000, saida: 38000 },
    { mes: "Fev", entrada: 52000, saida: 41000 },
    { mes: "Mar", entrada: 48000, saida: 39000 }
  ],
  transferencias: [
    {
      id: 1,
      data: "2024-10-15",
      valor: 5000.00,
      tipo: "entrada",
      descricao: "Pagamento cliente ABC",
      status: "confirmada"
    }
  ]
};
```

### **3.7 Dados de Estoque**
```javascript
// backend-api/src/data/mock-estoque.js

const estoqueMock = [
  {
    id: 1,
    nome: "Cabo de Aço 12mm",
    categoria: "Equipamentos",
    quantidade: 150,
    quantidade_minima: 20,
    preco_unitario: 25.50,
    fornecedor: "Fornecedor ABC"
  }
  // ... mais itens
];
```

## 🔧 **4. IMPLEMENTAÇÕES NECESSÁRIAS**

### **4.1 Middleware de Validação**
```javascript
// backend-api/src/middleware/validation.js
// ❌ PENDENTE: Validação de dados de entrada
// ❌ PENDENTE: Sanitização de dados
// ❌ PENDENTE: Validação de tipos
```

### **4.2 Sistema de Logs**
```javascript
// backend-api/src/middleware/logging.js
// ❌ PENDENTE: Log de requisições
// ❌ PENDENTE: Log de erros
// ❌ PENDENTE: Log de auditoria
```

### **4.3 Sistema de Cache**
```javascript
// backend-api/src/middleware/cache.js
// ❌ PENDENTE: Cache de consultas frequentes
// ❌ PENDENTE: Invalidação de cache
```

### **4.4 Sistema de Backup**
```javascript
// backend-api/src/utils/backup.js
// ❌ PENDENTE: Backup automático
// ❌ PENDENTE: Restauração de backup
```

### **4.5 Sistema de Relatórios**
```javascript
// backend-api/src/services/relatorios.js
// ❌ PENDENTE: Geração de PDFs
// ❌ PENDENTE: Geração de Excel
// ❌ PENDENTE: Envio por e-mail
```

## 📧 **5. INTEGRAÇÕES FALTANTES**

### **5.1 Sistema de E-mail**
```javascript
// backend-api/src/services/email.js
// ❌ PENDENTE: Configuração SMTP
// ❌ PENDENTE: Templates de e-mail
// ❌ PENDENTE: Envio automático
```

### **5.2 Sistema de WhatsApp**
```javascript
// backend-api/src/services/whatsapp.js
// ❌ PENDENTE: Integração WhatsApp Business API
// ❌ PENDENTE: Envio de mensagens
// ❌ PENDENTE: Webhook de recebimento
```

### **5.3 Sistema de Notificações Push**
```javascript
// backend-api/src/services/push-notifications.js
// ❌ PENDENTE: Configuração FCM
// ❌ PENDENTE: Envio de notificações
// ❌ PENDENTE: Gerenciamento de tokens
```

### **5.4 Sistema de Geolocalização**
```javascript
// backend-api/src/services/geolocation.js
// ❌ PENDENTE: Validação de localização
// ❌ PENDENTE: Cálculo de distâncias
// ❌ PENDENTE: Verificação de presença
```

## 🚀 **6. PLANO DE IMPLEMENTAÇÃO**

### **Fase 1 - Crítica (1-2 semanas)**
1. ✅ **Banco de dados** - Schema completo
2. ❌ **APIs básicas** - CRUD para todas as entidades
3. ❌ **Dados mockados** - Dados de desenvolvimento
4. ❌ **Autenticação** - Sistema JWT completo

### **Fase 2 - Importante (2-3 semanas)**
1. ❌ **Sistema financeiro** - APIs completas
2. ❌ **Ponto eletrônico** - APIs completas
3. ❌ **Sistema de exportação** - PDF, Excel, CSV
4. ❌ **Sistema de notificações** - Push notifications

### **Fase 3 - Desejável (3-4 semanas)**
1. ❌ **Integrações** - E-mail, WhatsApp
2. ❌ **Sistema de relatórios** - Geração automática
3. ❌ **Sistema de backup** - Backup automático
4. ❌ **Otimizações** - Cache, performance

## 📁 **7. ESTRUTURA DE ARQUIVOS NECESSÁRIA**

```
backend-api/
├── src/
│   ├── routes/
│   │   ├── financeiro.js          ❌ PENDENTE
│   │   ├── ponto-eletronico.js    ❌ PENDENTE
│   │   ├── gruas.js               ❌ PENDENTE
│   │   ├── obras.js               ❌ PENDENTE
│   │   ├── funcionarios.js        ❌ PENDENTE
│   │   ├── clientes.js            ❌ PENDENTE
│   │   ├── estoque.js             ❌ PENDENTE
│   │   ├── notificacoes.js        ❌ PENDENTE
│   │   ├── exportar.js            ❌ PENDENTE
│   │   └── assinaturas.js         ❌ PENDENTE
│   ├── services/
│   │   ├── email.js               ❌ PENDENTE
│   │   ├── whatsapp.js           ❌ PENDENTE
│   │   ├── push-notifications.js  ❌ PENDENTE
│   │   └── relatorios.js         ❌ PENDENTE
│   ├── data/
│   │   ├── mock-funcionarios.js   ❌ PENDENTE
│   │   ├── mock-clientes.js       ❌ PENDENTE
│   │   ├── mock-obras.js          ❌ PENDENTE
│   │   ├── mock-gruas.js          ❌ PENDENTE
│   │   ├── mock-ponto.js          ❌ PENDENTE
│   │   ├── mock-financeiro.js     ❌ PENDENTE
│   │   └── mock-estoque.js        ❌ PENDENTE
│   └── utils/
│       ├── backup.js              ❌ PENDENTE
│       ├── cache.js               ❌ PENDENTE
│       └── logging.js              ❌ PENDENTE
└── database/
    └── schema.sql                 ✅ CRIADO
```

## ⚡ **8. COMANDOS PARA EXECUÇÃO**

### **Instalar Dependências**
```bash
cd backend-api
npm install
```

### **Configurar Banco de Dados**
```bash
# PostgreSQL
createdb sistema_gruas
psql sistema_gruas < database/schema.sql
```

### **Executar Servidor**
```bash
npm run dev
```

## 🎯 **9. PRIORIDADES DE IMPLEMENTAÇÃO**

### **🔴 CRÍTICO (Implementar primeiro)**
1. APIs básicas de CRUD
2. Dados mockados completos
3. Sistema de autenticação
4. Banco de dados funcional

### **🟡 IMPORTANTE (Implementar em seguida)**
1. Sistema financeiro
2. Ponto eletrônico
3. Sistema de exportação
4. Notificações

### **🟢 DESEJÁVEL (Implementar por último)**
1. Integrações externas
2. Sistema de backup
3. Otimizações
4. Relatórios avançados

## 📊 **10. ESTIMATIVA DE TEMPO**

- **APIs Básicas:** 1-2 semanas
- **Dados Mockados:** 3-5 dias
- **Sistema Financeiro:** 1 semana
- **Ponto Eletrônico:** 1 semana
- **Sistema de Exportação:** 1 semana
- **Notificações:** 1 semana
- **Integrações:** 2 semanas

**Total Estimado:** 6-8 semanas

## ✅ **11. CHECKLIST DE IMPLEMENTAÇÃO**

### **Banco de Dados**
- [x] Schema completo criado
- [ ] Migrações executadas
- [ ] Dados iniciais inseridos
- [ ] Índices criados
- [ ] Triggers funcionando

### **APIs**
- [ ] CRUD Funcionários
- [ ] CRUD Clientes
- [ ] CRUD Obras
- [ ] CRUD Gruas
- [ ] CRUD Estoque
- [ ] Sistema Financeiro
- [ ] Ponto Eletrônico
- [ ] Notificações
- [ ] Exportação
- [ ] Assinaturas

### **Dados Mockados**
- [ ] Funcionários (50+ registros)
- [ ] Clientes (20+ registros)
- [ ] Obras (30+ registros)
- [ ] Gruas (15+ registros)
- [ ] Registros de Ponto (500+ registros)
- [ ] Dados Financeiros (100+ registros)
- [ ] Estoque (100+ itens)
- [ ] Notificações (50+ registros)

### **Integrações**
- [ ] Sistema de E-mail
- [ ] WhatsApp Business
- [ ] Notificações Push
- [ ] Geolocalização
- [ ] Backup Automático

---

## 🚨 **STATUS ATUAL: BACKEND 20% COMPLETO**

**Próximos Passos:**
1. Implementar APIs básicas
2. Criar dados mockados
3. Configurar banco de dados
4. Testar integração frontend-backend
