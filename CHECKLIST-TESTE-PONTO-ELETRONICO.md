# 📋 Checklist de Testes - Ponto Eletrônico

## 🎯 Visão Geral
Este documento lista todos os testes necessários para validar o funcionamento completo da página de Ponto Eletrônico (`/dashboard/ponto`).

### ⚠️ IMPORTANTE - Fluxo de Uso:
- **Funcionários**: Acessam o **PWA** (`/pwa/ponto`) para **bater o ponto** - **NÃO usam** `/dashboard/ponto`
- **Supervisores**: Acessam o **PWA** (`/pwa/aprovacoes`) para **aprovar horas extras** com **assinatura digital** - **NÃO usam** `/dashboard/ponto` para aprovar
- **Admin/Gestor**: Acessam `/dashboard/ponto` para **gerenciar tudo** (visualizar, editar, exportar, criar justificativas)

---

## 👨‍💼 TESTES PARA ADMIN/GESTOR

> **Nota**: Admin e Gestor têm acesso total ao sistema de ponto eletrônico no dashboard.

### 1. ✅ ACESSO E NAVEGAÇÃO
- [ ] Acessar a página `/dashboard/ponto` sem erros
- [ ] Verificar se a permissão `ponto_eletronico:visualizar` está funcionando
- [ ] Verificar se todos os 4 tabs estão visíveis:
  - [ ] Registros de Ponto
  - [ ] Controle de Horas Extras
  - [ ] Justificativas
  - [ ] Relatório Mensal
- [ ] Verificar se o relógio em tempo real está funcionando no topo da página

### 2. 📊 VISUALIZAÇÃO DE DADOS
- [ ] Verificar se os cards de estatísticas estão exibindo corretamente:
  - [ ] Funcionários Presentes
  - [ ] Atrasos Hoje
  - [ ] Horas Extras Pendentes
  - [ ] Total Horas Extras
- [ ] Verificar se a lista de funcionários está completa (todos os funcionários)
- [ ] Verificar se os registros de todos os funcionários são exibidos
- [ ] Verificar se os registros estão ordenados corretamente (mais recente primeiro)

### 3. 🔍 FILTROS E BUSCA
- [ ] Testar filtro por funcionário (selecionar um funcionário específico)
- [ ] Testar filtro por data (selecionar uma data específica)
- [ ] Testar busca textual (buscar por nome de funcionário)
- [ ] Testar combinação de filtros (funcionário + data)
- [ ] Verificar se a paginação funciona corretamente com os filtros
- [ ] Testar mudança de itens por página (10, 20, 50, 100)

### 4. 📝 REGISTRO DE PONTO (Como Admin/Gestor)
- [ ] Verificar se pode selecionar qualquer funcionário no dropdown
- [ ] Testar registro de Entrada para um funcionário
- [ ] Testar registro de Saída Almoço
- [ ] Testar registro de Volta Almoço
- [ ] Testar registro de Saída
- [ ] Verificar se os botões ficam desabilitados corretamente após cada registro
- [ ] Verificar se o status do registro é atualizado em tempo real
- [ ] Verificar se aparece mensagem de sucesso após cada registro

### 5. ✏️ EDIÇÃO DE REGISTROS
- [ ] Clicar em "Ver Info" ou "Editar" em um registro
- [ ] Verificar se o modal de edição abre corretamente
- [ ] Testar edição de horários:
  - [ ] Entrada
  - [ ] Saída Almoço
  - [ ] Volta Almoço
  - [ ] Saída
- [ ] Verificar se o cálculo automático de horas trabalhadas funciona
- [ ] Verificar se o cálculo de horas extras funciona corretamente
- [ ] Adicionar justificativa de alteração
- [ ] Adicionar observações
- [ ] Salvar edição e verificar se o registro foi atualizado
- [ ] Verificar se a justificativa de alteração aparece no histórico

### 6. ⏰ CONTROLE DE HORAS EXTRAS
- [ ] Acessar a aba "Controle de Horas Extras"
- [ ] Verificar se as estatísticas são exibidas:
  - [ ] Total de Registros
  - [ ] Total de Horas Extras
  - [ ] Média de Horas Extras
  - [ ] Máximo de Horas Extras
  - [ ] Total de Funcionários
  - [ ] Média por Funcionário
- [ ] Verificar se os filtros (funcionário e data) funcionam nesta aba
- [ ] Testar seleção de múltiplos registros (checkbox)
- [ ] Testar aprovação em lote de horas extras
- [ ] Testar rejeição em lote de horas extras
- [ ] Testar aprovação individual de horas extras:
  - [ ] Clicar em "✓ Aprovar" em um registro pendente
  - [ ] Preencher justificativa obrigatória
  - [ ] Adicionar observações (opcional)
  - [ ] Confirmar aprovação
  - [ ] Verificar se o status muda para "Aprovado"
- [ ] Testar rejeição individual de horas extras:
  - [ ] Clicar em "✗ Reprovar" em um registro pendente
  - [ ] Preencher motivo obrigatório
  - [ ] Adicionar observações (opcional)
  - [ ] Confirmar rejeição
  - [ ] Verificar se o status muda para "Rejeitado"
- [ ] Testar botão "Notificar" (enviar notificação WhatsApp ao supervisor)
- [ ] Verificar se os registros aprovados aparecem com badge verde
- [ ] Verificar se os registros rejeitados aparecem com badge vermelho

### 7. 📄 JUSTIFICATIVAS
- [ ] Acessar a aba "Justificativas"
- [ ] Verificar se todas as justificativas são exibidas (de todos os funcionários)
- [ ] Testar filtro por nome de funcionário
- [ ] Testar expansão de justificativa (clicar para ver detalhes)
- [ ] Verificar se os detalhes expandidos mostram:
  - [ ] Motivo completo
  - [ ] Observações (se houver)
  - [ ] Arquivos anexados (se houver)
- [ ] Testar download de arquivos anexados
- [ ] Criar nova justificativa:
  - [ ] Clicar em "Justificativa" no topo
  - [ ] Selecionar funcionário (qualquer um)
  - [ ] Selecionar data
  - [ ] Selecionar tipo (Atraso, Falta, Saída Antecipada, Ausência Parcial)
  - [ ] Preencher motivo
  - [ ] Salvar e verificar se aparece na lista
- [ ] Testar aprovação de justificativa:
  - [ ] Clicar em "Aprovar" em uma justificativa pendente
  - [ ] Verificar se o status muda para "Aprovado"
- [ ] Testar rejeição de justificativa:
  - [ ] Clicar em "Rejeitar" em uma justificativa pendente
  - [ ] Preencher motivo da rejeição
  - [ ] Verificar se o status muda para "Rejeitado"

### 8. 📊 RELATÓRIO MENSAL
- [ ] Acessar a aba "Relatório Mensal"
- [ ] Selecionar mês e ano diferentes
- [ ] Verificar se o relatório é carregado corretamente
- [ ] Verificar se o resumo por funcionário está correto:
  - [ ] Total de horas trabalhadas
  - [ ] Dias presentes
  - [ ] Atrasos
  - [ ] Faltas
- [ ] Verificar se a tabela de registros detalhados está completa
- [ ] Testar exportação do relatório:
  - [ ] Exportar em PDF
  - [ ] Exportar em CSV
  - [ ] Exportar em Excel/JSON
- [ ] Verificar se os arquivos exportados contêm os dados corretos

### 9. 📤 EXPORTAÇÃO DE DADOS
- [ ] Testar botão "Exportar" no topo da página
- [ ] Verificar se os formatos disponíveis funcionam:
  - [ ] PDF
  - [ ] CSV
  - [ ] Excel/JSON
- [ ] Verificar se os dados exportados estão corretos
- [ ] Verificar se os filtros aplicados são respeitados na exportação

### 10. 🔔 NOTIFICAÇÕES E FEEDBACK
- [ ] Verificar se as mensagens de sucesso aparecem após ações
- [ ] Verificar se as mensagens de erro aparecem quando necessário
- [ ] Testar notificação WhatsApp para supervisor (botão "Notificar")

### 11. 🎨 INTERFACE E UX
- [ ] Verificar se os badges de status estão corretos:
  - [ ] Aprovado (verde)
  - [ ] Pendente (laranja)
  - [ ] Normal (cinza)
  - [ ] Insuficiente (vermelho)
  - [ ] Incompleto (amarelo)
- [ ] Verificar se os tooltips/hovers funcionam (ToggleEntrada, ToggleSaida)
- [ ] Verificar se a paginação avançada está funcionando
- [ ] Verificar responsividade em diferentes tamanhos de tela

### 12. 🔒 PERMISSÕES E SEGURANÇA
- [ ] Verificar se admin/gestor pode ver todos os funcionários
- [ ] Verificar se admin/gestor pode editar registros de qualquer funcionário
- [ ] Verificar se admin/gestor pode aprovar/rejeitar horas extras
- [ ] Verificar se admin/gestor pode aprovar/rejeitar justificativas

---

## 👔 TESTES PARA SUPERVISOR (PWA)

> **⚠️ IMPORTANTE**: Supervisor acessa o **PWA** (`/pwa/aprovacoes`) para **aprovar horas extras** com **assinatura digital**. **NÃO usa** `/dashboard/ponto` para aprovar.

### 📱 TESTES NO PWA - APROVAÇÕES (`/pwa/aprovacoes`)

### 1. ✅ ACESSO E NAVEGAÇÃO
- [ ] Acessar a página `/pwa/aprovacoes` sem erros
- [ ] Verificar se está autenticado como supervisor
- [ ] Verificar se a interface está otimizada para mobile
- [ ] Verificar se a lista de aprovações pendentes é carregada

### 2. 📋 LISTAGEM DE APROVAÇÕES PENDENTES
- [ ] Verificar se as horas extras pendentes são exibidas
- [ ] Verificar se cada item mostra:
  - [ ] Nome do funcionário
  - [ ] Data do registro
  - [ ] Horas extras
  - [ ] Período (entrada - saída)
  - [ ] Status (Pendente)
- [ ] Verificar se pode expandir/colapsar detalhes de cada aprovação
- [ ] Verificar se os filtros funcionam (se houver)
- [ ] Verificar se a paginação funciona (se houver muitos registros)

### 3. ✍️ APROVAÇÃO INDIVIDUAL COM ASSINATURA
- [ ] Selecionar uma aprovação pendente
- [ ] Verificar se os detalhes completos são exibidos:
  - [ ] Informações do funcionário
  - [ ] Data e horários
  - [ ] Total de horas extras
  - [ ] Observações (se houver)
- [ ] Clicar em "Aprovar" ou acessar página de aprovação
- [ ] Verificar se o componente de assinatura digital é exibido
- [ ] Testar desenhar assinatura no canvas:
  - [ ] Desenhar assinatura
  - [ ] Verificar se a assinatura aparece
  - [ ] Testar limpar assinatura
  - [ ] Testar redesenhar
- [ ] Preencher observações (se solicitado)
- [ ] Confirmar aprovação com assinatura
- [ ] Verificar se a aprovação foi salva com sucesso
- [ ] Verificar se o status muda para "Aprovado"
- [ ] Verificar se a assinatura foi salva corretamente
- [ ] Verificar se aparece mensagem de sucesso

### 4. ❌ REJEIÇÃO DE HORAS EXTRAS
- [ ] Selecionar uma aprovação pendente
- [ ] Clicar em "Rejeitar"
- [ ] Preencher motivo da rejeição (obrigatório)
- [ ] Adicionar observações (se solicitado)
- [ ] Confirmar rejeição
- [ ] Verificar se a rejeição foi salva com sucesso
- [ ] Verificar se o status muda para "Rejeitado"
- [ ] Verificar se aparece mensagem de confirmação

### 5. 📝 APROVAÇÃO EM MASSA (`/pwa/aprovacao-massa`)
- [ ] Acessar a página de aprovação em massa
- [ ] Verificar se pode selecionar múltiplas aprovações
- [ ] Selecionar várias aprovações pendentes
- [ ] Verificar se o contador de selecionadas é exibido
- [ ] Clicar em "Aprovar em Massa" ou similar
- [ ] Verificar se o componente de assinatura digital é exibido
- [ ] Assinar digitalmente uma vez para todas as aprovações
- [ ] Confirmar aprovação em massa
- [ ] Verificar se todas as aprovações selecionadas foram aprovadas
- [ ] Verificar se a assinatura foi aplicada a todas
- [ ] Verificar se aparece mensagem de sucesso

### 6. 🔍 DETALHES DE APROVAÇÃO (`/pwa/aprovacao-detalhes`)
- [ ] Acessar detalhes de uma aprovação específica
- [ ] Verificar se todas as informações são exibidas:
  - [ ] Dados do funcionário
  - [ ] Data e horários completos
  - [ ] Cálculo de horas trabalhadas
  - [ ] Cálculo de horas extras
  - [ ] Status atual
  - [ ] Histórico de aprovações (se houver)
- [ ] Verificar se pode aprovar a partir dos detalhes
- [ ] Verificar se pode rejeitar a partir dos detalhes

### 7. ✍️ ASSINATURA DIGITAL
- [ ] Verificar se o canvas de assinatura está funcionando
- [ ] Testar desenhar assinatura com o dedo (mobile)
- [ ] Testar desenhar assinatura com mouse (desktop)
- [ ] Verificar se a assinatura é salva como imagem/base64
- [ ] Verificar se pode limpar e redesenhar
- [ ] Verificar se a assinatura é obrigatória para aprovar
- [ ] Verificar se não pode aprovar sem assinar
- [ ] Verificar se a assinatura aparece no histórico após aprovação

### 8. 📊 VISUALIZAÇÃO DE APROVAÇÕES JÁ PROCESSADAS
- [ ] Verificar se pode visualizar aprovações já aprovadas
- [ ] Verificar se pode visualizar aprovações rejeitadas
- [ ] Verificar se a assinatura digital aparece nas aprovações aprovadas
- [ ] Verificar se os dados do aprovador são exibidos
- [ ] Verificar se a data/hora da aprovação é exibida

### 9. 🔄 SINCRONIZAÇÃO E OFFLINE
- [ ] Verificar se funciona sem conexão com internet
- [ ] Verificar se as aprovações são salvas localmente quando offline
- [ ] Verificar se as aprovações são sincronizadas quando voltar online
- [ ] Verificar se aparece indicador de status de conexão

### 10. 🔒 PERMISSÕES E SEGURANÇA
- [ ] Verificar se supervisor pode aprovar horas extras dos funcionários
- [ ] Verificar se supervisor pode rejeitar horas extras
- [ ] Verificar se supervisor pode ver aprovações de outros supervisores (se aplicável)
- [ ] Verificar se a assinatura digital é obrigatória
- [ ] Verificar se não pode aprovar sem assinar
- [ ] Verificar se a assinatura é vinculada ao supervisor que aprovou

---

## 👷 TESTES PARA FUNCIONÁRIO (PWA)

> **⚠️ IMPORTANTE**: Funcionários **NÃO acessam** `/dashboard/ponto`. Eles usam o **PWA** (`/pwa/ponto`) para bater o ponto.

### 📱 TESTES NO PWA (`/pwa/ponto`)

### 1. ✅ ACESSO E NAVEGAÇÃO
- [ ] Acessar a página `/pwa/ponto` sem erros
- [ ] Verificar se está autenticado como funcionário
- [ ] Verificar se o relógio em tempo real está funcionando
- [ ] Verificar se a interface está otimizada para mobile

### 2. 📍 LOCALIZAÇÃO E VALIDAÇÃO
- [ ] Verificar se a localização GPS é solicitada
- [ ] Verificar se a localização é capturada corretamente
- [ ] Verificar se a validação de proximidade da obra funciona
- [ ] Verificar se aparece mensagem de erro se estiver longe da obra
- [ ] Verificar se aparece mensagem de sucesso se estiver próximo da obra

### 3. 📝 REGISTRO DE PONTO
- [ ] Verificar se o status do registro de hoje é exibido corretamente
- [ ] Testar registro de Entrada:
  - [ ] Clicar no botão de Entrada
  - [ ] Verificar se solicita assinatura (se horas extras)
  - [ ] Assinar (se necessário)
  - [ ] Verificar se o horário foi registrado
  - [ ] Verificar mensagem de sucesso
- [ ] Testar registro de Saída Almoço:
  - [ ] Clicar no botão de Saída Almoço
  - [ ] Verificar se o horário foi registrado
- [ ] Testar registro de Volta Almoço:
  - [ ] Clicar no botão de Volta Almoço
  - [ ] Verificar se o horário foi registrado
- [ ] Testar registro de Saída:
  - [ ] Clicar no botão de Saída
  - [ ] Verificar se solicita assinatura (se horas extras)
  - [ ] Assinar (se necessário)
  - [ ] Verificar se o horário foi registrado
  - [ ] Verificar se o registro fica completo
- [ ] Verificar se os botões ficam desabilitados corretamente após cada registro
- [ ] Verificar se não é possível registrar entrada novamente sem saída
- [ ] Verificar se não é possível registrar saída sem entrada

### 4. ✍️ ASSINATURA DIGITAL
- [ ] Verificar se a assinatura é solicitada para horas extras
- [ ] Testar desenhar assinatura no canvas
- [ ] Testar limpar assinatura
- [ ] Testar confirmar assinatura
- [ ] Verificar se a assinatura é salva corretamente

### 5. 📊 VISUALIZAÇÃO DE REGISTROS
- [ ] Verificar se os registros do dia são exibidos
- [ ] Verificar se os horários registrados aparecem corretamente
- [ ] Verificar se o status (Em Andamento, Completo) é exibido

### 6. 🔄 OFFLINE/MODO OFFLINE
- [ ] Verificar se funciona sem conexão com internet
- [ ] Verificar se os registros são salvos localmente quando offline
- [ ] Verificar se os registros são sincronizados quando voltar online
- [ ] Verificar se aparece indicador de status de conexão

### 7. 📄 ESPELHO DE PONTO (PWA)
- [ ] Acessar `/pwa/espelho-ponto`
- [ ] Verificar se os registros mensais são exibidos
- [ ] Verificar se pode filtrar por mês/ano
- [ ] Verificar se pode exportar o espelho de ponto
- [ ] Verificar se os cálculos de horas estão corretos

### 8. 🔒 PERMISSÕES E SEGURANÇA
- [ ] Verificar se funcionário pode registrar apenas seu próprio ponto
- [ ] Verificar se funcionário NÃO pode ver registros de outros funcionários
- [ ] Verificar se funcionário NÃO pode editar registros já registrados
- [ ] Verificar se a localização é obrigatória para registro

---

## 🧪 TESTES DE INTEGRAÇÃO E CASOS ESPECIAIS

### 1. ⚠️ CASOS DE ERRO
- [ ] Testar registro de ponto sem conexão com internet
- [ ] Testar edição de registro com dados inválidos
- [ ] Testar aprovação sem preencher justificativa obrigatória
- [ ] Testar rejeição sem preencher motivo obrigatório
- [ ] Testar exportação com dados vazios
- [ ] Testar filtros com datas inválidas

### 2. 🔄 SINCRONIZAÇÃO E ATUALIZAÇÃO
- [ ] Verificar se os dados são atualizados após ações
- [ ] Verificar se a paginação é recalculada após filtros
- [ ] Verificar se as estatísticas são atualizadas em tempo real
- [ ] Testar recarregamento da página e verificar se os dados persistem

### 3. 📱 RESPONSIVIDADE
- [ ] Testar em desktop (1920x1080)
- [ ] Testar em tablet (768x1024)
- [ ] Testar em mobile (375x667)
- [ ] Verificar se todos os elementos são acessíveis em diferentes tamanhos

### 4. ⚡ PERFORMANCE
- [ ] Verificar tempo de carregamento inicial
- [ ] Verificar tempo de resposta dos filtros
- [ ] Verificar tempo de exportação de relatórios grandes
- [ ] Verificar se não há múltiplas chamadas desnecessárias à API

### 5. 🔐 VALIDAÇÕES
- [ ] Verificar se não é possível registrar entrada duplicada
- [ ] Verificar se não é possível registrar saída sem entrada
- [ ] Verificar se não é possível registrar volta almoço sem saída almoço
- [ ] Verificar se os cálculos de horas estão corretos
- [ ] Verificar se as validações de formulários estão funcionando

---

## 📝 OBSERVAÇÕES IMPORTANTES

### Fluxo de Uso Correto:
1. **Funcionário** → Acessa **PWA** (`/pwa/ponto`) para **bater o ponto**
   - Registra entrada, saída almoço, volta almoço, saída
   - Usa GPS para validação de localização
   - Assina digitalmente quando há horas extras
   - Visualiza apenas seus próprios registros

2. **Supervisor** → Acessa **PWA** (`/pwa/aprovacoes`) para **aprovar horas extras com assinatura digital**
   - Visualiza horas extras pendentes dos funcionários
   - Aprova horas extras com assinatura digital obrigatória
   - Rejeita horas extras (com motivo)
   - Pode fazer aprovação em massa (uma assinatura para múltiplas aprovações)
   - **NÃO usa** `/dashboard/ponto` para aprovar (usa apenas PWA)

3. **Admin/Gestor** → Acessa **Dashboard** (`/dashboard/ponto`) para **gerenciar tudo**
   - Visualiza e gerencia registros de todos os funcionários
   - Edita registros de qualquer funcionário
   - Exporta relatórios completos
   - Cria justificativas para qualquer funcionário
   - Visualiza aprovações (mas aprovação com assinatura é feita no PWA)

### Diferenças entre Perfis:

| Funcionalidade | Funcionário (PWA) | Supervisor (PWA) | Admin/Gestor (Dashboard) |
|---------------|-------------------|------------------|--------------------------|
| Registrar ponto | ✅ Próprio | ❌ | ✅ Qualquer |
| Visualizar registros | ✅ Próprios | ✅ Todos | ✅ Todos |
| Aprovar horas extras | ❌ | ✅ PWA com assinatura | ⚠️ Visualiza apenas |
| Editar registros | ❌ | ❌ | ✅ |
| Exportar relatórios | ✅ Próprios | ⚠️ Limitado | ✅ Todos |
| Criar justificativas | ✅ Próprio | ✅ Qualquer | ✅ Qualquer |
| Aprovar justificativas | ❌ | ✅ | ✅ |

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

### Para Admin/Gestor (`/dashboard/ponto`):
- ✅ Deve conseguir visualizar e gerenciar registros de todos os funcionários
- ✅ Deve conseguir aprovar/rejeitar horas extras e justificativas
- ✅ Deve conseguir editar registros de qualquer funcionário
- ✅ Deve conseguir exportar relatórios completos
- ✅ Deve conseguir criar justificativas para qualquer funcionário

### Para Supervisor (`/pwa/aprovacoes`):
- ✅ Deve conseguir visualizar horas extras pendentes dos funcionários
- ✅ Deve conseguir aprovar horas extras com **assinatura digital obrigatória** (função principal)
- ✅ Deve conseguir rejeitar horas extras (com motivo)
- ✅ Deve conseguir fazer aprovação em massa (uma assinatura para múltiplas)
- ✅ Deve usar o **PWA** para aprovar (não o dashboard)
- ✅ A assinatura digital deve ser salva e vinculada ao supervisor

### Para Funcionário (`/pwa/ponto`):
- ✅ Deve conseguir registrar seu próprio ponto no PWA
- ✅ Deve usar GPS para validação de localização
- ✅ Deve assinar digitalmente quando há horas extras
- ✅ Deve conseguir visualizar apenas seus próprios registros
- ✅ Deve conseguir criar justificativas para si mesmo
- ✅ Deve funcionar offline e sincronizar quando online
- ❌ NÃO deve conseguir aprovar/rejeitar horas extras ou justificativas
- ❌ NÃO deve conseguir editar registros já registrados
- ❌ NÃO deve acessar `/dashboard/ponto` (usa apenas PWA)

---

---

## 🔗 LINKS RELACIONADOS

### PWA (Mobile/App):
- **PWA Ponto**: `/pwa/ponto` - Para funcionários baterem o ponto
- **PWA Aprovações**: `/pwa/aprovacoes` - Para supervisores aprovarem horas extras com assinatura
- **PWA Aprovação em Massa**: `/pwa/aprovacao-massa` - Para supervisores aprovarem múltiplas horas extras
- **PWA Detalhes Aprovação**: `/pwa/aprovacao-detalhes` - Para visualizar detalhes de uma aprovação
- **PWA Espelho de Ponto**: `/pwa/espelho-ponto` - Para funcionários visualizarem seus registros mensais

### Dashboard (Desktop):
- **Dashboard Ponto**: `/dashboard/ponto` - Para admin/gestor gerenciarem o sistema (visualizar, editar, exportar)

---

**Data de Criação:** 2025-02-02  
**Última Atualização:** 2025-02-02  
**Versão:** 3.0 (Atualizado: Supervisores usam PWA para aprovar com assinatura digital)

