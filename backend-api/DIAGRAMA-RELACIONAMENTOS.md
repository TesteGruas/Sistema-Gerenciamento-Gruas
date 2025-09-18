# Diagrama de Relacionamentos e Ordem de Inserção
## Sistema de Gerenciamento de Gruas

## 📊 **Diagrama de Relacionamentos**

```
┌─────────────┐
│   CLIENTES  │
│             │
│ id (PK)     │
│ nome        │
│ cnpj (UK)   │
│ email       │
│ telefone    │
└─────────────┘
       │
       │ 1:N
       │
       ▼
┌─────────────┐
│    OBRAS    │
│             │
│ id (PK)     │
│ nome        │
│ cliente_id  │ ◄── FK
│ endereco    │
│ cidade      │
│ estado      │
│ tipo        │
│ status      │
└─────────────┘
       │
       │ N:M
       │
       ▼
┌─────────────┐    ┌─────────────┐
│    GRUAS    │    │ GRUA_OBRA   │
│             │    │             │
│ id (PK)     │◄───┤ grua_id     │
│ modelo      │    │ obra_id     │ ◄── FK
│ fabricante  │    │ data_inicio │
│ tipo        │    │ data_fim    │
│ capacidade  │    │ valor       │
│ capacidade_ │    │ status      │
│ ponta       │    └─────────────┘
│ lanca       │
│ altura_     │
│ trabalho    │
│ ano         │
│ status      │
│ localizacao │
│ horas_op    │
│ valor_*     │
└─────────────┘
       │
       │ 1:N
       │
       ▼
┌─────────────┐
│ HISTORICO_  │
│ LOCACOES    │
│             │
│ id (PK)     │
│ grua_id     │ ◄── FK
│ obra_id     │ ◄── FK
│ data_inicio │
│ data_fim    │
│ funcionario │
│ _id         │ ◄── FK
│ tipo_op     │
│ valor       │
│ observacoes │
└─────────────┘
       │
       │ N:1
       │
       ▼
┌─────────────┐
│FUNCIONARIOS │
│             │
│ id (PK)     │
│ nome        │
│ cargo       │
│ status      │
└─────────────┘
```

## 🔄 **Ordem de Inserção (Sequência)**

### **Fase 1: Entidades Base**
```
1. CLIENTES
   └── Campos obrigatórios: nome, cnpj
   └── Constraint: cnpj único

2. GRUAS
   └── Campos obrigatórios: modelo, fabricante, tipo, capacidade, capacidade_ponta, lanca, altura_trabalho
   └── Constraint: id único

3. OBRAS
   └── Campos obrigatórios: nome, cliente_id, endereco, cidade, estado, tipo, status
   └── Foreign Key: cliente_id → clientes.id
   └── Status válidos: 'Planejamento', 'Em Andamento', 'Pausada', 'Concluída', 'Cancelada'

4. FUNCIONARIOS
   └── Campos obrigatórios: nome, cargo, status
```

### **Fase 2: Relacionamentos**
```
5. GRUA_OBRA (Locação)
   └── Foreign Keys: grua_id → gruas.id, obra_id → obras.id
   └── Campos: data_inicio_locacao, data_fim_locacao, valor_locacao_mensal, status

6. HISTORICO_LOCACOES
   └── Foreign Keys: grua_id → gruas.id, obra_id → obras.id, funcionario_responsavel_id → funcionarios.id
   └── Campos: data_inicio, data_fim, tipo_operacao, valor_locacao, observacoes
   └── Tipo operação válidos: 'Início', 'Transferência', 'Fim', 'Pausa', 'Retomada'
```

## 🧪 **Fluxo de Testes**

```
┌─────────────────┐
│   LIMPEZA       │
│   (Cleanup)     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   CRIAÇÃO       │
│   (Setup)       │
│                 │
│ 1. Cliente      │
│ 2. Grua         │
│ 3. Obras        │
│ 4. Funcionário  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   TESTES        │
│                 │
│ 1. Disponibilidade │
│ 2. Locação      │
│ 3. Histórico    │
│ 4. Conflitos    │
│ 5. Transferência│
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   LIMPEZA       │
│   (Cleanup)     │
└─────────────────┘
```

## ⚠️ **Constraints Críticas**

### **Foreign Key Constraints**
- `obras.cliente_id` → `clientes.id` (CASCADE DELETE)
- `grua_obra.grua_id` → `gruas.id` (CASCADE DELETE)
- `grua_obra.obra_id` → `obras.id` (CASCADE DELETE)
- `historico_locacoes.grua_id` → `gruas.id` (CASCADE DELETE)
- `historico_locacoes.obra_id` → `obras.id` (CASCADE DELETE)
- `historico_locacoes.funcionario_responsavel_id` → `funcionarios.id` (SET NULL)

### **Unique Constraints**
- `clientes.cnpj` - Deve ser único no sistema
- `gruas.id` - Identificador único da grua

### **Check Constraints**
- `obras.status` - Valores pré-definidos
- `historico_locacoes.tipo_operacao` - Valores pré-definidos

## 🗑️ **Ordem de Limpeza (Inversa)**

```
1. historico_locacoes (depende de grua_id)
2. grua_obra (depende de grua_id)
3. grua_funcionario (depende de grua_id)
4. gruas (entidade base)
5. obras (depende de cliente_id)
6. funcionarios (entidade base)
7. clientes (entidade base)
```

## 🚀 **Exemplo de Uso Completo**

```javascript
// 1. Criar cliente
const cliente = await supabaseAdmin.from('clientes').insert([{
  nome: 'Cliente Teste',
  cnpj: '99.999.999/0001-99'
}])

// 2. Criar grua
const grua = await supabaseAdmin.from('gruas').insert([{
  id: 'TEST001',
  modelo: 'GT-Test',
  fabricante: 'Teste',
  tipo: 'Grua Torre',
  capacidade: '5 toneladas',
  capacidade_ponta: '2 toneladas',
  lanca: '30 metros',
  altura_trabalho: '35 metros'
}])

// 3. Criar obra
const obra = await supabaseAdmin.from('obras').insert([{
  nome: 'Obra Teste',
  cliente_id: 999,
  endereco: 'Rua Teste, 123',
  cidade: 'São Paulo',
  estado: 'SP',
  tipo: 'Residencial',
  status: 'Pausada'
}])

// 4. Criar funcionário
const funcionario = await supabaseAdmin.from('funcionarios').insert([{
  nome: 'Funcionário Teste',
  cargo: 'Operador',
  status: 'Ativo'
}])

// 5. Criar locação
const locacao = await supabaseAdmin.from('grua_obra').insert([{
  grua_id: 'TEST001',
  obra_id: 999,
  data_inicio_locacao: '2024-01-01',
  data_fim_locacao: '2024-02-15',
  valor_locacao_mensal: 5000.00,
  status: 'Ativa'
}])

// 6. Registrar histórico
const historico = await supabaseAdmin.from('historico_locacoes').insert([{
  grua_id: 'TEST001',
  obra_id: 999,
  data_inicio: '2024-01-01',
  data_fim: '2024-02-15',
  funcionario_responsavel_id: 999,
  tipo_operacao: 'Início',
  valor_locacao: 5000.00,
  observacoes: 'Locação inicial'
}])
```

Este diagrama e documentação fornecem uma visão completa de como o sistema funciona e a ordem correta para inserir dados.
