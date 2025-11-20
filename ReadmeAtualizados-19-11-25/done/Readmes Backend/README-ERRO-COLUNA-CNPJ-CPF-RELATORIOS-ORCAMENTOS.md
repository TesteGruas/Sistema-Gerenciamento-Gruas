# Erro: Coluna `cnpj_cpf` não existe na tabela `clientes`

## 📋 Resumo

Várias rotas estão tentando buscar uma coluna `cnpj_cpf` que não existe na tabela `clientes`. A tabela possui as colunas `cnpj` e `cpf` separadas. Este erro está impactando:

1. **Geração de PDF de orçamentos** - `/api/relatorios/orcamentos/:id/pdf`
2. **Listagem de orçamentos** - `/api/orcamentos` (quando filtrado por obra_id)
3. **Geração de PDF de medições** - `/api/relatorios/medicoes/:orcamento_id/pdf`

## 🔍 Problema Identificado

### Erro 1: Geração de PDF de Orçamentos

**Endpoint:** `GET /api/relatorios/orcamentos/:id/pdf`

**Erro:**
```json
{
    "success": false,
    "error": "Orçamento não encontrado",
    "message": "column clientes_1.cnpj_cpf does not exist"
}
```

**Arquivo:** `backend-api/src/routes/relatorios-orcamentos.js`

### Erro 2: Listagem de Orçamentos por Obra

**Endpoint:** `GET /api/orcamentos?page=1&limit=100&obra_id=76`

**Erro:**
```json
{
    "success": false,
    "message": "Erro interno do servidor",
    "error": "column clientes_1.cnpj_cpf does not exist"
}
```

**Impacto:** 
- Página de detalhes da obra (`/dashboard/obras/:id`) não consegue carregar orçamentos relacionados
- Listagem de orçamentos filtrada por obra falha

**Arquivo:** `backend-api/src/routes/orcamentos.js` (linha 362)

### Erro 3: Geração de PDF de Medições

**Endpoint:** `GET /api/relatorios/medicoes/:orcamento_id/pdf`

**Arquivo:** `backend-api/src/routes/relatorios-medicoes.js` (linha 51)

**Status:** Provavelmente com o mesmo erro

## 🔎 Análise do Problema

### Estrutura da Tabela `clientes`

A tabela `clientes` possui as seguintes colunas relacionadas a documentos:
- `cnpj` (VARCHAR(18)) - CNPJ do cliente
- `cpf` (VARCHAR(14)) - CPF do cliente (para pessoa física)

**Não existe** uma coluna `cnpj_cpf` na tabela.

### Código Problemático

**1. Linha 50 do arquivo `relatorios-orcamentos.js`:**
```javascript
clientes:cliente_id (
  id,
  nome,
  cnpj_cpf,  // ❌ Esta coluna não existe
  endereco,
  bairro,
  cidade,
  estado,
  cep,
  telefone,
  email,
  contato
)
```

**2. Linha 130 do arquivo `relatorios-orcamentos.js`:**
```javascript
doc.text(`CNPJ/CPF: ${cliente.cnpj_cpf || '-'}`, 40, yPos);
```

**3. Linha 362 do arquivo `orcamentos.js`:**
```javascript
clientes:cliente_id (
  id,
  nome,
  email,
  telefone,
  cnpj_cpf,  // ❌ Esta coluna não existe
  endereco
)
```

**4. Linha 51 do arquivo `relatorios-medicoes.js`:**
```javascript
clientes:cliente_id (
  id,
  nome,
  cnpj_cpf  // ❌ Esta coluna não existe
)
```

## ✅ Solução

### Opção 1: Buscar ambas as colunas e concatenar (Recomendado)

Modificar a query para buscar `cnpj` e `cpf` separadamente e usar COALESCE ou concatenação:

**Arquivo:** `backend-api/src/routes/relatorios-orcamentos.js`

**Linha 47-59 - Corrigir o SELECT:**
```javascript
clientes:cliente_id (
  id,
  nome,
  cnpj,      // ✅ Buscar cnpj
  cpf,       // ✅ Buscar cpf
  endereco,
  bairro,
  cidade,
  estado,
  cep,
  telefone,
  email,
  contato
)
```

**Linha 130 - Corrigir o uso no PDF:**
```javascript
// Antes:
doc.text(`CNPJ/CPF: ${cliente.cnpj_cpf || '-'}`, 40, yPos);

// Depois:
const documento = cliente.cnpj || cliente.cpf || '-';
doc.text(`CNPJ/CPF: ${documento}`, 40, yPos);
```

### Opção 2: Usar COALESCE na query SQL (Alternativa)

Se o Supabase suportar, usar COALESCE diretamente na query:

```javascript
clientes:cliente_id (
  id,
  nome,
  documento:coalesce(cnpj, cpf),  // Tentar cnpj primeiro, depois cpf
  endereco,
  bairro,
  cidade,
  estado,
  cep,
  telefone,
  email,
  contato
)
```

**Nota:** Esta sintaxe pode não funcionar diretamente no Supabase. A Opção 1 é mais segura.

## 🔧 Correção Completa

### 1. Atualizar a Query de Seleção

```javascript
// Buscar orçamento completo com todos os relacionamentos
const { data: orcamento, error: orcamentoError } = await supabaseAdmin
  .from('orcamentos')
  .select(`
    *,
    clientes:cliente_id (
      id,
      nome,
      cnpj,
      cpf,
      endereco,
      bairro,
      cidade,
      estado,
      cep,
      telefone,
      email,
      contato
    ),
    funcionarios:vendedor_id (
      id,
      nome,
      email
    )
  `)
  .eq('id', id)
  .single();
```

### 2. Atualizar o Uso no PDF

```javascript
// Linha ~130 - Dados do Cliente
const cliente = orcamento.clientes || {};
doc.text(`Nome: ${cliente.nome || '-'}`, 40, yPos);
yPos += 12;

// Usar cnpj ou cpf, priorizando cnpj
const documento = cliente.cnpj || cliente.cpf || '-';
doc.text(`CNPJ/CPF: ${documento}`, 40, yPos);
yPos += 12;
```

## 📝 Rotas Afetadas

### Rotas com erro confirmado:

1. **`backend-api/src/routes/relatorios-orcamentos.js`** ⚠️ **CRÍTICO**
   - **Endpoint:** `GET /api/relatorios/orcamentos/:id/pdf`
   - **Linha 50:** Query SELECT usa `cnpj_cpf`
   - **Linha 130:** Uso no PDF `cliente.cnpj_cpf`
   - **Impacto:** Geração de PDF de orçamentos falha
   - **Status:** ✅ Erro confirmado

2. **`backend-api/src/routes/orcamentos.js`** ⚠️ **CRÍTICO**
   - **Endpoint:** `GET /api/orcamentos` (com filtro `obra_id`)
   - **Linha 362:** Query SELECT usa `cnpj_cpf`
   - **Impacto:** 
     - Página de detalhes da obra não carrega orçamentos
     - Listagem de orçamentos filtrada por obra falha
     - Frontend: `http://localhost:3000/dashboard/obras/:id`
   - **Status:** ✅ Erro confirmado

3. **`backend-api/src/routes/relatorios-medicoes.js`** ⚠️ **CRÍTICO**
   - **Endpoint:** `GET /api/relatorios/medicoes/:orcamento_id/pdf`
   - **Linha 51:** Query SELECT usa `cnpj_cpf`
   - **Linha 125:** Uso no PDF `orcamento.clientes?.cnpj_cpf`
   - **Impacto:** Geração de PDF de medições falha
   - **Status:** ⚠️ Provavelmente com o mesmo erro

### Rotas para verificar:

4. **`backend-api/src/routes/orcamentos.js`** (outras linhas)
   - Linha 525, 578, 1604, 1660
   - Verificar se usa `cnpj_cpf` ou `cnpj`/`cpf` separados
   - **Status:** ⚠️ Verificar

5. **`backend-api/src/routes/medicoes-mensais.js`**
   - Linha 45, 114
   - Verificar uso de `cnpj_cpf`
   - **Status:** ⚠️ Verificar

## 🧪 Testes Recomendados

Após a correção, testar:

### Testes de PDF de Orçamentos:
1. ✅ Gerar PDF de orçamento com cliente que tem apenas CNPJ
2. ✅ Gerar PDF de orçamento com cliente que tem apenas CPF
3. ✅ Gerar PDF de orçamento com cliente que tem ambos
4. ✅ Gerar PDF de orçamento com cliente sem documento
5. ✅ Verificar se o PDF exibe corretamente o documento

### Testes de Listagem de Orçamentos:
6. ✅ Acessar página de detalhes da obra (`/dashboard/obras/:id`)
7. ✅ Verificar se os orçamentos relacionados são carregados
8. ✅ Testar filtro de orçamentos por obra_id na API
9. ✅ Verificar se o CNPJ/CPF aparece corretamente na listagem

### Testes de PDF de Medições:
10. ✅ Gerar PDF de medições com cliente que tem apenas CNPJ
11. ✅ Gerar PDF de medições com cliente que tem apenas CPF
12. ✅ Verificar se o PDF exibe corretamente o documento do cliente

## 📚 Referências

- **Arquivos afetados:**
  - `backend-api/src/routes/relatorios-orcamentos.js` (linha 50, 130)
  - `backend-api/src/routes/orcamentos.js` (linha 362)
  - `backend-api/src/routes/relatorios-medicoes.js` (linha 51, 125)
- **Schema da tabela:** `backend-api/database/schema.sql` (linha 42-55)
- **Endpoints afetados:**
  - `GET /api/relatorios/orcamentos/:id/pdf`
  - `GET /api/orcamentos?obra_id=:id`
  - `GET /api/relatorios/medicoes/:orcamento_id/pdf`
- **Frontend impactado:**
  - `/dashboard/obras/:id` - Página de detalhes da obra

## ⚠️ Observações Importantes

1. **Compatibilidade:** A solução deve funcionar tanto para clientes pessoa jurídica (CNPJ) quanto pessoa física (CPF).

2. **Formatação:** Se necessário, aplicar formatação ao documento antes de exibir no PDF (ex: `12.345.678/0001-90` para CNPJ).

3. **Validação:** Considerar adicionar validação para garantir que pelo menos um documento (CNPJ ou CPF) exista, se necessário para o negócio.

4. **Consistência:** Verificar e corrigir todas as rotas que usam `cnpj_cpf` para manter consistência no código.

## 🚀 Como Aplicar

### Correção 1: `relatorios-orcamentos.js` ⚠️ CRÍTICO

1. Abrir o arquivo `backend-api/src/routes/relatorios-orcamentos.js`
2. **Linha 50:** Substituir `cnpj_cpf` por `cnpj, cpf` na query SELECT
3. **Linha 130:** Atualizar para usar `cliente.cnpj || cliente.cpf`
4. Testar a geração de PDF: `GET /api/relatorios/orcamentos/:id/pdf`

### Correção 2: `orcamentos.js` ⚠️ CRÍTICO (IMPACTA FRONTEND)

1. Abrir o arquivo `backend-api/src/routes/orcamentos.js`
2. **Linha 362:** Substituir `cnpj_cpf` por `cnpj, cpf` na query SELECT
   ```javascript
   // Antes:
   cnpj_cpf,
   
   // Depois:
   cnpj,
   cpf,
   ```
3. **Verificar outras ocorrências:** Linhas 525, 578, 1604, 1660
4. **Atualizar uso nos dados retornados:** Se houver referência a `cnpj_cpf` no código, usar `cnpj || cpf`
5. Testar:
   - API: `GET /api/orcamentos?obra_id=76`
   - Frontend: `http://localhost:3000/dashboard/obras/76`

### Correção 3: `relatorios-medicoes.js` ⚠️ CRÍTICO

1. Abrir o arquivo `backend-api/src/routes/relatorios-medicoes.js`
2. **Linha 51:** Substituir `cnpj_cpf` por `cnpj, cpf` na query SELECT
3. **Linha 125:** Atualizar para usar `orcamento.clientes?.cnpj || orcamento.clientes?.cpf`
4. Testar a geração de PDF: `GET /api/relatorios/medicoes/:orcamento_id/pdf`

### Verificação de Outras Rotas

5. Verificar `backend-api/src/routes/medicoes-mensais.js` (linhas 45, 114)
6. Verificar outras ocorrências em `backend-api/src/routes/orcamentos.js`
7. Aplicar correções similares se necessário
8. Testar todas as rotas afetadas

## 📅 Data do Problema

**Data identificada:** 2025-02-20

**Status:** ⚠️ Pendente de correção

