# Sistema de Gerenciamento de Gruas

Sistema completo para gerenciamento de gruas, obras, funcionários, RH e controle financeiro.

## 🚀 Stack Tecnológico

### Frontend
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas

### Backend
- **Node.js + Express** - API RESTful
- **Supabase** - Banco de dados PostgreSQL + Auth
- **Joi** - Validação de dados
- **JWT** - Autenticação
- **Multer** - Upload de arquivos

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Supabase configurada

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone <repository-url>
cd Sistema-Gerenciamento-Gruas
```

### 2. Instale as dependências do frontend

```bash
npm install
```

### 3. Instale as dependências do backend

```bash
cd backend-api
npm install
cd ..
```

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Crie um arquivo `.env` na pasta `backend-api`:

```env
# Supabase
SUPABASE_URL=sua_url_supabase
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# JWT
JWT_SECRET=seu_secret_jwt_seguro

# Servidor
PORT=3001
NODE_ENV=development
```

## 🏃 Executando o Projeto

### Desenvolvimento

#### Terminal 1 - Frontend:
```bash
npm run dev
```
Acesse: `http://localhost:3000`

#### Terminal 2 - Backend:
```bash
cd backend-api
npm run dev
```
API disponível em: `http://localhost:3001`

### Produção

```bash
# Build frontend
npm run build
npm start

# Backend
cd backend-api
npm start
```

## 📦 Módulos Principais

### 🏗️ Obras
- Cadastro e gerenciamento de obras
- Documentos e arquivos por obra
- Assinatura digital de documentos
- Associação com gruas e funcionários

### 🏗️ Gruas
- Controle de gruas disponíveis
- Livro da grua (manutenções, checklists)
- Componentes e configurações
- Histórico de locações
- Controle mensal de horas e custos

### 👥 RH Completo
- Cadastro de funcionários
- Cargos e salários
- Férias e afastamentos
- Benefícios e vales
- Folha de pagamento
- Horas trabalhadas
- Relatórios e auditoria

### ⏰ Ponto Eletrônico
- Registro de ponto (entrada, almoço, saída)
- Validação por geolocalização
- Justificativas de ausências
- Aprovação de horas extras com assinatura digital
- Relatórios de frequência

### 💰 Financeiro
- Receitas por obra/grua
- Custos e despesas
- Medições de locação
- Notas fiscais
- Contas a pagar e receber
- Automações:
  - **Receita automática**: Criada ao finalizar medição
  - **Custo automático**: Criado ao registrar manutenção

### 🔔 Notificações
- Sistema de notificações em tempo real
- Tipos: info, warning, error, success, grua, obra, financeiro, rh, estoque
- Marcação de lidas/não lidas

### 📝 Assinaturas Digitais
- Fluxo de assinatura de documentos
- Ordem de assinantes (interno/cliente)
- Upload de documentos assinados
- Histórico completo

## 🔐 Autenticação e Permissões

### Perfis de Usuário
- **Administrador** (nível 10): Acesso total
- **Gestor** (nível 8): Gerenciamento de módulos
- **Supervisor** (nível 5): Supervisão de equipes
- **Técnico** (nível 3): Operações técnicas
- **Operador** (nível 1): Operações básicas

### Autenticação JWT
- Token expira em 24 horas
- Refresh automático
- Validação em todas as rotas protegidas

## 🗄️ Banco de Dados

### Principais Tabelas
- `usuarios` - Usuários do sistema
- `perfis` / `permissoes` - Controle de acesso
- `funcionarios` - Dados de RH
- `obras` - Obras e projetos
- `gruas` - Equipamentos
- `receitas` / `custos` - Financeiro
- `registros_ponto` - Ponto eletrônico
- `notificacoes` - Sistema de alertas
- `obras_documentos` / `obras_documento_assinaturas` - Assinaturas digitais

### Migrações Recentes
- ✅ Adicionado `grua_id` em tabelas `receitas` e `custos`
- ✅ Índices de otimização criados

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Usuário atual
- `POST /api/auth/logout` - Logout

### Obras
- `GET /api/obras` - Listar obras
- `POST /api/obras` - Criar obra
- `GET /api/obras/:id` - Detalhes da obra
- `PUT /api/obras/:id` - Atualizar obra

### Gruas
- `GET /api/gruas` - Listar gruas
- `POST /api/gruas` - Criar grua
- `GET /api/gruas/:id` - Detalhes da grua

### Ponto Eletrônico
- `GET /api/ponto/registros` - Listar registros
- `POST /api/ponto/registrar` - Registrar ponto
- `GET /api/ponto/pendentes-aprovacao` - Horas extras pendentes
- `POST /api/ponto/aprovar-lote` - Aprovar em massa

### Financeiro
- `GET /api/receitas` - Listar receitas
- `POST /api/receitas` - Criar receita
- `GET /api/custos` - Listar custos
- `POST /api/custos` - Criar custo
- `PATCH /api/medicoes/:id/finalizar` - Finalizar medição (cria receita automática)

### RH
- `GET /api/rh/funcionarios` - Listar funcionários
- `GET /api/ferias` - Férias
- `GET /api/cargos` - Cargos
- `POST /api/livro-grua` - Registrar manutenção (cria custo automático)

## 🧪 Testes

```bash
# Frontend
npm run test

# Backend
cd backend-api
npm run test
```

## 📚 Documentação Adicional

- [API Backend](./backend-api/README-BACKEND.md)
- [Financeiro Completo](./tasks/done/README-FINANCEIRO-COMPLETO-27-10-25.md)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é proprietário e confidencial.

## 👥 Autores

Sistema desenvolvido para gerenciamento de gruas.

## 📞 Suporte

Para suporte, entre em contato com a equipe de desenvolvimento.

---

**Versão**: 1.0.0  
**Última atualização**: Outubro 2025  
**Status**: ✅ 100% Integrado (Front + Back + DB)

