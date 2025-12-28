# Análise dos Logs PM2 - Servidor VPS

**Data da Análise:** 24/12/2025  
**IP do Servidor:** 72.60.60.118  
**Sistema:** Ubuntu 25.04

---

## 🚨 ALERTA CRÍTICO DE SEGURANÇA

### ⚠️ SERVIDOR COMPROMETIDO

**PROBLEMA CRÍTICO:** O servidor mostra evidências de comprometimento:

```
==========================================
          This Server Bruted BY
           t.me/freesshs
==========================================
```

**Ações Imediatas Necessárias:**

1. **🔴 URGENTE - Mudar todas as senhas:**
   - Senha do usuário root
   - Senhas de todos os usuários do sistema
   - Chaves SSH
   - Credenciais do banco de dados
   - Tokens de API

2. **🔴 URGENTE - Verificar processos suspeitos:**
   ```bash
   # Verificar processos ativos
   ps aux | grep -v "\[.*\]"
   
   # Verificar processos na porta 3000
   lsof -i :3000
   
   # Verificar conexões de rede suspeitas
   netstat -tulpn | grep ESTABLISHED
   ```

3. **🔴 URGENTE - Verificar arquivos modificados recentemente:**
   ```bash
   # Arquivos modificados nas últimas 24h
   find / -type f -mtime -1 -ls 2>/dev/null | head -50
   
   # Verificar arquivos de configuração
   ls -la /root/.ssh/
   ls -la /etc/ssh/
   ```

4. **🔴 URGENTE - Verificar cron jobs suspeitos:**
   ```bash
   crontab -l
   cat /etc/crontab
   ls -la /etc/cron.d/
   ls -la /var/spool/cron/
   ```

5. **🔴 URGENTE - Verificar usuários do sistema:**
   ```bash
   cat /etc/passwd
   cat /etc/shadow
   ```

6. **Recomendação:** Considerar migrar para um novo servidor limpo e restaurar apenas os dados necessários.

---

## ⚠️ PROBLEMAS TÉCNICOS IDENTIFICADOS

### 1. Processos Zumbis (Zombie Processes)

**Problema:**
```
=> There are 37 zombie processes.
```

**Impacto:** Alto consumo de recursos e possível instabilidade do sistema.

**Solução:**
```bash
# Identificar processos zumbis
ps aux | awk '$8 ~ /^Z/ { print $2 }'

# Verificar processos órfãos
ps -eo pid,ppid,stat,comm | grep -E '^[[:space:]]*[0-9]+[[:space:]]+1[[:space:]]+Z'

# Reiniciar serviços que podem estar causando o problema
pm2 restart all
systemctl restart systemd-resolved  # Se aplicável
```

---

### 2. Problema no PM2 - Processo Frontend

**Problema:**
```
PM2 log: pid=995403 msg=failed to kill - retrying in 100ms
PM2 log: Process with pid 995403 still alive after 1600ms, sending it SIGKILL now...
PM2 log: App [front:1] exited with code [0] via signal [SIGKILL]
```

**Análise:**
- O processo frontend não está respondendo ao SIGTERM corretamente
- PM2 precisa usar SIGKILL para forçar o encerramento
- Isso pode indicar que o processo está travado ou não está tratando sinais corretamente

**Solução:**
```bash
# Verificar configuração do PM2
pm2 describe front

# Verificar se há processos órfãos
ps aux | grep "next\|node" | grep -v grep

# Limpar e reiniciar
pm2 delete front
pm2 start ecosystem.config.js --only front
pm2 save
```

**Verificar configuração do ecosystem.config.js:**
- Garantir que `kill_timeout` está configurado adequadamente
- Verificar se o processo está usando o modo standalone corretamente

---

### 3. Erros no Backend - Usuários Não Encontrados

**Problema:**
```
[criarNotificacaoLembrete] Usuário 11 não encontrado na tabela usuarios
[criarNotificacaoLembrete] Usuário 101 não encontrado na tabela usuarios
[criarNotificacaoLembrete] Usuário 4 não encontrado na tabela usuarios
```

**Análise:**
- A função `criarNotificacaoLembrete` está tentando criar notificações para usuários que não existem
- Isso pode indicar:
  1. Dados inconsistentes entre tabelas `funcionarios` e `usuarios`
  2. IDs de funcionários sendo usados como IDs de usuários
  3. Registros órfãos no banco de dados

**Localização do Código:**
- Arquivo: `backend-api/src/utils/notificacoes.js`
- Função: `criarNotificacaoLembrete` (linhas 151-202)

**Solução:**
1. **Verificar dados no banco:**
   ```sql
   -- Verificar se os IDs existem em funcionarios mas não em usuarios
   SELECT f.id, f.nome, f.usuario_id 
   FROM funcionarios f 
   WHERE f.id IN (4, 11, 101);
   
   -- Verificar se há funcionários sem usuario_id vinculado
   SELECT f.id, f.nome, f.usuario_id, u.id as usuario_existe
   FROM funcionarios f
   LEFT JOIN usuarios u ON u.funcionario_id = f.id
   WHERE f.id IN (4, 11, 101);
   ```

2. **Corrigir código (já implementado, mas verificar):**
   - O código já tem validação para verificar se o usuário existe antes de criar notificação
   - O problema pode ser que `gestor.usuario_id` não está sendo retornado corretamente

3. **Verificar função `buscarGestoresPorObra`:**
   - Garantir que retorna `usuario_id` ou `user_id` no select
   - Verificar se está fazendo join correto com a tabela `usuarios`

**Ação Recomendada:**
- Limpar registros órfãos do banco de dados
- Verificar integridade referencial entre `funcionarios` e `usuarios`
- Adicionar logs mais detalhados para identificar a origem do problema

---

### 4. Avisos WhatsApp Service - Configuração Não Encontrada

**Problema:**
```
[whatsapp-service] ⚠️ Nenhuma instância WhatsApp encontrada no banco
[whatsapp-service] ⚠️ Configuração Evolution API não encontrada - enviando sem instance_name e apikey
[whatsapp-service] ⚠️ Verifique se existe instância WhatsApp e API key configurada
```

**Análise:**
- O sistema está tentando enviar notificações via WhatsApp
- Mas não encontra configuração da Evolution API no banco de dados
- Isso é um aviso, não um erro crítico (o sistema continua funcionando)

**Localização do Código:**
- Arquivo: `backend-api/src/services/whatsapp-service.js`
- Função: `buscarConfiguracaoEvolutionAPI` (linhas 12-79)

**Solução:**
1. **Se WhatsApp não é necessário:**
   - Pode ignorar esses avisos (são apenas warnings)
   - O sistema funciona normalmente sem WhatsApp

2. **Se WhatsApp é necessário:**
   ```sql
   -- Verificar se existe instância WhatsApp
   SELECT * FROM whatsapp_instances;
   
   -- Verificar se existe API key
   SELECT * FROM system_config WHERE key = 'evolution_api_key';
   ```

3. **Configurar WhatsApp (se necessário):**
   - Acessar painel admin → Configurações → Evolution API
   - Criar instância WhatsApp
   - Configurar API key

**Ação Recomendada:**
- Se WhatsApp não é usado, considerar desabilitar os avisos ou torná-los menos verbosos
- Se WhatsApp é usado, configurar corretamente no banco de dados

---

### 5. Aviso CORS em Desenvolvimento

**Problema:**
```
⚠️  CORS: Origin http://72.60.60.118:3000 não está na lista, mas permitindo em desenvolvimento
```

**Análise:**
- O backend está permitindo requisições de um origin não configurado
- Isso pode ser um problema de segurança em produção

**Solução:**
1. **Verificar variável de ambiente:**
   ```bash
   # No backend-api/.env
   CORS_ORIGIN=http://72.60.60.118:3000,https://seu-dominio.com
   NODE_ENV=production
   ```

2. **Verificar código de CORS no backend:**
   - Garantir que em produção não permite origins não listados
   - Verificar se `NODE_ENV` está configurado corretamente

**Ação Recomendada:**
- Configurar `CORS_ORIGIN` corretamente no `.env` do backend
- Garantir que `NODE_ENV=production` está definido

---

### 6. Acessos de Scanners Externos

**Problema:**
```
66.132.153.143 - - [24/Dec/2025:12:46:10 +0000] "GET /favicon.ico HTTP/1.1" 404 69
66.132.153.143 - - [24/Dec/2025:12:46:18 +0000] "GET / HTTP/1.1" 200 218
66.132.153.143 - - [24/Dec/2025:12:46:25 +0000] "GET /robots.txt HTTP/1.1" 404 68
User-Agent: "Mozilla/5.0 (compatible; CensysInspect/1.1; +https://about.censys.io/)"
```

**Análise:**
- Scanner Censys está fazendo requisições ao servidor
- Isso é normal na internet (scanners de vulnerabilidades)
- Não é necessariamente um ataque, mas indica que o servidor está exposto

**Solução:**
1. **Configurar firewall:**
   ```bash
   # Bloquear IPs suspeitos (opcional)
   ufw deny from 66.132.153.143
   
   # Ou usar fail2ban para bloquear automaticamente
   apt install fail2ban
   ```

2. **Usar Cloudflare ou similar:**
   - Colocar servidor atrás de um proxy reverso
   - Ocultar IP real do servidor
   - Proteção DDoS automática

**Ação Recomendada:**
- Configurar firewall adequadamente
- Considerar usar Cloudflare ou similar para proteção

---

## ✅ STATUS ATUAL DOS SERVIÇOS

### Frontend (PM2)
- **Status:** ✅ Online
- **Porta:** 3000
- **Último restart:** 23/12/2025 16:44:43
- **Tempo de inicialização:** ~1565ms
- **Problema:** Precisa usar SIGKILL para encerrar (não crítico)

### Backend (PM2)
- **Status:** ✅ Online
- **Porta:** 3001 (assumido)
- **Última atividade:** 24/12/2025 17:42:18
- **Login bem-sucedido:** admin@admin.com
- **Problemas:** 
  - Usuários não encontrados (IDs 11, 101, 4)
  - WhatsApp não configurado (apenas aviso)

---

## 📋 CHECKLIST DE AÇÕES RECOMENDADAS

### 🔴 Crítico (Fazer Imediatamente)
- [ ] Mudar todas as senhas do servidor
- [ ] Verificar processos suspeitos
- [ ] Verificar arquivos modificados
- [ ] Verificar cron jobs
- [ ] Verificar usuários do sistema
- [ ] Considerar migrar para servidor limpo

### 🟡 Importante (Fazer em Breve)
- [ ] Resolver processos zumbis (37 processos)
- [ ] Corrigir problema de encerramento do frontend no PM2
- [ ] Verificar e corrigir dados inconsistentes (usuários 4, 11, 101)
- [ ] Configurar CORS corretamente em produção
- [ ] Configurar firewall adequadamente

### 🟢 Melhorias (Opcional)
- [ ] Configurar WhatsApp se necessário
- [ ] Reduzir verbosidade dos logs de WhatsApp
- [ ] Configurar Cloudflare ou similar
- [ ] Implementar monitoramento de segurança

---

## 🔧 COMANDOS ÚTEIS PARA DIAGNÓSTICO

```bash
# Status do PM2
pm2 status
pm2 logs --lines 50

# Verificar processos
ps aux | grep -E "node|next|pm2"
lsof -i :3000
lsof -i :3001

# Verificar uso de recursos
htop
df -h
free -h

# Verificar logs do sistema
journalctl -u pm2 -n 50
dmesg | tail -50

# Verificar conexões de rede
netstat -tulpn | grep LISTEN
ss -tulpn | grep LISTEN

# Verificar processos zumbis
ps aux | awk '$8 ~ /^Z/ { print }'

# Verificar integridade do sistema
rkhunter --check
chkrootkit
```

---

## 📝 NOTAS ADICIONAIS

1. **Sistema Operacional:**
   - Ubuntu 25.04 (versão muito recente, pode ter bugs)
   - 58 atualizações pendentes
   - Nova versão disponível (25.10)

2. **Recursos do Servidor:**
   - Uso de disco: 12.9% de 192.85GB ✅
   - Uso de memória: 14% ✅
   - Uso de swap: 1% ✅
   - Load average: 0.19 ✅

3. **Recomendações Gerais:**
   - Fazer backup completo antes de qualquer mudança
   - Documentar todas as alterações
   - Monitorar logs após correções
   - Considerar usar Docker para isolar aplicações

---

**Documento criado em:** 24/12/2025  
**Próxima revisão recomendada:** Após correção dos problemas críticos de segurança

