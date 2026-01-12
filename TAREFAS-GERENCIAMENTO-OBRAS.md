# TAREFAS - GERENCIAMENTO DE OBRAS

Baseado no fluxograma de requisitos do sistema de gerenciamento de obras.

---

## 📋 1. DADOS DA OBRA

### ✅ Tarefa 1.1: Adicionar Seção "Dados de Montagem do Equipamento"
**Prioridade:** ALTA  
**Descrição:** Incluir nova seção na aba "Dados da Obra" para registrar a configuração da grua contratada pelo cliente.

**Campos necessários:**
- Configuração da grua contratada (diferente dos tamanhos originais)
- Campos técnicos específicos da configuração contratada
- Observação: 90% das vezes não vêm com os tamanhos originais

**Arquivos a modificar:**
- `app/dashboard/obras/nova/page.tsx` - Adicionar seção no formulário
- `app/dashboard/obras/page.tsx` - Adicionar seção na edição
- `lib/api-obras.ts` - Adicionar campos na interface
- `backend-api/src/routes/obras.js` - Adicionar campos no schema e processamento
- `backend-api/database/migrations/` - Criar migration para novos campos

---

## 📄 2. DOCUMENTOS

### ✅ Tarefa 2.1: Adicionar Campos de Upload de Documentos
**Prioridade:** ALTA  
**Descrição:** Incluir campos de upload para documentos obrigatórios da obra.

**Documentos necessários:**
- ✅ CNO (Cadastro Nacional de Obras) - Já implementado
- ⚠️ Dados Técnicos do Equipamento (Manual) - **PENDENTE**
- ⚠️ Termo de Entrega Técnica - **PENDENTE**
- ⚠️ Plano de Carga - **PENDENTE**
- ⚠️ Aterramento - **PENDENTE**

**Arquivos a modificar:**
- `app/dashboard/obras/nova/page.tsx` - Adicionar campos de upload
- `app/dashboard/obras/page.tsx` - Adicionar campos na edição
- `components/documento-upload.tsx` - Verificar se suporta todos os tipos
- `backend-api/src/routes/obras-documentos.js` - Adicionar endpoints para novos documentos
- `backend-api/database/migrations/` - Criar tabela ou campos para novos documentos

---

## 👨‍💼 3. RESPONSÁVEL TÉCNICO

### ✅ Tarefa 3.1: Adicionar 3 Seções de Responsáveis Técnicos IRBANA
**Prioridade:** ALTA  
**Descrição:** Criar 3 seções distintas para os responsáveis técnicos da IRBANA (além da seção existente do responsável da obra/cliente).

**Seções necessárias:**

#### 3.1.1 - RESP PELOS EQUIP (Responsável pelos Equipamentos)
- Responsável Técnico: **ALEX MARCELO DA SILVA NASCIMENTO**
- N° do CREA: **5071184591**
- N° do CREA da Empresa: **SP 2494244**

#### 3.1.2 - RESP PELAS MANUTEN (Responsável pelas Manutenções)
- Responsável Técnico: **NESTOR ALVAREZ GONZALEZ**
- Fone: **(11) 98818-5951**
- N° do CREA da Empresa: **SP 2494244**

#### 3.1.3 - RESP PELA MONTG E OPER (Responsável pela Montagem e Operação)
- Responsável Técnico: **ALEX MARCELO DA SILVA NASCIMENTO**
- N° do CREA: **5071184591**

**Arquivos a modificar:**
- `app/dashboard/obras/nova/page.tsx` - Adicionar 3 novas seções
- `app/dashboard/obras/page.tsx` - Adicionar seções na edição
- `components/responsavel-tecnico-form.tsx` - Criar componente para múltiplos responsáveis ou expandir existente
- `lib/api-responsavel-tecnico.ts` - Adicionar suporte para múltiplos tipos de responsáveis
- `backend-api/src/routes/obras.js` - Adicionar endpoints para múltiplos responsáveis técnicos
- `backend-api/database/migrations/` - Criar tabela `responsaveis_tecnicos_irbana` ou adicionar campo `tipo` na tabela existente

---

## 🚦 4. SINALEIRO

### ✅ Tarefa 4.1: Validação Obrigatória de Documentos Completos
**Prioridade:** ALTA  
**Descrição:** Implementar validação que impede vincular sinaleiro à obra se não estiver com documentos completos.

**Requisitos:**
- Ao tentar vincular sinaleiro à obra, verificar se todos os documentos obrigatórios estão completos
- Bloquear vinculação se documentos incompletos
- Exibir mensagem clara sobre quais documentos estão faltando
- Documentos devem estar completos para finalizar cadastro pelo RH

**Arquivos a modificar:**
- `components/sinaleiros-form.tsx` - Adicionar validação antes de vincular
- `components/editar-sinaleiro-dialog.tsx` - Adicionar validação
- `lib/api-sinaleiros.ts` - Adicionar função de validação de documentos
- `backend-api/src/routes/obras.js` - Adicionar validação no endpoint de vincular sinaleiro
- `backend-api/database/` - Verificar estrutura de documentos obrigatórios

---

## 🏗️ 5. GRUA

### ✅ Tarefa 5.1: Mover Dados da Grua para Aba de Orçamentos
**Prioridade:** MÉDIA  
**Descrição:** Os dados técnicos da grua que aparecem ao clicar na seta de detalhes devem estar na aba de orçamentos, não na seleção da grua.

**Dados que devem ser movidos:**
- N° de Série da Grua
- Fabricante
- Modelo
- Ano de Fabricação
- Capacidade Máxima
- Altura Máxima
- Raio Máximo
- Tipo de Grua
- Data da Última Manutenção
- Próxima Manutenção
- Status
- Localização Atual
- Observações
- Documentos da Grua

**Arquivos a modificar:**
- `app/dashboard/obras/nova/page.tsx` - Remover detalhes da grua da seleção, adicionar na aba de orçamentos
- `app/dashboard/obras/page.tsx` - Mesma alteração na edição
- `components/grua-search.tsx` - Simplificar componente para apenas seleção
- Verificar se existe componente de detalhes da grua para mover

---

## 👥 6. FUNCIONÁRIOS

### ✅ Tarefa 6.1: Integrar Aba Sinaleiros na Aba Funcionários
**Prioridade:** MÉDIA  
**Descrição:** A aba "Sinaleiros" deve ser contida dentro da aba "Funcionários" para facilitar o uso.

**Requisitos:**
- Buscar na lista de funcionários deve mostrar também os sinaleiros
- Sinaleiros internos devem aparecer na busca de funcionários

**Arquivos a modificar:**
- `app/dashboard/obras/nova/page.tsx` - Integrar sinaleiros na aba de funcionários
- `app/dashboard/obras/page.tsx` - Mesma alteração na edição
- `components/funcionario-search.tsx` - Adicionar filtro para incluir sinaleiros
- `lib/api-funcionarios.ts` - Verificar se busca inclui sinaleiros

### ✅ Tarefa 6.2: Alterar "Custos Mensais" para "Valores"
**Prioridade:** BAIXA  
**Descrição:** Renomear "Custos Mensais" para "Valores" pois "Custos" é termo para o cliente.

**Arquivos a modificar:**
- `app/dashboard/obras/nova/page.tsx` - Renomear labels e variáveis
- `app/dashboard/obras/page.tsx` - Renomear labels
- `components/` - Verificar componentes relacionados
- `lib/api-custos-mensais.ts` - Considerar renomear (ou manter internamente)

### ✅ Tarefa 6.3: Integração com Orçamento Aprovado
**Prioridade:** ALTA  
**Descrição:** Os valores acertados via orçamento aprovado devem aparecer automaticamente na aba de valores (custos mensais).

**Requisitos:**
- Não é possível cadastrar obra sem antes ter um orçamento aprovado
- Valores do orçamento aprovado devem ser pré-preenchidos
- Valores do orçamento são o valor inicial

**Arquivos a modificar:**
- `app/dashboard/obras/nova/page.tsx` - Adicionar validação de orçamento obrigatório
- `app/dashboard/obras/nova/page.tsx` - Buscar orçamento aprovado e pré-preencher valores
- `lib/api-obras.ts` - Adicionar campo `orcamento_id` na criação
- `lib/api-orcamentos.ts` - Criar função para buscar orçamento aprovado por cliente/obra
- `backend-api/src/routes/obras.js` - Adicionar validação de orçamento obrigatório
- `backend-api/database/migrations/` - Adicionar campo `orcamento_id` na tabela `obras` (se não existir)

---

## 📊 RESUMO DE PRIORIDADES

### 🔴 ALTA PRIORIDADE
1. ✅ Tarefa 1.1 - Dados de Montagem do Equipamento
2. ✅ Tarefa 2.1 - Upload de Documentos (Manual, Termo, Plano, Aterramento)
3. ✅ Tarefa 3.1 - 3 Seções de Responsáveis Técnicos IRBANA
4. ✅ Tarefa 4.1 - Validação de Documentos do Sinaleiro
5. ✅ Tarefa 6.3 - Integração com Orçamento Aprovado

### 🟡 MÉDIA PRIORIDADE
1. ✅ Tarefa 5.1 - Mover Dados da Grua para Aba Orçamentos
2. ✅ Tarefa 6.1 - Integrar Sinaleiros em Funcionários

### 🟢 BAIXA PRIORIDADE
1. ✅ Tarefa 6.2 - Renomear "Custos Mensais" para "Valores"

---

## 📝 NOTAS IMPORTANTES

1. **Orçamento Obrigatório:** O sistema deve validar que existe um orçamento aprovado antes de permitir criar uma obra.

2. **Documentos Obrigatórios:** Todos os documentos mencionados devem ter upload e validação.

3. **Responsáveis Técnicos:** Os dados dos responsáveis técnicos IRBANA podem ser pré-cadastrados no sistema como padrão, mas devem permitir edição.

4. **Validação de Sinaleiros:** A validação de documentos deve ser feita tanto no frontend quanto no backend para garantir segurança.

5. **Integração de Dados:** Os dados de montagem do equipamento devem estar vinculados ao orçamento aprovado para manter consistência.

---

## 🔍 ARQUIVOS PRINCIPAIS PARA REVISÃO

### Frontend
- `app/dashboard/obras/nova/page.tsx` - Formulário de criação de obra
- `app/dashboard/obras/page.tsx` - Lista e edição de obras
- `components/responsavel-tecnico-form.tsx` - Formulário de responsável técnico
- `components/sinaleiros-form.tsx` - Formulário de sinaleiros
- `components/documento-upload.tsx` - Componente de upload de documentos
- `components/grua-search.tsx` - Busca de gruas
- `components/funcionario-search.tsx` - Busca de funcionários

### Backend
- `backend-api/src/routes/obras.js` - Rotas de obras
- `backend-api/src/routes/obras-documentos.js` - Rotas de documentos
- `backend-api/src/routes/orcamentos.js` - Rotas de orçamentos
- `backend-api/src/schemas/` - Schemas de validação

### Database
- `backend-api/database/migrations/` - Migrations necessárias

---

**Data de Criação:** 06/01/2026  
**Última Atualização:** 06/01/2026

