# 📋 Task: Testes por Perfil - Supervisor (PWA)

**ID da Task:** TASK-PONTO-005  
**Título:** Testes Completos para Perfil Supervisor no PWA  
**Fase:** Validação  
**Módulo:** Ponto Eletrônico  
**Arquivo(s):** `app/pwa/aprovacoes/page.tsx`, `app/pwa/aprovacao-massa/page.tsx`

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🟢 ALTA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Realizar testes completos do sistema de ponto eletrônico para o perfil de Supervisor, focando no PWA (`/pwa/aprovacoes`). Supervisores usam exclusivamente o PWA para aprovar horas extras com assinatura digital obrigatória, não tendo acesso ao dashboard para aprovações.

Esta task cobre:
- Visualização de horas extras pendentes
- Aprovação individual com assinatura digital obrigatória
- Rejeição com motivo
- Aprovação em massa (uma assinatura para múltiplas)
- Detalhes de aprovações
- Modo offline e sincronização

---

## 🎯 Objetivos

- [ ] Validar visualização de horas extras pendentes no PWA
- [ ] Validar aprovação individual com assinatura digital obrigatória
- [ ] Validar rejeição individual com motivo
- [ ] Validar aprovação em massa com uma assinatura
- [ ] Validar que supervisor não pode aprovar sem assinar
- [ ] Validar detalhes de aprovações
- [ ] Validar modo offline e sincronização
- [ ] Validar que supervisor não acessa dashboard para aprovar

---

## 📋 Situação Atual

### Funcionalidades Implementadas

- ✅ PWA de aprovações (`/pwa/aprovacoes`)
- ✅ Aprovação individual com assinatura digital
- ✅ Rejeição individual
- ✅ Aprovação em massa (`/pwa/aprovacao-massa`)
- ✅ Visualização de detalhes
- ✅ Modo offline com sincronização

### Integrações Existentes

- ✅ API `/api/ponto-eletronico/horas-extras` - Listagem de pendentes
- ✅ API `/api/ponto-eletronico/registros/:id/aprovar-assinatura` - Aprovação com assinatura
- ✅ API `/api/ponto-eletronico/horas-extras/aprovar-lote` - Aprovação em massa
- ✅ API `/api/ponto-eletronico/horas-extras/rejeitar-lote` - Rejeição em massa

---

## 🔧 Ações Necessárias

### Testes de Visualização

- [ ] **Teste 1: Visualização de Horas Extras Pendentes**
  - Acessar `/pwa/aprovacoes` como supervisor
  - Verificar que lista de horas extras pendentes é exibida
  - Verificar informações exibidas (funcionário, data, horários, horas extras)
  - Verificar que apenas pendentes são exibidas
  - Verificar filtros disponíveis (se houver)

- [ ] **Teste 2: Detalhes de Aprovação**
  - Clicar em um registro pendente
  - Verificar que detalhes são exibidos
  - Verificar informações completas (registro completo, histórico, etc.)
  - Verificar botões de ação (Aprovar, Rejeitar)

### Testes de Aprovação Individual

- [ ] **Teste 3: Aprovação com Assinatura Digital Obrigatória**
  - Selecionar registro pendente
  - Clicar em "Aprovar"
  - Verificar que sistema solicita assinatura digital
  - Tentar aprovar sem assinar
  - Verificar que sistema bloqueia e exige assinatura
  - Desenhar assinatura no canvas
  - Confirmar aprovação
  - Verificar que assinatura é salva
  - Verificar que registro é aprovado
  - Verificar que status muda para "Aprovado"

- [ ] **Teste 4: Aprovação com Justificativa**
  - Aprovar registro pendente
  - Preencher justificativa (se obrigatória)
  - Assinar digitalmente
  - Confirmar aprovação
  - Verificar que justificativa é salva junto com assinatura

- [ ] **Teste 5: Validação de Assinatura**
  - Tentar aprovar sem desenhar assinatura
  - Verificar que sistema bloqueia
  - Desenhar assinatura muito pequena/rasurada
  - Verificar se sistema valida qualidade da assinatura
  - Desenhar assinatura válida
  - Verificar que aprovação funciona

### Testes de Rejeição

- [ ] **Teste 6: Rejeição Individual com Motivo**
  - Selecionar registro pendente
  - Clicar em "Rejeitar"
  - Verificar que sistema solicita motivo obrigatório
  - Tentar rejeitar sem motivo
  - Verificar que sistema bloqueia
  - Preencher motivo
  - Confirmar rejeição
  - Verificar que registro é rejeitado
  - Verificar que status muda para "Rejeitado"
  - Verificar que motivo é salvo

### Testes de Aprovação em Massa

- [ ] **Teste 7: Aprovação em Massa - Seleção**
  - Acessar `/pwa/aprovacao-massa`
  - Verificar que lista de pendentes é exibida
  - Selecionar múltiplos registros (checkbox)
  - Verificar que contador de selecionados é atualizado
  - Verificar botão "Aprovar Selecionados"

- [ ] **Teste 8: Aprovação em Massa - Uma Assinatura**
  - Selecionar 3 registros pendentes
  - Clicar em "Aprovar em Lote"
  - Verificar que sistema solicita UMA assinatura digital
  - Desenhar assinatura
  - Preencher justificativa (uma para todos)
  - Confirmar aprovação
  - Verificar que todos os 3 registros são aprovados
  - Verificar que mesma assinatura é usada para todos
  - Verificar que mesma justificativa é aplicada a todos

- [ ] **Teste 9: Aprovação em Massa - Validação**
  - Selecionar registros de diferentes funcionários
  - Verificar que aprovação em massa funciona
  - Verificar que assinatura é aplicada a todos
  - Verificar que cada registro mantém suas informações individuais

### Testes de Modo Offline

- [ ] **Teste 10: Aprovação Offline**
  - Desconectar internet
  - Aprovar registro pendente com assinatura
  - Verificar que aprovação é salva localmente
  - Verificar indicador "Pendente sincronização"
  - Reconectar internet
  - Verificar que aprovação é sincronizada
  - Verificar que status é atualizado no servidor

- [ ] **Teste 11: Aprovação em Massa Offline**
  - Desconectar internet
  - Aprovar múltiplos registros em massa
  - Verificar que todos são salvos localmente
  - Reconectar internet
  - Verificar que todos são sincronizados
  - Verificar ordem de sincronização

### Testes de Permissões

- [ ] **Teste 12: Acesso Restrito ao Dashboard**
  - Tentar acessar `/dashboard/ponto/aprovacoes` como supervisor
  - Verificar que acesso é negado ou redirecionado
  - Verificar que apenas PWA está acessível para aprovações

- [ ] **Teste 13: Visualização de Aprovados/Rejeitados**
  - Verificar se supervisor pode visualizar histórico de aprovados
  - Verificar se supervisor pode visualizar rejeitados
  - Verificar filtros disponíveis

---

## 🔌 Endpoints Utilizados

### GET
```
GET /api/ponto-eletronico/horas-extras?status=Pendente
GET /api/ponto-eletronico/registros/:id
```

### POST
```
POST /api/ponto-eletronico/registros/:id/aprovar-assinatura
POST /api/ponto-eletronico/horas-extras/aprovar-lote
POST /api/ponto-eletronico/horas-extras/rejeitar-lote
```

---

## ✅ Critérios de Aceitação

- [ ] Visualização de horas extras pendentes funciona corretamente
- [ ] Aprovação individual exige assinatura digital obrigatória
- [ ] Rejeição individual exige motivo obrigatório
- [ ] Aprovação em massa funciona com uma assinatura para múltiplos
- [ ] Sistema bloqueia aprovação sem assinatura
- [ ] Detalhes de aprovações são exibidos corretamente
- [ ] Modo offline funciona e sincroniza corretamente
- [ ] Supervisor não acessa dashboard para aprovar
- [ ] Assinatura digital é salva e associada corretamente
- [ ] Interface PWA é responsiva e funciona bem em mobile

---

## 🧪 Casos de Teste

### Teste 1: Aprovação com Assinatura Obrigatória
**Dado:** Supervisor acessando PWA de aprovações  
**Quando:** Tenta aprovar sem assinar  
**Então:** Sistema bloqueia e exige assinatura digital antes de aprovar

### Teste 2: Aprovação Individual Completa
**Dado:** Registro pendente selecionado  
**Quando:** Supervisor aprova com assinatura e justificativa  
**Então:** Registro é aprovado, assinatura é salva e status muda para "Aprovado"

### Teste 3: Aprovação em Massa
**Dado:** 5 registros pendentes selecionados  
**Quando:** Supervisor aprova em massa com uma assinatura  
**Então:** Todos os 5 registros são aprovados com a mesma assinatura

### Teste 4: Rejeição com Motivo
**Dado:** Registro pendente selecionado  
**Quando:** Supervisor rejeita com motivo  
**Então:** Registro é rejeitado, motivo é salvo e status muda para "Rejeitado"

### Teste 5: Aprovação Offline
**Dado:** Supervisor sem internet  
**Quando:** Aprova registro com assinatura  
**Então:** Aprovação é salva localmente e sincronizada quando internet voltar

### Teste 6: Acesso Restrito
**Dado:** Supervisor logado  
**Quando:** Tenta acessar dashboard para aprovar  
**Então:** Acesso é negado, apenas PWA está disponível

---

## 🔗 Dependências

### Bloqueada por:
- TASK-PONTO-003 - Validações de Horas Extras e Justificativas (validações básicas devem estar funcionando)

### Bloqueia:
- Nenhuma

### Relacionada com:
- RESUMO-CHECKLIST-PONTO-ELETRONICO.md
- TASK-PONTO-003 - Validações de Horas Extras e Justificativas

---

## 📚 Referências

- `RESUMO-CHECKLIST-PONTO-ELETRONICO.md` - Checklist de testes
- `app/pwa/aprovacoes/page.tsx` - PWA de aprovações
- `app/pwa/aprovacao-massa/page.tsx` - Aprovação em massa

---

## 💡 Notas Técnicas

- Assinatura digital é OBRIGATÓRIA para aprovação de horas extras
- Uma assinatura pode ser usada para aprovar múltiplos registros em massa
- Assinatura é salva como imagem/base64 e associada aos registros
- PWA deve funcionar offline usando Service Worker
- Supervisor não deve ter acesso ao dashboard para aprovações (apenas visualização)

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Assinatura digital pode não funcionar bem em telas pequenas
  - **Mitigação:** Testar em diferentes tamanhos de tela e dispositivos

- **Risco 2:** Aprovação em massa offline pode gerar conflitos
  - **Mitigação:** Implementar tratamento de conflitos na sincronização

- **Risco 3:** Assinatura pode ser facilmente falsificada
  - **Mitigação:** Considerar validação adicional ou criptografia (futuro)

---

## 📊 Estimativas

**Tempo Estimado:** 4-5 horas  
**Complexidade:** Média  
**Esforço:** Grande

---

## 🔄 Histórico de Mudanças

| Data | Autor | Mudança |
|------|-------|---------|
| 02/02/2025 | Sistema | Task criada baseada em RESUMO-CHECKLIST-PONTO-ELETRONICO.md |

---

## ✅ Checklist Final

- [ ] Testes de visualização realizados
- [ ] Aprovação individual testada
- [ ] Rejeição individual testada
- [ ] Aprovação em massa testada
- [ ] Assinatura digital validada
- [ ] Modo offline testado
- [ ] Permissões validadas
- [ ] Documentação de resultados criada
- [ ] Bugs encontrados reportados
- [ ] Task fechada

---

**Criado em:** 02/02/2025  
**Última Atualização:** 02/02/2025

