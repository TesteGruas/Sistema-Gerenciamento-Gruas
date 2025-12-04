# 🔍 Validar e Corrigir Login de Supervisor

## 📧 Dados do Usuário
- **Email**: samuellinkon+validacaosupervisor@gmail.com
- **Senha**: f2XrQHK2mp0I

## ⚠️ Problema
O usuário está recebendo erro de "não autorizado" ao tentar fazer login como supervisor.

## 🔍 Causa Provável
O sistema verifica se o usuário possui um **perfil ativo** na tabela `usuario_perfis` com:
- Status: `'Ativa'`
- Perfil: `'Supervisores'` (nome exato, não "Supervisor")

Se o usuário não tiver um perfil ativo atribuído, o sistema retorna erro de autorização.

## ✅ Solução: Executar Script SQL

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o **Supabase Dashboard** → Seu projeto → **SQL Editor**
2. Copie o conteúdo completo do arquivo:
   ```
   backend-api/database/migrations/20250226_fix_supervisor_perfil.sql
   ```
3. Cole no SQL Editor e execute (botão "Run")
4. Verifique os resultados:
   - O script mostra informações do usuário
   - Verifica se o perfil "Supervisores" existe
   - Mostra o perfil atual do usuário
   - Corrige automaticamente atribuindo o perfil correto
   - Mostra o resultado final

### Opção 2: Executar SQL Diretamente

Execute este SQL no seu banco de dados:

```sql
-- 1. Verificar usuário
SELECT id, email, nome, status
FROM usuarios
WHERE email = 'samuellinkon+validacaosupervisor@gmail.com';

-- 2. Verificar se perfil "Supervisores" existe
SELECT id, nome, nivel_acesso, status
FROM perfis
WHERE nome = 'Supervisores';

-- 3. Verificar perfil atual do usuário
SELECT 
    up.id,
    up.status as status_atribuicao,
    p.nome as perfil_nome,
    u.email
FROM usuario_perfis up
INNER JOIN perfis p ON up.perfil_id = p.id
INNER JOIN usuarios u ON up.usuario_id = u.id
WHERE u.email = 'samuellinkon+validacaosupervisor@gmail.com';

-- 4. CORRIGIR: Atribuir perfil "Supervisores"
DO $$
DECLARE
    v_usuario_id INTEGER;
    v_perfil_id INTEGER;
BEGIN
    -- Buscar ID do usuário
    SELECT id INTO v_usuario_id
    FROM usuarios
    WHERE email = 'samuellinkon+validacaosupervisor@gmail.com';
    
    -- Buscar ID do perfil "Supervisores"
    SELECT id INTO v_perfil_id
    FROM perfis
    WHERE nome = 'Supervisores' AND status = 'Ativo';
    
    -- Se não encontrar, criar o perfil
    IF v_perfil_id IS NULL THEN
        INSERT INTO perfis (nome, descricao, nivel_acesso, status)
        VALUES ('Supervisores', 'Supervisão operacional', 6, 'Ativo')
        RETURNING id INTO v_perfil_id;
    END IF;
    
    -- Desativar perfis antigos
    UPDATE usuario_perfis
    SET status = 'Inativa', updated_at = NOW()
    WHERE usuario_id = v_usuario_id AND status = 'Ativa';
    
    -- Atribuir perfil "Supervisores"
    INSERT INTO usuario_perfis (
        usuario_id, perfil_id, data_atribuicao, status, created_at, updated_at
    )
    VALUES (
        v_usuario_id, v_perfil_id, NOW(), 'Ativa', NOW(), NOW()
    )
    ON CONFLICT (usuario_id, perfil_id) 
    DO UPDATE SET 
        status = 'Ativa',
        data_atribuicao = NOW(),
        updated_at = NOW();
END $$;

-- 5. Verificar resultado
SELECT 
    up.status as status_atribuicao,
    p.nome as perfil_nome,
    u.email
FROM usuario_perfis up
INNER JOIN perfis p ON up.perfil_id = p.id
INNER JOIN usuarios u ON up.usuario_id = u.id
WHERE u.email = 'samuellinkon+validacaosupervisor@gmail.com'
  AND up.status = 'Ativa';
```

## ✅ Verificação Pós-Correção

Após executar o script, verifique:

1. **Usuário existe e está ativo**:
   ```sql
   SELECT id, email, nome, status
   FROM usuarios
   WHERE email = 'samuellinkon+validacaosupervisor@gmail.com';
   ```
   - Deve retornar o usuário com `status = 'Ativo'`

2. **Perfil "Supervisores" está atribuído**:
   ```sql
   SELECT p.nome, up.status
   FROM usuario_perfis up
   INNER JOIN perfis p ON up.perfil_id = p.id
   INNER JOIN usuarios u ON up.usuario_id = u.id
   WHERE u.email = 'samuellinkon+validacaosupervisor@gmail.com'
     AND up.status = 'Ativa';
   ```
   - Deve retornar `perfil_nome = 'Supervisores'` e `status = 'Ativa'`

3. **Testar login**:
   - Email: `samuellinkon+validacaosupervisor@gmail.com`
   - Senha: `f2XrQHK2mp0I`
   - Deve fazer login com sucesso e ter acesso ao sistema

## 🔧 Troubleshooting

### Se o perfil "Supervisores" não existir:

Execute este SQL para criar o perfil:

```sql
INSERT INTO perfis (nome, descricao, nivel_acesso, status)
VALUES (
    'Supervisores',
    'Supervisão operacional - Gruas, Obras, Clientes, Contratos, Funcionários, Documentos, Livro Grua, Estoque',
    6,
    'Ativo'
)
ON CONFLICT DO NOTHING;
```

### Se o usuário não existir na tabela `usuarios`:

O usuário precisa estar cadastrado na tabela `usuarios`. Se ele existe no Supabase Auth mas não na tabela `usuarios`, você precisa:

1. Criar o registro na tabela `usuarios` com o mesmo email
2. Ou verificar se há um processo de sincronização que deveria criar automaticamente

### Se ainda não funcionar:

1. Verifique os logs do backend ao tentar fazer login
2. Verifique se o token JWT está sendo gerado corretamente
3. Verifique se o middleware de autenticação está funcionando
4. Verifique se há alguma validação adicional bloqueando o acesso

## 📝 Notas

- O nome do perfil deve ser exatamente **"Supervisores"** (plural)
- O status da atribuição deve ser **"Ativa"** (não "Ativo")
- O usuário deve existir na tabela `usuarios` com `status = 'Ativo'`
- O perfil deve existir na tabela `perfis` com `status = 'Ativo'`

## 🔄 Após Corrigir

1. **Reiniciar o servidor backend** (se estiver rodando):
   ```bash
   cd backend-api
   # Parar o servidor (Ctrl+C) e reiniciar
   npm start
   ```

2. **Testar login novamente** no app

3. **Verificar permissões**: O supervisor deve ter acesso a:
   - Dashboard (visualização)
   - Gruas (todas as operações)
   - Obras (todas as operações)
   - Clientes (todas as operações)
   - Contratos (todas as operações)
   - Funcionários (todas as operações)
   - Documentos (todas as operações)
   - Livro de Gruas (todas as operações)
   - Estoque (todas as operações)
   - Justificativas (aprovação)
   - Notificações (visualização e gerenciamento)

