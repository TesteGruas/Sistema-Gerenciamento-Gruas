# 📧 Configuração Postfix (SMTP Local) na VPS

## ⚠️ AVISO IMPORTANTE

**Esta opção NÃO é recomendada** para produção porque:
- Emails podem ir para spam
- Requer configuração complexa de DNS (SPF, DKIM, DMARC)
- Risco de bloqueio por provedores de email
- Manutenção e troubleshooting mais difíceis

**Recomendação**: Use serviços como Mailtrap (desenvolvimento) ou SendGrid/Mailgun (produção).

---

## 🚨 Você NÃO tem domínio?

**Se você não tem domínio**, NÃO use Postfix! Use uma destas opções:

1. **Mailtrap** (Recomendado) - Gratuito, sem domínio necessário
   - Guia: `docs/CONFIGURACAO-MAILTRAP-RAPIDO.md`
   - Link: https://mailtrap.io

2. **Postfix SEM domínio** (Apenas testes locais)
   - Guia: `docs/CONFIGURACAO-POSTFIX-SEM-DOMINIO.md`
   - ⚠️ Emails externos NÃO funcionarão

**Se você tem domínio**, continue com este guia.

---

## 📋 Pré-requisitos

- Acesso SSH à VPS com permissões de root ou sudo
- **Domínio configurado** apontando para o IP da VPS (OBRIGATÓRIO)
- Portas 25, 587 e 465 abertas no firewall

---

## 🔧 Passo 1: Instalar Postfix

```bash
# Atualizar pacotes
sudo apt update
sudo apt upgrade -y

# Instalar Postfix
sudo apt install postfix mailutils -y
```

Durante a instalação, você será questionado sobre o tipo de configuração:
- Escolha **"Internet Site"**
- Digite o **FQDN** (Fully Qualified Domain Name) do seu servidor, por exemplo: `mail.seudominio.com.br`

---

## 🔧 Passo 2: Configuração Básica do Postfix

### Editar arquivo de configuração principal

```bash
sudo nano /etc/postfix/main.cf
```

### Configuração mínima recomendada:

```conf
# Identificação do servidor
myhostname = mail.seudominio.com.br
mydomain = seudominio.com.br
myorigin = $mydomain

# Redes permitidas
inet_interfaces = all
inet_protocols = ipv4

# Destinos aceitos
mydestination = $myhostname, localhost.$mydomain, localhost, $mydomain

# Redes confiáveis (ajuste conforme necessário)
mynetworks = 127.0.0.0/8, [::ffff:127.0.0.0]/104, [::1]/128

# Configurações de segurança
smtpd_banner = $myhostname ESMTP
disable_vrfy_command = yes
smtpd_helo_required = yes

# Limites de tamanho
message_size_limit = 10240000
mailbox_size_limit = 0

# Logs
maillog_file = /var/log/mail.log
```

### Salvar e sair (Ctrl+X, Y, Enter)

---

## 🔧 Passo 3: Configurar Autenticação SMTP (SASL)

### Instalar dependências

```bash
sudo apt install sasl2-bin libsasl2-modules -y
```

### Criar usuário para autenticação SMTP

```bash
# Criar usuário (substitua 'smtpuser' pelo nome desejado)
sudo useradd -r -s /bin/false smtpuser

# Definir senha para o usuário
sudo passwd smtpuser
```

### Configurar SASL

```bash
sudo nano /etc/postfix/sasl/smtpd.conf
```

Adicione:

```conf
pwcheck_method: auxprop
auxprop_plugin: sasldb
mech_list: PLAIN LOGIN CRAM-MD5 DIGEST-MD5 NTLM
```

### Criar banco de dados SASL

```bash
sudo saslpasswd2 -c -u $(postconf -h myhostname) smtpuser
# Digite a senha quando solicitado
sudo chown postfix:sasl /etc/sasl2/sasldb2
sudo chmod 640 /etc/sasl2/sasldb2
```

### Configurar Postfix para usar SASL

```bash
sudo nano /etc/postfix/main.cf
```

Adicione ao final do arquivo:

```conf
# Autenticação SASL
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_auth_enable = yes
smtpd_sasl_security_options = noanonymous
smtpd_sasl_local_domain = $myhostname
broken_sasl_auth_clients = yes

# Restrições de acesso
smtpd_recipient_restrictions = 
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_unauth_destination,
    reject_rbl_client zen.spamhaus.org,
    permit

# TLS/SSL (opcional, mas recomendado)
smtpd_tls_cert_file = /etc/ssl/certs/ssl-cert-snakeoil.pem
smtpd_tls_key_file = /etc/ssl/private/ssl-cert-snakeoil.key
smtpd_use_tls = yes
smtpd_tls_auth_only = yes
```

---

## 🔧 Passo 4: Configurar Portas SMTP

### Editar master.cf

```bash
sudo nano /etc/postfix/master.cf
```

Certifique-se de que estas linhas estão descomentadas (sem # no início):

```conf
# Porta 25 (SMTP padrão)
smtp      inet  n       -       y       -       -       smtpd

# Porta 587 (Submission - com autenticação)
submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix-submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_tls_auth_only=yes
  -o smtpd_reject_unlisted_recipient=no
  -o smtpd_client_restrictions=$mua_client_restrictions
  -o smtpd_helo_restrictions=$mua_helo_restrictions
  -o smtpd_sender_restrictions=$mua_sender_restrictions
  -o smtpd_recipient_restrictions=
  -o smtpd_relay_restrictions=permit_sasl_authenticated,reject
  -o milter_macro_daemon_name=ORIGINATING

# Porta 465 (SMTPS - SSL direto)
smtps     inet  n       -       y       -       -       smtpd
  -o syslog_name=postfix-smtps
  -o smtpd_tls_wrappermode=yes
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_reject_unlisted_recipient=no
  -o smtpd_client_restrictions=$mua_client_restrictions
  -o smtpd_helo_restrictions=$mua_helo_restrictions
  -o smtpd_sender_restrictions=$mua_sender_restrictions
  -o smtpd_recipient_restrictions=
  -o smtpd_relay_restrictions=permit_sasl_authenticated,reject
  -o milter_macro_daemon_name=ORIGINATING
```

---

## 🔧 Passo 5: Configurar Firewall

```bash
# Permitir portas SMTP
sudo ufw allow 25/tcp
sudo ufw allow 587/tcp
sudo ufw allow 465/tcp

# Verificar status
sudo ufw status
```

---

## 🔧 Passo 6: Reiniciar e Testar Postfix

### Reiniciar serviço

```bash
# Verificar configuração
sudo postfix check

# Reiniciar Postfix
sudo systemctl restart postfix
sudo systemctl enable postfix

# Verificar status
sudo systemctl status postfix
```

### Testar envio local

```bash
# Enviar email de teste
echo "Teste de email" | mail -s "Teste Postfix" seu-email@gmail.com

# Verificar logs
sudo tail -f /var/log/mail.log
```

---

## 🔧 Passo 7: Configurar no Sistema (Backend)

### Opção A: Via Interface Web (Recomendado)

1. Acesse: `http://seu-ip:3000/dashboard/configuracoes/email`
2. Preencha os campos:
   - **Host SMTP**: `localhost` ou `127.0.0.1`
   - **Porta**: `587` (submission) ou `465` (SMTPS)
   - **Secure**: `false` para 587, `true` para 465
   - **Usuário**: `smtpuser` (ou o usuário criado)
   - **Senha**: A senha definida para o usuário
   - **Email From**: `noreply@seudominio.com.br`
   - **Nome From**: `Sistema de Gerenciamento de Gruas`

### Opção B: Via SQL direto (se necessário)

```sql
-- Inserir configuração de email
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
  'localhost',
  587,
  false,
  'smtpuser',
  'senha_criptografada', -- Será criptografada pelo backend
  'noreply@seudominio.com.br',
  'Sistema de Gerenciamento de Gruas',
  true
);
```

**Nota**: As senhas são criptografadas automaticamente pelo backend usando AES-256.

---

## 🔧 Passo 8: Configurar DNS (IMPORTANTE para evitar spam)

### SPF Record

Adicione no DNS do seu domínio:

```
TXT @ "v=spf1 ip4:SEU_IP_VPS ~all"
```

Exemplo:
```
TXT @ "v=spf1 ip4:72.60.60.118 ~all"
```

### DKIM (Opcional, mas recomendado)

```bash
# Instalar opendkim
sudo apt install opendkim opendkim-tools -y

# Gerar chaves DKIM
sudo mkdir -p /etc/opendkim/keys/seudominio.com.br
sudo opendkim-genkey -D /etc/opendkim/keys/seudominio.com.br/ -d seudominio.com.br -s default
sudo chown -R opendkim:opendkim /etc/opendkim/keys
```

Adicione o registro TXT no DNS:
```bash
sudo cat /etc/opendkim/keys/seudominio.com.br/default.txt
```

### DMARC (Opcional, mas recomendado)

Adicione no DNS:

```
TXT _dmarc "v=DMARC1; p=none; rua=mailto:admin@seudominio.com.br"
```

---

## 🧪 Testar Configuração

### Teste 1: Verificar se Postfix está rodando

```bash
sudo systemctl status postfix
sudo netstat -tlnp | grep :25
sudo netstat -tlnp | grep :587
sudo netstat -tlnp | grep :465
```

### Teste 2: Testar conexão SMTP

```bash
# Testar porta 587
telnet localhost 587

# Você deve ver algo como:
# 220 mail.seudominio.com.br ESMTP Postfix
```

### Teste 3: Testar autenticação

```bash
# Instalar swaks (ferramenta de teste SMTP)
sudo apt install swaks -y

# Testar envio
swaks --to seu-email@gmail.com \
  --from noreply@seudominio.com.br \
  --server localhost \
  --port 587 \
  --auth LOGIN \
  --auth-user smtpuser \
  --auth-password 'sua_senha' \
  --tls
```

### Teste 4: Verificar logs

```bash
# Ver logs em tempo real
sudo tail -f /var/log/mail.log

# Verificar erros
sudo grep -i error /var/log/mail.log
```

---

## 🔍 Troubleshooting

### Problema: Emails não são enviados

```bash
# Verificar logs
sudo tail -n 50 /var/log/mail.log

# Verificar configuração
sudo postfix check

# Testar conexão
sudo telnet localhost 25
```

### Problema: Autenticação falha

```bash
# Verificar usuário SASL
sudo sasldblistusers2

# Recriar usuário se necessário
sudo saslpasswd2 -c -u $(postconf -h myhostname) smtpuser
```

### Problema: Emails vão para spam

- Configure SPF, DKIM e DMARC no DNS
- Use um domínio próprio (não IP direto)
- Evite enviar muitos emails de uma vez
- Configure reverse DNS (PTR record) no provedor VPS

### Problema: Porta bloqueada

```bash
# Verificar firewall
sudo ufw status

# Verificar se Postfix está escutando
sudo netstat -tlnp | grep postfix
```

---

## 📝 Configuração Recomendada para Produção

Se você realmente precisa usar Postfix em produção:

1. **Use um domínio próprio** (não IP direto)
2. **Configure SPF, DKIM e DMARC** no DNS
3. **Configure reverse DNS (PTR)** com seu provedor VPS
4. **Use certificados SSL válidos** (Let's Encrypt)
5. **Monitore logs regularmente**
6. **Configure rate limiting** para evitar spam
7. **Use um serviço de relay** (como SendGrid) como backup

---

## 🔄 Alternativas Recomendadas

### Para Desenvolvimento:
- **Mailtrap**: https://mailtrap.io (gratuito até 500 emails/mês)

### Para Produção:
- **SendGrid**: https://sendgrid.com (gratuito até 100 emails/dia)
- **Mailgun**: https://www.mailgun.com (gratuito até 5.000 emails/mês)
- **Amazon SES**: https://aws.amazon.com/ses/ (muito barato)

---

## 📚 Referências

- [Postfix Documentation](http://www.postfix.org/documentation.html)
- [Postfix SASL Howto](http://www.postfix.org/SASL_README.html)
- [SPF Record Syntax](https://www.openspf.org/SPF_Record_Syntax)

---

## ✅ Checklist Final

- [ ] Postfix instalado e rodando
- [ ] Portas 25, 587, 465 abertas no firewall
- [ ] Usuário SMTP criado e configurado
- [ ] Configuração testada localmente
- [ ] Configuração adicionada no sistema (via interface web)
- [ ] Teste de envio realizado com sucesso
- [ ] SPF configurado no DNS (recomendado)
- [ ] Logs sendo monitorados

---

**⚠️ Lembre-se**: Esta configuração é complexa e pode resultar em emails indo para spam. Considere usar serviços de email transacional para produção.

