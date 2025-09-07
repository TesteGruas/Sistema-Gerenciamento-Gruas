# Sistema de Gerenciamento de Gruas - API REST

API REST completa para o Sistema de Gerenciamento de Gruas da IRBANA.

## 🚀 Início Rápido

### 1. Instalação

```bash
cd backend-api
npm install
```

### 2. Configuração

```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar variáveis de ambiente
nano .env
```

### 3. Executar

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📚 Documentação da API

- **Swagger UI**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Inclua o token no header:

```
Authorization: Bearer <seu-token>
```

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@admin.com",
    "password": "teste@123"
  }'
```

## 📋 Endpoints Principais

### Autenticação
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/logout` - Fazer logout
- `GET /api/auth/me` - Dados do usuário logado
- `POST /api/auth/refresh` - Renovar token

### Gruas
- `GET /api/gruas` - Listar gruas
- `GET /api/gruas/:id` - Obter grua por ID
- `POST /api/gruas` - Criar nova grua
- `PUT /api/gruas/:id` - Atualizar grua
- `DELETE /api/gruas/:id` - Excluir grua

### Usuários
- `GET /api/users` - Listar usuários
- `GET /api/users/:id` - Obter usuário por ID
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Excluir usuário

### Estoque
- `GET /api/estoque` - Listar produtos
- `GET /api/estoque/:id` - Obter produto por ID
- `POST /api/estoque` - Criar produto
- `PUT /api/estoque/:id` - Atualizar produto
- `DELETE /api/estoque/:id` - Excluir produto

### Clientes
- `GET /api/clientes` - Listar clientes
- `GET /api/clientes/:id` - Obter cliente por ID
- `POST /api/clientes` - Criar cliente
- `PUT /api/clientes/:id` - Atualizar cliente
- `DELETE /api/clientes/:id` - Excluir cliente

### Obras
- `GET /api/obras` - Listar obras
- `GET /api/obras/:id` - Obter obra por ID
- `POST /api/obras` - Criar obra
- `PUT /api/obras/:id` - Atualizar obra
- `DELETE /api/obras/:id` - Excluir obra

### Contratos
- `GET /api/contratos` - Listar contratos
- `GET /api/contratos/:id` - Obter contrato por ID
- `POST /api/contratos` - Criar contrato
- `PUT /api/contratos/:id` - Atualizar contrato
- `DELETE /api/contratos/:id` - Excluir contrato

## 🔒 Permissões

A API usa um sistema de permissões baseado em perfis:

### Perfis Disponíveis
- **Administrador**: Acesso total
- **Gerente**: Gerenciamento de operações
- **Operador**: Operações básicas
- **Visualizador**: Apenas leitura

### Permissões Principais
- `criar_grua` - Criar gruas
- `editar_grua` - Editar gruas
- `excluir_grua` - Excluir gruas
- `visualizar_grua` - Visualizar gruas
- `criar_cliente` - Criar clientes
- `editar_cliente` - Editar clientes
- `excluir_cliente` - Excluir clientes
- `visualizar_cliente` - Visualizar clientes

## 📊 Paginação

Todos os endpoints de listagem suportam paginação:

```
GET /api/gruas?page=1&limit=10&status=Ativa&tipo=Grua Torre
```

### Parâmetros
- `page` - Número da página (padrão: 1)
- `limit` - Itens por página (padrão: 10, máximo: 100)
- Filtros específicos por endpoint

### Resposta
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

## 🛡️ Segurança

### Rate Limiting
- 100 requests por 15 minutos por IP
- Headers de rate limit incluídos na resposta

### Validação
- Validação de dados com Joi
- Sanitização de inputs
- Proteção contra SQL injection

### Headers de Segurança
- Helmet.js para headers de segurança
- CORS configurado
- Content Security Policy

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com coverage
npm run test:coverage
```

## 📝 Logs

A API gera logs estruturados:
- Requests HTTP
- Erros de aplicação
- Atividades de autenticação
- Operações de banco de dados

## 🚀 Deploy

### Docker

```bash
# Build da imagem
docker build -t sistema-gruas-api .

# Executar container
docker run -p 3001:3001 --env-file .env sistema-gruas-api
```

### PM2

```bash
# Instalar PM2
npm install -g pm2

# Executar com PM2
pm2 start src/server.js --name "sistema-gruas-api"
```

## 📞 Suporte

- **Email**: contato@irbana.com
- **Documentação**: http://localhost:3001/api-docs
- **Issues**: GitHub Issues

## 📄 Licença

MIT License - Sistema IRBANA
