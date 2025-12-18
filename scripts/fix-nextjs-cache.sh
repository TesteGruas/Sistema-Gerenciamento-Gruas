#!/bin/bash

# Script para limpar completamente o cache do Next.js e resolver erros de chunks

echo "🧹 Limpando cache do Next.js..."

# Remover diretório .next
if [ -d ".next" ]; then
  rm -rf .next
  echo "✅ Diretório .next removido"
else
  echo "ℹ️  Diretório .next não existe"
fi

# Remover cache do node_modules
if [ -d "node_modules/.cache" ]; then
  rm -rf node_modules/.cache
  echo "✅ Cache do node_modules removido"
else
  echo "ℹ️  Cache do node_modules não existe"
fi

# Remover arquivos temporários do Next.js
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null

echo ""
echo "✨ Limpeza concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Execute: npm run dev"
echo "   2. Se o erro persistir, tente: npm run build"
echo ""





