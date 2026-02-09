# 🔍 Como Verificar se o Servidor está Rodando e os Jobs Estão Ativos

## 📋 Métodos de Verificação

### 1️⃣ **Método Rápido - Script Automático**

Execute o script de verificação:

```bash
cd backend-api
node verificar-servidor.js
```

**No servidor (IP: 72.60.60.118):**
```bash
# Script shell simples
bash verificar-servidor-ip.sh

# Ou verificar diretamente
curl http://72.60.60.118:3001/health
```

Este script verifica:
- ✅ Se o servidor está respondendo
- ✅ Se há processos rodando na porta 3001
- ✅ Informações sobre agendamento dos jobs
- ✅ Instruções para teste manual

---

### 2️⃣ **Método Manual - Health Check**

Acesse no navegador ou via curl:

```bash
# No navegador
http://localhost:3001/health

# Via curl
curl http://localhost:3001/health
```

**Resposta esperada:**
```json
{
  "status": "OK",
  "timestamp": "2026-02-09T...",
  "version": "1.0.0",
  "environment": "development"
}
```

✅ **Se retornar OK**: Servidor está rodando  
❌ **Se der erro**: Servidor não está rodando

---

### 3️⃣ **Verificar Logs do Servidor**

Quando o servidor inicia corretamente, você deve ver estas mensagens nos logs:

```
[scheduler] Inicializando jobs automáticos...
[scheduler] 🚀 Job de notificações de almoço iniciado
[scheduler] ⏰ Agendado para executar diariamente às 11h50
[scheduler] 🚀 Job de almoço automático iniciado
[scheduler] ⏰ Agendado para executar diariamente às 12h00
[scheduler] ✓ Jobs agendados com sucesso:
  - Cancelar aprovações vencidas: diariamente às 00:00
  - Enviar lembretes: diariamente às 09:00
  - Notificações de almoço: diariamente às 11:50
  - Registrar almoço automático: diariamente às 12:00
```

✅ **Se aparecerem essas mensagens**: Jobs estão ativos  
❌ **Se não aparecerem**: Jobs não foram iniciados

---

### 4️⃣ **Verificar Processo na Porta**

#### macOS/Linux:
```bash
lsof -ti:3001
# ou
lsof -i:3001
```

#### Windows:
```powershell
netstat -ano | findstr :3001
```

✅ **Se retornar um PID**: Servidor está rodando  
❌ **Se não retornar nada**: Servidor não está rodando

---

### 5️⃣ **Testar Job Manualmente (Antes do Horário)**

Para testar o job de notificações de almoço ANTES das 11h50:

```bash
cd backend-api
node -e "import('./src/services/almoco-automatico-service.js').then(m => m.enviarNotificacoesAlmoco().then(r => console.log(JSON.stringify(r, null, 2))).catch(e => console.error(e)))"
```

**Resposta esperada:**
```json
{
  "sucesso": true,
  "enviados": 2,
  "erros": []
}
```

---

## 🕐 Horários dos Jobs

| Job | Horário | Descrição |
|-----|---------|-----------|
| **Notificações de Almoço** | 11:50 | Envia notificações para funcionários |
| **Almoço Automático** | 12:00 | Registra almoço para quem não respondeu |
| **Lembretes de Aprovações** | 09:00 | Envia lembretes de aprovações pendentes |
| **Cancelar Aprovações Vencidas** | 00:00 | Cancela aprovações com mais de 7 dias |

**⚠️ Importante:** Os horários são no fuso horário de **Brasília (America/Sao_Paulo)**

---

## ✅ Checklist de Verificação

Marque cada item conforme verificar:

- [ ] Servidor responde em `http://localhost:3001/health`
- [ ] Logs mostram mensagens de inicialização dos jobs
- [ ] Processo está rodando na porta 3001
- [ ] Hora atual está correta (verificar timezone)
- [ ] Funcionários têm `usuario_id` vinculado (para notificação no app)
- [ ] Funcionários têm telefone cadastrado (para notificação WhatsApp)

---

## 🐛 Problemas Comuns

### ❌ Servidor não inicia

**Sintomas:**
- Porta 3001 já está em uso
- Erro ao iniciar

**Solução:**
```bash
# Verificar o que está usando a porta
lsof -ti:3001

# Matar o processo (substitua PID pelo número retornado)
kill -9 PID

# Ou matar todos os processos Node
pkill -f node

# Reiniciar o servidor
cd backend-api
npm start
```

---

### ❌ Jobs não executam

**Sintomas:**
- Não aparecem mensagens de inicialização nos logs
- Notificações não são enviadas no horário

**Solução:**
1. Verificar se o servidor foi iniciado corretamente
2. Verificar logs para erros
3. Verificar timezone do servidor
4. Testar job manualmente (método 5)

---

### ❌ Notificações não chegam

**Sintomas:**
- Job executa mas funcionários não recebem

**Verificar:**
1. Funcionário tem entrada registrada hoje?
2. Funcionário já registrou saída de almoço?
3. Funcionário já recebeu notificação hoje?
4. Funcionário tem `usuario_id` (para app) e telefone (para WhatsApp)?
5. WhatsApp está configurado corretamente?

---

## 📞 Teste Completo

Para fazer um teste completo:

1. **Iniciar servidor:**
   ```bash
   cd backend-api
   npm start
   ```

2. **Verificar inicialização:**
   - Ver logs para mensagens de jobs
   - Executar `node verificar-servidor.js`

3. **Registrar entrada de ponto:**
   - Acesse o app PWA
   - Registre entrada de ponto

4. **Aguardar ou testar manualmente:**
   - Aguardar até 11h50, OU
   - Executar teste manual (método 5)

5. **Verificar recebimento:**
   - WhatsApp: Verificar mensagem recebida
   - App: Verificar notificação push (se tiver `usuario_id`)

---

## 📝 Logs Importantes

Fique atento a estes logs durante a execução:

**Inicialização:**
```
[scheduler] Inicializando jobs automáticos...
[scheduler] 🚀 Job de notificações de almoço iniciado
```

**Execução (11h50):**
```
[scheduler] 🍽️ Executando job: enviar notificações de almoço
[almoco-automatico] 🚀 Iniciando envio de notificações de almoço...
[almoco-automatico] ✅ Notificação enviada para [Nome do Funcionário]
[almoco-automatico] ✅ Notificação criada no app para [Nome do Funcionário]
[almoco-automatico] ✅ Notificação WebSocket emitida para [Nome do Funcionário]
```

**Execução (12h00):**
```
[scheduler] 🍽️ Executando job: registrar almoço automático
[almoco-automatico] 🍽️ Registrando almoço automático
```

---

## 🎯 Resumo Rápido

**Para verificar rapidamente:**

1. ✅ `curl http://localhost:3001/health` → Deve retornar `{"status":"OK"}`
2. ✅ Verificar logs → Deve ter mensagens de inicialização dos jobs
3. ✅ `node verificar-servidor.js` → Script completo de verificação

**Se tudo estiver OK:**
- Servidor está rodando ✅
- Jobs estão agendados ✅
- Notificações serão enviadas automaticamente às 11h50 ✅
