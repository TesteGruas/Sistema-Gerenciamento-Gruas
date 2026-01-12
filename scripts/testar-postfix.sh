#!/bin/bash

# ============================================
# Script de Teste Postfix
# ============================================
# Testa se o Postfix está configurado corretamente
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Teste de Configuração Postfix${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}Alguns testes requerem privilégios de root${NC}"
    SUDO=""
else
    SUDO=""
fi

# Teste 1: Verificar se Postfix está instalado
echo -e "${YELLOW}[1/7] Verificando instalação do Postfix...${NC}"
if command -v postfix &> /dev/null; then
    echo -e "${GREEN}✓ Postfix está instalado${NC}"
    postfix version | head -1
else
    echo -e "${RED}✗ Postfix não está instalado${NC}"
    exit 1
fi

# Teste 2: Verificar status do serviço
echo ""
echo -e "${YELLOW}[2/7] Verificando status do serviço...${NC}"
if systemctl is-active --quiet postfix; then
    echo -e "${GREEN}✓ Postfix está rodando${NC}"
else
    echo -e "${RED}✗ Postfix não está rodando${NC}"
    echo "  Execute: sudo systemctl start postfix"
    exit 1
fi

# Teste 3: Verificar configuração
echo ""
echo -e "${YELLOW}[3/7] Verificando configuração...${NC}"
if $SUDO postfix check 2>&1; then
    echo -e "${GREEN}✓ Configuração do Postfix está correta${NC}"
else
    echo -e "${RED}✗ Erro na configuração do Postfix${NC}"
    exit 1
fi

# Teste 4: Verificar portas
echo ""
echo -e "${YELLOW}[4/7] Verificando portas SMTP...${NC}"

check_port() {
    local port=$1
    if netstat -tlnp 2>/dev/null | grep -q ":$port " || ss -tlnp 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}✓ Porta $port está aberta${NC}"
        return 0
    else
        echo -e "${RED}✗ Porta $port não está aberta${NC}"
        return 1
    fi
}

PORTS_OK=true
check_port 25 || PORTS_OK=false
check_port 587 || PORTS_OK=false
check_port 465 || PORTS_OK=false

if [ "$PORTS_OK" = false ]; then
    echo -e "${YELLOW}  Dica: Verifique se as portas estão configuradas no master.cf${NC}"
fi

# Teste 5: Verificar hostname
echo ""
echo -e "${YELLOW}[5/7] Verificando hostname...${NC}"
HOSTNAME=$(postconf -h myhostname)
DOMAIN=$(postconf -h mydomain)
echo "  Hostname: $HOSTNAME"
echo "  Domínio: $DOMAIN"

if [ -z "$HOSTNAME" ] || [ "$HOSTNAME" = "localhost" ]; then
    echo -e "${YELLOW}⚠  Hostname não configurado corretamente${NC}"
else
    echo -e "${GREEN}✓ Hostname configurado${NC}"
fi

# Teste 6: Verificar SASL
echo ""
echo -e "${YELLOW}[6/7] Verificando autenticação SASL...${NC}"
if [ -f /etc/sasl2/sasldb2 ]; then
    echo -e "${GREEN}✓ Banco de dados SASL encontrado${NC}"
    if [ "$EUID" -eq 0 ]; then
        echo "  Usuários configurados:"
        sasldblistusers2 2>/dev/null | sed 's/^/    /' || echo "    (nenhum usuário encontrado)"
    else
        echo -e "${YELLOW}  Execute como root para ver usuários SASL${NC}"
    fi
else
    echo -e "${RED}✗ Banco de dados SASL não encontrado${NC}"
    echo "  Execute: sudo saslpasswd2 -c -u \$(postconf -h myhostname) usuario"
fi

# Teste 7: Testar conexão SMTP
echo ""
echo -e "${YELLOW}[7/7] Testando conexão SMTP...${NC}"
if command -v telnet &> /dev/null; then
    echo "  Testando porta 25..."
    if echo "QUIT" | timeout 2 telnet localhost 25 2>/dev/null | grep -q "220"; then
        echo -e "${GREEN}✓ Conexão SMTP funcionando na porta 25${NC}"
    else
        echo -e "${RED}✗ Não foi possível conectar na porta 25${NC}"
    fi
else
    echo -e "${YELLOW}  telnet não instalado, pulando teste de conexão${NC}"
    echo "  Instale com: sudo apt install telnet"
fi

# Resumo
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Resumo dos Testes${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Para testar envio de email:"
echo ""
echo "1. Teste básico:"
echo "   echo 'Teste' | mail -s 'Teste' seu-email@gmail.com"
echo ""
echo "2. Teste com swaks (instale com: sudo apt install swaks):"
echo "   swaks --to seu-email@gmail.com \\"
echo "     --from noreply@$DOMAIN \\"
echo "     --server localhost \\"
echo "     --port 587 \\"
echo "     --auth LOGIN \\"
echo "     --auth-user [usuario] \\"
echo "     --auth-password [senha] \\"
echo "     --tls"
echo ""
echo "3. Verificar logs:"
echo "   sudo tail -f /var/log/mail.log"
echo ""
echo -e "${YELLOW}⚠️  Lembre-se de configurar SPF no DNS para evitar spam!${NC}"
echo ""





