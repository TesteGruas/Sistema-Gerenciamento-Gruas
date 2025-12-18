# ⏰ Como Funciona o Agendamento de Notificações de Almoço

**Data:** 28/02/2025  
**Objetivo:** Explicar como implementar o sistema de agendamento

---

## ✅ BOA NOTÍCIA: NÃO PRECISA DE CRON NA VPS!

O sistema **já usa `node-cron`** que funciona **dentro do processo Node.js**. Não é necessário configurar cron na VPS.

---

## 🔧 COMO FUNCIONA ATUALMENTE

### Sistema Já Implementado

O sistema já tem um arquivo `backend-api/src/jobs/scheduler.js` que gerencia jobs automáticos:

```javascript
// Exemplo do que já existe:
cron.schedule('0 9 * * *', async () => {
  // Executa todo dia às 09:00
  await enviarLembretesAprovacoes();
}, {
  scheduled: true,
  timezone: 'America/Sao_Paulo'
});
```

**Jobs atuais:**
- ✅ Cancelar aprovações vencidas: diariamente às 00:00
- ✅ Enviar lembretes: diariamente às 09:00

---

## 🆕 O QUE PRECISA SER ADICIONADO

### 1. Job para Enviar Notificações (11h40-11h50)

**Arquivo:** `backend-api/src/jobs/enviar-notificacoes-almoco.js` (NOVO)

```javascript
import cron from 'node-cron';
import { enviarNotificacoesAlmoco } from '../services/notificacoes-almoco.js';

// Executa todo dia às 11h40, 11h45, 11h50
// Envia notificações para operadores que ainda não responderam
const jobNotificacoes = cron.schedule('40,45,50 11 * * *', async () => {
  console.log('[scheduler] Executando job: enviar notificações de almoço');
  try {
    await enviarNotificacoesAlmoco();
  } catch (error) {
    console.error('[scheduler] Erro no job notificações almoço:', error);
  }
}, {
  scheduled: true,
  timezone: 'America/Sao_Paulo'
});

export { jobNotificacoes };
```

**Explicação:**
- `'40,45,50 11 * * *'` = Executa às 11h40, 11h45 e 11h50
- Envia notificações por WhatsApp, Email e PWA
- Verifica se operador já respondeu (evita spam)

---

### 2. Job para Registrar Almoço Automático (12:00)

**Arquivo:** `backend-api/src/jobs/registrar-almoco-automatico.js` (NOVO)

```javascript
import cron from 'node-cron';
import { registrarAlmocoAutomatico } from '../services/ponto-eletronico-almoco.js';

// Executa todo dia às 12:00
// Registra "saiu para almoço" para operadores que escolheram ter almoço
const jobAlmoco = cron.schedule('0 12 * * *', async () => {
  console.log('[scheduler] Executando job: registrar almoço automático');
  try {
    await registrarAlmocoAutomatico();
  } catch (error) {
    console.error('[scheduler] Erro no job almoço:', error);
  }
}, {
  scheduled: true,
  timezone: 'America/Sao_Paulo'
});

export { jobAlmoco };
```

**Explicação:**
- `'0 12 * * *'` = Executa todo dia às 12:00
- Busca operadores que escolheram "ter almoço" e ainda não saíram
- Registra automaticamente "saiu para almoço"

---

### 3. Job para Registrar Volta do Almoço (13:00)

**Arquivo:** `backend-api/src/jobs/registrar-volta-almoco.js` (NOVO)

```javascript
import cron from 'node-cron';
import { registrarVoltaAlmoco } from '../services/ponto-eletronico-almoco.js';

// Executa todo dia às 13:00
// Registra "voltou do almoço" para operadores que saíram para almoçar
const jobVoltaAlmoco = cron.schedule('0 13 * * *', async () => {
  console.log('[scheduler] Executando job: registrar volta do almoço');
  try {
    await registrarVoltaAlmoco();
  } catch (error) {
    console.error('[scheduler] Erro no job volta almoço:', error);
  }
}, {
  scheduled: true,
  timezone: 'America/Sao_Paulo'
});

export { jobVoltaAlmoco };
```

**Explicação:**
- `'0 13 * * *'` = Executa todo dia às 13:00
- Busca operadores que saíram para almoço às 12:00
- Registra automaticamente "voltou do almoço"

---

## 📝 COMO ADICIONAR NO SCHEDULER

### Atualizar `backend-api/src/jobs/scheduler.js`

```javascript
import cron from 'node-cron';
import { cancelarAprovacoesVencidas } from './cancelar-aprovacoes-vencidas.js';
import { enviarLembretesAprovacoes } from './enviar-lembretes-aprovacoes.js';
// NOVOS IMPORTS
import { jobNotificacoes } from './enviar-notificacoes-almoco.js';
import { jobAlmoco } from './registrar-almoco-automatico.js';
import { jobVoltaAlmoco } from './registrar-volta-almoco.js';

function inicializarScheduler() {
  console.log('[scheduler] Inicializando jobs automáticos...');

  // Jobs existentes...
  const jobCancelar = cron.schedule('0 0 * * *', async () => {
    // ... código existente
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
  });

  const jobLembretes = cron.schedule('0 9 * * *', async () => {
    // ... código existente
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
  });

  // NOVOS JOBS - Iniciar automaticamente
  jobNotificacoes.start();
  jobAlmoco.start();
  jobVoltaAlmoco.start();

  console.log('[scheduler] ✓ Jobs agendados com sucesso:');
  console.log('  - Cancelar aprovações vencidas: diariamente às 00:00');
  console.log('  - Enviar lembretes: diariamente às 09:00');
  console.log('  - Notificações de almoço: diariamente às 11h40, 11h45, 11h50');
  console.log('  - Registrar almoço automático: diariamente às 12:00');
  console.log('  - Registrar volta do almoço: diariamente às 13:00');

  return {
    jobCancelar,
    jobLembretes,
    jobNotificacoes,
    jobAlmoco,
    jobVoltaAlmoco
  };
}
```

---

## 🎯 VANTAGENS DO NODE-CRON

### ✅ Por que usar node-cron (não cron da VPS)?

1. **Roda dentro do Node.js**
   - Não precisa configurar nada na VPS
   - Funciona automaticamente quando o servidor inicia

2. **Fácil de gerenciar**
   - Todo código em um lugar só
   - Fácil de testar e debugar
   - Logs aparecem junto com o servidor

3. **Timezone configurado**
   - Já está configurado para `America/Sao_Paulo`
   - Não precisa se preocupar com fuso horário

4. **Reinicia automaticamente**
   - Se o servidor reiniciar, os jobs continuam funcionando
   - Não precisa recriar cron jobs

---

## ⚠️ IMPORTANTE: SERVIDOR PRECISA ESTAR RODANDO

### Requisito

Os jobs **só funcionam se o servidor Node.js estiver rodando**.

**Se o servidor parar:**
- ❌ Jobs não executam
- ❌ Notificações não são enviadas
- ❌ Almoço automático não registra

**Solução:**
- Usar PM2 ou similar para manter servidor sempre rodando
- Configurar auto-restart se servidor cair

---

## 🔄 ALTERNATIVA: CRON NA VPS (Opcional)

Se preferir usar cron da VPS (não recomendado, mas possível):

### Opção 1: Chamar Endpoint HTTP

**Cron na VPS:**
```bash
# Executar todo dia às 11h40, 11h45, 11h50
40,45,50 11 * * * curl -X POST http://localhost:3000/api/jobs/enviar-notificacoes-almoco

# Executar todo dia às 12:00
0 12 * * * curl -X POST http://localhost:3000/api/jobs/registrar-almoco

# Executar todo dia às 13:00
0 13 * * * curl -X POST http://localhost:3000/api/jobs/registrar-volta-almoco
```

**Endpoint no backend:**
```javascript
router.post('/jobs/enviar-notificacoes-almoco', async (req, res) => {
  await enviarNotificacoesAlmoco();
  res.json({ success: true });
});
```

**Desvantagens:**
- Precisa configurar cron na VPS
- Precisa criar endpoints específicos
- Mais complexo de manter
- Se servidor estiver parado, cron falha silenciosamente

---

## 📊 RESUMO

| Método | Vantagens | Desvantagens |
|--------|-----------|--------------|
| **node-cron** (Recomendado) | ✅ Roda automaticamente<br>✅ Fácil de gerenciar<br>✅ Timezone configurado<br>✅ Logs integrados | ⚠️ Precisa servidor rodando |
| **Cron VPS** | ✅ Funciona mesmo se Node.js parar | ❌ Mais complexo<br>❌ Precisa configurar VPS<br>❌ Logs separados |

---

## ✅ RECOMENDAÇÃO FINAL

**Usar `node-cron`** (já está no sistema):
- ✅ Mais simples
- ✅ Já está funcionando
- ✅ Fácil de manter
- ✅ Logs integrados

**Garantir que servidor está sempre rodando:**
- Usar PM2 ou similar
- Configurar auto-restart
- Monitorar logs

---

**Documento criado em:** 28/02/2025  
**Versão:** 1.0



