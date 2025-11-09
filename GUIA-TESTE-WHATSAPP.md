# 🧪 Guia de Testes - Integração WhatsApp

Este guia mostra como testar todas as funcionalidades do sistema de aprovação via WhatsApp.

---

## 📋 Pré-requisitos

1. **Variáveis de ambiente configuradas:**
   ```bash
   # backend-api/.env
   WHATSAPP_WEBHOOK_URL=https://gsouzabd.app.n8n.cloud/webhook/irbana-notify
   FRONTEND_URL=http://localhost:3000
   ```

2. **Telefone WhatsApp cadastrado:**
   - O supervisor precisa ter `telefone_whatsapp` ou `telefone` cadastrado na tabela `funcionarios`
   - Formato: `5511999999999` (código do país + DDD + número)

3. **n8n configurado:**
   - Webhook configurado para receber mensagens
   - Evolution API configurada no n8n

---

## 🌱 Gerar Dados de Teste (Seed)

### Objetivo
Criar registros de ponto com horas extras e aprovações pendentes para facilitar os testes.

### Opção 1: Via Migration SQL (Recomendado)

A migration `20250201_seed_horas_extras.sql` já foi aplicada e criou 10 registros de teste automaticamente.

Para executar novamente ou ajustar a quantidade, você pode:

1. **Editar a migration** (`backend-api/database/migrations/20250201_seed_horas_extras.sql`):
   ```sql
   quantidade_registros INTEGER := 10;  -- Ajuste aqui
   dias_retroativos INTEGER := 7;       -- Ajuste aqui
   ```

2. **Aplicar via MCP Supabase** ou executar o SQL diretamente no banco.

### Opção 2: Via API Endpoint

Você também pode usar o endpoint `/api/whatsapp/seed-horas-extras`:

```bash
POST /api/whatsapp/seed-horas-extras
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantidade": 10,
  "dias": 7,
  "limpar": false
}
```

### Verificar Dados Criados

```sql
-- Ver registros de ponto criados
SELECT * FROM registros_ponto 
WHERE observacoes LIKE 'Seed - Teste%'
ORDER BY data DESC;

-- Ver aprovações criadas
SELECT * FROM aprovacoes_horas_extras 
WHERE observacoes LIKE 'Seed - Teste%'
ORDER BY created_at DESC;
```

---

## 🧪 TESTE 1: Envio Manual de Mensagem de Teste

### Objetivo
Testar se o webhook do n8n está funcionando e recebendo mensagens.

### Passos:

1. **Acesse a página de configuração:**
   ```
   http://localhost:3000/dashboard/aprovacoes-horas-extras/whatsapp
   ```

2. **Preencha o número destinatário:**
   - Formato: `5511999999999` (sem espaços, traços ou parênteses)
   - Exemplo: `5511987654321`

3. **Clique em "Enviar Mensagem de Teste"**

4. **Verifique:**
   - ✅ Mensagem de sucesso aparece
   - ✅ Mensagem chega no WhatsApp do número informado
   - ✅ Console do backend mostra: `[whatsapp-test] Mensagem de teste enviada com sucesso`

### Resultado Esperado:
```
✅ Mensagem de teste enviada com sucesso!
```

---

## 🧪 TESTE 2: Criação Manual de Aprovação (via API)

### Objetivo
Testar se o WhatsApp é enviado automaticamente quando uma aprovação é criada manualmente.

### Passos:

1. **Obtenha um token de autenticação:**
   - Faça login no sistema
   - Abra o console do navegador (F12)
   - Execute: `localStorage.getItem('access_token')`
   - Copie o token

2. **Crie uma aprovação via API:**
   ```bash
   curl -X POST http://localhost:3001/api/aprovacoes-horas-extras \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer SEU_TOKEN_AQUI" \
     -d '{
       "registro_ponto_id": "uuid-do-registro",
       "funcionario_id": 1,
       "supervisor_id": 2,
       "horas_extras": 2.5,
       "data_trabalho": "2025-01-31",
       "observacoes": "Teste de aprovação WhatsApp"
     }'
   ```

3. **Verifique:**
   - ✅ Aprovação é criada com sucesso
   - ✅ Console do backend mostra: `[whatsapp-service] Mensagem enviada com sucesso`
   - ✅ Supervisor recebe mensagem no WhatsApp com link de aprovação

### Resultado Esperado:
- Aprovação criada
- WhatsApp enviado automaticamente
- Link de aprovação no formato: `http://localhost:3000/aprovacaop/{id}?token={token}`

---

## 🧪 TESTE 3: Criação Automática via Registro de Ponto

### Objetivo
Testar se o WhatsApp é enviado quando horas extras são detectadas automaticamente no registro de ponto.

### Passos:

1. **Crie um registro de ponto com horas extras:**
   ```bash
   curl -X POST http://localhost:3001/api/ponto-eletronico/registros \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer SEU_TOKEN_AQUI" \
     -d '{
       "funcionario_id": 1,
       "data": "2025-01-31",
       "entrada": "08:00",
       "saida": "19:00",
       "obra_id": 1
     }'
   ```

2. **Verifique:**
   - ✅ Registro criado com sucesso
   - ✅ Sistema detecta 3 horas extras (19:00 - 08:00 - 8h = 3h)
   - ✅ Aprovação é criada automaticamente
   - ✅ Console mostra: `[ponto-eletronico] WhatsApp enviado com sucesso`
   - ✅ Supervisor recebe mensagem no WhatsApp

### Resultado Esperado:
- Registro criado
- Aprovação criada automaticamente
- WhatsApp enviado com link de aprovação

---

## 🧪 TESTE 4: Link de Aprovação Pública

### Objetivo
Testar se o link público de aprovação funciona corretamente.

### Passos:

1. **Obtenha um link de aprovação:**
   - Após criar uma aprovação, o link será enviado no WhatsApp
   - Formato: `http://localhost:3000/aprovacaop/{aprovacao_id}?token={token}`

2. **Acesse o link no navegador:**
   - Abra o link em uma aba anônima (sem estar logado)
   - O link deve funcionar sem autenticação

3. **Verifique a página:**
   - ✅ Dados da aprovação são exibidos
   - ✅ Nome do funcionário aparece
   - ✅ Horas extras aparecem
   - ✅ Data do trabalho aparece
   - ✅ Botões "Aprovar" e "Rejeitar" estão visíveis

4. **Teste aprovação:**
   - Clique em "Aprovar"
   - Adicione observações (opcional)
   - ✅ Mensagem de sucesso aparece
   - ✅ Status muda para "Aprovado"

5. **Teste rejeição:**
   - Crie outra aprovação
   - Acesse o link
   - Clique em "Rejeitar"
   - Preencha o motivo (obrigatório)
   - ✅ Mensagem de sucesso aparece
   - ✅ Status muda para "Rejeitado"

### Resultado Esperado:
- Link funciona sem login
- Dados são exibidos corretamente
- Aprovação/rejeição funcionam via link público

---

## 🧪 TESTE 5: Validação de Token

### Objetivo
Testar se a validação de token funciona corretamente.

### Passos:

1. **Teste token inválido:**
   ```
   http://localhost:3000/aprovacaop/{id}?token=token_invalido
   ```
   - ✅ Erro: "Token inválido ou não encontrado"

2. **Teste token expirado:**
   - Crie uma aprovação
   - Modifique `data_submissao` no banco para mais de 48h atrás
   - Acesse o link
   - ✅ Erro: "Token expirado (válido por 48 horas)"

3. **Teste aprovação já processada:**
   - Aprove uma aprovação via link
   - Tente acessar o link novamente
   - ✅ Erro: "Aprovação já está aprovado"

---

## 🧪 TESTE 6: Verificar Logs no Console

### Objetivo
Verificar se os logs estão sendo gerados corretamente.

### Passos:

1. **Abra o console do backend:**
   ```bash
   cd backend-api
   npm run dev
   ```

2. **Monitore os logs ao criar uma aprovação:**
   - Procure por: `[whatsapp-service]`
   - Procure por: `[approval-tokens]`
   - Procure por: `[aprovacoes-horas-extras]`

3. **Logs esperados:**
   ```
   [approval-tokens] Token gerado para aprovação {id}
   [whatsapp-service] Mensagem enviada com sucesso para {telefone}
   [aprovacoes-horas-extras] WhatsApp enviado com sucesso para aprovação {id}
   ```

---

## 🧪 TESTE 7: Verificar Banco de Dados

### Objetivo
Verificar se os dados estão sendo salvos corretamente.

### Passos:

1. **Verifique se o token foi salvo:**
   ```sql
   SELECT id, token_aprovacao, status 
   FROM aprovacoes_horas_extras 
   WHERE id = '{aprovacao_id}';
   ```
   - ✅ Campo `token_aprovacao` deve estar preenchido

2. **Verifique telefone do supervisor:**
   ```sql
   SELECT f.id, f.nome, f.telefone_whatsapp, f.telefone
   FROM funcionarios f
   WHERE f.user_id = {supervisor_id};
   ```
   - ✅ Deve ter `telefone_whatsapp` ou `telefone` preenchido

---

## 🐛 Troubleshooting

### Problema: WhatsApp não é enviado

**Verifique:**
1. ✅ Variável `WHATSAPP_WEBHOOK_URL` está configurada?
2. ✅ Supervisor tem telefone cadastrado?
3. ✅ Webhook do n8n está funcionando?
4. ✅ Console do backend mostra algum erro?

**Solução:**
- Verifique os logs do backend
- Teste o webhook manualmente via Postman/Insomnia
- Verifique se o n8n está recebendo as requisições

### Problema: Link de aprovação não funciona

**Verifique:**
1. ✅ Token foi gerado e salvo no banco?
2. ✅ Token não expirou (48h)?
3. ✅ Aprovação ainda está pendente?

**Solução:**
- Verifique o token no banco de dados
- Verifique a data de submissão
- Teste com um token recém-criado

### Problema: Erro 404 na rota de teste

**Verifique:**
1. ✅ Servidor backend está rodando?
2. ✅ Rota está registrada no `server.js`?
3. ✅ Token de autenticação está sendo enviado?

**Solução:**
- Reinicie o servidor backend
- Verifique se a rota `/api/whatsapp/test` está registrada
- Verifique o token no header Authorization

---

## ✅ Checklist de Validação

Após executar todos os testes, verifique:

- [ ] Teste manual de envio funciona
- [ ] Aprovação manual envia WhatsApp automaticamente
- [ ] Registro de ponto com horas extras envia WhatsApp
- [ ] Link público de aprovação funciona
- [ ] Aprovação via link funciona
- [ ] Rejeição via link funciona
- [ ] Token inválido retorna erro
- [ ] Token expirado retorna erro
- [ ] Logs aparecem no console
- [ ] Dados são salvos no banco

---

## 📝 Notas Importantes

1. **Telefone deve estar no formato internacional:**
   - ✅ Correto: `5511999999999`
   - ❌ Errado: `(11) 99999-9999` ou `11999999999`

2. **Token expira em 48 horas:**
   - Links antigos não funcionam após 48h
   - Crie novas aprovações para testar

3. **Configurações no n8n:**
   - Todas as configurações da Evolution API devem ser feitas no n8n
   - O sistema apenas envia webhook para o n8n

4. **Rate Limiting:**
   - Máximo de 10 requisições por IP a cada 15 minutos
   - Se exceder, aguarde 15 minutos

---

**Última atualização:** 31/01/2025

