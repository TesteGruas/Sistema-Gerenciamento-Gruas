# 📊 Status de Implementação Frontend

**Última atualização:** 2025

---

## ✅ Componentes Implementados

### 1. Componentes Reutilizáveis

#### ✅ `components/documento-upload.tsx`
- **Status:** ✅ Implementado
- **Funcionalidades:**
  - Upload de arquivos com drag & drop
  - Validação de tipo e tamanho
  - Preview de imagens
  - Suporte para PDF e imagens
  - Remoção de arquivo
- **Mock:** Não (componente genérico)
- **Uso:** Usado em múltiplos lugares (documentos, certificados, etc.)

#### ✅ `components/cno-input.tsx`
- **Status:** ✅ Implementado
- **Funcionalidades:**
  - Input com máscara de números
  - Validação básica
  - Máximo 20 caracteres
- **Mock:** Não (componente de input)
- **Uso:** Formulário de criação de obra

---

### 2. Módulo: Obra

#### ✅ `components/responsavel-tecnico-form.tsx`
- **Status:** ✅ Implementado com Mock
- **Funcionalidades:**
  - Busca de responsável existente por CPF/CNPJ
  - Formulário de cadastro
  - Validação de campos obrigatórios
  - Campos: Nome, CPF/CNPJ, CREA, Email, Telefone
- **Mock:** `mockResponsaveisTecnicos` (array local no componente)
- **Endpoints Pendentes:**
  - `GET /api/responsaveis-tecnicos`
  - `POST /api/responsaveis-tecnicos`
  - `GET /api/responsaveis-tecnicos/buscar?cpf=xxx`

#### ✅ `components/sinaleiros-form.tsx`
- **Status:** ✅ Implementado com Mock
- **Funcionalidades:**
  - Cadastro de até 2 sinaleiros (Principal + Reserva)
  - Cliente pode criar sinaleiro se não informar
  - Validação: sinaleiro principal obrigatório
  - Campos: Nome, RG/CPF, Telefone, Email
  - Integração com lista de documentos
- **Mock:** `lib/mocks/sinaleiros-mocks.ts`
- **Endpoints Pendentes:**
  - `GET /api/obras/:id/sinaleiros`
  - `POST /api/obras/:id/sinaleiros`
  - `PUT /api/sinaleiros/:id`
  - `DELETE /api/sinaleiros/:id`

#### ✅ `components/documentos-sinaleiro-list.tsx`
- **Status:** ✅ Implementado com Mock
- **Funcionalidades:**
  - Listagem de documentos obrigatórios
  - Upload de documentos (RG frente/verso, comprovante, certificado)
  - Status: Pendente / Aprovado / Vencido
  - Aprovação de documentos (Admin/Cliente)
  - Preview de documentos
- **Mock:** `mockDocumentosAPI` (função local no componente)
- **Endpoints Pendentes:**
  - `GET /api/sinaleiros/:id/documentos`
  - `POST /api/sinaleiros/:id/documentos`
  - `PUT /api/documentos-sinaleiro/:id/aprovar`

---

### 3. Módulo: RH

#### ✅ `app/dashboard/rh/colaboradores/[id]/certificados/page.tsx`
- **Status:** ✅ Implementado com Mock
- **Funcionalidades:**
  - Listagem de certificados do colaborador
  - Criação de novo certificado
  - Edição de certificado existente
  - Exclusão de certificado
  - Upload de arquivo do certificado
  - Status visual: Válido / Vencendo / Vencido
  - Contador de dias para vencimento
- **Mock:** `lib/mocks/certificados-mocks.ts`
- **Endpoints Pendentes:**
  - `GET /api/colaboradores/:id/certificados`
  - `POST /api/colaboradores/:id/certificados`
  - `PUT /api/certificados/:id`
  - `DELETE /api/certificados/:id`
  - `GET /api/certificados/vencendo`

---

## ⏳ Próximos Passos

### Prioridade ALTA

1. **Integrar campos obrigatórios na página de criação de obra**
   - Adicionar `CnoInput` em `app/dashboard/obras/nova/page.tsx`
   - Adicionar campos ART e Apólice com `DocumentoUpload`
   - Integrar `ResponsavelTecnicoForm`
   - Integrar `SinaleirosForm`

2. **Página de Documentos Admissionais**
   - Criar `app/dashboard/rh/colaboradores/[id]/documentos-admissionais/page.tsx`
   - Reutilizar lógica de certificados

3. **Página de Holerites**
   - Criar `app/dashboard/rh/colaboradores/[id]/holerites/page.tsx`
   - Implementar upload e assinatura digital

### Prioridade MÉDIA

4. **Checklist Diário**
   - Criar componentes de checklist
   - Página de checklist diário

5. **Manutenções**
   - Criar componentes de manutenção
   - Página de manutenções

---

## 📝 Notas de Implementação

### Mocks Implementados

1. **`lib/mocks/sinaleiros-mocks.ts`**
   - Interface `Sinaleiro` e `DocumentoSinaleiro`
   - Array `mockSinaleiros`
   - API mock `mockSinaleirosAPI` com métodos CRUD

2. **`lib/mocks/certificados-mocks.ts`**
   - Interface `Certificado`
   - Array `mockCertificados`
   - API mock `mockCertificadosAPI` com métodos CRUD
   - Função `verificarVencendo()`

### Padrões Seguidos

- Todos os componentes seguem o padrão de UI do projeto (shadcn/ui)
- Uso de `useToast` para notificações
- Validações no frontend antes de enviar
- Estados de loading durante requisições
- Mensagens claras de erro e sucesso
- Marcadores "(MOCK)" nas mensagens de sucesso

### Integração Futura

Quando os endpoints estiverem prontos:

1. Criar arquivos `lib/api-*.ts` para cada módulo
2. Substituir chamadas mock por chamadas reais
3. Manter a mesma interface de dados
4. Atualizar `MOCKS-TRACKING.md`

---

## 🔗 Arquivos Criados

```
components/
  ├── documento-upload.tsx ✅
  ├── cno-input.tsx ✅
  ├── responsavel-tecnico-form.tsx ✅
  ├── sinaleiros-form.tsx ✅
  └── documentos-sinaleiro-list.tsx ✅

lib/mocks/
  ├── sinaleiros-mocks.ts ✅
  └── certificados-mocks.ts ✅

app/dashboard/rh/colaboradores/[id]/
  └── certificados/
      └── page.tsx ✅
```

---

**Progresso:** 7 componentes implementados de ~30 planejados (23%)

