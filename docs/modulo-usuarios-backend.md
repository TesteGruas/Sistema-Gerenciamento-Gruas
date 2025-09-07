# Documentação - Módulo de Usuários - Backend

## Visão Geral

Este documento descreve as entidades/models e relacionamentos necessários para implementar o backend do módulo de usuários do sistema de gerenciamento. O módulo permite o controle de acesso, autenticação, autorização e gerenciamento de usuários do sistema.

## Entidades Principais

### 1. Usuário (User)

**Tabela: `usuarios`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `nome` | VARCHAR(255) | Nome completo do usuário | NOT NULL |
| `email` | VARCHAR(255) | E-mail do usuário | NOT NULL, UNIQUE |
| `cpf` | VARCHAR(14) | CPF do usuário | UNIQUE, NULL |
| `telefone` | VARCHAR(20) | Telefone de contato | NULL |
| `data_nascimento` | DATE | Data de nascimento | NULL |
| `endereco` | VARCHAR(255) | Endereço residencial | NULL |
| `cidade` | VARCHAR(100) | Cidade | NULL |
| `estado` | VARCHAR(2) | Estado (UF) | NULL |
| `cep` | VARCHAR(10) | CEP | NULL |
| `foto_perfil` | VARCHAR(255) | Caminho da foto de perfil | NULL |
| `status` | ENUM | Status do usuário | DEFAULT 'Ativo', valores: 'Ativo', 'Inativo', 'Bloqueado', 'Pendente' |
| `ultimo_acesso` | TIMESTAMP | Data do último acesso | NULL |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 2. Credencial (Credential)

**Tabela: `credenciais`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `usuario_id` | INT | ID do usuário | FK, NOT NULL, UNIQUE |
| `username` | VARCHAR(50) | Nome de usuário | NOT NULL, UNIQUE |
| `password_hash` | VARCHAR(255) | Hash da senha | NOT NULL |
| `salt` | VARCHAR(255) | Salt para hash da senha | NOT NULL |
| `tentativas_login` | INT | Número de tentativas de login | DEFAULT 0 |
| `ultimo_login` | TIMESTAMP | Data do último login | NULL |
| `bloqueado_ate` | TIMESTAMP | Data até quando está bloqueado | NULL |
| `reset_token` | VARCHAR(255) | Token para reset de senha | NULL |
| `reset_token_expires` | TIMESTAMP | Expiração do token de reset | NULL |
| `email_verificado` | BOOLEAN | E-mail verificado | DEFAULT FALSE |
| `verification_token` | VARCHAR(255) | Token de verificação de e-mail | NULL |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 3. Perfil (Profile)

**Tabela: `perfis`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `nome` | VARCHAR(100) | Nome do perfil | NOT NULL, UNIQUE |
| `descricao` | TEXT | Descrição do perfil | NULL |
| `nivel_acesso` | INT | Nível de acesso (1-10) | NOT NULL, DEFAULT 1 |
| `status` | ENUM | Status do perfil | DEFAULT 'Ativo', valores: 'Ativo', 'Inativo' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 4. Permissão (Permission)

**Tabela: `permissoes`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `nome` | VARCHAR(100) | Nome da permissão | NOT NULL, UNIQUE |
| `descricao` | TEXT | Descrição da permissão | NULL |
| `modulo` | VARCHAR(50) | Módulo do sistema | NOT NULL |
| `acao` | VARCHAR(50) | Ação permitida | NOT NULL |
| `recurso` | VARCHAR(100) | Recurso específico | NULL |
| `status` | ENUM | Status da permissão | DEFAULT 'Ativa', valores: 'Ativa', 'Inativa' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 5. Usuário-Perfil (User-Profile)

**Tabela: `usuario_perfis`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `usuario_id` | INT | ID do usuário | FK, NOT NULL |
| `perfil_id` | INT | ID do perfil | FK, NOT NULL |
| `data_atribuicao` | TIMESTAMP | Data de atribuição | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `atribuido_por` | INT | ID do usuário que atribuiu | FK, NULL |
| `status` | ENUM | Status da atribuição | DEFAULT 'Ativa', valores: 'Ativa', 'Inativa' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 6. Perfil-Permissão (Profile-Permission)

**Tabela: `perfil_permissoes`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `perfil_id` | INT | ID do perfil | FK, NOT NULL |
| `permissao_id` | INT | ID da permissão | FK, NOT NULL |
| `data_atribuicao` | TIMESTAMP | Data de atribuição | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `atribuido_por` | INT | ID do usuário que atribuiu | FK, NULL |
| `status` | ENUM | Status da atribuição | DEFAULT 'Ativa', valores: 'Ativa', 'Inativa' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 7. Sessão (Session)

**Tabela: `sessoes`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | VARCHAR(255) | Identificador único da sessão | PK, NOT NULL |
| `usuario_id` | INT | ID do usuário | FK, NOT NULL |
| `ip_address` | VARCHAR(45) | Endereço IP | NULL |
| `user_agent` | TEXT | User Agent do navegador | NULL |
| `device_info` | VARCHAR(255) | Informações do dispositivo | NULL |
| `data_inicio` | TIMESTAMP | Data de início da sessão | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `data_fim` | TIMESTAMP | Data de fim da sessão | NULL |
| `ultima_atividade` | TIMESTAMP | Data da última atividade | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `status` | ENUM | Status da sessão | DEFAULT 'Ativa', valores: 'Ativa', 'Expirada', 'Encerrada' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 8. Log de Atividade (Activity Log)

**Tabela: `logs_atividade`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `usuario_id` | INT | ID do usuário | FK, NULL |
| `sessao_id` | VARCHAR(255) | ID da sessão | FK, NULL |
| `acao` | VARCHAR(100) | Ação realizada | NOT NULL |
| `modulo` | VARCHAR(50) | Módulo do sistema | NOT NULL |
| `recurso` | VARCHAR(100) | Recurso acessado | NULL |
| `dados_anteriores` | JSON | Dados antes da alteração | NULL |
| `dados_novos` | JSON | Dados após a alteração | NULL |
| `ip_address` | VARCHAR(45) | Endereço IP | NULL |
| `user_agent` | TEXT | User Agent do navegador | NULL |
| `status` | ENUM | Status da ação | DEFAULT 'Sucesso', valores: 'Sucesso', 'Falha', 'Erro' |
| `mensagem` | TEXT | Mensagem descritiva | NULL |
| `data_acao` | TIMESTAMP | Data da ação | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### 9. Configuração de Usuário (User Settings)

**Tabela: `configuracoes_usuario`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `usuario_id` | INT | ID do usuário | FK, NOT NULL, UNIQUE |
| `tema` | ENUM | Tema da interface | DEFAULT 'Claro', valores: 'Claro', 'Escuro', 'Automático' |
| `idioma` | VARCHAR(5) | Idioma da interface | DEFAULT 'pt-BR' |
| `fuso_horario` | VARCHAR(50) | Fuso horário | DEFAULT 'America/Sao_Paulo' |
| `notificacoes_email` | BOOLEAN | Receber notificações por e-mail | DEFAULT TRUE |
| `notificacoes_push` | BOOLEAN | Receber notificações push | DEFAULT TRUE |
| `dashboard_personalizado` | JSON | Configurações do dashboard | NULL |
| `preferencias_relatorio` | JSON | Preferências de relatórios | NULL |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 10. Token de Acesso (Access Token)

**Tabela: `tokens_acesso`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `usuario_id` | INT | ID do usuário | FK, NOT NULL |
| `token` | VARCHAR(255) | Token de acesso | NOT NULL, UNIQUE |
| `tipo` | ENUM | Tipo do token | NOT NULL, valores: 'Bearer', 'Refresh', 'API' |
| `escopo` | TEXT | Escopo do token | NULL |
| `data_expiracao` | TIMESTAMP | Data de expiração | NOT NULL |
| `data_ultimo_uso` | TIMESTAMP | Data do último uso | NULL |
| `ip_address` | VARCHAR(45) | Endereço IP | NULL |
| `user_agent` | TEXT | User Agent | NULL |
| `status` | ENUM | Status do token | DEFAULT 'Ativo', valores: 'Ativo', 'Expirado', 'Revogado' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

## Relacionamentos

### Relacionamentos Principais

1. **Usuário → Credencial** (1:1)
   - Um usuário tem uma credencial
   - Uma credencial pertence a um usuário

2. **Usuário → Perfil** (N:N)
   - Um usuário pode ter vários perfis
   - Um perfil pode ser atribuído a vários usuários

3. **Perfil → Permissão** (N:N)
   - Um perfil pode ter várias permissões
   - Uma permissão pode ser atribuída a vários perfis

4. **Usuário → Sessão** (1:N)
   - Um usuário pode ter várias sessões
   - Uma sessão pertence a um usuário

5. **Usuário → Log de Atividade** (1:N)
   - Um usuário pode ter várias atividades logadas
   - Um log de atividade pertence a um usuário

6. **Usuário → Configuração** (1:1)
   - Um usuário tem uma configuração
   - Uma configuração pertence a um usuário

7. **Usuário → Token de Acesso** (1:N)
   - Um usuário pode ter vários tokens
   - Um token pertence a um usuário

8. **Sessão → Log de Atividade** (1:N)
   - Uma sessão pode ter várias atividades
   - Um log de atividade pode ter uma sessão

## Índices Recomendados

```sql
-- Índices para melhorar performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX idx_usuarios_status ON usuarios(status);
CREATE INDEX idx_credenciais_username ON credenciais(username);
CREATE INDEX idx_credenciais_usuario_id ON credenciais(usuario_id);
CREATE INDEX idx_perfis_nome ON perfis(nome);
CREATE INDEX idx_perfis_nivel_acesso ON perfis(nivel_acesso);
CREATE INDEX idx_permissoes_modulo ON permissoes(modulo);
CREATE INDEX idx_permissoes_acao ON permissoes(acao);
CREATE INDEX idx_usuario_perfis_usuario_id ON usuario_perfis(usuario_id);
CREATE INDEX idx_usuario_perfis_perfil_id ON usuario_perfis(perfil_id);
CREATE INDEX idx_perfil_permissoes_perfil_id ON perfil_permissoes(perfil_id);
CREATE INDEX idx_perfil_permissoes_permissao_id ON perfil_permissoes(permissao_id);
CREATE INDEX idx_sessoes_usuario_id ON sessoes(usuario_id);
CREATE INDEX idx_sessoes_status ON sessoes(status);
CREATE INDEX idx_sessoes_data_inicio ON sessoes(data_inicio);
CREATE INDEX idx_logs_usuario_id ON logs_atividade(usuario_id);
CREATE INDEX idx_logs_data_acao ON logs_atividade(data_acao);
CREATE INDEX idx_logs_modulo ON logs_atividade(modulo);
CREATE INDEX idx_tokens_usuario_id ON tokens_acesso(usuario_id);
CREATE INDEX idx_tokens_token ON tokens_acesso(token);
CREATE INDEX idx_tokens_status ON tokens_acesso(status);
CREATE INDEX idx_tokens_expiracao ON tokens_acesso(data_expiracao);
```

## Triggers Recomendados

### 1. Atualizar Último Acesso
```sql
DELIMITER //
CREATE TRIGGER tr_atualizar_ultimo_acesso
AFTER INSERT ON sessoes
FOR EACH ROW
BEGIN
    UPDATE usuarios 
    SET ultimo_acesso = NEW.data_inicio
    WHERE id = NEW.usuario_id;
END//
DELIMITER ;
```

### 2. Bloquear Usuário após Tentativas
```sql
DELIMITER //
CREATE TRIGGER tr_bloquear_usuario_tentativas
AFTER UPDATE ON credenciais
FOR EACH ROW
BEGIN
    IF NEW.tentativas_login >= 5 THEN
        UPDATE usuarios 
        SET status = 'Bloqueado'
        WHERE id = NEW.usuario_id;
        
        UPDATE credenciais 
        SET bloqueado_ate = DATE_ADD(NOW(), INTERVAL 30 MINUTE)
        WHERE id = NEW.id;
    END IF;
END//
DELIMITER ;
```

### 3. Limpar Tokens Expirados
```sql
DELIMITER //
CREATE TRIGGER tr_limpar_tokens_expirados
BEFORE INSERT ON tokens_acesso
FOR EACH ROW
BEGIN
    UPDATE tokens_acesso 
    SET status = 'Expirado'
    WHERE usuario_id = NEW.usuario_id 
    AND data_expiracao < NOW() 
    AND status = 'Ativo';
END//
DELIMITER ;
```

## Views Úteis

### 1. View de Usuários com Perfis
```sql
CREATE VIEW vw_usuarios_perfis AS
SELECT 
    u.*,
    GROUP_CONCAT(p.nome SEPARATOR ', ') as perfis,
    GROUP_CONCAT(p.nivel_acesso SEPARATOR ', ') as niveis_acesso,
    MAX(p.nivel_acesso) as nivel_maximo
FROM usuarios u
LEFT JOIN usuario_perfis up ON u.id = up.usuario_id AND up.status = 'Ativa'
LEFT JOIN perfis p ON up.perfil_id = p.id AND p.status = 'Ativo'
GROUP BY u.id;
```

### 2. View de Permissões por Usuário
```sql
CREATE VIEW vw_permissoes_usuario AS
SELECT 
    u.id as usuario_id,
    u.nome as usuario_nome,
    u.email,
    p.nome as perfil_nome,
    perm.nome as permissao_nome,
    perm.modulo,
    perm.acao,
    perm.recurso
FROM usuarios u
JOIN usuario_perfis up ON u.id = up.usuario_id AND up.status = 'Ativa'
JOIN perfis p ON up.perfil_id = p.id AND p.status = 'Ativo'
JOIN perfil_permissoes pp ON p.id = pp.perfil_id AND pp.status = 'Ativa'
JOIN permissoes perm ON pp.permissao_id = perm.id AND perm.status = 'Ativa'
WHERE u.status = 'Ativo';
```

### 3. View de Sessões Ativas
```sql
CREATE VIEW vw_sessoes_ativas AS
SELECT 
    s.*,
    u.nome as usuario_nome,
    u.email,
    TIMESTAMPDIFF(MINUTE, s.ultima_atividade, NOW()) as minutos_inativo
FROM sessoes s
JOIN usuarios u ON s.usuario_id = u.id
WHERE s.status = 'Ativa' 
AND s.data_expiracao > NOW();
```

## APIs Recomendadas

### Endpoints Principais

1. **Autenticação**
   - `POST /api/auth/login` - Login do usuário
   - `POST /api/auth/logout` - Logout do usuário
   - `POST /api/auth/refresh` - Renovar token
   - `POST /api/auth/forgot-password` - Solicitar reset de senha
   - `POST /api/auth/reset-password` - Resetar senha
   - `POST /api/auth/verify-email` - Verificar e-mail

2. **Usuários**
   - `GET /api/usuarios` - Listar usuários
   - `GET /api/usuarios/{id}` - Obter usuário específico
   - `POST /api/usuarios` - Criar usuário
   - `PUT /api/usuarios/{id}` - Atualizar usuário
   - `DELETE /api/usuarios/{id}` - Deletar usuário
   - `PUT /api/usuarios/{id}/status` - Alterar status do usuário

3. **Perfis**
   - `GET /api/perfis` - Listar perfis
   - `POST /api/perfis` - Criar perfil
   - `PUT /api/perfis/{id}` - Atualizar perfil
   - `DELETE /api/perfis/{id}` - Deletar perfil

4. **Permissões**
   - `GET /api/permissoes` - Listar permissões
   - `GET /api/permissoes/modulo/{modulo}` - Permissões por módulo
   - `POST /api/permissoes` - Criar permissão
   - `PUT /api/permissoes/{id}` - Atualizar permissão

5. **Sessões**
   - `GET /api/sessoes` - Listar sessões ativas
   - `DELETE /api/sessoes/{id}` - Encerrar sessão
   - `GET /api/sessoes/usuario/{id}` - Sessões de um usuário

6. **Logs**
   - `GET /api/logs` - Listar logs de atividade
   - `GET /api/logs/usuario/{id}` - Logs de um usuário
   - `GET /api/logs/modulo/{modulo}` - Logs por módulo

7. **Configurações**
   - `GET /api/configuracoes/usuario/{id}` - Configurações do usuário
   - `PUT /api/configuracoes/usuario/{id}` - Atualizar configurações

## Perfis Sugeridos

### 1. Administrador
- **Nível de Acesso**: 10
- **Permissões**: Todas as permissões do sistema
- **Descrição**: Acesso completo ao sistema

### 2. Gerente
- **Nível de Acesso**: 8
- **Permissões**: Visualizar e gerenciar dados, criar relatórios
- **Descrição**: Acesso gerencial com restrições administrativas

### 3. Supervisor
- **Nível de Acesso**: 6
- **Permissões**: Visualizar dados, gerenciar equipe, criar propostas
- **Descrição**: Supervisão de operações e equipe

### 4. Operador
- **Nível de Acesso**: 4
- **Permissões**: Visualizar dados, registrar movimentações, atualizar status
- **Descrição**: Operação diária do sistema

### 5. Visualizador
- **Nível de Acesso**: 2
- **Permissões**: Apenas visualização de dados
- **Descrição**: Acesso somente leitura

## Permissões por Módulo

### Módulo de Gruas
- `gruas:visualizar` - Visualizar gruas
- `gruas:criar` - Criar gruas
- `gruas:editar` - Editar gruas
- `gruas:deletar` - Deletar gruas
- `gruas:gerar_proposta` - Gerar propostas
- `gruas:gerenciar_contratos` - Gerenciar contratos

### Módulo de Estoque
- `estoque:visualizar` - Visualizar estoque
- `estoque:criar` - Criar produtos
- `estoque:editar` - Editar produtos
- `estoque:movimentar` - Fazer movimentações
- `estoque:reservar` - Reservar produtos
- `estoque:exportar` - Exportar relatórios

### Módulo de Usuários
- `usuarios:visualizar` - Visualizar usuários
- `usuarios:criar` - Criar usuários
- `usuarios:editar` - Editar usuários
- `usuarios:deletar` - Deletar usuários
- `usuarios:gerenciar_perfis` - Gerenciar perfis
- `usuarios:gerenciar_permissoes` - Gerenciar permissões

## Considerações de Segurança

1. **Autenticação**
   - Senhas com hash seguro (bcrypt, scrypt)
   - Salt único para cada senha
   - Limite de tentativas de login
   - Bloqueio temporário após tentativas

2. **Autorização**
   - Controle de acesso baseado em perfis
   - Verificação de permissões em cada endpoint
   - Logs de todas as ações sensíveis

3. **Sessões**
   - Tokens JWT com expiração
   - Refresh tokens para renovação
   - Invalidação de sessões expiradas
   - Controle de sessões simultâneas

4. **Auditoria**
   - Logs detalhados de todas as ações
   - Rastreamento de alterações
   - Retenção de logs por período definido

## Relatórios Sugeridos

1. **Relatório de Usuários Ativos**
2. **Relatório de Acessos por Período**
3. **Relatório de Permissões por Usuário**
4. **Relatório de Logs de Atividade**
5. **Relatório de Sessões Ativas**
6. **Relatório de Tentativas de Login Falhadas**
7. **Relatório de Alterações de Perfil**
8. **Relatório de Tokens Expirados**

Esta estrutura de banco de dados fornece uma base sólida para o sistema de gerenciamento de usuários, permitindo controle completo de acesso, auditoria e segurança do sistema.
