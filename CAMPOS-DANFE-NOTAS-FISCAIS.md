# 📋 Campos Completos do DANFE - Notas Fiscais

**Data:** 28/02/2025  
**Objetivo:** Adicionar todos os campos necessários para armazenar dados completos de uma nota fiscal eletrônica (DANFE)

---

## 📄 EXEMPLO ANALISADO

**DANFE:** 461 - S garfo - DIVINOPOLIS  
**Tipo:** Nota Fiscal Eletrônica de Saída  
**Emitente:** IRBANA COPAS SERVICOS DE MANUTENCAO E MONTAGEM LTDA  
**Destinatário:** 128 DIVINOPOLIS INCORPORADORA SPE LTDA

---

## ✅ CAMPOS ADICIONADOS

### 1. Dados do Emitente/Destinatário

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `emitente_inscricao_estadual` | VARCHAR(20) | Inscrição Estadual do emitente | 387.261.940.115 |
| `destinatario_inscricao_estadual` | VARCHAR(20) | Inscrição Estadual do destinatário | ISENTO |

### 2. Dados da Nota Fiscal

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `natureza_operacao` | VARCHAR(255) | Natureza da operação | "Remessa de bem por conta de contrato de comodato" |
| `protocolo_autorizacao` | VARCHAR(50) | Protocolo de autorização de uso | "135253850382540 09/12/2025 10:40:29" |
| `data_saida` | DATE | Data de saída/entrada da mercadoria | 2025-12-09 |
| `hora_saida` | TIME | Hora de saída/entrada da mercadoria | 10:40:27 |

### 3. Cálculo do Imposto

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `base_calculo_icms` | DECIMAL(12,2) | Base de cálculo do ICMS | 0.00 |
| `valor_icms` | DECIMAL(12,2) | Valor do ICMS | 0.00 |
| `base_calculo_icms_st` | DECIMAL(12,2) | Base de cálculo do ICMS ST | 0.00 |
| `valor_icms_st` | DECIMAL(12,2) | Valor do ICMS Substituição Tributária | 0.00 |
| `valor_fcp_st` | DECIMAL(12,2) | Valor do FCP ST | 0.00 |
| `valor_frete` | DECIMAL(12,2) | Valor do frete | 0.00 |
| `valor_seguro` | DECIMAL(12,2) | Valor do seguro | 0.00 |
| `valor_desconto` | DECIMAL(12,2) | Valor do desconto | 0.00 |
| `outras_despesas_acessorias` | DECIMAL(12,2) | Outras despesas acessórias | 0.00 |
| `valor_ipi` | DECIMAL(12,2) | Valor do IPI | 0.00 |

### 4. Transportador

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `tipo_frete` | VARCHAR(50) | Tipo de frete | "0 - Contratação do Frete por conta do Remetente (CIF)" |

**Valores possíveis:**
- `0` - CIF (Contratação do Frete por conta do Remetente)
- `1` - FOB (Contratação do Frete por conta do Destinatário)
- `2` - Por conta de terceiros
- `3` - Sem frete

### 5. Cálculo do ISSQN

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `inscricao_municipal` | VARCHAR(20) | Inscrição Municipal | - |
| `valor_total_servicos` | DECIMAL(12,2) | Valor total dos serviços | 0.00 |
| `base_calculo_issqn` | DECIMAL(12,2) | Base de cálculo do ISSQN | 0.00 |
| `valor_issqn` | DECIMAL(12,2) | Valor do ISSQN | 0.00 |

### 6. Dados Adicionais

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `info_tributos` | TEXT | Informações sobre tributos (IBPT) | "Total aproximado de tributos: R$ 2.264,40 (31,45%)..." |

---

## 📦 TABELA DE ITENS DA NOTA FISCAL

Foi criada uma tabela separada `notas_fiscais_itens` para armazenar os itens/produtos da nota fiscal.

### Estrutura da Tabela `notas_fiscais_itens`

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `id` | SERIAL | ID único do item | 1 |
| `nota_fiscal_id` | INTEGER | FK para notas_fiscais | 1 |
| `codigo_produto` | VARCHAR(100) | Código do produto | "CFOP5908" |
| `descricao` | TEXT | Descrição do produto/serviço | "Garfo Paleteiro 2500 kilos" |
| `ncm_sh` | VARCHAR(10) | NCM/SH do produto | "84313900" |
| `csosn` | VARCHAR(10) | CSOSN | "0400" |
| `cfop` | VARCHAR(10) | CFOP | "5.908" |
| `unidade` | VARCHAR(10) | Unidade de medida | "UN" |
| `quantidade` | DECIMAL(10,3) | Quantidade | 1.00 |
| `preco_unitario` | DECIMAL(12,2) | Preço unitário | 7200.00 |
| `preco_total` | DECIMAL(12,2) | Preço total | 7200.00 |
| `base_calculo_icms` | DECIMAL(12,2) | Base de cálculo do ICMS do item | 0.00 |
| `valor_icms` | DECIMAL(12,2) | Valor do ICMS do item | 0.00 |
| `valor_ipi` | DECIMAL(12,2) | Valor do IPI do item | 0.00 |
| `percentual_icms` | DECIMAL(5,4) | Percentual do ICMS | 0.0000 |
| `percentual_ipi` | DECIMAL(5,2) | Percentual do IPI | 0.00 |
| `ordem` | INTEGER | Ordem do item na nota | 1 |

### Exemplo de Item do DANFE

```
Código: CFOP5908
Descrição: Garfo Paleteiro 2500 kilos
NCM/SH: 84313900
CSOSN: 0400
CFOP: 5.908
UN: UN
Qtde: 1,00
Preço un: 7.200,00
Preço total: 7.200,00
BC ICMS: 0,00
Vlr.ICMS: 0,00
Vlr.IPI: 0,00
%ICMS: 0,0000
%IPI: 0,00
```

---

## 📁 ARQUIVOS CRIADOS

### 1. Migration: Campos Completos do DANFE
**Arquivo:** `backend-api/database/migrations/20250228_add_campos_completos_danfe.sql`

**Campos adicionados:**
- ✅ 20 novos campos na tabela `notas_fiscais`
- ✅ Índices para performance
- ✅ Comentários descritivos

### 2. Migration: Tabela de Itens
**Arquivo:** `backend-api/database/migrations/20250228_create_notas_fiscais_itens.sql`

**Funcionalidades:**
- ✅ Tabela `notas_fiscais_itens` criada
- ✅ Relacionamento com `notas_fiscais` (FK)
- ✅ Índices para busca rápida
- ✅ Trigger para atualizar `updated_at`

---

## 🔄 ATUALIZAÇÕES NO BACKEND

### Schema de Validação (Joi)
**Arquivo:** `backend-api/src/routes/notas-fiscais.js`

**Campos adicionados ao schema:**
```javascript
// Dados do Emitente/Destinatário
emitente_inscricao_estadual: Joi.string().max(20).optional(),
destinatario_inscricao_estadual: Joi.string().max(20).optional(),

// Dados da Nota
natureza_operacao: Joi.string().max(255).optional(),
protocolo_autorizacao: Joi.string().max(50).optional(),
data_saida: Joi.date().optional(),
hora_saida: Joi.string().optional(),

// Cálculo do Imposto
base_calculo_icms: Joi.number().min(0).optional(),
valor_icms: Joi.number().min(0).optional(),
// ... todos os outros campos de imposto

// Transportador
tipo_frete: Joi.string().max(50).optional(),

// ISSQN
inscricao_municipal: Joi.string().max(20).optional(),
valor_total_servicos: Joi.number().min(0).optional(),
base_calculo_issqn: Joi.number().min(0).optional(),
valor_issqn: Joi.number().min(0).optional(),

// Dados Adicionais
info_tributos: Joi.string().optional(),
```

---

## 📊 ESTRUTURA COMPLETA

### Tabela `notas_fiscais` - Campos Totais

**Campos Existentes:**
- `id`, `numero_nf`, `serie`, `data_emissao`, `data_vencimento`
- `valor_total`, `tipo`, `status`
- `cliente_id`, `fornecedor_id`, `venda_id`, `compra_id`
- `medicao_id`, `locacao_id`, `tipo_nota`
- `arquivo_nf`, `nome_arquivo`, `tamanho_arquivo`, `tipo_arquivo`
- `observacoes`, `created_at`, `updated_at`
- `eletronica`, `chave_acesso`

**Novos Campos Adicionados (20 campos):**
- `emitente_inscricao_estadual`
- `destinatario_inscricao_estadual`
- `natureza_operacao`
- `protocolo_autorizacao`
- `data_saida`
- `hora_saida`
- `base_calculo_icms`
- `valor_icms`
- `base_calculo_icms_st`
- `valor_icms_st`
- `valor_fcp_st`
- `valor_frete`
- `valor_seguro`
- `valor_desconto`
- `outras_despesas_acessorias`
- `valor_ipi`
- `tipo_frete`
- `inscricao_municipal`
- `valor_total_servicos`
- `base_calculo_issqn`
- `valor_issqn`
- `info_tributos`

### Tabela `notas_fiscais_itens` - Nova Tabela

**Campos (17 campos):**
- `id`, `nota_fiscal_id`
- `codigo_produto`, `descricao`, `ncm_sh`, `csosn`, `cfop`
- `unidade`, `quantidade`, `preco_unitario`, `preco_total`
- `base_calculo_icms`, `valor_icms`, `valor_ipi`
- `percentual_icms`, `percentual_ipi`
- `ordem`, `created_at`, `updated_at`

---

## 🎯 PRÓXIMOS PASSOS

### Prioridade ALTA 🔴

1. **Executar Migrations**
   ```sql
   -- Executar na ordem:
   1. 20250228_add_campos_completos_danfe.sql
   2. 20250228_create_notas_fiscais_itens.sql
   ```

2. **Atualizar Parser XML**
   - Extrair todos os novos campos do XML
   - Salvar automaticamente ao importar XML

3. **Criar Endpoints para Itens**
   - `GET /api/notas-fiscais/:id/itens` - Listar itens
   - `POST /api/notas-fiscais/:id/itens` - Adicionar item
   - `PUT /api/notas-fiscais/:id/itens/:itemId` - Atualizar item
   - `DELETE /api/notas-fiscais/:id/itens/:itemId` - Remover item

### Prioridade MÉDIA 🟡

4. **Atualizar Interface do Usuário**
   - Adicionar campos no formulário de criação/edição
   - Exibir todos os campos na visualização
   - Tabela de itens da nota fiscal

5. **Validações**
   - Validar formato de dados
   - Validar cálculos (soma de itens = valor total)
   - Validar CFOP e NCM

---

## ✅ CHECKLIST

- [x] Migration de campos do DANFE criada
- [x] Migration de tabela de itens criada
- [x] Schema de validação atualizado
- [ ] Migrations executadas no banco de dados
- [ ] Parser XML atualizado para extrair novos campos
- [ ] Endpoints de itens criados
- [ ] Interface do usuário atualizada
- [ ] Testes realizados

---

## 📌 NOTAS IMPORTANTES

1. **Compatibilidade:** Todos os campos novos são opcionais, mantendo compatibilidade com notas já cadastradas.

2. **Valores Padrão:** Campos numéricos de impostos têm valor padrão `0.00`.

3. **Itens:** Uma nota fiscal pode ter múltiplos itens. A tabela `notas_fiscais_itens` armazena cada item separadamente.

4. **Índices:** Foram criados índices para campos frequentemente consultados (natureza_operacao, protocolo_autorizacao, data_saida).

5. **Trigger:** A tabela de itens tem trigger automático para atualizar `updated_at`.

---

**Documento criado em:** 28/02/2025  
**Última atualização:** 28/02/2025

