# Sistema de Gerenciamento de Gruas - Documentação Consolidada

**Data:** 2025  
**Status:** Documentação Completa e Atualizada

---

## 📋 Índice

1. [Informações Gerais do Projeto](#informações-gerais-do-projeto)
2. [Status de Implementação](#status-de-implementação)
3. [Tracking de Mocks e Integrações](#tracking-de-mocks-e-integrações)
4. [Pendências do Backend](#pendências-do-backend)
5. [Escopo e Planejamento](#escopo-e-planejamento)

---

## 📚 Informações Gerais do Projeto

### 🚀 Stack Tecnológico

#### Frontend
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas

#### Backend
- **Node.js + Express** - API RESTful
- **Supabase** - Banco de dados PostgreSQL + Auth
- **Joi** - Validação de dados
- **JWT** - Autenticação
- **Multer** - Upload de arquivos

### 📦 Módulos Principais

#### 🏗️ Obras
- Cadastro e gerenciamento de obras
- Documentos e arquivos por obra
- Assinatura digital de documentos
- Associação com gruas e funcionários

#### 🏗️ Gruas
- Controle de gruas disponíveis
- Livro da grua (manutenções, checklists)
- Componentes e configurações
- Histórico de locações
- Controle mensal de horas e custos

#### 👥 RH Completo
- Cadastro de funcionários
- Cargos e salários
- Férias e afastamentos
- Benefícios e vales
- Folha de pagamento
- Horas trabalhadas
- Relatórios e auditoria

#### ⏰ Ponto Eletrônico
- Registro de ponto (entrada, almoço, saída)
- Validação por geolocalização
- Justificativas de ausências
- Aprovação de horas extras com assinatura digital
- Relatórios de frequência

#### 💰 Financeiro
- Receitas por obra/grua
- Custos e despesas
- Medições de locação
- Notas fiscais
- Contas a pagar e receber
- Automações:
  - **Receita automática**: Criada ao finalizar medição
  - **Custo automático**: Criado ao registrar manutenção

#### 🔔 Notificações
- Sistema de notificações em tempo real
- Tipos: info, warning, error, success, grua, obra, financeiro, rh, estoque
- Marcação de lidas/não lidas

#### 📝 Assinaturas Digitais
- Fluxo de assinatura de documentos
- Ordem de assinantes (interno/cliente)
- Upload de documentos assinados
- Histórico completo

### 🔐 Autenticação e Permissões

#### Perfis de Usuário
- **Administrador** (nível 10): Acesso total
- **Gestor** (nível 8): Gerenciamento de módulos
- **Supervisor** (nível 5): Supervisão de equipes
- **Técnico** (nível 3): Operações técnicas
- **Operador** (nível 1): Operações básicas

### 📡 API Endpoints Principais

#### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Usuário atual
- `POST /api/auth/logout` - Logout

#### Obras
- `GET /api/obras` - Listar obras
- `POST /api/obras` - Criar obra
- `GET /api/obras/:id` - Detalhes da obra
- `PUT /api/obras/:id` - Atualizar obra

#### Gruas
- `GET /api/gruas` - Listar gruas
- `POST /api/gruas` - Criar grua
- `GET /api/gruas/:id` - Detalhes da grua

#### Ponto Eletrônico
- `GET /api/ponto/registros` - Listar registros
- `POST /api/ponto/registrar` - Registrar ponto
- `GET /api/ponto/pendentes-aprovacao` - Horas extras pendentes
- `POST /api/ponto/aprovar-lote` - Aprovar em massa

#### Financeiro
- `GET /api/receitas` - Listar receitas
- `POST /api/receitas` - Criar receita
- `GET /api/custos` - Listar custos
- `POST /api/custos` - Criar custo
- `PATCH /api/medicoes/:id/finalizar` - Finalizar medição (cria receita automática)

#### RH
- `GET /api/rh/funcionarios` - Listar funcionários
- `GET /api/ferias` - Férias
- `GET /api/cargos` - Cargos
- `POST /api/livro-grua` - Registrar manutenção (cria custo automático)

---

## 📊 Status de Implementação

### Resumo Geral

| Módulo | Status | Progresso |
|--------|--------|-----------|
| **1. Cadastro de Obra - Novos Campos** | ✅ Implementado | 100% |
| **2. Sinaleiros na Obra** | ✅ Implementado e Integrado | 100% |
| **3. Perfis Acesso Global** | ⏳ Não implementado | 0% |
| **4. Sistema de Notificação** | ⚠️ Parcial | 40% |
| **5.1. Certificados Colaboradores** | ✅ Implementado e Integrado | 100% |
| **5.2. Documentos Admissionais** | ✅ Implementado e Integrado | 100% |
| **5.3. Holerites** | ✅ Implementado e Integrado | 100% |
| **5.4. Cargos Dinâmicos** | ✅ Implementado | 100% |
| **6. Importação Componentes Excel** | ⏳ Não implementado | 0% |
| **7. Livro de Grua** | ✅ Implementado | 100% |
| **8. Ordem de Compras** | ⚠️ Parcial | 30% |
| **9. ART** | ✅ Implementado | 80% |
| **10. Checklist Diário** | ⏳ Não implementado | 0% |
| **11. Manutenções da Obra** | ⏳ Não implementado | 0% |
| **12. Aprovação WhatsApp** | ⚠️ Parcial | 50% |
| **13. Complemento de Obras** | ✅ Implementado | 100% |
| **14. Orçamento de Obras** | ✅ Implementado | 100% |

### Estatísticas

- ✅ **Totalmente Implementadas:** 10 (63%)
- ⚠️ **Parcialmente Implementadas:** 3 (19%)
- ⏳ **Não Implementadas:** 3 (18%)

### Detalhamento por Módulo

#### ✅ 1. CADASTRO DE OBRA – Novos Campos e Funcionalidades

**Status:** ✅ Implementado

| Campo | Status | Localização | Observações |
|-------|--------|------------|-------------|
| **CNO da Obra** | ✅ Implementado | `components/cno-input.tsx` | ✅ Componente criado e integrado na aba "Documentos" |
| **ART da Obra** | ✅ Implementado | `app/dashboard/obras/nova/page.tsx` | ✅ Campo de número + upload integrados na aba "Documentos" |
| **Apólice de Seguro** | ✅ Implementado | `app/dashboard/obras/nova/page.tsx` | ✅ Campo de número + upload integrados na aba "Documentos" |
| **Responsável Técnico** | ✅ Implementado | `components/responsavel-tecnico-form.tsx` | ✅ Implementado com mock e integrado na aba "Responsável Técnico" |

**Arquivos relacionados:**
- ✅ `app/dashboard/obras/nova/page.tsx` - **INTEGRADO** - Novas abas adicionadas: Documentos, Responsável Técnico, Sinaleiros
- ✅ `components/documento-upload.tsx` - Componente reutilizável criado e em uso
- ✅ `components/cno-input.tsx` - Componente criado e integrado
- ✅ `components/responsavel-tecnico-form.tsx` - Componente criado e integrado
- ✅ `components/sinaleiros-form.tsx` - Componente criado e integrado

#### ✅ 2. SINALEIROS NA OBRA

**Status:** ✅ Implementado e Integrado com Backend

**Componentes:**
- ✅ `components/sinaleiros-form.tsx` - Formulário de sinaleiros
- ✅ `components/documentos-sinaleiro-list.tsx` - Lista de documentos
- ✅ `lib/api-sinaleiros.ts` - API client integrado

**Funcionalidades:**
- ✅ Cadastro de até 2 sinaleiros (Principal + Reserva)
- ✅ Campos: Nome, RG ou CPF, Telefone, Email
- ✅ Cliente pode editar se informou os sinaleiros
- ✅ Documentos obrigatórios: RG/CPF (frente/verso), Comprovante de vínculo
- ✅ Integração completa com backend real

**Endpoints Utilizados:**
- ✅ `GET /api/obras/:id/sinaleiros` - Listar sinaleiros
- ✅ `POST /api/obras/:id/sinaleiros` - Criar/atualizar sinaleiros
- ✅ `GET /api/obras/sinaleiros/:id/documentos` - Listar documentos
- ✅ `POST /api/obras/sinaleiros/:id/documentos` - Upload documentos
- ✅ `PUT /api/obras/documentos-sinaleiro/:id/aprovar` - Aprovar documentos

#### ✅ 5. MÓDULO RH – AJUSTES E MELHORIAS

##### ✅ 5.1. Colaboradores – Aba "Certificados"

**Status:** ✅ Implementado e Integrado com Backend

**Arquivos:**
- ✅ `app/dashboard/rh/colaboradores/[id]/certificados/page.tsx`
- ✅ `lib/api-colaboradores-documentos.ts` - API client integrado

**Funcionalidades:**
- ✅ Nome do Certificado + Data de Validade + Upload
- ✅ Alertas automáticos com 30 dias de antecedência
- ✅ Tipos: Ficha de EPI, Ordem de Serviço, NR06, NR11, NR12, NR18, NR35, Certificado de Especificação
- ✅ Integração completa com backend real

##### ✅ 5.2. Documentos Admissionais

**Status:** ✅ Implementado e Integrado

**Arquivos:**
- ✅ `app/dashboard/rh/colaboradores/[id]/documentos-admissionais/page.tsx`
- ✅ `components/colaborador-documentos-admissionais.tsx`
- ✅ `lib/api-colaboradores-documentos.ts` - API client integrado

**Funcionalidades:**
- ✅ Cadastro com Tipo + Data de Validade + Upload
- ✅ Validação com alerta (30 dias antes)
- ✅ Tipos: ASO, eSocial, Ficha de Registro
- ✅ Integração completa com backend real

##### ✅ 5.3. Documentos Mensais - Holerite

**Status:** ✅ Implementado e Integrado

**Arquivos:**
- ✅ `app/dashboard/rh/colaboradores/[id]/holerites/page.tsx`
- ✅ `components/colaborador-holerites.tsx`
- ✅ `lib/api-colaboradores-documentos.ts` - API client integrado

**Funcionalidades:**
- ✅ Listagem de holerites mensais
- ✅ Assinatura digital do colaborador
- ✅ Download de holerites
- ✅ Acesso: Admin, Cliente e Funcionário
- ✅ Integração completa com backend real

#### ✅ 7. LIVRO DE GRUA – REFORMULAÇÃO COMPLETA

**Status:** ✅ Implementado (Nova Estrutura)

**Mudança:** O livro de grua foi reformulado para ter duas funcionalidades principais:

##### 7.1. Checklist Diários ✅

**Arquivos:**
- ✅ `components/livro-grua-checklist-diario.tsx` - Formulário de checklist
- ✅ `components/livro-grua-checklist-list.tsx` - Lista de checklists
- ✅ Integrado em `app/dashboard/gruas/[id]/livro/page.tsx`

**Funcionalidades:**
- ✅ Funcionário identificado automaticamente via token de autenticação
- ✅ Data do checklist (obrigatória)
- ✅ Campos de verificação: Cabos, Polias, Estrutura, Movimentos, Freios, Limitadores, Indicadores, Aterramento
- ✅ Campo de observações
- ✅ Visualização, edição e exclusão de checklists

##### 7.2. Manutenções ✅

**Arquivos:**
- ✅ `components/livro-grua-manutencao.tsx` - Formulário de manutenção
- ✅ `components/livro-grua-manutencao-list.tsx` - Lista de manutenções
- ✅ Integrado em `app/dashboard/gruas/[id]/livro/page.tsx`

**Funcionalidades:**
- ✅ Data da manutenção (input livre, não necessariamente diária)
- ✅ Realizado por (busca de funcionário)
- ✅ Cargo do funcionário
- ✅ Descrição da manutenção
- ✅ Campo de observações
- ✅ Visualização, edição e exclusão de manutenções

#### ✅ 13. COMPLEMENTO DE OBRAS

**Status:** ✅ Implementado

**Arquivos:**
- ✅ `components/grua-complementos-manager.tsx`
- ✅ `app/dashboard/complementos/page.tsx`
- ✅ Usado em `app/dashboard/obras/[id]/page.tsx`

**Funcionalidades:**
- ✅ Catálogo de itens: acessórios e serviços
- ✅ Tipos de cobrança: mensal, único, variável
- ✅ Cálculo automático: total mensal, único, variável e total do contrato
- ✅ Controle de status: rascunho → solicitado → aprovado → pedido → entregue → faturado
- ✅ Incluir/excluir itens do cálculo
- ✅ Relatórios: exportação em PDF com detalhes e totais

#### ✅ 14. ORÇAMENTO DE OBRAS

**Status:** ✅ Implementado

**Arquivos:**
- ✅ `app/dashboard/orcamentos/novo/page.tsx`
- ✅ `app/dashboard/orcamentos/[id]/criar-obra/page.tsx`
- ✅ `app/dashboard/financeiro/orcamentos/page.tsx`

**Funcionalidades:**
- ✅ Criação de orçamento: dados do cliente, obra, equipamento
- ✅ Especificações técnicas: altura inicial/final, comprimento da lança, carga máxima/ponta, potência elétrica
- ✅ Custos mensais: locação, operador, sinaleiro, manutenção (cálculo automático)
- ✅ Prazos: período de locação, data de início, tolerância
- ✅ Condições: escopo incluído, responsabilidades, condições comerciais
- ✅ Status: Rascunho → Enviado → Aprovado → Rejeitado
- ✅ Criar obra: orçamentos aprovados podem gerar obras automaticamente

---

## 🔄 Tracking de Mocks e Integrações

### Status de Integração

| Módulo | Componente | Status Mock | Status API | Data Integração | Arquivos Criados |
|--------|-----------|-------------|------------|----------------|------------------|
| Obra | Campos obrigatórios | ✅ Integrado | ✅ Integrado | 2025 | `components/cno-input.tsx`, `components/documento-upload.tsx` |
| Obra | Responsável Técnico | ✅ Integrado | ✅ Integrado | 2025 | `components/responsavel-tecnico-form.tsx`, `lib/api-responsavel-tecnico.ts` |
| Obra | Sinaleiros | ✅ Integrado | ✅ Integrado | 2025 | `components/sinaleiros-form.tsx`, `lib/api-sinaleiros.ts` |
| Obra | Documentos Sinaleiro | ✅ Integrado | ✅ Integrado | 2025 | `components/documentos-sinaleiro-list.tsx` |
| RH | Certificados | ✅ Integrado | ✅ Integrado | 2025 | `app/dashboard/rh/colaboradores/[id]/certificados/page.tsx`, `lib/api-colaboradores-documentos.ts` |
| RH | Documentos Admissionais | ✅ Integrado | ✅ Integrado | 2025 | `app/dashboard/rh/colaboradores/[id]/documentos-admissionais/page.tsx` |
| RH | Holerites | ✅ Integrado | ✅ Integrado | 2025 | `app/dashboard/rh/colaboradores/[id]/holerites/page.tsx` |
| Checklist | Modelos | ✅ Mock | ⏳ Pendente | - | - |
| Checklist | Diário | ✅ Mock | ⏳ Pendente | - | - |
| Manutenções | Ordens | ✅ Mock | ⏳ Pendente | - | - |
| Manutenções | Agenda Preventiva | ✅ Mock | ⏳ Pendente | - | - |
| Financeiro | Ordem de Compras | ✅ Mock | ⏳ Pendente | - | - |
| Gruas | Livro de Grua | ✅ Mock | ⏳ Pendente | - | - |

**Legenda:**
- ✅ Mock: Implementado com dados mockados
- ⏳ Pendente: Aguardando integração com API
- ✅ Integrado: Integrado com backend real

### Estatísticas de Mock

- **Total de Componentes com Mock:** 18
- **Total de Endpoints Pendentes:** 60+
- **Taxa de Integração:** 39% (7 de 18 componentes integrados)
- **Componentes Implementados:** 7
- **Arquivos de Mock Criados:** 2 (`sinaleiros-mocks.ts`, `certificados-mocks.ts`)

### Por Módulo

| Módulo | Componentes Mockados | Endpoints Pendentes |
|--------|---------------------|-------------------|
| Obra | 4 | 12 |
| RH | 3 | 12 |
| Checklist | 3 | 9 |
| Manutenções | 3 | 12 |
| Financeiro | 1 | 6 |
| Livro de Grua | 1 | 4 |
| Gruas | 3 | 9 |

---

## ⚠️ Pendências do Backend

### ✅ BACKEND JÁ IMPLEMENTADO E VERIFICADO

**Nota:** Todos os endpoints abaixo foram verificados e estão funcionando. O frontend já está integrado com eles.

#### 1. Sinaleiros ✅
- `GET /api/obras/:id/sinaleiros` ✅
- `POST /api/obras/:id/sinaleiros` ✅
- `GET /api/obras/sinaleiros/:id/documentos` ✅
- `POST /api/obras/sinaleiros/:id/documentos` ✅
- `PUT /api/obras/documentos-sinaleiro/:id/aprovar` ✅

#### 2. Responsável Técnico ✅
- `GET /api/obras/:id/responsavel-tecnico` ✅
- `POST /api/obras/:id/responsavel-tecnico` ✅
- `GET /api/responsaveis-tecnicos/buscar?cpf=xxx` ✅

#### 3. Certificados de Colaboradores ✅
- `GET /api/colaboradores/:id/certificados` ✅
- `POST /api/colaboradores/:id/certificados` ✅
- `PUT /api/colaboradores/certificados/:id` ✅
- `DELETE /api/colaboradores/certificados/:id` ✅
- `GET /api/colaboradores/certificados/vencendo` ✅

#### 4. Documentos Admissionais ✅
- `GET /api/colaboradores/:id/documentos-admissionais` ✅
- `POST /api/colaboradores/:id/documentos-admissionais` ✅
- `PUT /api/colaboradores/documentos-admissionais/:id` ✅
- `DELETE /api/colaboradores/documentos-admissionais/:id` ✅

#### 5. Holerites ✅
- `GET /api/colaboradores/:id/holerites` ✅
- `POST /api/colaboradores/:id/holerites` ✅
- `PUT /api/colaboradores/holerites/:id/assinatura` ✅
- `DELETE /api/colaboradores/holerites/:id` ✅

### ⚠️ BACKEND A VERIFICAR/IMPLEMENTAR

#### 1. Upload de Arquivos ⚠️
**Status:** ⚠️ Verificar implementação

**Endpoints necessários:**
- `POST /api/arquivos/upload` - Upload genérico de arquivos
- `GET /api/arquivos/url-assinada?caminho=xxx` - Obter URL assinada para download

**Prioridade:** ALTA (usado em múltiplos lugares)

#### 2. Checklist Diário de Obra ⏳
**Status:** ⏳ Não implementado

**Endpoints necessários:**
- `GET /api/obras/:id/checklist-modelos` - Listar modelos de checklist
- `POST /api/checklist-modelos` - Criar modelo de checklist
- `PUT /api/checklist-modelos/:id` - Atualizar modelo
- `DELETE /api/checklist-modelos/:id` - Excluir modelo
- `GET /api/obras/:id/checklists-diarios` - Listar checklists diários
- `POST /api/checklists-diarios` - Criar checklist diário
- `PUT /api/checklists-diarios/:id` - Atualizar checklist
- `POST /api/checklists-diarios/:id/assinar` - Assinar checklist
- `GET /api/checklist-nc-acoes/pendentes` - Listar NCs pendentes
- `POST /api/checklist-nc-acoes` - Criar plano de ação para NC
- `PUT /api/checklist-nc-acoes/:id` - Atualizar plano de ação

**Prioridade:** ALTA

#### 3. Manutenções da Obra/Grua ⏳
**Status:** ⏳ Não implementado

**Endpoints necessários:**
- `GET /api/gruas/:id/manutencoes` - Listar manutenções da grua
- `GET /api/obras/:id/manutencoes` - Listar manutenções da obra
- `POST /api/manutencoes-ordens` - Criar ordem de manutenção
- `PUT /api/manutencoes-ordens/:id` - Atualizar ordem
- `DELETE /api/manutencoes-ordens/:id` - Excluir ordem
- `POST /api/manutencoes-ordens/:id/executar` - Executar manutenção
- `POST /api/manutencoes-ordens/:id/anexos` - Upload de anexos
- `GET /api/gruas/:id/agenda-preventiva` - Obter agenda preventiva
- `POST /api/manutencoes-agenda-preventiva` - Criar agendamento preventivo
- `PUT /api/manutencoes-agenda-preventiva/:id` - Atualizar agendamento
- `GET /api/manutencoes/proximas` - Listar manutenções próximas

**Prioridade:** MÉDIA

#### 4. Ordem de Compras ⏳
**Status:** ⏳ Não implementado

**Endpoints necessários:**
- `GET /api/ordem-compras` - Listar ordens de compra
- `POST /api/ordem-compras` - Criar ordem de compra
- `POST /api/ordem-compras/:id/aprovar-orcamento` - Aprovar orçamento
- `POST /api/ordem-compras/:id/rejeitar-orcamento` - Rejeitar orçamento
- `POST /api/ordem-compras/:id/enviar-financeiro` - Enviar para financeiro
- `POST /api/ordem-compras/:id/registrar-pagamento` - Registrar pagamento
- `POST /api/ordem-compras/:id/aprovar-pagamento` - Aprovar pagamento
- `POST /api/ordem-compras/:id/rejeitar-pagamento` - Rejeitar pagamento

**Prioridade:** MÉDIA

#### 5. Acesso Global a Obras (Cargos) ⏳
**Status:** ⏳ Não implementado

**Modificações necessárias:**
- Adicionar campo `acesso_global_obras BOOLEAN` na tabela `cargos`
- Modificar endpoint `GET /api/cargos` para incluir o campo
- Modificar endpoint `POST /api/cargos` para aceitar o campo
- Modificar endpoint `PUT /api/cargos/:id` para aceitar o campo
- Middleware de autorização para respeitar a flag ao filtrar obras

**Prioridade:** MÉDIA

#### 6. Importação de Componentes via Excel ⏳
**Status:** ⏳ Não implementado

**Endpoints necessários:**
- `POST /api/gruas/:id/componentes/importar` - Importar componentes via Excel/CSV

**Prioridade:** BAIXA

#### 7. Alertas Automáticos ⏳
**Status:** ⏳ Não implementado

**Endpoints necessários:**
- `GET /api/obras/alertas/fim-proximo` - Obras com fim em 60 dias
- `GET /api/certificados/vencendo` - Certificados vencendo (já existe)
- `GET /api/documentos-admissionais/vencendo` - Documentos vencendo
- `GET /api/documentos-sinaleiro/vencendo` - Documentos de sinaleiro vencendo

**Cron Jobs necessários:**
- Verificar obras com fim em 60 dias
- Verificar certificados vencendo (30 dias)
- Verificar documentos admissionais vencendo (30 dias)
- Verificar documentos de sinaleiro vencendo
- Enviar notificações automáticas

**Prioridade:** BAIXA

### 📊 Resumo por Prioridade

#### 🔴 PRIORIDADE ALTA
1. **Upload de Arquivos** - Verificar se está funcionando corretamente
2. **Checklist Diário de Obra** - Implementar completamente

#### 🟡 PRIORIDADE MÉDIA
3. **Manutenções da Obra/Grua** - Implementar completamente
4. **Ordem de Compras** - Implementar completamente
5. **Acesso Global a Obras** - Adicionar campo e lógica

#### 🟢 PRIORIDADE BAIXA
6. **Importação de Componentes via Excel** - Implementar
7. **Alertas Automáticos** - Implementar cron jobs

---

## 📋 Escopo e Planejamento

### 🎯 PRÓXIMOS PASSOS PRIORITÁRIOS

#### Prioridade ALTA 🔴

1. ✅ **Integrar campos obrigatórios na criação de obra** ✅ **CONCLUÍDO**
   - ✅ CNO, ART, Apólice de Seguro - **INTEGRADOS**
   - ✅ Responsável Técnico - **INTEGRADO**
   - ✅ Sinaleiros - **INTEGRADOS**

2. **Implementar acesso global para cargos técnicos**
   - Adicionar campo no banco
   - Modificar componentes de cargo
   - Atualizar lógica de permissões

3. **Documentos Admissionais e Holerites**
   - ✅ Criar páginas e componentes - **CONCLUÍDO**
   - ✅ Reutilizar lógica de certificados - **CONCLUÍDO**

4. **Checklist Diário de Obra**
   - Criar estrutura completa
   - Modelos customizáveis

5. **Manutenções da Obra**
   - Criar estrutura completa
   - Agenda preventiva

#### Prioridade MÉDIA 🟡

6. **Importação de Componentes via Excel**
7. **Fluxo completo de Ordem de Compras**
8. **Integração WhatsApp para aprovações**
9. **Alertas automáticos (60 dias obra, 30 dias documentos)**

### 📝 Checklist Geral de Implementação

#### Prioridade ALTA 🔴
- [x] Campos obrigatórios na Obra (CNO, ART, Apólice) ✅
- [x] Responsável Técnico da Obra ✅
- [x] Cadastro de Sinaleiros ✅
- [x] Documentos do Sinaleiro (obrigatórios com validações) ✅
- [ ] Sistema de alertas (60 dias obra, 30 dias documentos)
- [x] Certificados de Colaboradores ✅
- [x] Documentos Admissionais ✅
- [ ] Regras de Acesso por Função (acesso global)
- [x] Livro de Grua (módulo completo) ✅
- [ ] Checklist Diário de Obra
- [ ] Manutenções da Obra/Grua

#### Prioridade MÉDIA 🟡
- [ ] Ordem de Compras (fluxo completo)
- [ ] Importação de componentes via planilha
- [x] Upload e assinatura de holerite ✅
- [ ] Plano de ação para NCs (Checklist)
- [ ] Agenda preventiva de manutenções
- [ ] Integração WhatsApp (opcional)

#### Prioridade BAIXA 🟢
- [ ] Melhorias de UI/UX
- [ ] Relatórios adicionais de checklist
- [ ] Gráficos de manutenção
- [ ] Exportações personalizadas

---

## 🔧 Infraestrutura Necessária

### Backend - Tabelas a Criar/Modificar

#### Tabelas que precisam ser criadas:
- `checklists_modelos`
- `checklist_itens`
- `checklists_diarios`
- `checklist_respostas`
- `checklist_nc_acoes`
- `manutencoes_ordens`
- `manutencoes_itens`
- `manutencoes_anexos`
- `manutencoes_agenda_preventiva`
- `ordem_compras`
- `ordem_compras_itens`
- `ordem_compras_anexos`
- `ordem_compras_historico`

#### Tabelas que precisam ser modificadas:
- `cargos` - Adicionar `acesso_global_obras BOOLEAN`

---

## 📝 Notas Finais

### Observações Importantes

1. **Validações**: Todos os campos obrigatórios devem ter validação no frontend e backend
2. **Permissões**: Revisar sistema de permissões para novas funcionalidades
3. **Auditoria**: Registrar logs de criação/edição de documentos importantes
4. **Performance**: Considerar paginação para listagens grandes
5. **Storage**: Planejar espaço de armazenamento para uploads de documentos

### Atualização Recente

- ✅ Integração completa dos campos CNO, ART, Apólice no formulário de nova obra
- ✅ Integração completa do Responsável Técnico com API real
- ✅ Integração completa dos Sinaleiros com API real
- ✅ Integração completa de Certificados com API real
- ✅ Criação e integração de Documentos Admissionais
- ✅ Criação e integração de Holerites
- ✅ Validações implementadas para todos os campos obrigatórios

---

**Última atualização:** 2025  
**Responsável:** Equipe de Desenvolvimento  
**Versão:** 1.0.0

