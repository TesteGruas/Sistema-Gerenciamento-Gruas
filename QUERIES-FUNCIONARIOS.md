# Queries para Ver Todos os Funcionários

Este documento contém diferentes formas de buscar todos os funcionários do sistema.

## 📋 Opções Disponíveis

### 1. Query SQL Direta (Recomendado)

Execute no **Supabase SQL Editor** ou no seu cliente PostgreSQL:

```sql
SELECT 
    f.id,
    f.nome,
    f.email,
    f.telefone,
    f.cpf,
    f.cargo,
    f.turno,
    f.status,
    f.data_admissao,
    f.salario,
    f.created_at,
    -- Informações do cargo
    c.nome as cargo_nome,
    c.nivel as cargo_nivel,
    -- Informações do usuário vinculado
    u.id as usuario_id,
    u.nome as usuario_nome,
    u.email as usuario_email,
    u.status as usuario_status
FROM funcionarios f
LEFT JOIN cargos c ON f.cargo_id = c.id
LEFT JOIN usuarios u ON f.id = u.funcionario_id
WHERE f.deleted_at IS NULL
ORDER BY f.created_at DESC;
```

**Arquivo:** `query-todos-funcionarios.sql`

---

### 2. Via API - Requisição Única (Limite: 100 funcionários)

```bash
curl -X GET "http://localhost:3000/api/funcionarios?page=1&limit=100" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

**Nota:** A API tem limite máximo de 100 itens por página. Para ver todos, use uma das opções abaixo.

---

### 3. Via API - Script Node.js (Busca Todas as Páginas)

```bash
# Configure o token
export TOKEN=seu_token_aqui

# Execute o script
node scripts/buscar-todos-funcionarios.js
```

O script:
- ✅ Busca automaticamente todas as páginas
- ✅ Salva os resultados em `todos-funcionarios.json`
- ✅ Exibe um resumo com estatísticas
- ✅ Lista todos os funcionários no console

**Arquivo:** `scripts/buscar-todos-funcionarios.js`

---

### 4. Via API - Script Bash/cURL (Busca Todas as Páginas)

```bash
# Configure o token
export TOKEN=seu_token_aqui

# Execute o script
./scripts/curl-todos-funcionarios.sh
```

**Requisitos:** 
- `curl` (geralmente já instalado)
- `jq` (opcional, para melhor formatação): `brew install jq`

**Arquivo:** `scripts/curl-todos-funcionarios.sh`

---

### 5. Via Navegador (Postman/Insomnia)

**URL:**
```
http://localhost:3000/api/funcionarios?page=1&limit=100
```

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json
```

**Para buscar todas as páginas:**
- Página 1: `?page=1&limit=100`
- Página 2: `?page=2&limit=100`
- Página 3: `?page=3&limit=100`
- ... até não haver mais resultados

---

## 🔑 Como Obter o Token de Autenticação

1. Faça login no sistema via API:
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"seu_email@exemplo.com","password":"sua_senha"}'
```

2. Copie o `token` da resposta e use nos scripts acima.

---

## 📊 Filtros Disponíveis na API

A API suporta os seguintes filtros opcionais:

- `status`: `Ativo`, `Inativo`, `Férias`
- `cargo`: Nome do cargo
- `turno`: `Diurno`, `Noturno`, `Sob Demanda`
- `search`: Busca por nome, email, telefone, CPF ou cargo

**Exemplo com filtros:**
```
http://localhost:3000/api/funcionarios?page=1&limit=100&status=Ativo&cargo=Operador
```

---

## 📝 Estrutura da Resposta da API

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@exemplo.com",
      "telefone": "(11) 99999-9999",
      "cpf": "123.456.789-00",
      "cargo": "Operador",
      "turno": "Diurno",
      "status": "Ativo",
      "cargo_info": { ... },
      "usuario": { ... },
      "funcionarios_obras": [ ... ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 250,
    "pages": 3
  }
}
```

---

## 🚀 Recomendação

Para **análise rápida**: Use a **Query SQL** diretamente no Supabase.

Para **integração/automação**: Use o **script Node.js** que busca todas as páginas automaticamente.
