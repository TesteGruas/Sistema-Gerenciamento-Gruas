# TESTE BASE 0 - Fluxo Completo de Criação de Obra

## 🎯 Objetivo
Testar criação de obra com cliente, grua(s), gestor, funcionários e registros de atividades.

## ✅ Pré-requisitos
- Cliente cadastrado
- Grua(s) cadastrada(s)
- Usuário Gestor com permissões
- Funcionário(s) vinculados a usuários
- Backend e Frontend rodando

---

## 📝 ETAPA 1: Criar Obra (como Gestor)

### Navegação:
**Dashboard > Obras > Nova Obra**

### Ações:

**Aba "Dados da Obra":**
1. Preencher Nome da Obra *
2. Preencher Endereço *
3. Preencher Cidade * (ex: São Paulo)
4. Selecionar Estado * (ex: SP)
5. Selecionar Tipo * (Residencial/Comercial/Industrial/Infraestrutura)
6. Buscar e selecionar Cliente *
7. Preencher demais campos (Data Início, Orçamento, Descrição, etc.)
8. Selecionar Responsável/Gestor

**Aba "Grua":**
1. Clicar "Adicionar Grua"
2. Buscar e selecionar grua
3. Informar Valor de Locação (ex: 15000)
4. Informar Taxa Mensal (ex: 15000)
5. Clicar "Adicionar"
6. Repetir para adicionar mais gruas (opcional)

**Aba "Funcionários":**
1. Clicar "Adicionar Funcionário"
2. Buscar funcionário
3. Selecionar função
4. Clicar "Adicionar"
5. Repetir para pelo menos 2 funcionários

**Aba "Custos Mensais":**
1. Item: `01.01` (máx 20 caracteres)
2. Descrição: `Locação de grua torre`
3. Unidade: `mês`
4. Quantidade: `6`
5. Valor Unitário: `15000`
6. Selecionar mês
7. Clicar "Adicionar Custo"
8. Adicionar mais 2-3 itens

**Finalizar:**
- Clicar "Criar Obra"
- Verificar toast de sucesso

---

## 💰 ETAPA 2: Adicionar Custos (como Gestor)

### Navegação:
**Dashboard > Obras > [Clicar na obra criada] > Aba "Custos Mensais"**

### Ações:
1. Selecionar mês
2. Clicar "Novo Custo"
3. Item: `01.02`
4. Descrição: `Mão de obra especializada`
5. Unidade: `mês`
6. Quantidade: `6`
7. Valor Unitário: `8000`
8. Clicar "Salvar"

**Testar erro de duplicação:**
1. Tentar adicionar item `01.02` novamente no mesmo mês
2. Verificar mensagem de erro clara

---

## 📄 ETAPA 3: Upload de Documentos (como Gestor)

### Navegação:
**Dashboard > Assinaturas > Novo Documento**

### Ações:
1. Título: `Contrato de Locação`
2. Descrição: `Contrato de locação da grua torre`
3. Selecionar Obra criada
4. Upload arquivo PDF (máx 50MB)
5. Configurar ordem de assinatura:
   - Gestor (ordem 1)
   - Cliente (ordem 2)
6. Clicar "Criar Documento"
7. Verificar status "Pendente"

---

## 📖 ETAPA 4: Registrar Livro de Grua (como Funcionário)

### Navegação:
1. Fazer logout do Gestor
2. Login com usuário Funcionário
3. **Dashboard > Gruas > [Selecionar grua] > Livro de Grua**

### Ações - Entrada 1:
1. Verificar funcionário auto-selecionado
2. Data: hoje
3. Hora: `08:00`
4. Tipo: `Checklist`
5. Status: `OK`
6. Descrição: `Verificação pré-operacional realizada`
7. Clicar "Salvar"

### Ações - Entrada 2:
1. Clicar "Nova Entrada"
2. Tipo: `Manutenção`
3. Status: `Manutenção`
4. Descrição: `Lubrificação preventiva programada`
5. Responsável: `João Silva`
6. Salvar

---

## 📁 ETAPA 5: Upload de Arquivos (como Cliente ou Gestor)

### Navegação:
**Dashboard > Obras > [Selecionar obra] > Aba "Arquivos"**

### Ações:
1. Clicar "Fazer Upload"
2. Selecionar arquivo (PDF, imagem, Word, Excel - máx 100MB)
3. Selecionar categoria
4. Adicionar descrição (opcional)
5. Clicar "Enviar"
6. Verificar arquivo na lista

---

## ✅ Checklist Final

- [✅] Obra criada com cidade, estado e tipo
- [✅] Grua(s) vinculada(s)
- [✅] Funcionários alocados
- [✅] Custos mensais adicionados
- [✅] Item duplicado bloqueado
- [✅] Documento PDF criado
- [✅] Livro de grua registrado por funcionário
- [✅] Arquivos enviados

---

## 📋 Resultado

**Data:** __23/10/2025___
**Status:** [ ✅ ] ✅ APROVADO  [ ] ❌ REPROVADO

**Bugs encontrados:**
Listagem dos custos + duplicaçoes ✅  
Permissoes dos usuarios para visualizar os documentos ✅ 
_______________________________________
_______________________________________

