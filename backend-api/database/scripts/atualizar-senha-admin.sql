-- =====================================================
-- Script SQL para atualizar senha do usuário admin@admin.com
-- ATENÇÃO: Este script NÃO funciona se você usa Supabase Auth
-- Use apenas se suas senhas são armazenadas diretamente no PostgreSQL
-- =====================================================

-- IMPORTANTE: Se você usa Supabase Auth, as senhas NÃO são armazenadas
-- no PostgreSQL. Use o script Node.js: scripts/atualizar-senha-admin.js

-- Opção 1: Se você usa a tabela 'users' com password_hash (bcrypt)
-- Primeiro, você precisa gerar o hash da senha. Use este comando no Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('teste@123', 10);
-- Depois use o hash gerado no UPDATE abaixo

-- Exemplo (substitua 'HASH_GERADO' pelo hash real):
-- UPDATE users 
-- SET password_hash = 'HASH_GERADO'
-- WHERE email = 'admin@admin.com';

-- Opção 2: Se você usa pgcrypto (extensão do PostgreSQL)
UPDATE users 
SET password_hash = crypt('teste@123', gen_salt('bf')),
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@admin.com';

-- Verificar se a atualização foi bem-sucedida
SELECT id, email, name, updated_at 
FROM users 
WHERE email = 'admin@admin.com';

-- =====================================================
-- NOTA: Se você usa Supabase Auth, execute:
-- node backend-api/scripts/atualizar-senha-admin.js
-- =====================================================

