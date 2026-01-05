#!/bin/bash

# ============================================
# Script de Configuração Postfix para VPS
# ============================================
# ⚠️ AVISO: Esta opção NÃO é recomendada para produção
# Use apenas para testes ou ambientes internos
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Configuração Postfix (SMTP Local)${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Por favor, execute como root ou com sudo${NC}"
    exit 1
fi

# Variáveis de configuração
read -p "Digite o FQDN do servidor (ex: mail.seudominio.com.br): " HOSTNAME
read -p "Digite o domínio (ex: seudominio.com.br): " DOMAIN
read -p "Digite o IP da VPS: " VPS_IP
read -p "Digite o nome do usuário SMTP a criar: " SMTP_USER
read -s -p "Digite a senha para o usuário SMTP: " SMTP_PASS
echo ""

# Confirmar
echo ""
echo -e "${YELLOW}Configurações:${NC}"
echo "  Hostname: $HOSTNAME"
echo "  Domínio: $DOMAIN"
echo "  IP VPS: $VPS_IP"
echo "  Usuário SMTP: $SMTP_USER"
echo ""
read -p "Continuar? (s/n): " CONFIRM

if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo -e "${RED}Cancelado pelo usuário${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}[1/8] Atualizando pacotes...${NC}"
apt update && apt upgrade -y

echo ""
echo -e "${GREEN}[2/8] Instalando Postfix e dependências...${NC}"
DEBIAN_FRONTEND=noninteractive apt install -y postfix mailutils sasl2-bin libsasl2-modules

echo ""
echo -e "${GREEN}[3/8] Configurando hostname...${NC}"
hostnamectl set-hostname "$HOSTNAME"
echo "$HOSTNAME" > /etc/hostname
sed -i "s/127.0.1.1.*/127.0.1.1\t$HOSTNAME/" /etc/hosts

echo ""
echo -e "${GREEN}[4/8] Configurando Postfix main.cf...${NC}"
cat > /etc/postfix/main.cf <<EOF
# Identificação do servidor
myhostname = $HOSTNAME
mydomain = $DOMAIN
myorigin = \$mydomain

# Redes permitidas
inet_interfaces = all
inet_protocols = ipv4

# Destinos aceitos
mydestination = \$myhostname, localhost.\$mydomain, localhost, \$mydomain

# Redes confiáveis
mynetworks = 127.0.0.0/8, [::ffff:127.0.0.0]/104, [::1]/128

# Configurações de segurança
smtpd_banner = \$myhostname ESMTP
disable_vrfy_command = yes
smtpd_helo_required = yes

# Limites de tamanho
message_size_limit = 10240000
mailbox_size_limit = 0

# Autenticação SASL
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_auth_enable = yes
smtpd_sasl_security_options = noanonymous
smtpd_sasl_local_domain = \$myhostname
broken_sasl_auth_clients = yes

# Restrições de acesso
smtpd_recipient_restrictions = 
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_unauth_destination,
    permit

# TLS/SSL
smtpd_tls_cert_file = /etc/ssl/certs/ssl-cert-snakeoil.pem
smtpd_tls_key_file = /etc/ssl/private/ssl-cert-snakeoil.key
smtpd_use_tls = yes
smtpd_tls_auth_only = yes

# Logs
maillog_file = /var/log/mail.log
EOF

echo ""
echo -e "${GREEN}[5/8] Configurando SASL...${NC}"
mkdir -p /etc/postfix/sasl
cat > /etc/postfix/sasl/smtpd.conf <<EOF
pwcheck_method: auxprop
auxprop_plugin: sasldb
mech_list: PLAIN LOGIN CRAM-MD5 DIGEST-MD5 NTLM
EOF

# Criar usuário SMTP
useradd -r -s /bin/false "$SMTP_USER" 2>/dev/null || true
echo "$SMTP_USER:$SMTP_PASS" | chpasswd

# Criar banco de dados SASL
echo "$SMTP_PASS" | saslpasswd2 -c -p -u "$HOSTNAME" "$SMTP_USER"
chown postfix:sasl /etc/sasl2/sasldb2 2>/dev/null || true
chmod 640 /etc/sasl2/sasldb2 2>/dev/null || true

echo ""
echo -e "${GREEN}[6/8] Configurando portas SMTP...${NC}"
# Backup do master.cf original
cp /etc/postfix/master.cf /etc/postfix/master.cf.backup

# Adicionar configuração de submission (587) e smtps (465)
cat >> /etc/postfix/master.cf <<EOF

# Porta 587 (Submission)
submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix-submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_tls_auth_only=yes
  -o smtpd_reject_unlisted_recipient=no
  -o smtpd_recipient_restrictions=permit_sasl_authenticated,reject

# Porta 465 (SMTPS)
smtps     inet  n       -       y       -       -       smtpd
  -o syslog_name=postfix-smtps
  -o smtpd_tls_wrappermode=yes
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_reject_unlisted_recipient=no
  -o smtpd_recipient_restrictions=permit_sasl_authenticated,reject
EOF

echo ""
echo -e "${GREEN}[7/8] Configurando firewall...${NC}"
ufw allow 25/tcp 2>/dev/null || true
ufw allow 587/tcp 2>/dev/null || true
ufw allow 465/tcp 2>/dev/null || true

echo ""
echo -e "${GREEN}[8/8] Reiniciando Postfix...${NC}"
postfix check
systemctl restart postfix
systemctl enable postfix

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Configuração concluída!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo ""
echo "1. Configure no sistema via interface web:"
echo "   http://seu-ip:3000/dashboard/configuracoes/email"
echo ""
echo "2. Configurações SMTP:"
echo "   Host: localhost"
echo "   Porta: 587 (ou 465 para SSL)"
echo "   Secure: false (587) ou true (465)"
echo "   Usuário: $SMTP_USER"
echo "   Senha: [a senha que você digitou]"
echo ""
echo "3. Configure DNS (IMPORTANTE para evitar spam):"
echo "   SPF Record (TXT):"
echo "   v=spf1 ip4:$VPS_IP ~all"
echo ""
echo "4. Teste o envio:"
echo "   sudo tail -f /var/log/mail.log"
echo ""
echo -e "${YELLOW}⚠️  Lembre-se: Esta configuração pode resultar em emails indo para spam.${NC}"
echo -e "${YELLOW}   Considere usar serviços de email transacional para produção.${NC}"
echo ""


