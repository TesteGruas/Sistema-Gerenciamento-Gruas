# Estrutura de Níveis de Acesso - Sistema de Gestão de Gruas

## 📋 Visão Geral

Este documento descreve a estrutura hierárquica de níveis de acesso do sistema, definindo 8 perfis distintos com diferentes permissões e responsabilidades.

## 🏗️ Hierarquia de Níveis

| Nível | Perfil | Descrição | Permissões Principais |
|-------|--------|-----------|----------------------|
| **10** | **Diretoria** | Acesso total ao sistema | Todas as permissões (`*`) |
| **9** | **RH** | Gestão de pessoas e funcionários | Funcionários, Ponto, Justificativas, Documentos, Relatórios RH |
| **8** | **Financeiro** | Gestão financeira e contábil | Financeiro, Orçamentos, Contratos, Relatórios Financeiros |
| **7** | **Funcionário Gestor de Obra** | Supervisão operacional de obras | Obras, Gruas, Clientes, Ponto, Documentos, Livro Grua, Estoque |
| **6** | **Supervisor Técnico** | Manutenção e estoque | Gruas (gerenciar), Estoque (gerenciar), Documentos técnicos, Relatórios técnicos |
| **5** | **Operador de Grua** | Operações de campo | Gruas (visualizar/editar), Livro Grua (criar/editar), Estoque (visualizar), Obras (visualizar) |
| **4** | **Funcionário Básico** | Operação diária via APP | Ponto próprio, Documentos, Livro Grua (criar), Obras (visualizar onde está alocado) |
| **1** | **Cliente** | Acesso limitado | Documentos (visualizar/assinar), Obras próprias, Notificações |

---

## 📊 Detalhamento por Perfil

### 1. Diretoria (Nível 10)

**Descrição:** Acesso completo e irrestrito ao sistema.

**Permissões:**
- `*` (Wildcard - todas as permissões)

**Módulos Acessíveis:**
- Todos os módulos do sistema
- Configurações do sistema
- Gerenciamento de perfis e permissões
- Relatórios completos
- Histórico e auditoria

**Uso Típico:**
- Administradores do sistema
- Diretores e sócios
- Gestores com necessidade de acesso total

---

### 2. RH (Nível 9)

**Descrição:** Gestão completa de recursos humanos, funcionários, ponto eletrônico e justificativas.

**Permissões Principais:**
- `usuarios:visualizar`
- `usuarios:criar`
- `usuarios:editar`
- `usuarios:gerenciar`
- `funcionarios:visualizar`
- `funcionarios:criar`
- `funcionarios:editar`
- `funcionarios:excluir`
- `funcionarios:gerenciar`
- `ponto:visualizar`
- `ponto:gerenciar`
- `ponto:aprovacoes`
- `ponto:relatorios`
- `ponto:editar`
- `ponto_eletronico:visualizar`
- `ponto_eletronico:gerenciar`
- `ponto_eletronico:aprovacoes`
- `ponto_eletronico:relatorios`
- `justificativas:visualizar`
- `justificativas:aprovar`
- `justificativas:gerenciar`
- `documentos:visualizar`
- `documentos:gerenciar`
- `rh:visualizar`
- `rh:gerenciar`
- `rh:relatorios`
- `dashboard:visualizar`
- `notificacoes:visualizar`
- `notificacoes:gerenciar`

**Módulos Acessíveis:**
- ✅ Usuários e Funcionários
- ✅ Ponto Eletrônico
- ✅ Justificativas
- ✅ Documentos (gerenciamento)
- ✅ RH e Relatórios
- ✅ Dashboard
- ✅ Notificações
- ❌ Obras (sem acesso)
- ❌ Gruas (sem acesso)
- ❌ Financeiro (sem acesso)
- ❌ Estoque (sem acesso)

**Uso Típico:**
- Departamento de Recursos Humanos
- Gestores de pessoas
- Analistas de RH

---

### 3. Financeiro (Nível 8)

**Descrição:** Gestão financeira, orçamentos, contratos e relatórios financeiros.

**Permissões Principais:**
- `financeiro:visualizar`
- `financeiro:criar`
- `financeiro:editar`
- `financeiro:excluir`
- `financeiro:gerenciar`
- `financeiro:relatorios`
- `orcamentos:visualizar`
- `orcamentos:criar`
- `orcamentos:editar`
- `orcamentos:excluir`
- `orcamentos:gerenciar`
- `contratos:visualizar`
- `contratos:criar`
- `contratos:editar`
- `contratos:excluir`
- `contratos:gerenciar`
- `clientes:visualizar`
- `clientes:gerenciar`
- `documentos:visualizar`
- `documentos:gerenciar`
- `dashboard:visualizar`
- `notificacoes:visualizar`
- `notificacoes:gerenciar`

**Módulos Acessíveis:**
- ✅ Financeiro
- ✅ Orçamentos
- ✅ Contratos
- ✅ Clientes (visualização e gerenciamento)
- ✅ Documentos (gerenciamento)
- ✅ Relatórios Financeiros
- ✅ Dashboard
- ✅ Notificações
- ❌ Ponto Eletrônico (sem acesso)
- ❌ Obras (sem acesso)
- ❌ Gruas (sem acesso)
- ❌ Funcionários (sem acesso)
- ❌ Estoque (sem acesso)

**Uso Típico:**
- Departamento Financeiro
- Contadores
- Analistas Financeiros
- Gestores Financeiros

---

### 4. Funcionário Gestor de Obra (Nível 7)

**Descrição:** Supervisão operacional completa de obras, gruas, clientes e operações de campo.

**Permissões Principais:**
- `obras:visualizar`
- `obras:criar`
- `obras:editar`
- `obras:excluir`
- `obras:gerenciar`
- `obras:relatorios`
- `gruas:visualizar`
- `gruas:criar`
- `gruas:editar`
- `gruas:excluir`
- `gruas:gerenciar`
- `gruas:relatorios`
- `clientes:visualizar`
- `clientes:criar`
- `clientes:editar`
- `clientes:excluir`
- `clientes:gerenciar`
- `ponto:visualizar`
- `ponto:gerenciar`
- `ponto:aprovacoes`
- `ponto:relatorios`
- `ponto_eletronico:visualizar`
- `ponto_eletronico:gerenciar`
- `ponto_eletronico:aprovacoes`
- `documentos:visualizar`
- `documentos:criar`
- `documentos:editar`
- `documentos:gerenciar`
- `documentos:assinatura`
- `livros_gruas:visualizar`
- `livros_gruas:criar`
- `livros_gruas:editar`
- `livros_gruas:gerenciar`
- `estoque:visualizar`
- `estoque:criar`
- `estoque:editar`
- `estoque:gerenciar`
- `estoque:movimentacoes`
- `estoque:relatorios`
- `justificativas:visualizar`
- `justificativas:aprovar`
- `justificativas:gerenciar`
- `dashboard:visualizar`
- `notificacoes:visualizar`
- `notificacoes:gerenciar`

**Módulos Acessíveis:**
- ✅ Obras (gerenciamento completo)
- ✅ Gruas (gerenciamento completo)
- ✅ Clientes (gerenciamento completo)
- ✅ Ponto Eletrônico (gerenciamento e aprovações)
- ✅ Documentos (gerenciamento completo)
- ✅ Livro de Gruas (gerenciamento completo)
- ✅ Estoque (gerenciamento completo)
- ✅ Justificativas (aprovação)
- ✅ Dashboard
- ✅ Notificações
- ❌ Financeiro (sem acesso)
- ❌ Orçamentos (sem acesso)
- ❌ Funcionários (sem acesso - apenas visualização de alocados)

**Uso Típico:**
- Gestores de Obra
- Supervisores de Campo
- Coordenadores de Obra
- Engenheiros de Obra

---

### 5. Supervisor Técnico (Nível 6)

**Descrição:** Supervisão técnica de manutenção, estoque e equipamentos.

**Permissões Principais:**
- `gruas:visualizar`
- `gruas:criar`
- `gruas:editar`
- `gruas:gerenciar`
- `gruas:relatorios`
- `estoque:visualizar`
- `estoque:criar`
- `estoque:editar`
- `estoque:excluir`
- `estoque:gerenciar`
- `estoque:movimentacoes`
- `estoque:relatorios`
- `documentos:visualizar`
- `documentos:criar`
- `documentos:editar`
- `documentos:gerenciar`
- `livros_gruas:visualizar`
- `livros_gruas:criar`
- `livros_gruas:editar`
- `livros_gruas:gerenciar`
- `dashboard:visualizar`
- `notificacoes:visualizar`
- `notificacoes:gerenciar`

**Módulos Acessíveis:**
- ✅ Gruas (gerenciamento completo)
- ✅ Estoque (gerenciamento completo)
- ✅ Documentos técnicos (gerenciamento)
- ✅ Livro de Gruas (gerenciamento)
- ✅ Relatórios técnicos
- ✅ Dashboard
- ✅ Notificações
- ❌ Obras (sem acesso)
- ❌ Clientes (sem acesso)
- ❌ Ponto Eletrônico (sem acesso)
- ❌ Financeiro (sem acesso)
- ❌ Funcionários (sem acesso)

**Uso Típico:**
- Supervisores de Manutenção
- Técnicos de Equipamentos
- Gestores de Estoque
- Coordenadores Técnicos

---

### 6. Operador de Grua (Nível 5)

**Descrição:** Operações de campo com foco em gruas e atividades operacionais.

**Permissões Principais:**
- `gruas:visualizar`
- `gruas:editar`
- `livros_gruas:visualizar`
- `livros_gruas:criar`
- `livros_gruas:editar`
- `estoque:visualizar`
- `obras:visualizar`
- `documentos:visualizar`
- `documentos:assinatura`
- `ponto:visualizar`
- `ponto:registrar`
- `ponto_eletronico:visualizar`
- `ponto_eletronico:registrar`
- `justificativas:criar`
- `justificativas:visualizar`
- `dashboard:visualizar`
- `notificacoes:visualizar`

**Módulos Acessíveis:**
- ✅ Gruas (visualizar e editar)
- ✅ Livro de Gruas (criar e editar)
- ✅ Estoque (apenas visualizar)
- ✅ Obras (apenas visualizar)
- ✅ Documentos (visualizar e assinar)
- ✅ Ponto Eletrônico (próprio ponto)
- ✅ Justificativas (criar próprias)
- ✅ Dashboard
- ✅ Notificações
- ❌ Clientes (sem acesso)
- ❌ Financeiro (sem acesso)
- ❌ Funcionários (sem acesso)
- ❌ Aprovações (sem acesso)

**Uso Típico:**
- Operadores de Grua
- Mecânicos de Campo
- Técnicos de Equipamentos
- Operadores de Máquinas

---

### 7. Funcionário Básico (Nível 4)

**Descrição:** Operação diária via APP - ponto eletrônico, documentos e atividades básicas.

**Permissões Principais:**
- `ponto:visualizar`
- `ponto:registrar`
- `ponto_eletronico:visualizar`
- `ponto_eletronico:registrar`
- `documentos:visualizar`
- `documentos:assinatura`
- `assinatura_digital:visualizar`
- `livros_gruas:visualizar`
- `livros_gruas:criar`
- `obras:visualizar` (apenas obras onde está alocado)
- `justificativas:criar`
- `justificativas:visualizar`
- `notificacoes:visualizar`
- `dashboard:visualizar`

**Módulos Acessíveis:**
- ✅ Ponto Eletrônico (próprio ponto)
- ✅ Documentos (visualizar e assinar)
- ✅ Livro de Gruas (criar registros)
- ✅ Obras (apenas visualizar onde está alocado)
- ✅ Justificativas (criar próprias)
- ✅ Notificações (próprias)
- ✅ Dashboard (básico)
- ❌ Gruas (sem acesso)
- ❌ Estoque (sem acesso)
- ❌ Clientes (sem acesso)
- ❌ Financeiro (sem acesso)
- ❌ Funcionários (sem acesso)

**Uso Típico:**
- Funcionários de campo
- Sinaleiros
- Auxiliares
- Operários gerais
- Funcionários administrativos básicos

---

### 8. Cliente (Nível 1)

**Descrição:** Acesso limitado para visualização e assinatura de documentos relacionados às próprias obras.

**Permissões Principais:**
- `documentos:visualizar`
- `documentos:assinatura`
- `assinatura_digital:visualizar`
- `obras:visualizar` (apenas próprias obras)
- `notificacoes:visualizar`

**Módulos Acessíveis:**
- ✅ Documentos (visualizar e assinar)
- ✅ Obras (apenas próprias obras)
- ✅ Notificações (próprias)
- ❌ Todos os outros módulos (sem acesso)

**Uso Típico:**
- Clientes da empresa
- Representantes de clientes
- Usuários externos

---

## 🔐 Regras de Acesso

### Validação de Níveis

- O sistema valida que `nivel_acesso` está entre **1 e 10**
- Níveis mais altos têm acesso implícito a funcionalidades de níveis mais baixos (quando aplicável)
- Permissões específicas podem restringir acesso mesmo com nível alto

### Permissões Especiais

#### Wildcard (`*`)
- Apenas **Diretoria** possui wildcard completo
- Permite acesso a todas as funcionalidades do sistema

#### Permissões Contextuais
- **Funcionário Básico** e **Operador de Grua**: Acesso a obras apenas onde estão alocados
- **Cliente**: Acesso apenas às próprias obras
- **Ponto Eletrônico**: Funcionários só acessam próprio ponto (exceto RH e Gestores)

### Restrições Definidas

1. **RH (9)**:
   - ❌ Sem acesso a Obras
   - ❌ Sem acesso a Gruas
   - ❌ Sem acesso a Financeiro
   - ❌ Sem acesso a Estoque

2. **Financeiro (8)**:
   - ❌ Sem acesso a Ponto Eletrônico
   - ❌ Sem acesso a Obras
   - ❌ Sem acesso a Gruas
   - ❌ Sem acesso a Funcionários

3. **Funcionário Gestor de Obra (7)**:
   - ❌ Sem acesso a Financeiro
   - ❌ Sem acesso a Orçamentos
   - ❌ Sem acesso a Funcionários (apenas visualização de alocados)

---

## 📝 Formato de Permissões

As permissões seguem o padrão: `modulo:acao`

**Exemplos:**
- `gruas:visualizar` - Visualizar gruas
- `obras:criar` - Criar obras
- `ponto:gerenciar` - Gerenciar ponto eletrônico
- `financeiro:relatorios` - Acessar relatórios financeiros

**Módulos Disponíveis:**
- `dashboard`
- `usuarios`
- `perfis`
- `gruas`
- `obras`
- `ponto` / `ponto_eletronico`
- `documentos`
- `assinatura_digital`
- `livros_gruas`
- `estoque`
- `financeiro`
- `rh`
- `clientes`
- `relatorios`
- `justificativas`
- `notificacoes`
- `configuracoes`
- `email`
- `historico`
- `locacoes`

**Ações Disponíveis:**
- `visualizar`
- `criar`
- `editar`
- `excluir`
- `gerenciar`
- `relatorios`
- `aprovacoes`
- `aprovar`
- `registrar`
- `assinatura`
- `movimentacoes`

---

## 🗄️ Estrutura no Banco de Dados

### Tabela `perfis`

```sql
CREATE TABLE perfis (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  nivel_acesso INTEGER NOT NULL CHECK (nivel_acesso BETWEEN 1 AND 10),
  status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Valores Esperados

| nome | nivel_acesso | status |
|------|--------------|--------|
| Diretoria | 10 | Ativo |
| RH | 9 | Ativo |
| Financeiro | 8 | Ativo |
| Funcionário Gestor de Obra | 7 | Ativo |
| Supervisor Técnico | 6 | Ativo |
| Operador de Grua | 5 | Ativo |
| Funcionário Básico | 4 | Ativo |
| Cliente | 1 | Ativo |

---

## 🔄 Migração

Para implementar esta estrutura, execute a migração:

```bash
# Arquivo: backend-api/database/migrations/YYYYMMDD_nova_estrutura_niveis.sql
```

A migração irá:
1. Criar/atualizar os perfis com os novos níveis
2. Migrar usuários existentes para os novos perfis
3. Validar a estrutura criada

---

## 📚 Referências

- **Arquivo de Configuração:** `backend-api/src/config/roles.js`
- **Middleware de Permissões:** `backend-api/src/middleware/permissions.js`
- **Tipos TypeScript:** `types/permissions.ts`
- **Hook Frontend:** `hooks/use-permissions.ts`

---

## ✅ Checklist de Implementação

- [ ] Atualizar `backend-api/src/config/roles.js` com novos perfis
- [ ] Criar migração SQL para atualizar tabela `perfis`
- [ ] Atualizar `types/permissions.ts` com novos tipos
- [ ] Atualizar `hooks/use-permissions.ts` no frontend
- [ ] Atualizar `app/dashboard/layout.tsx` para novos perfis
- [ ] Testar permissões de cada perfil
- [ ] Documentar casos de uso específicos
- [ ] Atualizar interface de gerenciamento de perfis

---

**Última Atualização:** 2025-01-XX  
**Versão:** 3.0  
**Autor:** Sistema de Gestão de Gruas

