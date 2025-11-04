# 📱 README - Implementação Frontend - Alterações de Escopo

**Data:** 2025  
**Status:** 🚧 Em Planejamento  
**Foco:** Componentes React, Páginas Next.js, Hooks e Integrações Frontend

---

## 📊 Resumo Executivo

Este documento detalha todas as implementações necessárias no **frontend** para as novas funcionalidades do sistema de gerenciamento de gruas. Organizado por módulo, com foco em componentes reutilizáveis, páginas e integrações de API.

---

## 🏗️ 1. MÓDULO: OBRA (Cadastro e Gestão)

### ✅ 1.1. Novos Campos Obrigatórios - Componentes

#### **Componente: Formulário de Obra**
**Arquivo:** `app/dashboard/obras/nova/page.tsx` (modificar)

**Adicionar campos:**
- [x] Campo **CNO** (Documento da Obra)
  - ✅ Input com máscara de números implementado (`components/cno-input.tsx`)
  - ✅ Mensagem de erro se inválido
  - ✅ Integrado na aba "Documentos" do formulário

- [x] Campo **ART** (Anotação de Responsabilidade Técnica)
  - ✅ Input para número da ART
  - ✅ Upload de arquivo ART (PDF) usando `components/documento-upload.tsx`
  - ✅ Preview do documento após upload
  - ✅ Validação: apenas PDF, máximo 5MB
  - ✅ Integrado na aba "Documentos" do formulário

- [x] Campo **Apólice de Seguro**
  - ✅ Input para número da apólice
  - ✅ Upload de arquivo (PDF) usando `components/documento-upload.tsx`
  - ✅ Preview do documento após upload
  - ✅ Validação: apenas PDF, máximo 5MB
  - ✅ Integrado na aba "Documentos" do formulário

**Componentes auxiliares criados:**
- [x] `components/documento-upload.tsx` (componente reutilizável para upload) ✅
- [x] `components/cno-input.tsx` (input com máscara e validação) ✅

---

### ✅ 1.2. Responsável Técnico da Obra

#### **Componente: Formulário de Responsável Técnico**
**Arquivo:** `components/responsavel-tecnico-form.tsx` ✅ **IMPLEMENTADO**

**Estrutura:**
```typescript
interface ResponsavelTecnicoFormProps {
  obraId?: number
  responsavel?: ResponsavelTecnico
  onSave: (data: ResponsavelTecnicoData) => void
  onCancel?: () => void
}
```

**Campos do formulário:**
- [x] Nome (obrigatório) ✅
- [x] CPF/CNPJ (obrigatório, com validação) ✅
- [x] CREA (opcional, se aplicável) ✅
- [x] Email (com validação) ✅
- [x] Telefone (com máscara) ✅

**Funcionalidades:**
- [x] Buscar responsável existente (busca por CPF/CNPJ) ✅ (Mock implementado)
- [x] Cadastrar novo responsável ✅
- [x] Validação de campos obrigatórios ✅
- [ ] Integração com API: `POST /api/obras/:id/responsavel-tecnico` (pendente backend)

**Onde usar:**
- [x] `app/dashboard/obras/nova/page.tsx` (formulário inline) ✅ **INTEGRADO**
- [ ] `app/dashboard/obras/[id]/page.tsx` (edição na página de detalhes)

---

### ✅ 1.3. Cadastro de Sinaleiros

#### **Componente: Formulário de Sinaleiros**
**Arquivo:** `components/sinaleiros-form.tsx` ✅ **IMPLEMENTADO**

**Estrutura:**
```typescript
interface SinaleirosFormProps {
  obraId?: number
  sinaleiros?: Sinaleiro[]
  onSave: (sinaleiros: Sinaleiro[]) => void
  readOnly?: boolean
}
```

**Campos por sinaleiro:**
- [x] Nome (obrigatório) ✅
- [x] RG ou CPF (obrigatório) ✅
- [x] Telefone ✅
- [x] Email ✅
- [x] Tipo: Principal / Reserva (radio ou select) ✅

**Funcionalidades:**
- [x] Máximo 2 sinaleiros (principal + reserva) ✅
- [x] Cliente pode CRIAR UM SINALEIRO, CASO ELE NÃO INFORME O CAMPO SINALEIRO CLIENTE VA VAZIO ✅
- [x] Cliente pode editar se informou os sinaleiros ✅
- [x] Validação: sinaleiro principal obrigatório ✅
- [ ] Integração com API: `POST /api/obras/:id/sinaleiros` (pendente backend)

**Onde usar:**
- [x] `app/dashboard/obras/nova/page.tsx` ✅ **INTEGRADO**
- [ ] `app/dashboard/obras/[id]/page.tsx` (aba de sinaleiros)

---

### ✅ 1.5. Documentos do Sinaleiro (Obrigatórios)

#### **Componente: Lista de Documentos do Sinaleiro**
**Arquivo:** `components/documentos-sinaleiro-list.tsx` (criar)

**Estrutura:**
```typescript
interface DocumentosSinaleiroListProps {
  sinaleiroId: number
  readOnly?: boolean
}
```

**Funcionalidades:**
- [ ] Listagem de documentos obrigatórios:
  - RG/CPF (frente) - **OBRIGATÓRIO**
  - RG/CPF (verso) - **OBRIGATÓRIO**
  - Comprovante de vínculo - **OBRIGATÓRIO**
  - Certificado aplicável (opcional)
- [ ] Status visual: Pendente / Aprovado / Vencido
- [ ] Preview de documentos
- [ ] Validação de tipos de arquivo (PDF, JPG, PNG)
- [ ] Validação de tamanho (máximo 5MB)
- [ ] Permissões: Admin e Cliente podem aprovar, Auditor só visualiza

#### **Componente: Upload de Documentos**
**Arquivo:** `components/documentos-sinaleiro-upload.tsx` (criar)

**Funcionalidades:**
- [ ] Drag & drop ou seleção de arquivo
- [ ] Preview antes de enviar
- [ ] Validação de tipo e tamanho
- [ ] Barra de progresso
- [ ] Integração: `POST /api/sinaleiros/:id/documentos`

#### **Componente: Status de Documentos**
**Arquivo:** `components/documentos-status-badge.tsx` (criar)

**Status visuais:**
- [ ] Badge "Pendente" (amarelo)
- [ ] Badge "Aprovado" (verde)
- [ ] Badge "Vencido" (vermelho)
- [ ] Data de validade (se aplicável)

**Onde usar:**
- [ ] `app/dashboard/obras/[id]/page.tsx` (aba de sinaleiros)
- [ ] `components/sinaleiros-form.tsx` (durante cadastro)

---

### ✅ 1.4. Sistema de Alerta de Fim de Obra

#### **Hook: Alertas de Obra**
**Arquivo:** `hooks/use-alertas-obras.ts` (criar)

**Funcionalidades:**
- [ ] Verificar obras com fim em 60 dias
- [ ] Calcular dias restantes
- [ ] Integração: `GET /api/obras/alertas/fim-proximo`
- [ ] Retornar lista de obras com alertas

#### **Componente: Notificação de Fim de Obra**
**Arquivo:** `components/alerta-fim-obra.tsx` (criar)

**Funcionalidades:**
- [ ] Exibir banner/notificação para obras próximas do fim
- [ ] Listar obras com dias restantes
- [ ] Link para página de detalhes da obra
- [ ] Opção de desativar alerta temporariamente

**Onde usar:**
- [ ] `app/dashboard/obras/page.tsx` (banner no topo)
- [ ] `components/notifications-dropdown.tsx` (notificação)

---

## 🧑‍🤝‍🧑 2. MÓDULO: RH – Colaboradores e Documentos

### ✅ 2.1. Aba de Certificados para Colaboradores

#### **Página: Certificados do Colaborador**
**Arquivo:** `app/dashboard/rh/colaboradores/[id]/certificados/page.tsx` (criar)

**Estrutura da página:**
- [ ] Listagem de certificados (tabela ou cards)
- [ ] Botão "Adicionar Certificado"
- [ ] Filtros: por tipo, status de validade
- [ ] Indicadores visuais de vencimento próximo

#### **Componente: Formulário de Certificado**
**Arquivo:** `components/certificado-form.tsx` (criar)

**Campos:**
- [ ] Tipo de certificado (select):
  - Ficha de EPI
  - Ordem de Serviço
  - NR06, NR11, NR12, NR18, NR35
  - Certificado de Especificação
- [ ] Nome do certificado
- [ ] Data de validade (date picker)
- [ ] Upload de arquivo (PDF, JPG, PNG)

**Validações:**
- [ ] Tipo obrigatório
- [ ] Data de validade obrigatória
- [ ] Arquivo obrigatório
- [ ] Tamanho máximo 5MB

#### **Componente: Lista de Certificados**
**Arquivo:** `components/certificados-list.tsx` (criar)

**Funcionalidades:**
- [ ] Tabela com colunas: Tipo, Nome, Data Validade, Status, Ações
- [ ] Badge de status: Válido / Vencendo (30 dias) / Vencido
- [ ] Ações: Visualizar, Editar, Excluir, Download
- [ ] Filtro por status
- [ ] Ordenação por data de validade

#### **API Client: Certificados**
**Arquivo:** `lib/api-certificados.ts` (criar)

**Funções:**
```typescript
- listarCertificados(colaboradorId: number)
- criarCertificado(data: CertificadoData)
- atualizarCertificado(id: number, data: CertificadoData)
- excluirCertificado(id: number)
- verificarCertificadosVencendo()
```

**Integração Backend:**
- [ ] `GET /api/colaboradores/:id/certificados`
- [ ] `POST /api/colaboradores/:id/certificados`
- [ ] `PUT /api/certificados/:id`
- [ ] `DELETE /api/certificados/:id`

---

### ✅ 2.2. Documentos Admissionais

#### **Página: Documentos Admissionais**
**Arquivo:** `app/dashboard/rh/colaboradores/[id]/documentos-admissionais/page.tsx` (criar)

**Estrutura similar aos certificados:**
- [ ] Listagem de documentos
- [ ] Formulário de adição
- [ ] Tipos: ASO, E-Social, Ficha de Registro
- [ ] Mesma lógica de alerta de 30 dias

#### **Componente: Documento Admissional Form**
**Arquivo:** `components/documento-admissional-form.tsx` (criar)

**Reutilizar lógica de certificados, adaptar para:**
- [ ] Tipos específicos de documentos admissionais
- [ ] Validações específicas

#### **API Client: Documentos Admissionais**
**Arquivo:** `lib/api-documentos-admissionais.ts` (criar)

**Mesma estrutura do api-certificados.ts**

---

### ✅ 2.3. Documentos Mensais - Holerite

#### **Página: Holerites do Colaborador**
**Arquivo:** `app/dashboard/rh/colaboradores/[id]/holerites/page.tsx` (criar)

**Funcionalidades:**
- [ ] Listagem de holerites por mês/ano
- [ ] Upload de holerite mensal
- [ ] Visualização de holerite (PDF)
- [ ] Status: Pendente / Assinado

#### **Componente: Upload de Holerite**
**Arquivo:** `components/holerite-upload.tsx` (criar)

**Funcionalidades:**
- [ ] Seleção de mês/ano de referência
- [ ] Upload de arquivo PDF
- [ ] Preview do holerite
- [ ] Botão "Assinar Digitalmente"

#### **Componente: Assinatura de Holerite**
**Arquivo:** `components/assinatura-holerite.tsx` (criar)

**Funcionalidades:**
- [ ] Reutilizar `components/signature-pad.tsx` (se existir)
- [ ] Modal de assinatura
- [ ] Validação: não permitir salvar sem assinar
- [ ] Integração: `POST /api/holerites/:id/assinar`

#### **API Client: Holerites**
**Arquivo:** `lib/api-holerites.ts` (criar)

**Funções:**
```typescript
- listarHolerites(colaboradorId: number)
- uploadHolerite(colaboradorId: number, mesReferencia: Date, arquivo: File)
- assinarHolerite(holeriteId: number, assinatura: string)
- visualizarHolerite(holeriteId: number) // retorna URL do PDF
```

---

### ✅ 2.5. Regras de Acesso por Função

#### **Componente: Formulário de Cargo (Modificar)**
**Arquivos:** 
- `components/create-cargo-dialog.tsx` (modificar)
- `components/edit-cargo-dialog.tsx` (modificar)

**Adicionar campo:**
- [ ] Checkbox: "Acesso Global a Todas as Obras"
- [ ] Tooltip explicativo: "Este cargo terá acesso a todas as obras, sem restrição"
- [ ] Validação: apenas para cargos técnicos

#### **Hook: Permissões de Obra**
**Arquivo:** `hooks/use-permissions.ts` (modificar)

**Adicionar função:**
```typescript
const hasGlobalAccessToObras = (): boolean => {
  // Verificar se o cargo do usuário tem acesso_global_obras = true
}
```

#### **Componente: Protected Route (Modificar)**
**Arquivo:** `components/protected-route.tsx` ou middleware (modificar)

**Adicionar lógica:**
- [ ] Verificar flag `acesso_global_obras` antes de filtrar obras
- [ ] Bypass de filtro se usuário tem acesso global
- [ ] Log de acesso para auditoria (opcional)

#### **Componente: Filtro de Obras (Modificar)**
**Arquivos que filtram obras:**
- `app/dashboard/obras/page.tsx` (modificar)
- Qualquer componente que lista obras

**Adicionar lógica:**
- [ ] Se usuário tem `acesso_global_obras`, não aplicar filtro
- [ ] Caso contrário, aplicar filtro normal

---

## ⚙️ 3. MÓDULO: GRUAS / EQUIPAMENTOS

### ✅ 3.1. Importação de Componentes via Planilha

#### **Página: Importar Componentes**
**Arquivo:** `app/dashboard/gruas/[id]/componentes/importar/page.tsx` (criar)

**Funcionalidades:**
- [ ] Upload de arquivo Excel/CSV
- [ ] Preview dos dados antes de importar
- [ ] Mapeamento de colunas (se necessário)
- [ ] Validação de dados
- [ ] Relatório de erros/sucessos após importação

#### **Componente: Importador Excel**
**Arquivo:** `components/importar-componentes-grua.tsx` (criar)

**Funcionalidades:**
- [ ] Drag & drop ou seleção de arquivo
- [ ] Preview da planilha (primeiras linhas)
- [ ] Seleção de colunas (nome, SKU, quantidade, etc.)
- [ ] Validação de formato
- [ ] Barra de progresso durante importação
- [ ] Exibição de erros de validação

#### **Utilitário: Parser Excel**
**Arquivo:** `lib/importar-excel.ts` (criar)

**Bibliotecas sugeridas:**
- `xlsx` ou `exceljs` para parsing
- `papaparse` para CSV

**Funções:**
```typescript
- parseExcel(file: File): Promise<ComponenteData[]>
- validateComponenteData(data: any[]): ValidationResult
- mapColumns(headers: string[]): ColumnMapping
```

#### **API Client: Componentes**
**Arquivo:** `lib/api-componentes-grua.ts` (criar)

**Funções:**
```typescript
- importarComponentes(gruaId: number, componentes: ComponenteData[])
- listarComponentes(gruaId: number)
- criarComponente(gruaId: number, data: ComponenteData)
```

---

## 📚 4. MÓDULO: LIVRO DE GRUA

### ✅ 4.1. Página: Livro de Grua

#### **Página: Livro de Grua**
**Arquivo:** `app/dashboard/gruas/[id]/livro/page.tsx` (criar)

**Estrutura:**
- [ ] Abas: Dados Técnicos / Responsáveis / Procedimentos / ART
- [ ] Modo visualização e edição
- [ ] Validações por seção

#### **Componente: Dados Técnicos da Instalação**
**Arquivo:** `components/livro-dados-tecnicos.tsx` (criar)

**Campos:**
- [ ] Fundação (tipo, dimensões, especificações)
- [ ] Local de instalação (coordenadas, endereço, condições)
- [ ] Modelo da grua, raio, altura, ambiente

#### **Componente: Responsáveis e Equipe**
**Arquivo:** `components/livro-responsaveis.tsx` (criar)

**Campos:**
- [ ] Engenheiro responsável (busca de usuário)
- [ ] Operador (busca de colaborador)
- [ ] Sinaleiro (busca de sinaleiro da obra)
- [ ] Técnico de manutenção (busca de colaborador)
- [ ] Cliente/Empresa contratante (busca de cliente)

#### **Componente: Procedimentos**
**Arquivo:** `components/livro-procedimentos.tsx` (criar)

**Uploads:**
- [ ] Manual de operação (PDF)
- [ ] Procedimento de montagem (PDF)
- [ ] Procedimento de operação (PDF)
- [ ] Procedimento de desmontagem (PDF)

#### **Componente: Vinculação ART**
**Arquivo:** `components/livro-art.tsx` (criar)

**Funcionalidades:**
- [ ] Número da ART
- [ ] Upload de ART
- [ ] Vinculação com ART da obra (se existir)

#### **Componente: Visualização do Livro**
**Arquivo:** `components/livro-grua-view.tsx` (criar)

**Funcionalidades:**
- [ ] Visualização completa em modo leitura
- [ ] Exportação para PDF
- [ ] Impressão

#### **API Client: Livro de Grua**
**Arquivo:** `lib/api-livro-grua.ts` (criar)

**Funções:**
```typescript
- obterLivro(gruaId: number)
- salvarLivro(gruaId: number, data: LivroGruaData)
- atualizarSecao(gruaId: number, secao: string, data: any)
- exportarPDF(gruaId: number)
```

---

## 💸 5. MÓDULO: FINANCEIRO / COMPRAS

### ✅ 5.1. Ordem de Compras

#### **Página: Ordem de Compras**
**Arquivo:** `app/dashboard/financeiro/vendas/ordem-compras/page.tsx` (criar)

**Estrutura:**
- [ ] Listagem de ordens de compra (tabela)
- [ ] Filtros: status, período, solicitante
- [ ] Botão "Nova Ordem de Compra"

#### **Componente: Formulário de Ordem de Compra**
**Arquivo:** `components/ordem-compra-form.tsx` (criar)

**Campos:**
- [ ] Descrição do item/material
- [ ] Quantidade
- [ ] Valor unitário
- [ ] Valor total (calculado)
- [ ] Justificativa
- [ ] Anexos (orçamentos, cotações)

#### **Componente: Fluxo de Aprovação**
**Arquivo:** `components/fluxo-aprovacao-compra.tsx` (criar)

**Etapas visuais:**
1. Solicitação (badge)
2. Aprovação Orçamento (badge)
3. Envio Financeiro (badge)
4. Pagamento (badge)
5. Aprovação Final (badge)

**Funcionalidades:**
- [ ] Timeline visual do fluxo
- [ ] Botões de ação por etapa
- [ ] Histórico de aprovações
- [ ] Comentários por etapa

#### **Componente: Ações por Status**
**Arquivo:** `components/ordem-compra-acoes.tsx` (criar)

**Lógica condicional:**
- [ ] Se status = "solicitado": botão "Aprovar Orçamento" ou "Rejeitar"
- [ ] Se status = "aprovado_orcamento": botão "Enviar para Financeiro"
- [ ] Se status = "enviado_financeiro": botão "Registrar Pagamento"
- [ ] Se status = "pago": botão "Aprovar Pagamento" ou "Rejeitar"

#### **API Client: Ordem de Compras**
**Arquivo:** `lib/api-ordem-compras.ts` (criar)

**Funções:**
```typescript
- listarOrdensCompras(filtros?: Filtros)
- criarOrdemCompra(data: OrdemCompraData)
- aprovarOrcamento(ordemId: number, aprovacao: AprovacaoData)
- enviarParaFinanceiro(ordemId: number)
- registrarPagamento(ordemId: number, pagamento: PagamentoData)
- aprovarPagamento(ordemId: number, aprovacao: AprovacaoData)
- rejeitarPagamento(ordemId: number, motivo: string)
```

---

## ✅ 7. MÓDULO: CHECKLIST DIÁRIO DE OBRA

### ✅ 7.1. Modelo de Checklist

#### **Página: Checklist da Obra**
**Arquivo:** `app/dashboard/obras/[id]/checklist/page.tsx` (criar)

**Estrutura:**
- [ ] Aba: Modelos / Checklist Diário / Histórico / Relatórios
- [ ] Listagem de modelos de checklist
- [ ] Botão "Criar Modelo"

#### **Componente: Formulário de Modelo**
**Arquivo:** `components/checklist-modelo-form.tsx` (criar)

**Campos:**
- [ ] Nome do modelo
- [ ] Descrição
- [ ] Ativo/Inativo

#### **Componente: Editor de Itens**
**Arquivo:** `components/checklist-item-editor.tsx` (criar)

**Funcionalidades:**
- [ ] Adicionar/remover itens
- [ ] Ordenar itens (drag & drop)
- [ ] Categorias: Segurança, Operacional, Documental, etc.
- [ ] Campos por item:
  - Descrição (obrigatório)
  - Categoria
  - Obrigatório (checkbox)
  - Permite anexo (checkbox)

#### **Componente: Presets**
**Arquivo:** `components/checklist-presets.tsx` (criar)

**Presets padrão:**
- [ ] Segurança (itens pré-configurados)
- [ ] Equipamentos (itens pré-configurados)
- [ ] Documentação (itens pré-configurados)
- [ ] Pessoal (itens pré-configurados)

---

### ✅ 7.2. Registro Diário de Checklist

#### **Componente: Formulário de Checklist Diário**
**Arquivo:** `components/checklist-diario-form.tsx` (criar)

**Estrutura:**
- [ ] Seleção de data (date picker, padrão: hoje)
- [ ] Seleção de modelo de checklist
- [ ] Lista de itens com radios: OK / NC / Observação
- [ ] Campo de observação por item (textarea)
- [ ] Upload de anexos por item
- [ ] Botão "Assinar Digitalmente"

#### **Componente: Item de Resposta**
**Arquivo:** `components/checklist-item-resposta.tsx` (criar)

**Funcionalidades:**
- [ ] Radio buttons: OK / Não Conforme / Observação
- [ ] Textarea para observação (aparece quando NC ou Observação)
- [ ] Upload de anexos (se item permite)
- [ ] Validação: item obrigatório deve ser preenchido

#### **Componente: Upload de Anexos**
**Arquivo:** `components/checklist-anexos.tsx` (criar)

**Funcionalidades:**
- [ ] Upload múltiplo de fotos/documentos
- [ ] Preview de imagens
- [ ] Lista de anexos enviados
- [ ] Remoção de anexos

#### **Componente: Assinatura Digital**
**Arquivo:** `components/checklist-assinatura.tsx` (criar)

**Funcionalidades:**
- [ ] Reutilizar `components/signature-pad.tsx`
- [ ] Modal de assinatura
- [ ] Validação: não permitir salvar sem assinar
- [ ] Preview da assinatura

---

### ✅ 7.3. Plano de Ação para NCs

#### **Componente: Plano de Ação NC**
**Arquivo:** `components/nc-plano-acao.tsx` (criar)

**Campos (quando item marcado como NC):**
- [ ] Descrição do problema (obrigatório)
- [ ] Ação corretiva proposta (obrigatório)
- [ ] Responsável pela correção (select de usuários)
- [ ] Prazo para correção (date picker)
- [ ] Status: Aberto / Em Andamento / Resolvido / Fechado

#### **Componente: Acompanhamento de NCs**
**Arquivo:** `components/nc-acompanhamento.tsx` (criar)

**Funcionalidades:**
- [ ] Listagem de NCs pendentes
- [ ] Filtros: por obra, status, responsável, prazo
- [ ] Timeline de correções
- [ ] Alertas de NCs vencidos

---

### ✅ 7.4. Relatórios e Exportação

#### **Componente: Relatórios de Checklist**
**Arquivo:** `components/checklist-relatorios.tsx` (criar)

**Funcionalidades:**
- [ ] Filtros: data, obra, responsável, status
- [ ] Relatório consolidado mensal
- [ ] Relatório de NCs por obra/período
- [ ] Gráficos de conformidade (Chart.js ou Recharts)
- [ ] Exportação PDF/CSV

#### **Utilitário: Export Checklist**
**Arquivo:** `lib/export-checklist.ts` (criar)

**Funções:**
```typescript
- exportarPDF(checklistId: number)
- exportarCSV(filtros: FiltrosChecklist)
- gerarRelatorioConsolidado(obraId: number, periodo: Periodo)
```

---

## ⚙️ 8. MÓDULO: MANUTENÇÕES DA OBRA / GRUA

### ✅ 8.1. Ordens de Manutenção

#### **Página: Manutenções da Obra**
**Arquivo:** `app/dashboard/obras/[id]/manutencoes/page.tsx` (criar)

#### **Página: Manutenções da Grua**
**Arquivo:** `app/dashboard/gruas/[id]/manutencoes/page.tsx` (criar)

**Estrutura:**
- [ ] Listagem de ordens de manutenção
- [ ] Filtros: tipo, status, período
- [ ] Botão "Nova Ordem de Manutenção"

#### **Componente: Formulário de Manutenção**
**Arquivo:** `components/manutencao-form.tsx` (criar)

**Campos:**
- [ ] Tipo: Preventiva / Corretiva (radio)
- [ ] Grua (select, se não vier da página da grua)
- [ ] Obra (select, se não vier da página da obra)
- [ ] Descrição do serviço (textarea)
- [ ] Responsável técnico (select de usuários)
- [ ] Data/hora prevista (datetime picker)
- [ ] Prioridade: Baixa / Média / Alta / Urgente (select)

---

### ✅ 8.2. Agenda Preventiva

#### **Componente: Agenda Preventiva**
**Arquivo:** `components/agenda-preventiva.tsx` (criar)

**Funcionalidades:**
- [ ] Listagem de agendamentos preventivos
- [ ] Configuração de intervalos:
  - Por horas (horímetro): ex. a cada 500h
  - Por tempo: ex. a cada 3 meses
- [ ] Cálculo automático da próxima manutenção
- [ ] Visualização de última manutenção

#### **Componente: Cálculo de Próxima Manutenção**
**Arquivo:** `components/calculo-proxima-manutencao.tsx` (criar)

**Funcionalidades:**
- [ ] Input: horímetro atual
- [ ] Input: intervalo (horas ou meses)
- [ ] Cálculo automático da próxima manutenção
- [ ] Exibição: "Próxima manutenção em X horas/dias"

---

### ✅ 8.3. Execução da Manutenção

#### **Componente: Formulário de Execução**
**Arquivo:** `components/manutencao-execucao-form.tsx` (criar)

**Campos:**
- [ ] Data/hora de início (datetime picker)
- [ ] Data/hora de fim (datetime picker)
- [ ] Responsável pela execução (select)
- [ ] Horas trabalhadas (calculado ou manual)
- [ ] Custo de mão de obra (input)
- [ ] Descrição do serviço realizado (textarea)
- [ ] Observações técnicas (textarea)

#### **Componente: Peças Utilizadas**
**Arquivo:** `components/pecas-manutencao.tsx` (criar)

**Funcionalidades:**
- [ ] Busca de peças no estoque
- [ ] Adicionar peças utilizadas
- [ ] Quantidade por peça
- [ ] Valor unitário (do estoque)
- [ ] Cálculo automático do total
- [ ] Tabela de peças adicionadas

#### **Componente: Anexos da Manutenção**
**Arquivo:** `components/manutencao-anexos.tsx` (criar)

**Funcionalidades:**
- [ ] Upload de fotos
- [ ] Upload de laudos (PDF)
- [ ] Upload de notas fiscais (PDF)
- [ ] Preview de anexos
- [ ] Categorização: Foto / Laudo / Nota Fiscal / Outro

---

### ✅ 8.4. Histórico e Rastreabilidade

#### **Componente: Histórico de Manutenções**
**Arquivo:** `components/manutencao-historico.tsx` (criar)

**Funcionalidades:**
- [ ] Listagem cronológica de manutenções
- [ ] Filtros: tipo, período, responsável, status
- [ ] Visualização detalhada de cada manutenção
- [ ] Anexos organizados por manutenção

#### **Componente: Visualização Detalhada**
**Arquivo:** `components/manutencao-detalhes-view.tsx` (criar)

**Informações exibidas:**
- [ ] Dados da ordem
- [ ] Peças utilizadas (tabela)
- [ ] Custos (peças + mão de obra = total)
- [ ] Anexos (galeria)
- [ ] Timeline de execução

#### **Componente: Gráficos de Manutenção**
**Arquivo:** `components/graficos-manutencao.tsx` (criar)

**Gráficos:**
- [ ] Frequência de manutenções (linha)
- [ ] Custos acumulados (barra)
- [ ] Tipos de manutenção (pizza)
- [ ] Timeline de manutenções (calendário)

---

### ✅ 8.5. Alertas de Manutenção

#### **Componente: Alertas de Manutenção**
**Arquivo:** `components/alertas-manutencao.tsx` (criar)

**Funcionalidades:**
- [ ] Listagem de manutenções próximas
- [ ] Alertas de atrasos
- [ ] Manutenções corretivas urgentes
- [ ] Notificações no sistema

---

## 🛠️ COMPONENTES REUTILIZÁVEIS

### ✅ Componentes de Upload

#### **Componente: Upload Genérico**
**Arquivo:** `components/documento-upload.tsx` (criar)

**Props:**
```typescript
interface DocumentoUploadProps {
  accept?: string // 'application/pdf,image/*'
  maxSize?: number // em bytes
  onUpload: (file: File) => void
  onRemove?: () => void
  preview?: boolean
  label?: string
  required?: boolean
}
```

#### **Componente: Upload Múltiplo**
**Arquivo:** `components/multi-file-upload.tsx` (verificar se já existe)

**Se não existir, criar:**
- [ ] Upload de múltiplos arquivos
- [ ] Preview de cada arquivo
- [ ] Remoção individual
- [ ] Validação de tipos e tamanhos

---

### ✅ Componentes de Validação

#### **Componente: CNPJ Input**
**Arquivo:** `components/cnpj-input.tsx` (criar)

**Funcionalidades:**
- [ ] Máscara de CNPJ
- [ ] Validação de CNPJ
- [ ] Mensagem de erro se inválido

#### **Componente: CPF Input**
**Arquivo:** `components/cpf-input.tsx` (verificar se já existe)

**Se não existir, criar:**
- [ ] Máscara de CPF
- [ ] Validação de CPF

---

### ✅ Componentes de Status/Badge

#### **Componente: Status Badge Genérico**
**Arquivo:** `components/status-badge.tsx` (criar)

**Funcionalidades:**
- [ ] Badge com cores por status
- [ ] Ícones opcionais
- [ ] Variantes: success, warning, error, info

---

## 📡 API CLIENTS (lib/api-*.ts)

### Estrutura Padrão de API Client

```typescript
// Exemplo: lib/api-certificados.ts

import { apiClient } from '@/lib/api-client'

export interface Certificado {
  id: number
  colaborador_id: number
  tipo: string
  nome: string
  data_validade: string
  arquivo: string
  alerta_enviado: boolean
}

export interface CertificadoData {
  tipo: string
  nome: string
  data_validade: string
  arquivo: File
}

export const certificadosAPI = {
  async listar(colaboradorId: number): Promise<Certificado[]> {
    const response = await apiClient.get(`/colaboradores/${colaboradorId}/certificados`)
    return response.data
  },

  async criar(colaboradorId: number, data: CertificadoData): Promise<Certificado> {
    const formData = new FormData()
    formData.append('tipo', data.tipo)
    formData.append('nome', data.nome)
    formData.append('data_validade', data.data_validade)
    formData.append('arquivo', data.arquivo)

    const response = await apiClient.post(`/colaboradores/${colaboradorId}/certificados`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  async atualizar(id: number, data: Partial<CertificadoData>): Promise<Certificado> {
    // Implementação
  },

  async excluir(id: number): Promise<void> {
    await apiClient.delete(`/certificados/${id}`)
  },

  async verificarVencendo(): Promise<Certificado[]> {
    const response = await apiClient.get('/certificados/vencendo')
    return response.data
  }
}
```

---

## 🎨 PÁGINAS A CRIAR/MODIFICAR

### Páginas Novas (Criar)

1. `app/dashboard/rh/colaboradores/[id]/certificados/page.tsx`
2. `app/dashboard/rh/colaboradores/[id]/documentos-admissionais/page.tsx`
3. `app/dashboard/rh/colaboradores/[id]/holerites/page.tsx`
4. `app/dashboard/gruas/[id]/componentes/importar/page.tsx`
5. `app/dashboard/gruas/[id]/livro/page.tsx`
6. `app/dashboard/financeiro/vendas/ordem-compras/page.tsx`
7. `app/dashboard/obras/[id]/checklist/page.tsx`
8. `app/dashboard/obras/[id]/manutencoes/page.tsx`
9. `app/dashboard/gruas/[id]/manutencoes/page.tsx`

### Páginas a Modificar

1. `app/dashboard/obras/nova/page.tsx` - Adicionar campos CNO, ART, Apólice, Responsável Técnico, Sinaleiros
2. `app/dashboard/obras/[id]/page.tsx` - Adicionar abas/seções novas
3. `app/dashboard/obras/page.tsx` - Adicionar alertas de fim de obra

---

## 🪝 HOOKS CUSTOMIZADOS

### Hooks a Criar

1. `hooks/use-alertas-obras.ts` - Alertas de fim de obra
2. `hooks/use-certificados.ts` - Gestão de certificados
3. `hooks/use-documentos-admissionais.ts` - Gestão de documentos admissionais
4. `hooks/use-holerites.ts` - Gestão de holerites
5. `hooks/use-checklist.ts` - Gestão de checklist
6. `hooks/use-manutencoes.ts` - Gestão de manutenções
7. `hooks/use-ordem-compras.ts` - Gestão de ordem de compras

### Hooks a Modificar

1. `hooks/use-permissions.ts` - Adicionar `hasGlobalAccessToObras()`

---

## 📦 DEPENDÊNCIAS A ADICIONAR

```json
{
  "dependencies": {
    "xlsx": "^0.18.5",           // Para importação Excel
    "exceljs": "^4.4.0",         // Alternativa ao xlsx
    "papaparse": "^5.4.1",       // Para parsing CSV
    "react-signature-canvas": "^1.0.6", // Para assinatura digital (se não existir)
    "recharts": "^2.10.0",       // Para gráficos
    "date-fns": "^2.30.0",       // Para manipulação de datas
    "react-dropzone": "^14.2.3"  // Para drag & drop de arquivos
  }
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO FRONTEND

### Prioridade ALTA 🔴

- [x] Componentes de upload de documentos reutilizáveis ✅
- [x] Formulário de Responsável Técnico ✅
- [x] Formulário de Sinaleiros ✅
- [x] Listagem e upload de documentos do sinaleiro ✅
- [x] Integração de CNO, ART e Apólice no formulário de obra ✅
- [x] Integração de Responsável Técnico no formulário de obra ✅
- [x] Integração de Sinaleiros no formulário de obra ✅
- [ ] Página de Certificados do Colaborador (já implementada com mock)
- [ ] Página de Documentos Admissionais
- [ ] Página de Holerites
- [ ] Checkbox de acesso global em Cargos
- [ ] Lógica de acesso global em permissões
- [ ] Página de Checklist Diário
- [ ] Página de Manutenções

### Prioridade MÉDIA 🟡

- [ ] Importação de componentes via Excel
- [ ] Página de Livro de Grua
- [ ] Página de Ordem de Compras
- [ ] Fluxo de aprovação visual
- [ ] Agenda preventiva de manutenções
- [ ] Gráficos e relatórios

### Prioridade BAIXA 🟢

- [ ] Melhorias de UI/UX
- [ ] Animações
- [ ] Otimizações de performance

---

## 📝 NOTAS DE IMPLEMENTAÇÃO

1. **Reutilização**: Sempre verificar componentes existentes antes de criar novos
2. **Validação**: Validar tanto no frontend quanto no backend
3. **Loading States**: Sempre mostrar estados de loading durante requisições
4. **Error Handling**: Tratar erros e exibir mensagens claras ao usuário
5. **Responsividade**: Garantir que todos os componentes funcionem em mobile
6. **Acessibilidade**: Usar labels, ARIA labels e navegação por teclado

---

**Última atualização:** 2025  
**Responsável:** Equipe de Desenvolvimento Frontend

