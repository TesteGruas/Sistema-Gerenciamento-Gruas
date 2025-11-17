#!/bin/bash

# Script para limpar cache do Next.js e resolver problemas de ChunkLoadError

echo "🧹 Limpando cache do Next.js..."

# Remover diretório .next
if [ -d ".next" ]; then
  rm -rf .next
  echo "✅ Diretório .next removido"
fi

# Remover node_modules/.cache se existir
if [ -d "node_modules/.cache" ]; then
  rm -rf node_modules/.cache
  echo "✅ Cache do node_modules removido"
fi

# Limpar cache do npm/yarn
if [ -d ".npm" ]; then
  rm -rf .npm
  echo "✅ Cache do npm removido"
fi

echo ""
echo "✨ Cache limpo com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "1. Reinicie o servidor de desenvolvimento: npm run dev"
echo "2. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)"
echo "3. Se o problema persistir, tente fazer um hard refresh (Ctrl+F5)"

