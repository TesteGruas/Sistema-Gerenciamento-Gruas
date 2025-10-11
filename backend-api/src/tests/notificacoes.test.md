# Testes do Módulo de Notificações

Este documento descreve os testes manuais e automatizados para o módulo de notificações.

## Pré-requisitos

1. Backend rodando em `http://localhost:3001`
2. Banco de dados com migration aplicada
3. Token de autenticação válido de um usuário admin

## Configuração

```bash
# 1. Aplicar migration (via Supabase ou psql)
psql -U postgres -d your_database -f backend-api/database/migrations/20250111_create_notificacoes.sql

# 2. Iniciar servidor backend
cd backend-api
npm start
```

## Testes Manuais

### 1. Obter Token de Autenticação

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "sua_senha"
  }'

# Salvar o token retornado
export TOKEN="seu_token_aqui"
```

### 2. Teste: Listar Notificações (GET /api/notificacoes)

```bash
curl -X GET "http://localhost:3001/api/notificacoes" \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
- Status: 200 OK
- JSON com array de notificações (vazio se não houver notificações)

### 3. Teste: Criar Notificação Geral (POST /api/notificacoes)

```bash
curl -X POST http://localhost:3001/api/notificacoes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Teste de Notificação Geral",
    "mensagem": "Esta é uma notificação de teste para todos os usuários",
    "tipo": "info",
    "destinatarios": [
      {
        "tipo": "geral"
      }
    ],
    "remetente": "Sistema de Testes"
  }'
```

**Resposta esperada:**
- Status: 201 Created
- JSON com dados da notificação criada

### 4. Teste: Criar Notificação para Cliente Específico

```bash
curl -X POST http://localhost:3001/api/notificacoes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Notificação para Cliente",
    "mensagem": "Teste de notificação específica para cliente",
    "tipo": "financeiro",
    "link": "/dashboard/financeiro",
    "destinatarios": [
      {
        "tipo": "cliente",
        "id": "1",
        "nome": "ABC Construtora",
        "info": "12.345.678/0001-90"
      }
    ],
    "remetente": "Sistema de Testes"
  }'
```

### 5. Teste: Listar Notificações Não Lidas (GET /api/notificacoes/nao-lidas)

```bash
curl -X GET "http://localhost:3001/api/notificacoes/nao-lidas" \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
- Status: 200 OK
- JSON com array de notificações não lidas

### 6. Teste: Contar Não Lidas (GET /api/notificacoes/count/nao-lidas)

```bash
curl -X GET "http://localhost:3001/api/notificacoes/count/nao-lidas" \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
- Status: 200 OK
- JSON com `{ "success": true, "count": N }`

### 7. Teste: Marcar Como Lida (PATCH /api/notificacoes/:id/marcar-lida)

```bash
# Substituir {id} pelo ID de uma notificação existente
curl -X PATCH "http://localhost:3001/api/notificacoes/{id}/marcar-lida" \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
- Status: 200 OK
- JSON com mensagem de sucesso

### 8. Teste: Marcar Todas Como Lidas (PATCH /api/notificacoes/marcar-todas-lidas)

```bash
curl -X PATCH "http://localhost:3001/api/notificacoes/marcar-todas-lidas" \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
- Status: 200 OK
- JSON com mensagem de sucesso e contagem

### 9. Teste: Deletar Notificação (DELETE /api/notificacoes/:id)

```bash
# Substituir {id} pelo ID de uma notificação existente
curl -X DELETE "http://localhost:3001/api/notificacoes/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
- Status: 200 OK
- JSON com mensagem de sucesso

### 10. Teste: Deletar Todas (DELETE /api/notificacoes/todas)

```bash
curl -X DELETE "http://localhost:3001/api/notificacoes/todas" \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
- Status: 200 OK
- JSON com mensagem de sucesso e contagem

## Testes de Validação

### Teste: Criar Notificação Sem Título (Deve Falhar)

```bash
curl -X POST http://localhost:3001/api/notificacoes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mensagem": "Teste sem título",
    "tipo": "info"
  }'
```

**Resposta esperada:**
- Status: 400 Bad Request
- Mensagem de erro sobre título obrigatório

### Teste: Criar Notificação com Tipo Inválido (Deve Falhar)

```bash
curl -X POST http://localhost:3001/api/notificacoes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Teste",
    "mensagem": "Teste com tipo inválido",
    "tipo": "tipo_invalido"
  }'
```

**Resposta esperada:**
- Status: 400 Bad Request
- Mensagem de erro sobre tipo inválido

## Testes de Permissão

### Teste: Criar Notificação Sem Token (Deve Falhar)

```bash
curl -X POST http://localhost:3001/api/notificacoes \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Teste",
    "mensagem": "Teste sem autenticação",
    "tipo": "info"
  }'
```

**Resposta esperada:**
- Status: 401 Unauthorized
- Mensagem sobre token requerido

### Teste: Criar Notificação com Usuário Sem Permissão (Deve Falhar)

Fazer login com usuário não-admin e tentar criar notificação.

**Resposta esperada:**
- Status: 403 Forbidden
- Mensagem sobre permissão insuficiente

## Testes de Segurança

### Teste: Tentar Acessar Notificação de Outro Usuário (Deve Falhar)

```bash
# Com token do usuário A, tentar marcar como lida notificação do usuário B
curl -X PATCH "http://localhost:3001/api/notificacoes/{id_de_outro_usuario}/marcar-lida" \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
- Status: 404 Not Found
- Mensagem indicando que notificação não foi encontrada

## Checklist de Validação

- [ ] ✅ Migration aplicada com sucesso
- [ ] ✅ Tabela criada com todas as colunas
- [ ] ✅ Índices criados corretamente
- [ ] ✅ Trigger de updated_at funcionando
- [ ] ✅ GET /api/notificacoes retorna lista
- [ ] ✅ GET /api/notificacoes/nao-lidas retorna apenas não lidas
- [ ] ✅ GET /api/notificacoes/count/nao-lidas retorna contagem correta
- [ ] ✅ POST /api/notificacoes cria notificação
- [ ] ✅ POST para múltiplos destinatários funciona
- [ ] ✅ PATCH /:id/marcar-lida atualiza status
- [ ] ✅ PATCH /marcar-todas-lidas funciona
- [ ] ✅ DELETE /:id remove notificação
- [ ] ✅ DELETE /todas remove todas
- [ ] ✅ Validações de campos funcionando
- [ ] ✅ Permissões verificadas corretamente
- [ ] ✅ Segurança: não acessa notificações de outros usuários
- [ ] ✅ Tratamento de erros adequado
- [ ] ✅ Logs de auditoria (console.log por enquanto)

## Notas

1. **Permissões**: Apenas usuários com role `admin`, `administrador` ou `gerente` podem criar notificações
2. **Visualização**: Todos os usuários autenticados podem ver suas próprias notificações
3. **Segurança**: Usuários só podem acessar/modificar suas próprias notificações
4. **Performance**: Índices criados para otimizar queries por `usuario_id`, `lida`, `data` e `tipo`

## Próximos Passos

- [ ] Implementar testes unitários automatizados
- [ ] Implementar testes de integração
- [ ] Adicionar WebSocket para notificações em tempo real
- [ ] Implementar notificações push (PWA)
- [ ] Adicionar sistema de templates
- [ ] Implementar agendamento de notificações
- [ ] Exportação de histórico

## Troubleshooting

### Erro: "relation notificacoes does not exist"
**Solução:** Aplicar a migration do banco de dados

### Erro: "Token inválido ou expirado"
**Solução:** Fazer login novamente e obter novo token

### Erro: "Permissão insuficiente"
**Solução:** Verificar se o usuário tem role de admin/administrador/gerente

### Erro: "Nenhum destinatário válido encontrado"
**Solução:** Verificar se os IDs dos destinatários existem no banco de dados

