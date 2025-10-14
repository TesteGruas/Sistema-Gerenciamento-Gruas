#!/bin/bash

echo "=== CONFIGURAÇÃO DO SERVIDOR ==="
echo "Criando arquivo .env no servidor..."

# Criar arquivo .env para o servidor
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

# Configurações da API - URL DO SERVIDOR
NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3000/api
NEXT_PUBLIC_API_URL=http://72.60.60.118:3000
EOF

echo "✅ Arquivo .env criado com sucesso!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Copie este arquivo .env para o servidor"
echo "2. Ajuste as variáveis JWT_SECRET e ENCRYPTION_KEY com valores seguros"
echo "3. Configure as credenciais de e-mail se necessário"
echo "4. Reinicie o servidor para aplicar as mudanças"
echo ""
echo "🔧 COMANDOS PARA O SERVIDOR:"
echo "sudo nano .env  # Para editar o arquivo"
echo "sudo systemctl restart seu-servico  # Para reiniciar o serviço"
