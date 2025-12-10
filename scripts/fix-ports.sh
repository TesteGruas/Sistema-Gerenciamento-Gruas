#!/bin/bash

# Script para corrigir conflito de portas entre backend e frontend
# Uso: ./scripts/fix-ports.sh

set -e

echo "🔧 Corrigindo conflito de portas..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Verificar processos nas portas
echo -e "${YELLOW}1. Verificando processos nas portas 3000 e 3001...${NC}"

PORT_3000=$(lsof -ti :3000 2>/dev/null || echo "")
PORT_3001=$(lsof -ti :3001 2>/dev/null || echo "")

if [ ! -z "$PORT_3000" ]; then
    echo -e "${RED}⚠️  Porta 3000 está em uso pelos processos: $PORT_3000${NC}"
    ps aux | grep -E "($PORT_3000)" | grep -v grep || true
fi

if [ ! -z "$PORT_3001" ]; then
    echo -e "${RED}⚠️  Porta 3001 está em uso pelos processos: $PORT_3001${NC}"
    ps aux | grep -E "($PORT_3001)" | grep -v grep || true
fi

# 2. Parar todos os processos PM2
echo -e "${YELLOW}2. Parando todos os processos PM2...${NC}"
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# 3. Matar processos órfãos
echo -e "${YELLOW}3. Matando processos órfãos...${NC}"
pkill -f "next" 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "node.*backend" 2>/dev/null || true

# 4. Liberar portas
echo -e "${YELLOW}4. Liberando portas...${NC}"
if [ ! -z "$PORT_3000" ]; then
    kill -9 $PORT_3000 2>/dev/null || true
    fuser -k 3000/tcp 2>/dev/null || true
fi

if [ ! -z "$PORT_3001" ]; then
    kill -9 $PORT_3001 2>/dev/null || true
    fuser -k 3001/tcp 2>/dev/null || true
fi

sleep 2

# 5. Verificar se as portas estão livres
echo -e "${YELLOW}5. Verificando se as portas estão livres...${NC}"
PORT_3000_CHECK=$(lsof -ti :3000 2>/dev/null || echo "")
PORT_3001_CHECK=$(lsof -ti :3001 2>/dev/null || echo "")

if [ -z "$PORT_3000_CHECK" ]; then
    echo -e "${GREEN}✅ Porta 3000 está livre${NC}"
else
    echo -e "${RED}❌ Porta 3000 ainda está em uso!${NC}"
    exit 1
fi

if [ -z "$PORT_3001_CHECK" ]; then
    echo -e "${GREEN}✅ Porta 3001 está livre${NC}"
else
    echo -e "${RED}❌ Porta 3001 ainda está em uso!${NC}"
    exit 1
fi

# 6. Verificar diretórios
cd /home/Sistema-Gerenciamento-Gruas

if [ ! -d "backend-api" ]; then
    echo -e "${RED}❌ Diretório backend-api não encontrado!${NC}"
    exit 1
fi

# 7. Iniciar Backend na porta 3001
echo -e "${YELLOW}6. Iniciando Backend na porta 3001...${NC}"
cd backend-api

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado, usando .env.example${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
    fi
fi

# Garantir que PORT=3001 está no .env
if ! grep -q "^PORT=3001" .env 2>/dev/null; then
    echo "PORT=3001" >> .env
    echo -e "${GREEN}✅ PORT=3001 adicionado ao .env${NC}"
fi

# Iniciar backend
pm2 start npm --name "backend" --cwd "$(pwd)" -- start --update-env
echo -e "${GREEN}✅ Backend iniciado${NC}"

# 8. Iniciar Frontend na porta 3000
echo -e "${YELLOW}7. Iniciando Frontend na porta 3000...${NC}"
cd ..

# Verificar se .env existe
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado no frontend${NC}"
fi

# Garantir que PORT=3000 está definido (Next.js usa 3000 por padrão, mas vamos garantir)
export PORT=3000
export NODE_ENV=production

# Iniciar frontend
pm2 start npm --name "front" --cwd "$(pwd)" -- start --update-env
echo -e "${GREEN}✅ Frontend iniciado${NC}"

# 9. Salvar configuração PM2
pm2 save

# 10. Aguardar e verificar
echo -e "${YELLOW}8. Aguardando servidores iniciarem...${NC}"
sleep 5

# 11. Verificar status
echo -e "${YELLOW}9. Verificando status...${NC}"
pm2 status

# 12. Verificar portas
echo -e "${YELLOW}10. Verificando portas...${NC}"
BACKEND_PORT=$(lsof -ti :3001 2>/dev/null || echo "")
FRONTEND_PORT=$(lsof -ti :3000 2>/dev/null || echo "")

if [ ! -z "$BACKEND_PORT" ]; then
    echo -e "${GREEN}✅ Backend rodando na porta 3001 (PID: $BACKEND_PORT)${NC}"
else
    echo -e "${RED}❌ Backend não está rodando na porta 3001!${NC}"
    pm2 logs backend --lines 20
fi

if [ ! -z "$FRONTEND_PORT" ]; then
    echo -e "${GREEN}✅ Frontend rodando na porta 3000 (PID: $FRONTEND_PORT)${NC}"
else
    echo -e "${RED}❌ Frontend não está rodando na porta 3000!${NC}"
    pm2 logs front --lines 20
fi

# 13. Testar conexões
echo -e "${YELLOW}11. Testando conexões...${NC}"

BACKEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")
FRONTEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")

if [ "$BACKEND_TEST" != "000" ]; then
    echo -e "${GREEN}✅ Backend respondendo (status: $BACKEND_TEST)${NC}"
else
    echo -e "${RED}❌ Backend não está respondendo${NC}"
fi

if [ "$FRONTEND_TEST" != "000" ]; then
    echo -e "${GREEN}✅ Frontend respondendo (status: $FRONTEND_TEST)${NC}"
else
    echo -e "${RED}❌ Frontend não está respondendo${NC}"
fi

echo ""
echo -e "${GREEN}✅ Processo concluído!${NC}"
echo ""
echo "Verificações:"
echo "  - Backend: http://72.60.60.118:3001/health"
echo "  - Frontend: http://72.60.60.118:3000"
echo ""
echo "Logs:"
echo "  - pm2 logs backend"
echo "  - pm2 logs front"
echo "  - pm2 monit"
