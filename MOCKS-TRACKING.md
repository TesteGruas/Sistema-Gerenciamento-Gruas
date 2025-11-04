# 📊 Tracking de Mocks - Frontend

**Data de Criação:** 2025  
**Objetivo:** Documentar todos os dados mockados no frontend para mensuração de integração

---

## 📋 Resumo Executivo

Este documento lista todos os componentes, páginas e funcionalidades que estão usando dados mockados, permitindo rastrear o progresso de integração com o backend.

---

## ✅ Status de Integração

| Módulo | Componente | Status Mock | Status API | Data Integração | Arquivos Criados |
|--------|-----------|-------------|------------|----------------|------------------|
| Obra | Campos obrigatórios | ✅ Mock | ⏳ Pendente | - | `components/cno-input.tsx`, `components/documento-upload.tsx` |
| Obra | Responsável Técnico | ✅ Mock | ⏳ Pendente | - | `components/responsavel-tecnico-form.tsx` |
| Obra | Sinaleiros | ✅ Mock | ⏳ Pendente | - | `components/sinaleiros-form.tsx`, `lib/mocks/sinaleiros-mocks.ts` |
| Obra | Documentos Sinaleiro | ✅ Mock | ⏳ Pendente | - | `components/documentos-sinaleiro-list.tsx` |
| RH | Certificados | ✅ Mock | ⏳ Pendente | - | `app/dashboard/rh/colaboradores/[id]/certificados/page.tsx`, `lib/mocks/certificados-mocks.ts` |
| RH | Documentos Admissionais | ✅ Mock | ⏳ Pendente | - | - |
| RH | Holerites | ✅ Mock | ⏳ Pendente | - | - |
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

---

## 🏗️ MÓDULO: OBRA

### 1.1. Campos Obrigatórios (CNO, ART, Apólice)

**Arquivo:** `app/dashboard/obras/nova/page.tsx`

**Dados Mockados:**
- ✅ Validação de CNO (apenas frontend)
- ✅ Upload de ART (simulado, não salva no servidor)
- ✅ Upload de Apólice (simulado, não salva no servidor)

**Endpoints Pendentes:**
- `POST /api/obras` - Incluir campos CNO, ART, Apólice
- `POST /api/obras/:id/documentos` - Upload de documentos

**Mock Location:** `lib/mocks/obras-mocks.ts`

---

### 1.2. Responsável Técnico

**Arquivo:** `components/responsavel-tecnico-form.tsx`

**Dados Mockados:**
- ✅ Lista de responsáveis técnicos existentes
- ✅ Busca por CPF/CNPJ (simulada)
- ✅ Salvamento (simulado, não persiste)

**Endpoints Pendentes:**
- `GET /api/responsaveis-tecnicos` - Listar responsáveis
- `POST /api/responsaveis-tecnicos` - Criar responsável
- `PUT /api/responsaveis-tecnicos/:id` - Atualizar responsável
- `GET /api/responsaveis-tecnicos/buscar?cpf=xxx` - Buscar por CPF

**Mock Location:** `lib/mocks/responsaveis-tecnicos-mocks.ts`

---

### 1.3. Sinaleiros

**Arquivo:** `components/sinaleiros-form.tsx`

**Dados Mockados:**
- ✅ Lista de sinaleiros da obra (array local)
- ✅ Salvamento (simulado, não persiste)
- ✅ Validação de máximo 2 sinaleiros (frontend)

**Endpoints Pendentes:**
- `GET /api/obras/:id/sinaleiros` - Listar sinaleiros da obra
- `POST /api/obras/:id/sinaleiros` - Criar sinaleiro
- `PUT /api/sinaleiros/:id` - Atualizar sinaleiro
- `DELETE /api/sinaleiros/:id` - Excluir sinaleiro

**Mock Location:** `lib/mocks/sinaleiros-mocks.ts`

---

### 1.5. Documentos do Sinaleiro

**Arquivo:** `components/documentos-sinaleiro-list.tsx`  
**Arquivo:** `components/documentos-sinaleiro-upload.tsx`

**Dados Mockados:**
- ✅ Lista de documentos obrigatórios (hardcoded)
- ✅ Upload de documentos (simulado, não salva)
- ✅ Status de documentos (pendente/aprovado/vencido)
- ✅ Aprovação de documentos (simulada)

**Endpoints Pendentes:**
- `GET /api/sinaleiros/:id/documentos` - Listar documentos
- `POST /api/sinaleiros/:id/documentos` - Upload documento
- `PUT /api/documentos-sinaleiro/:id/aprovar` - Aprovar documento
- `GET /api/documentos-sinaleiro/vencendo` - Documentos vencendo

**Mock Location:** `lib/mocks/documentos-sinaleiro-mocks.ts`

---

## 🧑‍🤝‍🧑 MÓDULO: RH

### 2.1. Certificados de Colaboradores

**Arquivo:** `app/dashboard/rh/colaboradores/[id]/certificados/page.tsx`  
**Arquivo:** `components/certificado-form.tsx`

**Dados Mockados:**
- ✅ Lista de certificados do colaborador
- ✅ Tipos de certificados (NR06, NR11, etc.)
- ✅ Upload de certificado (simulado)
- ✅ Alertas de vencimento (simulado)

**Endpoints Pendentes:**
- `GET /api/colaboradores/:id/certificados` - Listar certificados
- `POST /api/colaboradores/:id/certificados` - Criar certificado
- `PUT /api/certificados/:id` - Atualizar certificado
- `DELETE /api/certificados/:id` - Excluir certificado
- `GET /api/certificados/vencendo` - Certificados vencendo

**Mock Location:** `lib/mocks/certificados-mocks.ts`

---

### 2.2. Documentos Admissionais

**Arquivo:** `app/dashboard/rh/colaboradores/[id]/documentos-admissionais/page.tsx`

**Dados Mockados:**
- ✅ Lista de documentos admissionais
- ✅ Tipos: ASO, E-Social, Ficha de Registro
- ✅ Upload de documentos (simulado)
- ✅ Alertas de vencimento (simulado)

**Endpoints Pendentes:**
- `GET /api/colaboradores/:id/documentos-admissionais`
- `POST /api/colaboradores/:id/documentos-admissionais`
- `PUT /api/documentos-admissionais/:id`
- `DELETE /api/documentos-admissionais/:id`

**Mock Location:** `lib/mocks/documentos-admissionais-mocks.ts`

---

### 2.3. Holerites

**Arquivo:** `app/dashboard/rh/colaboradores/[id]/holerites/page.tsx`  
**Arquivo:** `components/holerite-upload.tsx`

**Dados Mockados:**
- ✅ Lista de holerites por mês/ano
- ✅ Upload de holerite (simulado)
- ✅ Assinatura digital (simulada, não persiste)

**Endpoints Pendentes:**
- `GET /api/colaboradores/:id/holerites`
- `POST /api/colaboradores/:id/holerites`
- `POST /api/holerites/:id/assinar`
- `GET /api/holerites/:id/download`

**Mock Location:** `lib/mocks/holerites-mocks.ts`

---

## ✅ MÓDULO: CHECKLIST DIÁRIO

### 7.1. Modelos de Checklist

**Arquivo:** `components/checklist-modelo-form.tsx`

**Dados Mockados:**
- ✅ Presets de checklist (Segurança, Equipamentos, etc.)
- ✅ Itens padrão por categoria
- ✅ Salvamento de modelo (simulado)

**Endpoints Pendentes:**
- `GET /api/obras/:id/checklist-modelos`
- `POST /api/checklist-modelos`
- `PUT /api/checklist-modelos/:id`
- `DELETE /api/checklist-modelos/:id`

**Mock Location:** `lib/mocks/checklist-modelos-mocks.ts`

---

### 7.2. Checklist Diário

**Arquivo:** `components/checklist-diario-form.tsx`

**Dados Mockados:**
- ✅ Modelos de checklist disponíveis
- ✅ Salvamento de checklist diário (simulado)
- ✅ Assinatura digital (simulada)

**Endpoints Pendentes:**
- `GET /api/obras/:id/checklists-diarios`
- `POST /api/checklists-diarios`
- `PUT /api/checklists-diarios/:id`
- `POST /api/checklists-diarios/:id/assinar`

**Mock Location:** `lib/mocks/checklist-diarios-mocks.ts`

---

### 7.3. Plano de Ação NC

**Arquivo:** `components/nc-plano-acao.tsx`

**Dados Mockados:**
- ✅ Salvamento de plano de ação (simulado)
- ✅ Status de correção (simulado)

**Endpoints Pendentes:**
- `POST /api/checklist-nc-acoes`
- `PUT /api/checklist-nc-acoes/:id`
- `GET /api/checklist-nc-acoes/pendentes`

**Mock Location:** `lib/mocks/nc-acoes-mocks.ts`

---

## ⚙️ MÓDULO: MANUTENÇÕES

### 8.1. Ordens de Manutenção

**Arquivo:** `components/manutencao-form.tsx`

**Dados Mockados:**
- ✅ Lista de ordens de manutenção
- ✅ Salvamento de ordem (simulado)
- ✅ Status de manutenção (simulado)

**Endpoints Pendentes:**
- `GET /api/gruas/:id/manutencoes`
- `POST /api/manutencoes-ordens`
- `PUT /api/manutencoes-ordens/:id`
- `DELETE /api/manutencoes-ordens/:id`

**Mock Location:** `lib/mocks/manutencoes-mocks.ts`

---

### 8.2. Agenda Preventiva

**Arquivo:** `components/agenda-preventiva.tsx`

**Dados Mockados:**
- ✅ Configurações de agenda preventiva
- ✅ Cálculo de próxima manutenção (simulado)
- ✅ Horímetro atual (simulado)

**Endpoints Pendentes:**
- `GET /api/gruas/:id/agenda-preventiva`
- `POST /api/manutencoes-agenda-preventiva`
- `PUT /api/manutencoes-agenda-preventiva/:id`
- `GET /api/manutencoes/proximas`

**Mock Location:** `lib/mocks/agenda-preventiva-mocks.ts`

---

### 8.3. Execução de Manutenção

**Arquivo:** `components/manutencao-execucao-form.tsx`  
**Arquivo:** `components/pecas-manutencao.tsx`

**Dados Mockados:**
- ✅ Lista de peças do estoque (simulada)
- ✅ Salvamento de execução (simulado)
- ✅ Upload de anexos (simulado)

**Endpoints Pendentes:**
- `GET /api/estoque/pecas` - Listar peças disponíveis
- `POST /api/manutencoes-ordens/:id/executar`
- `POST /api/manutencoes-ordens/:id/anexos`

**Mock Location:** `lib/mocks/manutencoes-execucao-mocks.ts`

---

## 💸 MÓDULO: FINANCEIRO

### 5.1. Ordem de Compras

**Arquivo:** `app/dashboard/financeiro/vendas/ordem-compras/page.tsx`  
**Arquivo:** `components/fluxo-aprovacao-compra.tsx`

**Dados Mockados:**
- ✅ Lista de ordens de compra
- ✅ Fluxo de aprovação (simulado)
- ✅ Status de cada etapa (simulado)

**Endpoints Pendentes:**
- `GET /api/ordem-compras`
- `POST /api/ordem-compras`
- `POST /api/ordem-compras/:id/aprovar-orcamento`
- `POST /api/ordem-compras/:id/enviar-financeiro`
- `POST /api/ordem-compras/:id/registrar-pagamento`
- `POST /api/ordem-compras/:id/aprovar-pagamento`

**Mock Location:** `lib/mocks/ordem-compras-mocks.ts`

---

## 📚 MÓDULO: LIVRO DE GRUA

### 4.1. Livro de Grua

**Arquivo:** `app/dashboard/gruas/[id]/livro/page.tsx`

**Dados Mockados:**
- ✅ Dados técnicos da instalação (simulados)
- ✅ Responsáveis e equipe (simulados)
- ✅ Procedimentos (simulados)
- ✅ Salvamento de livro (simulado)

**Endpoints Pendentes:**
- `GET /api/gruas/:id/livro`
- `POST /api/gruas/:id/livro`
- `PUT /api/gruas/:id/livro/secao/:secao`
- `GET /api/gruas/:id/livro/exportar-pdf`

**Mock Location:** `lib/mocks/livro-grua-mocks.ts`

---

## 📊 Estatísticas de Mock

### Por Status

- **Total de Componentes com Mock:** 18
- **Total de Endpoints Pendentes:** 60+
- **Taxa de Integração:** 0% (todos mockados inicialmente)
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

## 🔄 Processo de Integração

### Checklist de Integração

1. [ ] Identificar componente com mock
2. [ ] Criar/verificar endpoint no backend
3. [ ] Criar API client (`lib/api-*.ts`)
4. [ ] Substituir mock por chamada real
5. [ ] Testar integração
6. [ ] Atualizar este documento
7. [ ] Remover arquivo de mock (opcional)

### Ordem Recomendada de Integração

1. **Obra - Campos Obrigatórios** (prioridade alta)
2. **Obra - Responsável Técnico** (prioridade alta)
3. **Obra - Sinaleiros** (prioridade alta)
4. **RH - Certificados** (prioridade média)
5. **Checklist Diário** (prioridade média)
6. **Manutenções** (prioridade média)
7. **Ordem de Compras** (prioridade baixa)
8. **Livro de Grua** (prioridade baixa)

---

## 📝 Notas

- Todos os mocks estão localizados em `lib/mocks/`
- Cada módulo tem seu arquivo de mock separado
- Os mocks retornam dados no mesmo formato que a API real deveria retornar
- Validações de frontend estão implementadas mesmo com mocks

---

**Última atualização:** 2025  
**Responsável:** Equipe de Desenvolvimento

