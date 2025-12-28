#!/bin/bash

echo "=========================================="
echo "🔍 DEBUG: Verificando configuração da API"
echo "=========================================="
echo ""

echo "1. Verificando variáveis de ambiente do PM2:"
pm2 describe gruas-frontend | grep -A 20 "env:" || echo "❌ Não encontrado"
echo ""

echo "2. Verificando arquivo .env:"
if [ -f .env ]; then
    echo "✅ Arquivo .env existe"
    grep NEXT_PUBLIC_API_URL .env || echo "⚠️ NEXT_PUBLIC_API_URL não encontrado no .env"
else
    echo "❌ Arquivo .env não existe"
fi
echo ""

echo "3. Verificando arquivo .env.production:"
if [ -f .env.production ]; then
    echo "✅ Arquivo .env.production existe"
    grep NEXT_PUBLIC_API_URL .env.production || echo "⚠️ NEXT_PUBLIC_API_URL não encontrado no .env.production"
else
    echo "❌ Arquivo .env.production não existe"
fi
echo ""

echo "4. Verificando processo Next.js:"
ps aux | grep "node.*standalone" | grep -v grep || echo "❌ Processo não encontrado"
echo ""

echo "5. Testando URL da API:"
echo "   Tentando: http://72.60.60.118:3001/api/auth/login"
curl -s -o /dev/null -w "   Status: %{http_code}\n" -X POST http://72.60.60.118:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}' || echo "   ❌ Erro ao conectar"
echo ""

echo "6. Verificando rewrite do Next.js (arquivo compilado):"
if [ -f .next/standalone/server.js ]; then
    echo "✅ Arquivo standalone existe"
    grep -o "72.60.60.118:[0-9]*" .next/standalone/server.js | head -5 || echo "⚠️ IP não encontrado no código compilado"
else
    echo "❌ Arquivo standalone não existe"
fi
echo ""

echo "=========================================="
echo "✅ Debug completo"
echo "=========================================="

