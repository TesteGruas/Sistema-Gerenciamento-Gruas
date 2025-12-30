# 💰 PRECIFICAÇÃO MENSALIDADE - SISTEMA DE GERENCIAMENTO DE GRUAS

**Data:** 26/02/2025  
**Versão do Sistema:** 1.0.0  
**Status:** ✅ Sistema 95% Funcional e Integrado

---

## 📋 RESUMO EXECUTIVO

Sistema completo de gerenciamento para empresas de locação de gruas, incluindo:
- **Frontend:** Aplicação Next.js 15 com PWA (Progressive Web App)
- **Backend:** API REST Node.js/Express com 100+ endpoints
- **Banco de Dados:** PostgreSQL (Supabase) com 65+ tabelas
- **Integrações:** WhatsApp (Evolution API), Email (Nodemailer), Assinaturas Digitais
- **Usuários:** Sistema multi-tenant com 5 níveis de permissão
- **Módulos:** 15+ módulos principais totalmente integrados

**Complexidade:** ⭐⭐⭐⭐⭐ (Alta)  
**Linhas de Código:** ~50.000+ linhas  
**Endpoints API:** 100+ rotas  
**Componentes Frontend:** 150+ componentes React

---

## 🎯 MÓDULOS E FUNCIONALIDADES

### 1. 🏗️ MÓDULO DE OBRAS
**Status:** ✅ 100% Implementado

#### Frontend:
- ✅ Listagem de obras com filtros avançados
- ✅ Cadastro e edição de obras
- ✅ Detalhamento completo de obra
- ✅ Gestão de sinaleiros (cadastro, documentos, aprovações)
- ✅ Responsáveis técnicos
- ✅ Checklist de devolução
- ✅ Manutenções por obra
- ✅ Documentos e arquivos
- ✅ Histórico de atividades

#### Backend:
- ✅ CRUD completo de obras (`/api/obras`)
- ✅ Gestão de sinaleiros (`/api/obras/:id/sinaleiros`)
- ✅ Upload de documentos (`/api/obras/sinaleiros/:id/documentos`)
- ✅ Aprovação de documentos (`/api/obras/documentos-sinaleiro/:id/aprovar`)
- ✅ Responsáveis técnicos
- ✅ Validações Joi robustas
- ✅ Queries otimizadas com índices

#### Banco de Dados:
- `obras` - Cadastro principal
- `sinaleiros_obra` - Sinaleiros vinculados
- `documentos_sinaleiro` - Documentos dos sinaleiros
- `responsaveis_tecnicos` - Responsáveis técnicos
- `obra_gruas` - Relacionamento obra-grua

**Valor Estimado:** R$ 800,00/mês

---

### 2. 🏗️ MÓDULO DE GRUAS
**Status:** ✅ 100% Implementado

#### Frontend:
- ✅ Listagem de gruas com filtros
- ✅ Cadastro e edição de gruas
- ✅ Detalhamento completo (componentes, configurações, manutenções)
- ✅ Livro de grua (histórico completo)
- ✅ Gestão de componentes
- ✅ Configurações técnicas
- ✅ Manutenções preventivas e corretivas
- ✅ Checklist diário
- ✅ Complementos de grua (catálogo dinâmico)
- ✅ Transferência entre obras
- ✅ Disponibilidade em tempo real

#### Backend:
- ✅ CRUD completo de gruas (`/api/gruas`)
- ✅ Gestão de componentes (`/api/grua-componentes`)
- ✅ Configurações técnicas (`/api/grua-configuracoes`)
- ✅ Livro de grua (`/api/livro-grua`)
- ✅ Relações grua-obra (`/api/grua-obras`)
- ✅ Complementos (`/api/complementos`)
- ✅ Transferências (`/api/gestao-gruas/transferir`)
- ✅ Disponibilidade (`/api/gestao-gruas/disponibilidade`)

#### Banco de Dados:
- `gruas` - Cadastro principal
- `grua_componentes` - Componentes das gruas
- `grua_configuracoes` - Configurações técnicas
- `livro_grua` - Histórico completo
- `livro_grua_relacoes` - Relações com obras/funcionários
- `checklist_diario` - Checklists diários
- `manutencoes_ordens` - Ordens de manutenção
- `complementos_catalogo` - Catálogo de complementos

**Valor Estimado:** R$ 1.200,00/mês

---

### 3. 👥 MÓDULO DE RH (RECURSOS HUMANOS)
**Status:** ✅ 100% Implementado

#### Frontend:
- ✅ Gestão completa de colaboradores
- ✅ Cadastro de funcionários
- ✅ Cargos e salários
- ✅ Documentos admissionais
- ✅ Certificados (validade, alertas)
- ✅ Holerites
- ✅ Férias
- ✅ Vales
- ✅ Remuneração
- ✅ Histórico completo
- ✅ Auditoria de alterações

#### Backend:
- ✅ CRUD de funcionários (`/api/funcionarios`)
- ✅ Cargos (`/api/cargos`)
- ✅ Documentos (`/api/colaboradores-documentos`)
- ✅ Certificados (`/api/colaboradores-documentos/certificados`)
- ✅ Holerites (`/api/colaboradores-documentos/holerites`)
- ✅ Férias (`/api/ferias`)
- ✅ Vales (`/api/vales`)
- ✅ Remuneração (`/api/remuneracao`)
- ✅ Histórico RH (`/api/historico-rh`)

#### Banco de Dados:
- `funcionarios` - Cadastro principal
- `cargos` - Cargos e salários
- `documentos_admissionais` - Documentos
- `certificados_colaboradores` - Certificados
- `holerites` - Holerites
- `ferias` - Férias
- `vales` - Vales
- `remuneracao` - Remuneração

**Valor Estimado:** R$ 1.000,00/mês

---

### 4. ⏰ MÓDULO DE PONTO ELETRÔNICO
**Status:** ✅ 100% Implementado

#### Frontend:
- ✅ Registro de ponto (PWA com geolocalização)
- ✅ Aprovações com assinatura digital
- ✅ Justificativas
- ✅ Relatórios e exportações (CSV, PDF, JSON)
- ✅ Espelho de ponto avançado
- ✅ Gestão de horas extras
- ✅ Aprovações públicas (via link)
- ✅ Estatísticas de aprovações

#### Backend:
- ✅ Registro de ponto (`/api/ponto-eletronico`)
- ✅ Aprovações (`/api/aprovacoes-horas-extras`)
- ✅ Justificativas (`/api/ponto-eletronico/justificativas`)
- ✅ Relatórios (`/api/ponto-eletronico/relatorios`)
- ✅ Gráficos (`/api/ponto-eletronico-graficos`)
- ✅ Aprovação pública (`/api/aprovacao-publica`)
- ✅ Validação de geolocalização
- ✅ Cálculo automático de horas trabalhadas

#### Banco de Dados:
- `registros_ponto` - Registros de ponto
- `justificativas` - Justificativas
- `aprovacoes_horas_extras` - Aprovações
- `aprovacoes_publicas` - Aprovações via link

**Valor Estimado:** R$ 900,00/mês

---

### 5. 💰 MÓDULO FINANCEIRO
**Status:** ✅ 100% Implementado

#### Frontend:
- ✅ Orçamentos (locação e venda)
- ✅ Medições mensais
- ✅ Receitas
- ✅ Custos
- ✅ Contas a pagar/receber
- ✅ Locações
- ✅ Compras
- ✅ Vendas
- ✅ Aluguéis de residências
- ✅ Impostos
- ✅ Transferências bancárias
- ✅ Contas bancárias
- ✅ Rentabilidade
- ✅ Relatórios financeiros
- ✅ Projeções

#### Backend:
- ✅ Orçamentos (`/api/orcamentos`, `/api/orcamentos-locacao`)
- ✅ Medições (`/api/medicoes`, `/api/medicoes-mensais`)
- ✅ Receitas (`/api/receitas`)
- ✅ Custos (`/api/custos`, `/api/custos-mensais`)
- ✅ Contas a pagar (`/api/contas-pagar`)
- ✅ Contas a receber (`/api/contas-receber`)
- ✅ Locações (`/api/locacoes`)
- ✅ Compras (`/api/compras`)
- ✅ Vendas (`/api/vendas`)
- ✅ Aluguéis (`/api/alugueis-residencias`)
- ✅ Impostos (`/api/impostos`, `/api/impostos-financeiros`)
- ✅ Transferências (`/api/transferencias`)
- ✅ Contas bancárias (`/api/contas-bancarias`)
- ✅ Rentabilidade (`/api/rentabilidade`)
- ✅ Projeções (`/api/projecoes`)

#### Banco de Dados:
- `orcamentos` - Orçamentos
- `orcamento_valores_fixos` - Valores fixos
- `orcamento_custos_mensais` - Custos mensais
- `medicoes_mensais` - Medições
- `receitas` - Receitas
- `custos` - Custos
- `contas_pagar` - Contas a pagar
- `contas_receber` - Contas a receber
- `locacoes` - Locações
- `alugueis_residencias` - Aluguéis
- `impostos_financeiros` - Impostos
- `transferencias_bancarias` - Transferências
- `contas_bancarias` - Contas bancárias

**Valor Estimado:** R$ 1.500,00/mês

---

### 6. 📝 MÓDULO DE ASSINATURAS DIGITAIS
**Status:** ✅ 100% Implementado

#### Frontend:
- ✅ Upload de documentos
- ✅ Fluxo de assinatura sequencial
- ✅ Assinatura digital com geolocalização
- ✅ Histórico de assinaturas
- ✅ Notificações por email
- ✅ Aprovação/rejeição de documentos

#### Backend:
- ✅ Documentos (`/api/obras-documentos`)
- ✅ Assinaturas (`/api/assinaturas`)
- ✅ Upload de arquivos assinados
- ✅ Validação de assinantes
- ✅ Histórico completo

#### Banco de Dados:
- `obras_documentos` - Documentos
- `obras_documento_assinaturas` - Assinaturas
- `obras_documento_historico` - Histórico

**Valor Estimado:** R$ 600,00/mês

---

### 7. 📦 MÓDULO DE ESTOQUE
**Status:** ✅ 100% Implementado

#### Frontend:
- ✅ Cadastro de produtos
- ✅ Movimentações (entrada/saída/transferência)
- ✅ Controle de quantidade mínima
- ✅ Histórico de movimentações
- ✅ Relatórios de estoque
- ✅ Integração com componentes de grua

#### Backend:
- ✅ Produtos (`/api/produtos`)
- ✅ Estoque (`/api/estoque`)
- ✅ Movimentações (`/api/estoque/movimentacoes`)
- ✅ Relatórios (`/api/estoque/relatorios`)

#### Banco de Dados:
- `produtos` - Produtos
- `estoque` - Estoque
- `movimentacoes_estoque` - Movimentações

**Valor Estimado:** R$ 500,00/mês

---

### 8. 🔔 MÓDULO DE NOTIFICAÇÕES
**Status:** ✅ 100% Implementado

#### Frontend:
- ✅ Notificações em tempo real
- ✅ Dropdown de notificações
- ✅ Marcação de lidas/não lidas
- ✅ Filtros por tipo
- ✅ Notificações PWA (push)

#### Backend:
- ✅ Notificações (`/api/notificacoes`)
- ✅ Criação automática de notificações
- ✅ Integração com WhatsApp
- ✅ Integração com Email

#### Banco de Dados:
- `notificacoes` - Notificações

**Valor Estimado:** R$ 400,00/mês

---

### 9. 📊 MÓDULO DE RELATÓRIOS
**Status:** ✅ 100% Implementado

#### Frontend:
- ✅ Relatórios de performance de gruas
- ✅ Relatórios financeiros
- ✅ Relatórios de RH
- ✅ Relatórios de medições
- ✅ Relatórios de orçamentos
- ✅ Relatórios de impostos
- ✅ Exportação (PDF, Excel, CSV)
- ✅ Gráficos e visualizações

#### Backend:
- ✅ Performance de gruas (`/api/relatorios/performance-gruas`)
- ✅ Faturamento (`/api/relatorios-faturamento`)
- ✅ RH (`/api/relatorios-rh`)
- ✅ Medições (`/api/relatorios-medicoes`)
- ✅ Orçamentos (`/api/relatorios-orcamentos`)
- ✅ Impostos (`/api/relatorios-impostos`)
- ✅ Exportação (`/api/exportar-relatorios`)

**Valor Estimado:** R$ 700,00/mês

---

### 10. 👥 MÓDULO DE CLIENTES
**Status:** ✅ 100% Implementado

#### Frontend:
- ✅ Cadastro de clientes
- ✅ Edição e visualização
- ✅ Busca avançada
- ✅ Histórico de relacionamento
- ✅ Vinculação com obras

#### Backend:
- ✅ CRUD completo (`/api/clientes`)
- ✅ Busca global
- ✅ Validações

#### Banco de Dados:
- `clientes` - Clientes

**Valor Estimado:** R$ 300,00/mês

---

### 11. 🔐 MÓDULO DE AUTENTICAÇÃO E PERMISSÕES
**Status:** ✅ 100% Implementado

#### Frontend:
- ✅ Login/Logout
- ✅ Sistema de permissões granular
- ✅ 5 níveis de acesso (Admin, Gestor, Supervisor, Técnico, Operador)
- ✅ Guards de rota
- ✅ Context de usuário
- ✅ Refresh token automático

#### Backend:
- ✅ Autenticação JWT (`/api/auth`)
- ✅ Sistema de perfis e permissões
- ✅ Middleware de autenticação
- ✅ Validação de permissões

#### Banco de Dados:
- `users` - Usuários
- `perfis` - Perfis
- `permissoes` - Permissões
- `perfil_permissoes` - Relação perfil-permissão
- `usuario_perfis` - Relação usuário-perfil

**Valor Estimado:** R$ 500,00/mês

---

### 12. 📱 PWA (PROGRESSIVE WEB APP)
**Status:** ✅ 100% Implementado

#### Funcionalidades:
- ✅ Instalação no dispositivo
- ✅ Funcionamento offline
- ✅ Sincronização automática
- ✅ Notificações push
- ✅ Registro de ponto mobile
- ✅ Aprovações mobile
- ✅ Interface responsiva

**Valor Estimado:** R$ 600,00/mês

---

### 13. 🔗 INTEGRAÇÕES EXTERNAS
**Status:** ✅ 100% Implementado

#### WhatsApp (Evolution API):
- ✅ Envio de mensagens automáticas
- ✅ Notificações de aprovações
- ✅ Links de aprovação pública
- ✅ Gestão de instâncias
- ✅ Logs de envio

#### Email (Nodemailer):
- ✅ Envio de emails transacionais
- ✅ Templates configuráveis
- ✅ Logs de envio
- ✅ Configuração SMTP

**Valor Estimado:** R$ 500,00/mês

---

### 14. 🛠️ MÓDULOS COMPLEMENTARES
**Status:** ✅ 100% Implementado

#### Funcionalidades:
- ✅ Fornecedores
- ✅ Ordem de compras (com aprovações)
- ✅ Checklist de devolução
- ✅ Manutenções preventivas (agenda)
- ✅ Busca global
- ✅ Configurações do sistema
- ✅ Histórico de auditoria

**Valor Estimado:** R$ 400,00/mês

---

## 💻 INFRAESTRUTURA TÉCNICA

### Frontend:
- **Framework:** Next.js 15 (React 18)
- **UI:** Radix UI + Tailwind CSS
- **Estado:** Zustand + React Context
- **Formulários:** React Hook Form + Zod
- **Gráficos:** Recharts
- **PDF:** jsPDF + @react-pdf/renderer
- **PWA:** Service Worker + Manifest
- **Componentes:** 150+ componentes React

### Backend:
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Validação:** Joi
- **Autenticação:** JWT
- **Upload:** Multer
- **Email:** Nodemailer
- **Cron:** node-cron
- **Cache:** Redis (opcional)
- **Endpoints:** 100+ rotas

### Banco de Dados:
- **SGBD:** PostgreSQL (Supabase)
- **Tabelas:** 65+ tabelas
- **Índices:** Otimizados para performance
- **Migrations:** 30+ migrations
- **RLS:** Row Level Security configurado

### Integrações:
- **WhatsApp:** Evolution API
- **Email:** SMTP (configurável)
- **Storage:** Supabase Storage
- **Autenticação:** Supabase Auth

---

## 💰 PRECIFICAÇÃO DETALHADA

### 📊 CUSTOS DE SERVIDOR E INFRAESTRUTURA

#### 1. Hospedagem Frontend (Vercel/Netlify)
- **Plano:** Pro
- **Custo:** R$ 200,00/mês
- **Inclui:**
  - 100GB de bandwidth
  - Builds ilimitados
  - SSL automático
  - CDN global
  - Analytics

#### 2. Hospedagem Backend (Railway/Render/DigitalOcean)
- **Plano:** Standard
- **Custo:** R$ 300,00/mês
- **Inclui:**
  - 2GB RAM
  - 1 vCPU
  - 25GB SSD
  - SSL automático
  - Deploy automático

#### 3. Banco de Dados (Supabase)
- **Plano:** Pro
- **Custo:** R$ 250,00/mês
- **Inclui:**
  - 8GB RAM
  - 50GB de storage
  - 250GB de bandwidth
  - Backups automáticos
  - Row Level Security

#### 4. Storage de Arquivos (Supabase Storage)
- **Plano:** Incluído no Pro
- **Custo:** R$ 0,00/mês (incluído)
- **Inclui:**
  - 100GB de storage
  - CDN para arquivos

#### 5. Serviços Adicionais
- **Domain:** R$ 50,00/mês
- **Email Service (SendGrid/Mailgun):** R$ 100,00/mês
- **Monitoring (Sentry/LogRocket):** R$ 150,00/mês
- **Backup adicional:** R$ 50,00/mês

**Subtotal Infraestrutura:** R$ 1.100,00/mês

---

### 🛠️ CUSTOS DE SUPORTE E MANUTENÇÃO

#### 1. Suporte Técnico (Nível 1)
- **Horas/mês:** 10 horas
- **Valor/hora:** R$ 150,00
- **Total:** R$ 1.500,00/mês
- **Inclui:**
  - Atendimento via email/chat
  - Resolução de problemas básicos
  - Orientação de uso
  - Acesso a documentação

#### 2. Manutenção Preventiva
- **Horas/mês:** 8 horas
- **Valor/hora:** R$ 200,00
- **Total:** R$ 1.600,00/mês
- **Inclui:**
  - Atualizações de segurança
  - Otimizações de performance
  - Correção de bugs
  - Melhorias pontuais

#### 3. Monitoramento e Alertas
- **Custo fixo:** R$ 300,00/mês
- **Inclui:**
  - Monitoramento 24/7
  - Alertas de downtime
  - Relatórios de performance
  - Análise de logs

#### 4. Backup e Recuperação
- **Custo fixo:** R$ 200,00/mês
- **Inclui:**
  - Backups diários automáticos
  - Testes de recuperação
  - Plano de contingência

**Subtotal Suporte:** R$ 3.600,00/mês

---

### 📈 VALOR POR MÓDULO (DESENVOLVIMENTO)

| Módulo | Valor Mensal |
|--------|--------------|
| Obras | R$ 800,00 |
| Gruas | R$ 1.200,00 |
| RH | R$ 1.000,00 |
| Ponto Eletrônico | R$ 900,00 |
| Financeiro | R$ 1.500,00 |
| Assinaturas Digitais | R$ 600,00 |
| Estoque | R$ 500,00 |
| Notificações | R$ 400,00 |
| Relatórios | R$ 700,00 |
| Clientes | R$ 300,00 |
| Autenticação/Permissões | R$ 500,00 |
| PWA | R$ 600,00 |
| Integrações Externas | R$ 500,00 |
| Módulos Complementares | R$ 400,00 |
| **TOTAL MÓDULOS** | **R$ 9.900,00** |

**Nota:** Este valor representa o custo de desenvolvimento distribuído mensalmente. Para precificação de licenciamento, considerar depreciação e margem.

---

## 💵 PRECIFICAÇÃO FINAL MENSAL

### Opção 1: Plano Básico (Sem Suporte Dedicado)
- **Infraestrutura:** R$ 1.100,00
- **Suporte Básico (5h/mês):** R$ 750,00
- **Manutenção Preventiva (4h/mês):** R$ 800,00
- **Monitoramento:** R$ 300,00
- **Backup:** R$ 200,00
- **Licenciamento (20% do valor dos módulos):** R$ 1.980,00
- **TOTAL:** **R$ 5.130,00/mês**

### Opção 2: Plano Completo (Recomendado)
- **Infraestrutura:** R$ 1.100,00
- **Suporte Técnico (10h/mês):** R$ 1.500,00
- **Manutenção Preventiva (8h/mês):** R$ 1.600,00
- **Monitoramento:** R$ 300,00
- **Backup:** R$ 200,00
- **Licenciamento (25% do valor dos módulos):** R$ 2.475,00
- **TOTAL:** **R$ 7.175,00/mês**

### Opção 3: Plano Premium (Suporte Prioritário)
- **Infraestrutura:** R$ 1.100,00
- **Suporte Prioritário (20h/mês):** R$ 3.000,00
- **Manutenção Preventiva (12h/mês):** R$ 2.400,00
- **Monitoramento Avançado:** R$ 500,00
- **Backup Premium:** R$ 300,00
- **Licenciamento (30% do valor dos módulos):** R$ 2.970,00
- **TOTAL:** **R$ 10.270,00/mês**

---

## 📋 DETALHAMENTO DE VALORES

### 1. Infraestrutura (R$ 1.100,00)
- **Hospedagem Frontend:** R$ 200,00
  - Next.js com CDN global
  - Builds otimizados
  - SSL automático
- **Hospedagem Backend:** R$ 300,00
  - Node.js/Express
  - Auto-scaling
  - SSL automático
- **Banco de Dados:** R$ 250,00
  - PostgreSQL gerenciado
  - Backups automáticos
  - Alta disponibilidade
- **Storage:** R$ 0,00 (incluído)
- **Domain:** R$ 50,00
- **Email Service:** R$ 100,00
- **Monitoring:** R$ 150,00
- **Backup adicional:** R$ 50,00

### 2. Suporte Técnico (R$ 1.500,00 - Plano Completo)
- **10 horas/mês** a R$ 150,00/hora
- **Cobertura:**
  - Atendimento em até 4 horas úteis
  - Resolução de problemas técnicos
  - Orientação de uso
  - Acesso a documentação atualizada
  - Suporte via email/chat

### 3. Manutenção Preventiva (R$ 1.600,00 - Plano Completo)
- **8 horas/mês** a R$ 200,00/hora
- **Cobertura:**
  - Atualizações de segurança
  - Correção de bugs
  - Otimizações de performance
  - Melhorias pontuais
  - Atualização de dependências

### 4. Monitoramento (R$ 300,00)
- **Cobertura:**
  - Monitoramento 24/7
  - Alertas de downtime
  - Relatórios de performance
  - Análise de logs
  - Dashboard de métricas

### 5. Backup e Recuperação (R$ 200,00)
- **Cobertura:**
  - Backups diários automáticos
  - Retenção de 30 dias
  - Testes de recuperação mensais
  - Plano de contingência

### 6. Licenciamento (R$ 2.475,00 - Plano Completo)
- **25% do valor total dos módulos**
- **Cobertura:**
  - Uso ilimitado do sistema
  - Todas as funcionalidades
  - Atualizações de versão
  - Novos recursos (conforme roadmap)

---

## 🎯 RESUMO POR CATEGORIA

### Infraestrutura e Hosting
| Item | Valor Mensal |
|------|--------------|
| Frontend (Vercel) | R$ 200,00 |
| Backend (Railway/Render) | R$ 300,00 |
| Banco de Dados (Supabase) | R$ 250,00 |
| Domain | R$ 50,00 |
| Email Service | R$ 100,00 |
| Monitoring | R$ 150,00 |
| Backup | R$ 50,00 |
| **SUBTOTAL** | **R$ 1.100,00** |

### Suporte e Manutenção
| Item | Valor Mensal |
|------|--------------|
| Suporte Técnico (10h) | R$ 1.500,00 |
| Manutenção Preventiva (8h) | R$ 1.600,00 |
| Monitoramento | R$ 300,00 |
| Backup e Recuperação | R$ 200,00 |
| **SUBTOTAL** | **R$ 3.600,00** |

### Licenciamento
| Item | Valor Mensal |
|------|--------------|
| Licenciamento (25% módulos) | R$ 2.475,00 |
| **SUBTOTAL** | **R$ 2.475,00** |

### **TOTAL PLANO COMPLETO: R$ 7.175,00/mês**

---

## 📊 COMPARAÇÃO DE PLANOS

| Recurso | Básico | Completo | Premium |
|---------|--------|----------|---------|
| **Preço Mensal** | R$ 5.130,00 | R$ 7.175,00 | R$ 10.270,00 |
| **Suporte (horas/mês)** | 5h | 10h | 20h |
| **Tempo de Resposta** | 8h úteis | 4h úteis | 2h úteis |
| **Manutenção (horas/mês)** | 4h | 8h | 12h |
| **Monitoramento** | Básico | Padrão | Avançado |
| **Backup** | Diário | Diário | Diário + Premium |
| **Licenciamento** | 20% | 25% | 30% |
| **Atualizações** | ✅ | ✅ | ✅ Prioritárias |
| **Novos Recursos** | ⚠️ Limitado | ✅ | ✅ Prioritário |

---

## 💡 OBSERVAÇÕES IMPORTANTES

1. **Valores em R$ (Reais)** - Cotação baseada em fevereiro/2025
2. **Pagamento Mensal** - Faturamento no início de cada mês
3. **Contrato Mínimo** - 12 meses (com desconto de 5% no anual)
4. **Ajustes** - Valores podem ser ajustados conforme necessidade específica
5. **Escalabilidade** - Infraestrutura pode ser escalada conforme crescimento
6. **Suporte Adicional** - Horas extras a R$ 200,00/hora
7. **Desenvolvimento Customizado** - Orçamento à parte

---

## 📞 CONTATO

Para dúvidas sobre a precificação ou negociação de planos personalizados, entre em contato.

---

**Documento gerado em:** 26/02/2025  
**Versão:** 1.0  
**Próxima revisão:** A cada 6 meses ou conforme necessidade











