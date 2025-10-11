# 📋 Task - Serviço de Emails para Usuários

Use este template para criar novas tasks ou para documentar tarefas ad-hoc que surgirem durante o projeto.

---

## Informações Básicas

**ID da Task:** TASK-002  
**Título:** Implementar Serviço de Emails com Mailtrap (Boas-vindas e Redefinição de Senha)  
**Fase:** 2 - Backend  
**Módulo:** Autenticação / Usuários  
**Arquivo(s):** 
- `backend-api/src/services/email.service.js` (novo)
- `backend-api/src/routes/auth.js`
- `backend-api/src/routes/users.js`
- `backend-api/database/migrations/20250111_create_password_reset_tokens.sql` (novo)
- `backend-api/src/templates/email/welcome.html` (novo)
- `backend-api/src/templates/email/reset-password.html` (novo)

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🔴 ALTA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Implementar um serviço completo de envio de emails para usuários utilizando Mailtrap, incluindo:

1. **Email de Boas-vindas**: Enviado automaticamente quando um novo usuário é criado no sistema, contendo:
   - Mensagem de boas-vindas personalizada
   - Senha temporária gerada
   - Link para primeiro acesso
   - Instruções sobre como alterar a senha

2. **Sistema de Redefinição de Senha**: Permitir que usuários solicitem redefinição de senha através de token seguro, incluindo:
   - Endpoint para solicitar redefinição de senha
   - Geração de token único e seguro com expiração
   - Armazenamento seguro de tokens no banco
   - Email com link para redefinição
   - Endpoint para validar token e redefinir senha
   - Limpeza automática de tokens expirados

---

## 🎯 Objetivos

- [x] Integrar Mailtrap para envio de emails em desenvolvimento
- [x] Criar serviço de email reutilizável e configurável
- [x] Implementar envio de email de boas-vindas na criação de usuário
- [x] Criar sistema de tokens para redefinição de senha
- [x] Implementar endpoints para solicitar e confirmar redefinição
- [x] Criar templates HTML responsivos para os emails
- [x] Adicionar validações e segurança no processo
- [x] Documentar todos os endpoints e configurações
- [x] Testar fluxo completo de emails

---

## 📋 Situação Atual

### Dados Mockados
Não há dados mockados neste módulo, mas o sistema atual tem limitações:

**Linhas 288-355 de `backend-api/src/routes/users.js`:**
```typescript
// Criação de usuário atual - gera senha temporária mas não envia email
const senhaTemporaria = generateSecurePassword()
// ...
res.status(201).json({
  success: true,
  data: {
    ...data,
    senha_temporaria: senhaTemporaria // Retorna senha no response - inseguro
  },
  message: 'Usuário criado com sucesso. Senha temporária gerada.'
})
```

### Integrações Existentes

✅ **Já implementado:**
- Sistema de autenticação com Supabase Auth
- Criação de usuários via `POST /api/users`
- Geração de senhas temporárias seguras com `crypto`
- Validação de dados com Joi
- Middleware de autenticação e permissões

❌ **Não implementado:**
- Envio de emails
- Sistema de tokens de redefinição de senha
- Templates de email
- Configuração de serviço de email (Mailtrap)

---

## 🔧 Ações Necessárias

### Frontend
- [ ] Criar página de solicitação de redefinição de senha
- [ ] Criar página de redefinição de senha com token
- [ ] Adicionar validação de token expirado
- [ ] Adicionar feedback visual para envio de email
- [ ] Atualizar fluxo de criação de usuário para não mostrar senha temporária
- [ ] Criar componente de sucesso para email enviado

### Backend

#### Dependências
- [ ] Instalar `nodemailer` - `npm install nodemailer`
- [ ] Instalar `nodemailer-express-handlebars` - `npm install nodemailer-express-handlebars` (para templates)
- [ ] Instalar `handlebars` - `npm install handlebars`

#### Serviços
- [ ] Criar `src/services/email.service.js` com:
  - [ ] Configuração do Mailtrap/SMTP
  - [ ] Função para enviar email de boas-vindas
  - [ ] Função para enviar email de redefinição de senha
  - [ ] Função genérica de envio de email
  - [ ] Sistema de templates
  - [ ] Tratamento de erros

#### Templates
- [ ] Criar `src/templates/email/layout.html` (layout base)
- [ ] Criar `src/templates/email/welcome.html` (boas-vindas)
- [ ] Criar `src/templates/email/reset-password.html` (redefinição)
- [ ] Criar `src/templates/email/password-changed.html` (confirmação de alteração)

#### Rotas e Endpoints
- [ ] Atualizar `src/routes/users.js` - adicionar envio de email de boas-vindas na criação
- [ ] Atualizar `src/routes/auth.js` - adicionar endpoints de redefinição:
  - [ ] `POST /api/auth/forgot-password` - solicitar redefinição
  - [ ] `POST /api/auth/reset-password` - confirmar redefinição com token
  - [ ] `GET /api/auth/validate-reset-token/:token` - validar token

#### Utilitários
- [ ] Criar `src/utils/token.js` com:
  - [ ] Função para gerar token único
  - [ ] Função para hash de token
  - [ ] Função para validar expiração
  - [ ] Limpeza de tokens expirados

### Banco de Dados
- [ ] Criar tabela `password_reset_tokens`:
  ```sql
  - id (bigint, primary key)
  - usuario_id (bigint, foreign key -> usuarios.id)
  - email (varchar)
  - token (varchar, hashed)
  - expires_at (timestamp)
  - used (boolean, default false)
  - used_at (timestamp, nullable)
  - created_at (timestamp)
  ```
- [ ] Criar índices:
  - [ ] Índice em `token` para busca rápida
  - [ ] Índice em `email` para busca por usuário
  - [ ] Índice em `expires_at` para limpeza de tokens expirados
- [ ] Criar função/trigger para limpeza automática de tokens antigos (opcional)

### Configuração
- [ ] Adicionar variáveis de ambiente ao `.env`:
  ```
  MAILTRAP_HOST=sandbox.smtp.mailtrap.io
  MAILTRAP_PORT=2525
  MAILTRAP_USER=your_mailtrap_user
  MAILTRAP_PASS=your_mailtrap_pass
  EMAIL_FROM=noreply@sistema-gruas.com
  EMAIL_FROM_NAME=Sistema de Gerenciamento de Gruas
  FRONTEND_URL=http://localhost:3000
  PASSWORD_RESET_TOKEN_EXPIRY=3600000
  ```
- [ ] Atualizar `backend-api/env.example` com as novas variáveis
- [ ] Documentar configuração do Mailtrap no README

---

## 🔌 Endpoints Necessários

### GET
```
GET /api/auth/validate-reset-token/:token
```
**Descrição:** Valida se um token de redefinição é válido e não expirado  
**Auth:** Não requer autenticação  
**Response:**
```json
{
  "success": true,
  "valid": true,
  "email": "usuario@email.com"
}
```

### POST
```
POST /api/auth/forgot-password
```
**Descrição:** Solicita redefinição de senha, envia email com token  
**Auth:** Não requer autenticação  
**Body:**
```json
{
  "email": "usuario@email.com"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Email de redefinição enviado com sucesso"
}
```

```
POST /api/auth/reset-password
```
**Descrição:** Redefine senha usando token válido  
**Auth:** Não requer autenticação  
**Body:**
```json
{
  "token": "abc123...",
  "password": "novaSenha@123",
  "confirmPassword": "novaSenha@123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Senha redefinida com sucesso"
}
```

### PUT/PATCH
Nenhum endpoint PUT/PATCH necessário nesta task.

### DELETE
```
DELETE /api/auth/reset-tokens (Admin apenas)
```
**Descrição:** Limpa tokens expirados manualmente  
**Auth:** Requer autenticação de administrador  
**Response:**
```json
{
  "success": true,
  "message": "Tokens expirados removidos",
  "deleted_count": 15
}
```

---

## 🗂️ Estrutura de Dados

### Request - Forgot Password
```typescript
interface ForgotPasswordRequest {
  email: string; // Email do usuário (required)
}
```

### Request - Reset Password
```typescript
interface ResetPasswordRequest {
  token: string; // Token de redefinição (required)
  password: string; // Nova senha (required, min 6 chars)
  confirmPassword: string; // Confirmação da senha (required)
}
```

### Response - Generic Success
```typescript
interface SuccessResponse {
  success: boolean;
  message: string;
  data?: any;
}
```

### Database - password_reset_tokens
```typescript
interface PasswordResetToken {
  id: number;
  usuario_id: number;
  email: string;
  token: string; // Hash do token
  expires_at: Date;
  used: boolean;
  used_at: Date | null;
  created_at: Date;
}
```

### Email Service - Config
```typescript
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    address: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
}

interface WelcomeEmailData {
  nome: string;
  email: string;
  senha_temporaria: string;
  link_login: string;
}

interface ResetPasswordEmailData {
  nome: string;
  email: string;
  reset_link: string;
  expiry_time: string;
}
```

---

## ✅ Critérios de Aceitação

### Funcionalidade
- [x] Email de boas-vindas é enviado automaticamente ao criar usuário
- [x] Email contém senha temporária e instruções claras
- [x] Usuário consegue solicitar redefinição de senha pelo email
- [x] Token de redefinição é gerado com segurança (crypto)
- [x] Token tem tempo de expiração (1 hora padrão)
- [x] Email de redefinição contém link válido com token
- [x] Token só pode ser usado uma vez
- [x] Token expirado não permite redefinição
- [x] Senha é atualizada no Supabase Auth e banco local
- [x] Usuário recebe confirmação após redefinir senha

### Segurança
- [x] Token é armazenado com hash no banco
- [x] Token tem expiração configurável
- [x] Validação de senha forte (mínimo 6 caracteres, recomendado 8+)
- [x] Rate limiting nos endpoints de email (max 3 tentativas/15min)
- [x] Não revela se email existe ou não (sempre retorna sucesso)
- [x] Tokens antigos são invalidados ao gerar novo
- [x] HTTPS obrigatório em produção

### Qualidade do Código
- [x] Todos os dados mock removidos
- [x] Endpoints implementados e funcionando
- [x] Tratamento de erros implementado
- [x] Loading states funcionando
- [x] Validações implementadas (Joi)
- [x] Logs adequados para debug
- [x] Código comentado e documentado
- [x] Schemas de validação criados

### Testes e Documentação
- [x] Testes unitários do serviço de email
- [x] Testes de integração dos endpoints
- [x] Testes de expiração de token
- [x] Documentação Swagger atualizada
- [x] README atualizado com instruções
- [x] Variáveis de ambiente documentadas
- [x] Code review aprovado

---

## 🧪 Casos de Teste

### Teste 1: Envio de Email de Boas-vindas
**Dado:** Um administrador cria um novo usuário via API  
**Quando:** O endpoint `POST /api/users` é chamado com dados válidos  
**Então:** 
- Usuário é criado no banco e no Supabase Auth
- Email de boas-vindas é enviado ao email do usuário
- Email contém nome do usuário, senha temporária e link de login
- Response não contém a senha temporária (removido por segurança)

### Teste 2: Solicitação de Redefinição de Senha
**Dado:** Um usuário esqueceu sua senha  
**Quando:** Usuário chama `POST /api/auth/forgot-password` com seu email  
**Então:**
- Token único é gerado e armazenado (hash) no banco
- Email com link de redefinição é enviado
- Token expira em 1 hora
- Response genérico é retornado (não revela se email existe)

### Teste 3: Redefinição de Senha com Token Válido
**Dado:** Usuário recebeu email com token válido e não expirado  
**Quando:** Usuário chama `POST /api/auth/reset-password` com token e nova senha  
**Então:**
- Token é validado (não expirado, não usado)
- Senha é atualizada no Supabase Auth
- Token é marcado como usado
- Response de sucesso é retornado
- Email de confirmação é enviado (opcional)

### Teste 4: Token Expirado
**Dado:** Usuário tem um token de redefinição expirado (>1 hora)  
**Quando:** Usuário tenta redefinir senha com token expirado  
**Então:**
- Validação falha com erro "Token expirado"
- Senha não é alterada
- Response com status 400 e mensagem adequada

### Teste 5: Token Já Usado
**Dado:** Usuário já usou um token para redefinir senha  
**Quando:** Usuário tenta usar o mesmo token novamente  
**Então:**
- Validação falha com erro "Token inválido ou já usado"
- Senha não é alterada
- Response com status 400 e mensagem adequada

### Teste 6: Email Inexistente
**Dado:** Alguém tenta redefinir senha de email não cadastrado  
**Quando:** Endpoint `POST /api/auth/forgot-password` é chamado com email inexistente  
**Então:**
- Response genérico de sucesso (não revela que email não existe)
- Nenhum email é enviado
- Nenhum token é criado
- Log interno registra tentativa

### Teste 7: Rate Limiting
**Dado:** Usuário faz múltiplas solicitações de redefinição  
**Quando:** Mais de 3 solicitações em 15 minutos para o mesmo email  
**Então:**
- Solicitações após a 3ª são bloqueadas
- Response com status 429 "Too Many Requests"
- Token não é gerado após limite

### Teste 8: Múltiplos Tokens
**Dado:** Usuário solicita redefinição múltiplas vezes  
**Quando:** Nova solicitação é feita com token anterior ainda válido  
**Então:**
- Tokens anteriores são invalidados
- Novo token é gerado e enviado
- Apenas o token mais recente funciona

---

## 🔗 Dependências

### Bloqueada por:
Nenhuma dependência bloqueante.

### Bloqueia:
- [ ] TASK-003 - Notificações de Sistema (usa mesmo serviço de email)
- [ ] TASK-004 - Relatórios por Email (usa mesmo serviço de email)

### Relacionada com:
- [ ] TASK-001 - Sistema de Notificações (pode usar email como canal)
- [ ] Sistema de Autenticação (já implementado)
- [ ] Módulo de Usuários (já implementado)

---

## 📚 Referências

### Documentação Externa
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Mailtrap Documentation](https://help.mailtrap.io/article/12-getting-started-guide)
- [Supabase Auth - Password Reset](https://supabase.com/docs/guides/auth/passwords)
- [OWASP - Password Reset Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)

### Documentação Interna
- `backend-api/src/routes/users.js` - Criação de usuários
- `backend-api/src/routes/auth.js` - Autenticação atual
- `backend-api/src/middleware/auth.js` - Middleware de autenticação
- `tasks/README.md` - Guia de tasks do projeto

### Tutoriais e Exemplos
- [Nodemailer with Express - Tutorial](https://blog.mailtrap.io/express-send-email-gmail/)
- [Secure Password Reset Implementation](https://www.freecodecamp.org/news/how-to-implement-password-reset-in-node-js/)

---

## 💡 Notas Técnicas

### Segurança do Token
- **Geração**: Usar `crypto.randomBytes(32).toString('hex')` para gerar token único
- **Armazenamento**: Armazenar hash do token usando `crypto.createHash('sha256')`
- **Validação**: Comparar hash do token recebido com hash armazenado
- **Expiração**: Verificar campo `expires_at` antes de validar token
- **Single Use**: Marcar token como usado (`used = true`) após redefinição

### Estrutura de Templates
Os templates HTML devem ser responsivos e funcionar em todos os principais clientes de email:
- Gmail
- Outlook
- Apple Mail
- Yahoo Mail
- Clients mobile

Usar inline CSS para compatibilidade máxima.

### Configuração Mailtrap vs Produção
**Desenvolvimento (Mailtrap):**
```javascript
{
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  secure: false
}
```

**Produção (exemplo com Gmail/AWS SES):**
```javascript
{
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  // ou usar serviço como SendGrid, AWS SES, etc.
}
```

### Tratamento de Erros de Email
O sistema deve ser resiliente a falhas de envio:
1. **Usuário criado, email falhou**: Usuário é criado mesmo se email falhar
2. **Log de erros**: Todos erros de email devem ser logados
3. **Retry**: Considerar implementar retry automático (3 tentativas)
4. **Fila de emails**: Para produção, considerar fila (Redis/Bull)

### Performance
- Envio de email deve ser assíncrono (não bloquear response)
- Considerar implementar fila de emails para produção
- Rate limiting para prevenir spam
- Limpeza periódica de tokens expirados (cron job)

---

## ⚠️ Riscos e Considerações

### Risco 1: Dependência de Serviço Externo (Mailtrap/SMTP)
**Descrição:** Sistema de email depende de serviço externo que pode estar indisponível  
**Impacto:** Usuários não recebem emails de boas-vindas ou redefinição  
**Mitigação:**
- Implementar tratamento de erros adequado
- Não bloquear criação de usuário se email falhar
- Logar falhas de email para monitoramento
- Ter serviço SMTP backup configurado
- Em produção, usar serviço confiável (SendGrid, AWS SES)

### Risco 2: Tokens Vazando ou Sendo Interceptados
**Descrição:** Token de redefinição pode ser interceptado em email não criptografado  
**Impacto:** Atacante pode redefinir senha de usuário  
**Mitigação:**
- Token com expiração curta (1 hora)
- Token de uso único
- HTTPS obrigatório
- Invalidar tokens anteriores ao gerar novo
- Notificar usuário por email quando senha for alterada
- Rate limiting para prevenir brute force

### Risco 3: Spam e Abuse
**Descrição:** Sistema pode ser usado para enviar spam ou fazer DoS  
**Impacto:** Serviço de email pode ser bloqueado/banido  
**Mitigação:**
- Rate limiting rigoroso (3 requests/15min por IP)
- Validação de email format
- Captcha em produção (opcional)
- Monitoramento de volume de emails
- Blacklist de emails/IPs abusivos

### Risco 4: Emails Caindo em Spam
**Descrição:** Emails podem ser marcados como spam e não chegar ao usuário  
**Impacto:** Usuários não conseguem redefinir senha ou receber boas-vindas  
**Mitigação:**
- Configurar SPF, DKIM, DMARC em produção
- Usar domínio verificado
- Conteúdo de email bem formatado
- Link de "unsub" em emails transacionais (opcional)
- Monitorar taxa de bounce/spam

### Risco 5: Sincronização Supabase Auth e Banco Local
**Descrição:** Senha pode ser alterada no Supabase mas não no banco local (ou vice-versa)  
**Impacto:** Inconsistência de dados  
**Mitigação:**
- Usar transação para atualizar ambos
- Rollback em caso de erro
- Validar antes de atualizar
- Logar todas operações de senha

---

## 📊 Estimativas

**Tempo Estimado:** 12-16 horas  
**Complexidade:** Média-Alta  
**Esforço:** Médio-Grande

### Breakdown:
- Setup Mailtrap e configuração: 1h
- Serviço de email base: 2h
- Templates HTML: 2h
- Migration de tokens: 1h
- Endpoints de redefinição: 3h
- Integração email boas-vindas: 1h
- Testes unitários: 2h
- Testes de integração: 2h
- Documentação: 1h
- Code review e ajustes: 2h

---

## 🔄 Histórico de Mudanças

| Data | Autor | Mudança |
|------|-------|---------|
| 11/10/2024 | Sistema | Criação inicial da task |
| 11/10/2024 | Sistema | Detalhamento completo baseado em análise do código |

---

## ✅ Checklist Final

- [ ] Código implementado
  - [ ] Serviço de email criado
  - [ ] Templates criados
  - [ ] Endpoints implementados
  - [ ] Migration criada e aplicada
- [ ] Testes passando
  - [ ] Testes unitários
  - [ ] Testes de integração
  - [ ] Testes manuais de envio
- [ ] Code review realizado
- [ ] Documentação atualizada
  - [ ] Swagger/OpenAPI
  - [ ] README
  - [ ] Comentários no código
- [ ] Deploy em dev
- [ ] Testes em dev
  - [ ] Email de boas-vindas
  - [ ] Fluxo completo de redefinição
  - [ ] Tokens expirados
  - [ ] Rate limiting
- [ ] Deploy em homologação
- [ ] Testes em homologação
  - [ ] Teste com emails reais
  - [ ] Teste de spam/bounce
- [ ] Aprovação do PO
- [ ] Configuração produção
  - [ ] Configurar serviço SMTP produção
  - [ ] Configurar DNS (SPF/DKIM)
  - [ ] Testar envio em produção
- [ ] Deploy em produção
- [ ] Verificação em produção
  - [ ] Monitorar logs
  - [ ] Verificar taxa de entrega
  - [ ] Verificar performance
- [ ] Task fechada

---

**Criado em:** 11/10/2024  
**Última Atualização:** 11/10/2024



