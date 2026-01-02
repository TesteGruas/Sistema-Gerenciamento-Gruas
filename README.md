# Sistema de Gerenciamento de Gruas

Sistema completo para gerenciamento de gruas, obras, funcionários, RH e controle financeiro.

## 📚 Documentação

**👉 [Consulte a documentação completa aqui](./README-CONSOLIDADO.md)**

A documentação consolidada inclui:
- ✅ Informações gerais do projeto e stack tecnológico
- ✅ Status de implementação de todas as funcionalidades
- ✅ Tracking de mocks e integrações com backend
- ✅ Pendências do backend
- ✅ Escopo e planejamento de funcionalidades

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase configurada

### Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd Sistema-Gerenciamento-Gruas

# Instale as dependências do frontend
npm install

# Instale as dependências do backend
cd backend-api
npm install
cd ..
```

### Configuração

Crie um arquivo `.env.local` na raiz do projeto e `.env` na pasta `backend-api` com as variáveis de ambiente necessárias (veja `env.example`).

### Executando

#### Desenvolvimento

**Terminal 1 - Frontend:**
```bash
npm run dev
```
Acesse: `http://localhost:3000`

**Terminal 2 - Backend:**
```bash
cd backend-api
npm run dev
```
API disponível em: `http://localhost:3001`

## 📦 Módulos Principais

- 🏗️ **Obras** - Cadastro e gerenciamento de obras
- 🏗️ **Gruas** - Controle de equipamentos
- 👥 **RH** - Gestão completa de colaboradores
- ⏰ **Ponto Eletrônico** - Registro e aprovação de horas
- 💰 **Financeiro** - Receitas, custos e medições
- 🔔 **Notificações** - Sistema de alertas em tempo real
- 📝 **Assinaturas Digitais** - Fluxo de assinatura de documentos

## 🔐 Autenticação

O sistema utiliza autenticação JWT com perfis de usuário:
- **Administrador** (nível 10)
- **Gestor** (nível 8)
- **Supervisor** (nível 5)
- **Técnico** (nível 3)
- **Operador** (nível 1)

## 📊 Status do Projeto

- ✅ **Totalmente Implementadas:** 10 funcionalidades (63%)
- ⚠️ **Parcialmente Implementadas:** 3 funcionalidades (19%)
- ⏳ **Não Implementadas:** 3 funcionalidades (18%)

Para mais detalhes, consulte [README-CONSOLIDADO.md](./README-CONSOLIDADO.md).

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é proprietário e confidencial.

---

**Versão**: 1.2.0  
**Última atualização**: 02/01/2026  
**Status**: ✅ Em desenvolvimento ativo

