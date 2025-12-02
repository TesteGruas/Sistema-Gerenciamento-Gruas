# 📋 Task: Validações Funcionais - Horas Extras e Justificativas

**ID da Task:** TASK-PONTO-003  
**Título:** Validações Funcionais de Horas Extras e Justificativas  
**Fase:** Validação  
**Módulo:** Ponto Eletrônico  
**Arquivo(s):** `app/dashboard/ponto/page.tsx`, `app/pwa/aprovacoes/page.tsx`, `app/dashboard/ponto/aprovacoes/page.tsx`

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🟢 ALTA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Realizar validações funcionais completas do sistema de horas extras e justificativas do ponto eletrônico, garantindo que aprovações, rejeições, criação de justificativas e gestão de anexos estejam funcionando corretamente.

Esta task cobre:
- Aprovação/rejeição de horas extras (individual e em lote)
- Criação e gestão de justificativas
- Upload e download de anexos
- Filtros e busca de justificativas
- Validações de permissões

---

## 🎯 Objetivos

- [ ] Validar aprovação individual de horas extras com justificativa
- [ ] Validar rejeição individual de horas extras com motivo
- [ ] Validar aprovação em lote de horas extras
- [ ] Validar rejeição em lote de horas extras
- [ ] Verificar notificação WhatsApp (se implementado)
- [ ] Validar que status muda corretamente após aprovação/rejeição
- [ ] Validar criação de justificativa com todos os tipos
- [ ] Validar upload de anexo em justificativa
- [ ] Validar download de anexo de justificativa
- [ ] Validar aprovação de justificativa
- [ ] Validar rejeição de justificativa
- [ ] Validar filtros por funcionário em justificativas

---

## 📋 Situação Atual

### Funcionalidades Implementadas

- ✅ Aprovação/rejeição de horas extras no Dashboard
- ✅ Aprovação/rejeição de horas extras no PWA (Supervisor)
- ✅ Aprovação em massa de horas extras
- ✅ Criação de justificativas
- ✅ Upload de anexos em justificativas
- ✅ Aprovação/rejeição de justificativas
- ✅ Filtros e busca de justificativas

### Integrações Existentes

- ✅ API `/api/ponto-eletronico/horas-extras` - Listagem e gestão
- ✅ API `/api/ponto-eletronico/horas-extras/aprovar-lote` - Aprovação em massa
- ✅ API `/api/ponto-eletronico/horas-extras/rejeitar-lote` - Rejeição em massa
- ✅ API `/api/ponto-eletronico/justificativas` - CRUD de justificativas
- ✅ API `/api/ponto-eletronico/justificativas/:id/anexo` - Upload/download de anexos

---

## 🔧 Ações Necessárias

### Testes de Horas Extras

- [ ] **Teste 1: Aprovação Individual com Justificativa**
  - Acessar registro com horas extras pendentes
  - Clicar em "Aprovar"
  - Preencher justificativa obrigatória
  - Confirmar aprovação
  - Verificar que status muda para "Aprovado"
  - Verificar que data de aprovação é salva
  - Verificar que aprovador é registrado

- [ ] **Teste 2: Rejeição Individual com Motivo**
  - Acessar registro com horas extras pendentes
  - Clicar em "Rejeitar"
  - Preencher motivo obrigatório
  - Confirmar rejeição
  - Verificar que status muda para "Rejeitado"
  - Verificar que motivo é salvo

- [ ] **Teste 3: Aprovação em Lote**
  - Selecionar múltiplos registros com horas extras pendentes
  - Clicar em "Aprovar em Lote"
  - Preencher justificativa (uma para todos)
  - Confirmar aprovação
  - Verificar que todos os registros selecionados foram aprovados
  - Verificar que status de todos mudou para "Aprovado"

- [ ] **Teste 4: Rejeição em Lote**
  - Selecionar múltiplos registros com horas extras pendentes
  - Clicar em "Rejeitar em Lote"
  - Preencher motivo (um para todos)
  - Confirmar rejeição
  - Verificar que todos os registros selecionados foram rejeitados
  - Verificar que status de todos mudou para "Rejeitado"

- [ ] **Teste 5: Notificação WhatsApp**
  - Aprovar horas extras de um funcionário
  - Verificar se notificação WhatsApp foi enviada (se implementado)
  - Verificar conteúdo da mensagem

- [ ] **Teste 6: Validação de Status**
  - Aprovar horas extras
  - Verificar que registro não pode ser aprovado novamente
  - Verificar que registro não pode ser rejeitado após aprovado
  - Verificar que registro aprovado não pode ser editado

### Testes de Justificativas

- [ ] **Teste 7: Criação de Justificativa - Tipo Atraso**
  - Criar justificativa do tipo "Atraso"
  - Preencher todos os campos obrigatórios
  - Salvar
  - Verificar que justificativa foi criada
  - Verificar que status inicial é "Pendente"

- [ ] **Teste 8: Criação de Justificativa - Tipo Falta**
  - Criar justificativa do tipo "Falta"
  - Preencher todos os campos
  - Salvar
  - Verificar criação

- [ ] **Teste 9: Criação de Justificativa - Tipo Saída Antecipada**
  - Criar justificativa do tipo "Saída Antecipada"
  - Preencher todos os campos
  - Salvar
  - Verificar criação

- [ ] **Teste 10: Criação de Justificativa - Tipo Ausência Parcial**
  - Criar justificativa do tipo "Ausência Parcial"
  - Preencher todos os campos
  - Salvar
  - Verificar criação

- [ ] **Teste 11: Upload de Anexo**
  - Criar justificativa
  - Fazer upload de arquivo (PDF, imagem, Word)
  - Verificar que arquivo foi anexado
  - Verificar que nome do arquivo é exibido
  - Verificar tamanho máximo permitido (10MB)

- [ ] **Teste 12: Download de Anexo**
  - Acessar justificativa com anexo
  - Clicar em "Download" do anexo
  - Verificar que arquivo é baixado
  - Verificar que arquivo abre corretamente

- [ ] **Teste 13: Aprovação de Justificativa**
  - Acessar justificativa pendente
  - Clicar em "Aprovar"
  - Preencher observações (se necessário)
  - Confirmar aprovação
  - Verificar que status muda para "Aprovado"
  - Verificar que data de aprovação é salva

- [ ] **Teste 14: Rejeição de Justificativa**
  - Acessar justificativa pendente
  - Clicar em "Rejeitar"
  - Preencher motivo obrigatório
  - Confirmar rejeição
  - Verificar que status muda para "Rejeitado"
  - Verificar que motivo é salvo

- [ ] **Teste 15: Filtros de Justificativas**
  - Aplicar filtro por funcionário
  - Verificar que apenas justificativas do funcionário são exibidas
  - Aplicar filtro por tipo
  - Verificar que apenas justificativas do tipo são exibidas
  - Aplicar filtro por status
  - Verificar que apenas justificativas do status são exibidas

---

## 🔌 Endpoints Utilizados

### GET
```
GET /api/ponto-eletronico/horas-extras
GET /api/ponto-eletronico/justificativas
GET /api/ponto-eletronico/justificativas/:id
GET /api/ponto-eletronico/justificativas/:id/anexo
```

### POST
```
POST /api/ponto-eletronico/horas-extras/aprovar-lote
POST /api/ponto-eletronico/horas-extras/rejeitar-lote
POST /api/ponto-eletronico/justificativas
POST /api/ponto-eletronico/registros/:id/aprovar-assinatura
```

### PUT/PATCH
```
PATCH /api/ponto-eletronico/justificativas/:id/aprovar
PATCH /api/ponto-eletronico/justificativas/:id/rejeitar
```

---

## ✅ Critérios de Aceitação

- [ ] Aprovação individual de horas extras funciona corretamente
- [ ] Rejeição individual de horas extras funciona corretamente
- [ ] Aprovação em lote funciona corretamente
- [ ] Rejeição em lote funciona corretamente
- [ ] Status muda corretamente após aprovação/rejeição
- [ ] Criação de justificativas funciona para todos os tipos
- [ ] Upload de anexos funciona corretamente
- [ ] Download de anexos funciona corretamente
- [ ] Aprovação de justificativas funciona corretamente
- [ ] Rejeição de justificativas funciona corretamente
- [ ] Filtros de justificativas funcionam corretamente
- [ ] Permissões são respeitadas (apenas supervisor/admin pode aprovar)

---

## 🧪 Casos de Teste

### Teste 1: Aprovação Individual
**Dado:** Registro com horas extras pendentes  
**Quando:** Supervisor aprova com justificativa  
**Então:** Status muda para "Aprovado" e data de aprovação é registrada

### Teste 2: Rejeição Individual
**Dado:** Registro com horas extras pendentes  
**Quando:** Supervisor rejeita com motivo  
**Então:** Status muda para "Rejeitado" e motivo é salvo

### Teste 3: Aprovação em Lote
**Dado:** 5 registros com horas extras pendentes selecionados  
**Quando:** Supervisor aprova em lote com justificativa  
**Então:** Todos os 5 registros são aprovados com a mesma justificativa

### Teste 4: Criação de Justificativa
**Dado:** Funcionário precisa justificar atraso  
**Quando:** Cria justificativa do tipo "Atraso" com anexo  
**Então:** Justificativa é criada com status "Pendente" e anexo anexado

### Teste 5: Aprovação de Justificativa
**Dado:** Justificativa pendente  
**Quando:** Supervisor aprova  
**Então:** Status muda para "Aprovado" e funcionário é notificado

### Teste 6: Upload de Anexo Grande
**Dado:** Justificativa sendo criada  
**Quando:** Tenta fazer upload de arquivo > 10MB  
**Então:** Sistema bloqueia e exibe mensagem de erro

---

## 🔗 Dependências

### Bloqueada por:
- Nenhuma

### Bloqueia:
- TASK-PONTO-005 - Testes por Perfil Supervisor (depende de validação de aprovações)
- TASK-PONTO-006 - Testes por Perfil Admin/Gestor (depende de validação de justificativas)

### Relacionada com:
- RESUMO-VALIDACAO-PONTO-ELETRONICO.md
- RESUMO-CHECKLIST-PONTO-ELETRONICO.md

---

## 📚 Referências

- `RESUMO-VALIDACAO-PONTO-ELETRONICO.md` - Validações necessárias
- `app/dashboard/ponto/page.tsx` - Dashboard de gestão
- `app/pwa/aprovacoes/page.tsx` - PWA de aprovações

---

## 💡 Notas Técnicas

- Aprovação de horas extras requer assinatura digital no PWA
- Justificativas podem ter anexos de até 10MB
- Tipos de arquivo permitidos: PDF, Word, imagens (JPG, PNG, GIF, WEBP)
- Aprovação em lote usa uma única justificativa para todos os registros

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Aprovação em lote pode falhar parcialmente
  - **Mitigação:** Verificar tratamento de erros e rollback

- **Risco 2:** Upload de anexos grandes pode ser lento
  - **Mitigação:** Validar limite de 10MB e feedback de progresso

- **Risco 3:** Notificações WhatsApp podem não funcionar
  - **Mitigação:** Verificar se serviço está configurado e funcionando

---

## 📊 Estimativas

**Tempo Estimado:** 4-5 horas  
**Complexidade:** Média  
**Esforço:** Grande

---

## 🔄 Histórico de Mudanças

| Data | Autor | Mudança |
|------|-------|---------|
| 02/02/2025 | Sistema | Task criada baseada em RESUMO-VALIDACAO-PONTO-ELETRONICO.md |

---

## ✅ Checklist Final

- [ ] Testes de horas extras realizados
- [ ] Testes de justificativas realizados
- [ ] Upload/download de anexos validados
- [ ] Filtros validados
- [ ] Permissões validadas
- [ ] Documentação de resultados criada
- [ ] Bugs encontrados reportados
- [ ] Task fechada

---

**Criado em:** 02/02/2025  
**Última Atualização:** 02/02/2025

