# 🟡 FASE 2 - MÓDULOS DE RH

**Duração Estimada:** 2-3 semanas  
**Prioridade:** MÉDIA-ALTA  
**Status:** 🔄 Em Planejamento

---

## 📋 Visão Geral

Esta fase foca na integração completa dos módulos de Recursos Humanos, implementando sistemas de controle de ponto, alocação de funcionários, férias, afastamentos e permissões.

---

## 📦 Tarefas

### Task 2.1 - Ponto Eletrônico
**Arquivo:** `app/dashboard/rh-completo/ponto/page.tsx`  
**Status:** ❌ Totalmente Mockado  
**Prioridade:** 🔴 ALTA

#### Situação Atual
Mockado (linhas 75-165):
- registros - Registros de ponto
- funcionarios - Resumo de horas por funcionário

#### Ações Necessárias
- [ ] Expandir `lib/api-ponto-eletronico.ts`
  - [ ] Implementar `getRegistrosPonto(data, funcionarioId)`
  - [ ] Implementar `createRegistroPonto(data)`
  - [ ] Implementar `updateRegistroPonto(id, data)`
  - [ ] Implementar `deleteRegistroPonto(id)`
  - [ ] Implementar `getResumoHoras(funcionarioId, periodo)`
  - [ ] Implementar `aprovarPonto(id)`
  - [ ] Implementar `reprovarPonto(id, motivo)`
- [ ] Remover dados mock
- [ ] Implementar funcionalidades:
  - [ ] Registro de entrada/saída
  - [ ] Registro de intervalo
  - [ ] Justificativa de ausências
  - [ ] Horas extras
  - [ ] Banco de horas
  - [ ] Aprovação de ponto pelo gestor
  - [ ] Relatório de ponto mensal
  - [ ] Exportação para folha de pagamento
- [ ] Implementar validações:
  - [ ] Validar horários de entrada/saída
  - [ ] Detectar inconsistências
  - [ ] Alertar sobre horas extras
- [ ] Adicionar notificações
- [ ] Testar fluxo completo

#### Backend Necessário
```
GET /api/ponto/registros?data={date}&funcionario_id={id}
POST /api/ponto/registros
PUT /api/ponto/registros/:id
DELETE /api/ponto/registros/:id
GET /api/ponto/resumo?funcionario_id={id}&periodo={mes/ano}
POST /api/ponto/aprovar/:id
POST /api/ponto/reprovar/:id
GET /api/ponto/relatorio?funcionario_id={id}&mes={mes}&ano={ano}
POST /api/ponto/exportar
GET /api/ponto/inconsistencias
```

---

### Task 2.2 - Alocação de Funcionários em Obras
**Arquivo:** `app/dashboard/rh-completo/obras/page.tsx`  
**Status:** ❌ Totalmente Mockado  
**Prioridade:** 🔴 ALTA

#### Situação Atual
Mockado (linhas 86-186):
- Lista completa de alocações funcionário-obra
- Dados de obras e funcionários

#### Ações Necessárias
- [ ] Criar `lib/api-alocacao-funcionarios.ts`
  - [ ] Implementar `getAlocacoes(filtros)`
  - [ ] Implementar `getAlocacoesPorObra(obraId)`
  - [ ] Implementar `getAlocacoesPorFuncionario(funcionarioId)`
  - [ ] Implementar `createAlocacao(data)`
  - [ ] Implementar `updateAlocacao(id, data)`
  - [ ] Implementar `deleteAlocacao(id)`
  - [ ] Implementar `getFuncionariosDisponiveis(data)`
- [ ] Integrar com `lib/api-funcionarios-obras.ts` (já existente)
- [ ] Remover dados mock
- [ ] Implementar funcionalidades:
  - [ ] Alocação de funcionários em obras
  - [ ] Transferência entre obras
  - [ ] Histórico de alocações
  - [ ] Disponibilidade de funcionários
  - [ ] Conflitos de alocação
  - [ ] Previsão de custos por obra
- [ ] Adicionar validações:
  - [ ] Evitar alocação duplicada
  - [ ] Validar datas
  - [ ] Verificar disponibilidade
- [ ] Implementar filtros e buscas
- [ ] Adicionar gráficos de alocação
- [ ] Testar fluxo completo

#### Backend Necessário
```
GET /api/alocacoes
GET /api/alocacoes/obra/:obra_id
GET /api/alocacoes/funcionario/:funcionario_id
POST /api/alocacoes
PUT /api/alocacoes/:id
DELETE /api/alocacoes/:id
GET /api/alocacoes/disponiveis?data={date}
POST /api/alocacoes/transferir
GET /api/alocacoes/historico/:funcionario_id
GET /api/alocacoes/conflitos
```

---

### Task 2.3 - Férias e Afastamentos
**Arquivo:** `app/dashboard/rh-completo/ferias/page.tsx`  
**Status:** ⚠️ Parcialmente Integrado  
**Prioridade:** 🔴 ALTA

#### Situação Atual
Mockado (linhas 92-128):
- feriasSimuladas
- afastamentosSimulados

#### Ações Necessárias
- [ ] Expandir `lib/api-ferias.ts`
  - [ ] Implementar `getFerias(filtros)`
  - [ ] Implementar `getFeriasPorFuncionario(funcionarioId)`
  - [ ] Implementar `createFerias(data)`
  - [ ] Implementar `updateFerias(id, data)`
  - [ ] Implementar `deleteFerias(id)`
  - [ ] Implementar `aprovarFerias(id)`
  - [ ] Implementar `reprovarFerias(id, motivo)`
  - [ ] Implementar `calcularSaldoFerias(funcionarioId)`
- [ ] Criar endpoints para afastamentos
  - [ ] Implementar `getAfastamentos(filtros)`
  - [ ] Implementar `createAfastamento(data)`
  - [ ] Implementar `updateAfastamento(id, data)`
  - [ ] Implementar `deleteAfastamento(id)`
- [ ] Remover dados mock
- [ ] Implementar funcionalidades:
  - [ ] Solicitação de férias
  - [ ] Aprovação de férias (gestão multinível)
  - [ ] Cálculo de períodos aquisitivos
  - [ ] Saldo de férias
  - [ ] Férias coletivas
  - [ ] Abono pecuniário
  - [ ] Registro de afastamentos (doença, acidente, etc)
  - [ ] Controle de atestados médicos
  - [ ] Calendário de férias
- [ ] Adicionar validações:
  - [ ] Períodos mínimos e máximos
  - [ ] Conflitos de datas
  - [ ] Saldo disponível
- [ ] Implementar notificações
- [ ] Gerar relatórios
- [ ] Testar fluxo completo

#### Backend Necessário
```
# Férias
GET /api/ferias
GET /api/ferias/funcionario/:id
POST /api/ferias
PUT /api/ferias/:id
DELETE /api/ferias/:id
POST /api/ferias/:id/aprovar
POST /api/ferias/:id/reprovar
GET /api/ferias/saldo/:funcionario_id
GET /api/ferias/calendario

# Afastamentos
GET /api/afastamentos
GET /api/afastamentos/funcionario/:id
POST /api/afastamentos
PUT /api/afastamentos/:id
DELETE /api/afastamentos/:id
GET /api/afastamentos/relatorio
```

---

### Task 2.4 - Auditoria e Permissões
**Arquivo:** `app/dashboard/rh-completo/auditoria/page.tsx`  
**Status:** ⚠️ Parcialmente Mockado  
**Prioridade:** 🟡 MÉDIA

#### Situação Atual
Mockado (linhas 79-127):
- perfisSimulados
- permissoesSimuladas

#### Ações Necessárias
- [ ] Expandir `lib/api-permissoes.ts`
  - [ ] Implementar `getPerfis()`
  - [ ] Implementar `getPerfilById(id)`
  - [ ] Implementar `createPerfil(data)`
  - [ ] Implementar `updatePerfil(id, data)`
  - [ ] Implementar `deletePerfil(id)`
  - [ ] Implementar `getPermissoes()`
  - [ ] Implementar `getPermissoesPorPerfil(perfilId)`
  - [ ] Implementar `updatePermissoesPerfil(perfilId, permissoes)`
- [ ] Criar sistema de auditoria
  - [ ] Implementar `getLogsAuditoria(filtros)`
  - [ ] Implementar `getLogsPorUsuario(usuarioId)`
  - [ ] Implementar registro automático de ações
- [ ] Remover dados mock
- [ ] Implementar funcionalidades:
  - [ ] Gestão de perfis de usuário
  - [ ] Gestão de permissões
  - [ ] Matriz de permissões
  - [ ] Log de auditoria
  - [ ] Rastreamento de ações
  - [ ] Relatórios de acesso
  - [ ] Alertas de segurança
- [ ] Adicionar validações:
  - [ ] Validar permissões
  - [ ] Prevenir escalação de privilégios
  - [ ] Verificar dependências
- [ ] Implementar controle de acesso em todas as rotas
- [ ] Testar todos os cenários de permissão

#### Backend Necessário
```
# Perfis
GET /api/perfis
GET /api/perfis/:id
POST /api/perfis
PUT /api/perfis/:id
DELETE /api/perfis/:id

# Permissões
GET /api/permissoes
GET /api/permissoes/perfil/:id
PUT /api/permissoes/perfil/:id

# Auditoria
GET /api/auditoria/logs
GET /api/auditoria/logs/usuario/:id
POST /api/auditoria/logs
GET /api/auditoria/relatorio
GET /api/auditoria/alertas
```

---

### Task 2.5 - Complementos de RH
**Arquivos:** `app/dashboard/rh-completo/*.tsx`  
**Status:** ⚠️ Vários arquivos  
**Prioridade:** 🟡 MÉDIA

#### Módulos Adicionais para Verificar
- [ ] Folha de Pagamento (`folha/page.tsx`)
- [ ] Benefícios (`beneficios/page.tsx`)
- [ ] Documentos (`documentos/page.tsx`)
- [ ] Treinamentos (`treinamentos/page.tsx`)
- [ ] Avaliações de Desempenho (`avaliacoes/page.tsx`)
- [ ] Admissões e Demissões (`admissoes/page.tsx`)

#### Ações Necessárias
- [ ] Auditar cada arquivo do diretório `rh-completo/`
- [ ] Identificar dados mockados em cada módulo
- [ ] Criar APIs necessárias
- [ ] Integrar com backend
- [ ] Remover dados mock
- [ ] Testar cada módulo

---

## ✅ Checklist de Conclusão da Fase 2

Para cada módulo integrado, verificar:

- [ ] Todos os dados mock foram removidos
- [ ] APIs do frontend criadas e funcionando
- [ ] Endpoints do backend implementados
- [ ] Sistema de permissões implementado
- [ ] Tratamento de erros implementado
- [ ] Loading states adicionados
- [ ] Validações implementadas
- [ ] CRUD completo testado
- [ ] Notificações configuradas
- [ ] Relatórios funcionando
- [ ] Documentação dos endpoints criada
- [ ] Imports de `mock-data.ts` removidos
- [ ] Testes unitários criados
- [ ] Testes de integração criados
- [ ] Testado em ambiente de desenvolvimento
- [ ] Testado em ambiente de homologação
- [ ] Code review realizado
- [ ] Deploy em produção

---

## 📊 Métricas de Sucesso

- [ ] 0 linhas de código mockado em produção
- [ ] 100% dos endpoints de RH implementados
- [ ] Sistema de ponto funcionando 24/7
- [ ] 0 conflitos de alocação não detectados
- [ ] Tempo de resposta < 1s para consultas
- [ ] 0 erros críticos em produção
- [ ] Cobertura de testes > 85%

---

## 🚀 Próximos Passos

Após conclusão da Fase 2:
1. Review completo do código
2. Testes de carga nos módulos de ponto
3. Treinamento da equipe de RH
4. Documentação de processos
5. Iniciar **Fase 3 - Operacional**

---

**Data de Criação:** 09 de Outubro de 2025  
**Última Atualização:** 09 de Outubro de 2025  
**Responsável:** Equipe de Desenvolvimento

