# Script de Teste de APIs

Script automatizado que faz login e testa todas as APIs do sistema.

## 📋 Pré-requisitos

1. **Dependências instaladas:**
   ```bash
   cd backend-api
   npm install axios dotenv
   ```

2. **Servidor backend rodando:**
   ```bash
   cd backend-api
   npm run dev
   ```

## 🚀 Como Usar

### Opção 1: Usar credenciais padrão

```bash
node scripts/test-all-apis.js
```

Usa as credenciais padrão:
- Email: `admin@admin.com`
- Senha: `teste@123`
- API URL: `http://localhost:3001`

### Opção 2: Usar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto ou use variáveis de ambiente:

```bash
# Linux/Mac
export API_URL=http://localhost:3001
export TEST_EMAIL=seu@email.com
export TEST_PASSWORD=suasenha
node scripts/test-all-apis.js

# Windows (PowerShell)
$env:API_URL="http://localhost:3001"
$env:TEST_EMAIL="seu@email.com"
$env:TEST_PASSWORD="suasenha"
node scripts/test-all-apis.js
```

### Opção 3: Criar arquivo .env

Crie `backend-api/.env` com:
```env
API_URL=http://localhost:3001
TEST_EMAIL=seu@email.com
TEST_PASSWORD=suasenha
```

## 📊 O que o Script Testa

O script testa os seguintes módulos:

### 🔐 Autenticação
- Login
- Verificação de token

### 👥 Usuários
- Listar usuários
- Buscar usuário por ID

### 🏗️ Gruas
- Listar gruas
- Buscar grua por ID
- Listar componentes da grua
- Listar configurações da grua

### 🔧 Componentes
- Listar componentes

### 🏢 Obras
- Listar obras
- Buscar obra por ID
- Listar gruas da obra

### 👤 Clientes
- Listar clientes
- Buscar cliente por ID

### 💰 Orçamentos
- Listar orçamentos
- Buscar orçamento por ID
- Gerar PDF do orçamento
- Listar medições do orçamento

### 📊 Medições Mensais
- Listar medições mensais
- Buscar medição por ID

### 📦 Estoque
- Listar itens em estoque
- Listar movimentações

### 🛍️ Produtos
- Listar produtos

### 👷 Funcionários
- Listar funcionários
- Buscar funcionário por ID

### ⏰ Ponto Eletrônico
- Listar registros de ponto
- Gráficos de ponto

### 📄 Contratos
- Listar contratos

### 🚚 Locações
- Listar locações

### 💵 Vendas
- Listar vendas

### 🛒 Compras
- Listar compras

### 💳 Financeiro
- Dados financeiros
- Listar receitas
- Listar contas a receber
- Listar contas a pagar
- Rentabilidade

### 📋 Relatórios
- Relatório de medições (PDF)
- Relatório de componentes (PDF)

### 🔔 Notificações
- Listar notificações

### 🔍 Busca Global
- Busca global

### 🔐 Permissões
- Listar permissões
- Listar cargos

### 👔 Recursos Humanos
- Dados RH
- Listar férias
- Listar vales
- Listar remunerações

### 🔧 Manutenções
- Listar manutenções

### 📖 Livro de Grua
- Listar registros do livro

### ✅ Checklist
- Listar checklists diários
- Listar checklists de devolução

## 📈 Resultados

O script mostra:
- ✅ Testes que passaram
- ✗ Testes que falharam
- ⊘ Testes que foram pulados (sem dados)
- Estatísticas finais
- Taxa de sucesso

### Exemplo de Saída:

```
╔════════════════════════════════════════════════════════════╗
║     TESTE COMPLETO DE APIs - Sistema de Gerenciamento     ║
╚════════════════════════════════════════════════════════════╝

API URL: http://localhost:3001
Email: admin@admin.com

🔐 AUTENTICAÇÃO
  → Login... ✓ (200)
  → Verificar Token... ✓ (200)

👥 USUÁRIOS
  → Listar Usuários... ✓ (200)
  → Buscar Usuário por ID... ✓ (200)

...

RESUMO DOS TESTES
════════════════════════════════════════════════════════════

  Total de testes:     85
  ✓ Passou:            82
  ✗ Falhou:            3
  ⊘ Pulado:            0
  Tempo de execução:   12.45s

  Taxa de sucesso:     96.5%
```

## 🐛 Troubleshooting

### Erro: "Cannot find module 'axios'"
**Solução:** Instale as dependências:
```bash
cd backend-api
npm install axios dotenv
```

### Erro: "ECONNREFUSED"
**Solução:** Verifique se o servidor backend está rodando:
```bash
cd backend-api
npm run dev
```

### Erro: "401 Unauthorized"
**Solução:** Verifique se as credenciais estão corretas. O script precisa de um usuário válido no sistema.

### Erro: "404 Not Found"
**Solução:** Verifique se a URL da API está correta. Por padrão é `http://localhost:3001`.

## 📝 Notas

- O script pula testes que dependem de dados existentes (ex: buscar por ID se não houver registros)
- Alguns testes podem falhar se você não tiver permissões adequadas
- PDFs são testados mas não são salvos (apenas verifica se a rota responde)
- O script é não-destrutivo (não cria, edita ou deleta dados)

## 🔧 Personalização

Você pode editar o arquivo `scripts/test-all-apis.js` para:
- Adicionar mais testes
- Modificar endpoints
- Alterar dados de teste
- Adicionar validações específicas

