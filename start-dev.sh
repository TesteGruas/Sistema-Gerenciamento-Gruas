#!/bin/bash

echo "🚀 Iniciando servidor Next.js para acesso externo..."
echo "📱 Acesse pelo celular: http://192.168.1.15:3000"
echo "💻 Acesse pelo computador: http://localhost:3000"
echo ""

# Iniciar o servidor Next.js com configurações para acesso externo
HOSTNAME=0.0.0.0 PORT=3000 npm run dev

