# 📊 LEVANTAMENTO COMPLETO: FRONTEND, BACKEND E MOCKS

**Data:** 26/02/2025  
**Escopo:** Análise completa de todos os arquivos do sistema

---

## 📱 FRONTEND

### 1.1 Estrutura de Páginas (`/app`)

#### Dashboard (Desktop) - 124 arquivos `.tsx`

**Módulo: Obras**
- `app/dashboard/obras/page.tsx` - Listagem de obras
- `app/dashboard/obras/nova/page.tsx` - Criação de obra
- `app/dashboard/obras/[id]/page.tsx` - Detalhes da obra
- `app/dashboard/obras/[id]/checklist/page.tsx` - Checklist de devolução
- `app/dashboard/obras/[id]/manutencoes/page.tsx` - Manutenções da obra

**Módulo: Gruas**
- `app/dashboard/gruas/page.tsx` - Listagem de gruas (2514 linhas)
- `app/dashboard/gruas/page-old.tsx` - Versão antiga (deve ser removida)
- `app/dashboard/gruas/gruas-new/page.tsx` - Nova versão
- `app/dashboard/gruas/gruas-mes/page.tsx` - Gruas por mês
- `app/dashboard/gruas/[id]/page.tsx` - Detalhes da grua
- `app/dashboard/gruas/[id]/componentes/page.tsx` - Componentes
- `app/dashboard/gruas/[id]/configuracoes/page.tsx` - Configurações
- `app/dashboard/gruas/[id]/manutencoes/page.tsx` - Manutenções
- `app/dashboard/gruas/[id]/livro/page.tsx` - Livro da grua

**Módulo: Ponto Eletrônico**
- `app/dashboard/ponto/page.tsx` - Registros de ponto
- `app/dashboard/ponto/aprovacoes/page.tsx` - Aprovações de horas extras
- `app/dashboard/ponto/relatorios/page.tsx` - Relatórios de ponto

**Módulo: RH**
- `app/dashboard/rh/page.tsx` - Gestão de funcionários e cargos
- `app/dashboard/rh/[id]/page.tsx` - Detalhes do funcionário
- `app/dashboard/rh/colaboradores/[id]/certificados/page.tsx` - Certificados
- `app/dashboard/rh/colaboradores/[id]/documentos-admissionais/page.tsx` - Documentos
- `app/dashboard/rh/colaboradores/[id]/holerites/page.tsx` - Holerites
- `app/dashboard/rh/cargos/page.tsx` - Gestão de cargos
- `app/dashboard/rh-completo/page.tsx` - RH Completo
- `app/dashboard/rh-completo/auditoria/page.tsx` - Auditoria
- `app/dashboard/rh-completo/cargos/page.tsx` - Cargos
- `app/dashboard/rh-completo/ferias/page.tsx` - Férias
- `app/dashboard/rh-completo/historico/page.tsx` - Histórico
- `app/dashboard/rh-completo/horas/page.tsx` - Horas
- `app/dashboard/rh-completo/obras/page.tsx` - Obras
- `app/dashboard/rh-completo/ponto/page.tsx` - Ponto
- `app/dashboard/rh-completo/relatorios/page.tsx` - Relatórios
- `app/dashboard/rh-completo/remuneracao/page.tsx` - Remuneração
- `app/dashboard/rh-completo/vales/page.tsx` - Vales

**Módulo: Financeiro**
- `app/dashboard/financeiro/page.tsx` - Dashboard financeiro
- `app/dashboard/financeiro/alugueis/page.tsx` - Aluguéis
- `app/dashboard/financeiro/cadastro/page.tsx` - Cadastros
- `app/dashboard/financeiro/compras/page.tsx` - Compras
- `app/dashboard/financeiro/contas-bancarias/page.tsx` - Contas bancárias
- `app/dashboard/financeiro/contas-pagar/page.tsx` - Contas a pagar
- `app/dashboard/financeiro/contas-receber/page.tsx` - Contas a receber
- `app/dashboard/financeiro/custos/page.tsx` - Custos
- `app/dashboard/financeiro/impostos/page.tsx` - Impostos
- `app/dashboard/financeiro/locacoes/page.tsx` - Locações
- `app/dashboard/financeiro/logistica/page.tsx` - Logística
- `app/dashboard/financeiro/medicoes/page.tsx` - Medições
- `app/dashboard/financeiro/orcamentos/page.tsx` - Orçamentos
- `app/dashboard/financeiro/receitas/page.tsx` - Receitas
- `app/dashboard/financeiro/relatorios/page.tsx` - Relatórios
- `app/dashboard/financeiro/rentabilidade/page.tsx` - Rentabilidade
- `app/dashboard/financeiro/transferencias/page.tsx` - Transferências
- `app/dashboard/financeiro/vendas/page.tsx` - Vendas
- `app/dashboard/financeiro/vendas/ordem-compras/page.tsx` - Ordens de compra

**Módulo: Usuários e Permissões**
- `app/dashboard/usuarios/page.tsx` - Listagem de usuários
- `app/dashboard/usuarios/[id]/page.tsx` - Detalhes do usuário
- `app/dashboard/perfis/page.tsx` - Perfis
- `app/dashboard/perfis-permissoes/page.tsx` - Perfis e permissões
- `app/dashboard/permissoes/page.tsx` - Permissões

**Módulo: Outros**
- `app/dashboard/page.tsx` - Dashboard principal
- `app/dashboard/clientes/page.tsx` - Clientes
- `app/dashboard/estoque/page.tsx` - Estoque
- `app/dashboard/complementos/page.tsx` - Complementos
- `app/dashboard/notificacoes/page.tsx` - Notificações
- `app/dashboard/relatorios/page.tsx` - Relatórios
- `app/dashboard/historico/page.tsx` - Histórico
- `app/dashboard/assinatura/page.tsx` - Assinaturas
- `app/dashboard/assinatura/[id]/page.tsx` - Detalhes de assinatura
- `app/dashboard/aprovacoes-horas-extras/page.tsx` - Aprovações
- `app/dashboard/aprovacoes-horas-extras/whatsapp/page.tsx` - WhatsApp
- `app/dashboard/checklist-devolucao/page.tsx` - Checklist de devolução
- `app/dashboard/livros-gruas/page.tsx` - Livros de gruas
- `app/dashboard/livros-gruas/[relacaoId]/livro/page.tsx` - Livro específico
- `app/dashboard/orcamentos/page.tsx` - Orçamentos
- `app/dashboard/orcamentos/novo/page.tsx` - Novo orçamento
- `app/dashboard/orcamentos/[id]/criar-obra/page.tsx` - Criar obra do orçamento
- `app/dashboard/configuracoes/empresa/page.tsx` - Configurações da empresa
- `app/dashboard/configuracoes/email/page.tsx` - Configurações de email

**Páginas de Teste/Demo**
- `app/teste-aprovacoes/page.tsx` - Página de teste de aprovações
- `app/navegacao-teste/page.tsx` - Página de teste de navegação
- `app/aprovacaop/[id]/page.tsx` - Aprovação pública

#### PWA (Mobile) - 30+ arquivos `.tsx`

**Módulo: Ponto Eletrônico**
- `app/pwa/page.tsx` - Home do PWA (1271 linhas)
- `app/pwa/ponto/page.tsx` - Registro de ponto
- `app/pwa/espelho-ponto/page.tsx` - Espelho de ponto
- `app/pwa/aprovacoes/page.tsx` - Aprovações de horas extras
- `app/pwa/aprovacao-detalhes/page.tsx` - Detalhes de aprovação
- `app/pwa/aprovacao-massa/page.tsx` - Aprovação em massa
- `app/pwa/aprovacao-assinatura/page.tsx` - Assinatura de aprovação

**Módulo: Obras**
- `app/pwa/obras/page.tsx` - Listagem de obras
- `app/pwa/obras/[id]/page.tsx` - Detalhes da obra (1115 linhas)
- `app/pwa/validar-obra/page.tsx` - Validação de obra

**Módulo: Gruas**
- `app/pwa/gruas/page.tsx` - Listagem de gruas
- `app/pwa/gruas/[id]/page.tsx` - Detalhes da grua

**Módulo: Perfil e Documentos**
- `app/pwa/perfil/page.tsx` - Perfil do usuário (2253 linhas)
- `app/pwa/documentos/page.tsx` - Documentos
- `app/pwa/holerites/page.tsx` - Holerites
- `app/pwa/notificacoes/page.tsx` - Notificações (492 linhas)

**Módulo: Outros**
- `app/pwa/login/page.tsx` - Login
- `app/pwa/forgot-password/page.tsx` - Esqueci senha
- `app/pwa/reset-password/[token]/page.tsx` - Redefinir senha
- `app/pwa/configuracoes/page.tsx` - Configurações
- `app/pwa/diagnostico/page.tsx` - Diagnóstico
- `app/pwa/encarregador/page.tsx` - Encarregador
- `app/pwa/gerenciar-funcionarios/page.tsx` - Gerenciar funcionários
- `app/pwa/fluxo-aprovacao-demo/page.tsx` - Demo de fluxo
- `app/pwa/redirect/page.tsx` - Redirecionamento

**Layouts**
- `app/pwa/layout.tsx` - Layout principal do PWA
- `app/pwa/layout-fixed.tsx` - Layout fixo
- `app/pwa/layout.tsx.backup` - Backup (deve ser removido)

#### Autenticação
- `app/auth/forgot-password/page.tsx` - Esqueci senha
- `app/auth/reset-password/[token]/page.tsx` - Redefinir senha

### 1.2 Componentes (`/components`) - 156 arquivos

**Componentes UI Base (shadcn/ui)**
- `components/ui/*` - 39 componentes base (button, card, dialog, etc.)

**Componentes de Negócio**
- `components/obra-search.tsx` - Busca de obras
- `components/grua-search.tsx` - Busca de gruas
- `components/cliente-search.tsx` - Busca de clientes
- `components/funcionario-search.tsx` - Busca de funcionários
- `components/sinaleiros-form.tsx` - Formulário de sinaleiros
- `components/editar-sinaleiro-dialog.tsx` - Dialog de edição
- `components/documentos-sinaleiro-list.tsx` - Lista de documentos
- `components/responsavel-tecnico-form.tsx` - Formulário de responsável técnico
- `components/grua-complementos-manager.tsx` - Gerenciador de complementos
- `components/multiple-gruas-manager.tsx` - Gerenciador de múltiplas gruas
- `components/livro-grua-form.tsx` - Formulário de livro de grua
- `components/livro-grua-list.tsx` - Lista de livros
- `components/livro-grua-checklist-list.tsx` - Checklist
- `components/livro-grua-funcionarios-list.tsx` - Funcionários
- `components/livro-grua-manutencao-list.tsx` - Manutenções
- `components/livro-grua-obra.tsx` - Obra no livro
- `components/manutencao-form.tsx` - Formulário de manutenção
- `components/manutencao-execucao-form.tsx` - Execução de manutenção
- `components/checklist-diario-form.tsx` - Formulário de checklist
- `components/checklist-modelo-form.tsx` - Modelo de checklist
- `components/create-funcionario-dialog.tsx` - Criar funcionário
- `components/edit-funcionario-dialog.tsx` - Editar funcionário
- `components/funcionario-row.tsx` - Linha de funcionário
- `components/create-cargo-dialog.tsx` - Criar cargo
- `components/edit-cargo-dialog.tsx` - Editar cargo
- `components/colaborador-certificados.tsx` - Certificados
- `components/colaborador-documentos-admissionais.tsx` - Documentos
- `components/colaborador-holerites.tsx` - Holerites
- `components/ponto-test-buttons.tsx` - Botões de teste
- `components/espelho-ponto-dialog.tsx` - Dialog de espelho
- `components/espelho-ponto-avancado.tsx` - Espelho avançado
- `components/justificativa-dialog.tsx` - Dialog de justificativa
- `components/aprovacao-horas-extras-dialog.tsx` - Dialog de aprovação
- `components/card-aprovacao-horas-extras.tsx` - Card de aprovação
- `components/filtros-aprovacoes.tsx` - Filtros
- `components/estatisticas-aprovacoes.tsx` - Estatísticas
- `components/botao-recalcular-ponto.tsx` - Botão recalcular
- `components/ordem-compra-form.tsx` - Formulário de ordem de compra
- `components/orcamento-pdf.tsx` - PDF de orçamento
- `components/orcamento-condicoes-dialog.tsx` - Condições
- `components/fluxo-aprovacao-compra.tsx` - Fluxo de aprovação
- `components/nc-plano-acao.tsx` - Plano de ação
- `components/agenda-preventiva.tsx` - Agenda preventiva
- `components/signature-pad.tsx` - Pad de assinatura
- `components/documento-upload.tsx` - Upload de documento
- `components/multi-file-upload.tsx` - Upload múltiplo
- `components/export-button.tsx` - Botão de exportação
- `components/advanced-filters.tsx` - Filtros avançados
- `components/global-search.tsx` - Busca global
- `components/notifications-dropdown.tsx` - Dropdown de notificações
- `components/notificacao-detail-modal.tsx` - Modal de notificação
- `components/nova-notificacao-dialog.tsx` - Nova notificação
- `components/user-dropdown.tsx` - Dropdown de usuário
- `components/welcome-screen.tsx` - Tela de boas-vindas
- `components/empty-state.tsx` - Estado vazio
- `components/stats-card.tsx` - Card de estatísticas
- `components/action-card.tsx` - Card de ação
- `components/loading-spinner.tsx` - Spinner de loading
- `components/global-loading.tsx` - Loading global
- `components/table-loading.tsx` - Loading de tabela
- `components/card-loading.tsx` - Loading de card
- `components/permission-fallback.tsx` - Fallback de permissão
- `components/protected-route.tsx` - Rota protegida
- `components/protected-section.tsx` - Seção protegida
- `components/auth-guard.tsx` - Guard de autenticação
- `components/pwa-auth-guard.tsx` - Guard PWA
- `components/admin-guard.tsx` - Guard de admin
- `components/debug-permissions.tsx` - Debug de permissões
- `components/permissions-debug.tsx` - Debug de permissões
- `components/dynamic-menu.tsx` - Menu dinâmico
- `components/chat-ia.tsx` - Chat IA
- `components/whatsapp-configuracao.tsx` - Configuração WhatsApp
- `components/whatsapp-test-button.tsx` - Botão de teste
- `components/whatsapp-relatorios.tsx` - Relatórios WhatsApp
- `components/pwa-install-prompt.tsx` - Prompt de instalação
- `components/pwa-notifications.tsx` - Notificações PWA
- `components/pwa-notifications-manager.tsx` - Gerenciador
- `components/pwa-error-boundary.tsx` - Error boundary
- `components/pwa-diagnostic.tsx` - Diagnóstico
- `components/offline-sync-indicator.tsx` - Indicador offline
- `components/service-worker-provider.tsx` - Service worker
- `components/theme-provider.tsx` - Tema
- `components/obra-provider.tsx` - Provider de obra
- `components/valor-oculto.tsx` - Valor oculto
- `components/cno-input.tsx` - Input de CNO

**Componentes de Relatórios**
- `components/relatorios/performance-gruas-filtros.tsx` - Filtros
- `components/relatorios/performance-gruas-graficos.tsx` - Gráficos
- `components/relatorios/performance-gruas-resumo.tsx` - Resumo
- `components/relatorios/performance-gruas-tabela.tsx` - Tabela

### 1.3 Hooks Customizados (`/hooks`) - 20 arquivos

- `hooks/use-auth.ts` - Autenticação
- `hooks/use-auth-interceptor.ts` - Interceptor de auth
- `hooks/use-current-user.ts` - Usuário atual
- `hooks/use-permissions.ts` - Permissões
- `hooks/use-pwa-permissions.ts` - Permissões PWA
- `hooks/use-pwa-user.ts` - Usuário PWA
- `hooks/use-empresa.tsx` - Empresa
- `hooks/use-cargos.ts` - Cargos
- `hooks/use-vencimentos-documentos.ts` - Vencimentos (465 linhas)
- `hooks/use-debounce.ts` - Debounce
- `hooks/use-debounced-value.ts` - Valor com debounce
- `hooks/use-throttle.ts` - Throttle
- `hooks/use-mobile.ts` - Detecção mobile
- `hooks/use-toast.ts` - Toast
- `hooks/use-enhanced-toast.tsx` - Toast melhorado
- `hooks/use-file-upload.ts` - Upload de arquivo
- `hooks/use-optimized-loader.ts` - Loader otimizado
- `hooks/use-persistent-session.ts` - Sessão persistente
- `hooks/useAprovacoesHorasExtras.ts` - Aprovações
- `hooks/useNotificacoes.ts` - Notificações

### 1.4 Bibliotecas de API (`/lib`) - 73 arquivos

**APIs Principais:**
- `lib/api.ts` - Cliente HTTP base (axios)
- `lib/api-obras.ts` - API de obras
- `lib/api-gruas.ts` - API de gruas
- `lib/api-funcionarios.ts` - API de funcionários
- `lib/api-ponto-eletronico.ts` - API de ponto
- `lib/api-rh.ts` - API de RH
- `lib/api-rh-completo.ts` - API de RH completo
- `lib/api-financial.ts` - API financeira
- `lib/api-clientes.ts` - API de clientes
- `lib/api-usuarios.ts` - API de usuários
- `lib/api-permissoes.ts` - API de permissões
- `lib/api-notificacoes.ts` - API de notificações
- `lib/api-assinaturas.ts` - API de assinaturas
- `lib/api-documentos.ts` - API de documentos
- `lib/api-sinaleiros.ts` - API de sinaleiros
- `lib/api-complementos.ts` - API de complementos
- `lib/api-componentes.ts` - API de componentes
- `lib/api-manutencoes.ts` - API de manutenções
- `lib/api-checklist-diario.ts` - API de checklist
- `lib/api-checklist-devolucao.ts` - API de checklist devolução
- `lib/api-livro-grua.ts` - API de livro de grua
- `lib/api-obra-gruas.ts` - API de obra-gruas
- `lib/api-grua-obra.ts` - API de grua-obra
- `lib/api-funcionarios-obras.ts` - API de funcionários-obras
- `lib/api-obras-documentos.ts` - API de documentos de obras
- `lib/api-obras-arquivos.ts` - API de arquivos de obras
- `lib/api-responsavel-tecnico.ts` - API de responsável técnico
- `lib/api-orcamentos.ts` - API de orçamentos
- `lib/api-orcamentos-locacao.ts` - API de orçamentos locação
- `lib/api-vendas.ts` - API de vendas
- `lib/api-compras.ts` - API de compras
- `lib/api-locacoes.ts` - API de locações
- `lib/api-alugueis-residencias.ts` - API de aluguéis
- `lib/api-receitas.ts` - API de receitas
- `lib/api-custos.ts` - API de custos
- `lib/api-custos-mensais.ts` - API de custos mensais
- `lib/api-medicoes.ts` - API de medições
- `lib/api-medicoes-mensais.ts` - API de medições mensais
- `lib/api-medicoes-componentes.ts` - API de medições componentes
- `lib/api-impostos.ts` - API de impostos
- `lib/api-impostos-financeiros.ts` - API de impostos financeiros
- `lib/api-contas-pagar.ts` - API de contas a pagar
- `lib/api-contas-receber.ts` - API de contas a receber
- `lib/api-contas-bancarias.ts` - API de contas bancárias
- `lib/api-transferencias.ts` - API de transferências
- `lib/api-estoque.ts` - API de estoque
- `lib/api-produtos.ts` - API de produtos
- `lib/api-fornecedores.ts` - API de fornecedores
- `lib/api-categorias.ts` - API de categorias
- `lib/api-ordem-compras.ts` - API de ordens de compra
- `lib/api-relatorios.ts` - API de relatórios
- `lib/api-relatorios-performance.ts` - API de performance
- `lib/api-relatorios-rh.ts` - API de relatórios RH
- `lib/api-historico.ts` - API de histórico
- `lib/api-historico-rh.ts` - API de histórico RH
- `lib/api-dashboard.ts` - API de dashboard
- `lib/api-encarregador.ts` - API de encarregado
- `lib/api-aprovacoes-horas-extras.ts` - API de aprovações
- `lib/api-cargos.ts` - API de cargos
- `lib/api/cargos-api.ts` - API de cargos (alternativa)
- `lib/api-remuneracao.ts` - API de remuneração
- `lib/api-ferias.ts` - API de férias
- `lib/api-horas-mensais.ts` - API de horas mensais
- `lib/api-vales.ts` - API de vales
- `lib/api-gruas-mensais.ts` - API de gruas mensais
- `lib/api-colaboradores-documentos.ts` - API de documentos colaboradores
- `lib/api-funcionarios-documentos.ts` - API de documentos funcionários
- `lib/api-notas-fiscais.ts` - API de notas fiscais
- `lib/api-notas-fiscais-locacao.ts` - API de notas fiscais locação
- `lib/api-notas-debito.ts` - API de notas de débito
- `lib/api-logistica.ts` - API de logística
- `lib/api-aditivos.ts` - API de aditivos
- `lib/api-arquivos.ts` - API de arquivos
- `lib/api-equipamentos.ts` - API de equipamentos
- `lib/api-relacionamentos.ts` - API de relacionamentos
- `lib/api-funcionalidades-avancadas.ts` - API de funcionalidades
- `lib/api-configuracoes.ts` - API de configurações
- `lib/api-chat-ia.ts` - API de chat IA
- `lib/api-whatsapp.ts` - API de WhatsApp
- `lib/api-cache.ts` - Cache de API
- `lib/api-busca-global.ts` - Busca global

**Utilitários:**
- `lib/auth-interceptor.ts` - Interceptor de autenticação
- `lib/auth-cache.ts` - Cache de autenticação
- `lib/get-funcionario-id.ts` - Obter ID de funcionário
- `lib/geolocation-validator.ts` - Validador de geolocalização
- `lib/offline-sync.ts` - Sincronização offline
- `lib/session-persistence.ts` - Persistência de sessão
- `lib/redirect-handler.ts` - Handler de redirecionamento
- `lib/service-worker-manager.ts` - Gerenciador de service worker
- `lib/pwa-notifications.ts` - Notificações PWA
- `lib/whatsapp-evolution-service.ts` - Serviço WhatsApp
- `lib/user-context.tsx` - Contexto de usuário
- `lib/obra-context.tsx` - Contexto de obra
- `lib/obra-store.ts` - Store de obra
- `lib/utils.ts` - Utilitários gerais
- `lib/utils-aprovacoes.ts` - Utilitários de aprovações
- `lib/user-utils.ts` - Utilitários de usuário
- `lib/medicoes-utils.ts` - Utilitários de medições
- `lib/receitas-utils.ts` - Utilitários de receitas
- `lib/templates-orcamento.ts` - Templates de orçamento
- `lib/utils/export-pdf.ts` - Exportação PDF
- `lib/utils/pdf-logos-frontend.ts` - Logos PDF
- `lib/utils/pdf-rodape-frontend.ts` - Rodapé PDF
- `lib/utils/cargos-predefinidos.ts` - Cargos predefinidos
- `lib/utils/detect-pwa.ts` - Detecção PWA
- `lib/types/performance-gruas.ts` - Tipos de performance

### 1.5 Tipos (`/types`)
- `types/permissions.ts` - Tipos de permissões

---

## 🔧 BACKEND

### 2.1 Rotas (`/backend-api/src/routes`) - 97 arquivos

**Módulo: Obras**
- `obras.js` - CRUD completo de obras
- `obras-documentos.js` - Documentos de obras
- `obras-arquivos.js` - Arquivos de obras
- `obra-gruas.js` - Relacionamento obra-grua
- `grua-obras.js` - Relacionamento grua-obra

**Módulo: Gruas**
- `gruas.js` - CRUD completo de gruas
- `grua-componentes.js` - Componentes de gruas
- `grua-configuracoes.js` - Configurações de gruas
- `gruas-mensais.js` - Gruas mensais
- `gestao-gruas.js` - Gestão de gruas

**Módulo: Ponto Eletrônico**
- `ponto-eletronico.js` - Sistema de ponto (6000+ linhas)
- `ponto-eletronico-graficos.js` - Gráficos de ponto
- `aprovacoes-horas-extras.js` - Aprovações de horas extras
- `aprovacao-publica.js` - Aprovação pública

**Módulo: RH**
- `funcionarios.js` - CRUD de funcionários
- `funcionarios-obras.js` - Funcionários em obras
- `funcionarios-documentos.js` - Documentos de funcionários
- `colaboradores-documentos.js` - Documentos de colaboradores
- `rh.js` - Recursos humanos
- `cargos.js` - Cargos
- `remuneracao.js` - Remuneração
- `ferias.js` - Férias
- `horas-mensais.js` - Horas mensais
- `vales.js` - Vales
- `historico-rh.js` - Histórico RH
- `relatorios-rh.js` - Relatórios RH

**Módulo: Financeiro**
- `financial-data.js` - Dados financeiros
- `vendas.js` - Vendas
- `compras.js` - Compras
- `locacoes.js` - Locações
- `alugueis-residencias.js` - Aluguéis de residências
- `receitas.js` - Receitas
- `custos.js` - Custos
- `custos-mensais.js` - Custos mensais
- `medicoes.js` - Medições
- `medicoes-mensais.js` - Medições mensais
- `medicoes-componentes.js` - Medições de componentes
- `impostos.js` - Impostos
- `impostos-financeiros.js` - Impostos financeiros
- `contas-pagar.js` - Contas a pagar
- `contas-receber.js` - Contas a receber
- `contas-bancarias.js` - Contas bancárias
- `transferencias.js` - Transferências
- `orcamentos.js` - Orçamentos
- `orcamentos-locacao.js` - Orçamentos de locação
- `ordem-compras.js` - Ordens de compra
- `notas-fiscais.js` - Notas fiscais
- `notas-fiscais-locacao.js` - Notas fiscais locação
- `notas-debito.js` - Notas de débito
- `aditivos.js` - Aditivos
- `rentabilidade.js` - Rentabilidade
- `projecoes.js` - Projeções
- `logistica.js` - Logística

**Módulo: Relatórios**
- `relatorios.js` - Relatórios gerais
- `relatorios-orcamentos.js` - Relatórios de orçamentos
- `relatorios-medicoes.js` - Relatórios de medições
- `relatorios-impostos.js` - Relatórios de impostos
- `relatorios-faturamento.js` - Relatórios de faturamento
- `relatorios-componentes.js` - Relatórios de componentes
- `exportar-relatorios.js` - Exportar relatórios
- `exportar.js` - Exportar dados

**Módulo: Outros**
- `clientes.js` - Clientes
- `estoque.js` - Estoque
- `produtos.js` - Produtos
- `fornecedores.js` - Fornecedores
- `categorias.js` - Categorias
- `equipamentos.js` - Equipamentos
- `complementos.js` - Complementos
- `manutencoes.js` - Manutenções
- `checklist-diario.js` - Checklist diário
- `checklist-devolucao.js` - Checklist de devolução
- `livro-grua.js` - Livro de grua
- `livro-grua-relacoes.js` - Relações do livro
- `responsaveis-tecnicos.js` - Responsáveis técnicos
- `usuarios.js` - Usuários
- `auth.js` - Autenticação
- `avatar.js` - Avatar
- `permissoes.js` - Permissões
- `notificacoes.js` - Notificações
- `assinaturas.js` - Assinaturas
- `documentos.js` - Documentos
- `arquivos.js` - Arquivos
- `arquivos-test.js` - Teste de arquivos
- `busca-global.js` - Busca global
- `geocoding.js` - Geocodificação
- `relacionamentos.js` - Relacionamentos
- `historico.js` - Histórico
- `dashboard.js` - Dashboard
- `email-config.js` - Configuração de email
- `configuracoes.js` - Configurações
- `funcionalidades-avancadas.js` - Funcionalidades avançadas
- `chat-ia.js` - Chat IA
- `whatsapp-evolution.js` - WhatsApp Evolution
- `whatsapp-logs.js` - Logs WhatsApp
- `whatsapp-test.js` - Teste WhatsApp

**Testes**
- `tests/gruas-real.test.js` - Testes de gruas
- `tests/funcionarios-real.test.js` - Testes de funcionários
- `tests/equipamentos-real.test.js` - Testes de equipamentos
- `tests/relacionamentos-real.test.js` - Testes de relacionamentos
- `tests/Guia-testes.md` - Guia de testes

### 2.2 Middlewares (`/backend-api/src/middleware`)
- `auth.js` - Autenticação JWT
- `permissions.js` - Verificação de permissões
- `validate.js` - Validação (parcial)

### 2.3 Configurações (`/backend-api/src/config`)
- `supabase.js` - Configuração Supabase
- `roles.js` - Definição de roles e permissões

### 2.4 Serviços (`/backend-api/src/services`)
- `notificacoes-horas-extras.js` - Serviço de notificações
- `whatsapp-service.js` - Serviço WhatsApp

### 2.5 Utilitários (`/backend-api/src/utils`)
- `ponto-eletronico.js` - Utilitários de ponto
- `aprovacoes-helpers.js` - Helpers de aprovações
- `pdf-logos.js` - Logos PDF
- `geo.js` - Geocodificação

### 2.6 Migrações (`/backend-api/database/migrations`)
- Múltiplas migrações SQL para criação e alteração de tabelas

---

## 🎭 MOCKS E DADOS FALSOS

### 3.1 Arquivos de Mock Identificados

#### Mock Ativo (Deve ser Removido)
1. **`lib/mocks/sinaleiros-mocks.ts`** ⚠️ **CRÍTICO**
   - Mock completo de sinaleiros
   - 141 linhas
   - Interface `Sinaleiro` e `DocumentoSinaleiro`
   - Array `mockSinaleiros` com dados falsos
   - Objeto `mockSinaleirosAPI` simulando API
   - **Status:** Frontend já usa API real, mock deve ser removido

#### Dados Mockados em Componentes

2. **`components/livro-grua-obra.tsx`** ⚠️
   - Linha 806-845: `dadosMockados` - Dados técnicos mockados
   - Linha 847+: Dados mockados para sinaleiros
   - **Status:** Usado como fallback quando dados não disponíveis

3. **`app/dashboard/obras/nova/page.tsx`** ⚠️
   - Linha 812-988: Função `preencherDadosTeste()`
   - Preenche formulário com dados de teste
   - **Status:** Função de teste, deve ser removida ou desabilitada em produção

4. **`app/teste-aprovacoes/page.tsx`** ⚠️
   - Página completa de teste
   - Usa `mockAprovacoes`, `mockNotificacoes`
   - **Status:** Página de teste, considerar remover em produção

5. **`app/dashboard/gruas-new/page.tsx`** ⚠️
   - Usa `mockGruas`, `mockObras`, `mockUsers`
   - **Status:** Versão antiga, deve ser removida

6. **`app/dashboard/assinatura/page.tsx`** ⚠️
   - Múltiplos TODOs sobre simulações
   - `mockObras`, `mockUsers`
   - Simulações de DocuSign
   - **Status:** Parcialmente mockado

7. **`components/user-dropdown.tsx`** ⚠️
   - Dados mock para desenvolvimento
   - **Status:** Usado apenas em dev

8. **`app/navegacao-teste/page.tsx`** ⚠️
   - Página demonstrativa com dados mockados
   - **Status:** Página de teste

9. **`components/admin-guard.tsx`** ⚠️
   - Verificação admin mockada/simulada
   - **Status:** Deve usar verificação real

### 3.2 TODOs e FIXMEs Encontrados

#### TODOs Críticos (Implementação Pendente)

1. **`app/pwa/holerites/page.tsx`** (linha 641)
   ```typescript
   // TODO: Implementar endpoint de confirmação de recebimento no backend se necessário
   ```

2. **`app/dashboard/obras/[id]/page.tsx`** (linhas 4944, 5010, 5089)
   ```typescript
   // TODO: Implementar diálogo de edição
   // TODO: Integrar com API de funcionários
   ```

3. **`backend-api/src/routes/assinaturas.js`** (linha 1175)
   ```typescript
   // TODO: Implementar envio de e-mail ou notificação push
   ```

4. **`app/dashboard/assinatura/page.tsx`** (múltiplas linhas)
   ```typescript
   // TODO: Implementar integração real com DocuSign quando disponível
   // TODO: Implementar envio real de link quando DocuSign estiver integrado
   // TODO: Implementar geração real de links quando DocuSign estiver integrado
   // TODO: Substituir por chamada real de API quando endpoint estiver disponível
   ```

5. **`app/dashboard/assinatura/[id]/page.tsx`** (linha 235)
   ```typescript
   // TODO: Implementar rejeição via API
   ```

6. **`app/dashboard/rh/page.tsx`** (linha 305)
   ```typescript
   // TODO: Implementar método deletarFuncionario na API
   ```

7. **`app/dashboard/relatorios/page.tsx`** (linha 418)
   ```typescript
   // TODO: Carregar obras do backend
   ```

8. **`backend-api/src/routes/vendas.js`** (linhas 307, 934)
   ```typescript
   // TODO: usar ID do usuário logado
   ```

### 3.3 URLs Hardcoded (Fallbacks)

#### Arquivos com URLs Hardcoded:

1. **`app/pwa/page.tsx`** (linha 564)
   ```typescript
   const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
   ```

2. **`app/pwa/login/page.tsx`** (linha 118)
   ```typescript
   let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
   ```

3. **`app/pwa/ponto/page.tsx`** (linhas 598, 614)
   ```typescript
   `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/...`
   ```

4. **`app/pwa/perfil/page.tsx`** (múltiplas linhas: 376, 456, 547, 606)
   ```typescript
   const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
   ```

5. **`app/pwa/holerites/page.tsx`** (linhas 176, 396, 471)
   ```typescript
   const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
   ```

6. **`app/pwa/gruas/[id]/page.tsx`** (linhas 163, 198)
   ```typescript
   `http://localhost:3001/api/geocoding/endereco?q=...`
   ```

7. **`app/pwa/gerenciar-funcionarios/page.tsx`** (linha 82)
   ```typescript
   const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'}/api/funcionarios`, {
   ```

8. **`app/pwa/diagnostico/page.tsx`** (linha 95)
   ```typescript
   {process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'}
   ```

9. **`hooks/use-pwa-user.ts`** (linhas 137, 274)
   ```typescript
   const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'
   ```

10. **`app/pwa/validar-obra/page.tsx`** (linha 72)
    ```typescript
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    ```

### 3.4 Fallbacks para Mocks

#### Arquivos com Fallbacks:

1. **`app/dashboard/obras/page.tsx`**
   - Fallback para `mockObras` em caso de erro
   - Comentários "ainda usando mock"

2. **`app/dashboard/obras/[id]/page.tsx`**
   - "Fallback para função mockada"
   - "Fallback para dados mockados"
   - `const documentosMockados = getDocumentosByObra(obra.id)`

3. **`components/espelho-ponto-dialog.tsx`**
   - Fallback para dados mockados no catch

4. **`app/dashboard/ponto/aprovacoes/page.tsx`**
   - Comentário "Mock" em métrica

### 3.5 Arquivos de Teste com Mocks

1. **`__tests__/utils/auth.test.ts`** - Testes com mocks (OK)
2. **`__tests__/utils/api-notificacoes.test.ts`** - Testes com mocks (OK)
3. **`__tests__/pages/dashboard.test.tsx`** - Testes com mocks (OK)
4. **`__tests__/components/notifications-dropdown.test.tsx`** - Testes com mocks (OK)
5. **`__tests__/components/global-search.test.tsx`** - Testes com mocks (OK)
6. **`backend-api/src/routes/tests/*.test.js`** - Testes com mocks (OK)

**Nota:** Mocks em arquivos de teste são aceitáveis e não devem ser removidos.

### 3.6 Resumo de Mocks

| Tipo | Quantidade | Status | Ação Necessária |
|------|------------|--------|-----------------|
| Arquivos de Mock | 1 | ⚠️ Ativo | Remover `lib/mocks/sinaleiros-mocks.ts` |
| Dados Mockados em Componentes | 8+ | ⚠️ Parcial | Remover ou substituir por API |
| TODOs | 10+ | ⚠️ Pendente | Implementar funcionalidades |
| URLs Hardcoded | 10+ | ⚠️ Parcial | Usar variáveis de ambiente |
| Fallbacks para Mocks | 4+ | ⚠️ Parcial | Remover fallbacks |
| Páginas de Teste | 3 | ⚠️ Dev | Considerar remover em produção |

---

## 📊 RESUMO GERAL

### Frontend
- **Páginas Dashboard:** 124 arquivos `.tsx`
- **Páginas PWA:** 30+ arquivos `.tsx`
- **Componentes:** 156 arquivos
- **Hooks:** 20 arquivos
- **APIs:** 73 arquivos
- **Total Frontend:** ~400+ arquivos

### Backend
- **Rotas:** 97 arquivos `.js`
- **Middlewares:** 3 arquivos
- **Configurações:** 2 arquivos
- **Serviços:** 2+ arquivos
- **Utilitários:** 4+ arquivos
- **Total Backend:** ~110+ arquivos

### Mocks e Pendências
- **Arquivos de Mock:** 1 arquivo ativo
- **Componentes com Mocks:** 8+ arquivos
- **TODOs:** 10+ ocorrências
- **URLs Hardcoded:** 10+ ocorrências
- **Fallbacks:** 4+ ocorrências
- **Total de Problemas:** 33+ itens

---

## 🎯 AÇÕES PRIORITÁRIAS

### 🔴 CRÍTICO
1. **Remover `lib/mocks/sinaleiros-mocks.ts`**
2. **Remover função `preencherDadosTeste()` de `app/dashboard/obras/nova/page.tsx`**
3. **Substituir URLs hardcoded por variáveis de ambiente**
4. **Remover fallbacks para mocks**

### 🟡 IMPORTANTE
5. **Implementar TODOs críticos**
6. **Remover dados mockados de componentes**
7. **Remover ou desabilitar páginas de teste em produção**

### 🟢 OPCIONAL
8. **Documentar APIs mockadas**
9. **Criar ambiente de desenvolvimento separado para testes**

---

**Fim do Levantamento**
