# 📧 Configuração Mailtrap (Recomendado SEM Domínio)

## ✅ Por que Mailtrap é Melhor SEM Domínio

- ✅ **Gratuito**: 500 emails/mês
- ✅ **Não precisa de domínio**
- ✅ **Emails não vão para spam**
- ✅ **Interface web para ver emails enviados**
- ✅ **Configuração em 2 minutos**
- ✅ **Perfeito para desenvolvimento e testes**

---

## 🚀 Configuração Rápida (5 minutos)

### Passo 1: Criar Conta no Mailtrap

1. Acesse: **https://mailtrap.io**
2. Clique em **"Sign Up"** (gratuito)
3. Crie sua conta (pode usar Google/GitHub)

### Passo 2: Obter Credenciais SMTP

1. Após login, você verá seu **Inbox**
2. Clique em **"SMTP Settings"** no menu lateral
3. Selecione **"Nodemailer"** (ou qualquer opção)
4. Você verá as credenciais:

```
Host: sandbox.smtp.mailtrap.io
Port: 2525 (ou 587, 465)
Username: [seu_username]
Password: [sua_password]
```

**Copie essas informações!**

### Passo 3: Configurar no Sistema

1. Acesse seu sistema:
   ```
   http://seu-ip:3000/dashboard/configuracoes/email
   ```

2. Preencha os campos:
   - **Host SMTP**: `sandbox.smtp.mailtrap.io`
   - **Porta**: `2525` (ou `587` para TLS)
   - **Secure**: `false` (para porta 2525) ou `true` (para porta 465)
   - **Usuário**: [username do Mailtrap]
   - **Senha**: [password do Mailtrap]
   - **Email From**: `noreply@teste.com` (qualquer email, não precisa ser real)
   - **Nome From**: `Sistema de Gerenciamento de Gruas`
   - **Email Enabled**: ✅ Ativado

3. Clique em **"Salvar Configurações"**

### Passo 4: Testar

1. No sistema, tente enviar um email (ex: reset de senha)
2. Volte ao Mailtrap → **Inbox**
3. Você verá o email enviado lá! 🎉

---

## 📋 Exemplo de Configuração

### Via Interface Web do Sistema:

```
Host SMTP: sandbox.smtp.mailtrap.io
Porta: 2525
Secure: false
Usuário: abc123def456
Senha: xyz789uvw012
Email From: noreply@sistema.com
Nome From: Sistema de Gerenciamento de Gruas
```

### Via SQL (se necessário):

```sql
-- As senhas serão criptografadas automaticamente pelo backend
INSERT INTO email_configs (
  smtp_host,
  smtp_port,
  smtp_secure,
  smtp_user,
  smtp_pass,
  email_from,
  email_from_name,
  email_enabled
) VALUES (
  'sandbox.smtp.mailtrap.io',
  2525,
  false,
  'abc123def456',  -- Será criptografado
  'xyz789uvw012', -- Será criptografado
  'noreply@sistema.com',
  'Sistema de Gerenciamento de Gruas',
  true
);
```

---

## 🔍 Verificar Emails Enviados

1. Acesse: **https://mailtrap.io**
2. Vá para **"Inboxes"** → Seu inbox
3. Todos os emails enviados pelo sistema aparecerão lá
4. Você pode:
   - Ver o conteúdo HTML
   - Ver o texto plano
   - Ver headers
   - Testar links
   - Ver anexos

---

## 🎯 Vantagens do Mailtrap

### Para Desenvolvimento:
- ✅ Não envia emails reais (não incomoda usuários)
- ✅ Vê todos os emails em um lugar
- ✅ Testa templates facilmente
- ✅ Não precisa configurar servidor

### Para Testes:
- ✅ Testa fluxos de email completos
- ✅ Verifica se emails estão sendo enviados
- ✅ Debug fácil de problemas

---

## 📊 Limites do Plano Gratuito

- **500 emails/mês** (suficiente para desenvolvimento)
- **1 inbox** (suficiente para testes)
- **Sem limite de tempo** (permanece gratuito)

### Se precisar de mais:
- **Plano Pago**: A partir de $15/mês
- **Ou use outro serviço**: SendGrid, Mailgun, etc

---

## 🔄 Migrar para Produção (Quando Tiver Domínio)

Quando estiver pronto para produção:

### Opção 1: Mailtrap (Pago)
- Upgrade para plano pago
- Configure domínio próprio
- Emails reais são enviados

### Opção 2: SendGrid/Mailgun
- Gratuito até certo limite
- Configure no sistema (mesma interface)
- Apenas mude as credenciais SMTP

### Opção 3: Postfix Próprio
- Siga: `docs/CONFIGURACAO-POSTFIX-VPS.md`
- Configure domínio e DNS
- Mais complexo, mas gratuito

---

## 🆘 Troubleshooting

### Problema: Email não aparece no Mailtrap

1. Verifique se as credenciais estão corretas
2. Verifique logs do backend:
   ```bash
   # Na VPS
   tail -f /var/log/backend.log
   # ou
   pm2 logs backend-api
   ```
3. Teste conexão SMTP:
   ```bash
   telnet sandbox.smtp.mailtrap.io 2525
   ```

### Problema: Erro de autenticação

- Verifique se copiou username e password corretamente
- Não há espaços extras
- Use porta 2525 com secure=false

### Problema: Timeout

- Verifique firewall (porta 2525, 587, 465)
- Verifique se VPS tem acesso à internet
- Teste: `curl -v telnet://sandbox.smtp.mailtrap.io:2525`

---

## 📚 Links Úteis

- **Mailtrap**: https://mailtrap.io
- **Documentação**: https://mailtrap.io/docs/
- **SMTP Settings**: https://mailtrap.io/inboxes (depois de login)

---

## ✅ Checklist

- [ ] Conta criada no Mailtrap
- [ ] Credenciais SMTP copiadas
- [ ] Configurado no sistema via interface web
- [ ] Teste de envio realizado
- [ ] Email apareceu no inbox do Mailtrap

---

**🎉 Pronto!** Agora você tem um sistema de email funcionando sem precisar de domínio!

