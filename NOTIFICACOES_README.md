# 🔔 Sistema de Notificações - IRBANA

Sistema completo de notificações para o Sistema de Gerenciamento de Gruas, permitindo envio de notificações para usuários, clientes, funcionários e obras.

## 📋 Índice

- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura de Dados](#estrutura-de-dados)
- [Componentes Frontend](#componentes-frontend)
- [APIs Backend](#apis-backend)
- [Como Usar](#como-usar)
- [Tipos de Notificação](#tipos-de-notificação)
- [Destinatários](#destinatários)

---

## ✨ Funcionalidades

### Frontend (Implementado)
- ✅ **Dropdown de Notificações** no header com badge de contagem
- ✅ **Página Completa** de gerenciamento de notificações
- ✅ **Criação de Notificações** com formulário modal
- ✅ **Seleção Múltipla** de destinatários (clientes, funcionários, obras)
- ✅ **Filtros e Busca** por título, mensagem ou tipo
- ✅ **Marcar como Lida/Não Lida** individual ou em massa
- ✅ **Excluir Notificações** individual ou em massa
- ✅ **Estatísticas** de notificações (total, não lidas, lidas)
- ✅ **Tempo Relativo** (há X minutos/horas/dias)
- ✅ **Design Responsivo** para mobile e desktop

### Backend (Pendente)
- ⏳ APIs REST para CRUD de notificações
- ⏳ Sistema de permissões
- ⏳ Notificações em tempo real (WebSocket opcional)

---

## 🛠 Tecnologias

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Shadcn/ui** - Componentes UI
- **Lucide React** - Ícones

### Backend (A Implementar)
- **Node.js** + **Express**
- **PostgreSQL** - Banco de dados
- **Supabase** - Backend as a Service

---

## 📊 Estrutura de Dados

### Interface Notificacao

```typescript
export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: NotificationType;
  lida: boolean;
  data: string;
  destinatarios?: Destinatario[];
  remetente?: string;
}
```

### Interface Destinatario

```typescript
export interface Destinatario {
  tipo: DestinatarioTipo; // 'geral' | 'cliente' | 'funcionario' | 'obra'
  id?: string;
  nome?: string;
  info?: string; // CNPJ, cargo, endereço, etc
}
```

### Tipos de Notificação

```typescript
type NotificationType = 
  | 'info'        // Informação geral
  | 'warning'     // Aviso
  | 'error'       // Erro
  | 'success'     // Sucesso
  | 'grua'        // Relacionado a gruas
  | 'obra'        // Relacionado a obras
  | 'financeiro'  // Financeiro
  | 'rh'          // Recursos Humanos
  | 'estoque';    // Estoque
```

---

## 🎨 Componentes Frontend

### 1. NotificationsDropdown
**Localização:** `/components/notifications-dropdown.tsx`

**Descrição:** Dropdown no header com:
- Badge de contagem de não lidas
- Últimas 5 notificações
- Botão "marcar todas como lidas"
- Link para página completa

**Uso:**
```tsx
import { NotificationsDropdown } from '@/components/notifications-dropdown'

<NotificationsDropdown />
```

---

### 2. NovaNotificacaoDialog
**Localização:** `/components/nova-notificacao-dialog.tsx`

**Descrição:** Modal para criar notificações com:
- Seleção de tipo
- Título e mensagem
- Seleção múltipla de destinatários
- Chips visuais para destinatários selecionados

**Uso:**
```tsx
import { NovaNotificacaoDialog } from '@/components/nova-notificacao-dialog'

<NovaNotificacaoDialog onNotificacaoCriada={recarregar} />
```

---

### 3. Página de Notificações
**Localização:** `/app/dashboard/notificacoes/page.tsx`

**Recursos:**
- Cards de estatísticas
- Busca por texto
- Filtros por abas (Todas, Não Lidas, Lidas)
- Lista completa de notificações
- Ações individuais e em massa

**Rota:** `/dashboard/notificacoes`

---

### 4. Componentes de Busca

#### ClienteSearch
```tsx
<ClienteSearch
  onClienteSelect={(cliente) => {
    // Callback quando cliente é selecionado
  }}
/>
```

#### FuncionarioSearch
```tsx
<FuncionarioSearch
  onFuncionarioSelect={(funcionario) => {
    // Callback quando funcionário é selecionado
  }}
/>
```

#### ObraSearch
```tsx
<ObraSearch
  onObraSelect={(obra) => {
    // Callback quando obra é selecionada
  }}
/>
```

---

## 🔌 APIs Backend (A Implementar)

### 1. Listar Notificações
```
GET /api/notificacoes
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "titulo": "Título",
      "mensagem": "Mensagem",
      "tipo": "info",
      "lida": false,
      "data": "2024-01-15T10:30:00Z",
      "destinatarios": [...],
      "remetente": "Sistema"
    }
  ]
}
```

---

### 2. Listar Não Lidas
```
GET /api/notificacoes/nao-lidas
```

**Response:** Array de notificações com `lida: false`

---

### 3. Contar Não Lidas
```
GET /api/notificacoes/count/nao-lidas
```

**Response:**
```json
{
  "success": true,
  "count": 5
}
```

---

### 4. Criar Notificação
```
POST /api/notificacoes
```

**Request Body:**
```json
{
  "titulo": "Título da notificação",
  "mensagem": "Mensagem detalhada",
  "tipo": "info",
  "destinatarios": [
    {
      "tipo": "cliente",
      "id": "123",
      "nome": "ABC Construtora",
      "info": "12.345.678/0001-90"
    }
  ],
  "remetente": "Admin - João Silva"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "novo-id",
    "titulo": "...",
    // ... dados completos
  }
}
```

---

### 5. Marcar Como Lida
```
PATCH /api/notificacoes/:id/marcar-lida
```

**Params:**
- `id` - ID da notificação

**Response:**
```json
{
  "success": true,
  "message": "Notificação marcada como lida"
}
```

---

### 6. Marcar Todas Como Lidas
```
PATCH /api/notificacoes/marcar-todas-lidas
```

**Response:**
```json
{
  "success": true,
  "message": "Todas as notificações foram marcadas como lidas",
  "count": 10
}
```

---

### 7. Deletar Notificação
```
DELETE /api/notificacoes/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Notificação excluída com sucesso"
}
```

---

### 8. Deletar Todas
```
DELETE /api/notificacoes/todas
```

**Response:**
```json
{
  "success": true,
  "message": "Todas as notificações foram excluídas",
  "count": 15
}
```

---

## 💾 Estrutura do Banco de Dados

### Tabela: `notificacoes`

```sql
CREATE TABLE notificacoes (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  destinatarios JSONB,
  remetente VARCHAR(255),
  usuario_id INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX idx_notificacoes_data ON notificacoes(data DESC);
CREATE INDEX idx_notificacoes_tipo ON notificacoes(tipo);
```

### Exemplo de `destinatarios` (JSONB):

```json
[
  {
    "tipo": "cliente",
    "id": "123",
    "nome": "ABC Construtora",
    "info": "12.345.678/0001-90"
  },
  {
    "tipo": "funcionario",
    "id": "456",
    "nome": "João Silva",
    "info": "Operador de Grua"
  }
]
```

---

## 📖 Como Usar

### 1. Acessar Notificações

- **Via Dropdown:** Clique no ícone de sino no header
- **Via Menu:** Clique em "Notificações" no menu lateral
- **Rota Direta:** Acesse `/dashboard/notificacoes`

---

### 2. Criar Nova Notificação

1. Na página de notificações, clique em **"Nova Notificação"**
2. Selecione o **Tipo** (info, warning, error, etc)
3. Digite o **Título** e **Mensagem**
4. Escolha o **Destinatário**:
   - **Todos os usuários (Geral)** - Notificação broadcast
   - **Cliente específico** - Selecione um ou mais clientes
   - **Funcionário específico** - Selecione um ou mais funcionários
   - **Obra específica** - Selecione uma ou mais obras
5. Clique em **"Enviar Notificação"**

---

### 3. Gerenciar Notificações

#### Marcar como Lida
- **Individual:** Clique no ícone de check ✓
- **Em Massa:** Clique em "Marcar todas como lidas"

#### Excluir
- **Individual:** Clique no ícone de lixeira 🗑️
- **Em Massa:** Clique em "Excluir todas"

#### Filtrar
- Use as **abas**: Todas, Não Lidas, Lidas
- Use a **busca** para filtrar por texto

---

## 🎨 Tipos de Notificação

### Info (Azul)
```typescript
tipo: 'info'
```
- Informações gerais
- Atualizações do sistema
- Comunicados

### Success (Verde)
```typescript
tipo: 'success'
```
- Operações concluídas
- Aprovações
- Confirmações

### Warning (Amarelo)
```typescript
tipo: 'warning'
```
- Alertas
- Pendências
- Atenção necessária

### Error (Vermelho)
```typescript
tipo: 'error'
```
- Erros
- Falhas
- Problemas críticos

### Grua (Roxo)
```typescript
tipo: 'grua'
```
- Manutenções
- Certificações
- Alertas de gruas

### Obra (Laranja)
```typescript
tipo: 'obra'
```
- Novas obras
- Atualizações de obras
- Status de obras

### Financeiro (Verde Esmeralda)
```typescript
tipo: 'financeiro'
```
- Pagamentos
- Orçamentos
- Notas fiscais

### RH (Ciano)
```typescript
tipo: 'rh'
```
- Férias
- Ponto eletrônico
- Documentos

### Estoque (Âmbar)
```typescript
tipo: 'estoque'
```
- Estoque baixo
- Reposições
- Movimentações

---

## 👥 Destinatários

### Geral
Envia para **todos os usuários** do sistema.

```typescript
{
  tipo: 'geral'
}
```

### Cliente
Envia para **clientes específicos**.

```typescript
{
  tipo: 'cliente',
  id: '123',
  nome: 'ABC Construtora',
  info: '12.345.678/0001-90'
}
```

### Funcionário
Envia para **funcionários específicos**.

```typescript
{
  tipo: 'funcionario',
  id: '456',
  nome: 'João Silva',
  info: 'Operador de Grua'
}
```

### Obra
Envia para **obras específicas**.

```typescript
{
  tipo: 'obra',
  id: '789',
  nome: 'Edifício Solar',
  info: 'Rua ABC, 123'
}
```

---

## 🔒 Segurança

### Autenticação
- Todas as rotas requerem token JWT
- Validação de sessão do usuário

### Autorização
- Usuário só vê suas próprias notificações
- Admin pode criar notificações para qualquer destinatário

### Validação
- Título: obrigatório, máx 255 caracteres
- Mensagem: obrigatória
- Tipo: enum validado
- Destinatários: validação de existência

---

## 🚀 Roadmap Futuro

### Fase 2 (Backend)
- [ ] Implementar todas as APIs REST
- [ ] Sistema de permissões
- [ ] Filtros avançados
- [ ] Paginação

### Fase 3 (Recursos Avançados)
- [ ] Notificações em tempo real (WebSocket)
- [ ] Notificações push (PWA)
- [ ] Templates de notificações
- [ ] Agendamento de notificações
- [ ] Anexos em notificações
- [ ] Notificações por email
- [ ] Dashboard de estatísticas
- [ ] Exportação de relatórios

---

## 📝 Notas Técnicas

### Estado Atual
- ✅ Frontend 100% implementado e funcional
- ✅ Dados mockados para desenvolvimento/testes
- ⏳ Backend pendente de implementação

### Dados Mock
Os dados estão em: `lib/api-notificacoes.ts`
- 10 notificações de exemplo
- Diversos tipos e destinatários
- Simula todas as operações com Promises

### Integração Backend
Para conectar ao backend real:
1. Implementar as rotas no backend
2. Atualizar `lib/api-notificacoes.ts` para fazer chamadas HTTP
3. Substituir mock por chamadas `fetch()` ou `axios`

---

## 🤝 Contribuindo

Para adicionar novos recursos:

1. **Novo Tipo de Notificação:**
   - Adicionar em `NotificationType`
   - Adicionar configuração em `tipoConfig`
   - Adicionar opção no select do formulário

2. **Novo Tipo de Destinatário:**
   - Adicionar em `DestinatarioTipo`
   - Criar componente de busca
   - Integrar no formulário

3. **Nova Funcionalidade:**
   - Adicionar na API mockada
   - Criar UI correspondente
   - Documentar neste README

---

## 📞 Suporte

Para dúvidas ou problemas:
- Consulte a documentação
- Verifique os logs do console
- Revise os dados mockados em `lib/api-notificacoes.ts`

---

## 📄 Licença

Sistema proprietário - IRBANA Copas Serviços de Manutenção e Montagem LTDA

---

**Última Atualização:** Outubro 2024
**Versão:** 1.0.0

