# Documentação dos Endpoints e Ordem de Inserção
## Sistema de Gerenciamento de Gruas

Baseado nos testes automatizados do arquivo `gestao-gruas.test.js`, esta documentação descreve como funcionam os endpoints e a ordem correta de inserção de dados.

---

## 📋 **Ordem de Inserção de Dados**

### 1. **Cliente** (Primeiro - Obrigatório)
```javascript
const cliente = {
  id: 999,
  nome: 'Cliente Teste',
  cnpj: '99.999.999/0001-99',  // Deve ser único
  email: 'cliente.teste@exemplo.com',
  telefone: '(11) 99999-9999'
}
```

**Endpoint:** `POST /api/clientes`
**Tabela:** `clientes`
**Campos obrigatórios:** `nome`, `cnpj`
**Constraint:** `cnpj` deve ser único

### 2. **Grua** (Segundo)
```javascript
const grua = {
  id: 'TEST001',
  modelo: 'GT-Test',
  fabricante: 'Teste',
  tipo: 'Grua Torre',
  capacidade: '5 toneladas',
  capacidade_ponta: '2 toneladas',    // Obrigatório
  lanca: '30 metros',                 // Obrigatório
  altura_trabalho: '35 metros',       // Obrigatório
  ano: 2020,
  status: 'Disponível',
  localizacao: 'Teste Localização',
  horas_operacao: 1000,
  valor_locacao: 5000.00,
  valor_operacao: 200.00,
  valor_sinaleiro: 150.00,
  valor_manutencao: 300.00
}
```

**Endpoint:** `POST /api/gruas`
**Tabela:** `gruas`
**Campos obrigatórios:** `modelo`, `fabricante`, `tipo`, `capacidade`, `capacidade_ponta`, `lanca`, `altura_trabalho`

### 3. **Obras** (Terceiro - Dependem do Cliente)
```javascript
const obra1 = {
  id: 999,
  nome: 'Obra Teste 1',
  cliente_id: 999,              // Foreign Key para clientes
  endereco: 'Rua Teste, 123',
  cidade: 'São Paulo',
  estado: 'SP',
  tipo: 'Residencial',
  status: 'Pausada'             // Valores válidos: 'Planejamento', 'Em Andamento', 'Pausada', 'Concluída', 'Cancelada'
}

const obra2 = {
  id: 998,
  nome: 'Obra Teste 2',
  cliente_id: 999,              // Mesmo cliente ou diferente
  endereco: 'Rua Teste, 456',
  cidade: 'São Paulo',
  estado: 'SP',
  tipo: 'Comercial',
  status: 'Pausada'
}
```

**Endpoint:** `POST /api/obras`
**Tabela:** `obras`
**Campos obrigatórios:** `nome`, `cliente_id`, `endereco`, `cidade`, `estado`, `tipo`, `status`
**Foreign Key:** `cliente_id` deve referenciar um cliente existente

### 4. **Funcionário** (Quarto)
```javascript
const funcionario = {
  id: 999,
  nome: 'Funcionário Teste',
  cargo: 'Operador',
  status: 'Ativo'
}
```

**Endpoint:** `POST /api/funcionarios`
**Tabela:** `funcionarios`
**Campos obrigatórios:** `nome`, `cargo`, `status`

---

## 🔗 **Relacionamentos e Operações**

### 5. **Locação de Grua** (Quinto - Depende de Grua e Obra)
```javascript
const locacao = {
  grua_id: 'TEST001',           // Foreign Key para gruas
  obra_id: 999,                 // Foreign Key para obras
  data_inicio_locacao: '2024-01-01',
  data_fim_locacao: '2024-02-15',
  valor_locacao_mensal: 5000.00,
  status: 'Ativa'
}
```

**Endpoint:** `POST /api/relacionamentos/grua-obra`
**Tabela:** `grua_obra`
**Foreign Keys:** `grua_id` e `obra_id` devem existir

### 6. **Histórico de Locação** (Sexto - Depende de Grua, Obra e Funcionário)
```javascript
const historico = {
  grua_id: 'TEST001',           // Foreign Key para gruas
  obra_id: 999,                 // Foreign Key para obras
  data_inicio: '2024-01-01',
  data_fim: '2024-02-15',
  funcionario_responsavel_id: 999,  // Foreign Key para funcionarios
  tipo_operacao: 'Início',      // Valores: 'Início', 'Transferência', 'Fim', 'Pausa', 'Retomada'
  valor_locacao: 5000.00,
  observacoes: 'Locação inicial de teste'
}
```

**Endpoint:** `POST /api/gestao-gruas/setup-historico` (configuração)
**Tabela:** `historico_locacoes`
**Foreign Keys:** `grua_id`, `obra_id`, `funcionario_responsavel_id`
**Nota:** Histórico é criado automaticamente via operações de transferência

---

## 🧪 **Testes Implementados**

### **Teste 1: Verificação de Disponibilidade**
```javascript
// Busca uma grua por ID
const { data, error } = await supabaseAdmin
  .from('gruas')
  .select('*')
  .eq('id', 'TEST001')
  .single()
```
**Objetivo:** Verificar se a grua foi criada corretamente e está disponível.

### **Teste 2: Criação de Locação**
```javascript
// Cria uma locação entre grua e obra
const { data, error } = await supabaseAdmin
  .from('grua_obra')
  .insert([{
    grua_id: 'TEST001',
    obra_id: 999,
    data_inicio_locacao: '2024-01-01',
    data_fim_locacao: '2024-02-15',
    valor_locacao_mensal: 5000.00,
    status: 'Ativa'
  }])
```
**Objetivo:** Testar a criação de relacionamento entre grua e obra.

### **Teste 3: Criação de Histórico**
```javascript
// Cria um registro no histórico
const { data, error } = await supabaseAdmin
  .from('historico_locacoes')
  .insert([{
    grua_id: 'TEST001',
    obra_id: 999,
    data_inicio: '2024-01-01',
    data_fim: '2024-02-15',
    funcionario_responsavel_id: 999,
    tipo_operacao: 'Início',
    valor_locacao: 5000.00,
    observacoes: 'Locação inicial de teste'
  }])
```
**Objetivo:** Testar o registro de histórico de operações.

### **Teste 4: Verificação de Conflitos**
```javascript
// Verifica conflitos de agendamento
const { data, error } = await supabaseAdmin
  .from('grua_obra')
  .select('*')
  .eq('grua_id', 'TEST001')
  .eq('status', 'Ativa')
  .gte('data_inicio_locacao', '2024-01-01')
  .lte('data_fim_locacao', '2024-03-01')
```
**Objetivo:** Verificar se há conflitos de agendamento para uma grua em um período.

### **Teste 5: Transferência de Grua**
```javascript
// Atualiza a locação para transferir a grua
const { data, error } = await supabaseAdmin
  .from('grua_obra')
  .update({
    obra_id: 998,  // Nova obra
    data_inicio_locacao: '2024-02-16',
    observacoes: 'Transferida de Obra Teste 1 para Obra Teste 2'
  })
  .eq('grua_id', 'TEST001')
  .eq('status', 'Ativa')

// Cria histórico da transferência
await supabaseAdmin
  .from('historico_locacoes')
  .insert([{
    grua_id: 'TEST001',
    obra_id: 998,
    data_inicio: '2024-02-16',
    funcionario_responsavel_id: 999,
    tipo_operacao: 'Transferência',
    valor_locacao: 5500.00,
    observacoes: 'Transferida de Obra Teste 1 para Obra Teste 2'
  }])
```
**Objetivo:** Testar a transferência de uma grua de uma obra para outra.

---

## 🗑️ **Limpeza de Dados**

### **Ordem de Limpeza (Inversa da Criação)**
1. **Histórico de Locações** - `DELETE FROM historico_locacoes WHERE grua_id = 'TEST001'`
2. **Relacionamentos Grua-Obra** - `DELETE FROM grua_obra WHERE grua_id = 'TEST001'`
3. **Relacionamentos Grua-Funcionário** - `DELETE FROM grua_funcionario WHERE grua_id = 'TEST001'`
4. **Gruas** - `DELETE FROM gruas WHERE id = 'TEST001'`
5. **Obras** - `DELETE FROM obras WHERE id IN (999, 998)`
6. **Funcionários** - `DELETE FROM funcionarios WHERE id = 999`
7. **Clientes** - `DELETE FROM clientes WHERE id = 999`

---

## ⚠️ **Constraints e Validações**

### **Constraints de Foreign Key**
- `obras.cliente_id` → `clientes.id`
- `grua_obra.grua_id` → `gruas.id`
- `grua_obra.obra_id` → `obras.id`
- `historico_locacoes.grua_id` → `gruas.id`
- `historico_locacoes.obra_id` → `obras.id`
- `historico_locacoes.funcionario_responsavel_id` → `funcionarios.id`

### **Constraints de Unicidade**
- `clientes.cnpj` - Deve ser único
- `gruas.id` - Deve ser único

### **Constraints de Check**
- `obras.status` - Valores válidos: 'Planejamento', 'Em Andamento', 'Pausada', 'Concluída', 'Cancelada'
- `historico_locacoes.tipo_operacao` - Valores válidos: 'Início', 'Transferência', 'Fim', 'Pausa', 'Retomada'

### **Campos NOT NULL**
- `gruas`: `capacidade_ponta`, `lanca`, `altura_trabalho`
- `obras`: `nome`, `cliente_id`, `endereco`, `cidade`, `estado`, `tipo`, `status`
- `clientes`: `nome`, `cnpj`
- `funcionarios`: `nome`, `cargo`, `status`

---

## 🚀 **Como Executar os Testes**

```bash
# Navegar para o diretório de testes
cd backend-api/src/tests

# Executar o teste
node gestao-gruas.test.js
```

**Resultado esperado:**
```
🎯 RESULTADO FINAL: 5/5 testes passaram
🎉 TODOS OS TESTES PASSARAM! Sistema funcionando corretamente.
```

---

## 📊 **Fluxo Completo de Operação**

1. **Setup**: Criar cliente, grua, obras e funcionário
2. **Locação**: Criar relacionamento grua-obra
3. **Histórico**: Registrar operação no histórico
4. **Verificação**: Verificar conflitos de agendamento
5. **Transferência**: Transferir grua para nova obra
6. **Cleanup**: Limpar todos os dados de teste

Este fluxo garante que todas as funcionalidades do sistema de gestão de gruas estejam funcionando corretamente.

---

## ⚠️ **CORREÇÕES IMPORTANTES**

### **Endpoints Corrigidos:**
- ✅ `POST /api/relacionamentos/grua-obra` (não `/api/grua-obra`)
- ✅ `POST /api/gestao-gruas/setup-historico` (não `/api/historico-locacoes`)

### **Endpoints que Funcionam:**
- ✅ `POST /api/clientes`
- ✅ `POST /api/gruas`
- ✅ `POST /api/obras`
- ✅ `POST /api/funcionarios`

### **Nota sobre Histórico:**
O histórico de locações é criado automaticamente quando:
- Uma grua é transferida entre obras
- Operações de gestão são realizadas
- Não há endpoint direto para criar histórico manualmente

---

## 🔗 **Endpoints Reais Disponíveis**

### **Gestão de Gruas:**
- `POST /api/gestao-gruas/transferir` - Transferir grua entre obras
- `GET /api/gestao-gruas/historico/:grua_id` - Histórico de uma grua
- `GET /api/gestao-gruas/disponibilidade` - Verificar disponibilidade
- `GET /api/gestao-gruas/status/:grua_id` - Status atual da grua
- `POST /api/gestao-gruas/validar-conflitos` - Validar conflitos
- `POST /api/gestao-gruas/setup-historico` - Configurar tabela

### **Relacionamentos:**
- `GET /api/relacionamentos/grua-obra` - Listar relacionamentos
- `POST /api/relacionamentos/grua-obra` - Criar relacionamento
- `PUT /api/relacionamentos/grua-obra/:id` - Atualizar relacionamento
- `GET /api/relacionamentos/grua-funcionario` - Listar funcionários
- `POST /api/relacionamentos/grua-funcionario` - Criar relacionamento
- `GET /api/relacionamentos/grua-equipamento` - Listar equipamentos
- `POST /api/relacionamentos/grua-equipamento` - Criar relacionamento
