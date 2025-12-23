# 🔐 Sistema de Permissões PWA/App

## 📱 Visão Geral

O sistema de permissões do PWA/App é baseado em **4 roles principais** com permissões específicas para o aplicativo móvel.

## 🎯 Roles e Níveis de Acesso

### 1. **Admin** (Nível 10)
- ✅ **Acesso total** (`*`)
- Pode acessar todos os módulos do PWA
- Permissões completas

### 2. **Gestores** (Nível 9)
- ✅ **Acesso total** (`*`)
- Pode acessar todos os módulos do PWA
- Gerenciamento de equipes e aprovações

### 3. **Clientes** (Nível 6)
- ✅ `ponto:visualizar` - Visualizar ponto dos funcionários
- ✅ `ponto:aprovacoes` - Aprovar horas extras dos funcionários atrelados às gruas
- ✅ `ponto_eletronico:visualizar` - Visualizar ponto eletrônico
- ✅ `ponto_eletronico:aprovacoes` - Aprovar ponto eletrônico
- ✅ `documentos:visualizar` - Visualizar documentos
- ✅ `documentos:gerenciar` - Gerenciar documentos
- ✅ `documentos:assinatura` - Assinar documentos
- ✅ `gruas:visualizar` - Visualizar gruas relacionadas às obras
- ✅ `obras:visualizar` - Visualizar próprias obras
- ✅ `notificacoes:visualizar` - Visualizar notificações
- ✅ `notificacoes:gerenciar` - Gerenciar notificações
- ✅ `justificativas:visualizar` - Visualizar justificativas
- ✅ `justificativas:aprovar` - Aprovar justificativas dos funcionários
- ✅ `justificativas:gerenciar` - Gerenciar justificativas

**Nota:** Clientes agora têm permissões de supervisão, podendo aprovar horas dos funcionários atrelados às gruas de suas obras.

### 4. **Operários** (Nível 4)
- ✅ `ponto:visualizar` - Visualizar próprio ponto
- ✅ `ponto:registrar` - Registrar próprio ponto
- ✅ `documentos:visualizar` - Visualizar documentos
- ✅ `documentos:assinatura` - Assinar documentos
- ✅ `notificacoes:visualizar` - Visualizar notificações

## 📋 Menu do PWA por Permissão

O menu do PWA é filtrado automaticamente baseado nas permissões do usuário:

| Item do Menu | Permissão Necessária | Roles com Acesso |
|-------------|---------------------|------------------|
| **Ponto Eletrônico** | `ponto:visualizar` ou `ponto_eletronico:visualizar` | Admin, Gestores, Clientes, Operários |
| **Documentos** | `documentos:visualizar` | Todos |
| **Aprovações** | `ponto:aprovacoes` ou `ponto_eletronico:aprovacoes` | Admin, Gestores, Clientes |
| **Gruas** | `gruas:visualizar` | Admin, Gestores, Clientes |
| **Obras** | `obras:visualizar` | Admin, Gestores, Clientes |
| **Espelho de Ponto** | `ponto:visualizar` ou `ponto_eletronico:visualizar` | Admin, Gestores, Clientes, Operários |
| **Perfil** | `*` (todos) | Todos |
| **Configurações** | `*` (todos) | Todos |
| **Notificações** | `notificacoes:visualizar` | Todos |
| **Holerites** | `documentos:visualizar` | Todos |

## 🔧 Como Funciona

### 1. **Hook de Permissões PWA**

```typescript
import { usePWAPermissions } from '@/hooks/use-pwa-permissions'

const {
  userRole,           // Role do usuário
  level,              // Nível de acesso (1-10)
  permissions,        // Lista de permissões
  menuItems,          // Itens do menu filtrados
  hasPermission,      // Verifica permissão específica
  canRegisterPonto,   // Pode registrar ponto?
  canViewDocuments,   // Pode visualizar documentos?
  // ... outras verificações
} = usePWAPermissions()
```

### 2. **Verificação de Permissões**

```typescript
// Verificar permissão específica
if (hasPermission('ponto:registrar')) {
  // Usuário pode registrar ponto
}

// Verificar múltiplas permissões
if (hasAnyPermission(['ponto:visualizar', 'ponto_eletronico:visualizar'])) {
  // Usuário pode visualizar ponto
}

// Verificar nível mínimo
if (hasMinLevel(6)) {
  // Usuário tem nível 6 ou superior
}
```

### 3. **Filtragem Automática do Menu**

O menu é automaticamente filtrado baseado nas permissões:

```typescript
// Apenas itens acessíveis são exibidos
const { menuItems } = usePWAPermissions()

menuItems.map(item => (
  <MenuItem key={item.path} href={item.path}>
    {item.label}
  </MenuItem>
))
```

## 🚀 Redirecionamento por Nível

### Sistema Web (Dashboard)
- **Níveis 8+**: Admin (10), Financeiro (8), Gestores (9)

### App PWA
- **Níveis 7 ou menos**: Clientes (6), Operários (4)
- **Todos os roles** podem acessar o PWA, mas com permissões diferentes

## 📝 Exemplo de Uso

### Componente com Proteção de Permissão

```typescript
import { usePWAPermissions } from '@/hooks/use-pwa-permissions'

function PontoPage() {
  const { hasPermission, canRegisterPonto } = usePWAPermissions()

  if (!hasPermission('ponto:visualizar')) {
    return <AccessDenied />
  }

  return (
    <div>
      {canRegisterPonto() && (
        <Button>Registrar Ponto</Button>
      )}
      {/* ... */}
    </div>
  )
}
```

### Verificação em Rotas

```typescript
// app/pwa/ponto/page.tsx
import { usePWAPermissions } from '@/hooks/use-pwa-permissions'

export default function PontoPage() {
  const { hasPermission } = usePWAPermissions()

  useEffect(() => {
    if (!hasPermission('ponto:visualizar')) {
      router.push('/pwa')
    }
  }, [])

  // ...
}
```

## 🔍 Debug de Permissões

Em desenvolvimento, você pode usar:

```typescript
const { debugPermissions } = usePWAPermissions()

// No console do navegador
debugPermissions()
```

Isso mostra:
- Role do usuário
- Nível de acesso
- Lista de permissões
- Itens do menu acessíveis
- Funcionalidades disponíveis

## ✅ Validação

As permissões são validadas em:

1. **Frontend (PWA)**: Hook `usePWAPermissions` filtra menu e funcionalidades
2. **Backend (API)**: Middleware `requirePermission` valida requisições
3. **Rotas Protegidas**: Componente `PWAAuthGuard` verifica autenticação

## 📊 Fluxo de Permissões

```
Login → Backend retorna role e level
  ↓
Salvar no localStorage (user_role, user_level)
  ↓
Hook usePWAPermissions obtém role
  ↓
getPWAPermissions(role) retorna lista de permissões
  ↓
Menu e funcionalidades são filtrados automaticamente
  ↓
Verificações de permissão em componentes e rotas
```

## 🎯 Regras Importantes

1. **Admin e Gestores** têm acesso total (`*`)
2. **Clientes** podem aprovar horas extras dos funcionários atrelados às gruas de suas obras
3. **Clientes** podem visualizar obras, documentos e gruas relacionadas
4. **Operários** podem apenas registrar e visualizar próprio ponto
5. **Todos** têm acesso ao próprio perfil e configurações

## 🔄 Atualização de Permissões

Para atualizar permissões PWA:

1. Editar `types/permissions.ts` → `PWA_PERMISSIONS`
2. Editar `backend-api/src/config/roles.js` → `PWA_PERMISSIONS`
3. Atualizar `app/pwa/lib/permissions.ts` se necessário
4. Reiniciar aplicação

## 📱 Páginas Iniciais por Role

- **Admin/Gestores**: `/pwa` (dashboard)
- **Clientes**: `/pwa/aprovacoes` (supervisão das horas dos funcionários)
- **Operários**: `/pwa/ponto`

## ⚠️ Notas Importantes

- As permissões são **hardcoded** no código (não vêm do banco)
- O sistema usa **nomes de roles normalizados** (ex: "Clientes" não "Cliente")
- **Supervisores** foi mesclado em **Clientes** - usuários com role "Supervisores" são automaticamente mapeados para "Clientes"
- Permissões são verificadas tanto no **frontend** quanto no **backend**
- O menu é **automaticamente filtrado** baseado nas permissões
- **Clientes** agora têm nível 6 (antes era 1) e podem supervisionar horas dos funcionários

