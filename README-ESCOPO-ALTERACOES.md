# 📋 README - Alterações e Criações de Escopo do Projeto de Gruas

**Data:** 2025  
**Status:** 🚧 Em Planejamento

---

## 📊 Resumo Executivo

Este documento lista todas as alterações e novas funcionalidades que precisam ser implementadas no sistema de gerenciamento de gruas, organizadas por módulo e prioridade.

---

## 🏗️ 1. MÓDULO: OBRA (Cadastro e Gestão)

### ✅ 1.1. Novos Campos Obrigatórios no Cadastro

- [ ] **CNO da Obra** (CNPJ/Documento da Obra)
  - Campo obrigatório no formulário de criação/edição
  - Validação de CNPJ
  - Exibição na listagem e detalhes da obra

- [ ] **ART da Obra** (Anotação de Responsabilidade Técnica)
  - Campo obrigatório
  - Campo de texto para número da ART
  - Upload de documento ART (PDF)

- [ ] **Apólice de Seguro da Obra**
  - Campo obrigatório
  - Número da apólice
  - Upload de documento (PDF)

**Arquivos a modificar:**
- `app/dashboard/obras/nova/page.tsx`
- `app/dashboard/obras/[id]/page.tsx`
- `backend-api/src/routes/obras.js` (validar campos obrigatórios)
- `backend-api/database/migrations/` (adicionar colunas na tabela obras)

---

### ✅ 1.2. Responsável Técnico da Obra

- [ ] **Cadastro do Responsável Técnico**
  - Formulário inline na criação da obra
  - Campos: Nome, CPF/CNPJ, CREA (se aplicável), Email, Telefone
  - Opção de vincular responsável existente ou cadastrar novo
  - Exibição na página de detalhes da obra

**Arquivos a criar/modificar:**
- Componente: `components/responsavel-tecnico-form.tsx`
- Modificar: `app/dashboard/obras/nova/page.tsx`
- Backend: Criar tabela `responsaveis_tecnicos` ou adicionar na tabela `obras`

---

### ✅ 1.3. Cadastro de Sinaleiros (até 2 por obra)

- [ ] **Formulário de Sinaleiros**
  - Sinaleiro Principal (obrigatório)
  - Sinaleiro Reserva (opcional)
  - Campos: Nome, RG ou CPF, Telefone, Email
  - Cliente pode editar os dados caso informe os sinaleiros

### ✅ 1.5. Documentos do Sinaleiro (Obrigatórios)

- [ ] **Listagem de Documentos para Sinaleiro - Obrigatório**
  - Tipos exigidos:
    - RG/CPF (frente e verso) - **OBRIGATÓRIO**
    - Comprovante de vínculo - **OBRIGATÓRIO**
    - Certificado aplicável (se houver) - Opcional
  - Validações:
    - Presença obrigatória dos documentos exigidos
    - Tipos de arquivo permitidos (PDF, JPG, PNG)
    - Tamanho máximo por arquivo (ex: 5MB)
    - Validação de formato (verificar se é realmente documento)
  - Exibição:
    - Status: Pendente / Aprovado / Vencido
    - Data de validade (quando aplicável)
    - Preview dos documentos
    - Histórico de uploads e aprovações
  - Permissões:
    - Admin e Cliente: visualizam e podem aprovar
    - Auditor: somente leitura
  - Alertas:
    - 30 dias antes do vencimento (quando aplicável)

**Arquivos a criar/modificar:**
- Componente: `components/sinaleiros-form.tsx`
- Componente: `components/documentos-sinaleiro-list.tsx`
- Componente: `components/documentos-sinaleiro-upload.tsx`
- Modificar: `app/dashboard/obras/nova/page.tsx`
- Modificar: `app/dashboard/obras/[id]/page.tsx`
- Backend: Criar tabela `documentos_sinaleiro`
- Backend: Endpoints CRUD para documentos de sinaleiro
- Backend: Validação de tipos e tamanhos de arquivo
- Criar: `scripts/verificar-documentos-sinaleiro-vencendo.js` (cron job)

---

### ✅ 1.4. Sistema de Alerta de Fim de Obra

- [ ] **Notificação Automática**
  - Envio automático 60 dias antes do fim da obra
  - Integração com sistema de notificações interno
  - Integração opcional com WhatsApp
  - Configuração de destinatários (cliente, responsável técnico, etc.)

**Arquivos a criar/modificar:**
- Criar: `lib/alertas-obras.ts` (lógica de cálculo de 60 dias)
- Criar: `scripts/verificar-fim-obras.js` (cron job)
- Modificar: `hooks/useNotificacoes.ts` (adicionar tipo de notificação)
- Backend: Criar endpoint para notificações de fim de obra

---

## 🧑‍🤝‍🧑 2. MÓDULO: RH – Colaboradores e Documentos

### ✅ 2.1. Aba de Certificados para Colaboradores

- [ ] **Estrutura de Certificados**
  - Campos: Nome do certificado, Data de validade, Upload de arquivo
  - Listagem de certificados por colaborador
  - Alertas automáticos 30 dias antes do vencimento

- [ ] **Tipos de Certificados Implementados:**
  - Ficha de EPI
  - Ordem de Serviço
  - NR06, NR11, NR12, NR18, NR35
  - Certificado de Especificação

**Arquivos a criar/modificar:**
- Criar: `app/dashboard/rh/colaboradores/[id]/certificados/page.tsx`
- Criar: `components/certificado-form.tsx`
- Criar: `lib/api-certificados.ts`
- Backend: Criar tabela `certificados_colaboradores`
- Backend: Criar endpoints CRUD de certificados
- Criar: `scripts/verificar-certificados-vencendo.js` (cron job)

---

### ✅ 2.2. Documentos Admissionais

- [ ] **Estrutura de Documentos Admissionais**
  - Campos: Tipo de documento, Data de validade, Upload de arquivo
  - Tipos: ASO, E-Social, Ficha de Registro
  - Mesma lógica de alerta de 30 dias antes do vencimento

**Arquivos a criar/modificar:**
- Criar: `app/dashboard/rh/colaboradores/[id]/documentos-admissionais/page.tsx`
- Criar: `components/documento-admissional-form.tsx`
- Criar: `lib/api-documentos-admissionais.ts`
- Backend: Criar tabela `documentos_admissionais`
- Backend: Criar endpoints CRUD

---

### ✅ 2.3. Documentos Mensais - Holerite

- [ ] **Upload de Holerite**
  - Upload mensal de holerite
  - Assinatura digital do colaborador
  - Acesso permitido para: Admin, Cliente e Funcionário
  - Histórico de holerites por colaborador

**Arquivos a criar/modificar:**
- Criar: `app/dashboard/rh/colaboradores/[id]/holerites/page.tsx`
- Criar: `components/holerite-upload.tsx`
- Criar: `components/assinatura-holerite.tsx` (usar signature-pad existente)
- Criar: `lib/api-holerites.ts`
- Backend: Criar tabela `holerites`
- Backend: Endpoint para upload e assinatura

---

### ✅ 2.4. Gestão de Cargos/Funções (Criação Personalizada)

- [ ] **Sistema de Cargos Customizáveis**
  - Criação, edição e exclusão de cargos
  - Lista de cargos padrão:
    - Montador de grua
    - Operador de grua
    - Sinaleiro
    - Auxiliar/Técnico em eletromecânica
    - Analista de RH / Financeiro
    - Soldador
    - Ajudante geral
    - Outros (criar personalizado)

**Arquivos a criar/modificar:**
- Verificar se já existe: `app/dashboard/rh/cargos/page.tsx`
- Verificar se já existe: `components/create-cargo-dialog.tsx`
- Verificar se já existe: `components/edit-cargo-dialog.tsx`
- Backend: Verificar tabela `cargos` e endpoints

---

### ✅ 2.5. Regras de Acesso por Função (Escopo Global de Obra)

- [ ] **Acesso Global a Todas as Obras**
  - **Cargos com acesso global:**
    - Técnico em eletromecânica - **Acesso a todas as obras**
    - Auxiliar em eletromecânica - **Acesso a todas as obras**
  - **Parametrização:**
    - Flag `acesso_global_obras` por cargo (boolean)
    - Configuração no cadastro/edição de cargo
    - Visualização clara no perfil do colaborador
  - **Implementação:**
    - Middlewares/guards atualizados para respeitar a flag
    - Bypass de filtro por obra quando `acesso_global_obras = true`
    - Validação em todas as rotas de obras
    - Log de acesso para auditoria

**Arquivos a criar/modificar:**
- Modificar: `components/create-cargo-dialog.tsx` (adicionar checkbox de acesso global)
- Modificar: `components/edit-cargo-dialog.tsx` (adicionar checkbox de acesso global)
- Modificar: `components/protected-route.tsx` ou middleware de permissões
- Modificar: `hooks/use-permissions.ts` (adicionar lógica de acesso global)
- Backend: Adicionar coluna `acesso_global_obras BOOLEAN DEFAULT FALSE` na tabela `cargos`
- Backend: Atualizar ACL (Access Control List) para verificar flag
- Backend: Middleware de autorização para obras respeitar flag
- Backend: Endpoint para listar obras (filtrar ou não baseado na flag)

---

## ⚙️ 3. MÓDULO: GRUAS / EQUIPAMENTOS

### ✅ 3.1. Importação de Componentes via Planilha

- [ ] **Importação Excel/CSV**
  - Upload de planilha com componentes de grua
  - Validação de formato e dados
  - Mapeamento de colunas (nome, SKU, quantidade, etc.)
  - Preview antes de importar
  - Relatório de erros/sucessos

**Arquivos a criar:**
- Criar: `components/importar-componentes-grua.tsx`
- Criar: `lib/importar-excel.ts` (utilitário de parsing)
- Criar: `app/dashboard/gruas/[id]/componentes/importar/page.tsx`
- Backend: Endpoint `POST /api/gruas/:id/componentes/importar`

---

### ✅ 3.2. Cadastro Estruturado de Peças e Componentes

- [ ] **Vínculo de Componentes à Grua**
  - Listagem de componentes por grua
  - Relacionamento com peças de estoque
  - Histórico de reposições/manutenções

**Arquivos a criar/modificar:**
- Verificar: `components/grua-complementos-manager.tsx` (se atende)
- Criar: `app/dashboard/gruas/[id]/componentes/page.tsx`
- Backend: Criar tabela `componentes_grua` ou `pecas_grua`
- Backend: Endpoints CRUD de componentes

---

## 📚 4. MÓDULO: LIVRO DE GRUA

### ✅ 4.1. Implementação Completa do Livro de Grua

- [ ] **Dados Técnicos da Instalação:**
  - Fundação (tipo, dimensões, especificações)
  - Local de instalação (coordenadas, endereço, condições)
  - Modelo da grua, raio, altura, ambiente

- [ ] **Responsáveis e Equipe:**
  - Engenheiro responsável
  - Operador
  - Sinaleiro
  - Técnico de manutenção
  - Cliente/Empresa contratante

- [ ] **Informações Operacionais e Legais:**
  - Manual de operação vinculado à obra
  - Procedimento de montagem
  - Procedimento de operação
  - Procedimento de desmontagem
  - Período de locação da grua
  - Registro e vinculação da ART

**Arquivos a criar:**
- Criar: `app/dashboard/gruas/[id]/livro/page.tsx`
- Criar: `components/livro-grua-form.tsx` (verificar se já existe)
- Criar: `components/livro-grua-view.tsx`
- Criar: `lib/api-livro-grua.ts`
- Backend: Criar tabela `livro_grua`
- Backend: Endpoints CRUD completos

---

## 💸 5. MÓDULO: FINANCEIRO / COMPRAS

### ✅ 5.1. Nova Aba: Ordem de Compras

- [ ] **Fluxo de Processo:**
  1. Solicitação de compra de peças ou materiais
  2. Aprovação do orçamento
  3. Envio para financeiro realizar pagamento
  4. Registro de pagamento por colaborador responsável (Ex: Jheny)
  5. Aprovação final/reprovação do pagamento (Ex: Nestor)

**Arquivos a criar:**
- Criar: `app/dashboard/financeiro/vendas/ordem-compras/page.tsx`
- Criar: `components/ordem-compra-form.tsx`
- Criar: `components/fluxo-aprovacao-compra.tsx`
- Criar: `lib/api-ordem-compras.ts`
- Backend: Criar tabela `ordem_compras`
- Backend: Criar tabela `aprovacoes_ordem_compras` (histórico)
- Backend: Endpoints para cada etapa do fluxo

---

## 🛠️ 6. MÓDULO: SISTEMA DE ALERTAS E NOTIFICAÇÕES

### ✅ 6.1. Alertas Automáticos

- [ ] **60 dias antes do fim da obra**
  - Verificar obras com data de fim próxima
  - Enviar notificação via sistema
  - Opção de envio via WhatsApp

- [ ] **30 dias antes do vencimento de documentos e certificados**
  - Verificar documentos admissionais
  - Verificar certificados de colaboradores
  - Enviar notificação via sistema
  - Opção de envio via WhatsApp

**Arquivos a criar/modificar:**
- Criar: `scripts/verificar-alertas.js` (cron job)
- Criar: `lib/alertas-service.ts`
- Criar: `lib/whatsapp-service.ts` (integração opcional)
- Modificar: `hooks/useNotificacoes.ts`
- Backend: Criar endpoint `POST /api/notificacoes/enviar-alerta`
- Backend: Criar tabela `configuracoes_alertas` (configurar destinatários)

---

## ✅ 7. MÓDULO: CHECKLIST DIÁRIO DE OBRA

### ✅ 7.1. Modelo de Checklist por Obra

- [ ] **Checklist Customizável**
  - Modelos de checklist por obra (itens customizáveis + presets)
  - Presets padrão: Segurança, Equipamentos, Documentação, Pessoal
  - Criação/edição de itens do checklist
  - Ordenação de itens
  - Categorias de itens (Segurança, Operacional, Documental, etc.)

**Arquivos a criar:**
- Criar: `app/dashboard/obras/[id]/checklist/page.tsx`
- Criar: `components/checklist-modelo-form.tsx`
- Criar: `components/checklist-item-editor.tsx`
- Criar: `lib/api-checklist-modelos.ts`
- Backend: Criar tabela `checklists_modelos`
- Backend: Criar tabela `checklist_itens` (vinculado ao modelo)
- Backend: Endpoints CRUD de modelos e itens

---

### ✅ 7.2. Registro Diário de Checklist

- [ ] **Formulário de Checklist Diário**
  - Seleção de data (padrão: hoje)
  - Responsável pelo preenchimento
  - Horário de registro
  - Status por item: OK / Não Conforme (NC) / Observação
  - Campo de observações por item
  - Upload de anexos/fotos por item
  - Assinatura digital do responsável
  - Validação: não permitir salvar sem preencher todos os itens obrigatórios

**Arquivos a criar:**
- Criar: `components/checklist-diario-form.tsx`
- Criar: `components/checklist-item-resposta.tsx`
- Criar: `components/checklist-anexos.tsx`
- Criar: `lib/api-checklist-diarios.ts`
- Backend: Criar tabela `checklists_diarios`
- Backend: Criar tabela `checklist_respostas` (respostas por item)
- Backend: Criar tabela `checklist_anexos` (fotos/anexos)
- Backend: Endpoint para upload de anexos

---

### ✅ 7.3. Plano de Ação para Não Conformidades (NC)

- [ ] **Gestão de NCs**
  - Quando item marcado como "Não Conforme":
    - Campo obrigatório: descrição do problema
    - Campo obrigatório: ação corretiva proposta
    - Responsável pela correção
    - Prazo para correção
    - Status: Aberto / Em Andamento / Resolvido / Fechado
  - Acompanhamento de NCs pendentes
  - Histórico de correções

**Arquivos a criar:**
- Criar: `components/nc-plano-acao.tsx`
- Criar: `components/nc-acompanhamento.tsx`
- Criar: `lib/api-nc-acoes.ts`
- Backend: Criar tabela `checklist_nc_acoes`
- Backend: Endpoints para gestão de NCs

---

### ✅ 7.4. Relatórios e Exportação

- [ ] **Relatórios do Checklist**
  - Exportação PDF/CSV do checklist diário
  - Filtros: por data, obra, responsável, status
  - Relatório consolidado mensal
  - Relatório de NCs por obra/período
  - Gráficos de conformidade

**Arquivos a criar:**
- Criar: `components/checklist-relatorios.tsx`
- Criar: `lib/export-checklist.ts` (utilitário de exportação)
- Backend: Endpoint para geração de relatórios

---

### ✅ 7.5. Alertas e Lembretes

- [ ] **Sistema de Alertas**
  - Lembrete diário para responsáveis preencherem checklist
  - Escalonamento: se não preenchido em X horas, notificar supervisor
  - Alerta de NCs pendentes de resolução
  - Integração com sistema de notificações
  - Opção de envio via WhatsApp

**Arquivos a criar:**
- Criar: `scripts/verificar-checklists-pendentes.js` (cron job)
- Criar: `lib/alertas-checklist.ts`
- Modificar: `lib/alertas-service.ts`
- Backend: Endpoint para verificar checklists pendentes

---

## ⚙️ 8. MÓDULO: MANUTENÇÕES DA OBRA / GRUA

### ✅ 8.1. Ordens de Manutenção

- [ ] **Criação de Ordem de Manutenção**
  - Tipos: Preventiva / Corretiva
  - Vinculação à grua e obra
  - Campos obrigatórios:
    - Tipo de manutenção
    - Descrição do serviço
    - Responsável técnico
    - Data/hora prevista
    - Prioridade (Baixa, Média, Alta, Urgente)
  - Status: Agendada / Em Execução / Concluída / Cancelada

**Arquivos a criar:**
- Criar: `app/dashboard/obras/[id]/manutencoes/page.tsx`
- Criar: `app/dashboard/gruas/[id]/manutencoes/page.tsx`
- Criar: `components/manutencao-form.tsx`
- Criar: `components/manutencao-status.tsx`
- Criar: `lib/api-manutencoes.ts`
- Backend: Criar tabela `manutencoes_ordens`
- Backend: Endpoints CRUD de ordens de manutenção

---

### ✅ 8.2. Agenda Preventiva

- [ ] **Sistema de Agendamento Preventivo**
  - Agendamento por horas (horímetro) ou por tempo (dias/meses)
  - Configuração de intervalos:
    - Ex: A cada 500 horas de operação
    - Ex: A cada 3 meses
  - Geração automática de ordens preventivas baseadas no agendamento
  - Cálculo da próxima manutenção baseado no horímetro atual
  - Histórico de manutenções preventivas

**Arquivos a criar:**
- Criar: `components/agenda-preventiva.tsx`
- Criar: `components/calculo-proxima-manutencao.tsx`
- Criar: `lib/agenda-preventiva-service.ts`
- Backend: Criar tabela `manutencoes_agenda_preventiva`
- Backend: Endpoint para calcular próxima manutenção
- Backend: Script para gerar ordens automaticamente

---

### ✅ 8.3. Execução da Manutenção

- [ ] **Registro de Execução**
  - Data/hora de início e fim
  - Responsável pela execução
  - Peças utilizadas (vinculação com estoque)
  - Quantidade de cada peça
  - Custo total (peças + mão de obra)
  - Horas trabalhadas
  - Descrição do serviço realizado
  - Observações técnicas
  - Upload de anexos (fotos, laudos, notas fiscais)

**Arquivos a criar:**
- Criar: `components/manutencao-execucao-form.tsx`
- Criar: `components/pecas-manutencao.tsx` (seleção de peças do estoque)
- Criar: `components/manutencao-anexos.tsx`
- Criar: `lib/api-manutencoes-execucao.ts`
- Backend: Criar tabela `manutencoes_itens` (peças utilizadas)
- Backend: Criar tabela `manutencoes_anexos` (fotos/laudos)
- Backend: Endpoint para registrar execução
- Backend: Endpoint para upload de anexos

---

### ✅ 8.4. Histórico e Rastreabilidade

- [ ] **Histórico Completo por Grua**
  - Listagem cronológica de todas as manutenções
  - Filtros: por tipo, período, responsável, status
  - Visualização detalhada de cada manutenção
  - Anexos organizados por manutenção
  - Cálculo de custos acumulados
  - Gráficos de frequência de manutenções

**Arquivos a criar:**
- Criar: `components/manutencao-historico.tsx`
- Criar: `components/manutencao-detalhes-view.tsx`
- Criar: `components/graficos-manutencao.tsx`
- Criar: `lib/api-manutencoes-historico.ts`
- Backend: Endpoints para consulta de histórico
- Backend: Endpoint para relatórios de custos

---

### ✅ 8.5. Alertas de Manutenção

- [ ] **Sistema de Alertas**
  - Próximas manutenções preventivas (horímetro/data)
  - Atrasos de manutenções agendadas
  - Manutenções corretivas urgentes
  - Integração com sistema de notificações
  - Opção de envio via WhatsApp
  - Configuração de destinatários (responsável técnico, operador, etc.)

**Arquivos a criar:**
- Criar: `scripts/verificar-manutencoes-pendentes.js` (cron job)
- Criar: `lib/alertas-manutencao.ts`
- Modificar: `lib/alertas-service.ts`
- Backend: Endpoint para verificar manutenções próximas
- Backend: Endpoint para alertas de atraso

---

## 📌 CHECKLIST GERAL DE IMPLEMENTAÇÃO

### Prioridade ALTA 🔴

- [ ] Campos obrigatórios na Obra (CNO, ART, Apólice)
- [ ] Responsável Técnico da Obra
- [ ] Cadastro de Sinaleiros
- [ ] **Documentos do Sinaleiro (obrigatórios com validações)**
- [ ] Sistema de alertas (60 dias obra, 30 dias documentos)
- [ ] Certificados de Colaboradores
- [ ] Documentos Admissionais
- [ ] **Regras de Acesso por Função (acesso global)**
- [ ] Livro de Grua (módulo completo)
- [ ] **Checklist Diário de Obra**
- [ ] **Manutenções da Obra/Grua**

### Prioridade MÉDIA 🟡

- [ ] Ordem de Compras (fluxo completo)
- [ ] Importação de componentes via planilha
- [ ] Upload e assinatura de holerite
- [ ] Plano de ação para NCs (Checklist)
- [ ] Agenda preventiva de manutenções
- [ ] Integração WhatsApp (opcional)

### Prioridade BAIXA 🟢

- [ ] Melhorias de UI/UX
- [ ] Relatórios adicionais de checklist
- [ ] Gráficos de manutenção
- [ ] Exportações personalizadas

---

## 🔧 INFRAESTRUTURA NECESSÁRIA

### Backend - Tabelas a Criar/Modificar:

```sql
-- Obras
ALTER TABLE obras ADD COLUMN cno VARCHAR(20);
ALTER TABLE obras ADD COLUMN art_numero VARCHAR(50);
ALTER TABLE obras ADD COLUMN art_arquivo VARCHAR(255);
ALTER TABLE obras ADD COLUMN apolice_numero VARCHAR(50);
ALTER TABLE obras ADD COLUMN apolice_arquivo VARCHAR(255);
ALTER TABLE obras ADD COLUMN responsavel_tecnico_id INT;

-- Responsáveis Técnicos
CREATE TABLE responsaveis_tecnicos (
  id SERIAL PRIMARY KEY,
  obra_id INT REFERENCES obras(id),
  nome VARCHAR(255),
  cpf_cnpj VARCHAR(20),
  crea VARCHAR(50),
  email VARCHAR(255),
  telefone VARCHAR(20)
);

-- Sinaleiros
CREATE TABLE sinaleiros_obra (
  id SERIAL PRIMARY KEY,
  obra_id INT REFERENCES obras(id),
  nome VARCHAR(255),
  rg_cpf VARCHAR(20),
  telefone VARCHAR(20),
  email VARCHAR(255),
  tipo ENUM('principal', 'reserva'),
  documentos JSONB
);

-- Documentos do Sinaleiro
CREATE TABLE documentos_sinaleiro (
  id SERIAL PRIMARY KEY,
  sinaleiro_id INT REFERENCES sinaleiros_obra(id),
  tipo VARCHAR(50) NOT NULL, -- 'rg_frente', 'rg_verso', 'cpf', 'comprovante_vinculo', 'certificado'
  arquivo VARCHAR(255) NOT NULL,
  data_validade DATE,
  status ENUM('pendente', 'aprovado', 'vencido') DEFAULT 'pendente',
  aprovado_por INT REFERENCES usuarios(id),
  aprovado_em TIMESTAMP,
  alerta_enviado BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Certificados
CREATE TABLE certificados_colaboradores (
  id SERIAL PRIMARY KEY,
  colaborador_id INT REFERENCES colaboradores(id),
  tipo VARCHAR(50),
  nome VARCHAR(255),
  data_validade DATE,
  arquivo VARCHAR(255),
  alerta_enviado BOOLEAN DEFAULT FALSE
);

-- Documentos Admissionais
CREATE TABLE documentos_admissionais (
  id SERIAL PRIMARY KEY,
  colaborador_id INT REFERENCES colaboradores(id),
  tipo VARCHAR(50),
  data_validade DATE,
  arquivo VARCHAR(255),
  alerta_enviado BOOLEAN DEFAULT FALSE
);

-- Holerites
CREATE TABLE holerites (
  id SERIAL PRIMARY KEY,
  colaborador_id INT REFERENCES colaboradores(id),
  mes_referencia DATE,
  arquivo VARCHAR(255),
  assinatura_digital TEXT,
  assinado_em TIMESTAMP,
  assinado_por INT REFERENCES usuarios(id)
);

-- Componentes de Grua
CREATE TABLE componentes_grua (
  id SERIAL PRIMARY KEY,
  grua_id INT REFERENCES gruas(id),
  nome VARCHAR(255),
  sku VARCHAR(100),
  quantidade INT,
  importado_em TIMESTAMP DEFAULT NOW()
);

-- Livro de Grua
CREATE TABLE livro_grua (
  id SERIAL PRIMARY KEY,
  grua_id INT REFERENCES gruas(id),
  obra_id INT REFERENCES obras(id),
  dados_instalacao JSONB,
  responsaveis JSONB,
  procedimentos JSONB,
  art_vinculada VARCHAR(255),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Ordem de Compras
CREATE TABLE ordem_compras (
  id SERIAL PRIMARY KEY,
  solicitante_id INT REFERENCES usuarios(id),
  descricao TEXT,
  valor_total DECIMAL(10,2),
  status ENUM('solicitado', 'aprovado_orcamento', 'enviado_financeiro', 'pago', 'aprovado_pagamento', 'rejeitado'),
  aprovador_orcamento_id INT REFERENCES usuarios(id),
  responsavel_pagamento_id INT REFERENCES usuarios(id),
  aprovador_final_id INT REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Cargos (adicionar coluna acesso global)
ALTER TABLE cargos ADD COLUMN acesso_global_obras BOOLEAN DEFAULT FALSE;

-- Checklist Modelos
CREATE TABLE checklists_modelos (
  id SERIAL PRIMARY KEY,
  obra_id INT REFERENCES obras(id),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Checklist Itens (vinculado ao modelo)
CREATE TABLE checklist_itens (
  id SERIAL PRIMARY KEY,
  modelo_id INT REFERENCES checklists_modelos(id),
  ordem INT NOT NULL,
  categoria VARCHAR(100),
  descricao TEXT NOT NULL,
  obrigatorio BOOLEAN DEFAULT TRUE,
  permite_anexo BOOLEAN DEFAULT FALSE
);

-- Checklists Diários
CREATE TABLE checklists_diarios (
  id SERIAL PRIMARY KEY,
  obra_id INT REFERENCES obras(id),
  modelo_id INT REFERENCES checklists_modelos(id),
  data DATE NOT NULL,
  responsavel_id INT REFERENCES usuarios(id),
  horario_registro TIMESTAMP DEFAULT NOW(),
  assinatura_digital TEXT,
  status ENUM('rascunho', 'preenchido', 'assinado') DEFAULT 'rascunho',
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Checklist Respostas
CREATE TABLE checklist_respostas (
  id SERIAL PRIMARY KEY,
  checklist_id INT REFERENCES checklists_diarios(id),
  item_id INT REFERENCES checklist_itens(id),
  status ENUM('ok', 'nc', 'observacao') NOT NULL,
  observacao TEXT,
  plano_acao TEXT,
  responsavel_correcao_id INT REFERENCES usuarios(id),
  prazo_correcao DATE,
  status_correcao ENUM('aberto', 'em_andamento', 'resolvido', 'fechado') DEFAULT 'aberto',
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Checklist Anexos
CREATE TABLE checklist_anexos (
  id SERIAL PRIMARY KEY,
  resposta_id INT REFERENCES checklist_respostas(id),
  arquivo VARCHAR(255) NOT NULL,
  tipo VARCHAR(50), -- 'foto', 'documento', 'outro'
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Manutenções Ordens
CREATE TABLE manutencoes_ordens (
  id SERIAL PRIMARY KEY,
  grua_id INT REFERENCES gruas(id),
  obra_id INT REFERENCES obras(id),
  tipo ENUM('preventiva', 'corretiva') NOT NULL,
  descricao TEXT NOT NULL,
  responsavel_tecnico_id INT REFERENCES usuarios(id),
  data_prevista TIMESTAMP,
  prioridade ENUM('baixa', 'media', 'alta', 'urgente') DEFAULT 'media',
  status ENUM('agendada', 'em_execucao', 'concluida', 'cancelada') DEFAULT 'agendada',
  data_inicio TIMESTAMP,
  data_fim TIMESTAMP,
  horas_trabalhadas DECIMAL(5,2),
  custo_mao_obra DECIMAL(10,2),
  custo_total DECIMAL(10,2),
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Manutenções Itens (peças utilizadas)
CREATE TABLE manutencoes_itens (
  id SERIAL PRIMARY KEY,
  manutencao_id INT REFERENCES manutencoes_ordens(id),
  peca_id INT REFERENCES estoque(id), -- ou tabela de peças
  quantidade INT NOT NULL,
  valor_unitario DECIMAL(10,2),
  valor_total DECIMAL(10,2)
);

-- Manutenções Anexos
CREATE TABLE manutencoes_anexos (
  id SERIAL PRIMARY KEY,
  manutencao_id INT REFERENCES manutencoes_ordens(id),
  arquivo VARCHAR(255) NOT NULL,
  tipo VARCHAR(50), -- 'foto', 'laudo', 'nota_fiscal', 'outro'
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Agenda Preventiva
CREATE TABLE manutencoes_agenda_preventiva (
  id SERIAL PRIMARY KEY,
  grua_id INT REFERENCES gruas(id),
  tipo_manutencao VARCHAR(100) NOT NULL,
  intervalo_tipo ENUM('horas', 'dias', 'meses') NOT NULL,
  intervalo_valor INT NOT NULL,
  ultima_manutencao_horimetro INT,
  ultima_manutencao_data DATE,
  proxima_manutencao_horimetro INT,
  proxima_manutencao_data DATE,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW()
);
```

---

## 📱 INTEGRAÇÃO WHATSAPP (Opcional)

- [ ] Pesquisar API de WhatsApp (Twilio, WhatsApp Business API, etc.)
- [ ] Criar serviço de envio de mensagens
- [ ] Configurar templates de mensagens
- [ ] Implementar envio de alertas automáticos
- [ ] Criar interface de configuração de integração

---

## 🧪 TESTES NECESSÁRIOS

- [ ] Testes unitários dos novos componentes
- [ ] Testes de integração dos fluxos
- [ ] Testes de validação de campos obrigatórios
- [ ] Testes de upload de documentos
- [ ] Testes de alertas automáticos
- [ ] Testes de permissões (Admin, Cliente, Funcionário)

---

## 📝 NOTAS DE IMPLEMENTAÇÃO

1. **Validações**: Todos os campos obrigatórios devem ter validação no frontend e backend
2. **Permissões**: Revisar sistema de permissões para novas funcionalidades
3. **Auditoria**: Registrar logs de criação/edição de documentos importantes
4. **Performance**: Considerar paginação para listagens grandes
5. **Storage**: Planejar espaço de armazenamento para uploads de documentos

---

## 🔗 REFERÊNCIAS

- Documento original de escopo
- Arquivos existentes no projeto para referência de padrões
- Backend API existente

---

**Última atualização:** 2025  
**Responsável:** Equipe de Desenvolvimento

