#!/bin/bash

echo "🚀 Configurando Sistema para Produção - Servidor 72.60.60.118:3000"
echo "================================================================"

# 1. Configurar variáveis de ambiente do frontend
echo "📝 Criando .env.local no frontend..."
cat > .env << 'EOF'
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

# Configurações da API - SERVIDOR PRODUÇÃO
NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3000/api
NEXT_PUBLIC_API_URL=http://72.60.60.118:3000
EOF

# 2. Configurar variáveis de ambiente do backend
echo "📝 Criando .env no backend..."
cat > .env << 'EOF'
SUPABASE_URL=https://mghdktkoejobsmdbvssl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1naGRrdGtvZWpvYnNtZGJ2c3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDYzODcsImV4cCI6MjA3MjcyMjM4N30.9XpjiPOnY2BzulrpH6Cw3ZubTSbZ2NH5BH45tarXelA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1naGRrdGtvZWpvYnNtZGJ2c3NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE0NjM4NywiZXhwIjoyMDcyNzIyMzg3fQ.TRHWGt3VsPHiEFiP8ce_H7om1C2nZri7WHoQ0lFuWsg
NODE_ENV=production
PORT=3000

# ========================================
# CONFIGURAÇÕES DE EMAIL
# ========================================
# ⚠️ NÃO coloque credenciais SMTP aqui! Use o painel admin em /dashboard/configuracoes/email

# URLs do Sistema - SERVIDOR PRODUÇÃO
FRONTEND_URL=http://72.60.60.118:3000

# Remetente Padrão (pode ser alterado no painel admin)
EMAIL_FROM_DEFAULT=noreply@sistema-gruas.com
EMAIL_FROM_NAME_DEFAULT=Sistema de Gerenciamento de Gruas

# Segurança e Expiração
# Chave AES-256 para criptografar credenciais SMTP no banco (GERE UMA CHAVE ÚNICA!)
# Para gerar: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
EMAIL_ENCRYPTION_KEY=change-this-to-a-random-32-char-key-123456789012

# Tempo de expiração do token de redefinição de senha (1 hora = 3600000 ms)
PASSWORD_RESET_TOKEN_EXPIRY=3600000

# Opções de Email
EMAIL_ENABLED=true
EMAIL_RETRY_ATTEMPTS=3
EOF

echo "✅ Arquivos .env criados com sucesso!"
echo ""
echo "📋 Próximos passos no servidor:"
echo "1. Execute: npm run build"
echo "2. Execute: pm2 restart all"
echo "3. Teste o login em: http://72.60.60.118:3000"
echo ""
echo "🔧 Para verificar se está funcionando:"
echo "- Frontend: http://72.60.60.118:3000"
echo "- Backend: http://72.60.60.118:3000/api"
echo "- Teste CORS: http://72.60.60.118:3000/test-cors"
echo "- Documentação: http://72.60.60.118:3000/api-docs"
echo ""
echo "⚠️  IMPORTANTE: A URL da API está FIXADA em http://72.60.60.118:3000"
echo "   no arquivo lib/api.ts - não depende mais de variáveis de ambiente"