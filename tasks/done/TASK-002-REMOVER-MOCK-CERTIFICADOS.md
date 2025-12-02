# 📋 TASK-002: Remover Mock de Certificados de Colaboradores

**ID da Task:** TASK-002  
**Título:** Substituir Mock de Certificados por API Real  
**Fase:** 1  
**Módulo:** RH - Colaboradores  
**Arquivo(s):** 
- `lib/mocks/certificados-mocks.ts`
- `app/dashboard/rh/colaboradores/[id]/certificados/page.tsx`
- `components/colaborador-certificados.tsx`
- `lib/api-colaboradores-documentos.ts`

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🔴 ALTA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Substituir o mock de certificados de colaboradores (`lib/mocks/certificados-mocks.ts`) por chamadas reais à API. O endpoint backend já existe (`/api/colaboradores/{id}/certificados`) e a API client já está implementada em `lib/api-colaboradores-documentos.ts`.

Atualmente, os componentes ainda estão usando o mock em vez da API real, o que impede que dados reais sejam exibidos e gerenciados.

---

## 🎯 Objetivos

- [ ] Identificar todos os arquivos que usam `mockCertificadosAPI` ou `certificados-mocks`
- [ ] Substituir importações do mock por `colaboradoresDocumentosApi.certificados`
- [ ] Ajustar interfaces e tipos se necessário
- [ ] Atualizar tratamento de erros e loading states
- [ ] Testar integração completa
- [ ] Remover arquivo `lib/mocks/certificados-mocks.ts` após confirmação

---

## 📋 Situação Atual

### Dados Mockados

O arquivo `lib/mocks/certificados-mocks.ts` (linhas 1-103) contém:
- Interface `Certificado` com estrutura de dados
- Array `mockCertificados` com dados estáticos
- Objeto `mockCertificadosAPI` com métodos:
  - `listar(colaboradorId: number)`
  - `criar(colaboradorId: number, data: Partial<Certificado>)`
  - `atualizar(id: number, data: Partial<Certificado>)`
  - `excluir(id: number)`
  - `verificarVencendo()`

### Integrações Existentes

- ✅ Backend endpoint existe: `/api/colaboradores/{id}/certificados`
- ✅ API client implementado: `lib/api-colaboradores-documentos.ts`
- ✅ Rota registrada no backend: `backend-api/src/server.js:347`
- ✅ Rotas backend em: `backend-api/src/routes/colaboradores-documentos.js`
- ⚠️ Frontend ainda usa mock em:
  - `app/dashboard/rh/colaboradores/[id]/certificados/page.tsx`
  - `components/colaborador-certificados.tsx`

---

## 🔧 Ações Necessárias

### Frontend

- [ ] Verificar `app/dashboard/rh/colaboradores/[id]/certificados/page.tsx`:
  - Substituir import de `mockCertificadosAPI` por `colaboradoresDocumentosApi.certificados`
  - Ajustar chamadas de API para usar a estrutura correta
  - Verificar se tipos/interfaces estão compatíveis
  - Adicionar tratamento de erros adequado
  - Adicionar loading states se necessário

- [ ] Verificar `components/colaborador-certificados.tsx`:
  - Substituir import de `mockCertificadosAPI` por `colaboradoresDocumentosApi.certificados`
  - Ajustar chamadas de API
  - Verificar compatibilidade de tipos
  - Atualizar tratamento de erros

- [ ] Verificar outros arquivos que possam usar o mock:
  - Buscar por `certificados-mocks` em todo o projeto
  - Buscar por `mockCertificadosAPI` em todo o projeto
  - Substituir todas as ocorrências

- [ ] Comparar interfaces:
  - Verificar se `Certificado` do mock é compatível com `CertificadoBackend`
  - Criar função de conversão se necessário
  - Ajustar tipos TypeScript

### Backend

- [ ] Verificar se endpoint `/api/colaboradores/{id}/certificados` está funcionando corretamente
- [ ] Testar todos os métodos (GET, POST, PUT, DELETE)
- [ ] Verificar se retorna dados no formato esperado pelo frontend

### Banco de Dados

- [ ] Verificar se tabela de certificados existe e está estruturada corretamente
- [ ] Verificar se há dados de teste para validação

---

## 🔌 Endpoints Necessários

### GET
```
GET /api/colaboradores/:colaboradorId/certificados
GET /api/colaboradores/certificados/vencendo
```

### POST
```
POST /api/colaboradores/:colaboradorId/certificados
```

### PUT
```
PUT /api/colaboradores/certificados/:certificadoId
```

### DELETE
```
DELETE /api/colaboradores/certificados/:certificadoId
```

**Nota:** Endpoints já existem no backend, apenas precisam ser integrados no frontend.

---

## 🗂️ Estrutura de Dados

### Request - Criar Certificado
```typescript
interface CertificadoCreateData {
  tipo: string;
  nome: string;
  data_validade: string;
  arquivo?: string;
}
```

### Response - Certificado
```typescript
interface CertificadoBackend {
  id: string;
  colaborador_id: number;
  tipo: string;
  nome: string;
  data_validade: string;
  arquivo?: string;
  alerta_enviado: boolean;
  created_at: string;
  updated_at: string;
}
```

### Response - Lista de Certificados
```typescript
interface CertificadosResponse {
  success: boolean;
  data: CertificadoBackend[];
}
```

---

## ✅ Critérios de Aceitação

- [ ] Todos os imports de `certificados-mocks` foram removidos
- [ ] Todos os componentes usam `colaboradoresDocumentosApi.certificados`
- [ ] Listagem de certificados funciona com dados reais
- [ ] Criação de certificado funciona
- [ ] Atualização de certificado funciona
- [ ] Exclusão de certificado funciona
- [ ] Verificação de certificados vencendo funciona
- [ ] Tratamento de erros implementado
- [ ] Loading states funcionando
- [ ] Testes de integração passando
- [ ] Arquivo `lib/mocks/certificados-mocks.ts` removido
- [ ] Documentação atualizada

---

## 🧪 Casos de Teste

### Teste 1: Listar Certificados
**Dado:** Um colaborador com certificados cadastrados no banco  
**Quando:** Acessar a página de certificados do colaborador  
**Então:** Deve exibir os certificados reais do banco de dados

### Teste 2: Criar Certificado
**Dado:** Um colaborador existente  
**Quando:** Criar um novo certificado via formulário  
**Então:** O certificado deve ser salvo no banco e exibido na lista

### Teste 3: Atualizar Certificado
**Dado:** Um certificado existente  
**Quando:** Atualizar informações do certificado  
**Então:** As informações devem ser atualizadas no banco e refletidas na interface

### Teste 4: Excluir Certificado
**Dado:** Um certificado existente  
**Quando:** Excluir o certificado  
**Então:** O certificado deve ser removido do banco e da lista

### Teste 5: Certificados Vencendo
**Dado:** Certificados com data de validade próxima  
**Quando:** Acessar a funcionalidade de certificados vencendo  
**Então:** Deve exibir apenas certificados que vencem em até 30 dias

---

## 🔗 Dependências

### Bloqueada por:
- Nenhuma (pode ser executada independentemente)

### Bloqueia:
- Nenhuma (pode ser executada em paralelo com outras tasks)

### Relacionada com:
- TASK-006 - Remover fallbacks silenciosos (pode haver fallbacks relacionados)

---

## 📚 Referências

- `RELATORIO-AUDITORIA-COMPLETA-2025-02-02.md` - Seção "1.1 Mocks Críticos em Produção - Certificados de Colaboradores"
- `lib/api-colaboradores-documentos.ts` - API client existente
- `backend-api/src/routes/colaboradores-documentos.js` - Rotas backend

---

## 💡 Notas Técnicas

1. **Compatibilidade de Tipos:** Verificar se a interface `Certificado` do mock é compatível com `CertificadoBackend` da API. Pode ser necessário criar função de conversão.

2. **IDs:** O mock usa `number` para IDs, mas a API pode usar `string` (UUID). Ajustar conforme necessário.

3. **Tratamento de Erros:** A API real pode retornar erros diferentes do mock. Garantir tratamento adequado.

4. **Loading States:** O mock tinha delay simulado (500ms). A API real pode ter tempos diferentes. Ajustar loading states conforme necessário.

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Incompatibilidade entre tipos do mock e da API
  - **Mitigação:** Comparar interfaces antes de substituir e criar funções de conversão se necessário

- **Risco 2:** Dados do mock podem ter estrutura diferente da API
  - **Mitigação:** Testar com dados reais do banco antes de remover o mock

- **Risco 3:** Funcionalidades que dependem do mock podem quebrar
  - **Mitigação:** Testar todas as funcionalidades após substituição

---

## 📊 Estimativas

**Tempo Estimado:** 4-6 horas  
**Complexidade:** Baixa  
**Esforço:** Pequeno

**Breakdown:**
- Identificação de arquivos: 30 minutos
- Substituição de imports e ajustes: 2-3 horas
- Testes e correções: 1-2 horas
- Remoção do mock: 30 minutos

---

## 🔄 Histórico de Mudanças

| Data | Autor | Mudança |
|------|-------|---------|
| 02/02/2025 | Sistema | Task criada |

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

**Criado em:** 02/02/2025  
**Última Atualização:** 02/02/2025

