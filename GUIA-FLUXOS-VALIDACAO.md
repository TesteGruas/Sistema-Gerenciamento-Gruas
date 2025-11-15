# 📘 Guia Completo de Fluxos e Validação do Sistema

Este documento descreve todos os fluxos principais do sistema, quais usuários precisam ser criados para validar cada funcionalidade e como testar todos os componentes.

---

## 📋 Índice

1. [Usuários Necessários para Validação](#usuários-necessários-para-validação)
2. [Fluxos Principais](#fluxos-principais)
3. [Funcionalidades e Componentes](#funcionalidades-e-componentes)
4. [Checklist de Validação](#checklist-de-validação)

---

## 👥 Usuários Necessários para Validação

### Estrutura de Usuários Recomendada

Para validar completamente o sistema, você precisa criar os seguintes usuários:

| Perfil | Nível | Email Sugerido | Uso Principal |
|--------|-------|----------------|---------------|
| **Diretoria** | 10 | `diretor@empresa.com` | Validação de acesso total e configurações |
| **RH** | 9 | `rh@empresa.com` | Validação de gestão de funcionários e ponto |
| **Financeiro** | 8 | `financeiro@empresa.com` | Validação de módulo financeiro |
| **Funcionário Gestor de Obra** | 7 | `gestor.obra@empresa.com` | Validação de gestão de obras |
| **Supervisor Técnico** | 6 | `supervisor.tecnico@empresa.com` | Validação de gruas e estoque |
| **Operador de Grua** | 5 | `operador.grua@empresa.com` | Validação de operações de campo |
| **Funcionário Básico** | 4 | `funcionario@empresa.com` | Validação de ponto e documentos |
| **Cliente** | 1 | `cliente@empresa.com` | Validação de acesso limitado |

### Usuários Adicionais para Testes Específicos

| Tipo | Quantidade | Perfil | Uso |
|------|------------|--------|-----|
| **Funcionários de Campo** | 3-5 | Funcionário Básico (4) | Testar ponto eletrônico, justificativas |
| **Sinaleiros** | 2-3 | Funcionário Básico (4) | Testar cadastro em obras |
| **Clientes** | 2-3 | Cliente (1) | Testar assinatura de documentos |
| **Supervisores** | 2 | Funcionário Gestor de Obra (7) | Testar aprovações e gestão |

---

## 🔄 Fluxos Principais

### 1. Fluxo: Criar uma Obra Completa

**Objetivo:** Criar uma obra com todos os dados necessários e vincular recursos.

**Usuário Necessário:** `Funcionário Gestor de Obra` (Nível 7) ou `Diretoria` (Nível 10)

**Passos:**

1. **Acessar página de obras**
   - URL: `http://localhost:3000/dashboard/obras`
   - Clicar em "Nova Obra"

2. **Preencher dados básicos**
   - Nome da obra
   - Cliente (selecionar ou criar novo)
   - Status (Em Andamento, Concluída, etc.)
   - Data de início e fim
   - Orçamento
   - Localização

3. **Aba Documentos (Obrigatórios)**
   - **CNO da Obra:** Número do CNO
   - **ART:** Número + Upload do arquivo
   - **Apólice de Seguro:** Número + Upload do arquivo

4. **Aba Responsável Técnico**
   - Selecionar funcionário como responsável técnico
   - Preencher dados do responsável

5. **Aba Sinaleiros**
   - **Sinaleiro Principal (Obrigatório):**
     - Selecionar funcionário existente ou criar novo
     - Upload de documentos obrigatórios:
       - Carteira de Trabalho
       - RG ou CNH
       - Certificado de Sinaleiro (NR-35)
       - Exame Médico ASO
   - **Sinaleiro Reserva (Opcional):**
     - Mesmos documentos do principal

6. **Aba Gruas**
   - Selecionar grua(s) para a obra
   - Definir valor de locação mensal
   - Configurar taxas

7. **Aba Funcionários**
   - Adicionar funcionários alocados na obra
   - Definir funções

8. **Salvar obra**
   - Validar se todos os campos obrigatórios foram preenchidos
   - Obra criada com sucesso

**Validações:**
- ✅ CNO, ART e Apólice são obrigatórios
- ✅ Sinaleiro principal é obrigatório
- ✅ Documentos do sinaleiro são validados
- ✅ Grua deve estar disponível
- ✅ Cliente deve existir

**Componentes Envolvidos:**
- `app/dashboard/obras/nova/page.tsx`
- `components/cno-input.tsx`
- `components/responsavel-tecnico-form.tsx`
- `components/sinaleiros-form.tsx`
- `components/editar-sinaleiro-dialog.tsx`

---

### 2. Fluxo: Bater Ponto Eletrônico

**Objetivo:** Registrar entrada, saída para almoço, volta do almoço e saída do funcionário.

**Usuário Necessário:** `Funcionário Básico` (Nível 4) ou `Operador de Grua` (Nível 5)

**Passos:**

1. **Acessar página de ponto**
   - URL: `http://localhost:3000/dashboard/ponto`
   - Ou via PWA: `http://localhost:3000/pwa/ponto`

2. **Selecionar funcionário**
   - Dropdown com lista de funcionários
   - Selecionar o funcionário que vai bater ponto

3. **Registrar Entrada**
   - Clicar em botão "Entrada" (ícone Play)
   - Sistema registra hora atual automaticamente
   - Exibe confirmação: "Ponto registrado: Entrada às HH:MM"

4. **Registrar Saída para Almoço**
   - Clicar em botão "Saída Almoço" (ícone Coffee)
   - Sistema registra hora atual

5. **Registrar Volta do Almoço**
   - Clicar em botão "Volta Almoço" (ícone Play)
   - Sistema registra hora atual

6. **Registrar Saída**
   - Clicar em botão "Saída" (ícone Square)
   - Sistema registra hora atual
   - Calcula horas trabalhadas automaticamente

**Validações:**
- ✅ Funcionário deve estar cadastrado
- ✅ Não pode registrar saída sem entrada
- ✅ Não pode registrar volta do almoço sem saída para almoço
- ✅ Sistema calcula horas extras automaticamente

**Componentes Envolvidos:**
- `app/dashboard/ponto/page.tsx`
- `app/pwa/ponto/page.tsx`
- `lib/api-ponto-eletronico.ts`

**API Endpoints:**
- `POST /api/ponto-eletronico/registros` - Criar registro
- `PUT /api/ponto-eletronico/registros/:id` - Atualizar registro
- `GET /api/ponto-eletronico/registros` - Listar registros

---

### 3. Fluxo: Assinar Documento (Assinatura Digital)

**Objetivo:** Assinar documento digitalmente usando assinatura desenhada ou upload de arquivo.

**Usuário Necessário:** `Funcionário Básico` (Nível 4), `Cliente` (Nível 1) ou qualquer perfil com permissão `documentos:assinatura`

**Passos:**

#### Opção A: Via Dashboard

1. **Acessar página de assinaturas**
   - URL: `http://localhost:3000/dashboard/assinatura`
   - Visualizar documentos pendentes de assinatura

2. **Selecionar documento**
   - Clicar no documento que precisa ser assinado
   - Verificar informações do documento

3. **Assinar Digitalmente**
   - Clicar em "Assinar Documento"
   - Desenhar assinatura na tela (canvas)
   - Ou fazer upload de arquivo assinado (PDF, imagem)

4. **Confirmar assinatura**
   - Sistema captura geolocalização (se disponível)
   - Salva assinatura
   - Ativa próximo assinante (se houver)

#### Opção B: Via PWA (Mobile)

1. **Acessar via PWA**
   - URL: `http://localhost:3000/pwa/documentos`
   - Login com credenciais

2. **Visualizar documentos pendentes**
   - Lista de documentos aguardando assinatura

3. **Assinar documento**
   - Clicar no documento
   - Desenhar assinatura no touchscreen
   - Ou fazer upload de foto/arquivo

4. **Sincronização offline**
   - Se offline, assinatura é salva localmente
   - Sincroniza automaticamente quando online

**Validações:**
- ✅ Usuário deve estar na lista de assinantes
- ✅ Documento deve estar em status `aguardando_assinatura` ou `em_assinatura`
- ✅ Assinatura deve ser fornecida (desenho ou arquivo)
- ✅ Ordem de assinatura deve ser respeitada

**Componentes Envolvidos:**
- `app/dashboard/assinatura/page.tsx`
- `app/dashboard/assinatura/[id]/page.tsx`
- `app/pwa/documentos/page.tsx`
- `components/signature-pad.tsx`
- `lib/api-assinaturas.ts`

**API Endpoints:**
- `POST /api/assinaturas/assinar/:id` - Assinar documento
- `POST /api/assinaturas/:id/upload-assinado` - Upload de arquivo assinado
- `GET /api/assinaturas/documentos` - Listar documentos

---

### 4. Fluxo: Aprovar Horas Extras via WhatsApp

**Objetivo:** Aprovar ou rejeitar horas extras através de mensagem WhatsApp.

**Usuário Necessário:** `Funcionário Gestor de Obra` (Nível 7) ou `RH` (Nível 9) com telefone WhatsApp cadastrado

**Passos:**

1. **Configurar WhatsApp**
   - Acessar: `http://localhost:3000/dashboard/aprovacoes-horas-extras/whatsapp`
   - Conectar instância WhatsApp (gerar QR Code)
   - Aguardar conexão

2. **Funcionário registra horas extras**
   - Funcionário bate ponto com horas extras
   - Sistema detecta horas extras automaticamente

3. **Sistema envia notificação WhatsApp**
   - Sistema identifica supervisor responsável
   - Envia mensagem via WhatsApp com:
     - Nome do funcionário
     - Data e horários
     - Total de horas extras
     - Link para aprovar/rejeitar

4. **Supervisor responde via WhatsApp**
   - **Para aprovar:** Responder `APROVAR` ou `SIM`
   - **Para rejeitar:** Responder `REJEITAR` ou `NÃO`
   - Opcionalmente incluir observações

5. **Sistema processa resposta**
   - Atualiza status do registro
   - Envia confirmação para funcionário
   - Registra no histórico

**Validações:**
- ✅ WhatsApp deve estar conectado
- ✅ Supervisor deve ter telefone cadastrado
- ✅ Registro deve ter horas extras > 0
- ✅ Resposta deve ser válida (APROVAR/REJEITAR)

**Componentes Envolvidos:**
- `app/dashboard/aprovacoes-horas-extras/whatsapp/page.tsx`
- `components/whatsapp-relatorios.tsx`
- `lib/whatsapp-evolution-service.ts`

**API Endpoints:**
- `GET /api/whatsapp/instance` - Obter instância
- `POST /api/whatsapp/sync` - Sincronizar status
- `POST /api/whatsapp/webhook` - Receber mensagens

---

### 5. Fluxo: Criar Justificativa de Ausência

**Objetivo:** Funcionário justificar ausência ou atraso no ponto.

**Usuário Necessário:** `Funcionário Básico` (Nível 4) ou `Operador de Grua` (Nível 5)

**Passos:**

1. **Acessar página de ponto**
   - URL: `http://localhost:3000/dashboard/ponto`
   - Ou via PWA: `http://localhost:3000/pwa/ponto`

2. **Abrir modal de justificativa**
   - Clicar em botão "Nova Justificativa"
   - Ou clicar em registro sem ponto completo

3. **Preencher dados**
   - Selecionar funcionário
   - Selecionar data
   - Selecionar tipo:
     - Falta
     - Atraso
     - Saída Antecipada
     - Outros
   - Descrever motivo

4. **Anexar comprovante (opcional)**
   - Upload de arquivo (atestado, declaração, etc.)

5. **Enviar justificativa**
   - Sistema cria registro de justificativa
   - Status: `pendente`

6. **Aguardar aprovação**
   - Supervisor/RH visualiza justificativa
   - Aprova ou rejeita
   - Funcionário recebe notificação

**Validações:**
- ✅ Data não pode ser futura
- ✅ Motivo é obrigatório
- ✅ Funcionário deve existir
- ✅ Não pode ter justificativa duplicada para mesma data

**Componentes Envolvidos:**
- `app/dashboard/ponto/page.tsx`
- `lib/api-ponto-eletronico.ts` (apiJustificativas)

**API Endpoints:**
- `POST /api/ponto-eletronico/justificativas` - Criar justificativa
- `GET /api/ponto-eletronico/justificativas` - Listar justificativas
- `PATCH /api/ponto-eletronico/justificativas/:id/aprovar` - Aprovar
- `PATCH /api/ponto-eletronico/justificativas/:id/rejeitar` - Rejeitar

---

### 6. Fluxo: Gerenciar Estoque

**Objetivo:** Registrar movimentações de estoque (entrada, saída, transferência).

**Usuário Necessário:** `Supervisor Técnico` (Nível 6), `Funcionário Gestor de Obra` (Nível 7) ou `Diretoria` (Nível 10)

**Passos:**

1. **Acessar página de estoque**
   - URL: `http://localhost:3000/dashboard/estoque`

2. **Visualizar itens**
   - Lista de itens cadastrados
   - Filtros por categoria, status, etc.

3. **Criar novo item**
   - Clicar em "Novo Item"
   - Preencher:
     - Nome
     - Categoria
     - Unidade de medida
     - Quantidade inicial
     - Valor unitário
     - Status

4. **Registrar movimentação**
   - Selecionar item
   - Clicar em "Nova Movimentação"
   - Tipo:
     - **Entrada:** Compra, doação, devolução
     - **Saída:** Uso, venda, perda
     - **Transferência:** Entre obras/locais
   - Quantidade
   - Observações

5. **Visualizar histórico**
   - Histórico de movimentações por item
   - Relatórios de estoque

**Validações:**
- ✅ Quantidade não pode ser negativa
- ✅ Item deve existir
- ✅ Movimentação de saída não pode exceder estoque disponível

**Componentes Envolvidos:**
- `app/dashboard/estoque/page.tsx`
- `lib/api-estoque.ts`

---

### 7. Fluxo: Livro de Grua (Registrar Atividade)

**Objetivo:** Registrar atividades, manutenções e checklists da grua.

**Usuário Necessário:** `Operador de Grua` (Nível 5), `Supervisor Técnico` (Nível 6) ou `Funcionário Gestor de Obra` (Nível 7)

**Passos:**

1. **Acessar Livro de Grua**
   - URL: `http://localhost:3000/dashboard/livros-gruas`
   - Ou via grua específica: `/dashboard/gruas/[id]/livro`

2. **Selecionar grua**
   - Lista de gruas disponíveis
   - Filtrar por obra, status, etc.

3. **Criar novo registro**
   - Clicar em "Novo Registro"
   - Preencher:
     - Data e hora
     - Tipo de atividade:
       - Operação
       - Manutenção Preventiva
       - Manutenção Corretiva
       - Checklist Diário
       - Inspeção
     - Descrição
     - Horímetro (se aplicável)
     - Observações

4. **Anexar documentos (opcional)**
   - Fotos
   - Relatórios
   - Notas fiscais

5. **Salvar registro**
   - Registro salvo no livro da grua
   - Histórico atualizado

**Validações:**
- ✅ Grua deve existir
- ✅ Data não pode ser futura
- ✅ Horímetro deve ser maior que o anterior

**Componentes Envolvidos:**
- `app/dashboard/livros-gruas/page.tsx`
- `app/dashboard/gruas/[id]/livro/page.tsx`
- `components/livro-grua-list.tsx`
- `lib/api-livro-grua.ts`

---

### 8. Fluxo: Aprovar Justificativas (RH)

**Objetivo:** RH aprovar ou rejeitar justificativas de funcionários.

**Usuário Necessário:** `RH` (Nível 9) ou `Diretoria` (Nível 10)

**Passos:**

1. **Acessar página de ponto**
   - URL: `http://localhost:3000/dashboard/ponto`

2. **Visualizar justificativas pendentes**
   - Aba "Justificativas"
   - Filtrar por status: `pendente`

3. **Analisar justificativa**
   - Clicar na justificativa
   - Ver detalhes:
     - Funcionário
     - Data
     - Tipo
     - Motivo
     - Comprovante (se houver)

4. **Aprovar ou Rejeitar**
   - **Aprovar:**
     - Clicar em "Aprovar"
     - Opcionalmente adicionar observações
     - Status muda para `aprovada`
   - **Rejeitar:**
     - Clicar em "Rejeitar"
     - Informar motivo da rejeição
     - Status muda para `rejeitada`

5. **Notificação**
   - Funcionário recebe notificação
   - Email/WhatsApp (se configurado)

**Validações:**
- ✅ Apenas RH/Diretoria pode aprovar
- ✅ Justificativa deve estar pendente
- ✅ Motivo de rejeição é obrigatório ao rejeitar

**Componentes Envolvidos:**
- `app/dashboard/ponto/page.tsx`
- `lib/api-ponto-eletronico.ts`

---

### 9. Fluxo: Criar Orçamento

**Objetivo:** Criar orçamento para cliente com detalhamento de serviços.

**Usuário Necessário:** `Financeiro` (Nível 8), `Funcionário Gestor de Obra` (Nível 7) ou `Diretoria` (Nível 10)

**Passos:**

1. **Acessar página de orçamentos**
   - URL: `http://localhost:3000/dashboard/orcamentos`

2. **Criar novo orçamento**
   - Clicar em "Novo Orçamento"
   - Preencher dados básicos:
     - Cliente
     - Obra (se já existir)
     - Equipamento (grua)
     - Período de locação

3. **Configurar valores**
   - Valor de locação mensal
     - Valor do operador
     - Valor do sinaleiro
     - Valor de manutenção
   - Total mensal
   - Prazo em meses
   - Total geral

4. **Adicionar condições**
   - Condições comerciais
   - Responsabilidades do cliente
   - Escopo incluso
   - Observações

5. **Gerar PDF**
   - Visualizar prévia
   - Gerar PDF para envio
   - Enviar para cliente

6. **Acompanhar status**
   - Rascunho
   - Enviado
   - Aprovado
   - Rejeitado

**Validações:**
- ✅ Cliente é obrigatório
- ✅ Valores devem ser positivos
- ✅ Período deve ser válido

**Componentes Envolvidos:**
- `app/dashboard/orcamentos/page.tsx`
- `components/orcamento-pdf.tsx`
- `lib/api-orcamentos.ts`

---

### 10. Fluxo: Cadastrar Funcionário (RH)

**Objetivo:** Cadastrar novo funcionário com todos os dados necessários.

**Usuário Necessário:** `RH` (Nível 9) ou `Diretoria` (Nível 10)

**Passos:**

1. **Acessar página de funcionários**
   - URL: `http://localhost:3000/dashboard/funcionarios`

2. **Criar novo funcionário**
   - Clicar em "Novo Funcionário"
   - Preencher dados pessoais:
     - Nome completo
     - CPF
     - RG
     - Data de nascimento
     - Telefone
     - Email
     - Endereço

3. **Dados profissionais**
   - Cargo
     - Turno
     - Data de admissão
     - Salário
     - Status (Ativo/Inativo)

4. **Criar usuário do sistema (opcional)**
   - Marcar "Criar usuário"
   - Definir senha inicial
   - Selecionar perfil de acesso

5. **Documentos admissionais**
   - Upload de documentos:
     - Carteira de Trabalho
     - RG
     - CPF
     - Comprovante de Residência
     - Certificados
     - Exames médicos

6. **Salvar funcionário**
   - Sistema cria funcionário
   - Cria usuário (se solicitado)
   - Envia notificação

**Validações:**
- ✅ CPF deve ser único
- ✅ Email deve ser único (se criar usuário)
- ✅ Documentos obrigatórios devem ser anexados
- ✅ Cargo deve existir

**Componentes Envolvidos:**
- `app/dashboard/funcionarios/page.tsx`
- `lib/api-funcionarios.ts`

---

## 🎯 Funcionalidades e Componentes

### Módulo: Obras

#### Funcionalidades
- ✅ Criar obra
- ✅ Editar obra
- ✅ Visualizar obra
- ✅ Excluir obra
- ✅ Cadastrar sinaleiros
- ✅ Gerenciar documentos (CNO, ART, Apólice)
- ✅ Definir responsável técnico
- ✅ Vincular gruas
- ✅ Alocar funcionários
- ✅ Adicionar custos mensais
- ✅ Visualizar histórico

#### Componentes
- `app/dashboard/obras/page.tsx` - Lista de obras
- `app/dashboard/obras/nova/page.tsx` - Criar obra
- `app/dashboard/obras/[id]/page.tsx` - Detalhes da obra
- `components/cno-input.tsx` - Input de CNO
- `components/responsavel-tecnico-form.tsx` - Formulário de responsável
- `components/sinaleiros-form.tsx` - Formulário de sinaleiros
- `components/editar-sinaleiro-dialog.tsx` - Editar sinaleiro

#### Usuários para Validação
- **Criar/Editar:** Funcionário Gestor de Obra (7) ou Diretoria (10)
- **Visualizar:** Todos os perfis com `obras:visualizar`
- **Excluir:** Funcionário Gestor de Obra (7) ou Diretoria (10)

---

### Módulo: Ponto Eletrônico

#### Funcionalidades
- ✅ Registrar ponto (entrada, almoço, saída)
- ✅ Visualizar registros
- ✅ Editar registros (com justificativa)
- ✅ Criar justificativas
- ✅ Aprovar/Rejeitar justificativas
- ✅ Aprovar horas extras
- ✅ Relatórios de frequência
- ✅ Exportar dados

#### Componentes
- `app/dashboard/ponto/page.tsx` - Página principal
- `app/dashboard/ponto/aprovacoes/page.tsx` - Aprovações
- `app/dashboard/ponto/relatorios/page.tsx` - Relatórios
- `app/pwa/ponto/page.tsx` - PWA mobile
- `components/aprovacao-horas-extras-dialog.tsx` - Dialog de aprovação
- `lib/api-ponto-eletronico.ts` - API client

#### Usuários para Validação
- **Registrar ponto:** Funcionário Básico (4), Operador de Grua (5)
- **Aprovar justificativas:** RH (9), Diretoria (10)
- **Aprovar horas extras:** Funcionário Gestor de Obra (7), RH (9), Diretoria (10)
- **Visualizar todos:** RH (9), Funcionário Gestor de Obra (7), Diretoria (10)

---

### Módulo: Assinaturas Digitais

#### Funcionalidades
- ✅ Criar documento para assinatura
- ✅ Definir ordem de assinantes
- ✅ Assinar digitalmente (desenho)
- ✅ Upload de arquivo assinado
- ✅ Visualizar histórico de assinaturas
- ✅ Notificações de assinatura pendente
- ✅ Geolocalização na assinatura

#### Componentes
- `app/dashboard/assinatura/page.tsx` - Lista de documentos
- `app/dashboard/assinatura/[id]/page.tsx` - Assinar documento
- `app/pwa/documentos/page.tsx` - PWA mobile
- `components/signature-pad.tsx` - Canvas de assinatura
- `lib/api-assinaturas.ts` - API client

#### Usuários para Validação
- **Criar documento:** Funcionário Gestor de Obra (7), Diretoria (10)
- **Assinar:** Qualquer perfil com `documentos:assinatura`
- **Visualizar:** Todos os perfis com `documentos:visualizar`

---

### Módulo: Gruas

#### Funcionalidades
- ✅ Cadastrar grua
- ✅ Editar grua
- ✅ Visualizar grua
- ✅ Excluir grua
- ✅ Gerenciar componentes
- ✅ Visualizar histórico
- ✅ Controle de status (disponível, em obra, manutenção)

#### Componentes
- `app/dashboard/gruas/page.tsx` - Lista de gruas
- `app/dashboard/gruas/[id]/page.tsx` - Detalhes da grua
- `app/dashboard/gruas/[id]/componentes/page.tsx` - Componentes
- `lib/api-gruas.ts` - API client

#### Usuários para Validação
- **Criar/Editar:** Supervisor Técnico (6), Funcionário Gestor de Obra (7), Diretoria (10)
- **Visualizar:** Todos os perfis com `gruas:visualizar`
- **Excluir:** Supervisor Técnico (6), Funcionário Gestor de Obra (7), Diretoria (10)

---

### Módulo: Livro de Grua

#### Funcionalidades
- ✅ Registrar atividade
- ✅ Registrar manutenção
- ✅ Criar checklist
- ✅ Visualizar histórico
- ✅ Filtrar por grua/obra/data
- ✅ Exportar relatórios

#### Componentes
- `app/dashboard/livros-gruas/page.tsx` - Lista de registros
- `components/livro-grua-list.tsx` - Componente de lista
- `lib/api-livro-grua.ts` - API client

#### Usuários para Validação
- **Criar registro:** Operador de Grua (5), Supervisor Técnico (6), Funcionário Gestor de Obra (7)
- **Visualizar:** Todos os perfis com `livros_gruas:visualizar`
- **Editar:** Supervisor Técnico (6), Funcionário Gestor de Obra (7), Diretoria (10)

---

### Módulo: Estoque

#### Funcionalidades
- ✅ Cadastrar item
- ✅ Editar item
- ✅ Registrar movimentação (entrada/saída/transferência)
- ✅ Visualizar histórico
- ✅ Relatórios de estoque
- ✅ Alertas de estoque baixo

#### Componentes
- `app/dashboard/estoque/page.tsx` - Página principal
- `lib/api-estoque.ts` - API client

#### Usuários para Validação
- **Gerenciar:** Supervisor Técnico (6), Funcionário Gestor de Obra (7), Diretoria (10)
- **Visualizar:** Todos os perfis com `estoque:visualizar`
- **Movimentar:** Supervisor Técnico (6), Funcionário Gestor de Obra (7), Diretoria (10)

---

### Módulo: Clientes

#### Funcionalidades
- ✅ Cadastrar cliente
- ✅ Editar cliente
- ✅ Visualizar cliente
- ✅ Excluir cliente
- ✅ Buscar clientes
- ✅ Vincular obras
- ✅ Histórico de relacionamento

#### Componentes
- `app/dashboard/clientes/page.tsx` - Página principal
- `lib/api-clientes.ts` - API client

#### Usuários para Validação
- **Criar/Editar:** Funcionário Gestor de Obra (7), Financeiro (8), Diretoria (10)
- **Visualizar:** Todos os perfis com `clientes:visualizar`
- **Excluir:** Funcionário Gestor de Obra (7), Diretoria (10)

---

### Módulo: Financeiro

#### Funcionalidades
- ✅ Criar orçamento
- ✅ Gerenciar vendas
- ✅ Controle de compras
- ✅ Gestão de locações
- ✅ Relatórios financeiros
- ✅ Contas a pagar/receber

#### Componentes
- `app/dashboard/financeiro/page.tsx` - Página principal
- `app/dashboard/orcamentos/page.tsx` - Orçamentos
- `components/orcamento-pdf.tsx` - PDF de orçamento
- `lib/api-financial.ts` - API client

#### Usuários para Validação
- **Acesso completo:** Financeiro (8), Diretoria (10)
- **Criar orçamento:** Funcionário Gestor de Obra (7), Financeiro (8), Diretoria (10)
- **Visualizar:** Todos os perfis com `financeiro:visualizar`

---

### Módulo: RH

#### Funcionalidades
- ✅ Cadastrar funcionário
- ✅ Editar funcionário
- ✅ Visualizar funcionário
- ✅ Gerenciar documentos admissionais
- ✅ Gerenciar certificados
- ✅ Gerar holerites
- ✅ Relatórios RH
- ✅ Histórico de funcionário

#### Componentes
- `app/dashboard/funcionarios/page.tsx` - Lista de funcionários
- `app/dashboard/rh-completo/page.tsx` - Dashboard RH
- `lib/api-funcionarios.ts` - API client

#### Usuários para Validação
- **Acesso completo:** RH (9), Diretoria (10)
- **Visualizar próprio perfil:** Todos os funcionários
- **Editar próprio perfil:** Funcionário Básico (4) e acima

---

### Módulo: Notificações

#### Funcionalidades
- ✅ Criar notificação
- ✅ Visualizar notificações
- ✅ Marcar como lida
- ✅ Filtrar notificações
- ✅ Notificações em tempo real
- ✅ Badge de não lidas

#### Componentes
- `app/dashboard/notificacoes/page.tsx` - Página principal
- `components/notifications-dropdown.tsx` - Dropdown no header
- `lib/api-notificacoes.ts` - API client

#### Usuários para Validação
- **Criar:** Todos os perfis com `notificacoes:gerenciar`
- **Visualizar:** Todos os perfis com `notificacoes:visualizar`

---

### Módulo: WhatsApp Aprovações

#### Funcionalidades
- ✅ Conectar instância WhatsApp
- ✅ Gerar QR Code
- ✅ Enviar notificações de aprovação
- ✅ Receber respostas via WhatsApp
- ✅ Processar aprovações/rejeições
- ✅ Relatórios de mensagens

#### Componentes
- `app/dashboard/aprovacoes-horas-extras/whatsapp/page.tsx` - Página principal
- `components/whatsapp-relatorios.tsx` - Relatórios
- `lib/whatsapp-evolution-service.ts` - Serviço WhatsApp

#### Usuários para Validação
- **Configurar:** Diretoria (10)
- **Receber aprovações:** Funcionário Gestor de Obra (7), RH (9), Diretoria (10)
- **Visualizar relatórios:** Funcionário Gestor de Obra (7), RH (9), Diretoria (10)

---

## ✅ Checklist de Validação

### Setup Inicial

- [ ] Criar 8 usuários (um de cada perfil)
- [ ] Configurar WhatsApp (se necessário)
- [ ] Criar pelo menos 2 clientes
- [ ] Criar pelo menos 3 funcionários básicos
- [ ] Cadastrar pelo menos 2 gruas
- [ ] Criar pelo menos 1 obra completa

### Validação de Fluxos

#### Fluxo 1: Obra
- [ ] Criar obra com todos os campos obrigatórios
- [ ] Cadastrar sinaleiros com documentos
- [ ] Vincular gruas à obra
- [ ] Alocar funcionários na obra
- [ ] Visualizar obra criada

#### Fluxo 2: Ponto Eletrônico
- [ ] Registrar entrada
- [ ] Registrar saída para almoço
- [ ] Registrar volta do almoço
- [ ] Registrar saída
- [ ] Verificar cálculo de horas
- [ ] Criar justificativa
- [ ] Aprovar justificativa (como RH)

#### Fluxo 3: Assinatura Digital
- [ ] Criar documento para assinatura
- [ ] Adicionar assinantes
- [ ] Assinar documento (desenho)
- [ ] Assinar documento (upload)
- [ ] Verificar ordem de assinatura
- [ ] Visualizar histórico

#### Fluxo 4: WhatsApp
- [ ] Conectar instância WhatsApp
- [ ] Gerar QR Code
- [ ] Aguardar conexão
- [ ] Criar registro com horas extras
- [ ] Receber mensagem WhatsApp
- [ ] Responder via WhatsApp
- [ ] Verificar aprovação no sistema

#### Fluxo 5: Estoque
- [ ] Cadastrar item
- [ ] Registrar entrada
- [ ] Registrar saída
- [ ] Verificar estoque atualizado
- [ ] Visualizar histórico

#### Fluxo 6: Livro de Grua
- [ ] Selecionar grua
- [ ] Criar registro de atividade
- [ ] Criar registro de manutenção
- [ ] Visualizar histórico da grua

#### Fluxo 7: Orçamento
- [ ] Criar orçamento
- [ ] Preencher valores
- [ ] Gerar PDF
- [ ] Enviar para cliente

#### Fluxo 8: Funcionário
- [ ] Criar funcionário
- [ ] Criar usuário do sistema
- [ ] Anexar documentos
- [ ] Visualizar funcionário criado

### Validação de Permissões

- [ ] Verificar que Cliente (1) não acessa obras de outros
- [ ] Verificar que Funcionário Básico (4) não acessa financeiro
- [ ] Verificar que RH (9) não acessa obras
- [ ] Verificar que Financeiro (8) não acessa ponto
- [ ] Verificar que Gestor de Obra (7) não acessa financeiro
- [ ] Verificar que Diretoria (10) acessa tudo

### Validação de Componentes

- [ ] Testar todos os formulários
- [ ] Testar todos os dialogs
- [ ] Testar todos os modals
- [ ] Testar paginação
- [ ] Testar filtros
- [ ] Testar busca
- [ ] Testar exportação
- [ ] Testar upload de arquivos
- [ ] Testar assinatura digital (canvas)
- [ ] Testar PWA mobile

---

## 🔧 Comandos Úteis para Testes

### Criar Usuários de Teste

```sql
-- Exemplo: Criar usuário Diretoria
INSERT INTO usuarios (email, nome, perfil_id) 
VALUES ('diretor@empresa.com', 'Diretor Teste', 1);

-- Exemplo: Criar usuário RH
INSERT INTO usuarios (email, nome, perfil_id) 
VALUES ('rh@empresa.com', 'RH Teste', 2);
```

### Seed de Dados

```bash
# Executar migration de seed
cd backend-api
npm run migrate:seed
```

### Limpar Dados de Teste

```sql
-- Cuidado: Isso apaga todos os dados!
TRUNCATE TABLE registros_ponto CASCADE;
TRUNCATE TABLE justificativas CASCADE;
TRUNCATE TABLE obras CASCADE;
```

---

## 📞 Suporte

Para dúvidas sobre fluxos ou validação, consulte:
- `ESTRUTURA-NIVEIS-ACESSO.md` - Estrutura de permissões
- `GUIA-TESTE-SINALEIROS.md` - Testes de sinaleiros
- `GUIA-TESTE-WHATSAPP.md` - Testes de WhatsApp

---

**Última Atualização:** 2025-01-XX  
**Versão:** 1.0  
**Autor:** Sistema de Gestão de Gruas

