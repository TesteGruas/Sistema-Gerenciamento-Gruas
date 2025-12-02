# 📋 Task: Testes por Perfil - Funcionário (PWA)

**ID da Task:** TASK-PONTO-004  
**Título:** Testes Completos para Perfil Funcionário no PWA  
**Fase:** Validação  
**Módulo:** Ponto Eletrônico  
**Arquivo(s):** `app/pwa/ponto/page.tsx`, `app/pwa/espelho-ponto/page.tsx`

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🟢 ALTA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Realizar testes completos do sistema de ponto eletrônico para o perfil de Funcionário, focando no PWA (`/pwa/ponto`). Funcionários usam exclusivamente o PWA para bater ponto e visualizar seus próprios registros, não tendo acesso ao dashboard.

Esta task cobre:
- Registro de ponto no PWA
- Validação GPS de localização
- Assinatura digital para horas extras
- Modo offline e sincronização
- Visualização de registros próprios
- Espelho de ponto mensal

---

## 🎯 Objetivos

- [ ] Validar registro de ponto completo (entrada, almoço, volta, saída) no PWA
- [ ] Validar validação GPS de localização obrigatória
- [ ] Validar assinatura digital para horas extras
- [ ] Validar modo offline e sincronização posterior
- [ ] Validar que funcionário visualiza apenas seus próprios registros
- [ ] Validar espelho de ponto mensal
- [ ] Validar que funcionário não acessa dashboard

---

## 📋 Situação Atual

### Funcionalidades Implementadas

- ✅ PWA de registro de ponto (`/pwa/ponto`)
- ✅ Validação GPS obrigatória
- ✅ Assinatura digital para horas extras
- ✅ Modo offline com sincronização
- ✅ Espelho de ponto mensal (`/pwa/espelho-ponto`)
- ✅ Visualização de registros próprios

### Integrações Existentes

- ✅ API `/api/ponto-eletronico/registros` - Registro de ponto
- ✅ API `/api/ponto-eletronico/registros?funcionario_id=X` - Registros próprios
- ✅ Service Worker para modo offline
- ✅ IndexedDB para armazenamento offline

---

## 🔧 Ações Necessárias

### Testes de Registro de Ponto

- [ ] **Teste 1: Registro Completo no PWA**
  - Acessar `/pwa/ponto` como funcionário
  - Registrar entrada às 08:00
  - Verificar que GPS foi capturado
  - Registrar saída almoço às 12:00
  - Registrar volta almoço às 13:00
  - Registrar saída às 18:00
  - Verificar que todos os registros foram salvos
  - Verificar que aparecem na lista de registros

- [ ] **Teste 2: Validação GPS Obrigatória**
  - Desabilitar GPS no dispositivo
  - Tentar registrar ponto
  - Verificar que sistema solicita permissão de GPS
  - Verificar que registro não é salvo sem GPS válido
  - Habilitar GPS e verificar que registro funciona

- [ ] **Teste 3: Validação de Localização**
  - Registrar ponto em localização válida (obra)
  - Verificar que localização é aceita
  - Tentar registrar ponto em localização inválida (fora da obra)
  - Verificar que sistema alerta sobre localização inválida
  - Verificar se permite registro mesmo assim (conforme regra de negócio)

- [ ] **Teste 4: Assinatura Digital para Horas Extras**
  - Registrar ponto que gere horas extras (> 8h)
  - Verificar que sistema solicita assinatura digital
  - Desenhar assinatura no canvas
  - Confirmar assinatura
  - Verificar que assinatura é salva
  - Verificar que registro é salvo com horas extras

### Testes de Modo Offline

- [ ] **Teste 5: Registro Offline**
  - Desconectar internet
  - Registrar ponto no PWA
  - Verificar que registro é salvo localmente (IndexedDB)
  - Verificar que aparece na lista com indicador "Pendente sincronização"
  - Reconectar internet
  - Verificar que registro é sincronizado automaticamente
  - Verificar que indicador "Pendente" desaparece

- [ ] **Teste 6: Múltiplos Registros Offline**
  - Desconectar internet
  - Registrar múltiplos pontos (entrada, almoço, saída)
  - Verificar que todos são salvos localmente
  - Reconectar internet
  - Verificar que todos são sincronizados
  - Verificar ordem de sincronização

- [ ] **Teste 7: Falha na Sincronização**
  - Criar registro offline
  - Reconectar com API indisponível
  - Verificar que sistema tenta sincronizar
  - Verificar que registro permanece como "Pendente"
  - Quando API voltar, verificar que sincroniza automaticamente

### Testes de Visualização

- [ ] **Teste 8: Visualização de Registros Próprios**
  - Acessar lista de registros no PWA
  - Verificar que apenas registros do funcionário logado são exibidos
  - Verificar que não é possível ver registros de outros funcionários
  - Verificar informações exibidas (data, horários, horas trabalhadas, status)

- [ ] **Teste 9: Espelho de Ponto Mensal**
  - Acessar `/pwa/espelho-ponto`
  - Selecionar mês atual
  - Verificar que espelho é exibido corretamente
  - Verificar que mostra todos os registros do mês
  - Verificar cálculos de horas trabalhadas e horas extras
  - Verificar que justificativas aparecem quando aplicável

- [ ] **Teste 10: Filtros no Espelho**
  - Aplicar filtro de mês diferente
  - Verificar que dados são atualizados
  - Verificar que cálculos refletem o período selecionado

### Testes de Permissões

- [ ] **Teste 11: Acesso Restrito**
  - Tentar acessar `/dashboard/ponto` como funcionário
  - Verificar que acesso é negado ou redirecionado
  - Verificar que apenas PWA está acessível

- [ ] **Teste 12: Edição de Registros**
  - Verificar que funcionário não pode editar registros próprios
  - Verificar que apenas visualização é permitida
  - Verificar que criação de justificativas é permitida

---

## 🔌 Endpoints Utilizados

### GET
```
GET /api/ponto-eletronico/registros?funcionario_id=X
GET /api/ponto-eletronico/espelho-ponto?funcionario_id=X&mes=Y&ano=Z
```

### POST
```
POST /api/ponto-eletronico/registros
```

---

## ✅ Critérios de Aceitação

- [ ] Registro de ponto funciona corretamente no PWA
- [ ] Validação GPS é obrigatória e funciona
- [ ] Assinatura digital funciona para horas extras
- [ ] Modo offline funciona e sincroniza corretamente
- [ ] Funcionário visualiza apenas seus próprios registros
- [ ] Espelho de ponto mensal funciona corretamente
- [ ] Funcionário não acessa dashboard
- [ ] Sincronização offline funciona automaticamente
- [ ] Interface PWA é responsiva e funciona bem em mobile

---

## 🧪 Casos de Teste

### Teste 1: Fluxo Completo de Registro
**Dado:** Funcionário acessando PWA de ponto  
**Quando:** Registra entrada, almoço, volta e saída  
**Então:** Todos os registros são salvos com GPS válido e aparecem na lista

### Teste 2: GPS Obrigatório
**Dado:** Funcionário tentando registrar ponto  
**Quando:** GPS está desabilitado  
**Então:** Sistema solicita permissão e bloqueia registro até GPS estar ativo

### Teste 3: Registro Offline
**Dado:** Funcionário sem internet  
**Quando:** Registra ponto  
**Então:** Registro é salvo localmente e sincronizado quando internet voltar

### Teste 4: Assinatura para Horas Extras
**Dado:** Registro que gera horas extras  
**Quando:** Funcionário confirma registro  
**Então:** Sistema solicita assinatura digital antes de salvar

### Teste 5: Visualização Restrita
**Dado:** Funcionário logado  
**Quando:** Acessa lista de registros  
**Então:** Apenas seus próprios registros são exibidos

### Teste 6: Espelho Mensal
**Dado:** Funcionário acessando espelho de ponto  
**Quando:** Seleciona mês  
**Então:** Espelho é exibido com todos os registros e cálculos corretos

---

## 🔗 Dependências

### Bloqueada por:
- TASK-PONTO-002 - Validações de Registro e Edição (validações básicas devem estar funcionando)

### Bloqueia:
- Nenhuma

### Relacionada com:
- RESUMO-CHECKLIST-PONTO-ELETRONICO.md
- TASK-PONTO-002 - Validações de Registro e Edição

---

## 📚 Referências

- `RESUMO-CHECKLIST-PONTO-ELETRONICO.md` - Checklist de testes
- `app/pwa/ponto/page.tsx` - PWA de registro de ponto
- `app/pwa/espelho-ponto/page.tsx` - Espelho de ponto mensal

---

## 💡 Notas Técnicas

- PWA deve funcionar offline usando Service Worker
- Dados offline são armazenados em IndexedDB
- Sincronização deve ser automática quando conexão voltar
- GPS é obrigatório para todos os registros
- Assinatura digital é obrigatória apenas para horas extras

---

## ⚠️ Riscos e Considerações

- **Risco 1:** GPS pode não funcionar em ambientes internos
  - **Mitigação:** Testar em diferentes condições e considerar tolerância de localização

- **Risco 2:** Sincronização offline pode falhar se muitos registros estiverem pendentes
  - **Mitigação:** Implementar sincronização em lote e tratamento de erros

- **Risco 3:** Service Worker pode não funcionar em todos os navegadores
  - **Mitigação:** Testar em múltiplos navegadores e dispositivos

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

- [ ] Testes de registro de ponto realizados
- [ ] Validação GPS testada
- [ ] Assinatura digital testada
- [ ] Modo offline testado
- [ ] Sincronização validada
- [ ] Visualização de registros validada
- [ ] Espelho de ponto testado
- [ ] Permissões validadas
- [ ] Documentação de resultados criada
- [ ] Bugs encontrados reportados
- [ ] Task fechada

---

**Criado em:** 02/02/2025  
**Última Atualização:** 02/02/2025

