#!/bin/bash

echo "🔧 Corrigindo variáveis de ambiente do PWA..."

# Criar arquivo .env.local se não existir
if [ ! -f ".env.local" ]; then
    echo "📝 Criando arquivo .env.local..."
    cat > .env.local << 'EOF'
# Configurações do PWA para servidor 72.60.60.118
NEXT_PUBLIC_API_URL=http://72.60.60.118:3001
NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3001

# Configurações do Supabase
PUBLIC_SUPABASE_URL=https://mghdktkoejobsmdbvssl.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1naGRrdGtvZWpvYnNtZGJ2c3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDYzODcsImV4cCI6MjA3MjcyMjM4N30.9XpjiPOnY2BzulrpH6Cw3ZubTSbZ2NH5BH45tarXelA

# Configurações do projeto
NODE_ENV=production
PORT=3000

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
EOF
    echo "✅ Arquivo .env.local criado!"
else
    echo "✅ Arquivo .env.local já existe"
fi

# Verificar se as variáveis estão corretas
echo "🔍 Verificando variáveis de ambiente..."
if grep -q "NEXT_PUBLIC_API_URL=http://72.60.60.118:3001" .env.local; then
    echo "✅ NEXT_PUBLIC_API_URL configurado corretamente"
else
    echo "❌ NEXT_PUBLIC_API_URL não está configurado corretamente"
    echo "   Configurando automaticamente..."
    sed -i '' 's|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://72.60.60.118:3001|g' .env.local
fi

if grep -q "NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3001" .env.local; then
    echo "✅ NEXT_PUBLIC_API_BASE_URL configurado corretamente"
else
    echo "❌ NEXT_PUBLIC_API_BASE_URL não está configurado corretamente"
    echo "   Configurando automaticamente..."
    sed -i '' 's|NEXT_PUBLIC_API_BASE_URL=.*|NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3001|g' .env.local
fi

echo ""
echo "🎯 Configurações aplicadas:"
echo "   • API URL: http://72.60.60.118:3001"
echo "   • Base URL: http://72.60.60.118:3001"
echo "   • Ambiente: production"
echo ""
echo "🚀 Próximos passos:"
echo "   1. Reinicie o servidor: npm run dev"
echo "   2. Acesse: http://72.60.60.118:3000/pwa"
echo "   3. Verifique o console do navegador"
echo ""
echo "✅ Correção concluída!"