#!/bin/bash

# Script para corrigir configurações do PWA
echo "🔧 Corrigindo configurações do PWA..."

# Criar arquivo .env.local se não existir
if [ ! -f ".env.local" ]; then
    echo "📝 Criando arquivo .env.local..."
    cat > .env.local << 'EOF'
# Configurações do Supabase
PUBLIC_SUPABASE_URL=https://mghdktkoejobsmdbvssl.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1naGRrdGtvZWpvYnNtZGJ2c3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDYzODcsImV4cCI6MjA3MjcyMjM4N30.9XpjiPOnY2BzulrpH6Cw3ZubTSbZ2NH5BH45tarXelA

# Configurações do projeto
NODE_ENV=development
PORT=3001

# Configurações de segurança
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here

# Configurações de e-mail (para notificações)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Configurações de backup
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30

# Configurações da API - IMPORTANTE: Use o IP correto do servidor
NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3001/api
NEXT_PUBLIC_API_URL=http://72.60.60.118:3001
EOF
    echo "✅ Arquivo .env.local criado"
else
    echo "📝 Atualizando arquivo .env.local..."
    # Atualizar NEXT_PUBLIC_API_URL se existir
    if grep -q "NEXT_PUBLIC_API_URL" .env.local; then
        sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://72.60.60.118:3001|g" .env.local
    else
        echo "NEXT_PUBLIC_API_URL=http://72.60.60.118:3001" >> .env.local
    fi
    
    # Atualizar NEXT_PUBLIC_API_BASE_URL se existir
    if grep -q "NEXT_PUBLIC_API_BASE_URL" .env.local; then
        sed -i "s|NEXT_PUBLIC_API_BASE_URL=.*|NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3001/api|g" .env.local
    else
        echo "NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3001/api" >> .env.local
    fi
    echo "✅ Arquivo .env.local atualizado"
fi

echo ""
echo "🔍 Verificando configurações..."
echo "   ✅ NEXT_PUBLIC_API_URL=http://72.60.60.118:3001"
echo "   ✅ NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3001/api"

echo ""
echo "🚀 Para aplicar as mudanças, reinicie o servidor de desenvolvimento:"
echo "   npm run dev"
echo ""
echo "📱 Teste o PWA acessando: http://72.60.60.118:3000/pwa"
echo ""
echo "🔧 Se ainda houver problemas, verifique:"
echo "   1. Se o backend está rodando em http://72.60.60.118:3001"
echo "   2. Se as rotas da API estão funcionando"
echo "   3. Se há erros no console do navegador"
