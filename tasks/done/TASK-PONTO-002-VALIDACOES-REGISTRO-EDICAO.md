# 📋 Task: Validações Funcionais - Registro e Edição

**ID da Task:** TASK-PONTO-002  
**Título:** Validações Funcionais de Registro e Edição de Ponto  
**Fase:** Validação  
**Módulo:** Ponto Eletrônico  
**Arquivo(s):** `app/dashboard/ponto/page.tsx`, `app/pwa/ponto/page.tsx`

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🟢 ALTA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Realizar validações funcionais completas do sistema de registro e edição de ponto eletrônico, garantindo que todas as regras de negócio, validações de sequência, cálculos automáticos e permissões estejam funcionando corretamente.

Esta task cobre:
- Registro de ponto (entrada, saída almoço, volta almoço, saída)
- Validações de sequência e regras de negócio
- Edição de registros com justificativa obrigatória
- Cálculos automáticos de horas trabalhadas e horas extras
- Histórico de alterações

---

## 🎯 Objetivos

- [ ] Validar registro de ponto em todas as etapas (entrada, almoço, volta, saída)
- [ ] Validar que não é possível registrar saída sem entrada
- [ ] Validar que não é possível registrar entrada duplicada no mesmo dia
- [ ] Verificar cálculo automático de horas trabalhadas
- [ ] Verificar cálculo automático de horas extras
- [ ] Validar edição de registros com justificativa obrigatória
- [ ] Verificar que histórico de alterações é salvo corretamente
- [ ] Validar recálculo de horas após edição

---

## 📋 Situação Atual

### Funcionalidades Implementadas

- ✅ Registro de ponto no PWA (`/pwa/ponto`)
- ✅ Registro de ponto no Dashboard (`/dashboard/ponto`) - Admin/Gestor
- ✅ Edição de registros no Dashboard
- ✅ Validação GPS obrigatória
- ✅ Cálculo automático de horas trabalhadas
- ✅ Cálculo automático de horas extras
- ✅ Sistema de justificativas para alterações

### Integrações Existentes

- ✅ API `/api/ponto-eletronico/registros` - CRUD de registros
- ✅ API `/api/ponto-eletronico/registros/:id` - Detalhes e edição
- ✅ Validações de sequência no backend
- ✅ Cálculos de horas no backend

---

## 🔧 Ações Necessárias

### Testes de Registro de Ponto

- [ ] **Teste 1: Registro Completo de Ponto**
  - Registrar entrada às 08:00
  - Registrar saída almoço às 12:00
  - Registrar volta almoço às 13:00
  - Registrar saída às 18:00
  - Verificar que todos os registros foram salvos
  - Verificar cálculo de horas trabalhadas (8 horas)
  - Verificar cálculo de horas extras (se aplicável)

- [ ] **Teste 2: Validação de Sequência - Entrada Obrigatória**
  - Tentar registrar saída sem ter registrado entrada
  - Verificar que sistema bloqueia e exibe mensagem de erro
  - Verificar que registro não é salvo

- [ ] **Teste 3: Validação de Entrada Duplicada**
  - Registrar entrada às 08:00
  - Tentar registrar entrada novamente no mesmo dia
  - Verificar que sistema bloqueia e exibe mensagem de erro

- [ ] **Teste 4: Validação GPS**
  - Tentar registrar ponto sem permissão de GPS
  - Verificar que sistema solicita permissão
  - Verificar que registro não é salvo sem GPS válido

- [ ] **Teste 5: Cálculo de Horas Trabalhadas**
  - Registrar entrada: 08:00
  - Registrar saída: 18:00
  - Verificar que horas trabalhadas = 8 horas
  - Verificar cálculo com intervalo de almoço

- [ ] **Teste 6: Cálculo de Horas Extras**
  - Registrar entrada: 08:00
  - Registrar saída: 20:00 (12 horas totais)
  - Verificar que horas extras = 4 horas (considerando 8h normais)
  - Verificar cálculo com diferentes jornadas

### Testes de Edição de Registros

- [ ] **Teste 7: Edição com Justificativa Obrigatória**
  - Acessar registro existente
  - Tentar editar horário sem preencher justificativa
  - Verificar que sistema bloqueia e exige justificativa
  - Preencher justificativa e salvar
  - Verificar que edição foi salva

- [ ] **Teste 8: Histórico de Alterações**
  - Editar um registro existente
  - Verificar que histórico de alterações é salvo
  - Verificar que histórico contém: data, usuário, justificativa, valores antigos e novos

- [ ] **Teste 9: Recálculo Após Edição**
  - Editar horário de saída de um registro
  - Verificar que horas trabalhadas são recalculadas
  - Verificar que horas extras são recalculadas
  - Verificar que status é atualizado se necessário

- [ ] **Teste 10: Edição de Múltiplos Campos**
  - Editar entrada, saída almoço, volta almoço e saída
  - Verificar que todos os campos são atualizados
  - Verificar que cálculos refletem todas as mudanças

---

## 🔌 Endpoints Utilizados

### GET
```
GET /api/ponto-eletronico/registros
GET /api/ponto-eletronico/registros/:id
```

### POST
```
POST /api/ponto-eletronico/registros
```

### PUT/PATCH
```
PUT /api/ponto-eletronico/registros/:id
PATCH /api/ponto-eletronico/registros/:id
```

---

## ✅ Critérios de Aceitação

- [ ] Registro de ponto funciona em todas as etapas
- [ ] Validações de sequência funcionam corretamente
- [ ] Sistema bloqueia ações inválidas com mensagens claras
- [ ] Cálculo de horas trabalhadas está correto
- [ ] Cálculo de horas extras está correto
- [ ] Edição de registros exige justificativa obrigatória
- [ ] Histórico de alterações é salvo corretamente
- [ ] Recálculo automático funciona após edição
- [ ] Validação GPS funciona corretamente
- [ ] Sistema funciona tanto no PWA quanto no Dashboard

---

## 🧪 Casos de Teste

### Teste 1: Fluxo Completo de Registro
**Dado:** Usuário funcionário acessando PWA de ponto  
**Quando:** Registra entrada, almoço, volta e saída  
**Então:** Todos os registros são salvos e cálculos estão corretos

### Teste 2: Tentativa de Saída sem Entrada
**Dado:** Usuário sem registro de entrada no dia  
**Quando:** Tenta registrar saída  
**Então:** Sistema bloqueia e exibe mensagem: "É necessário registrar entrada antes de sair"

### Teste 3: Entrada Duplicada
**Dado:** Usuário já registrou entrada no dia  
**Quando:** Tenta registrar entrada novamente  
**Então:** Sistema bloqueia e exibe mensagem: "Entrada já registrada hoje"

### Teste 4: Cálculo de Horas com Almoço
**Dado:** Entrada 08:00, Saída Almoço 12:00, Volta 13:00, Saída 18:00  
**Quando:** Registro é salvo  
**Então:** Horas trabalhadas = 8 horas (descontando 1h de almoço)

### Teste 5: Edição com Justificativa
**Dado:** Registro existente sendo editado  
**Quando:** Usuário tenta salvar sem justificativa  
**Então:** Sistema bloqueia e exige preenchimento de justificativa

### Teste 6: Recálculo Automático
**Dado:** Registro com saída às 18:00 (8h trabalhadas)  
**Quando:** Saída é editada para 20:00  
**Então:** Horas trabalhadas atualiza para 10h e horas extras para 2h

---

## 🔗 Dependências

### Bloqueada por:
- Nenhuma

### Bloqueia:
- TASK-PONTO-004 - Testes por Perfil Funcionário (depende de validação de registro)
- TASK-PONTO-006 - Testes por Perfil Admin/Gestor (depende de validação de edição)

### Relacionada com:
- RESUMO-VALIDACAO-PONTO-ELETRONICO.md
- RESUMO-CHECKLIST-PONTO-ELETRONICO.md

---

## 📚 Referências

- `RESUMO-VALIDACAO-PONTO-ELETRONICO.md` - Validações necessárias
- `app/dashboard/ponto/page.tsx` - Página principal do dashboard
- `app/pwa/ponto/page.tsx` - PWA de registro de ponto

---

## 💡 Notas Técnicas

- Validações de sequência são críticas para integridade dos dados
- Cálculos de horas devem considerar jornada de trabalho configurada
- Histórico de alterações é importante para auditoria
- GPS é obrigatório para registro de ponto (validação de localização)

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Cálculos de horas podem variar conforme jornada de trabalho
  - **Mitigação:** Validar com diferentes configurações de jornada

- **Risco 2:** Edições podem afetar horas extras já aprovadas
  - **Mitigação:** Verificar comportamento quando registro editado tem horas extras aprovadas

- **Risco 3:** GPS pode não funcionar em ambientes internos
  - **Mitigação:** Testar em diferentes condições de localização

---

## 📊 Estimativas

**Tempo Estimado:** 3-4 horas  
**Complexidade:** Média  
**Esforço:** Médio

---

## 🔄 Histórico de Mudanças

| Data | Autor | Mudança |
|------|-------|---------|
| 02/02/2025 | Sistema | Task criada baseada em RESUMO-VALIDACAO-PONTO-ELETRONICO.md |

---

## ✅ Checklist Final

- [ ] Testes de registro de ponto realizados
- [ ] Validações de sequência validadas
- [ ] Cálculos de horas validados
- [ ] Testes de edição realizados
- [ ] Histórico de alterações validado
- [ ] Validação GPS testada
- [ ] Documentação de resultados criada
- [ ] Bugs encontrados reportados
- [ ] Task fechada

---

**Criado em:** 02/02/2025  
**Última Atualização:** 02/02/2025

