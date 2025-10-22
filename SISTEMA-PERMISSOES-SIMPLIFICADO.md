# Sistema de Permissões Simplificado

## 📋 Visão Geral

Sistema de permissões baseado em **5 roles principais** com acesso hierárquico ao sistema.

## 🎯 Roles de Acesso

### 1. **Admin** 
- **Acesso**: Todo o sistema
- **Nível**: 10
- **Descrição**: Acesso completo sem restrições

### 2. **Gestores**
- **Acesso**: Todo o sistema  
- **Nível**: 9
- **Descrição**: Acesso gerencial completo

### 3. **Supervisores**
- **Acesso**: Gruas, Obras, Ponto Eletrônico, Ponto, Documentos, Livro Grua, Estoque
- **Nível**: 6
- **Descrição**: Supervisão operacional

### 4. **Operários**
- **Acesso**: Ponto (APP), Documentos (APP)
- **Nível**: 4
- **Descrição**: Operação diária via APP

### 5. **Clientes**
- **Acesso**: Assinatura de documentos
- **Nível**: 1
- **Descrição**: Acesso limitado para clientes

## 🔧 Implementação Frontend

### Estrutura de Permissões

```typescript
// types/permissions.ts
export interface Role {
  id: number
  nome: string
  nivel: number
  descricao: string
  permissoes: string[]
}

export const ROLES: Role[] = [
  {
    id: 1,
    nome: 'Admin',
    nivel: 10,
    descricao: 'Acesso completo ao sistema',
    permissoes: ['*'] // Todas as permissões
  },
  {
    id: 2,
    nome: 'Gestores',
    nivel: 9,
    descricao: 'Acesso gerencial completo',
    permissoes: ['*'] // Todas as permissões
  },
  {
    id: 3,
    nome: 'Supervisores',
    nivel: 6,
    descricao: 'Supervisão operacional',
    permissoes: [
      'gruas:visualizar',
      'gruas:gerenciar',
      'obras:visualizar',
      'obras:gerenciar',
      'ponto:visualizar',
      'ponto:gerenciar',
      'ponto:aprovacoes',
      'documentos:visualizar',
      'documentos:gerenciar',
      'livro-grua:visualizar',
      'livro-grua:gerenciar',
      'estoque:visualizar',
      'estoque:gerenciar'
    ]
  },
  {
    id: 4,
    nome: 'Operários',
    nivel: 4,
    descricao: 'Operação diária via APP',
    permissoes: [
      'ponto:visualizar',
      'ponto:registrar',
      'documentos:visualizar',
      'documentos:assinatura'
    ]
  },
  {
    id: 5,
    nome: 'Clientes',
    nivel: 1,
    descricao: 'Acesso limitado para clientes',
    permissoes: [
      'documentos:visualizar',
      'documentos:assinatura'
    ]
  }
]
```

### Hook de Permissões

```typescript
// hooks/use-permissions.ts
import { ROLES } from '@/types/permissions'

export const usePermissions = () => {
  const checkPermission = (permission: string, userRole: string): boolean => {
    const role = ROLES.find(r => r.nome === userRole)
    if (!role) return false
    
    // Admin e Gestores têm acesso total
    if (role.nivel >= 9) return true
    
    // Verificar permissão específica
    return role.permissoes.includes(permission) || role.permissoes.includes('*')
  }

  const hasAccess = (module: string, action: string, userRole: string): boolean => {
    const permission = `${module}:${action}`
    return checkPermission(permission, userRole)
  }

  const getAccessibleModules = (userRole: string): string[] => {
    const role = ROLES.find(r => r.nome === userRole)
    if (!role) return []
    
    if (role.nivel >= 9) {
      return ['dashboard', 'usuarios', 'perfis', 'gruas', 'obras', 'ponto', 'documentos', 'estoque', 'financeiro']
    }
    
    const modules = new Set<string>()
    role.permissoes.forEach(permission => {
      const [module] = permission.split(':')
      if (module !== '*') {
        modules.add(module)
      }
    })
    
    return Array.from(modules)
  }

  return {
    checkPermission,
    hasAccess,
    getAccessibleModules
  }
}
```

### Componente de Proteção de Rota

```typescript
// components/protected-route.tsx
import { usePermissions } from '@/hooks/use-permissions'
import { useCurrentUser } from '@/hooks/use-current-user'

interface ProtectedRouteProps {
  children: React.ReactNode
  permission: string
  fallback?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  fallback = <div>Acesso negado</div>
}) => {
  const { user } = useCurrentUser()
  const { checkPermission } = usePermissions()
  
  if (!user || !checkPermission(permission, user.role)) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}
```

### Menu Dinâmico

```typescript
// components/dynamic-menu.tsx
import { usePermissions } from '@/hooks/use-permissions'
import { useCurrentUser } from '@/hooks/use-current-user'

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', permission: 'dashboard:visualizar' },
  { label: 'Usuários', path: '/dashboard/usuarios', permission: 'usuarios:visualizar' },
  { label: 'Perfis', path: '/dashboard/perfis', permission: 'perfis:visualizar' },
  { label: 'Gruas', path: '/dashboard/gruas', permission: 'gruas:visualizar' },
  { label: 'Obras', path: '/dashboard/obras', permission: 'obras:visualizar' },
  { label: 'Ponto Eletrônico', path: '/dashboard/ponto', permission: 'ponto:visualizar' },
  { label: 'Documentos', path: '/dashboard/documentos', permission: 'documentos:visualizar' },
  { label: 'Estoque', path: '/dashboard/estoque', permission: 'estoque:visualizar' },
  { label: 'Financeiro', path: '/dashboard/financeiro', permission: 'financeiro:visualizar' }
]

export const DynamicMenu = () => {
  const { user } = useCurrentUser()
  const { checkPermission } = usePermissions()
  
  const accessibleItems = menuItems.filter(item => 
    checkPermission(item.permission, user?.role || '')
  )
  
  return (
    <nav>
      {accessibleItems.map(item => (
        <Link key={item.path} href={item.path}>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
```

## 🔧 Implementação Backend

### Estrutura da Tabela de Perfis

```sql
-- Tabela de perfis simplificada
CREATE TABLE perfis (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,
  nivel INTEGER NOT NULL,
  descricao TEXT,
  status VARCHAR(20) DEFAULT 'Ativo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir perfis padrão
INSERT INTO perfis (nome, nivel, descricao) VALUES
('Admin', 10, 'Acesso completo ao sistema'),
('Gestores', 9, 'Acesso gerencial completo'),
('Supervisores', 6, 'Supervisão operacional'),
('Operários', 4, 'Operação diária via APP'),
('Clientes', 1, 'Acesso limitado para clientes');
```

### Middleware de Permissões

```javascript
// middleware/permissions.js
const ROLES_PERMISSIONS = {
  'Admin': ['*'],
  'Gestores': ['*'],
  'Supervisores': [
    'gruas:visualizar', 'gruas:gerenciar',
    'obras:visualizar', 'obras:gerenciar',
    'ponto:visualizar', 'ponto:gerenciar', 'ponto:aprovacoes',
    'documentos:visualizar', 'documentos:gerenciar',
    'livro-grua:visualizar', 'livro-grua:gerenciar',
    'estoque:visualizar', 'estoque:gerenciar'
  ],
  'Operários': [
    'ponto:visualizar', 'ponto:registrar',
    'documentos:visualizar', 'documentos:assinatura'
  ],
  'Clientes': [
    'documentos:visualizar', 'documentos:assinatura'
  ]
}

const checkPermission = (userRole, requiredPermission) => {
  const permissions = ROLES_PERMISSIONS[userRole] || []
  
  // Admin e Gestores têm acesso total
  if (permissions.includes('*')) return true
  
  // Verificar permissão específica
  return permissions.includes(requiredPermission)
}

const requirePermission = (permission) => {
  return (req, res, next) => {
    const userRole = req.user?.role || req.user?.perfil?.nome
    
    if (!userRole) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }
    
    if (!checkPermission(userRole, permission)) {
      return res.status(403).json({ 
        error: 'Acesso negado',
        message: `Permissão '${permission}' necessária`
      })
    }
    
    next()
  }
}

module.exports = { requirePermission, checkPermission }
```

### Rotas Protegidas

```javascript
// routes/gruas.js
const { requirePermission } = require('../middleware/permissions')

// Apenas Supervisores, Gestores e Admin
router.get('/gruas', requirePermission('gruas:visualizar'), async (req, res) => {
  // Listar gruas
})

router.post('/gruas', requirePermission('gruas:gerenciar'), async (req, res) => {
  // Criar grua
})

// routes/ponto.js
// Apenas Operários, Supervisores, Gestores e Admin
router.get('/ponto', requirePermission('ponto:visualizar'), async (req, res) => {
  // Listar ponto
})

router.post('/ponto/registrar', requirePermission('ponto:registrar'), async (req, res) => {
  // Registrar ponto
})

// Apenas Supervisores, Gestores e Admin
router.post('/ponto/aprovacoes', requirePermission('ponto:aprovacoes'), async (req, res) => {
  // Aprovar horas extras
})
```

## 📱 Implementação PWA

### Permissões por Role no APP

```typescript
// pwa/permissions.ts
export const PWA_PERMISSIONS = {
  'Admin': ['*'],
  'Gestores': ['*'],
  'Supervisores': [
    'ponto:visualizar',
    'ponto:aprovacoes',
    'documentos:visualizar',
    'documentos:gerenciar'
  ],
  'Operários': [
    'ponto:visualizar',
    'ponto:registrar',
    'documentos:visualizar',
    'documentos:assinatura'
  ],
  'Clientes': [
    'documentos:visualizar',
    'documentos:assinatura'
  ]
}

export const getPWAMenu = (userRole: string) => {
  const permissions = PWA_PERMISSIONS[userRole] || []
  
  const menuItems = [
    { 
      label: 'Ponto Eletrônico', 
      path: '/pwa/ponto', 
      permission: 'ponto:visualizar',
      icon: 'Clock'
    },
    { 
      label: 'Documentos', 
      path: '/pwa/documentos', 
      permission: 'documentos:visualizar',
      icon: 'FileText'
    },
    { 
      label: 'Aprovações', 
      path: '/pwa/aprovacoes', 
      permission: 'ponto:aprovacoes',
      icon: 'CheckCircle'
    }
  ]
  
  return menuItems.filter(item => 
    permissions.includes(item.permission) || permissions.includes('*')
  )
}
```

## 🎯 Mapeamento de Módulos

### Dashboard Web
- **Admin/Gestores**: Todos os módulos
- **Supervisores**: Gruas, Obras, Ponto, Documentos, Livro Grua, Estoque
- **Operários**: Apenas PWA
- **Clientes**: Apenas PWA

### PWA (Mobile)
- **Admin/Gestores**: Todos os módulos
- **Supervisores**: Ponto, Documentos, Aprovações
- **Operários**: Ponto, Documentos
- **Clientes**: Documentos

## 🔐 Validação de Acesso

### Frontend
```typescript
// Verificar permissão antes de renderizar
const { hasAccess } = usePermissions()
const { user } = useCurrentUser()

if (!hasAccess('gruas', 'visualizar', user.role)) {
  return <div>Acesso negado</div>
}
```

### Backend
```javascript
// Middleware automático
app.use('/api/gruas', requirePermission('gruas:visualizar'))
app.use('/api/ponto', requirePermission('ponto:visualizar'))
```

## 📋 Checklist de Implementação

### Frontend
- [ ] Criar tipos de permissões
- [ ] Implementar hook usePermissions
- [ ] Atualizar ProtectedRoute
- [ ] Criar menu dinâmico
- [ ] Implementar validação em componentes

### Backend
- [ ] Criar tabela de perfis
- [ ] Implementar middleware de permissões
- [ ] Proteger rotas existentes
- [ ] Atualizar sistema de autenticação
- [ ] Testar todas as permissões

### PWA
- [ ] Implementar permissões por role
- [ ] Criar menu dinâmico
- [ ] Proteger rotas do APP
- [ ] Implementar validação de acesso

## 🚀 Benefícios

1. **Simplicidade**: Apenas 5 roles principais
2. **Clareza**: Permissões bem definidas por role
3. **Manutenibilidade**: Fácil de entender e modificar
4. **Escalabilidade**: Fácil adicionar novas permissões
5. **Segurança**: Controle granular de acesso

## 📞 Suporte

Para dúvidas sobre implementação, consulte:
- Frontend: `hooks/use-permissions.ts`
- Backend: `middleware/permissions.js`
- PWA: `pwa/permissions.ts`
