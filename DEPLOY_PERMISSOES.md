# Procedimento de Deploy - Sistema de Permissões 2.0

## 🎯 Objetivo

Deploy do sistema simplificado de permissões em ambiente de produção.

## ⏰ Informações do Deploy

- **Data sugerida**: [DEFINIR] - Preferencialmente fim de semana ou horário de baixo tráfego
- **Duração estimada**: 30-60 minutos
- **Downtime esperado**: 10-15 minutos
- **Rollback time**: 5-10 minutos

## ✅ Pré-requisitos

### Checklist Pré-Deploy

- [ ] **Backup completo do banco de dados** realizado
- [ ] **Backup do código atual** (tag Git criada)
- [ ] **Ambiente de staging** testado com sucesso
- [ ] **Equipe de plantão** disponível
- [ ] **Usuários-chave notificados** sobre manutenção
- [ ] **Script de rollback** testado
- [ ] **Monitoramento** configurado

### Validações Técnicas

```bash
# 1. Verificar versão do Node.js
node --version  # Deve ser >= 18.x

# 2. Verificar versão do PostgreSQL
psql --version  # Deve ser >= 14.x

# 3. Verificar conexão com banco
psql -h HOST -U USER -d DATABASE -c "SELECT version();"

# 4. Verificar espaço em disco
df -h  # Deve ter pelo menos 10GB livre

# 5. Verificar variáveis de ambiente
env | grep SUPABASE
```

## 📋 Procedimento de Deploy

### Etapa 1: Preparação (T-30min)

#### 1.1 Criar Tag de Release
```bash
git tag -a v2.0.0-permissions -m "Sistema de Permissões Simplificado v2.0"
git push origin v2.0.0-permissions
```

#### 1.2 Backup Completo
```bash
# Banco de dados
pg_dump -h HOST -U USER -Fc DATABASE > backup_$(date +%Y%m%d_%H%M%S).dump

# Código (se não usar Git)
tar -czf app_backup_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/app
```

#### 1.3 Ativar Modo Manutenção
```bash
# Criar arquivo de manutenção
touch /var/www/app/public/maintenance.html

# Ou via nginx
sudo cp /etc/nginx/sites-available/maintenance.conf /etc/nginx/sites-enabled/default
sudo nginx -s reload
```

### Etapa 2: Backend - Banco de Dados (T-15min)

#### 2.1 Validar Estado Atual
```bash
cd backend-api
node scripts/migrate-perfis.js pre
```

**Verificar saída**:
- Número de usuários por perfil
- Usuários sem perfil (resolver antes de continuar)
- Relatório salvo

#### 2.2 Executar Migration
```bash
# Conectar ao banco
psql -h HOST -U USER -d DATABASE

# Executar migration
\i backend-api/database/migrations/20250122_simplificar_perfis.sql

# Verificar resultado
SELECT nome, nivel_acesso, status FROM perfis ORDER BY nivel_acesso DESC;
```

**Resultado esperado**:
```
     nome      | nivel_acesso | status
---------------+--------------+--------
 Admin         |           10 | Ativo
 Gestores      |            9 | Ativo
 Supervisores  |            6 | Ativo
 Operários     |            4 | Ativo
 Clientes      |            1 | Ativo
(5 rows)
```

#### 2.3 Validar Migration
```bash
node scripts/migrate-perfis.js post
```

**Verificar**:
- 5 perfis principais criados ✓
- Níveis corretos ✓
- Nenhum usuário perdido ✓

### Etapa 3: Backend - Aplicação (T-10min)

#### 3.1 Fazer Pull do Código
```bash
cd /path/to/backend-api
git fetch origin
git checkout main
git pull origin main
```

#### 3.2 Instalar Dependências
```bash
npm install --production
```

#### 3.3 Verificar Arquivos Críticos
```bash
# Confirmar que arquivos existem
ls -la src/config/roles.js
ls -la src/middleware/permissions.js
ls -la src/middleware/auth.js
```

#### 3.4 Testar Inicialização
```bash
# Dry run (sem restart)
node src/index.js --test

# Se OK, reiniciar
pm2 restart backend-api
# ou
systemctl restart backend-api
```

#### 3.5 Verificar Logs
```bash
pm2 logs backend-api --lines 50
# ou
tail -f /var/log/backend-api/app.log
```

**Procurar por**:
- ✓ "Server running on port..."
- ✓ "Database connected"
- ❌ Erros de imports/módulos

### Etapa 4: Frontend (T-5min)

#### 4.1 Fazer Pull do Código
```bash
cd /path/to/frontend
git fetch origin
git checkout main
git pull origin main
```

#### 4.2 Instalar Dependências
```bash
npm install --production
```

#### 4.3 Build de Produção
```bash
npm run build
```

#### 4.4 Verificar Build
```bash
ls -la .next/
# Deve ter pasta com build recente
```

#### 4.5 Reiniciar Frontend
```bash
pm2 restart frontend
# ou
systemctl restart frontend
```

### Etapa 5: Validação Pós-Deploy (T-10min)

#### 5.1 Health Check
```bash
# Backend
curl http://localhost:3000/api/health
# Deve retornar: {"status":"ok"}

# Frontend
curl http://localhost:3001/
# Deve retornar HTML
```

#### 5.2 Teste de Login (cada role)
```bash
# Usar ferramenta como Postman ou curl

# Admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"senha"}'

# Verificar resposta: deve ter role, level, permissoes
```

#### 5.3 Verificar Logs
```bash
# Backend
tail -f /var/log/backend-api/app.log | grep -i error

# Nginx/Frontend
tail -f /var/log/nginx/error.log
```

#### 5.4 Testes Funcionais Rápidos

**Via navegador**:
1. [ ] Login como Admin → Dashboard completo visível
2. [ ] Login como Supervisor → Módulos operacionais visíveis
3. [ ] Login como Operário → Redirecionamento para PWA
4. [ ] Testar criação de registro (grua, obra, etc.)
5. [ ] Testar aprovação de ponto (como Supervisor)

### Etapa 6: Desativar Modo Manutenção (T-0min)

```bash
# Remover arquivo de manutenção
rm /var/www/app/public/maintenance.html

# Ou restaurar nginx
sudo cp /etc/nginx/sites-available/production.conf /etc/nginx/sites-enabled/default
sudo nginx -s reload
```

### Etapa 7: Monitoramento (T+60min)

#### 7.1 Logs em Tempo Real
```bash
# Terminal 1: Backend
pm2 logs backend-api --lines 0

# Terminal 2: Frontend
pm2 logs frontend --lines 0

# Terminal 3: Nginx
tail -f /var/log/nginx/access.log
```

#### 7.2 Métricas

Monitorar por 1 hora:
- **Erros HTTP 4xx/5xx**: Devem ser < 1%
- **Tempo de resposta**: Deve ser igual ou MELHOR que antes
- **Taxa de login bem-sucedido**: Deve ser > 95%
- **Uso de CPU/RAM**: Não deve aumentar significativamente

#### 7.3 Feedback de Usuários

Contatar usuários-chave após 30min:
- [ ] Admin/Gestores conseguem acessar tudo?
- [ ] Supervisores conseguem aprovar ponto?
- [ ] Operários conseguem registrar ponto no PWA?
- [ ] Algum bloqueio inesperado?

## 🚨 Procedimento de Rollback

### Quando fazer Rollback?
- ❌ Muitos usuários não conseguem logar (>20%)
- ❌ Erros críticos no servidor (5xx >10%)
- ❌ Funcionalidade principal quebrada
- ❌ Perda de dados detectada

### Rollback Rápido (10 min)

#### 1. Banco de Dados
```bash
psql -h HOST -U USER -d DATABASE
\i backend-api/database/migrations/20250122_rollback_simplificar_perfis.sql
```

#### 2. Código
```bash
# Backend
cd /path/to/backend-api
git checkout v1.0.0  # Tag anterior
npm install
pm2 restart backend-api

# Frontend
cd /path/to/frontend
git checkout v1.0.0
npm install
npm run build
pm2 restart frontend
```

#### 3. Validar Rollback
```bash
# Testar login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"senha"}'

# Verificar resposta (deve estar no formato antigo)
```

#### 4. Notificar Equipe
- Enviar email/Slack notificando rollback
- Agendar nova tentativa de deploy
- Documentar problema encontrado

## 📊 Critérios de Sucesso

### Técnicos
- [x] Migration executada sem erros
- [x] 5 perfis principais criados
- [x] Nenhum usuário perdido
- [x] Backend reiniciado com sucesso
- [x] Frontend com build sem erros
- [x] Health checks passando
- [x] Logs sem erros críticos

### Funcionais
- [x] Login funcionando para todos os roles
- [x] Menus dinâmicos exibidos corretamente
- [x] Permissões funcionando (acesso permitido/negado correto)
- [x] PWA acessível para Operários e Clientes
- [x] Aprovações funcionando para Supervisores

### Performance
- [x] Tempo de login ≤ tempo anterior
- [x] Verificação de permissões instantânea
- [x] Uso de CPU/RAM estável ou reduzido

## 📞 Contatos de Emergência

### Equipe de Deploy
- **Tech Lead**: Nome - Tel: +55 (xx) xxxxx-xxxx
- **DBA**: Nome - Tel: +55 (xx) xxxxx-xxxx
- **DevOps**: Nome - Tel: +55 (xx) xxxxx-xxxx
- **Suporte**: suporte@empresa.com

### Escalonamento
1. **Nível 1**: Desenvolvedores de plantão
2. **Nível 2**: Tech Lead
3. **Nível 3**: CTO

## 📝 Pós-Deploy

### Imediatamente Após (D+0)
- [ ] Enviar email de conclusão para stakeholders
- [ ] Documentar problemas encontrados (se houver)
- [ ] Atualizar documentação com ajustes
- [ ] Agendar reunião de retrospectiva

### 24 horas Após (D+1)
- [ ] Revisar logs completos
- [ ] Gerar relatório de métricas
- [ ] Coletar feedback de usuários
- [ ] Ajustar configurações se necessário

### 1 semana Após (D+7)
- [ ] Análise de performance
- [ ] Reunião de retrospectiva
- [ ] Documentar lições aprendidas
- [ ] Planejar próximas melhorias

## 📎 Anexos

### Comandos Úteis

```bash
# Verificar usuários por perfil
psql -h HOST -U USER -d DATABASE -c "
SELECT p.nome, COUNT(up.usuario_id) as total_usuarios
FROM perfis p
LEFT JOIN usuario_perfis up ON p.id = up.perfil_id AND up.status = 'Ativa'
WHERE p.status = 'Ativo'
GROUP BY p.nome
ORDER BY p.nivel_acesso DESC;"

# Verificar permissões de um usuário específico
node -e "
const { getRolePermissions } = require('./backend-api/src/config/roles.js');
console.log(getRolePermissions('Supervisores'));
"

# Limpar cache do navegador (instruir usuários)
# Chrome: Ctrl+Shift+Delete
# Firefox: Ctrl+Shift+Delete
# Safari: Cmd+Option+E
```

---

**Última atualização**: 2025-01-22  
**Versão**: 1.0  
**Responsável**: Equipe de Desenvolvimento


