# 🔧 Detalhamento Técnico - Sistema de Horário de Almoço

**Data:** 28/02/2025  
**Objetivo:** Explicar de forma simples o que precisa ser desenvolvido

---

## 📱 O QUE O SISTEMA VAI FAZER (VISÃO DO USUÁRIO)

### Para o Operador (no celular/app):
1. **Às 11h40-11h50:** Recebe notificações de 3 formas:
   - 📱 **WhatsApp:** Mensagem no WhatsApp
   - 📧 **Email:** Email no e-mail cadastrado
   - 🔔 **App PWA:** Notificação no próprio aplicativo
2. **Clica em qualquer notificação:** Abre uma tela perguntando:
   - "Você terá horário de almoço ou será trabalho corrido?"
   - Botão 1: "Sim, vou parar para almoçar"
   - Botão 2: "Não, será trabalho corrido"
3. **Se escolher almoço:**
   - Às 12:00 → Sistema registra automaticamente "saiu para almoço"
   - Às 13:00 → Sistema registra automaticamente "voltou do almoço"
   - Operador não precisa fazer nada mais
4. **Se escolher trabalho corrido:**
   - Sistema marca que não vai ter almoço
   - No final do dia, encarregado precisa confirmar

### Para o Encarregado (no computador/dashboard):
1. **No final do dia:** Vê uma lista de funcionários que marcaram "trabalho corrido"
2. **Confirma ou não:** Clica em "Sim, confirmo trabalho corrido" ou "Não, teve almoço"
3. **Sistema calcula:** Se confirmar trabalho corrido, gera hora extra automaticamente

---

## 🛠️ O QUE PRECISA SER DESENVOLVIDO (PARTE TÉCNICA)

### 1. 📲 SISTEMA DE NOTIFICAÇÕES (WHATSAPP, EMAIL E APP)

**O que é:**
- Enviar notificação ao operador de 3 formas diferentes:
  1. **WhatsApp** - Mensagem no WhatsApp do operador
  2. **Email** - Email para o operador
  3. **Notificação no App PWA** - Notificação no próprio aplicativo

**O que precisa ser feito:**

**a) Notificação por WhatsApp:**
- Integrar com sistema de WhatsApp já existente (Evolution API)
- Criar mensagem: "Olá [Nome]! Você terá horário de almoço ou será trabalho corrido?"
- Enviar mensagem às 11h40-11h50
- Criar botões de resposta rápida no WhatsApp (se possível)

**b) Notificação por Email:**
- Usar sistema de email já existente (Nodemailer)
- Criar template de email com a pergunta
- Enviar email às 11h40-11h50
- Email pode ter link para responder no app

**c) Notificação no App PWA:**
- Configurar notificações push no navegador
- Criar Service Worker para receber notificações mesmo com app fechado
- Quando chegar 11h40-11h50, enviar notificação push
- Ao clicar na notificação, abrir app na tela de escolha

**d) Sistema de Agendamento:**
- Criar um "relógio inteligente" que verifica o horário
- Quando chegar 11h40-11h50, disparar as 3 notificações simultaneamente
- Verificar se operador já respondeu (evitar spam)

**Complexidade:** Média-Alta  
**Tempo:** 6-8 horas

---

### 2. ⏰ SISTEMA DE HORÁRIO AUTOMÁTICO

**O que é:**
- Sistema que "observa" o relógio e faz ações automaticamente
- Exemplo: Às 12:00, se o operador escolheu almoço, registra automaticamente

**O que precisa ser feito:**
- Criar um "relógio inteligente" que verifica o horário a cada minuto
- Quando chegar 12:00 → Salvar no banco "saiu para almoço"
- Quando chegar 13:00 → Salvar no banco "voltou do almoço"
- Só funciona se o operador escolheu "ter almoço"

**Complexidade:** Média  
**Tempo:** 3-4 horas

---

### 3. 📝 TELA DE ESCOLHA PARA O OPERADOR

**O que é:**
- Uma tela simples no app com 2 botões
- Operador escolhe: "Almoço" ou "Trabalho Corrido"

**O que precisa ser feito:**
- Criar uma tela/modal bonita e fácil de usar
- Quando clicar em um botão, salvar a escolha no banco de dados
- Mostrar confirmação visual (ex: "Registrado com sucesso!")

**Complexidade:** Baixa  
**Tempo:** 2-3 horas

---

### 4. 💾 BANCO DE DADOS (ARMAZENAR INFORMAÇÕES)

**O que é:**
- Adicionar novos "campos" na tabela de ponto eletrônico
- Exemplo: campo "teve_almoço" (sim/não), "trabalho_corrido" (sim/não)

**O que precisa ser feito:**
- Criar script para adicionar novos campos na tabela
- Garantir que os dados antigos não sejam perdidos
- Testar se tudo continua funcionando

**Complexidade:** Baixa  
**Tempo:** 1-2 horas

---

### 5. 🖥️ TELA PARA O ENCARREGADO CONFIRMAR

**O que é:**
- Uma página no dashboard (computador) mostrando lista de funcionários
- Encarregado vê quem marcou "trabalho corrido" e confirma

**O que precisa ser feito:**
- Criar uma página nova no sistema
- Mostrar lista: "João - Trabalho Corrido - [Confirmar]"
- Botão de confirmar salva no banco
- Atualizar a lista automaticamente

**Complexidade:** Média  
**Tempo:** 4-5 horas

---

### 6. 🧮 CÁLCULO DE HORA EXTRA AUTOMÁTICO

**O que é:**
- Sistema já calcula horas trabalhadas
- Agora precisa calcular hora extra quando houver trabalho corrido

**O que precisa ser feito:**
- Atualizar a fórmula de cálculo
- Se trabalho corrido confirmado → Adicionar 1 hora extra (obrigatório parar para almoço)
- Mostrar no relatório final

**Complexidade:** Média  
**Tempo:** 3-4 horas

---

### 7. ✅ TESTES E AJUSTES

**O que é:**
- Testar tudo funcionando junto
- Garantir que não quebrou nada que já existia

**O que precisa ser feito:**
- Testar notificação chegando no horário certo
- Testar horário automático funcionando
- Testar encarregado confirmando
- Testar cálculo de hora extra
- Corrigir qualquer problema encontrado

**Complexidade:** Média  
**Tempo:** 4-6 horas

---

## 📊 RESUMO DO DESENVOLVIMENTO

| Item | O Que Faz | Tempo Estimado |
|------|-----------|----------------|
| 1. Notificações (WhatsApp, Email, PWA) | Envia notificação 11h40-11h50 por 3 canais | 6-8 horas |
| 2. Horário automático | Registra almoço às 12h e 13h automaticamente | 3-4 horas |
| 3. Tela de escolha | Operador escolhe almoço ou trabalho corrido | 2-3 horas |
| 4. Banco de dados | Adiciona novos campos para armazenar | 1-2 horas |
| 5. Tela do encarregado | Encarregado confirma trabalho corrido | 4-5 horas |
| 6. Cálculo hora extra | Calcula hora extra quando trabalho corrido | 3-4 horas |
| 7. Testes | Testa tudo funcionando | 4-6 horas |
| **TOTAL** | | **23-31 horas** |

---

## 🎯 EXEMPLO DE FLUXO COMPLETO

### Cenário 1: Operador escolhe ter almoço

1. **11h45** → Operador recebe notificações (WhatsApp, Email e App)
2. **11h46** → Operador clica em qualquer notificação e escolhe "Sim, vou parar para almoçar"
3. **12h00** → Sistema registra automaticamente "saiu para almoço"
4. **13h00** → Sistema registra automaticamente "voltou do almoço"
5. **17h00** → Operador registra saída normalmente
6. **Resultado:** Sistema calcula 8 horas trabalhadas (descontando 1h de almoço)

### Cenário 2: Operador escolhe trabalho corrido

1. **11h45** → Operador recebe notificações (WhatsApp, Email e App)
2. **11h46** → Operador clica em qualquer notificação e escolhe "Não, será trabalho corrido"
3. **12h00** → Sistema NÃO registra almoço (trabalho corrido)
4. **17h00** → Operador registra saída normalmente
5. **18h00** → Encarregado acessa sistema e vê: "João - Trabalho Corrido - [Confirmar]"
6. **18h01** → Encarregado clica em "Confirmar"
7. **Resultado:** Sistema calcula 8 horas trabalhadas + 1 hora extra (porque não parou para almoço)

---

## ⚙️ TECNOLOGIAS QUE SERÃO USADAS

- **Notificações WhatsApp:** Evolution API (já integrado no sistema)
- **Notificações Email:** Nodemailer (já integrado no sistema)
- **Notificações PWA:** Service Worker + Push API (tecnologia padrão de navegadores)
- **Horário Automático:** JavaScript com verificação periódica
- **Banco de Dados:** PostgreSQL (já usado no sistema)
- **Interface:** React/Next.js (já usado no sistema)
- **Backend:** Node.js/Express (já usado no sistema)

**Observação:** Todas as tecnologias já são usadas no sistema atual, então não há necessidade de aprender nada novo. A integração com WhatsApp e Email já existe, apenas precisamos criar a lógica específica para o horário de almoço.

---

## 🔒 GARANTIAS

- ✅ Não vai quebrar nada que já existe
- ✅ Dados antigos serão preservados
- ✅ Funciona mesmo se o celular estiver em segundo plano
- ✅ Funciona mesmo se o app estiver fechado (notificações)
- ✅ Testado antes de entregar

---

## 📅 CRONOGRAMA SUGERIDO

**Semana 1:**
- Dia 1-2: Sistema de notificações (WhatsApp, Email, PWA)
- Dia 3: Horário automático
- Dia 4-5: Telas (operador e encarregado)

**Semana 2:**
- Dia 1: Banco de dados e integração
- Dia 2-3: Cálculo de hora extra
- Dia 4-5: Testes completos e ajustes finais

**Total:** 10 dias úteis (2 semanas)

---

## 💡 DÚVIDAS FREQUENTES

**P: E se o operador não receber a notificação?**  
R: O sistema envia por 3 canais (WhatsApp, Email e App), aumentando as chances de receber. Além disso, pode ter um botão manual no app para escolher almoço/trabalho corrido.

**P: E se o celular estiver sem internet?**  
R: O sistema salva localmente e sincroniza quando voltar a internet. As notificações por WhatsApp e Email serão enviadas quando houver conexão.

**P: E se o encarregado não confirmar?**  
R: O sistema pode ter uma regra: se não confirmar em X horas, considera como "teve almoço" por padrão.

**P: Funciona em todos os celulares?**  
R: Sim! WhatsApp funciona em qualquer celular com WhatsApp instalado. Email funciona em qualquer dispositivo. Notificação PWA funciona em Android e iPhone, desde que o navegador suporte notificações (Chrome, Safari, etc).

**P: O WhatsApp precisa estar conectado?**  
R: Sim, o sistema usa a Evolution API que já está configurada. O operador precisa ter WhatsApp instalado e o número cadastrado no sistema.

---

**Documento criado em:** 28/02/2025  
**Versão:** 1.0

