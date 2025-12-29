#!/bin/bash

# Script para corrigir erro de build do Next.js na VPS
# Erro: Cannot find module '../server/node-polyfill-crypto'

echo "🔍 Diagnosticando problema de build do Next.js..."
echo ""

# Verificar versão do Node.js
echo "📦 Versão do Node.js:"
node --version
echo ""

# Verificar versão do npm
echo "📦 Versão do npm:"
npm --version
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado. Execute este script no diretório raiz do projeto."
    exit 1
fi

echo "🧹 Limpando cache e node_modules..."
echo ""

# Limpar cache do npm
npm cache clean --force

# Remover node_modules e lock files
rm -rf node_modules
rm -rf package-lock.json
rm -rf .next

echo "✅ Limpeza concluída!"
echo ""

# Verificar se há espaço em disco
echo "💾 Verificando espaço em disco:"
df -h
echo ""

# Reinstalar dependências
echo "📥 Reinstalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências!"
    exit 1
fi

echo "✅ Dependências instaladas!"
echo ""

# Verificar se o módulo problemático existe
echo "🔍 Verificando módulo node-polyfill-crypto..."
if [ -f "node_modules/next/dist/server/node-polyfill-crypto.js" ]; then
    echo "✅ Módulo encontrado!"
else
    echo "⚠️  Módulo não encontrado. Tentando reinstalar Next.js especificamente..."
    npm install next@15.2.4 --force
fi

echo ""
echo "🚀 Tentando build novamente..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build concluído com sucesso!"
else
    echo ""
    echo "❌ Build ainda falhou. Verifique os erros acima."
    echo ""
    echo "💡 Soluções alternativas:"
    echo "1. Verifique se a versão do Node.js é compatível (recomendado: Node.js 18.x ou 20.x)"
    echo "2. Tente atualizar o Next.js: npm install next@latest"
    echo "3. Verifique se há espaço suficiente em disco"
    exit 1
fi







