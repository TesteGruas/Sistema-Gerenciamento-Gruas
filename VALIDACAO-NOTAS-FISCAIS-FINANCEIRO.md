# ✅ Validação: Sistema de Notas Fiscais no Módulo Financeiro

**Data:** 28/02/2025  
**Módulo:** Financeiro → Notas Fiscais  
**Status:** ✅ Funcionalidades Implementadas | ⚠️ Integrações Pendentes

---

## 📋 RESUMO EXECUTIVO

O sistema de notas fiscais está **funcionalmente completo** para:
- ✅ Adicionar/Validar notas de fornecedores
- ✅ Notas de entrada
- ✅ Integração de XML de notas
- ⚠️ Notas a receber (existe, mas falta integração com contas a receber)

---

## ✅ 1. ADICIONAR / VALIDAR NOTAS DE FORNECEDORES

### Status: ✅ IMPLEMENTADO

### Funcionalidades Disponíveis:

#### 1.1. Criação Manual de Notas de Entrada
- **Localização:** `/dashboard/financeiro/notas-fiscais` → Tab "Notas Fiscais de Entrada"
- **Funcionalidades:**
  - ✅ Criar nota fiscal de entrada manualmente
  - ✅ Vincular com fornecedor (obrigatório)
  - ✅ Vincular com compra (opcional)
  - ✅ Campos: número NF, série, data emissão, data vencimento, valor total
  - ✅ Status: pendente, paga, vencida, cancelada
  - ✅ Upload de arquivo PDF/XML
  - ✅ Observações

#### 1.2. Validação de Dados
- **Backend:** `backend-api/src/routes/notas-fiscais.js`
- **Schema de Validação (Joi):**
  ```javascript
  numero_nf: Joi.string().min(1).max(50).required()
  serie: Joi.string().max(10).optional()
  data_emissao: Joi.date().required()
  data_vencimento: Joi.date().optional()
  valor_total: Joi.number().min(0).required()
  tipo: Joi.string().valid('entrada', 'saida').required()
  status: Joi.string().valid('pendente', 'paga', 'vencida', 'cancelada')
  fornecedor_id: Joi.number().integer().positive().optional()
  compra_id: Joi.number().integer().positive().optional()
  ```

#### 1.3. Interface de Usuário
- **Arquivo:** `app/dashboard/financeiro/notas-fiscais/page.tsx`
- **Recursos:**
  - ✅ Formulário completo de criação
  - ✅ Seleção de fornecedor (dropdown)
  - ✅ Seleção de compra vinculada (opcional)
  - ✅ Validação de campos obrigatórios
  - ✅ Feedback visual de erros
  - ✅ Upload de arquivo com validação (PDF/XML, máx 10MB)

#### 1.4. Listagem e Filtros
- ✅ Lista todas as notas de entrada
- ✅ Filtro por status (pendente, paga, vencida, cancelada)
- ✅ Busca por número, série, fornecedor
- ✅ Paginação (20 itens por página)
- ✅ Visualização de fornecedor vinculado
- ✅ Visualização de compra vinculada

#### 1.5. Ações Disponíveis
- ✅ Visualizar detalhes completos
- ✅ Editar nota fiscal
- ✅ Excluir nota fiscal (com confirmação)
- ✅ Upload de arquivo (PDF/XML)
- ✅ Download de arquivo anexado

---

## ✅ 2. NOTAS DE ENTRADA

### Status: ✅ IMPLEMENTADO

### Estrutura de Dados:

#### 2.1. Tabela `notas_fiscais`
```sql
- id (PK)
- numero_nf (VARCHAR, obrigatório)
- serie (VARCHAR, opcional)
- data_emissao (DATE, obrigatório)
- data_vencimento (DATE, opcional)
- valor_total (DECIMAL, obrigatório)
- tipo (VARCHAR: 'entrada' | 'saida', obrigatório)
- status (VARCHAR: 'pendente' | 'paga' | 'vencida' | 'cancelada')
- fornecedor_id (FK → fornecedores.id)
- compra_id (FK → compras.id)
- tipo_nota (VARCHAR: 'fornecedor')
- arquivo_nf (TEXT, URL do arquivo)
- nome_arquivo (VARCHAR)
- tamanho_arquivo (INTEGER)
- tipo_arquivo (VARCHAR: 'pdf' | 'xml' | 'imagem')
- observacoes (TEXT)
- created_at, updated_at
```

#### 2.2. Relacionamentos
- ✅ `fornecedores` (FK) - Fornecedor da nota
- ✅ `compras` (FK) - Compra vinculada (opcional)

#### 2.3. Endpoints API
- ✅ `GET /api/notas-fiscais` - Listar todas (com filtro `tipo=entrada`)
- ✅ `GET /api/notas-fiscais/:id` - Buscar por ID
- ✅ `POST /api/notas-fiscais` - Criar nova
- ✅ `PUT /api/notas-fiscais/:id` - Atualizar
- ✅ `DELETE /api/notas-fiscais/:id` - Excluir
- ✅ `POST /api/notas-fiscais/:id/upload` - Upload de arquivo
- ✅ `GET /api/notas-fiscais/:id/download` - Download de arquivo

---

## ✅ 3. VALIDAR INTEGRAÇÃO DE XML DE NOTAS

### Status: ✅ IMPLEMENTADO E FUNCIONAL

### Funcionalidades de Importação XML:

#### 3.1. Endpoint de Importação
- **Rota:** `POST /api/notas-fiscais/importar-xml`
- **Método:** Upload de arquivo XML (multipart/form-data)
- **Validações:**
  - ✅ Tipo de arquivo: XML apenas
  - ✅ Tamanho máximo: 10MB
  - ✅ Validação de estrutura XML (NFe)

#### 3.2. Parser XML (NFe)
- **Biblioteca:** `fast-xml-parser`
- **Arquivo:** `backend-api/src/routes/notas-fiscais.js` (linhas 1029-1141)
- **Dados Extraídos:**
  - ✅ Número da NF (`nNF`)
  - ✅ Série (`serie`)
  - ✅ Data de emissão (`dhEmi`)
  - ✅ Data de saída/entrada (`dhSaiEnt`)
  - ✅ Tipo (entrada/saída) (`tpNF`)
  - ✅ Valor total (`vNF`)
  - ✅ CNPJ do emitente
  - ✅ Nome do emitente
  - ✅ CNPJ do destinatário
  - ✅ Nome do destinatário
  - ✅ CFOP
  - ✅ Natureza da operação (`natOp`)
  - ✅ Chave de acesso (`chNFe`)
  - ✅ Status de autorização (`cStat`)

#### 3.3. Validações Automáticas
- ✅ Verifica se NFe está autorizada (cStat = '100')
- ✅ Verifica se nota já existe (número + série)
- ✅ Busca automática de cliente/fornecedor por CNPJ
- ✅ Determina tipo de nota baseado em CFOP e natureza da operação

#### 3.4. Busca Automática de Relacionamentos
- **Cliente (Notas de Saída):**
  - Busca por CNPJ do destinatário
  - Função: `buscarClientePorCNPJ()` (linhas 925-947)
  
- **Fornecedor (Notas de Entrada):**
  - Busca por CNPJ do emitente
  - Função: `buscarFornecedorPorCNPJ()` (linhas 952-974)

#### 3.5. Determinação Automática do Tipo de Nota
- **Função:** `determinarTipoNota()` (linhas 979-1010)
- **Lógica:**
  - Analisa natureza da operação (locação, medição, circulação)
  - Analisa CFOP (5xxx = saída, 6xxx = entrada)
  - Retorna: `locacao`, `medicao`, `circulacao_equipamentos`, `fornecedor`

#### 3.6. Interface de Importação
- **Localização:** Botão "Importar XML" na página de notas fiscais
- **Funcionalidades:**
  - ✅ Seleção de arquivo XML
  - ✅ Validação de tipo e tamanho
  - ✅ Feedback de progresso
  - ✅ Exibição de avisos (cliente/fornecedor não encontrado)
  - ✅ Criação automática da nota fiscal

#### 3.7. Armazenamento do XML
- ✅ Upload automático do XML para Supabase Storage
- ✅ Caminho: `notas-fiscais/{id}/{filename}.xml`
- ✅ URL pública armazenada em `arquivo_nf`
- ✅ Metadados: `nome_arquivo`, `tamanho_arquivo`, `tipo_arquivo`

---

## ⚠️ 4. NOTAS A RECEBER

### Status: ⚠️ IMPLEMENTADO PARCIALMENTE

### O que está implementado:

#### 4.1. Notas Fiscais de Saída
- ✅ Criação de notas fiscais de saída
- ✅ Tipos: locação, circulação de equipamentos, outros equipamentos, medição
- ✅ Vinculação com cliente (obrigatório)
- ✅ Vinculação com medição (opcional)
- ✅ Vinculação com locação (opcional)
- ✅ Status: pendente, paga, vencida, cancelada

#### 4.2. Listagem de Notas de Saída
- ✅ Tab separada "Notas Fiscais de Saída"
- ✅ Filtros por status e tipo de nota
- ✅ Busca por número, série, cliente
- ✅ Visualização de cliente vinculado
- ✅ Visualização de medição/locação vinculada

### ⚠️ O que está faltando:

#### 4.3. Integração com Contas a Receber
- ❌ **Campo `nota_fiscal_id` na tabela `contas_receber`**
- ❌ **Campo `conta_receber_id` na tabela `notas_fiscais`**
- ❌ Interface para vincular nota fiscal → conta a receber
- ❌ Opção de criar conta a receber automaticamente ao criar nota de saída
- ❌ Visualização de boletos vinculados na nota fiscal
- ❌ Visualização de nota fiscal vinculada na conta a receber

#### 4.4. Automação
- ❌ Ao criar nota fiscal de saída → criar conta a receber automaticamente
- ❌ Sincronização de status entre nota fiscal e conta a receber
- ❌ Geração automática de boleto a partir da nota fiscal

---

## 📊 ESTRUTURA ATUAL DO SISTEMA

### Tabela `notas_fiscais` - Campos Existentes

```sql
CREATE TABLE notas_fiscais (
  id SERIAL PRIMARY KEY,
  numero_nf VARCHAR(50) NOT NULL,
  serie VARCHAR(10),
  data_emissao DATE NOT NULL,
  data_vencimento DATE,
  valor_total DECIMAL(12,2) NOT NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'vencida', 'cancelada')),
  cliente_id INTEGER REFERENCES clientes(id),
  fornecedor_id INTEGER REFERENCES fornecedores(id),
  venda_id INTEGER REFERENCES vendas(id),
  compra_id INTEGER REFERENCES compras(id),
  medicao_id INTEGER REFERENCES medicoes_mensais(id),  -- ✅ Adicionado
  locacao_id INTEGER REFERENCES locacoes(id),          -- ✅ Adicionado
  tipo_nota VARCHAR(50),                                 -- ✅ Adicionado
  arquivo_nf TEXT,                                      -- URL do arquivo
  nome_arquivo VARCHAR(255),
  tamanho_arquivo INTEGER,
  tipo_arquivo VARCHAR(20),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Campos Faltantes (para integração completa):

```sql
-- ❌ FALTA ADICIONAR:
conta_receber_id INTEGER REFERENCES contas_receber(id),
conta_pagar_id INTEGER REFERENCES contas_pagar(id),
```

---

## 🎯 CHECKLIST DE VALIDAÇÃO

### ✅ Funcionalidades Implementadas

- [x] **Adicionar notas de fornecedores**
  - [x] Formulário de criação
  - [x] Validação de dados
  - [x] Vinculação com fornecedor
  - [x] Vinculação com compra
  - [x] Upload de arquivo

- [x] **Notas de entrada**
  - [x] Listagem completa
  - [x] Filtros e busca
  - [x] Visualização de detalhes
  - [x] Edição e exclusão
  - [x] Status de pagamento

- [x] **Integração XML**
  - [x] Parser de XML NFe
  - [x] Extração automática de dados
  - [x] Busca automática de cliente/fornecedor
  - [x] Validação de autorização
  - [x] Upload automático do XML
  - [x] Interface de importação

- [x] **Notas de saída**
  - [x] Criação manual
  - [x] Vinculação com cliente
  - [x] Vinculação com medição/locação
  - [x] Tipos de nota (locação, medição, etc.)
  - [x] Listagem e filtros

### ⚠️ Funcionalidades Pendentes

- [ ] **Integração com Contas a Receber**
  - [ ] Adicionar campo `nota_fiscal_id` em `contas_receber`
  - [ ] Adicionar campo `conta_receber_id` em `notas_fiscais`
  - [ ] Criar migration para relacionamento
  - [ ] Atualizar API para vincular notas → contas
  - [ ] Interface para vincular manualmente
  - [ ] Opção de criar conta a receber automaticamente

- [ ] **Integração com Contas a Pagar**
  - [ ] Adicionar campo `nota_fiscal_id` em `contas_pagar`
  - [ ] Adicionar campo `conta_pagar_id` em `notas_fiscais`
  - [ ] Criar migration para relacionamento
  - [ ] Atualizar API para vincular notas → contas
  - [ ] Interface para vincular manualmente
  - [ ] Opção de criar conta a pagar automaticamente

- [ ] **Automações**
  - [ ] Ao criar NF de saída → criar conta a receber
  - [ ] Ao criar NF de entrada → criar conta a pagar
  - [ ] Sincronização de status
  - [ ] Geração automática de boletos

---

## 📝 RECOMENDAÇÕES

### Prioridade ALTA 🔴

1. **Adicionar relacionamento com Contas a Receber**
   - Migration para adicionar `conta_receber_id` em `notas_fiscais`
   - Migration para adicionar `nota_fiscal_id` em `contas_receber`
   - Atualizar API para suportar vinculação
   - Interface para vincular na criação/edição

2. **Adicionar relacionamento com Contas a Pagar**
   - Migration para adicionar `conta_pagar_id` em `notas_fiscais`
   - Migration para adicionar `nota_fiscal_id` em `contas_pagar`
   - Atualizar API para suportar vinculação
   - Interface para vincular na criação/edição

### Prioridade MÉDIA 🟡

3. **Melhorar visualização**
   - Mostrar conta a receber vinculada na nota fiscal
   - Mostrar conta a pagar vinculada na nota fiscal
   - Mostrar nota fiscal vinculada na conta a receber/pagar
   - Filtro por status de pagamento

4. **Automações opcionais**
   - Checkbox "Criar conta a receber automaticamente" ao criar NF de saída
   - Checkbox "Criar conta a pagar automaticamente" ao criar NF de entrada
   - Sincronização de status entre NF e conta

---

## ✅ CONCLUSÃO

### Status Geral: ✅ **FUNCIONAL COM MELHORIAS PENDENTES**

O sistema de notas fiscais está **operacional** e atende aos requisitos básicos:
- ✅ Adicionar/validar notas de fornecedores
- ✅ Notas de entrada funcionais
- ✅ Integração XML completa e funcional
- ✅ Notas de saída funcionais

**Falta apenas a integração com o módulo de contas a receber/pagar** para completar o fluxo financeiro completo.

### Próximos Passos Sugeridos:
1. Criar migrations para relacionamento NF ↔ Contas
2. Atualizar API para suportar vinculação
3. Adicionar interface de vinculação
4. Implementar automações opcionais

---

**Documento gerado em:** 28/02/2025  
**Última atualização:** 28/02/2025

