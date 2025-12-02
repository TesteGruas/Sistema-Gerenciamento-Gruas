# 📋 Task: Melhorias Futuras - Exportação Avançada

**ID da Task:** TASK-PONTO-007  
**Título:** Implementar Melhorias Futuras na Exportação de Relatórios  
**Fase:** Melhorias  
**Módulo:** Ponto Eletrônico  
**Arquivo(s):** `app/dashboard/ponto/aprovacoes/page.tsx`, `app/dashboard/ponto/relatorios/page.tsx`

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🟡 BAIXA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Implementar melhorias futuras opcionais no sistema de exportação de relatórios do ponto eletrônico, conforme sugerido no `RELATORIO-CORRECOES-PONTO-ELETRONICO.md`.

Esta task cobre melhorias opcionais:
- Exportação em Excel (.xlsx)
- Gráficos no PDF exportado
- Filtros adicionais na exportação
- Agendamento de exportações
- Histórico de exportações realizadas

---

## 🎯 Objetivos

- [ ] Implementar exportação em Excel (.xlsx)
- [ ] Adicionar gráficos no PDF exportado
- [ ] Adicionar filtros adicionais na exportação
- [ ] Implementar agendamento de exportações
- [ ] Criar histórico de exportações realizadas

---

## 📋 Situação Atual

### Funcionalidades Existentes

- ✅ Exportação CSV funcionando
- ✅ Exportação JSON funcionando
- ✅ Exportação PDF funcionando
- ✅ Filtros básicos (data, status, funcionário)

### Melhorias Propostas

- ⏳ Exportação Excel (.xlsx) - Não implementado
- ⏳ Gráficos no PDF - Não implementado
- ⏳ Filtros adicionais - Não implementado
- ⏳ Agendamento - Não implementado
- ⏳ Histórico - Não implementado

---

## 🔧 Ações Necessárias

### Frontend

- [ ] **Exportação Excel (.xlsx)**
  - Instalar biblioteca `xlsx` ou `exceljs`
  - Criar função `exportarExcel()`
  - Adicionar opção "Exportar Excel" no dropdown
  - Implementar geração de arquivo .xlsx
  - Incluir formatação de células e estilos

- [ ] **Gráficos no PDF**
  - Instalar biblioteca de gráficos (Chart.js ou similar)
  - Criar gráficos de horas extras por período
  - Criar gráfico de distribuição de status
  - Adicionar gráficos ao PDF exportado
  - Posicionar gráficos adequadamente no layout

- [ ] **Filtros Adicionais**
  - Adicionar filtro por cargo
  - Adicionar filtro por obra
  - Adicionar filtro por turno
  - Adicionar filtro por faixa de horas extras
  - Integrar filtros na exportação

- [ ] **Agendamento de Exportações**
  - Criar interface de agendamento
  - Permitir seleção de frequência (diária, semanal, mensal)
  - Permitir seleção de formato
  - Permitir seleção de destinatários (email)
  - Salvar agendamentos no backend

- [ ] **Histórico de Exportações**
  - Criar tabela de histórico
  - Registrar cada exportação realizada
  - Incluir: data, usuário, formato, filtros aplicados
  - Permitir visualização do histórico
  - Permitir re-download de exportações anteriores

### Backend

- [ ] **API de Agendamento**
  - Criar endpoint `POST /api/ponto-eletronico/exportacoes/agendar`
  - Criar endpoint `GET /api/ponto-eletronico/exportacoes/agendamentos`
  - Criar endpoint `DELETE /api/ponto-eletronico/exportacoes/agendamentos/:id`
  - Implementar job scheduler para executar agendamentos

- [ ] **API de Histórico**
  - Criar endpoint `GET /api/ponto-eletronico/exportacoes/historico`
  - Criar endpoint `GET /api/ponto-eletronico/exportacoes/:id/download`
  - Criar tabela `exportacoes_historico` no banco

### Banco de Dados

- [ ] **Migração: Tabela de Agendamentos**
  ```sql
  CREATE TABLE exportacoes_agendamentos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER,
    frequencia VARCHAR(50),
    formato VARCHAR(10),
    filtros JSONB,
    destinatarios JSONB,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
  );
  ```

- [ ] **Migração: Tabela de Histórico**
  ```sql
  CREATE TABLE exportacoes_historico (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER,
    formato VARCHAR(10),
    filtros JSONB,
    arquivo_path VARCHAR(255),
    tamanho_bytes BIGINT,
    created_at TIMESTAMP
  );
  ```

---

## 🔌 Endpoints Necessários

### GET
```
GET /api/ponto-eletronico/exportacoes/historico
GET /api/ponto-eletronico/exportacoes/agendamentos
GET /api/ponto-eletronico/exportacoes/:id/download
```

### POST
```
POST /api/ponto-eletronico/exportacoes/agendar
POST /api/ponto-eletronico/exportacoes/executar-agendamento
```

### DELETE
```
DELETE /api/ponto-eletronico/exportacoes/agendamentos/:id
```

---

## ✅ Critérios de Aceitação

- [ ] Exportação Excel gera arquivo .xlsx válido
- [ ] PDF exportado contém gráficos relevantes
- [ ] Filtros adicionais funcionam na exportação
- [ ] Agendamento de exportações funciona
- [ ] Histórico de exportações é salvo e pode ser visualizado
- [ ] Re-download de exportações anteriores funciona
- [ ] Job scheduler executa agendamentos corretamente
- [ ] Emails são enviados quando agendamento é executado

---

## 🧪 Casos de Teste

### Teste 1: Exportação Excel
**Dado:** Dados filtrados na página  
**Quando:** Usuário clica em "Exportar Excel"  
**Então:** Arquivo .xlsx é gerado e pode ser aberto no Excel

### Teste 2: PDF com Gráficos
**Dado:** Dados para exportação  
**Quando:** Usuário exporta em PDF  
**Então:** PDF contém gráficos de horas extras e distribuição de status

### Teste 3: Agendamento
**Dado:** Usuário configurando agendamento  
**Quando:** Salva agendamento semanal  
**Então:** Exportação é executada automaticamente na frequência configurada

### Teste 4: Histórico
**Dado:** Exportações realizadas  
**Quando:** Usuário acessa histórico  
**Então:** Lista de exportações anteriores é exibida com opção de re-download

---

## 🔗 Dependências

### Bloqueada por:
- TASK-PONTO-001 - Testes Manuais Correções (exportação básica deve estar funcionando)

### Bloqueia:
- Nenhuma

### Relacionada com:
- RELATORIO-CORRECOES-PONTO-ELETRONICO.md

---

## 📚 Referências

- `RELATORIO-CORRECOES-PONTO-ELETRONICO.md` - Melhorias futuras sugeridas
- `app/dashboard/ponto/aprovacoes/page.tsx` - Página de aprovações

---

## 💡 Notas Técnicas

- Exportação Excel pode usar biblioteca `xlsx` ou `exceljs`
- Gráficos podem ser gerados com Chart.js e convertidos para imagem no PDF
- Agendamentos podem usar node-cron ou similar
- Histórico deve armazenar arquivos ou referências para re-geração

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Arquivos de histórico podem ocupar muito espaço
  - **Mitigação:** Implementar política de retenção e limpeza automática

- **Risco 2:** Agendamentos podem falhar se sistema estiver offline
  - **Mitigação:** Implementar retry e notificação de falhas

- **Risco 3:** Gráficos podem aumentar tamanho do PDF
  - **Mitigação:** Otimizar imagens e considerar compressão

---

## 📊 Estimativas

**Tempo Estimado:** 8-12 horas  
**Complexidade:** Alta  
**Esforço:** Grande

---

## 🔄 Histórico de Mudanças

| Data | Autor | Mudança |
|------|-------|---------|
| 02/02/2025 | Sistema | Task criada baseada em RELATORIO-CORRECOES-PONTO-ELETRONICO.md |

---

## ✅ Checklist Final

- [ ] Exportação Excel implementada
- [ ] Gráficos no PDF implementados
- [ ] Filtros adicionais implementados
- [ ] Agendamento implementado
- [ ] Histórico implementado
- [ ] APIs backend criadas
- [ ] Migrações de banco criadas
- [ ] Testes realizados
- [ ] Documentação atualizada
- [ ] Task fechada

---

**Criado em:** 02/02/2025  
**Última Atualização:** 02/02/2025

