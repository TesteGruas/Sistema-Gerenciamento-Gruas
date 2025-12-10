#!/bin/bash

# Script para corrigir erros de MIME type em produção
# Uso: ./scripts/fix-mime-production.sh

set -e

echo "🔧 Corrigindo erros de MIME type em produção..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Parar PM2
echo -e "${YELLOW}1. Parando PM2...${NC}"
pm2 stop all || true
pm2 delete all || true
pkill -f "next" || true
pkill -f node || true
sleep 2

# 2. Limpar processos na porta 3000
echo -e "${YELLOW}2. Limpando porta 3000...${NC}"
fuser -k 3000/tcp 2>/dev/null || true
sleep 1

# 3. Limpar cache
echo -e "${YELLOW}3. Limpando cache...${NC}"
rm -rf .next
rm -rf node_modules/.cache 2>/dev/null || true
echo -e "${GREEN}✅ Cache limpo${NC}"

# 4. Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: package.json não encontrado. Execute este script do diretório raiz do projeto.${NC}"
    exit 1
fi

# 5. Build com NODE_ENV=production
echo -e "${YELLOW}4. Fazendo build de produção...${NC}"
export NODE_ENV=production
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build concluído${NC}"
else
    echo -e "${RED}❌ Erro no build${NC}"
    exit 1
fi

# 6. Verificar se os arquivos estáticos existem
echo -e "${YELLOW}5. Verificando arquivos estáticos...${NC}"
if [ -d ".next/static" ]; then
    echo -e "${GREEN}✅ Diretório .next/static existe${NC}"
    ls -la .next/static/ | head -5
else
    echo -e "${RED}❌ Diretório .next/static não encontrado!${NC}"
    exit 1
fi

# 7. Verificar se está em modo standalone
if [ -d ".next/standalone" ]; then
    echo -e "${YELLOW}⚠️  Modo standalone detectado${NC}"
    echo -e "${YELLOW}   Os arquivos estáticos devem estar em .next/standalone/.next/static${NC}"
fi

# 8. Iniciar com PM2
echo -e "${YELLOW}6. Iniciando com PM2...${NC}"
cd /home/Sistema-Gerenciamento-Gruas

# Criar arquivo de configuração PM2 temporário
cat > /tmp/pm2-front.json << EOF
{
  "name": "front",
  "script": "npm",
  "args": "start",
  "cwd": "/home/Sistema-Gerenciamento-Gruas",
  "env": {
    "NODE_ENV": "production",
    "PORT": "3000"
  },
  "error_file": "/root/.pm2/logs/front-error.log",
  "out_file": "/root/.pm2/logs/front-out.log",
  "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
  "merge_logs": true,
  "autorestart": true,
  "max_restarts": 10,
  "min_uptime": "10s"
}
EOF

pm2 start /tmp/pm2-front.json
pm2 save

# 9. Aguardar e verificar
echo -e "${YELLOW}7. Aguardando servidor iniciar...${NC}"
sleep 5

# 10. Testar
echo -e "${YELLOW}8. Testando servidor...${NC}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/_next/static/css/ 2>/dev/null || echo "000")
if [ "$STATUS" != "000" ]; then
    echo -e "${GREEN}✅ Servidor respondendo (status: $STATUS)${NC}"
else
    echo -e "${RED}❌ Servidor não está respondendo${NC}"
    pm2 logs front --lines 20
    exit 1
fi

# 11. Verificar logs
echo ""
echo -e "${GREEN}✅ Processo concluído!${NC}"
echo ""
echo "Verificando logs..."
pm2 logs front --lines 10 --nostream

echo ""
echo "Próximos passos:"
echo "1. Verifique os logs: pm2 logs front"
echo "2. Teste no navegador: http://72.60.60.118:3000"
echo "3. Limpe o cache do navegador (Ctrl+Shift+R)"
