#!/bin/bash

# Script para verificar servidor usando IP específico
# Uso: ./verificar-servidor-ip.sh [IP]

SERVER_IP=${1:-72.60.60.118}
PORT=${PORT:-3001}
API_URL="http://${SERVER_IP}:${PORT}"

echo "🔍 Verificando servidor em ${API_URL}..."
echo ""

# Verificar se o servidor responde
if command -v curl &> /dev/null; then
    echo "1️⃣ Testando health check..."
    RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/health" 2>&1)
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Servidor está RODANDO"
        echo ""
        echo "   Resposta:"
        echo "$BODY" | head -5
        echo ""
    else
        echo "❌ Servidor não está respondendo (HTTP $HTTP_CODE)"
        echo "   Tentou: ${API_URL}/health"
    fi
else
    echo "⚠️  curl não encontrado"
fi

# Verificar processo
echo ""
echo "2️⃣ Verificando processos na porta ${PORT}..."
if command -v lsof &> /dev/null; then
    PID=$(lsof -ti:${PORT} 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "✅ Processo encontrado (PID: $PID)"
    else
        echo "❌ Nenhum processo na porta ${PORT}"
    fi
fi

# Informações
echo ""
echo "3️⃣ Informações:"
echo "   IP do servidor: ${SERVER_IP}"
echo "   Porta: ${PORT}"
echo "   URL completa: ${API_URL}"
echo ""
echo "💡 Para testar manualmente:"
echo "   curl ${API_URL}/health"
