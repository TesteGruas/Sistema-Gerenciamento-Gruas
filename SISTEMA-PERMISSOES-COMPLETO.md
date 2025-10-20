# 🔐 Sistema de Permissões Completo - Sistema de Gestão de Gruas

## 📋 **Visão Geral**

Sistema de controle de acesso baseado em perfis hierárquicos com 7 níveis de usuário, cada um com permissões específicas para diferentes módulos e funcionalidades.

---

## 👥 **Perfis de Usuário - Especificações de Acesso**

### **1. 🛡️ ADMIN (Nível 10)**
**Acesso Total - Pode ver e fazer tudo**

#### **Módulos com Acesso Completo:**
- ✅ **Dashboard** - Visão geral completa
- ✅ **Notificações** - Todas as notificações
- ✅ **Clientes** - CRUD completo
- ✅ **Obras** - CRUD completo
- ✅ **Controle de Gruas** - CRUD completo
- ✅ **Livros de Gruas** - CRUD completo
- ✅ **Estoque** - CRUD completo
- ✅ **Ponto Eletrônico** - CRUD completo
- ✅ **RH** - CRUD completo
- ✅ **Financeiro** - CRUD completo
- ✅ **Relatórios** - Todos os relatórios
- ✅ **Histórico** - Todo o histórico
- ✅ **Assinatura Digital** - Todas as assinaturas
- ✅ **Usuários** - Gerenciar todos os usuários
- ✅ **Configurações de Email** - Todas as configurações

---

### **2. 👔 GERENTE (Nível 8)**
**Acesso Gerencial - Visão estratégica e operacional**

#### **Módulos com Acesso:**
- ✅ **Dashboard** - Visão geral
- ✅ **Notificações** - Todas as notificações
- ✅ **Clientes** - CRUD completo
- ✅ **Obras** - CRUD completo
- ✅ **Controle de Gruas** - CRUD completo
- ✅ **Livros de Gruas** - CRUD completo
- ✅ **Estoque** - CRUD completo
- ✅ **Ponto Eletrônico** - CRUD completo
- ✅ **RH** - CRUD completo
- ✅ **Financeiro** - CRUD completo
- ✅ **Relatórios** - Todos os relatórios
- ✅ **Histórico** - Todo o histórico
- ✅ **Assinatura Digital** - Todas as assinaturas
- ✅ **Usuários** - Gerenciar usuários

#### **Restrições:**
- ❌ Não pode acessar configurações de email

---

### **3. 👷 SUPERVISOR (Nível 6)**
**Acesso Operacional - Gestão de equipe e operações**

#### **Módulos com Acesso:**
- ✅ **Obras** - Visualizar, editar (suas obras)
- ✅ **Controle de Gruas** - CRUD completo
- ✅ **Livros de Gruas** - CRUD completo
- ✅ **Estoque** - CRUD completo
- ✅ **Ponto Eletrônico** - CRUD completo (apenas no app)
- ✅ **RH** - CRUD completo
- ✅ **Assinatura Digital** - Assinar documentos

#### **Restrições:**
- ❌ Não pode acessar Dashboard
- ❌ Não pode acessar Notificações
- ❌ Não pode acessar Clientes
- ❌ Não pode acessar Financeiro
- ❌ Não pode acessar Relatórios
- ❌ Não pode acessar Histórico
- ❌ Não pode gerenciar Usuários

---

### **4. 🏗️ ENGENHEIRO (Nível 5)**
**Acesso Técnico - Foco em projetos e especificações**

#### **Módulos com Acesso:**
- ✅ **Obras** - Visualizar, editar (suas obras)
- ✅ **Assinatura Digital** - Assinar documentos técnicos

#### **Restrições:**
- ❌ Não pode acessar Dashboard
- ❌ Não pode acessar Notificações
- ❌ Não pode acessar Clientes
- ❌ Não pode acessar Controle de Gruas
- ❌ Não pode acessar Livros de Gruas
- ❌ Não pode acessar Estoque
- ❌ Não pode acessar Ponto Eletrônico
- ❌ Não pode acessar RH
- ❌ Não pode acessar Financeiro
- ❌ Não pode acessar Relatórios
- ❌ Não pode acessar Histórico
- ❌ Não pode gerenciar Usuários

---

### **5. 🔧 OPERADOR (Nível 3)**
**Acesso Operacional Básico - Foco em operações diárias**

#### **Módulos com Acesso:**
- ✅ **Obras** - Visualizar (suas obras)
- ✅ **Assinatura Digital** - Assinar documentos operacionais

#### **Restrições:**
- ❌ Não pode acessar Dashboard
- ❌ Não pode acessar Notificações
- ❌ Não pode acessar Clientes
- ❌ Não pode acessar Controle de Gruas
- ❌ Não pode acessar Livros de Gruas
- ❌ Não pode acessar Estoque
- ❌ Não pode acessar Ponto Eletrônico
- ❌ Não pode acessar RH
- ❌ Não pode acessar Financeiro
- ❌ Não pode acessar Relatórios
- ❌ Não pode acessar Histórico
- ❌ Não pode gerenciar Usuários

---

### **6. 👤 CLIENTE (Nível 2)**
**Acesso Limitado - Apenas visualização de seus dados**

#### **Módulos com Acesso:**
- ✅ **Obras** - Visualizar (suas obras)
- ✅ **Livros de Gruas** - Visualizar (gruas específicas)
- ✅ **Assinatura Digital** - Assinar documentos contratuais

#### **Restrições:**
- ❌ Não pode acessar Dashboard
- ❌ Não pode acessar Notificações
- ❌ Não pode acessar Clientes
- ❌ Não pode acessar Controle de Gruas
- ❌ Não pode acessar Estoque
- ❌ Não pode acessar Ponto Eletrônico
- ❌ Não pode acessar RH
- ❌ Não pode acessar Financeiro
- ❌ Não pode acessar Relatórios
- ❌ Não pode acessar Histórico
- ❌ Não pode gerenciar Usuários

---

### **7. 🏗️ MESTRE DE OBRA (Nível 4)**
**Acesso de Campo - Gestão de obra específica**

#### **Módulos com Acesso:**
- ✅ **Obras** - Visualizar, editar (sua obra)
- ✅ **Assinatura Digital** - Assinar documentos da obra

#### **Restrições:**
- ❌ Não pode acessar Dashboard
- ❌ Não pode acessar Notificações
- ❌ Não pode acessar Clientes
- ❌ Não pode acessar Controle de Gruas
- ❌ Não pode acessar Livros de Gruas
- ❌ Não pode acessar Estoque
- ❌ Não pode acessar Ponto Eletrônico
- ❌ Não pode acessar RH
- ❌ Não pode acessar Financeiro
- ❌ Não pode acessar Relatórios
- ❌ Não pode acessar Histórico
- ❌ Não pode gerenciar Usuários

---

## 🗂️ **Estrutura de Permissões por Módulo - Especificações Exatas**

### **📊 DASHBOARD**
| Perfil | Acesso |
|--------|--------|
| Admin | ✅ |
| Gerente | ✅ |
| Supervisor | ❌ |
| Engenheiro | ❌ |
| Operador | ❌ |
| Cliente | ❌ |
| Mestre de Obra | ❌ |

### **🔔 NOTIFICAÇÕES**
| Perfil | Acesso |
|--------|--------|
| Admin | ✅ |
| Gerente | ✅ |
| Supervisor | ❌ |
| Engenheiro | ❌ |
| Operador | ❌ |
| Cliente | ❌ |
| Mestre de Obra | ❌ |

### **👥 CLIENTES**
| Perfil | Acesso |
|--------|--------|
| Admin | ✅ |
| Gerente | ✅ |
| Supervisor | ❌ |
| Engenheiro | ❌ |
| Operador | ❌ |
| Cliente | ❌ |
| Mestre de Obra | ❌ |

### **🏢 OBRAS**
| Perfil | Acesso | Observações |
|--------|--------|-------------|
| Admin | ✅ | Acesso total |
| Gerente | ✅ | Acesso total |
| Supervisor | ✅ | Apenas suas obras |
| Engenheiro | ✅ | Apenas suas obras |
| Operador | ✅ | Apenas suas obras |
| Cliente | ✅ | Apenas suas obras |
| Mestre de Obra | ✅ | Apenas sua obra |

### **🏗️ CONTROLE DE GRUAS**
| Perfil | Acesso |
|--------|--------|
| Admin | ✅ |
| Gerente | ✅ |
| Supervisor | ✅ |
| Engenheiro | ❌ |
| Operador | ❌ |
| Cliente | ❌ |
| Mestre de Obra | ❌ |

### **📚 LIVROS DE GRUAS**
| Perfil | Acesso | Observações |
|--------|--------|-------------|
| Admin | ✅ | Todos os livros |
| Gerente | ✅ | Todos os livros |
| Supervisor | ✅ | Todos os livros |
| Engenheiro | ✅ | Todos os livros |
| Operador | ✅ | Todos os livros |
| Cliente | ✅ | Apenas gruas específicas |
| Mestre de Obra | ✅ | Todos os livros |

### **📦 ESTOQUE**
| Perfil | Acesso |
|--------|--------|
| Admin | ✅ |
| Gerente | ✅ |
| Supervisor | ✅ |
| Engenheiro | ❌ |
| Operador | ❌ |
| Cliente | ❌ |
| Mestre de Obra | ❌ |

### **⏰ PONTO ELETRÔNICO**
| Perfil | Acesso | Observações |
|--------|--------|-------------|
| Admin | ✅ | Acesso total |
| Gerente | ✅ | Acesso total |
| Supervisor | ✅ | Apenas no app |
| Engenheiro | ❌ | - |
| Operador | ❌ | - |
| Cliente | ❌ | - |
| Mestre de Obra | ❌ | - |

### **👷 RH**
| Perfil | Acesso |
|--------|--------|
| Admin | ✅ |
| Gerente | ✅ |
| Supervisor | ✅ |
| Engenheiro | ❌ |
| Operador | ❌ |
| Cliente | ❌ |
| Mestre de Obra | ❌ |

### **💰 FINANCEIRO**
| Perfil | Acesso |
|--------|--------|
| Admin | ✅ |
| Gerente | ✅ |
| Supervisor | ❌ |
| Engenheiro | ❌ |
| Operador | ❌ |
| Cliente | ❌ |
| Mestre de Obra | ❌ |

### **📊 RELATÓRIOS**
| Perfil | Acesso |
|--------|--------|
| Admin | ✅ |
| Gerente | ✅ |
| Supervisor | ❌ |
| Engenheiro | ❌ |
| Operador | ❌ |
| Cliente | ❌ |
| Mestre de Obra | ❌ |

### **📜 HISTÓRICO**
| Perfil | Acesso |
|--------|--------|
| Admin | ✅ |
| Gerente | ✅ |
| Supervisor | ❌ |
| Engenheiro | ❌ |
| Operador | ❌ |
| Cliente | ❌ |
| Mestre de Obra | ❌ |

### **✍️ ASSINATURA DIGITAL**
| Perfil | Acesso | Observações |
|--------|--------|-------------|
| Admin | ✅ | Todas as assinaturas |
| Gerente | ✅ | Todas as assinaturas |
| Supervisor | ✅ | Documentos relacionados |
| Engenheiro | ✅ | Documentos técnicos |
| Operador | ✅ | Documentos operacionais |
| Cliente | ✅ | Documentos contratuais |
| Mestre de Obra | ✅ | Documentos da obra |

### **👤 USUÁRIOS**
| Perfil | Acesso |
|--------|--------|
| Admin | ✅ |
| Gerente | ✅ |
| Supervisor | ❌ |
| Engenheiro | ❌ |
| Operador | ❌ |
| Cliente | ❌ |
| Mestre de Obra | ❌ |

### **📧 CONFIGURAÇÕES DE EMAIL**
| Perfil | Acesso |
|--------|--------|
| Admin | ✅ |
| Gerente | ❌ |
| Supervisor | ❌ |
| Engenheiro | ❌ |
| Operador | ❌ |
| Cliente | ❌ |
| Mestre de Obra | ❌ |

---

## 🚀 **Atualizações Necessárias - Frontend e Backend**

### **📋 BACKEND - Atualizações Necessárias**

#### **1. 🗄️ Banco de Dados**
- [ ] **Executar migração SQL** - `09_create_permissions_system.sql`
- [ ] **Criar tabelas:**
  - `perfis` - 7 perfis com níveis de acesso
  - `permissoes` - 50+ permissões por módulo
  - `perfil_permissoes` - Relacionamento perfil-permissão
  - `usuario_perfis` - Relacionamento usuário-perfil

#### **2. 🔧 Middleware de Autorização**
- [ ] **Atualizar `middleware/auth.js`** com função `requirePermission(permission)`
- [ ] **Proteger todas as rotas** com permissões específicas:
  - `GET /api/dashboard` - `dashboard:visualizar`
  - `GET /api/notificacoes` - `notificacoes:visualizar`
  - `GET /api/clientes` - `clientes:visualizar`
  - `GET /api/obras` - `obras:visualizar`
  - `GET /api/gruas` - `gruas:visualizar`
  - `GET /api/livros-gruas` - `livros_gruas:visualizar`
  - `GET /api/estoque` - `estoque:visualizar`
  - `GET /api/ponto-eletronico` - `ponto_eletronico:visualizar`
  - `GET /api/rh` - `rh:visualizar`
  - `GET /api/financeiro` - `financeiro:visualizar`
  - `GET /api/relatorios` - `relatorios:visualizar`
  - `GET /api/historico` - `historico:visualizar`
  - `GET /api/assinaturas` - `assinatura_digital:visualizar`
  - `GET /api/usuarios` - `usuarios:visualizar`
  - `GET /api/configuracoes/email` - `email:configurar`

#### **3. 📡 Endpoints de Permissões**
- [ ] **Criar endpoints para gerenciar permissões:**
  - `GET /api/permissoes/perfis` - Listar perfis
  - `GET /api/permissoes/permissoes` - Listar permissões
  - `POST /api/permissoes/perfis/{id}/permissoes` - Atualizar permissões do perfil
- [ ] **Atualizar endpoint `/api/auth/me`** para retornar permissões do usuário

### **📋 FRONTEND - Atualizações Necessárias**

#### **1. 🛡️ Componentes de Proteção**
- [ ] **Criar `components/protected-route.tsx`** - Proteção de rotas
- [ ] **Criar `components/protected-section.tsx`** - Proteção de seções
- [ ] **Criar `hooks/use-permissions.ts`** - Hook de permissões
- [ ] **Criar `hooks/use-permission-check.ts`** - Verificação de permissões

#### **2. 🧭 Navegação Condicional**
- [ ] **Atualizar `app/dashboard/layout.tsx`** para ocultar itens de menu baseado em permissões:
  - **Dashboard** - Apenas Admin, Gerente
  - **Notificações** - Apenas Admin, Gerente
  - **Clientes** - Apenas Admin, Gerente
  - **Obras** - Todos (com limitações)
  - **Controle de Gruas** - Admin, Gerente, Supervisor
  - **Livros de Gruas** - Todos
  - **Estoque** - Admin, Gerente, Supervisor
  - **Ponto Eletrônico** - Admin, Gerente, Supervisor
  - **RH** - Admin, Gerente, Supervisor
  - **Financeiro** - Apenas Admin, Gerente
  - **Relatórios** - Apenas Admin, Gerente
  - **Histórico** - Apenas Admin, Gerente
  - **Assinatura Digital** - Todos
  - **Usuários** - Apenas Admin, Gerente
  - **Configurações de Email** - Apenas Admin

#### **3. 🔐 Proteção de Páginas**
- [ ] **Proteger páginas principais:**
  - `/dashboard` - `dashboard:visualizar`
  - `/dashboard/notificacoes` - `notificacoes:visualizar`
  - `/dashboard/clientes` - `clientes:visualizar`
  - `/dashboard/obras` - `obras:visualizar`
  - `/dashboard/gruas` - `gruas:visualizar`
  - `/dashboard/livros-gruas` - `livros_gruas:visualizar`
  - `/dashboard/estoque` - `estoque:visualizar`
  - `/dashboard/ponto` - `ponto_eletronico:visualizar`
  - `/dashboard/rh` - `rh:visualizar`
  - `/dashboard/financeiro` - `financeiro:visualizar`
  - `/dashboard/relatorios` - `relatorios:visualizar`
  - `/dashboard/historico` - `historico:visualizar`
  - `/dashboard/assinatura` - `assinatura_digital:visualizar`
  - `/dashboard/usuarios` - `usuarios:visualizar`
  - `/dashboard/configuracoes/email` - `email:configurar`

#### **4. 🎨 Proteção de Seções**
- [ ] **Proteger seções dentro das páginas:**
  - Botões de criar/editar/excluir
  - Seções financeiras
  - Relatórios sensíveis
  - Dados de usuários

#### **5. 👥 Gestão de Usuários**
- [ ] **Criar página de gerenciamento de perfis** - `/dashboard/perfis`
- [ ] **Criar página de atribuição de permissões** - `/dashboard/permissoes`
- [ ] **Atualizar página de usuários** para incluir seleção de perfil
- [ ] **Implementar interface para gerenciar permissões**

#### **6. 🔐 Autenticação**
- [ ] **Atualizar `hooks/use-auth.ts`** para incluir permissões
- [ ] **Implementar carregamento de permissões** no login
- [ ] **Adicionar cache de permissões** no localStorage
- [ ] **Implementar refresh de permissões**

### **📊 Resumo de Implementação**

#### **Backend (8-10 horas):**
1. Executar migração SQL (1 hora)
2. Atualizar middleware de autenticação (2 horas)
3. Proteger todas as rotas (3-4 horas)
4. Criar endpoints de permissões (2-3 horas)

#### **Frontend (12-15 horas):**
1. Criar componentes de proteção (3-4 horas)
2. Atualizar navegação condicional (2-3 horas)
3. Proteger páginas principais (3-4 horas)
4. Proteger seções específicas (2-3 horas)
5. Implementar gestão de usuários (2-3 horas)

#### **Total Estimado: 20-25 horas**

---

## 🔧 **Implementação Técnica**

### **1. Estrutura do Banco de Dados**

#### **Tabela `perfis`:**
```sql
CREATE TABLE perfis (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  nivel_acesso INTEGER NOT NULL CHECK (nivel_acesso BETWEEN 1 AND 10),
  status VARCHAR(20) DEFAULT 'Ativo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Tabela `permissoes`:**
```sql
CREATE TABLE permissoes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  modulo VARCHAR(50) NOT NULL,
  acao VARCHAR(50) NOT NULL,
  recurso VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Ativa',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Tabela `perfil_permissoes`:**
```sql
CREATE TABLE perfil_permissoes (
  id SERIAL PRIMARY KEY,
  perfil_id INTEGER REFERENCES perfis(id),
  permissao_id INTEGER REFERENCES permissoes(id),
  data_atribuicao TIMESTAMP DEFAULT NOW(),
  atribuido_por INTEGER,
  status VARCHAR(20) DEFAULT 'Ativa',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **2. Permissões por Módulo**

#### **Módulo: `dashboard`**
- `dashboard:visualizar` - Visualizar dashboard
- `dashboard:personalizar` - Personalizar widgets
- `dashboard:exportar` - Exportar dados

#### **Módulo: `usuarios`**
- `usuarios:visualizar` - Visualizar usuários
- `usuarios:criar` - Criar usuários
- `usuarios:editar` - Editar usuários
- `usuarios:excluir` - Excluir usuários
- `usuarios:gerenciar_permissoes` - Gerenciar permissões

#### **Módulo: `obras`**
- `obras:visualizar` - Visualizar obras
- `obras:criar` - Criar obras
- `obras:editar` - Editar obras
- `obras:excluir` - Excluir obras
- `obras:aprovar` - Aprovar obras

#### **Módulo: `gruas`**
- `gruas:visualizar` - Visualizar gruas
- `gruas:criar` - Criar gruas
- `gruas:editar` - Editar gruas
- `gruas:excluir` - Excluir gruas
- `gruas:operar` - Operar gruas

#### **Módulo: `ponto_eletronico`**
- `ponto:visualizar` - Visualizar registros
- `ponto:registrar` - Registrar ponto
- `ponto:aprovar` - Aprovar horas extras
- `ponto:relatorios` - Acessar relatórios

#### **Módulo: `financeiro`**
- `financeiro:visualizar` - Visualizar dados financeiros
- `financeiro:criar` - Criar registros financeiros
- `financeiro:editar` - Editar registros financeiros
- `financeiro:aprovar` - Aprovar transações
- `financeiro:relatorios` - Acessar relatórios financeiros

### **3. Middleware de Autorização**

```javascript
// middleware/auth.js
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      // Buscar permissões do usuário
      const { data: permissoes } = await supabaseAdmin
        .from('perfil_permissoes')
        .select(`
          permissoes(
            modulo,
            acao
          )
        `)
        .eq('perfil_id', user.perfil_id)
        .eq('status', 'Ativa');
      
      const userPermissions = permissoes?.map(p => 
        `${p.permissoes.modulo}:${p.permissoes.acao}`
      ) || [];
      
      if (userPermissions.includes(permission)) {
        next();
      } else {
        res.status(403).json({
          error: 'Acesso negado',
          message: 'Você não tem permissão para acessar este recurso'
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  };
};
```

### **4. Componente de Proteção de Rota**

```typescript
// components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  fallback = <div>Acesso negado</div>
}) => {
  const { user, permissions } = useAuth();
  
  if (!user || !permissions.includes(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
```

---

## 🚀 **Implementação no Frontend**

### **1. Hook de Permissões**

```typescript
// hooks/use-permissions.ts
export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  
  useEffect(() => {
    if (user?.perfil) {
      // Buscar permissões do perfil
      fetchUserPermissions(user.perfil.id)
        .then(setPermissions)
        .catch(console.error);
    }
  }, [user]);
  
  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };
  
  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some(permission => hasPermission(permission));
  };
  
  return { permissions, hasPermission, hasAnyPermission };
};
```

### **2. Proteção de Componentes**

```typescript
// Exemplo de uso
const DashboardPage = () => {
  const { hasPermission } = usePermissions();
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {hasPermission('usuarios:visualizar') && (
        <UsersSection />
      )}
      
      {hasPermission('financeiro:visualizar') && (
        <FinancialSection />
      )}
    </div>
  );
};
```

---

## 📋 **Checklist de Implementação**

### **Backend:**
- [ ] Criar tabelas de perfis e permissões
- [ ] Implementar middleware de autorização
- [ ] Criar endpoints para gerenciar permissões
- [ ] Atualizar rotas existentes com proteção
- [ ] Criar script de migração de dados

### **Frontend:**
- [ ] Implementar hook de permissões
- [ ] Criar componente ProtectedRoute
- [ ] Atualizar navegação com base em permissões
- [ ] Proteger componentes sensíveis
- [ ] Implementar fallbacks para acesso negado

### **Testes:**
- [ ] Testar cada perfil com suas permissões
- [ ] Verificar restrições de acesso
- [ ] Testar middleware de autorização
- [ ] Validar proteção de rotas

---

## 🎯 **Conclusão**

Este sistema de permissões oferece:

- **Controle granular** de acesso por módulo e ação
- **Hierarquia clara** de perfis com níveis de acesso
- **Flexibilidade** para adicionar novos perfis e permissões
- **Segurança robusta** com validação no backend e frontend
- **Escalabilidade** para futuras funcionalidades

**O sistema está pronto para implementação e pode ser adaptado conforme as necessidades específicas da empresa!** 🚀
