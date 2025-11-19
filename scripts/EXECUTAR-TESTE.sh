#!/bin/bash

# Script para executar teste de APIs
# Credenciais: admin@admin.com / teste@123

echo "🚀 Iniciando teste de APIs..."
echo "📧 Email: admin@admin.com"
echo "🔗 API: http://localhost:3001"
echo ""

# Verificar se o backend está rodando
if ! curl -s http://localhost:3001/api/auth/login > /dev/null 2>&1; then
    echo "❌ ERRO: Backend não está rodando em http://localhost:3001"
    echo "   Execute: cd backend-api && npm run dev"
    exit 1
fi

# Executar o script de teste
node scripts/test-all-apis.js

