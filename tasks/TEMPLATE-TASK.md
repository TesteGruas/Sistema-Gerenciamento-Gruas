# 📋 Template de Task

Use este template para criar novas tasks ou para documentar tarefas ad-hoc que surgirem durante o projeto.

---

## Informações Básicas

**ID da Task:** TASK-XXX  
**Título:** [Título descritivo da task]  
**Fase:** [1-4 ou Outro]  
**Módulo:** [Nome do módulo]  
**Arquivo(s):** [Caminho dos arquivos envolvidos]

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🟡 MÉDIA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

[Descreva o que precisa ser feito]

---

## 🎯 Objetivos

- [ ] Objetivo 1
- [ ] Objetivo 2
- [ ] Objetivo 3

---

## 📋 Situação Atual

### Dados Mockados
[Liste os dados mockados que precisam ser removidos, com números de linha se aplicável]

```typescript
// Exemplo de código mockado (linhas XX-YY)
const mockData = [...]
```

### Integrações Existentes
[Liste as integrações que já existem e funcionam]

---

## 🔧 Ações Necessárias

### Frontend
- [ ] Ação 1
- [ ] Ação 2
- [ ] Ação 3

### Backend
- [ ] Ação 1
- [ ] Ação 2
- [ ] Ação 3

### Banco de Dados
- [ ] Migração 1
- [ ] Migração 2

---

## 🔌 Endpoints Necessários

### GET
```
GET /api/recurso
GET /api/recurso/:id
```

### POST
```
POST /api/recurso
```

### PUT/PATCH
```
PUT /api/recurso/:id
```

### DELETE
```
DELETE /api/recurso/:id
```

---

## 🗂️ Estrutura de Dados

### Request
```typescript
interface Request {
  campo1: string;
  campo2: number;
  campo3?: boolean;
}
```

### Response
```typescript
interface Response {
  id: number;
  campo1: string;
  campo2: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## ✅ Critérios de Aceitação

- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3
- [ ] Todos os dados mock removidos
- [ ] Endpoints implementados e funcionando
- [ ] Tratamento de erros implementado
- [ ] Loading states funcionando
- [ ] Validações implementadas
- [ ] Testes unitários criados
- [ ] Testes de integração criados
- [ ] Documentação atualizada
- [ ] Code review aprovado

---

## 🧪 Casos de Teste

### Teste 1: [Nome do Teste]
**Dado:** [Condição inicial]  
**Quando:** [Ação executada]  
**Então:** [Resultado esperado]

### Teste 2: [Nome do Teste]
**Dado:** [Condição inicial]  
**Quando:** [Ação executada]  
**Então:** [Resultado esperado]

---

## 🔗 Dependências

### Bloqueada por:
- [ ] TASK-XXX - [Descrição]

### Bloqueia:
- [ ] TASK-XXX - [Descrição]

### Relacionada com:
- [ ] TASK-XXX - [Descrição]

---

## 📚 Referências

- [Link para documentação relevante]
- [Link para issue relacionada]
- [Link para PR]

---

## 💡 Notas Técnicas

[Adicione notas técnicas importantes, decisões de arquitetura, etc.]

---

## ⚠️ Riscos e Considerações

- **Risco 1:** [Descrição do risco e mitigação]
- **Risco 2:** [Descrição do risco e mitigação]

---

## 📊 Estimativas

**Tempo Estimado:** X horas/dias  
**Complexidade:** Baixa / Média / Alta  
**Esforço:** Pequeno / Médio / Grande

---

## 🔄 Histórico de Mudanças

| Data | Autor | Mudança |
|------|-------|---------|
| DD/MM/AAAA | Nome | Descrição da mudança |

---

## ✅ Checklist Final

- [ ] Código implementado
- [ ] Testes passando
- [ ] Code review realizado
- [ ] Documentação atualizada
- [ ] Deploy em dev
- [ ] Testes em dev
- [ ] Deploy em homologação
- [ ] Testes em homologação
- [ ] Aprovação do PO
- [ ] Deploy em produção
- [ ] Verificação em produção
- [ ] Task fechada

---

**Criado em:** DD/MM/AAAA  
**Última Atualização:** DD/MM/AAAA

