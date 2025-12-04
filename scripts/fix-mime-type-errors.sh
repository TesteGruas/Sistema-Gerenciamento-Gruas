#!/bin/bash

# Script para corrigir erros de MIME type e 404 em arquivos estáticos do Next.js
# Uso: ./scripts/fix-mime-type-errors.sh

echo "🔧 Corrigindo erros de MIME type e arquivos estáticos do Next.js..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Parar o servidor Next.js se estiver rodando
echo -e "${YELLOW}1. Parando servidor Next.js (se estiver rodando)...${NC}"
pkill -f "next dev" || echo "Nenhum servidor Next.js encontrado rodando"
sleep 2

# 2. Limpar cache do Next.js
echo -e "${YELLOW}2. Limpando cache do Next.js...${NC}"
rm -rf .next
echo -e "${GREEN}✅ Cache do Next.js limpo${NC}"

# 3. Limpar cache do node_modules (opcional, mas recomendado)
echo -e "${YELLOW}3. Limpando cache do node_modules...${NC}"
rm -rf node_modules/.cache
echo -e "${GREEN}✅ Cache do node_modules limpo${NC}"

# 4. Limpar cache do navegador (instruções)
echo -e "${YELLOW}4. IMPORTANTE: Limpe o cache do navegador${NC}"
echo -e "   - Chrome/Edge: Cmd+Shift+Delete (Mac) ou Ctrl+Shift+Delete (Windows)"
echo -e "   - Firefox: Cmd+Shift+Delete (Mac) ou Ctrl+Shift+Delete (Windows)"
echo -e "   - Ou use: DevTools > Application > Clear storage > Clear site data"
echo ""

# 5. Rebuild do projeto
echo -e "${YELLOW}5. Reconstruindo o projeto...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build concluído com sucesso${NC}"
else
    echo -e "${RED}❌ Erro no build. Verifique os logs acima.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Processo concluído!${NC}"
echo ""
echo "Próximos passos:"
echo "1. Limpe o cache do navegador (veja instruções acima)"
echo "2. Inicie o servidor: npm run dev"
echo "3. Acesse http://localhost:3000/pwa"
echo "4. Verifique o console do navegador para confirmar que não há mais erros"

