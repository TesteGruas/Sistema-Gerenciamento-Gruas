# 📋 Guia de Validação - Ajustes Implementados

Este documento descreve como validar cada funcionalidade implementada nos ajustes solicitados.

---

## 1. ✅ Aluguéis de Casas - Novos Campos

### 📍 Localização
- **Página:** `/dashboard/financeiro/alugueis`
- **Arquivo:** `app/dashboard/financeiro/alugueis/page.tsx`

### 🎯 Campos Adicionados
1. **Tipo de Sinal** (Caução, Fiador, Outros)
2. **Valor do Depósito** (R$)
3. **Período da Multa** (dias)
4. **Contrato** (Upload de arquivo PDF/DOC/DOCX)

### ✅ Como Validar

#### **Passo 1: Acessar a Página de Aluguéis**
```
1. Faça login no sistema
2. Navegue para: Financeiro > Aluguéis
3. Clique no botão "Novo Aluguel"
```

#### **Passo 2: Preencher Formulário Completo**
```
1. Selecione uma Residência
2. Selecione um Funcionário
3. Preencha os dados do contrato:
   - Data de Início
   - Valor Mensal
   - Dia Vencimento
   - Subsídio (%)

4. NOVOS CAMPOS - Preencha:
   - Tipo de Sinal: Selecione (Caução, Fiador ou Outros)
   - Valor do Depósito: Digite um valor (ex: 1000.00)
   - Período da Multa: Digite número de dias (ex: 30)
   - Contrato: Clique em "Escolher arquivo" e selecione um PDF/DOC/DOCX
```

#### **Passo 3: Verificar Salvamento**
```
1. Clique em "Criar Aluguel"
2. Verifique se aparece mensagem de sucesso
3. Verifique se o aluguel aparece na lista
4. Clique no aluguel criado para verificar se os novos campos foram salvos
```

#### **Passo 4: Verificar no Banco de Dados**
```sql
-- Verificar se os campos foram salvos
SELECT 
  id,
  tipo_sinal,
  valor_deposito,
  periodo_multa,
  contrato_arquivo
FROM alugueis_residencias
ORDER BY created_at DESC
LIMIT 1;
```

### 🔍 Validações Específicas

| Campo | Validação | Como Testar |
|-------|-----------|-------------|
| Tipo de Sinal | Opcional, mas se preenchido deve ser: caucao, fiador ou outros | Selecione cada opção e salve |
| Valor do Depósito | Aceita valores decimais (0.01) | Digite: 1000.50 e verifique se salva |
| Período da Multa | Aceita números inteiros | Digite: 30 e verifique se salva |
| Contrato | Aceita PDF, DOC, DOCX | Tente fazer upload de cada tipo de arquivo |

---

## 2. ✅ Estoque - Reorganização de Categorias

### 📍 Localização
- **Página:** `/dashboard/estoque`
- **Arquivo:** `app/dashboard/estoque/page.tsx`

### 🎯 Classificações Implementadas
1. **Componente** - Partes do ativo que aparecem na categoria "Estoque"
2. **Item** - Consumíveis
3. **Ativo** - Imobilizados (com subcategorias):
   - Grua
   - Equipamento (Complemento de Grua)
   - Ferramenta
   - Ar Condicionado
   - Câmera
   - Auto
   - PC
4. **Complemento** - Todas as peças que compõem os ativos

### ✅ Como Validar

#### **Passo 1: Acessar Estoque**
```
1. Navegue para: Estoque
2. Clique em "Novo Item"
```

#### **Passo 2: Criar Item com Nova Classificação**
```
1. Preencha:
   - Nome do Item: "Cabo de Aço 12mm"
   - Categoria: Selecione uma categoria existente
   
2. NOVO CAMPO - Classificação:
   - Selecione: "Componente (Partes do ativo)"
   - Verifique se aparece a descrição abaixo do campo
   
3. Preencha os demais campos e salve
```

#### **Passo 3: Criar Ativo com Subcategoria**
```
1. Crie um novo item
2. Nome: "Grua Torre 50T"
3. Classificação: Selecione "Ativo (Imobilizados)"
4. NOVO CAMPO - Subcategoria do Ativo:
   - Deve aparecer automaticamente
   - Selecione: "Grua"
5. Salve o item
```

#### **Passo 4: Verificar no Banco de Dados**
```sql
-- Verificar classificação dos produtos
SELECT 
  nome,
  classificacao_tipo,
  subcategoria_ativo,
  categoria_id
FROM produtos
WHERE classificacao_tipo IS NOT NULL
ORDER BY created_at DESC;
```

### 🔍 Validações Específicas

| Classificação | Subcategoria Aparece? | Como Testar |
|---------------|----------------------|-------------|
| Componente | ❌ Não | Selecione Componente - subcategoria não deve aparecer |
| Item | ❌ Não | Selecione Item - subcategoria não deve aparecer |
| Ativo | ✅ Sim | Selecione Ativo - subcategoria deve aparecer obrigatoriamente |
| Complemento | ❌ Não | Selecione Complemento - subcategoria não deve aparecer |

#### **Teste de Validação de Ativo:**
```
1. Selecione "Ativo" como classificação
2. Tente salvar SEM selecionar subcategoria
3. Deve aparecer erro ou validação
4. Selecione uma subcategoria e salve novamente
```

---

## 3. ✅ Checklist de Manutenção - Seleção OK/MANUTENÇÃO

### 📍 Localização
- **Componente:** `components/livro-grua-manutencao.tsx`
- **Acesso:** Página de Gruas > Livro da Grua > Nova Manutenção

### 🎯 Funcionalidade
Cada item do checklist agora possui botões **OK** e **MANUTENÇÃO** ao invés de apenas checkbox.

### ✅ Como Validar

#### **Passo 1: Acessar Manutenção**
```
1. Navegue para: Gruas
2. Selecione uma grua
3. Vá para a aba "Livro"
4. Clique em "Nova Manutenção" ou edite uma existente
```

#### **Passo 2: Verificar Interface do Checklist**
```
1. Role até a seção "Checklist de Manutenção"
2. Verifique que cada item tem:
   - Nome do item à esquerda
   - Dois botões à direita: "OK" (verde) e "MANUTENÇÃO" (amarelo)
```

#### **Passo 3: Testar Seleção de Status**
```
1. Clique no botão "OK" de um item
   - Botão deve ficar verde/preenchido
   - Status deve ser salvo como "ok"

2. Clique no botão "MANUTENÇÃO" de outro item
   - Botão deve ficar amarelo/preenchido
   - Status deve ser salvo como "manutencao"

3. Clique novamente no mesmo botão
   - Deve desmarcar (voltar ao estado inicial)
```

#### **Passo 4: Salvar e Verificar**
```
1. Preencha os dados obrigatórios:
   - Data
   - Funcionário
   - Descrição

2. Marque alguns itens como OK e outros como MANUTENÇÃO

3. Clique em "Salvar Manutenção"

4. Verifique se a manutenção foi salva com sucesso
```

#### **Passo 5: Verificar no Banco de Dados**
```sql
-- Verificar checklist salvo
SELECT 
  id,
  grua_id,
  checklist,
  descricao
FROM livro_grua_entradas
WHERE tipo_entrada = 'manutencao'
ORDER BY created_at DESC
LIMIT 1;

-- O campo checklist deve conter JSON como:
-- {"tensao_maxima_alimentacao": "ok", "isolamento_cabos": "manutencao", ...}
```

### 🔍 Validações Específicas

| Ação | Resultado Esperado |
|------|-------------------|
| Clicar em "OK" | Botão fica verde/preenchido, status = "ok" |
| Clicar em "MANUTENÇÃO" | Botão fica amarelo/preenchido, status = "manutencao" |
| Clicar novamente no mesmo botão | Desmarca (status = null) |
| Salvar sem marcar nenhum item | Deve permitir (checklist pode estar vazio) |
| Salvar com alguns itens marcados | Deve salvar apenas os marcados |

---

## 4. ✅ Formulários Personalizados para Gruas

### 📍 Localização
- **Migration:** `backend-api/database/migrations/20250228_create_formularios_personalizados_gruas.sql`
- **Status:** Estrutura de banco criada (frontend e rotas ainda não implementados)

### 🎯 Funcionalidade
Sistema para criar formulários personalizados de Checklist Diário e Manutenção vinculados a gruas específicas.

### ✅ Como Validar (Estrutura de Banco)

#### **Passo 1: Executar Migration**
```sql
-- Executar a migration
\i backend-api/database/migrations/20250228_create_formularios_personalizados_gruas.sql
```

#### **Passo 2: Verificar Tabelas Criadas**
```sql
-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'formularios_personalizados%';

-- Deve retornar:
-- formularios_personalizados_gruas
-- formularios_personalizados_itens
-- formularios_personalizados_respostas
```

#### **Passo 3: Verificar Constraints**
```sql
-- Verificar constraint UNIQUE (um formulário por grua e tipo)
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'formularios_personalizados_gruas'
AND constraint_name = 'unique_formulario_grua_tipo';

-- Deve retornar: unique_formulario_grua_tipo | UNIQUE
```

#### **Passo 4: Testar Inserção Manual**
```sql
-- Inserir um formulário de teste
INSERT INTO formularios_personalizados_gruas (
  nome,
  tipo,
  grua_id,
  ativo
) VALUES (
  'Checklist Diário Personalizado - Grua 001',
  'checklist',
  'GRUA001', -- ID de uma grua existente
  true
);

-- Verificar se foi inserido
SELECT * FROM formularios_personalizados_gruas;

-- Tentar inserir outro formulário do mesmo tipo para a mesma grua (deve falhar)
INSERT INTO formularios_personalizados_gruas (
  nome,
  tipo,
  grua_id,
  ativo
) VALUES (
  'Outro Checklist - Grua 001',
  'checklist',
  'GRUA001',
  true
);

-- Deve retornar erro: duplicate key value violates unique constraint
```

#### **Passo 5: Criar Itens do Formulário**
```sql
-- Inserir itens no formulário criado
INSERT INTO formularios_personalizados_itens (
  formulario_id,
  ordem,
  categoria,
  descricao,
  tipo_item,
  obrigatorio
) VALUES 
  ((SELECT id FROM formularios_personalizados_gruas LIMIT 1), 1, 'Eletricidade', 'Verificar tensão de alimentação', 'checkbox', true),
  ((SELECT id FROM formularios_personalizados_gruas LIMIT 1), 2, 'Eletricidade', 'Verificar isolamento dos cabos', 'checkbox', true),
  ((SELECT id FROM formularios_personalizados_gruas LIMIT 1), 3, 'Maquinaria', 'Verificar níveis de óleo', 'checkbox', false);

-- Verificar itens criados
SELECT * FROM formularios_personalizados_itens;
```

### 🔍 Validações Específicas

| Validação | Como Testar | Resultado Esperado |
|-----------|-------------|-------------------|
| Constraint UNIQUE | Tentar criar 2 formulários do mesmo tipo para mesma grua | ❌ Deve falhar com erro de constraint |
| Foreign Key grua_id | Tentar criar formulário com grua_id inexistente | ❌ Deve falhar com erro de foreign key |
| Foreign Key obra_id | Criar formulário com obra_id válido | ✅ Deve funcionar |
| Foreign Key obra_id NULL | Criar formulário sem obra_id | ✅ Deve funcionar (é opcional) |
| Tipos permitidos | Tentar criar formulário com tipo diferente de 'checklist' ou 'manutencao' | ❌ Deve falhar com erro de CHECK constraint |

---

## 📊 Resumo das Validações

### ✅ Checklist Completo

- [ ] **Aluguéis:** Campos novos aparecem no formulário e salvam corretamente
- [ ] **Aluguéis:** Upload de contrato funciona (mesmo que apenas salve nome do arquivo)
- [ ] **Estoque:** Campo de classificação aparece e funciona
- [ ] **Estoque:** Subcategoria aparece quando "Ativo" é selecionado
- [ ] **Estoque:** Validação impede salvar Ativo sem subcategoria
- [ ] **Manutenção:** Botões OK/MANUTENÇÃO aparecem em cada item
- [ ] **Manutenção:** Botões mudam de cor quando clicados
- [ ] **Manutenção:** Status é salvo corretamente no banco
- [ ] **Formulários:** Tabelas foram criadas no banco
- [ ] **Formulários:** Constraint UNIQUE funciona corretamente

---

## 🐛 Troubleshooting

### Erro: "Foreign key constraint cannot be implemented"
**Solução:** Verifique se o tipo de `grua_id` está correto (VARCHAR, não UUID)

### Erro: "Campo não aparece no formulário"
**Solução:** 
1. Verifique se a migration foi executada
2. Limpe o cache do navegador
3. Verifique o console do navegador para erros JavaScript

### Erro: "Valores não salvam"
**Solução:**
1. Verifique se a API está recebendo os dados (Network tab)
2. Verifique se o backend está salvando (logs do servidor)
3. Verifique se há erros de validação no backend

---

## 📝 Notas Importantes

1. **Formulários Personalizados:** A estrutura de banco está pronta, mas as rotas backend e interface frontend ainda precisam ser implementadas para uso completo.

2. **Upload de Contrato:** Atualmente apenas salva o nome do arquivo. Para implementação completa, será necessário:
   - Servidor de arquivos ou storage (S3, etc.)
   - Endpoint de upload
   - Validação de tipo e tamanho de arquivo

3. **Validações de Frontend:** Algumas validações podem precisar ser adicionadas no frontend para melhor UX.

---

**Data de Criação:** 2025-02-28  
**Última Atualização:** 2025-02-28





