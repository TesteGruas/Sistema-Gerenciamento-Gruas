# 🧪 Guia Prático - Testar Notificações no Painel

Um guia visual e prático para testar o módulo de notificações diretamente no dashboard.

---

## 📋 Pré-requisitos

Antes de começar os testes:

- [ ] Backend rodando (`npm start` em `backend-api/`)
- [ ] Frontend rodando (`npm run dev` na raiz)
- [ ] Migration aplicada no banco de dados
- [ ] Usuário admin criado

---

## 🚀 PASSO 1: Aplicar Migration no Supabase

### Opção A: Via Dashboard (Recomendado)

1. **Acessar Supabase Dashboard**
   - Ir para: https://supabase.com/dashboard
   - Login no projeto

2. **Abrir SQL Editor**
   - Menu lateral → **SQL Editor**
   - Clicar em **New query**

3. **Copiar e Executar Migration**
   ```sql
   -- Copiar TODO o conteúdo de:
   -- backend-api/database/migrations/20250111_create_notificacoes.sql
   ```
   
   - Colar no editor
   - Clicar em **Run** (Ctrl/Cmd + Enter)
   - Verificar mensagem: ✅ "Success. No rows returned"

4. **Verificar Tabela Criada**
   - Menu lateral → **Table Editor**
   - Procurar tabela: `notificacoes`
   - Deve aparecer na lista ✅

### Opção B: Via CLI (Alternativa)

```bash
# Se tiver acesso direto ao PostgreSQL
psql -U postgres -d seu_banco -f backend-api/database/migrations/20250111_create_notificacoes.sql
```

---

## 🖥️ PASSO 2: Iniciar Servidores

### Backend

```bash
# Terminal 1
cd backend-api
npm start

# Aguardar mensagem:
# 🚀 Servidor rodando na porta 3001
# ✅ Backend está pronto!
```

### Frontend

```bash
# Terminal 2 (novo terminal)
npm run dev

# Aguardar mensagem:
# ✓ Ready in X seconds
# ○ Local: http://localhost:3000
# ✅ Frontend está pronto!
```

---

## 🔐 PASSO 3: Login no Sistema

1. **Abrir navegador**
   - Acessar: `http://localhost:3000`

2. **Fazer login**
   - Email: seu_email_admin@example.com
   - Senha: sua_senha
   - Clicar em **Entrar**

3. **Verificar autenticação**
   - Deve redirecionar para `/dashboard`
   - Ver menu lateral com opções
   - ✅ Login realizado com sucesso!

---

## 🔔 PASSO 4: Testar Dropdown de Notificações

### 4.1 Verificar Dropdown no Header

1. **Localizar ícone de sino** 🔔
   - Canto superior direito da tela
   - Ao lado do nome do usuário

2. **Badge de contagem**
   - Deve mostrar número de não lidas
   - Exemplo: `3` em círculo vermelho
   - Se não houver notificações: sem badge

3. **Clicar no sino**
   - Deve abrir dropdown
   - Mostrar últimas 5 notificações
   - Botão "Ver todas"

### 4.2 Testar no Dropdown

**Ações disponíveis:**
- ✅ Ver prévia da notificação
- ✅ Clicar para marcar como lida
- ✅ Ver tempo relativo ("há 5 minutos")
- ✅ Clicar "Ver todas" → vai para página completa

---

## 📋 PASSO 5: Acessar Página de Notificações

### 5.1 Navegação

**Opção 1:** Menu lateral
- Procurar "Notificações" no menu
- Clicar

**Opção 2:** URL direta
- Acessar: `http://localhost:3000/dashboard/notificacoes`

**Opção 3:** Via dropdown
- Clicar no sino 🔔
- Clicar em "Ver todas"

### 5.2 O Que Você Deve Ver

```
┌─────────────────────────────────────────────────┐
│  📋 Notificações                                │
│                                                 │
│  [+ Nova Notificação]  🔍 Buscar  [Filtros]    │
│                                                 │
│  Estatísticas:                                  │
│  📊 Total: 0  |  ❌ Não lidas: 0  |  ✅ Lidas: 0│
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Nenhuma notificação encontrada         │   │
│  │  Crie sua primeira notificação!         │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## ✍️ PASSO 6: Criar Primeira Notificação

### 6.1 Abrir Modal de Criação

1. **Clicar no botão** `+ Nova Notificação`
2. Modal deve abrir com formulário

### 6.2 Preencher Formulário

**Teste 1: Notificação Geral (Para Todos)**

```
┌─── Criar Nova Notificação ───────────────┐
│                                           │
│ Título *                                  │
│ ┌────────────────────────────────────┐   │
│ │ 🎉 Bem-vindo ao Sistema!           │   │
│ └────────────────────────────────────┘   │
│                                           │
│ Mensagem *                                │
│ ┌────────────────────────────────────┐   │
│ │ Esta é uma notificação de teste   │   │
│ │ para todos os usuários do sistema  │   │
│ └────────────────────────────────────┘   │
│                                           │
│ Tipo *                                    │
│ ┌────────────────────────────────────┐   │
│ │ ✅ Success                         ▼│   │
│ └────────────────────────────────────┘   │
│                                           │
│ Link (opcional)                           │
│ ┌────────────────────────────────────┐   │
│ │ /dashboard                         │   │
│ └────────────────────────────────────┘   │
│                                           │
│ Destinatários *                           │
│ ┌────────────────────────────────────┐   │
│ │ ○ Todos os usuários (Geral)       │   │
│ │ ○ Cliente específico               │   │
│ │ ○ Funcionário específico           │   │
│ │ ○ Obra específica                  │   │
│ └────────────────────────────────────┘   │
│                                           │
│  [Cancelar]           [Criar] ✅          │
└───────────────────────────────────────────┘
```

3. **Preencher campos:**
   - **Título:** "🎉 Bem-vindo ao Sistema!"
   - **Mensagem:** "Esta é uma notificação de teste para todos os usuários"
   - **Tipo:** Selecionar "Success" ✅
   - **Link:** "/dashboard" (opcional)
   - **Destinatários:** Marcar "Todos os usuários (Geral)"

4. **Clicar em "Criar"**

### 6.3 Verificar Sucesso

Após criar:
- ✅ Modal fecha automaticamente
- ✅ Toast de sucesso aparece: "Notificação criada com sucesso!"
- ✅ Lista de notificações atualiza
- ✅ Estatísticas atualizam
- ✅ Badge no sino atualiza (+1)

---

## 🧪 PASSO 7: Testar Funcionalidades

### 7.1 Criar Diferentes Tipos de Notificação

**Teste 2: Notificação de Aviso**
- Título: "⚠️ Manutenção Programada"
- Mensagem: "O sistema ficará offline amanhã às 2h"
- Tipo: **Warning**
- Destinatários: Todos

**Teste 3: Notificação de Erro**
- Título: "❌ Erro ao Processar"
- Mensagem: "Houve um erro ao processar sua solicitação"
- Tipo: **Error**
- Destinatários: Todos

**Teste 4: Notificação Financeira**
- Título: "💰 Pagamento Aprovado"
- Mensagem: "Seu pagamento foi processado com sucesso"
- Tipo: **Financeiro**
- Link: "/dashboard/financeiro"
- Destinatários: Todos

**Teste 5: Notificação de Grua**
- Título: "🏗️ Grua #452 Disponível"
- Mensagem: "A grua #452 está disponível para locação"
- Tipo: **Grua**
- Link: "/dashboard/gruas/452"
- Destinatários: Todos

### 7.2 Verificar Notificações Criadas

Após criar várias notificações, você deve ver:

```
┌─────────────────────────────────────────────────┐
│  📊 Total: 5  |  ❌ Não lidas: 5  |  ✅ Lidas: 0│
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🏗️ Grua #452 Disponível           [🗑️]│   │
│  │ A grua #452 está disponível...          │   │
│  │ 👤 Sistema de Testes • há 1 minuto      │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 💰 Pagamento Aprovado             [🗑️]│   │
│  │ Seu pagamento foi processado...         │   │
│  │ 👤 Sistema de Testes • há 2 minutos     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ... mais notificações ...                     │
└─────────────────────────────────────────────────┘
```

### 7.3 Testar "Marcar Como Lida"

**Individual:**
1. Passar mouse sobre notificação
2. Deve aparecer botão ou ícone de "lida"
3. Clicar
4. Notificação deve ficar opaca/cinza
5. Badge no sino diminui (-1)
6. Estatísticas atualizam

**Em Massa:**
1. Procurar botão "Marcar todas como lidas"
2. Clicar
3. Todas ficam opacas
4. Badge no sino zera
5. Estatísticas: Não lidas = 0

### 7.4 Testar Filtros

**Filtro por Tipo:**
1. Clicar no dropdown de filtros
2. Selecionar "Financeiro"
3. Deve mostrar apenas notificações tipo "financeiro"

**Filtro por Status:**
1. Selecionar "Apenas não lidas"
2. Deve mostrar só as não lidas
3. Selecionar "Apenas lidas"
4. Deve mostrar só as lidas

**Busca por Texto:**
1. Digitar "grua" na busca
2. Deve filtrar notificações com "grua" no título ou mensagem

### 7.5 Testar Exclusão

**Individual:**
1. Passar mouse sobre notificação
2. Clicar no ícone de lixeira 🗑️
3. Confirmar exclusão
4. Notificação desaparece
5. Estatísticas atualizam

**Em Massa:**
1. Procurar botão "Excluir todas"
2. Clicar
3. Confirmar (geralmente pede confirmação)
4. Todas as notificações são removidas
5. Volta para estado vazio

---

## ✅ PASSO 8: Verificar Dropdown Atualizado

Após criar notificações:

1. **Clicar no sino 🔔 no header**
2. **Verificar:**
   - Badge mostra número correto
   - Últimas 5 notificações aparecem
   - Tempo relativo está correto
   - Cores/ícones adequados ao tipo

3. **Testar ações no dropdown:**
   - Clicar em notificação → marca como lida
   - Badge atualiza em tempo real
   - Link funciona (se tiver)

---

## 🎨 PASSO 9: Verificar Estilos e Cores

Cada tipo deve ter cor diferente:

| Tipo | Cor | Ícone |
|------|-----|-------|
| Info | 🔵 Azul | 🔔 |
| Warning | 🟡 Amarelo | ⚠️ |
| Error | 🔴 Vermelho | ❌ |
| Success | 🟢 Verde | ✅ |
| Grua | 🟣 Roxo | 🏗️ |
| Obra | 🔵 Índigo | 🏢 |
| Financeiro | 🟢 Esmeralda | 💰 |
| RH | 🩷 Rosa | 👥 |
| Estoque | 🟠 Laranja | 📦 |

---

## 🐛 PASSO 10: Testar Casos de Erro

### Teste 1: Criar Sem Título
1. Abrir modal de criação
2. Deixar título vazio
3. Tentar criar
4. **Esperado:** Mensagem de erro "Título é obrigatório"

### Teste 2: Criar Sem Mensagem
1. Preencher título
2. Deixar mensagem vazia
3. Tentar criar
4. **Esperado:** Mensagem de erro "Mensagem é obrigatória"

### Teste 3: Criar Sem Destinatário
1. Preencher título e mensagem
2. Não selecionar destinatário
3. Tentar criar
4. **Esperado:** Mensagem de erro ou destinatário padrão (geral)

### Teste 4: Sem Conexão com Backend
1. Parar o servidor backend (Ctrl+C no terminal)
2. Tentar listar notificações
3. **Esperado:** Mensagem de erro amigável
4. Reiniciar backend e tentar novamente

---

## 📱 PASSO 11: Testar Responsividade

### Desktop
1. Abrir em tela cheia
2. Verificar layout
3. ✅ Tudo deve estar bem organizado

### Tablet
1. Redimensionar janela para ~768px
2. Verificar adaptação
3. ✅ Menu pode colapsar

### Mobile
1. Redimensionar para ~375px
2. Verificar:
   - Dropdown funciona
   - Página de notificações responsiva
   - Botões acessíveis
   - Texto legível

---

## 🔍 PASSO 12: Verificar Console do Navegador

### Abrir DevTools
- Chrome: F12 ou Ctrl+Shift+I
- Firefox: F12
- Safari: Cmd+Option+I

### Console Tab
Verificar:
- ✅ Sem erros em vermelho
- ⚠️ Warnings são aceitáveis
- 📝 Logs de debug são normais

### Network Tab
1. Abrir aba Network
2. Criar uma notificação
3. Verificar requisição:
   - ✅ POST `/api/notificacoes` → 201 Created
   - ✅ Tempo de resposta < 1s

4. Listar notificações
5. Verificar:
   - ✅ GET `/api/notificacoes` → 200 OK
   - ✅ JSON válido na resposta

---

## ✅ Checklist de Validação Final

Marque cada item após testar:

### Básico
- [ ] ✅ Migration aplicada com sucesso
- [ ] ✅ Backend rodando sem erros
- [ ] ✅ Frontend rodando sem erros
- [ ] ✅ Login funcionando

### Dropdown
- [ ] ✅ Ícone de sino visível no header
- [ ] ✅ Badge mostra contagem correta
- [ ] ✅ Dropdown abre ao clicar
- [ ] ✅ Últimas notificações aparecem
- [ ] ✅ Tempo relativo correto
- [ ] ✅ Marcar como lida funciona
- [ ] ✅ Botão "Ver todas" funciona

### Página de Notificações
- [ ] ✅ Página carrega sem erros
- [ ] ✅ Estatísticas aparecem corretamente
- [ ] ✅ Botão "Nova Notificação" visível
- [ ] ✅ Lista de notificações aparece

### Criar Notificação
- [ ] ✅ Modal abre corretamente
- [ ] ✅ Todos os campos disponíveis
- [ ] ✅ Validação funciona (campos obrigatórios)
- [ ] ✅ Criação bem-sucedida
- [ ] ✅ Toast de sucesso aparece
- [ ] ✅ Lista atualiza automaticamente

### Funcionalidades
- [ ] ✅ Marcar como lida (individual)
- [ ] ✅ Marcar todas como lidas
- [ ] ✅ Excluir notificação (individual)
- [ ] ✅ Excluir todas
- [ ] ✅ Filtro por tipo
- [ ] ✅ Filtro por status
- [ ] ✅ Busca por texto

### Visual
- [ ] ✅ Cores corretas por tipo
- [ ] ✅ Ícones aparecem
- [ ] ✅ Layout responsivo
- [ ] ✅ Animações suaves

### Performance
- [ ] ✅ Carregamento rápido (< 2s)
- [ ] ✅ Interações sem lag
- [ ] ✅ Badge atualiza em tempo real

### Console
- [ ] ✅ Sem erros no console
- [ ] ✅ Requisições API funcionando
- [ ] ✅ Status codes corretos (200, 201)

---

## 🎯 Cenários de Teste Completos

### Cenário 1: Fluxo Completo
1. ✅ Criar 5 notificações diferentes
2. ✅ Verificar badge = 5
3. ✅ Abrir dropdown → ver 5 notificações
4. ✅ Clicar em 1 → marcar como lida
5. ✅ Badge = 4
6. ✅ Ir para página completa
7. ✅ Marcar todas como lidas
8. ✅ Badge = 0
9. ✅ Excluir todas
10. ✅ Lista vazia

### Cenário 2: Notificação para Cliente
1. ✅ Criar notificação tipo "Financeiro"
2. ✅ Selecionar destinatário "Cliente específico"
3. ✅ Buscar cliente existente
4. ✅ Selecionar cliente
5. ✅ Criar notificação
6. ✅ Verificar se foi criada
7. ✅ (Cliente deve receber a notificação)

### Cenário 3: Múltiplos Destinatários
1. ✅ Criar notificação
2. ✅ Adicionar múltiplos destinatários
3. ✅ Criar
4. ✅ Verificar se todos receberam

---

## 🚨 Troubleshooting

### Problema: Badge não atualiza
**Solução:**
1. Verificar se backend está rodando
2. Abrir DevTools → Network
3. Verificar se GET `/api/notificacoes/count/nao-lidas` retorna OK
4. Recarregar página (F5)

### Problema: Modal não abre
**Solução:**
1. Verificar console por erros
2. Verificar se botão está visível
3. Limpar cache do navegador
4. Recarregar página

### Problema: Notificação não é criada
**Solução:**
1. Verificar se backend está rodando
2. Abrir DevTools → Network
3. Ver erro na requisição POST
4. Verificar se usuário tem permissão (admin)
5. Verificar logs do backend

### Problema: Lista vazia mesmo após criar
**Solução:**
1. Verificar se requisição POST foi bem-sucedida (201)
2. Recarregar página
3. Verificar filtros ativos
4. Limpar busca

### Problema: Tempo relativo errado
**Solução:**
1. Verificar fuso horário do sistema
2. Verificar se data está em formato ISO
3. Recarregar página

---

## 📸 Screenshots Esperados

### 1. Dropdown Vazio
```
┌─────────────────────────────┐
│  🔔 Notificações            │
│                             │
│  Nenhuma notificação        │
│  encontrada                 │
│                             │
│  [Ver todas]                │
└─────────────────────────────┘
```

### 2. Dropdown com Notificações
```
┌─────────────────────────────────┐
│  🔔 Notificações         [3]    │
│                                 │
│  ✅ Bem-vindo!                  │
│  Esta é uma notificação...      │
│  há 5 minutos                   │
│  ─────────────────────────────  │
│  ⚠️ Manutenção                  │
│  O sistema ficará...            │
│  há 10 minutos                  │
│  ─────────────────────────────  │
│  💰 Pagamento                   │
│  Seu pagamento foi...           │
│  há 1 hora                      │
│                                 │
│  [Marcar todas como lidas]      │
│  [Ver todas]                    │
└─────────────────────────────────┘
```

### 3. Página com Notificações
```
┌───────────────────────────────────────────────┐
│  📋 Notificações                              │
│  [+ Nova]  🔍 [Buscar...]  [Filtros ▼]       │
│                                               │
│  📊 Total: 3  |  ❌ Não lidas: 2  |  ✅ Lidas: 1│
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │ ✅ Bem-vindo ao Sistema!           [🗑️]│ │
│  │ Esta é uma notificação de teste         │ │
│  │ 👤 Sistema • há 5 minutos               │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │ ⚠️ Manutenção Programada           [🗑️]│ │
│  │ O sistema ficará offline amanhã          │ │
│  │ 👤 Sistema • há 10 minutos              │ │
│  └─────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

---

## 🎉 Conclusão

Após completar todos os passos, você terá:

✅ Sistema de notificações totalmente funcional  
✅ Backend integrado com frontend  
✅ Todas as funcionalidades testadas  
✅ Confiança de que está tudo funcionando  

---

## 📞 Precisa de Ajuda?

Se encontrar algum problema:

1. **Verificar logs do backend** no terminal
2. **Abrir DevTools** e verificar console/network
3. **Consultar** `backend-api/src/tests/notificacoes.test.md`
4. **Revisar** migrations aplicadas no Supabase

---

**Boa sorte nos testes! 🚀**

Qualquer dúvida, estou aqui para ajudar! 😊

