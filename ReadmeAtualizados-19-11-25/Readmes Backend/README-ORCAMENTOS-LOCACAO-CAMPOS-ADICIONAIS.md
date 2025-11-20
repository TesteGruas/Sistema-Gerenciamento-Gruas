# Demandas Backend - Campos Adicionais em Orçamentos de Locação

## 📋 Resumo

Este documento descreve as alterações necessárias no backend para suportar campos adicionais nos orçamentos de locação, incluindo `condicoes_gerais`, `logistica`, `garantias`, `valores_fixos` e `custos_mensais`.

## 🔍 Problema Identificado

A API `/api/orcamentos-locacao` não estava processando e retornando todos os campos enviados pelo frontend:

- ❌ Campos `condicoes_gerais`, `logistica`, `garantias` não eram salvos
- ❌ Arrays `valores_fixos` e `custos_mensais` não eram processados
- ❌ Resposta não incluía os dados salvos

## ✅ Solução Implementada

### 1. Migration do Banco de Dados

**Arquivo:** `database/migrations/20250220_add_campos_orcamentos_locacao.sql`

#### Campos Adicionados na Tabela `orcamentos_locacao`:
- `condicoes_gerais` (TEXT) - Condições gerais do contrato e termos legais
- `logistica` (TEXT) - Informações sobre transporte, entrega e instalação
- `garantias` (TEXT) - Garantias oferecidas e condições de garantia

#### Tabelas Criadas:

**`orcamento_valores_fixos_locacao`**
```sql
- id (SERIAL PRIMARY KEY)
- orcamento_id (INTEGER) - FK para orcamentos_locacao
- tipo (VARCHAR(50)) - 'Locação' ou 'Serviço'
- descricao (VARCHAR(255))
- quantidade (DECIMAL(10,2))
- valor_unitario (DECIMAL(12,2))
- valor_total (DECIMAL(12,2))
- observacoes (TEXT)
- created_at, updated_at (TIMESTAMP)
```

**`orcamento_custos_mensais_locacao`**
```sql
- id (SERIAL PRIMARY KEY)
- orcamento_id (INTEGER) - FK para orcamentos_locacao
- tipo (VARCHAR(50))
- descricao (VARCHAR(255))
- valor_mensal (DECIMAL(12,2))
- obrigatorio (BOOLEAN)
- observacoes (TEXT)
- created_at, updated_at (TIMESTAMP)
```

### 2. Alterações na API

**Arquivo:** `src/routes/orcamentos-locacao.js`

#### Rota POST `/api/orcamentos-locacao`

**Campos aceitos no request:**
```javascript
{
  // ... campos existentes ...
  condicoes_gerais: string,
  logistica: string,
  garantias: string,
  valores_fixos: [
    {
      tipo: 'Locação' | 'Serviço',
      descricao: string,
      quantidade: number,
      valor_unitario: number,
      valor_total: number,
      observacoes?: string
    }
  ],
  custos_mensais: [
    {
      tipo: string,
      descricao: string,
      valor_mensal: number,
      obrigatorio?: boolean,
      observacoes?: string
    }
  ]
}
```

**Resposta inclui:**
```javascript
{
  success: true,
  message: "Orçamento criado com sucesso",
  data: {
    // ... campos do orçamento ...
    condicoes_gerais: string,
    logistica: string,
    garantias: string,
    orcamento_valores_fixos_locacao: [...],
    orcamento_custos_mensais_locacao: [...],
    orcamento_itens_locacao: [...]
  }
}
```

#### Rota GET `/api/orcamentos-locacao/:id`

**Resposta atualizada para incluir:**
- `orcamento_valores_fixos_locacao`
- `orcamento_custos_mensais_locacao`

#### Rota PUT `/api/orcamentos-locacao/:id`

**Suporta atualização de:**
- Campos `condicoes_gerais`, `logistica`, `garantias`
- Arrays `valores_fixos` e `custos_mensais` (substitui completamente os existentes)

## 🚀 Como Aplicar

### Passo 1: Executar a Migration

```bash
# Conecte-se ao banco de dados PostgreSQL
psql -U seu_usuario -d nome_do_banco

# Execute a migration
\i backend-api/database/migrations/20250220_add_campos_orcamentos_locacao.sql
```

Ou via linha de comando:
```bash
psql -U seu_usuario -d nome_do_banco -f backend-api/database/migrations/20250220_add_campos_orcamentos_locacao.sql
```

### Passo 2: Verificar Estrutura das Tabelas

```sql
-- Verificar se os campos foram adicionados
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orcamentos_locacao' 
AND column_name IN ('condicoes_gerais', 'logistica', 'garantias');

-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
  'orcamento_valores_fixos_locacao', 
  'orcamento_custos_mensais_locacao'
);
```

### Passo 3: Reiniciar o Servidor

```bash
# No diretório backend-api
npm restart
# ou
pm2 restart backend-api
```

## 📝 Exemplo de Request Completo

```json
POST /api/orcamentos-locacao
{
  "numero": "ORC-20251120-930",
  "cliente_id": 42,
  "data_orcamento": "2025-11-20",
  "data_validade": "2027-07-13",
  "valor_total": 601000,
  "desconto": 0,
  "status": "enviado",
  "tipo_orcamento": "locacao_grua",
  "condicoes_pagamento": "Condições Comerciais\nTermos de pagamento e condições gerais",
  "condicoes_gerais": "Condições Gerais\nCondições gerais do contrato e termos legais",
  "logistica": "Logística\nInformações sobre transporte, entrega e instalação",
  "garantias": "Garantias\nGarantias oferecidas e condições de garantia",
  "prazo_entrega": "20 meses",
  "observacoes": "Observações\n",
  "valores_fixos": [
    {
      "tipo": "Serviço",
      "descricao": "Serviço Extra",
      "quantidade": 10,
      "valor_unitario": 100,
      "valor_total": 1000,
      "observacoes": "Observação Adicionar Valores Fixos"
    }
  ],
  "custos_mensais": [
    {
      "tipo": "Locação",
      "descricao": "Locação da grua",
      "valor_mensal": 20000,
      "obrigatorio": true,
      "observacoes": "Observação Locação"
    },
    {
      "tipo": "Operador",
      "descricao": "Operador",
      "valor_mensal": 2000,
      "obrigatorio": true,
      "observacoes": "Observação Operador"
    }
  ],
  "itens": [
    {
      "produto_servico": "Locação",
      "descricao": "Locação da grua",
      "quantidade": 20,
      "valor_unitario": 20000,
      "valor_total": 400000,
      "tipo": "equipamento",
      "unidade": "mês",
      "observacoes": "Observação Locação"
    }
  ]
}
```

## 📤 Exemplo de Response Esperado

```json
{
  "success": true,
  "message": "Orçamento criado com sucesso",
  "data": {
    "id": 4,
    "numero": "ORC-20251120-930",
    "cliente_id": 42,
    "data_orcamento": "2025-11-20",
    "data_validade": "2027-07-13",
    "valor_total": 601000,
    "desconto": 0,
    "status": "enviado",
    "tipo_orcamento": "locacao_grua",
    "vendedor_id": null,
    "condicoes_pagamento": "Condições Comerciais\nTermos de pagamento e condições gerais",
    "condicoes_gerais": "Condições Gerais\nCondições gerais do contrato e termos legais",
    "logistica": "Logística\nInformações sobre transporte, entrega e instalação",
    "garantias": "Garantias\nGarantias oferecidas e condições de garantia",
    "prazo_entrega": "20 meses",
    "observacoes": "Observações\n",
    "created_at": "2025-11-20T12:59:26.928937+00:00",
    "updated_at": "2025-11-20T12:59:26.928937+00:00",
    "clientes": {
      "cnpj": "63965224000158",
      "nome": "Linkon LTDA"
    },
    "funcionarios": null,
    "orcamento_valores_fixos_locacao": [
      {
        "id": 1,
        "orcamento_id": 4,
        "tipo": "Serviço",
        "descricao": "Serviço Extra",
        "quantidade": 10,
        "valor_unitario": 100,
        "valor_total": 1000,
        "observacoes": "Observação Adicionar Valores Fixos",
        "created_at": "2025-11-20T12:59:27.044644+00:00"
      }
    ],
    "orcamento_custos_mensais_locacao": [
      {
        "id": 1,
        "orcamento_id": 4,
        "tipo": "Locação",
        "descricao": "Locação da grua",
        "valor_mensal": 20000,
        "obrigatorio": true,
        "observacoes": "Observação Locação",
        "created_at": "2025-11-20T12:59:27.044644+00:00"
      },
      {
        "id": 2,
        "orcamento_id": 4,
        "tipo": "Operador",
        "descricao": "Operador",
        "valor_mensal": 2000,
        "obrigatorio": true,
        "observacoes": "Observação Operador",
        "created_at": "2025-11-20T12:59:27.044644+00:00"
      }
    ],
    "orcamento_itens_locacao": [
      {
        "id": 1,
        "orcamento_id": 4,
        "tipo": "equipamento",
        "unidade": "mês",
        "descricao": "Locação da grua",
        "quantidade": 20,
        "observacoes": "Observação Locação",
        "valor_total": 400000,
        "valor_unitario": 20000,
        "produto_servico": "Locação",
        "created_at": "2025-11-20T12:59:27.044644+00:00"
      }
    ]
  }
}
```

## 🔧 Validações Implementadas

### Valores Fixos
- `tipo` deve ser 'Locação' ou 'Serviço'
- `descricao` é obrigatório
- `quantidade` padrão: 1
- `valor_unitario` e `valor_total` são obrigatórios

### Custos Mensais
- `tipo` e `descricao` são obrigatórios
- `valor_mensal` é obrigatório
- `obrigatorio` padrão: true

## ⚠️ Observações Importantes

1. **Rollback em caso de erro**: Se houver erro ao criar valores fixos, custos mensais ou itens, o orçamento é excluído automaticamente para manter a integridade dos dados.

2. **Atualização via PUT**: Ao atualizar `valores_fixos` ou `custos_mensais`, os registros existentes são **substituídos completamente**. Se você enviar um array vazio, todos os registros serão removidos.

3. **Nomes das tabelas**: As tabelas foram nomeadas com sufixo `_locacao` para diferenciá-las das tabelas de orçamentos gerais (`orcamento_valores_fixos` e `orcamento_custos_mensais`).

4. **Relacionamentos**: As tabelas `orcamento_valores_fixos_locacao` e `orcamento_custos_mensais_locacao` têm `ON DELETE CASCADE`, então quando um orçamento é excluído, seus valores fixos e custos mensais também são removidos automaticamente.

## 🧪 Testes Recomendados

1. ✅ Criar orçamento com todos os campos
2. ✅ Criar orçamento sem valores_fixos e custos_mensais
3. ✅ Buscar orçamento e verificar se todos os campos são retornados
4. ✅ Atualizar orçamento alterando valores_fixos e custos_mensais
5. ✅ Excluir orçamento e verificar se valores fixos e custos mensais são removidos (CASCADE)

## 📚 Referências

- Migration: `database/migrations/20250220_add_campos_orcamentos_locacao.sql`
- Rota API: `src/routes/orcamentos-locacao.js`
- Documentação Swagger: Disponível em `/api-docs` após iniciar o servidor

## 👥 Contato

Para dúvidas ou problemas, verifique:
- Logs do servidor em caso de erros
- Estrutura do banco de dados via `\d orcamentos_locacao` no psql
- Documentação Swagger da API

