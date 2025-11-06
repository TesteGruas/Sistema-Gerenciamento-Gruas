# 🧪 Guia de Teste - Funcionalidades de Sinaleiros

## ✅ Status da Integração

**SIM, está integrado ao backend e usando dados reais!**

- ✅ Backend: Rotas implementadas em `backend-api/src/routes/obras.js`
- ✅ Banco de Dados: Tabelas `sinaleiros_obra` e `documentos_sinaleiro` criadas
- ✅ Frontend: Componentes em `components/sinaleiros-form.tsx` e `components/editar-sinaleiro-dialog.tsx`
- ✅ API Client: `lib/api-sinaleiros.ts` conectado ao backend real

---

## 📋 Funcionalidades Disponíveis

### 1. **Cadastro de Sinaleiros**
- Cadastrar sinaleiro principal (obrigatório)
- Cadastrar sinaleiro reserva (opcional)
- Editar informações dos sinaleiros
- Validação de campos obrigatórios

### 2. **Documentos dos Sinaleiros**
- Upload de documentos
- Controle de validade
- Aprovação/Rejeição de documentos
- Status: pendente, aprovado, rejeitado, vencido

### 3. **Integração com Funcionários**
- Buscar funcionários existentes para vincular como sinaleiro
- Criar novo funcionário se necessário

---

## 🚀 Como Testar

### **Pré-requisitos**
1. Backend rodando em `http://localhost:3001`
2. Frontend rodando em `http://localhost:3000`
3. Usuário autenticado com permissão `obras:editar`
4. Uma obra criada no sistema

---

### **Teste 1: Cadastrar Sinaleiros em Nova Obra**

1. **Acesse:** `http://localhost:3000/dashboard/obras/nova`
2. **Preencha os dados básicos da obra**
3. **Role até a seção "Sinaleiros"**
4. **Preencha os dados:**
   - **Sinaleiro Principal:**
     - Nome: "João Silva"
     - RG/CPF: "12345678900"
     - Telefone: "81999999999"
     - Email: "joao@example.com"
   - **Sinaleiro Reserva (opcional):**
     - Nome: "Maria Santos"
     - RG/CPF: "98765432100"
     - Telefone: "81888888888"
     - Email: "maria@example.com"
5. **Clique em "Salvar Sinaleiros"**
6. **Verifique:**
   - ✅ Mensagem de sucesso aparece
   - ✅ Dados são salvos no banco
   - ✅ Sinaleiros aparecem na visualização

**Verificação no Banco:**
```sql
SELECT * FROM sinaleiros_obra WHERE obra_id = <ID_DA_OBRA>;
```

---

### **Teste 2: Editar Sinaleiros em Obra Existente**

1. **Acesse:** `http://localhost:3000/dashboard/obras/<ID_DA_OBRA>`
2. **Na aba "Geral", role até a seção da grua**
3. **Na seção "Sinaleiros", clique em "Editar"**
4. **Modifique os dados:**
   - Altere o nome
   - Altere o telefone
   - Altere o email
5. **Clique em "Salvar"**
6. **Verifique:**
   - ✅ Dados são atualizados no banco
   - ✅ Mudanças aparecem imediatamente na interface

**Verificação no Banco:**
```sql
SELECT * FROM sinaleiros_obra WHERE obra_id = <ID_DA_OBRA> ORDER BY updated_at DESC;
```

---

### **Teste 3: Upload de Documentos**

1. **Acesse:** `http://localhost:3000/dashboard/obras/<ID_DA_OBRA>`
2. **Na seção de sinaleiros, clique em "Editar"**
3. **Na aba "Documentos", clique em "Adicionar Documento"**
4. **Preencha:**
   - Tipo: "Certificado de Capacitação"
   - Arquivo: Selecione um PDF
   - Data de Validade: "2025-12-31"
5. **Clique em "Salvar"**
6. **Verifique:**
   - ✅ Documento aparece na lista
   - ✅ Status inicial é "pendente"
   - ✅ Data de validade é exibida

**Verificação no Banco:**
```sql
SELECT * FROM documentos_sinaleiro WHERE sinaleiro_id = <ID_DO_SINALEIRO>;
```

---

### **Teste 4: Aprovar/Rejeitar Documentos**

1. **Acesse:** `http://localhost:3000/dashboard/obras/<ID_DA_OBRA>`
2. **Na seção de sinaleiros, clique em "Editar"**
3. **Na aba "Documentos", encontre um documento com status "pendente"**
4. **Clique em "Aprovar" ou "Rejeitar"**
5. **Adicione comentários (opcional)**
6. **Confirme a ação**
7. **Verifique:**
   - ✅ Status muda para "aprovado" ou "rejeitado"
   - ✅ Data de aprovação é registrada
   - ✅ Usuário que aprovou é registrado

**Verificação no Banco:**
```sql
SELECT status, aprovado_por, aprovado_em, comentarios 
FROM documentos_sinaleiro 
WHERE id = <ID_DO_DOCUMENTO>;
```

---

### **Teste 5: Buscar Funcionário Existente**

1. **Acesse:** `http://localhost:3000/dashboard/obras/nova`
2. **Na seção "Sinaleiros", clique em "Buscar Funcionário"**
3. **Digite o nome de um funcionário existente**
4. **Selecione o funcionário da lista**
5. **Verifique:**
   - ✅ Dados do funcionário são preenchidos automaticamente
   - ✅ Nome, CPF, telefone e email são carregados

---

### **Teste 6: Validações**

#### **Teste 6.1: Campos Obrigatórios**
1. Tente salvar sem preencher o nome do sinaleiro principal
2. **Verifique:** ✅ Mensagem de erro aparece

#### **Teste 6.2: Email Inválido**
1. Digite um email inválido (ex: "email@")
2. **Verifique:** ✅ Validação de email funciona

#### **Teste 6.3: Limite de Sinaleiros**
1. Tente adicionar mais de 2 sinaleiros
2. **Verifique:** ✅ Sistema permite apenas 1 principal e 1 reserva

---

## 🔍 Endpoints da API

### **Listar Sinaleiros de uma Obra**
```http
GET /api/obras/:id/sinaleiros
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "obra_id": 64,
      "nome": "João Silva",
      "rg_cpf": "12345678900",
      "telefone": "81999999999",
      "email": "joao@example.com",
      "tipo": "principal",
      "created_at": "2025-01-23T10:00:00Z",
      "updated_at": "2025-01-23T10:00:00Z"
    }
  ]
}
```

### **Criar/Atualizar Sinaleiros**
```http
POST /api/obras/:id/sinaleiros
Authorization: Bearer <token>
Content-Type: application/json

{
  "sinaleiros": [
    {
      "id": "uuid-ou-null",
      "nome": "João Silva",
      "rg_cpf": "12345678900",
      "telefone": "81999999999",
      "email": "joao@example.com",
      "tipo": "principal"
    }
  ]
}
```

### **Listar Documentos de um Sinaleiro**
```http
GET /api/obras/sinaleiros/:id/documentos
Authorization: Bearer <token>
```

### **Criar Documento**
```http
POST /api/obras/sinaleiros/:id/documentos
Authorization: Bearer <token>
Content-Type: application/json

{
  "tipo": "Certificado de Capacitação",
  "arquivo": "url-do-arquivo",
  "data_validade": "2025-12-31"
}
```

### **Aprovar/Rejeitar Documento**
```http
PUT /api/obras/documentos-sinaleiro/:id/aprovar
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "aprovado",
  "comentarios": "Documento válido"
}
```

---

## 🐛 Troubleshooting

### **Problema: Sinaleiros não aparecem**
- ✅ Verifique se a obra existe no banco
- ✅ Verifique se há sinaleiros cadastrados: `SELECT * FROM sinaleiros_obra WHERE obra_id = <ID>;`
- ✅ Verifique o console do navegador para erros de API

### **Problema: Erro ao salvar**
- ✅ Verifique se o usuário tem permissão `obras:editar`
- ✅ Verifique se todos os campos obrigatórios estão preenchidos
- ✅ Verifique o formato do email
- ✅ Verifique os logs do backend

### **Problema: Documentos não aparecem**
- ✅ Verifique se o documento foi criado: `SELECT * FROM documentos_sinaleiro WHERE sinaleiro_id = <ID>;`
- ✅ Verifique se o arquivo foi enviado corretamente
- ✅ Verifique o console do navegador

---

## 📊 Estrutura do Banco de Dados

### **Tabela: sinaleiros_obra**
```sql
CREATE TABLE sinaleiros_obra (
  id UUID PRIMARY KEY,
  obra_id INTEGER NOT NULL REFERENCES obras(id),
  nome VARCHAR(255) NOT NULL,
  rg_cpf VARCHAR(20) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(255),
  tipo VARCHAR(20) CHECK (tipo IN ('principal', 'reserva')),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **Tabela: documentos_sinaleiro**
```sql
CREATE TABLE documentos_sinaleiro (
  id UUID PRIMARY KEY,
  sinaleiro_id UUID NOT NULL REFERENCES sinaleiros_obra(id),
  tipo VARCHAR(100) NOT NULL,
  arquivo VARCHAR(500) NOT NULL,
  data_validade DATE,
  status VARCHAR(20) DEFAULT 'pendente',
  aprovado_por INTEGER REFERENCES usuarios(id),
  aprovado_em TIMESTAMP,
  alerta_enviado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
```

---

## ✅ Checklist de Teste Completo

- [ ] Cadastrar sinaleiro principal em nova obra
- [ ] Cadastrar sinaleiro reserva em nova obra
- [ ] Editar sinaleiro existente
- [ ] Buscar funcionário para vincular como sinaleiro
- [ ] Upload de documento do sinaleiro
- [ ] Aprovar documento
- [ ] Rejeitar documento
- [ ] Validar campos obrigatórios
- [ ] Validar formato de email
- [ ] Verificar dados no banco após cada operação
- [ ] Testar com múltiplas obras
- [ ] Testar permissões (usuário sem permissão não deve conseguir editar)

---

## 📝 Notas Importantes

1. **Dados Reais:** Todas as operações usam dados reais do banco de dados
2. **Autenticação:** Todas as rotas requerem autenticação
3. **Permissões:** Edição requer permissão `obras:editar`
4. **Validação:** Backend valida todos os dados antes de salvar
5. **Limite:** Máximo de 2 sinaleiros por obra (1 principal + 1 reserva)

---

## 🔗 Arquivos Relacionados

- **Backend:** `backend-api/src/routes/obras.js` (linhas 1664-1890)
- **Frontend:** `components/sinaleiros-form.tsx`
- **API Client:** `lib/api-sinaleiros.ts`
- **Componente Edição:** `components/editar-sinaleiro-dialog.tsx`
- **Lista Documentos:** `components/documentos-sinaleiro-list.tsx`
- **Migração:** `backend-api/database/migrations/20250123_obras_campos_obrigatorios.sql`

---

**Última atualização:** 23/01/2025

