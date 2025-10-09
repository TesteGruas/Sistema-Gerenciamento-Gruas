# 🔄 Integrações Pendentes - Sistema de Gerenciamento de Gruas

## 📊 Resumo Executivo

**Última Atualização:** 09 de Outubro de 2025

| Categoria | Total | Integrado | Parcial | Pendente |
|-----------|-------|-----------|---------|----------|
| **Financeiro** | 10 | 3 | 2 | 5 |
| **RH** | 8 | 2 | 3 | 3 |
| **Operacional** | 7 | 3 | 1 | 3 |
| **PWA** | 5 | 2 | 2 | 1 |
| **Novos Módulos** | 2 | 0 | 0 | 2 |
| **TOTAL** | **32** | **10** | **8** | **14** |

**Prioridade:** Alta para Financeiro, Notificações e Aluguéis

---

## 🆕 NOVOS MÓDULOS IMPLEMENTADOS (AGUARDANDO BACKEND)

### 1. **Sistema de Notificações** ⏳
**Status:** Frontend Completo | Backend Pendente  
**Localização:** `/dashboard/notificacoes`  
**Documentação:** `NOTIFICACOES_README.md`

**Frontend Implementado:**
- ✅ Página de listagem de notificações com filtros
- ✅ Dropdown de notificações no header
- ✅ Criação de notificações (geral, por cliente, por funcionário, por obra)
- ✅ Seleção múltipla de destinatários
- ✅ Marcação de lida/não lida
- ✅ Estatísticas e contadores
- ✅ API Mock completa (`lib/api-notificacoes.ts`)

**APIs Backend Necessárias:**

#### 1.1 **GET** `/api/notificacoes`
Listar notificações do usuário logado
```typescript
Query: { 
  lida?: boolean
  limit?: number
  offset?: number
}
Response: {
  success: boolean
  data: Notificacao[]
  total: number
  naoLidas: number
}
```

#### 1.2 **POST** `/api/notificacoes`
Criar nova notificação
```typescript
Body: {
  titulo: string
  mensagem: string
  tipo: 'info' | 'alerta' | 'sucesso' | 'erro'
  prioridade: 'baixa' | 'media' | 'alta'
  destinatarioTipo: 'geral' | 'cliente' | 'funcionario' | 'obra'
  destinatarios?: Array<{
    id: string
    tipo: 'cliente' | 'funcionario' | 'obra'
    nome: string
    info?: string
  }>
}
```

#### 1.3 **PUT** `/api/notificacoes/:id/marcar-lida`
Marcar notificação como lida

#### 1.4 **DELETE** `/api/notificacoes/:id`
Deletar notificação

**Integrações Necessárias:**
- 🔔 Sistema de push notifications
- 📧 Envio de email para notificações importantes
- 📱 Notificações PWA
- 🔗 Integração com clientes, funcionários e obras

**Prioridade:** 🔴 ALTA (sistema de comunicação essencial)

---

### 2. **Aluguéis de Residências** ⏳
**Status:** Frontend Completo | Backend Pendente  
**Localização:** `/dashboard/financeiro/alugueis`  
**Documentação:** `ALUGUEIS_RESIDENCIAS_README.md`

**Frontend Implementado:**
- ✅ Gestão de residências (CRUD)
- ✅ Contratos de aluguel para funcionários
- ✅ Cálculo automático de subsídios
- ✅ Controle de pagamentos mensais
- ✅ Integração com busca de funcionários
- ✅ Estatísticas financeiras
- ✅ 3 Tabs: Aluguéis | Residências | Novo Aluguel
- ✅ API Mock completa (`lib/api-alugueis-residencias.ts`)

**APIs Backend Necessárias (16 endpoints):**

**Residências:**
- GET `/api/residencias` - Listar todas
- GET `/api/residencias/:id` - Buscar por ID
- POST `/api/residencias` - Criar nova
- PUT `/api/residencias/:id` - Atualizar
- DELETE `/api/residencias/:id` - Deletar

**Aluguéis:**
- GET `/api/alugueis` - Listar todos
- GET `/api/alugueis/:id` - Buscar por ID
- POST `/api/alugueis` - Criar contrato
- PUT `/api/alugueis/:id` - Atualizar
- POST `/api/alugueis/:id/encerrar` - Encerrar contrato

**Pagamentos:**
- GET `/api/alugueis/:id/pagamentos` - Listar pagamentos
- POST `/api/alugueis/:id/pagamentos` - Registrar pagamento
- PUT `/api/alugueis/:id/pagamentos/:pagId` - Atualizar pagamento
- GET `/api/alugueis/pagamentos/pendentes` - Listar pendentes

**Relatórios:**
- GET `/api/alugueis/estatisticas` - Dashboard
- GET `/api/alugueis/relatorio-financeiro` - Relatório período

**Integrações Necessárias:**
- 👥 Funcionários (buscar dados do funcionário)
- 💰 Folha de Pagamento (desconto em folha)
- 📊 Financeiro (lançamentos contábeis)
- 🔔 Notificações (alertas de vencimento)
- 📁 Upload de documentos (fotos, comprovantes)

**Banco de Dados Necessário:**
- Tabela `residencias`
- Tabela `alugueis_residencias`
- Tabela `pagamentos_aluguel`
- Tabela `residencias_fotos`

**Prioridade:** 🔴 ALTA (módulo financeiro com impacto direto)

---

## 🔴 PRIORIDADE ALTA - Módulos Financeiros

### 3. **Medições Financeiras**
**Status:** ⚠️ Parcialmente Integrado  
**Localização:** `/dashboard/financeiro/medicoes/page.tsx`

- ✅ **Integrado:** Medições e Locações
- ❌ **Pendente:** Receitas e Custos (linhas 168-218)

**Ação:**
- Integrar com `api-receitas.ts` (existe mas não usado)
- Integrar com `api-custos.ts` (existe mas não usado)

---

### 4. **Relatórios Financeiros**
**Status:** ❌ Totalmente Mockado  
**Localização:** `/dashboard/financeiro/relatorios/page.tsx`

**Dados Mockados:**
- Relatórios financeiros gerais
- Vendas e contratos
- Faturamento mensal
- Locações e estoque

**APIs Necessárias:**
- `POST /api/relatorios/gerar` - Gerar relatório customizado
- `GET /api/relatorios/faturamento` - Dados de faturamento
- `GET /api/relatorios/vendas` - Relatório de vendas
- `GET /api/relatorios/locacoes` - Relatório de locações

**Prioridade:** 🔴 ALTA

---

### 5. **Cadastro Financeiro**
**Status:** ❌ Totalmente Mockado  
**Localização:** `/dashboard/financeiro/cadastro/page.tsx`

**Mockado:**
- Clientes (existe API mas usa fallback)
- Fornecedores (não existe API)
- Produtos (não existe API)
- Funcionários (existe API mas usa fallback)

**APIs Necessárias:**
- `api-fornecedores.ts` (criar novo)
- `api-produtos.ts` ou `api-catalogo.ts` (criar novo)

**Prioridade:** 🟡 MÉDIA

---

### 6. **Logística**
**Status:** ❌ Totalmente Mockado  
**Localização:** `/dashboard/financeiro/logistica/page.tsx`

**Mockado:**
- Manifestos de carga
- CT-e (Conhecimento de Transporte)
- Motoristas
- Viagens

**APIs Necessárias:**
- `POST /api/logistica/manifestos` - Criar manifesto
- `GET /api/logistica/manifestos` - Listar manifestos
- `POST /api/logistica/cte` - Emitir CT-e
- `GET /api/logistica/motoristas` - Listar motoristas
- `POST /api/logistica/viagens` - Registrar viagem

**Prioridade:** 🟡 MÉDIA

---

### 7. **Impostos**
**Status:** ❌ Totalmente Mockado  
**Localização:** `/dashboard/financeiro/impostos/page.tsx`

**Mockado:**
- Pagamentos de impostos
- Relatórios mensais
- Cálculos tributários

**APIs Necessárias:**
- `GET /api/impostos` - Listar impostos
- `POST /api/impostos/calcular` - Calcular impostos
- `POST /api/impostos/pagar` - Registrar pagamento
- `GET /api/impostos/relatorio` - Relatório mensal

**Prioridade:** 🟡 MÉDIA

---

### 8. **Compras**
**Status:** ⚠️ Parcialmente Mockado  
**Localização:** `/dashboard/financeiro/compras/page.tsx`

- ✅ Módulo funcional
- ❌ Fornecedores em fallback mockado

**Ação:**
- Criar `api-fornecedores.ts` completo

**Prioridade:** 🟡 MÉDIA

---

### 9. **Vendas**
**Status:** ⚠️ Parcialmente Integrado  
**Localização:** `/dashboard/financeiro/vendas/page.tsx`

- ✅ Módulo funcional
- ❌ Fallback para clientes mockados

**Ação:**
- Garantir API de clientes estável
- Remover fallback

**Prioridade:** 🟢 BAIXA

---

### 10. **Contas Bancárias**
**Status:** ⚠️ Verificar Integração  
**Localização:** `/dashboard/financeiro/contas-bancarias/page.tsx`

**Ação:**
- Validar se está integrado com backend
- Testar operações de CRUD

---

## 🟡 PRIORIDADE MÉDIA - Módulos de RH

### 11. **Alocação Funcionários em Obras**
**Status:** ❌ Totalmente Mockado  
**Localização:** `/dashboard/rh-completo/obras/page.tsx`

**APIs Necessárias:**
- `GET /api/alocacoes` - Listar alocações
- `POST /api/alocacoes` - Alocar funcionário
- `DELETE /api/alocacoes/:id` - Remover alocação
- `GET /api/alocacoes/obra/:obraId` - Por obra

**Prioridade:** 🟡 MÉDIA

---

### 12. **Ponto Eletrônico (RH Completo)**
**Status:** ❌ Totalmente Mockado  
**Localização:** `/dashboard/rh-completo/ponto/page.tsx`

**Mockado:**
- Registros de ponto
- Resumo de horas por funcionário

**Ação:**
- Integrar com `api-ponto-eletronico.ts` (existe)
- Expandir funcionalidades

**Prioridade:** 🟡 MÉDIA

---

### 13. **Férias e Afastamentos**
**Status:** ⚠️ Parcialmente Integrado  
**Localização:** `/dashboard/rh-completo/ferias/page.tsx`

**Mockado:**
- Registros de férias
- Registros de afastamentos

**Ação:**
- Integrar com `api-ferias.ts` (existe)
- Criar endpoints de afastamentos

**Prioridade:** 🟡 MÉDIA

---

### 14. **Auditoria e Permissões**
**Status:** ⚠️ Parcialmente Mockado  
**Localização:** `/dashboard/rh-completo/auditoria/page.tsx`

**Mockado:**
- Perfis de usuário
- Permissões do sistema

**Ação:**
- Implementar sistema completo de permissões
- Integrar com `api-permissoes.ts` (existe)

**Prioridade:** 🟡 MÉDIA

---

### 15. **Cargos**
**Status:** ⚠️ Verificar  
**Localização:** `/dashboard/rh-completo/cargos/page.tsx`

**Ação:**
- Validar integração com backend

---

### 16. **Remuneração**
**Status:** ⚠️ Verificar  
**Localização:** `/dashboard/rh-completo/remuneracao/page.tsx`

**Ação:**
- Validar integração com backend

---

### 17. **Vales**
**Status:** ⚠️ Verificar  
**Localização:** `/dashboard/rh-completo/vales/page.tsx`

**Ação:**
- Validar integração com backend

---

### 18. **Histórico RH**
**Status:** ⚠️ Verificar  
**Localização:** `/dashboard/rh-completo/historico/page.tsx`

**Ação:**
- Validar integração com backend

---

## 🟢 PRIORIDADE BAIXA - Módulos Operacionais

### 19. **Gruas por Mês**
**Status:** ❌ Totalmente Mockado  
**Localização:** `/dashboard/gruas-mes/page.tsx`

**Mockado:**
- Controle mensal de gruas
- Horas trabalhadas
- Eficiência e custos

**APIs Necessárias:**
- `GET /api/gruas/mensais` - Controle mensal
- `POST /api/gruas/mensais` - Atualizar dados mensais

**Prioridade:** 🟢 BAIXA

---

### 20. **Checklist de Devolução**
**Status:** ❌ Totalmente Mockado  
**Localização:** `/dashboard/checklist-devolucao/page.tsx`

**Mockado:**
- Itens de devolução
- Obras e gruas

**APIs Necessárias:**
- `GET /api/checklist-devolucao` - Listar checklists
- `POST /api/checklist-devolucao` - Criar checklist
- `PUT /api/checklist-devolucao/:id` - Atualizar

**Prioridade:** 🟢 BAIXA

---

### 21. **Múltiplas Gruas por Obra**
**Status:** ❌ Totalmente Mockado  
**Localização:** `components/multiple-gruas-manager.tsx`

**Mockado:**
- Gruas alocadas
- Gruas disponíveis

**Ação:**
- Integrar com `api-grua-obra.ts` ou `api-obra-gruas.ts`

**Prioridade:** 🟢 BAIXA

---

### 22. **Livro de Grua**
**Status:** ✅ Integrado  
**Localização:** `lib/api-livro-grua.ts`

- ✅ CRUD completo implementado

---

### 23. **Gruas**
**Status:** ✅ Integrado  
**Localização:** `/dashboard/gruas`

- ✅ Listagem e gestão de gruas

---

### 24. **Obras**
**Status:** ✅ Integrado  
**Localização:** `/dashboard/obras`

- ✅ CRUD completo de obras

---

### 25. **Funcionários**
**Status:** ✅ Integrado  
**Localização:** `/dashboard/funcionarios`

- ✅ CRUD completo de funcionários

---

### 26. **Clientes**
**Status:** ✅ Integrado  
**Localização:** `/dashboard/clientes`

- ✅ CRUD completo de clientes

---

### 27. **Estoque**
**Status:** ✅ Integrado  
**Localização:** `/dashboard/estoque`

- ✅ Gestão de estoque

---

## 📱 PWA - Aplicativo Mobile

### 28. **PWA - Encarregador**
**Status:** ⚠️ Fallback Mockado  
**Localização:** `/app/pwa/encarregador/page.tsx`

**Ação:**
- Remover fallbacks mockados
- Garantir APIs estáveis

**Prioridade:** 🟡 MÉDIA

---

### 29. **PWA - Documentos**
**Status:** ⚠️ Fallback Mockado  
**Localização:** `/app/pwa/documentos/page.tsx`

**Ação:**
- Garantir API de documentos
- Remover fallback

**Prioridade:** 🟡 MÉDIA

---

### 30. **PWA - Assinatura**
**Status:** ❌ Totalmente Mockado  
**Localização:** `/app/pwa/assinatura/page.tsx`

**Mockado:**
- Lista completa de documentos

**Ação:**
- Integrar com sistema de assinaturas
- Conectar com API de documentos

**Prioridade:** 🟢 BAIXA

---

### 31. **PWA - Ponto**
**Status:** ✅ Integrado  
**Localização:** `/app/pwa/ponto`

- ✅ Sistema de ponto funcionando

---

### 32. **PWA - Gruas**
**Status:** ✅ Integrado  
**Localização:** `/app/pwa/gruas`

- ✅ Visualização de gruas

---

## 📚 Biblioteca de Dados Mock

### **Mock Data Central**
**Localização:** `lib/mock-data.ts`

**Contém:**
- Clientes
- Usuários
- Obras
- Gruas
- Documentos
- Custos
- Custos mensais

**Ação:**
- ⚠️ Manter apenas para testes/desenvolvimento
- ❌ Remover todas importações em produção
- ✅ Migrar módulos para APIs reais

---

## 🔧 Novas APIs que Precisam Ser Criadas

### Backend APIs - Ordem de Prioridade

#### 🔴 PRIORIDADE ALTA (Implementar Primeiro)

1. **api-notificacoes** ⭐ NOVO
   - Sistema completo de notificações
   - Push notifications
   - 4 endpoints principais

2. **api-alugueis-residencias** ⭐ NOVO
   - Gestão de residências
   - Contratos de aluguel
   - Pagamentos e relatórios
   - 16 endpoints

3. **api-relatorios-financeiros**
   - Geração de relatórios
   - Exportação PDF/Excel
   - Dashboards financeiros

#### 🟡 PRIORIDADE MÉDIA

4. **api-fornecedores**
   - CRUD de fornecedores
   - Integração com compras

5. **api-produtos** ou **api-catalogo**
   - Catálogo de produtos
   - Preços e estoque

6. **api-logistica**
   - Manifestos e CT-e
   - Motoristas e viagens

7. **api-impostos**
   - Cálculo automático
   - Controle de pagamentos

8. **api-alocacao-funcionarios**
   - Alocação em obras
   - Controle de horas

#### 🟢 PRIORIDADE BAIXA

9. **api-ferias-afastamentos**
   - Expandir API existente
   - Afastamentos médicos

10. **api-gruas-mensais**
    - Controle mensal
    - Eficiência e custos

11. **api-checklist-devolucao**
    - Gestão de devoluções

---

## 📋 Plano de Ação Recomendado

### 🔴 Fase 1 - NOVOS MÓDULOS (2-3 semanas)
**Prioridade Máxima**

1. ✅ Sistema de Notificações (backend)
   - Implementar 4 endpoints principais
   - Sistema de push notifications
   - Integração com email

2. ✅ Aluguéis de Residências (backend)
   - Implementar 16 endpoints
   - Estrutura de banco de dados
   - Integração com folha de pagamento

### 🔴 Fase 2 - FINANCEIRO (2-3 semanas)

3. ✅ Relatórios Financeiros
4. ✅ Integrar Receitas/Custos em Medições
5. ✅ API de Fornecedores
6. ✅ API de Produtos/Catálogo
7. ✅ Impostos

### 🟡 Fase 3 - RH (2 semanas)

8. ✅ Ponto eletrônico (expandir)
9. ✅ Alocação funcionários-obras
10. ✅ Férias e afastamentos completo
11. ✅ Permissões e auditoria

### 🟡 Fase 4 - LOGÍSTICA E OPERACIONAL (1-2 semanas)

12. ✅ Logística (manifestos, CT-e, viagens)
13. ✅ Gruas por mês
14. ✅ Checklist devolução
15. ✅ Múltiplas gruas

### 🟢 Fase 5 - PWA E LIMPEZA (1 semana)

16. ✅ Remover todos os fallbacks PWA
17. ✅ Garantir funcionamento offline
18. ✅ Remover imports de mock-data.ts
19. ✅ Testes finais

---

## 📊 Estatísticas Gerais

| Métrica | Valor |
|---------|-------|
| **Módulos Totais** | 32 |
| **Totalmente Integrados** | 10 (31%) |
| **Parcialmente Integrados** | 8 (25%) |
| **Pendentes** | 14 (44%) |
| **Novos Módulos Frontend** | 2 |
| **APIs a Criar** | 11 |
| **APIs a Melhorar** | 5 |
| **Linhas de Código Mock** | ~3.500+ |
| **Tempo Estimado Total** | 8-12 semanas |

---

## ✅ Checklist de Integração

Para cada módulo integrado, verificar:

- [ ] Substituir dados mock por chamadas de API
- [ ] Implementar tratamento de erros adequado
- [ ] Adicionar loading states
- [ ] Implementar validações frontend e backend
- [ ] Testar CRUD completo
- [ ] Documentar endpoints (Swagger/OpenAPI)
- [ ] Remover imports de `mock-data.ts`
- [ ] Adicionar testes unitários
- [ ] Adicionar testes de integração
- [ ] Testar em ambiente de staging
- [ ] Deploy em produção
- [ ] Monitoramento e logs

---

## 🔐 Considerações de Segurança

Para todas as novas APIs:

1. **Autenticação:** JWT com refresh token
2. **Autorização:** Sistema de permissões por módulo
3. **Validação:** Joi/Zod para validação de dados
4. **Rate Limiting:** Limitar requisições por IP/usuário
5. **Logs:** Auditoria completa de operações
6. **Sanitização:** Prevenir SQL Injection e XSS
7. **HTTPS:** Apenas conexões seguras
8. **CORS:** Configuração adequada

---

## 📝 Documentação Relacionada

- 📄 `NOTIFICACOES_README.md` - Documentação completa do sistema de notificações
- 📄 `ALUGUEIS_RESIDENCIAS_README.md` - Documentação completa de aluguéis
- 📄 `PWA_README.md` - Documentação do PWA
- 📄 `MANUAL_DO_USUARIO.md` - Manual do usuário

---

## 🎯 Próximos Passos Imediatos

### Esta Semana:
1. ⭐ Implementar backend de **Notificações**
2. ⭐ Implementar backend de **Aluguéis de Residências**
3. 📋 Criar estrutura de banco de dados para ambos

### Próxima Semana:
1. Testar notificações em produção
2. Testar aluguéis em produção
3. Iniciar Fase 2 (Relatórios Financeiros)

---

**Data do Relatório:** 09 de Outubro de 2025  
**Próxima Revisão:** Após conclusão da Fase 1  
**Responsável:** Time de Desenvolvimento

---

## 📞 Suporte

Para dúvidas sobre integrações:
- Consultar arquivos mock nas pastas `lib/api-*.ts`
- Ver componentes frontend em `app/dashboard/`
- Revisar documentação específica de cada módulo

