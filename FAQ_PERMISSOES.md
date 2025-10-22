# FAQ - Sistema de Permissões 2.0

## ❓ Perguntas Frequentes

### Geral

#### O que mudou no sistema de permissões?
O sistema foi simplificado de 6 perfis variáveis para **5 roles fixos**:
- **Admin** (nível 10) - Acesso total
- **Gestores** (nível 9) - Gerenciamento completo
- **Supervisores** (nível 6) - Operações e supervisão
- **Operários** (nível 4) - Ponto e documentos via APP
- **Clientes** (nível 1) - Documentos apenas

#### Por que simplificar o sistema?
1. **Performance**: Elimina consultas ao banco para verificar permissões
2. **Manutenibilidade**: Código mais simples e fácil de entender
3. **Clareza**: Permissões bem definidas por role
4. **Segurança**: Menos pontos de falha

#### O sistema antigo ainda funciona?
Não. Após a migração, o sistema v1.0 é desativado. As tabelas antigas são mantidas apenas para rollback.

---

### Roles e Permissões

#### Qual é a diferença entre Admin e Gestores?
Praticamente nenhuma em termos de permissões - ambos têm acesso total (`*`). A diferença é:
- **Admin**: Perfil técnico, geralmente para administradores do sistema
- **Gestores**: Perfil de negócio, para gerentes da empresa

#### O que um Supervisor pode fazer?
Supervisores têm acesso a módulos operacionais:
- ✅ Gruas (visualizar, gerenciar)
- ✅ Obras (visualizar, gerenciar)
- ✅ Ponto Eletrônico (visualizar, aprovar)
- ✅ Documentos (visualizar, gerenciar, assinar)
- ✅ Livro de Gruas (visualizar, gerenciar)
- ✅ Estoque (visualizar, gerenciar)
- ❌ Financeiro (sem acesso)
- ❌ RH (sem acesso)
- ❌ Usuários (sem acesso)

#### Operários podem acessar o dashboard web?
**Não**. Operários devem usar o **aplicativo PWA (móvel)** para:
- Registrar ponto
- Visualizar espelho de ponto
- Ver e assinar documentos
- Receber notificações

#### Clientes têm acesso a quais funcionalidades?
Clientes têm acesso **muito limitado**:
- ✅ Visualizar documentos (apenas os seus)
- ✅ Assinar documentos
- ✅ Ver notificações relacionadas aos seus documentos
- ❌ Sem acesso a qualquer outro módulo

#### Como saber qual é meu role?
1. Faça login no sistema
2. Seu role aparece no canto superior direito
3. Ou vá em Perfil > Minha Conta

---

### Dashboard e Navegação

#### Por que não consigo ver o menu de Usuários?
O menu de **Usuários** é restrito para:
- ✅ Admin (nível 10)
- ✅ Gestores (nível 9)
- ❌ Demais roles não têm acesso

#### Por que o menu mudou após a atualização?
O menu agora é **dinâmico** e mostra apenas os módulos que você tem permissão para acessar baseado no seu role.

#### Como solicitar acesso a um módulo?
1. Identifique o módulo necessário
2. Verifique qual role tem acesso (ver tabela acima)
3. Entre em contato com seu gestor ou RH
4. Eles podem atualizar seu perfil se justificado

---

### PWA (Aplicativo Móvel)

#### Todos os roles podem usar o PWA?
Sim, mas com funcionalidades diferentes:
- **Admin/Gestores**: Todas as funcionalidades
- **Supervisores**: Ponto, Documentos, Aprovações, Gruas
- **Operários**: Ponto, Documentos
- **Clientes**: Documentos apenas

#### Como acessar o PWA?
1. No navegador móvel, acesse: `https://seu-dominio.com/pwa`
2. Faça login com suas credenciais
3. O sistema redirecionará para a página inicial adequada ao seu role
4. Opcional: Adicione à tela inicial para uso como app

#### Por que fui redirecionado automaticamente para o PWA?
Se você é **Operário** ou **Cliente**, o sistema redireciona automaticamente para o PWA porque você não tem acesso ao dashboard web.

---

### Permissões Específicas

#### Posso aprovar horas extras?
Apenas se você for:
- ✅ Supervisor (nível 6+)
- ✅ Gestor (nível 9+)
- ✅ Admin (nível 10)

#### Posso criar novos usuários?
Apenas se você for:
- ✅ Admin (nível 10)
- ✅ Gestor (nível 9)

#### Posso ver relatórios financeiros?
Apenas se você for:
- ✅ Admin (nível 10)
- ✅ Gestor (nível 9)

#### Posso gerenciar gruas?
Depende do seu role:
- **Supervisores+**: ✅ Sim, podem visualizar e gerenciar
- **Operários**: ❌ Não
- **Clientes**: ❌ Não

#### Posso registrar ponto de outro funcionário?
**Não**. Cada funcionário deve registrar seu próprio ponto. Apenas Supervisores+ podem:
- Aprovar/rejeitar horas extras
- Justificar faltas
- Ver espelho de ponto de outros

---

### Problemas Comuns

#### Erro: "Você não tem permissão para acessar esta página"
**Causas possíveis**:
1. Seu role não tem acesso a este módulo
2. Seu perfil não foi atribuído corretamente
3. Cache do navegador desatualizado

**Soluções**:
1. Verifique qual é seu role (ver acima)
2. Se estiver incorreto, contate seu gestor
3. Limpe o cache do navegador (Ctrl+Shift+Delete)
4. Faça logout e login novamente

#### Erro: "Usuário sem perfil ativo"
**Causa**: Seu usuário não tem um role atribuído.

**Solução**: Entre em contato com:
- Seu gestor imediato
- Departamento de RH
- Administrador do sistema

#### Menu está vazio ou com poucos itens
**Causa**: Você provavelmente é Operário ou Cliente.

**Solução**: Isso é normal. Use o **PWA** para acessar as funcionalidades disponíveis para seu role.

#### Não consigo fazer login
**Causas possíveis**:
1. Email ou senha incorretos
2. Conta desativada
3. Conta sem perfil atribuído

**Soluções**:
1. Verifique suas credenciais
2. Use "Esqueci minha senha" se necessário
3. Contate o suporte se o problema persistir

---

### Desenvolvimento e Técnico

#### Como adicionar uma nova permissão?
1. Edite `backend-api/src/config/roles.js`
2. Adicione a permissão no array do role apropriado
3. Edite `types/permissions.ts` no frontend (se necessário)
4. Teste localmente
5. Deploy

Exemplo:
```javascript
'Supervisores': [
  // ... permissões existentes
  'novo_modulo:visualizar',  // Nova permissão
]
```

#### Como criar um novo role?
**Não é recomendado**. O sistema foi projetado para 5 roles fixos. Se realmente necessário:
1. Editar `backend-api/src/config/roles.js`
2. Adicionar migration SQL para criar o perfil no banco
3. Atualizar tipos TypeScript
4. Atualizar documentação
5. Testar extensivamente

#### Como as permissões são verificadas?
```javascript
// Frontend
const { hasPermission } = usePermissions()
if (hasPermission('gruas:visualizar')) {
  // Mostrar conteúdo
}

// Backend
app.get('/api/gruas', requirePermission('gruas:visualizar'), (req, res) => {
  // Handler
})
```

#### Onde estão definidas as permissões?
- **Backend**: `backend-api/src/config/roles.js`
- **Frontend**: `types/permissions.ts`
- **PWA**: `app/pwa/lib/permissions.ts`

---

### Migração e Atualização

#### Meus dados foram perdidos na migração?
**Não**. A migração apenas:
- Renomeou perfis
- Migrou "Visualizador" → "Operários"
- Manteve todos os usuários e dados

#### Posso reverter para o sistema antigo?
Sim, executando o script de rollback:
```sql
\i backend-api/database/migrations/20250122_rollback_simplificar_perfis.sql
```

**Importante**: Rollback deve ser feito imediatamente após a migração. Após alguns dias, pode haver inconsistências.

#### Como migrar usuários antigos?
Usuários antigos são migrados automaticamente pela migration SQL. Mapeamento:
- Administrador → Admin
- Gerente → Gestores
- Supervisor → Supervisores
- Operador → Operários
- **Visualizador → Operários** (perfil removido)
- Cliente → Clientes

---

### Melhores Práticas

#### Como atribuir roles aos novos usuários?
1. **Operacional** (registra ponto, vê documentos) → **Operários**
2. **Supervisão** (aprova ponto, gerencia operações) → **Supervisores**
3. **Gerência** (acesso completo) → **Gestores**
4. **TI/Admin** (acesso total + configurações) → **Admin**
5. **Externo** (apenas documentos) → **Clientes**

#### Quantos Admins devo ter?
- **Mínimo**: 2 (redundância)
- **Recomendado**: 2-3
- **Máximo**: 5 (segurança)

Admins têm acesso total, então mantenha o número baixo.

#### Posso ter sub-roles ou roles personalizados?
**Não** no sistema v2.0. O sistema foi simplificado para ter exatamente 5 roles fixos. Se precisar de permissões muito específicas, considere:
1. Usar um dos 5 roles existentes
2. Implementar lógica de negócio adicional no backend (ex: usuário pode editar apenas suas próprias obras)

---

## 📞 Contato e Suporte

### Ainda tem dúvidas?

**Usuários Finais**:
- 📧 Email: suporte@empresa.com
- 📱 WhatsApp: +55 (xx) xxxxx-xxxx
- 💬 Chat interno do sistema

**Desenvolvedores**:
- 📧 Email: dev@empresa.com
- 📚 Documentação: [GUIA_MIGRACAO_PERMISSOES.md](GUIA_MIGRACAO_PERMISSOES.md)
- 📝 Especificação: [SISTEMA-PERMISSOES-SIMPLIFICADO.md](SISTEMA-PERMISSOES-SIMPLIFICADO.md)

---

## 📚 Recursos Adicionais

- [Guia de Migração](GUIA_MIGRACAO_PERMISSOES.md)
- [Sistema de Permissões Simplificado](SISTEMA-PERMISSOES-SIMPLIFICADO.md)
- [README Principal](README.md)

---

**Última atualização**: 2025-01-22  
**Versão**: 2.0


