# 📋 Campos Completos de NFS-e (Nota Fiscal de Serviço Eletrônica)

**Data:** 28/02/2025  
**Objetivo:** Adicionar todos os campos necessários para armazenar dados completos de uma Nota Fiscal de Serviço Eletrônica (NFS-e)

---

## 📄 EXEMPLO ANALISADO

**NFS-e:** 517  
**Código de Verificação:** G2HXAXA28  
**Data de Emissão:** 12/12/2025 09:55  
**Prestador:** IRBANA COPAS SERVICOS DE MANUTENCAO E MONTAGEM LTDA  
**Tomador:** M Zacaro Empreendimentos Imobiliários Spe LTDA

---

## ✅ CAMPOS ADICIONADOS

### 1. Dados do Prestador de Serviço

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `prestador_inscricao_municipal` | VARCHAR(20) | Inscrição Municipal do prestador | 35430 |
| `prestador_email` | VARCHAR(255) | Email do prestador | VERGILIORODRIGUES@UOL.COM.BR |
| `prestador_telefone` | VARCHAR(20) | Telefone do prestador | 111135997571 |

**Nota:** Os dados básicos do prestador (CNPJ, Nome, Endereço) já estão vinculados via `fornecedor_id`.

### 2. Dados do Tomador de Serviço

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `tomador_inscricao_municipal` | VARCHAR(20) | Inscrição Municipal do tomador | - |
| `tomador_nif` | VARCHAR(50) | NIF (Número de Identificação Fiscal) | - |
| `tomador_email` | VARCHAR(255) | Email do tomador | charles.silva@mint.com.br |
| `tomador_telefone` | VARCHAR(20) | Telefone do tomador | (11)4552-2927 |

**Nota:** Os dados básicos do tomador (CNPJ, Nome, Endereço) já estão vinculados via `cliente_id`.

### 3. Dados da NFS-e

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `codigo_verificacao` | VARCHAR(20) | Código de verificação da NFS-e | G2HXAXA28 |
| `rps_numero` | VARCHAR(20) | Número do RPS (Recibo Provisório de Serviços) | - |
| `rps_serie` | VARCHAR(10) | Série do RPS | - |
| `rps_tipo` | VARCHAR(10) | Tipo do RPS | - |
| `nfse_substituida` | VARCHAR(20) | Número da NFS-e substituída (se houver) | - |

### 4. Atividade Econômica

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `atividade_economica_codigo` | VARCHAR(20) | Código da atividade econômica | 7.02 / 439910400 |
| `atividade_economica_descricao` | TEXT | Descrição da atividade econômica | "SERVIÇOS DE OPERAÇÃO E FORNECIMENTO DE EQUIPAMENTOS PARA TRANSPORTE E ELEVAÇÃO DE CARGAS E PESSOAS" |

### 5. Discriminação do Serviço

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `discriminacao_servico` | TEXT | Discriminação detalhada do serviço prestado | "Serviço de operador de grua correspondente ao período 24/09/25 a 23/10/25 no valor de R$2.500,00..." |
| `codigo_obra` | VARCHAR(50) | Código da Obra (CNO) | 90.010.52838/74 |
| `obra_endereco` | TEXT | Endereço completo da obra | "Av Lourenco Zacaro, 25 Jardim São Silvestre - Barueri/SP" |

### 6. Tributos Federais

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `valor_pis` | DECIMAL(12,2) | Valor do PIS | 0.00 |
| `valor_cofins` | DECIMAL(12,2) | Valor do COFINS | 0.00 |
| `valor_inss` | DECIMAL(12,2) | Valor do INSS | 550.00 |
| `valor_ir` | DECIMAL(12,2) | Valor do IR (Imposto de Renda) | 0.00 |
| `valor_csll` | DECIMAL(12,2) | Valor do CSLL | 0.00 |
| `percentual_tributos_federais` | DECIMAL(5,2) | Percentual aproximado de tributos federais | 0.00% |
| `percentual_tributos_estaduais` | DECIMAL(5,2) | Percentual aproximado de tributos estaduais | 0.00% |
| `percentual_tributos_municipais` | DECIMAL(5,2) | Percentual aproximado de tributos municipais | 0.00% |

### 7. Identificação Prestação de Serviços

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `codigo_obra` | VARCHAR(50) | Código da Obra | 11394 |
| `codigo_art` | VARCHAR(50) | Código A.R.T. (Anotação de Responsabilidade Técnica) | - |
| `exigibilidade_issqn` | VARCHAR(50) | Exigibilidade ISSQN | "1-Exigível" |
| `regime_especial_tributacao` | VARCHAR(50) | Regime Especial de Tributação | "0-Nenhum" |
| `simples_nacional` | BOOLEAN | Indica se o prestador está no Simples Nacional | true |
| `incentivador_fiscal` | BOOLEAN | Indica se é incentivador fiscal | false |
| `competencia` | VARCHAR(7) | Competência da NFS-e (formato MM/AAAA) | 12/2025 |
| `municipio_prestacao` | VARCHAR(255) | Município onde o serviço foi prestado | "BARUERI - SP" |
| `municipio_incidencia` | VARCHAR(255) | Município de incidência do ISSQN | "BARUERI - SP" |
| `issqn_reter` | BOOLEAN | Indica se há ISSQN a reter | true |

### 8. Detalhamento de Valores

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `valor_servico` | DECIMAL(12,2) | Valor do serviço prestado | 5000.00 |
| `desconto_incondicionado` | DECIMAL(12,2) | Desconto incondicionado | 0.00 |
| `desconto_condicionado` | DECIMAL(12,2) | Desconto condicionado | 0.00 |
| `retencoes_federais` | DECIMAL(12,2) | Valor total das retenções federais | 550.00 |
| `outras_retencoes` | DECIMAL(12,2) | Outras retenções além das federais | 0.00 |
| `deducoes_previstas_lei` | DECIMAL(12,2) | Deduções previstas em lei | 0.00 |
| `aliquota_issqn` | DECIMAL(5,2) | Alíquota do ISSQN (percentual) | 5.00 |
| `valor_liquido` | DECIMAL(12,2) | Valor líquido após descontos e retenções | 4200.00 |

**Cálculo do Valor Líquido:**
```
Valor Líquido = Valor do Serviço 
              - Desconto Incondicionado 
              - Desconto Condicionado 
              - Retenções Federais 
              - Outras Retenções 
              - Deduções Previstas em Lei
```

**Exemplo:**
```
5.000,00 (Valor do Serviço)
- 0,00 (Desconto Incondicionado)
- 0,00 (Desconto Condicionado)
- 550,00 (Retenções Federais)
- 0,00 (Outras Retenções)
- 0,00 (Deduções Previstas em Lei)
= 4.200,00 (Valor Líquido)
```

---

## 📁 ARQUIVO CRIADO

### Migration: Campos de NFS-e
**Arquivo:** `backend-api/database/migrations/20250228_add_campos_nfse.sql`

**Campos adicionados:**
- ✅ 42 novos campos na tabela `notas_fiscais`
- ✅ Índices para performance
- ✅ Comentários descritivos

**Campos por categoria:**
- Dados do Prestador: 3 campos
- Dados do Tomador: 4 campos
- Dados da NFS-e: 5 campos
- Atividade Econômica: 2 campos
- Discriminação do Serviço: 3 campos
- Tributos Federais: 8 campos
- Identificação Prestação: 10 campos
- Detalhamento de Valores: 7 campos

---

## 🔄 ATUALIZAÇÕES NO BACKEND

### Schema de Validação (Joi)
**Arquivo:** `backend-api/src/routes/notas-fiscais.js`

**Campos adicionados ao schema:**
```javascript
// Dados do Prestador
prestador_inscricao_municipal: Joi.string().max(20).optional(),
prestador_email: Joi.string().email().max(255).optional(),
prestador_telefone: Joi.string().max(20).optional(),

// Dados do Tomador
tomador_inscricao_municipal: Joi.string().max(20).optional(),
tomador_nif: Joi.string().max(50).optional(),
tomador_email: Joi.string().email().max(255).optional(),
tomador_telefone: Joi.string().max(20).optional(),

// Dados da NFS-e
codigo_verificacao: Joi.string().max(20).optional(),
rps_numero: Joi.string().max(20).optional(),
rps_serie: Joi.string().max(10).optional(),
rps_tipo: Joi.string().max(10).optional(),
nfse_substituida: Joi.string().max(20).optional(),

// Atividade Econômica
atividade_economica_codigo: Joi.string().max(20).optional(),
atividade_economica_descricao: Joi.string().optional(),

// Discriminação do Serviço
discriminacao_servico: Joi.string().optional(),
codigo_obra: Joi.string().max(50).optional(),
obra_endereco: Joi.string().optional(),

// Tributos Federais
valor_pis: Joi.number().min(0).optional(),
valor_cofins: Joi.number().min(0).optional(),
valor_inss: Joi.number().min(0).optional(),
valor_ir: Joi.number().min(0).optional(),
valor_csll: Joi.number().min(0).optional(),
percentual_tributos_federais: Joi.number().min(0).max(100).optional(),
percentual_tributos_estaduais: Joi.number().min(0).max(100).optional(),
percentual_tributos_municipais: Joi.number().min(0).max(100).optional(),

// Identificação Prestação de Serviços
codigo_art: Joi.string().max(50).optional(),
exigibilidade_issqn: Joi.string().max(50).optional(),
regime_especial_tributacao: Joi.string().max(50).optional(),
simples_nacional: Joi.boolean().optional(),
incentivador_fiscal: Joi.boolean().optional(),
competencia: Joi.string().max(7).optional(),
municipio_prestacao: Joi.string().max(255).optional(),
municipio_incidencia: Joi.string().max(255).optional(),
issqn_reter: Joi.boolean().optional(),

// Detalhamento de Valores
valor_servico: Joi.number().min(0).optional(),
desconto_incondicionado: Joi.number().min(0).optional(),
desconto_condicionado: Joi.number().min(0).optional(),
retencoes_federais: Joi.number().min(0).optional(),
outras_retencoes: Joi.number().min(0).optional(),
deducoes_previstas_lei: Joi.number().min(0).optional(),
aliquota_issqn: Joi.number().min(0).max(100).optional(),
valor_liquido: Joi.number().min(0).optional()
```

---

## 📊 ESTRUTURA COMPLETA

### Tabela `notas_fiscais` - Campos de NFS-e

**Total de campos NFS-e adicionados: 42 campos**

**Categorias:**
1. **Dados do Prestador** (3 campos)
2. **Dados do Tomador** (4 campos)
3. **Dados da NFS-e** (5 campos)
4. **Atividade Econômica** (2 campos)
5. **Discriminação do Serviço** (3 campos)
6. **Tributos Federais** (8 campos)
7. **Identificação Prestação** (10 campos)
8. **Detalhamento de Valores** (7 campos)

---

## 🎯 PRÓXIMOS PASSOS

### Prioridade ALTA 🔴

1. **Executar Migration**
   ```sql
   -- Executar:
   20250228_add_campos_nfse.sql
   ```

2. **Atualizar Parser XML (se houver)**
   - Extrair todos os campos da NFS-e do XML
   - Salvar automaticamente ao importar XML

3. **Criar Interface de Preenchimento**
   - Formulário completo para NFS-e
   - Validações específicas
   - Cálculo automático de valores

### Prioridade MÉDIA 🟡

4. **Validações Específicas**
   - Validar formato de código de verificação
   - Validar competência (MM/AAAA)
   - Validar cálculos (valor líquido)
   - Validar alíquota ISSQN

5. **Relatórios**
   - Relatório de NFS-e por competência
   - Relatório de retenções federais
   - Relatório de ISSQN

---

## ✅ CHECKLIST

- [x] Migration de campos NFS-e criada
- [x] Schema de validação atualizado
- [ ] Migration executada no banco de dados
- [ ] Parser XML atualizado (se aplicável)
- [ ] Interface do usuário atualizada
- [ ] Validações específicas implementadas
- [ ] Testes realizados

---

## 📌 NOTAS IMPORTANTES

1. **Compatibilidade:** Todos os campos novos são opcionais, mantendo compatibilidade com notas já cadastradas.

2. **Valores Padrão:** Campos numéricos de tributos têm valor padrão `0.00`. Campos booleanos têm valor padrão `false`.

3. **Cálculos:** O sistema pode calcular automaticamente:
   - Valor Líquido = Valor Serviço - Descontos - Retenções - Deduções
   - Retenções Federais = PIS + COFINS + INSS + IR + CSLL

4. **Índices:** Foram criados índices para campos frequentemente consultados:
   - `codigo_verificacao`
   - `rps_numero`
   - `codigo_obra`
   - `competencia`
   - `municipio_prestacao`

5. **Relação com Campos Existentes:**
   - `valor_total` pode ser igual a `valor_servico` para NFS-e
   - `valor_issqn` já existe na tabela (campo do DANFE)
   - `base_calculo_issqn` já existe na tabela (campo do DANFE)

---

## 🔗 RELAÇÃO COM CAMPOS DO DANFE

Alguns campos são compartilhados entre DANFE e NFS-e:

| Campo | Uso em DANFE | Uso em NFS-e |
|-------|--------------|--------------|
| `inscricao_municipal` | ✅ | ✅ (Prestador) |
| `valor_total_servicos` | ✅ | ✅ |
| `base_calculo_issqn` | ✅ | ✅ |
| `valor_issqn` | ✅ | ✅ |
| `aliquota_issqn` | ❌ | ✅ |

**Nota:** A tabela `notas_fiscais` suporta tanto NFe (DANFE) quanto NFS-e, usando os campos apropriados conforme o tipo.

---

**Documento criado em:** 28/02/2025  
**Última atualização:** 28/02/2025

