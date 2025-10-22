# Guia de Migração: Sistema de Permissões 2.0

## 📋 Visão Geral

Este guia descreve como migrar do sistema de permissões complexo (v1.0) para o sistema simplificado (v2.0) com 5 roles principais.

## 🎯 Mudanças Principais

### Sistema Antigo (v1.0)
- ❌ 6 perfis variáveis (Administrador, Gerente, Supervisor, Operador, Visualizador, Cliente)
- ❌ 74 permissões granulares gerenciadas pelo banco de dados
- ❌ Consultas ao banco para verificar cada permissão
- ❌ Sistema complexo de perfil_permissoes

### Sistema Novo (v2.0)
- ✅ 5 roles fixos (Admin, Gestores, Supervisores, Operários, Clientes)
- ✅ Permissões hardcoded no código
- ✅ Verificação local sem consultas ao banco
- ✅ Sistema simplificado e performático

## 🔄 Mapeamento de Perfis

| Perfil Antigo | Novo Role | Ação |
|---------------|-----------|------|
| Administrador | Admin | Renomeado |
| Gerente | Gestores | Renomeado |
| Supervisor | Supervisores | Renomeado |
| Operador | Operários | Renomeado |
| Visualizador | **Operários** | **Migrado** (perfil removido) |
| Cliente | Clientes | Mantido |

## 📝 Passo a Passo da Migração

### 1. Preparação (Antes da Migração)

#### 1.1 Backup do Banco de Dados
```bash
# Fazer backup completo
pg_dump -h localhost -U postgres -d seu_banco > backup_pre_migracao.sql
```

#### 1.2 Validar Estado Atual
```bash
cd backend-api
node scripts/migrate-perfis.js pre
```

Este comando irá:
- Contar quantos perfis existem
- Mostrar quantos usuários há em cada perfil
- Identificar usuários sem perfil
- Salvar relatório em `backend-api/database/migrations/pre-migration-report.json`

### 2. Executar Migração do Banco

#### 2.1 Rodar Migration SQL
```sql
-- Conectar ao banco e executar
\i backend-api/database/migrations/20250122_simplificar_perfis.sql
```

A migration irá:
1. Criar backup automático das tabelas `perfis`, `usuario_perfis` e `perfil_permissoes`
2. Renomear os perfis existentes para os novos nomes
3. Migrar usuários com perfil "Visualizador" para "Operários"
4. Marcar perfil "Visualizador" como inativo
5. Atualizar níveis de acesso
6. Criar índices para performance

#### 2.2 Validar Pós-Migração
```bash
node scripts/migrate-perfis.js post
```

Este comando irá:
- Verificar se os 5 perfis principais existem
- Confirmar níveis de acesso corretos
- Mostrar distribuição de usuários
- Salvar relatório em `backend-api/database/migrations/post-migration-report.json`

#### 2.3 Comparar Resultados
```bash
node scripts/migrate-perfis.js compare
```

### 3. Atualizar Backend

#### 3.1 Instalar Dependências (se necessário)
```bash
cd backend-api
npm install
```

#### 3.2 Verificar Configuração
Os arquivos já devem estar no projeto:
- ✅ `backend-api/src/config/roles.js` - Definição dos 5 roles
- ✅ `backend-api/src/middleware/permissions.js` - Middleware de permissões
- ✅ `backend-api/src/middleware/auth.js` - Autenticação atualizada
- ✅ `backend-api/src/routes/auth.js` - Login atualizado

#### 3.3 Reiniciar Servidor
```bash
npm run dev
# ou
npm start
```

### 4. Atualizar Frontend

#### 4.1 Limpar Cache do Navegador
Instrua usuários a limpar cache ou usar Ctrl+F5 para recarregar.

#### 4.2 Verificar Arquivos
Os arquivos devem estar atualizados:
- ✅ `types/permissions.ts` - Tipos TypeScript
- ✅ `hooks/use-permissions.ts` - Hook refatorado
- ✅ `components/protected-route.tsx` - Proteção de rotas
- ✅ `components/dynamic-menu.tsx` - Menu dinâmico

#### 4.3 Rebuild do Frontend
```bash
npm run build
# ou para desenvolvimento
npm run dev
```

### 5. Testar Sistema

#### 5.1 Testes Manuais

**Teste 1: Login com cada role**
- [ ] Admin - Login deve funcionar e mostrar todos os módulos
- [ ] Gestores - Login deve funcionar e mostrar todos os módulos
- [ ] Supervisores - Login deve mostrar módulos operacionais
- [ ] Operários - Login deve redirecionar para PWA ou mostrar acesso limitado
- [ ] Clientes - Login deve redirecionar para documentos

**Teste 2: Verificar permissões**
- [ ] Admin pode acessar /dashboard/usuarios
- [ ] Supervisores podem acessar /dashboard/gruas
- [ ] Operários NÃO podem acessar /dashboard (ou têm acesso muito limitado)
- [ ] Clientes NÃO podem acessar /dashboard

**Teste 3: PWA**
- [ ] Operários podem registrar ponto no PWA
- [ ] Supervisores podem aprovar horas extras no PWA
- [ ] Todos podem ver seus próprios dados

#### 5.2 Testes Automatizados
```bash
# Backend
cd backend-api
npm test

# Frontend
cd ..
npm test
```

### 6. Monitoramento Pós-Migração

#### 6.1 Logs do Servidor
Monitorar logs por 24-48 horas:
```bash
tail -f backend-api/logs/app.log
```

Procurar por:
- ❌ Erros de permissão
- ⚠️  Usuários sem perfil
- ⚠️  Rotas bloqueadas inesperadamente

#### 6.2 Métricas de Acesso
- Verificar se todos os usuários conseguem logar
- Confirmar que não há bloqueios indevidos
- Monitorar performance (deve ser MELHOR que antes)

## 🚨 Rollback (Se Necessário)

### Cenário: Problemas Críticos Após Migração

#### 1. Executar Rollback SQL
```sql
\i backend-api/database/migrations/20250122_rollback_simplificar_perfis.sql
```

Este script irá:
- Restaurar tabelas de backup
- Reverter sistema para v1.0
- Atualizar versão do sistema

#### 2. Reverter Código (Git)
```bash
# Se necessário, reverter commits
git log --oneline  # Ver commits recentes
git revert <commit-hash>  # Reverter commit específico
```

#### 3. Reiniciar Aplicação
```bash
# Backend
cd backend-api
npm restart

# Frontend
npm run build
```

## ✅ Checklist Final

### Pré-Migração
- [ ] Backup do banco de dados realizado
- [ ] Relatório pré-migração gerado
- [ ] Todos os stakeholders notificados
- [ ] Horário de baixo tráfego agendado

### Durante Migração
- [ ] Migration SQL executada sem erros
- [ ] Relatório pós-migração validado
- [ ] 5 perfis principais confirmados
- [ ] Nenhum usuário perdido

### Pós-Migração
- [ ] Backend reiniciado
- [ ] Frontend rebuilt
- [ ] Testes manuais passando
- [ ] Logs sem erros críticos
- [ ] Usuários podem fazer login
- [ ] Permissões funcionando corretamente

### Comunicação
- [ ] Usuários notificados sobre mudanças
- [ ] Documentação atualizada
- [ ] FAQ publicado
- [ ] Equipe de suporte treinada

## 📊 Métricas de Sucesso

### Performance
- ✅ **Latência de login**: Deve reduzir (menos queries ao banco)
- ✅ **Verificação de permissões**: Deve ser instantânea (sem DB)
- ✅ **Carga do servidor**: Deve reduzir

### Funcionalidade
- ✅ **Taxa de sucesso de login**: 100%
- ✅ **Usuários bloqueados indevidamente**: 0
- ✅ **Erros de permissão**: 0

## 🆘 Suporte

### Problemas Comuns

#### Problema: "Usuário sem perfil ativo"
**Solução**: Atribuir perfil manualmente no banco
```sql
INSERT INTO usuario_perfis (usuario_id, perfil_id, status, created_at, updated_at)
VALUES (<user_id>, <perfil_id>, 'Ativa', NOW(), NOW());
```

#### Problema: "Permissão negada" inesperada
**Solução**: 
1. Verificar role do usuário
2. Consultar permissões hardcoded em `backend-api/src/config/roles.js`
3. Se necessário, ajustar permissões no código

#### Problema: Menu vazio no frontend
**Solução**:
1. Limpar cache do navegador
2. Verificar console do navegador para erros
3. Confirmar que role está correto no localStorage

### Contatos
- **Equipe de Desenvolvimento**: dev@empresa.com
- **Suporte Técnico**: suporte@empresa.com
- **Emergências**: +55 (xx) xxxxx-xxxx

## 📚 Documentos Relacionados

- [SISTEMA-PERMISSOES-SIMPLIFICADO.md](SISTEMA-PERMISSOES-SIMPLIFICADO.md) - Especificação completa
- [FAQ_PERMISSOES.md](FAQ_PERMISSOES.md) - Perguntas frequentes
- [README.md](README.md) - Documentação geral do projeto

## 🔄 Histórico de Versões

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0 | 2024-XX-XX | Sistema complexo com 6 perfis variáveis |
| 2.0 | 2025-01-22 | Sistema simplificado com 5 roles fixos |

---

**Última atualização**: 2025-01-22  
**Versão do documento**: 1.0

