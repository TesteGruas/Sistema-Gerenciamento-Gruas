# 📋 Atualização: Tipos de Nota Fiscal

**Data:** 28/02/2025  
**Objetivo:** Atualizar os tipos de nota fiscal para os novos valores solicitados

---

## ✅ ALTERAÇÕES IMPLEMENTADAS

### 1. Novos Tipos de Nota Fiscal

Os tipos de nota foram atualizados de:
- ❌ `locacao`, `circulacao_equipamentos`, `outros_equipamentos`, `medicao`, `fornecedor`

Para:
- ✅ **`nf_servico`** - NFs (Serviço)
- ✅ **`nf_locacao`** - NF Locação
- ✅ **`fatura`** - Fatura
- ✅ **`nfe_eletronica`** - NFe (Eletrônica)

### 2. Novos Campos Adicionados

#### Campo `eletronica` (BOOLEAN)
- Indica se a nota fiscal é eletrônica (NFe) ou não
- Valor padrão: `false`
- Automaticamente definido como `true` quando:
  - Arquivo XML é importado
  - `tipo_arquivo` é 'xml'
  - `arquivo_nf` contém extensão .xml

#### Campo `chave_acesso` (VARCHAR 44)
- Armazena a chave de acesso da NFe eletrônica
- 44 caracteres (formato padrão da Receita Federal)
- Extraído automaticamente do XML durante a importação
- Índice criado para busca rápida

---

## 📁 ARQUIVOS MODIFICADOS

### 1. Migration do Banco de Dados
**Arquivo:** `backend-api/database/migrations/20250228_atualizar_tipos_nota_fiscais.sql`

**Alterações:**
- ✅ Atualiza valores antigos para novos tipos
- ✅ Adiciona coluna `eletronica` (BOOLEAN)
- ✅ Adiciona coluna `chave_acesso` (VARCHAR 44)
- ✅ Cria índices para performance
- ✅ Atualiza comentários das colunas

**Mapeamento de Valores Antigos:**
```sql
'locacao' → 'nf_locacao'
'medicao' → 'nf_servico'
'fornecedor' → 'nf_servico'
'circulacao_equipamentos' → 'nf_servico'
'outros_equipamentos' → 'nf_servico'
```

### 2. Backend - Validação (Joi)
**Arquivo:** `backend-api/src/routes/notas-fiscais.js`

**Alterações:**
- ✅ Atualizado schema de validação para novos tipos
- ✅ Adicionado validação para `eletronica` (boolean)
- ✅ Adicionado validação para `chave_acesso` (string, max 44)
- ✅ Atualizada função `determinarTipoNota()` para retornar novos tipos
- ✅ Atualizado processamento de XML para salvar `eletronica` e `chave_acesso`

**Schema Atualizado:**
```javascript
tipo_nota: Joi.string().valid('nf_servico', 'nf_locacao', 'fatura', 'nfe_eletronica').optional(),
eletronica: Joi.boolean().optional(),
chave_acesso: Joi.string().max(44).optional(),
```

### 3. Frontend - TypeScript Types
**Arquivo:** `lib/api-notas-fiscais.ts`

**Alterações:**
- ✅ Atualizado interface `NotaFiscal` com novos tipos
- ✅ Atualizado interface `NotaFiscalCreate` com novos tipos
- ✅ Adicionado campos `eletronica` e `chave_acesso`

**Tipos Atualizados:**
```typescript
tipo_nota?: 'nf_servico' | 'nf_locacao' | 'fatura' | 'nfe_eletronica'
eletronica?: boolean
chave_acesso?: string
```

### 4. Frontend - Interface do Usuário
**Arquivo:** `app/dashboard/financeiro/notas-fiscais/page.tsx`

**Alterações:**
- ✅ Atualizada função `getTipoNotaLabel()` com novos tipos
- ✅ Atualizado Select de tipo de nota no formulário
- ✅ Atualizado filtro de tipo de nota
- ✅ Mantida compatibilidade com valores antigos (para exibição)
- ✅ Atualizado valores padrão no formulário

**Novos Labels:**
- `nf_servico` → "NFs (Serviço)"
- `nf_locacao` → "NF Locação"
- `fatura` → "Fatura"
- `nfe_eletronica` → "NFe (Eletrônica)"

---

## 🔄 COMPATIBILIDADE

### Valores Antigos
O sistema mantém compatibilidade com valores antigos para exibição:
- `locacao` → exibido como "NF Locação"
- `medicao` → exibido como "NFs (Serviço)"
- `fornecedor` → exibido como "NFs (Serviço)"
- `circulacao_equipamentos` → exibido como "NFs (Serviço)"
- `outros_equipamentos` → exibido como "NFs (Serviço)"

### Migração Automática
A migration atualiza automaticamente os valores antigos no banco de dados para os novos tipos.

---

## 📊 ESTRUTURA DA TABELA

### Colunas Adicionadas/Atualizadas

```sql
-- Coluna tipo_nota (atualizada)
tipo_nota VARCHAR(50)
-- Valores: 'nf_servico', 'nf_locacao', 'fatura', 'nfe_eletronica'

-- Nova coluna eletronica
eletronica BOOLEAN DEFAULT false
-- Indica se é nota fiscal eletrônica

-- Nova coluna chave_acesso
chave_acesso VARCHAR(44)
-- Chave de acesso da NFe (44 caracteres)
```

### Índices Criados

```sql
CREATE INDEX idx_notas_fiscais_tipo_nota ON notas_fiscais(tipo_nota);
CREATE INDEX idx_notas_fiscais_eletronica ON notas_fiscais(eletronica);
CREATE INDEX idx_notas_fiscais_chave_acesso ON notas_fiscais(chave_acesso);
```

---

## 🎯 FUNCIONALIDADES

### 1. Importação de XML
- ✅ Automaticamente marca como `eletronica = true`
- ✅ Extrai e salva `chave_acesso` do XML
- ✅ Determina `tipo_nota` baseado em CFOP e natureza da operação
- ✅ Se não conseguir determinar, usa `nfe_eletronica` como padrão

### 2. Criação Manual
- ✅ Usuário pode selecionar entre os 4 tipos de nota
- ✅ Campo `eletronica` pode ser definido manualmente (futuro)
- ✅ Campo `chave_acesso` pode ser preenchido manualmente

### 3. Filtros
- ✅ Filtro por tipo de nota atualizado com novos valores
- ✅ Compatível com valores antigos (para notas já cadastradas)

---

## 📝 PRÓXIMOS PASSOS SUGERIDOS

### Prioridade ALTA 🔴
1. **Executar Migration**
   - Executar `20250228_atualizar_tipos_nota_fiscais.sql` no banco de dados
   - Verificar se os valores antigos foram migrados corretamente

2. **Testar Importação XML**
   - Testar importação de XML e verificar se `eletronica` e `chave_acesso` são salvos
   - Verificar se `tipo_nota` é determinado corretamente

### Prioridade MÉDIA 🟡
3. **Interface para Campo Eletrônica**
   - Adicionar checkbox "Nota Fiscal Eletrônica" no formulário
   - Quando marcado, habilitar campo `chave_acesso`

4. **Validação de Chave de Acesso**
   - Validar formato da chave de acesso (44 caracteres numéricos)
   - Validar dígito verificador (se necessário)

5. **Relatórios**
   - Adicionar filtro por "Eletrônica" / "Não Eletrônica"
   - Relatório de notas fiscais eletrônicas

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [x] Migration criada
- [x] Schema de validação atualizado (Joi)
- [x] Tipos TypeScript atualizados
- [x] Interface do usuário atualizada
- [x] Função `determinarTipoNota()` atualizada
- [x] Processamento de XML atualizado
- [x] Compatibilidade com valores antigos mantida
- [ ] Migration executada no banco de dados
- [ ] Testes de importação XML realizados
- [ ] Testes de criação manual realizados

---

## 📌 NOTAS IMPORTANTES

1. **Migração de Dados:** A migration atualiza automaticamente os valores antigos, mas é recomendado verificar após a execução.

2. **Compatibilidade:** O sistema mantém compatibilidade com valores antigos apenas para exibição. Novos registros devem usar os novos tipos.

3. **NFe Eletrônica:** Quando um XML é importado, o sistema automaticamente:
   - Marca como `eletronica = true`
   - Define `tipo_nota = 'nfe_eletronica'` (se não conseguir determinar outro tipo)
   - Extrai e salva a `chave_acesso`

4. **Valores Padrão:** 
   - Notas de saída: `nf_locacao`
   - Notas de entrada: `nf_servico`

---

**Documento criado em:** 28/02/2025  
**Última atualização:** 28/02/2025

