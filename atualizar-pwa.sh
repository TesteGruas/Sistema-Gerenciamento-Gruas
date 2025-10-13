#!/bin/bash

# Script de Atualização Rápida do PWA
# Use este script quando fizer alterações no PWA

echo "🚀 Atualizando PWA..."
echo ""

# 1. Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# 2. Descobrir IP do servidor
echo "📡 Detectando IP do servidor..."
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "   IP: $SERVER_IP"
echo ""

# 3. Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não existe. Criando..."
    cp env.example .env
fi

# 4. Atualizar URL da API no .env
echo "🔧 Atualizando .env com IP correto..."
if grep -q "NEXT_PUBLIC_API_URL" .env; then
    sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://$SERVER_IP:3001|g" .env
else
    echo "NEXT_PUBLIC_API_URL=http://$SERVER_IP:3001" >> .env
fi

echo "   ✅ NEXT_PUBLIC_API_URL=http://$SERVER_IP:3001"
echo ""

# 5. Verificar se backend está rodando
echo "🔍 Verificando backend..."
if pm2 list | grep -q "backend-api.*online"; then
    echo "   ✅ Backend está rodando"
else
    echo "   ⚠️  Backend não está rodando!"
    echo "   Iniciando backend..."
    cd backend-api
    pm2 start npm --name "backend-api" -- start
    cd ..
fi
echo ""

# 6. Build do projeto
echo "🏗️  Fazendo build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro no build!"
    exit 1
fi
echo ""

# 7. Reiniciar serviços
echo "♻️  Reiniciando serviços..."
pm2 restart all
echo ""

# 8. Verificar portas
echo "🔍 Verificando portas..."
PORT_3000=$(netstat -tuln 2>/dev/null | grep ":3000" || lsof -i :3000 2>/dev/null)
PORT_3001=$(netstat -tuln 2>/dev/null | grep ":3001" || lsof -i :3001 2>/dev/null)

if [ -n "$PORT_3000" ]; then
    echo "   ✅ Porta 3000 está aberta (Frontend)"
else
    echo "   ⚠️  Porta 3000 não está aberta"
fi

if [ -n "$PORT_3001" ]; then
    echo "   ✅ Porta 3001 está aberta (Backend)"
else
    echo "   ⚠️  Porta 3001 não está aberta"
fi
echo ""

# 9. Teste rápido de conectividade
echo "🧪 Testando conectividade..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/login | grep -q "40[01]"; then
    echo "   ✅ Backend está respondendo"
else
    echo "   ⚠️  Backend pode não estar respondendo corretamente"
fi
echo ""

# 10. Informações finais
echo "✅ Atualização concluída!"
echo ""
echo "📱 Acesse o PWA em:"
echo "   http://$SERVER_IP:3000/pwa/login"
echo ""
echo "🔧 Página de diagnóstico:"
echo "   http://$SERVER_IP:3000/pwa/test-api"
echo ""
echo "📊 Ver logs:"
echo "   pm2 logs"
echo ""
echo "🔄 Para atualizar novamente:"
echo "   ./atualizar-pwa.sh"
echo ""

