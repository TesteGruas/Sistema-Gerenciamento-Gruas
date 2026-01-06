# 📧 Configuração Postfix SEM Domínio (Usando IP)

## ⚠️ AVISOS IMPORTANTES

**Sem domínio próprio, você terá:**
- ❌ **Alto risco de emails irem para spam** (quase 100%)
- ❌ **Não pode configurar SPF, DKIM, DMARC**
- ❌ **Provedores de email podem bloquear seus emails**
- ❌ **Apenas para testes internos ou desenvolvimento**

**Recomendação FORTE**: Use **Mailtrap** (gratuito) ou outro serviço de email transacional até conseguir um domínio.

---

## 🎯 Opção Recomendada: Mailtrap (SEM Domínio)

### Por que Mailtrap é melhor sem domínio:
- ✅ Gratuito até 500 emails/mês
- ✅ Não precisa de domínio
- ✅ Emails não vão para spam
- ✅ Interface web para ver emails enviados
- ✅ Configuração em 2 minutos

### Como configurar Mailtrap:

1. **Criar conta**: https://mailtrap.io (gratuito)
2. **Obter credenciais SMTP**:
   - Acesse: Inbox → SMTP Settings
   - Copie: Host, Port, User, Password
3. **Configurar no sistema**:
   - Acesse: `http://seu-ip:3000/dashboard/configuracoes/email`
   - Preencha com as credenciais do Mailtrap

**Pronto!** Muito mais simples e confiável que Postfix sem domínio.

---

## 🔧 Configuração Postfix SEM Domínio (Apenas para Testes)

Se você **realmente** precisa usar Postfix sem domínio (apenas para testes internos):

### Passo 1: Instalar Postfix

```bash
sudo apt update
sudo apt install postfix mailutils -y
```

Durante a instalação:
- Escolha **"Internet Site"**
- Digite o **hostname** do servidor (ex: `mail` ou use o hostname atual)

### Passo 2: Configuração Básica

```bash
sudo nano /etc/postfix/main.cf
```

**Configuração mínima (sem domínio):**

```conf
# Usar hostname local
myhostname = $(hostname)
mydomain = localdomain
myorigin = $mydomain

# Redes permitidas
inet_interfaces = all
inet_protocols = ipv4

# Destinos aceitos (apenas local)
mydestination = $myhostname, localhost.$mydomain, localhost

# Redes confiáveis (apenas localhost)
mynetworks = 127.0.0.0/8, [::ffff:127.0.0.0]/104, [::1]/128

# Configurações de segurança
smtpd_banner = $myhostname ESMTP
disable_vrfy_command = yes
smtpd_helo_required = yes

# Limites
message_size_limit = 10240000

# Permitir envio apenas de localhost (sem autenticação externa)
smtpd_recipient_restrictions = 
    permit_mynetworks,
    reject_unauth_destination,
    permit
```

### Passo 3: Reiniciar Postfix

```bash
sudo postfix check
sudo systemctl restart postfix
sudo systemctl enable postfix
```

### Passo 4: Configurar no Sistema

1. Acesse: `http://seu-ip:3000/dashboard/configuracoes/email`
2. Configure:
   - **Host SMTP**: `localhost`
   - **Porta**: `25`
   - **Secure**: `false`
   - **Usuário**: (deixe vazio ou use qualquer valor)
   - **Senha**: (deixe vazio ou use qualquer valor)
   - **Email From**: `noreply@localhost` (ou qualquer email)
   - **Nome From**: `Sistema de Gerenciamento de Gruas`

**⚠️ IMPORTANTE**: Esta configuração só funciona para envios locais. Emails externos (Gmail, etc) **NÃO funcionarão** ou irão direto para spam.

---

## 🧪 Testar Configuração Local

### Teste 1: Enviar email local

```bash
# Instalar mailutils se não tiver
sudo apt install mailutils -y

# Enviar email de teste (apenas local)
echo "Teste de email" | mail -s "Teste Postfix" root

# Verificar se chegou
sudo mail
```

### Teste 2: Verificar logs

```bash
sudo tail -f /var/log/mail.log
```

---

## 🚫 Limitações SEM Domínio

### O que NÃO funciona:
- ❌ Enviar emails para Gmail, Outlook, etc (vão para spam ou são bloqueados)
- ❌ Configurar SPF, DKIM, DMARC
- ❌ Autenticação adequada
- ❌ Reputação de IP

### O que funciona:
- ✅ Enviar emails localmente (mesmo servidor)
- ✅ Testes básicos de funcionalidade
- ✅ Desenvolvimento local

---

## 📋 Checklist: Quando Conseguir um Domínio

Quando você conseguir um domínio, siga estes passos:

1. **Configurar DNS**:
   - A Record: `mail.seudominio.com.br` → IP da VPS
   - SPF Record: `v=spf1 ip4:SEU_IP ~all`
   - DKIM (opcional)
   - DMARC (opcional)

2. **Atualizar Postfix**:
   ```bash
   sudo nano /etc/postfix/main.cf
   # Alterar:
   myhostname = mail.seudominio.com.br
   mydomain = seudominio.com.br
   ```

3. **Reiniciar**:
   ```bash
   sudo systemctl restart postfix
   ```

4. **Atualizar no sistema**:
   - Alterar Email From para: `noreply@seudominio.com.br`

---

## 🎯 Alternativas Recomendadas (SEM Domínio)

### 1. Mailtrap (Recomendado para Dev)
- **Gratuito**: 500 emails/mês
- **Sem domínio necessário**
- **Interface web para ver emails**
- **Link**: https://mailtrap.io

### 2. SendGrid (Para Produção)
- **Gratuito**: 100 emails/dia
- **Sem domínio necessário** (mas recomendado)
- **Link**: https://sendgrid.com

### 3. Mailgun
- **Gratuito**: 5.000 emails/mês (primeiros 3 meses)
- **Sem domínio necessário** (mas recomendado)
- **Link**: https://www.mailgun.com

### 4. Amazon SES
- **Muito barato**: $0.10 por 1.000 emails
- **Requer verificação de domínio ou email**
- **Link**: https://aws.amazon.com/ses/

---

## 🔧 Script de Configuração Rápida (SEM Domínio)

Crie um arquivo `config-postfix-sem-dominio.sh`:

```bash
#!/bin/bash
set -e

echo "⚠️  AVISO: Esta configuração é apenas para testes locais!"
echo "   Emails externos NÃO funcionarão sem domínio."
echo ""
read -p "Continuar? (s/n): " CONFIRM
[ "$CONFIRM" != "s" ] && exit 1

# Instalar
sudo apt update
sudo apt install -y postfix mailutils

# Configurar
sudo postconf -e "myhostname=$(hostname)"
sudo postconf -e "mydomain=localdomain"
sudo postconf -e "myorigin=\$mydomain"
sudo postconf -e "mydestination=\$myhostname,localhost.\$mydomain,localhost"
sudo postconf -e "mynetworks=127.0.0.0/8"
sudo postconf -e "smtpd_recipient_restrictions=permit_mynetworks,reject_unauth_destination,permit"

# Reiniciar
sudo postfix check
sudo systemctl restart postfix
sudo systemctl enable postfix

echo "✅ Postfix configurado (apenas local)"
echo "⚠️  Configure no sistema: localhost:25"
```

---

## 📝 Resumo

### Para Desenvolvimento/Testes SEM Domínio:
1. ✅ **Use Mailtrap** (mais fácil e confiável)
2. ❌ **NÃO use Postfix** (não funcionará para emails externos)

### Para Produção:
1. ✅ **Consiga um domínio** (barato, ~R$ 30/ano)
2. ✅ **Configure Postfix com domínio** OU
3. ✅ **Use serviço de email transacional** (SendGrid, Mailgun, etc)

---

## 🆘 Precisa de Ajuda?

- **Mailtrap**: https://mailtrap.io (recomendado para você agora)
- **Guia completo com domínio**: `docs/CONFIGURACAO-POSTFIX-VPS.md`
- **Script automatizado**: `scripts/configurar-postfix-vps.sh` (quando tiver domínio)

---

**💡 Dica**: Compre um domínio barato (ex: .com.br por ~R$ 30/ano) e configure corretamente. Vale muito a pena para produção!




