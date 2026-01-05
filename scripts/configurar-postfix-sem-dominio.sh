#!/bin/bash

# ============================================
# Script de Configuração Postfix SEM Domínio
# ============================================
# ⚠️ AVISO: Apenas para testes locais!
# Emails externos NÃO funcionarão sem domínio
# Recomendação: Use Mailtrap (gratuito) em vez disso
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}========================================${NC}"
echo -e "${RED}⚠️  AVISO IMPORTANTE${NC}"
echo -e "${RED}========================================${NC}"
echo ""
echo -e "${YELLOW}Esta configuração é APENAS para testes locais.${NC}"
echo -e "${YELLOW}Emails para Gmail, Outlook, etc NÃO funcionarão${NC}"
echo -e "${YELLOW}ou irão direto para SPAM.${NC}"
echo ""
echo -e "${BLUE}Recomendação: Use Mailtrap (gratuito)${NC}"
echo -e "${BLUE}Link: https://mailtrap.io${NC}"
echo ""
read -p "Continuar mesmo assim? (s/n): " CONFIRM

if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo -e "${GREEN}Cancelado. Considere usar Mailtrap!${NC}"
    exit 0
fi

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Por favor, execute como root ou com sudo${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Configuração Postfix (SEM Domínio)${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Obter hostname atual
CURRENT_HOSTNAME=$(hostname)
echo "Hostname atual: $CURRENT_HOSTNAME"
read -p "Usar este hostname? (s/n): " USE_HOSTNAME

if [ "$USE_HOSTNAME" != "s" ] && [ "$USE_HOSTNAME" != "S" ]; then
    read -p "Digite o hostname desejado: " CURRENT_HOSTNAME
fi

echo ""
echo -e "${GREEN}[1/5] Atualizando pacotes...${NC}"
apt update && apt upgrade -y

echo ""
echo -e "${GREEN}[2/5] Instalando Postfix...${NC}"
DEBIAN_FRONTEND=noninteractive apt install -y postfix mailutils

# Configurar hostname durante instalação
echo "$CURRENT_HOSTNAME" > /etc/hostname
hostnamectl set-hostname "$CURRENT_HOSTNAME"

echo ""
echo -e "${GREEN}[3/5] Configurando Postfix (apenas local)...${NC}"

# Configuração mínima para testes locais
cat > /etc/postfix/main.cf <<EOF
# Configuração mínima SEM domínio (apenas local)
myhostname = $CURRENT_HOSTNAME
mydomain = localdomain
myorigin = \$mydomain

# Redes permitidas
inet_interfaces = all
inet_protocols = ipv4

# Destinos aceitos (apenas local)
mydestination = \$myhostname, localhost.\$mydomain, localhost

# Redes confiáveis (apenas localhost)
mynetworks = 127.0.0.0/8, [::ffff:127.0.0.0]/104, [::1]/128

# Configurações de segurança
smtpd_banner = \$myhostname ESMTP
disable_vrfy_command = yes
smtpd_helo_required = yes

# Limites
message_size_limit = 10240000
mailbox_size_limit = 0

# Permitir envio apenas de localhost
smtpd_recipient_restrictions = 
    permit_mynetworks,
    reject_unauth_destination,
    permit

# Logs
maillog_file = /var/log/mail.log
EOF

echo ""
echo -e "${GREEN}[4/5] Verificando configuração...${NC}"
postfix check

echo ""
echo -e "${GREEN}[5/5] Reiniciando Postfix...${NC}"
systemctl restart postfix
systemctl enable postfix

# Verificar status
if systemctl is-active --quiet postfix; then
    echo -e "${GREEN}✓ Postfix está rodando${NC}"
else
    echo -e "${RED}✗ Erro ao iniciar Postfix${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Configuração concluída!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}⚠️  LIMITAÇÕES:${NC}"
echo "  • Apenas emails locais funcionam"
echo "  • Emails externos vão para SPAM ou são bloqueados"
echo "  • Não pode configurar SPF/DKIM/DMARC"
echo ""
echo -e "${BLUE}Configuração no Sistema:${NC}"
echo "  1. Acesse: http://seu-ip:3000/dashboard/configuracoes/email"
echo "  2. Configure:"
echo "     Host: localhost"
echo "     Porta: 25"
echo "     Secure: false"
echo "     Usuário: (deixe vazio)"
echo "     Senha: (deixe vazio)"
echo "     Email From: noreply@localhost"
echo ""
echo -e "${BLUE}Teste local:${NC}"
echo "  echo 'Teste' | mail -s 'Teste' root"
echo "  sudo mail  # para ver o email"
echo ""
echo -e "${YELLOW}💡 RECOMENDAÇÃO: Use Mailtrap para desenvolvimento!${NC}"
echo -e "${YELLOW}   É gratuito e muito mais confiável.${NC}"
echo ""



