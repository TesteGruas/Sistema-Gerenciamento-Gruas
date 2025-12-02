# 📋 Task: Testes por Perfil - Admin/Gestor (Dashboard)

**ID da Task:** TASK-PONTO-006  
**Título:** Testes Completos para Perfil Admin/Gestor no Dashboard  
**Fase:** Validação  
**Módulo:** Ponto Eletrônico  
**Arquivo(s):** `app/dashboard/ponto/page.tsx`, `app/dashboard/ponto/aprovacoes/page.tsx`, `app/dashboard/ponto/relatorios/page.tsx`

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🟢 ALTA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Realizar testes completos do sistema de ponto eletrônico para o perfil de Admin/Gestor, focando no Dashboard (`/dashboard/ponto`). Admin/Gestor tem acesso total ao sistema, podendo visualizar, editar, exportar e criar justificativas para qualquer funcionário.

Esta task cobre:
- Visualização de todos os registros
- Edição de registros de qualquer funcionário
- Filtros e busca avançada
- Exportação de relatórios (PDF, CSV, JSON)
- Criação de justificativas para qualquer funcionário
- Aprovação/rejeição de justificativas
- Estatísticas e relatórios mensais
- Permissões e acesso total

---

## 🎯 Objetivos

- [ ] Validar visualização de todos os registros de todos os funcionários
- [ ] Validar edição de registros de qualquer funcionário
- [ ] Validar filtros e busca avançada funcionando
- [ ] Validar exportação de relatórios em todos os formatos
- [ ] Validar criação de justificativas para qualquer funcionário
- [ ] Validar aprovação/rejeição de justificativas
- [ ] Validar estatísticas e cards informativos
- [ ] Validar relatórios mensais
- [ ] Validar permissões de acesso total

---

## 📋 Situação Atual

### Funcionalidades Implementadas

- ✅ Dashboard completo (`/dashboard/ponto`)
- ✅ Visualização de todos os registros
- ✅ Edição de registros
- ✅ Filtros e busca avançada
- ✅ Exportação de relatórios (PDF, CSV, JSON)
- ✅ Criação de justificativas
- ✅ Aprovação/rejeição de justificativas
- ✅ Estatísticas e cards
- ✅ Relatórios mensais
- ✅ Paginação avançada

### Integrações Existentes

- ✅ API `/api/ponto-eletronico/registros` - Listagem completa
- ✅ API `/api/ponto-eletronico/registros/:id` - Edição
- ✅ API `/api/ponto-eletronico/justificativas` - CRUD
- ✅ API `/api/ponto-eletronico/relatorios` - Relatórios
- ✅ API `/api/ponto-eletronico/estatisticas` - Estatísticas

---

## 🔧 Ações Necessárias

### Testes de Visualização

- [ ] **Teste 1: Visualização de Todos os Registros**
  - Acessar `/dashboard/ponto` como admin/gestor
  - Verificar que todos os registros de todos os funcionários são exibidos
  - Verificar que lista está completa
  - Verificar ordenação (mais recente primeiro)
  - Verificar informações exibidas (funcionário, data, horários, status)

- [ ] **Teste 2: Cards de Estatísticas**
  - Verificar card "Funcionários Presentes"
  - Verificar card "Atrasos Hoje"
  - Verificar card "Horas Extras Pendentes"
  - Verificar card "Total Horas Extras"
  - Verificar que valores estão corretos
  - Verificar que cards atualizam em tempo real

- [ ] **Teste 3: Tabs de Navegação**
  - Verificar que todos os 4 tabs estão visíveis:
    - Registros de Ponto
    - Controle de Horas Extras
    - Justificativas
    - Relatório Mensal
  - Verificar navegação entre tabs
  - Verificar que dados são carregados corretamente em cada tab

### Testes de Filtros e Busca

- [ ] **Teste 4: Filtro por Funcionário**
  - Aplicar filtro selecionando um funcionário específico
  - Verificar que apenas registros desse funcionário são exibidos
  - Verificar que estatísticas são atualizadas
  - Remover filtro e verificar que todos os registros voltam

- [ ] **Teste 5: Filtro por Data**
  - Aplicar filtro de data início
  - Aplicar filtro de data fim
  - Verificar que apenas registros do período são exibidos
  - Verificar que estatísticas refletem o período
  - Testar diferentes períodos

- [ ] **Teste 6: Busca Textual**
  - Digitar nome de funcionário na busca (mínimo 3 caracteres)
  - Verificar que resultados são filtrados
  - Verificar que busca funciona em tempo real
  - Testar com diferentes termos
  - Verificar que busca funciona junto com outros filtros

- [ ] **Teste 7: Combinação de Filtros**
  - Aplicar filtro de funcionário + data
  - Aplicar busca textual + filtro de data
  - Verificar que todos os filtros funcionam juntos
  - Verificar que resultados são corretos

- [ ] **Teste 8: Paginação com Filtros**
  - Aplicar filtros
  - Navegar entre páginas
  - Verificar que filtros são mantidos
  - Verificar que dados de cada página estão corretos

### Testes de Edição

- [ ] **Teste 9: Edição de Registro de Qualquer Funcionário**
  - Selecionar registro de um funcionário
  - Clicar em "Editar"
  - Modificar horários
  - Preencher justificativa obrigatória
  - Salvar
  - Verificar que edição foi salva
  - Verificar que cálculos foram atualizados
  - Verificar que histórico de alteração foi salvo

- [ ] **Teste 10: Edição de Múltiplos Campos**
  - Editar entrada, saída almoço, volta almoço e saída
  - Verificar que todos os campos são atualizados
  - Verificar que horas trabalhadas são recalculadas
  - Verificar que horas extras são recalculadas

### Testes de Exportação

- [ ] **Teste 11: Exportação CSV**
  - Aplicar filtros
  - Clicar em "Exportar" > "CSV"
  - Verificar que arquivo é baixado
  - Abrir arquivo e verificar dados
  - Verificar que filtros foram respeitados

- [ ] **Teste 12: Exportação JSON**
  - Aplicar filtros diferentes
  - Clicar em "Exportar" > "JSON"
  - Verificar que arquivo é baixado
  - Abrir arquivo e verificar formato
  - Verificar que filtros foram respeitados

- [ ] **Teste 13: Exportação PDF**
  - Aplicar filtros
  - Clicar em "Exportar" > "PDF"
  - Verificar que arquivo é baixado
  - Abrir PDF e verificar layout
  - Verificar que tabela está completa
  - Verificar que filtros foram respeitados

- [ ] **Teste 14: Exportação com Diferentes Filtros**
  - Exportar sem filtros (todos os registros)
  - Exportar com filtro de funcionário
  - Exportar com filtro de data
  - Verificar que cada exportação contém dados corretos

### Testes de Justificativas

- [ ] **Teste 15: Criação de Justificativa para Qualquer Funcionário**
  - Acessar tab "Justificativas"
  - Clicar em "Nova Justificativa"
  - Selecionar funcionário (qualquer um)
  - Preencher tipo, data, motivo
  - Fazer upload de anexo (se necessário)
  - Salvar
  - Verificar que justificativa foi criada
  - Verificar que aparece na lista

- [ ] **Teste 16: Aprovação de Justificativa**
  - Acessar justificativa pendente
  - Clicar em "Aprovar"
  - Preencher observações
  - Confirmar
  - Verificar que status muda para "Aprovado"

- [ ] **Teste 17: Rejeição de Justificativa**
  - Acessar justificativa pendente
  - Clicar em "Rejeitar"
  - Preencher motivo obrigatório
  - Confirmar
  - Verificar que status muda para "Rejeitado"

- [ ] **Teste 18: Filtros de Justificativas**
  - Aplicar filtro por funcionário
  - Aplicar filtro por tipo
  - Aplicar filtro por status
  - Verificar que filtros funcionam corretamente

### Testes de Relatórios

- [ ] **Teste 19: Relatório Mensal**
  - Acessar tab "Relatório Mensal"
  - Selecionar funcionário
  - Selecionar mês e ano
  - Gerar relatório
  - Verificar que relatório é exibido
  - Verificar cálculos de horas trabalhadas
  - Verificar cálculos de horas extras
  - Verificar que justificativas aparecem

- [ ] **Teste 20: Exportação de Relatório Mensal**
  - Gerar relatório mensal
  - Exportar em PDF
  - Verificar que PDF contém todas as informações
  - Verificar layout e formatação

### Testes de Permissões

- [ ] **Teste 21: Acesso Total**
  - Verificar que admin pode ver todos os funcionários
  - Verificar que admin pode editar qualquer registro
  - Verificar que admin pode criar justificativa para qualquer funcionário
  - Verificar que admin pode aprovar/rejeitar justificativas
  - Verificar que admin pode exportar relatórios completos

- [ ] **Teste 22: Comparação com Outros Perfis**
  - Verificar que admin tem mais acesso que supervisor
  - Verificar que admin tem mais acesso que funcionário
  - Verificar que permissões estão corretas

---

## 🔌 Endpoints Utilizados

### GET
```
GET /api/ponto-eletronico/registros
GET /api/ponto-eletronico/registros/:id
GET /api/ponto-eletronico/justificativas
GET /api/ponto-eletronico/relatorios
GET /api/ponto-eletronico/estatisticas
```

### POST
```
POST /api/ponto-eletronico/justificativas
```

### PUT/PATCH
```
PUT /api/ponto-eletronico/registros/:id
PATCH /api/ponto-eletronico/justificativas/:id/aprovar
PATCH /api/ponto-eletronico/justificativas/:id/rejeitar
```

---

## ✅ Critérios de Aceitação

- [ ] Visualização de todos os registros funciona corretamente
- [ ] Edição de registros de qualquer funcionário funciona
- [ ] Filtros e busca avançada funcionam corretamente
- [ ] Exportação em todos os formatos funciona
- [ ] Criação de justificativas para qualquer funcionário funciona
- [ ] Aprovação/rejeição de justificativas funciona
- [ ] Estatísticas estão corretas e atualizam em tempo real
- [ ] Relatórios mensais funcionam corretamente
- [ ] Permissões de acesso total estão funcionando
- [ ] Performance é aceitável mesmo com muitos registros

---

## 🧪 Casos de Teste

### Teste 1: Visualização Completa
**Dado:** Admin acessando dashboard  
**Quando:** Página é carregada  
**Então:** Todos os registros de todos os funcionários são exibidos

### Teste 2: Edição de Qualquer Registro
**Dado:** Admin selecionando registro de qualquer funcionário  
**Quando:** Edita e salva com justificativa  
**Então:** Registro é atualizado e histórico é salvo

### Teste 3: Filtros Combinados
**Dado:** Filtros de funcionário, data e busca aplicados  
**Quando:** Resultados são exibidos  
**Então:** Apenas registros que correspondem a todos os filtros são mostrados

### Teste 4: Exportação com Filtros
**Dado:** Filtros aplicados na página  
**Quando:** Admin exporta em CSV/JSON/PDF  
**Então:** Arquivo exportado contém apenas dados que correspondem aos filtros

### Teste 5: Criação de Justificativa
**Dado:** Admin criando justificativa  
**Quando:** Seleciona qualquer funcionário e preenche dados  
**Então:** Justificativa é criada e aparece na lista

### Teste 6: Relatório Mensal
**Dado:** Admin gerando relatório mensal  
**Quando:** Seleciona funcionário, mês e ano  
**Então:** Relatório é exibido com todos os dados e cálculos corretos

---

## 🔗 Dependências

### Bloqueada por:
- TASK-PONTO-001 - Testes Manuais Correções (validação de exportação)
- TASK-PONTO-002 - Validações de Registro e Edição (validações básicas)
- TASK-PONTO-003 - Validações de Horas Extras e Justificativas (validações básicas)

### Bloqueia:
- Nenhuma

### Relacionada com:
- RESUMO-CHECKLIST-PONTO-ELETRONICO.md
- TASK-PONTO-001, TASK-PONTO-002, TASK-PONTO-003

---

## 📚 Referências

- `RESUMO-CHECKLIST-PONTO-ELETRONICO.md` - Checklist de testes
- `app/dashboard/ponto/page.tsx` - Dashboard principal
- `app/dashboard/ponto/aprovacoes/page.tsx` - Página de aprovações
- `app/dashboard/ponto/relatorios/page.tsx` - Página de relatórios

---

## 💡 Notas Técnicas

- Admin/Gestor tem acesso total ao sistema
- Todas as funcionalidades devem estar disponíveis
- Performance deve ser otimizada para grandes volumes de dados
- Filtros devem ser aplicados no backend para melhor performance
- Exportações devem respeitar filtros aplicados

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Performance pode degradar com muitos registros (> 1000)
  - **Mitigação:** Implementar paginação e filtros no backend

- **Risco 2:** Exportação de muitos dados pode ser lenta
  - **Mitigação:** Considerar processamento assíncrono ou limites

- **Risco 3:** Edição de registros pode afetar horas extras já aprovadas
  - **Mitigação:** Validar comportamento e notificar usuário

---

## 📊 Estimativas

**Tempo Estimado:** 6-8 horas  
**Complexidade:** Alta  
**Esforço:** Grande

---

## 🔄 Histórico de Mudanças

| Data | Autor | Mudança |
|------|-------|---------|
| 02/02/2025 | Sistema | Task criada baseada em RESUMO-CHECKLIST-PONTO-ELETRONICO.md |

---

## ✅ Checklist Final

- [ ] Testes de visualização realizados
- [ ] Testes de filtros e busca realizados
- [ ] Testes de edição realizados
- [ ] Testes de exportação realizados
- [ ] Testes de justificativas realizados
- [ ] Testes de relatórios realizados
- [ ] Testes de permissões realizados
- [ ] Performance validada
- [ ] Documentação de resultados criada
- [ ] Bugs encontrados reportados
- [ ] Task fechada

---

**Criado em:** 02/02/2025  
**Última Atualização:** 02/02/2025

