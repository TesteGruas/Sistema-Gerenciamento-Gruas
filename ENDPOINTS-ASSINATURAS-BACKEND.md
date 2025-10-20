# 📝 Endpoints de Assinatura de Documentos - Backend

## 🚀 **Resumo**

**SIM!** O backend possui um sistema completo de assinatura de documentos com **13 endpoints** implementados.

**Arquivo:** `backend-api/src/routes/assinaturas.js`  
**Rota Base:** `/api/assinaturas`  
**Status:** ✅ **Ativo e Configurado**

---

## 📋 **Endpoints Disponíveis**

### **1. 📄 Gestão de Documentos**

#### **GET `/api/assinaturas/pendentes`**
- **Descrição:** Buscar documentos pendentes de assinatura para o usuário atual
- **Autenticação:** ✅ Requerida
- **Retorna:** Lista de documentos onde o usuário é o próximo assinante

#### **GET `/api/assinaturas/documentos`**
- **Descrição:** Buscar todos os documentos do usuário (pendentes, assinados, rejeitados)
- **Autenticação:** ✅ Requerida
- **Retorna:** Lista completa de documentos com status das assinaturas

#### **GET `/api/assinaturas/documento/:id`**
- **Descrição:** Buscar documento específico por ID
- **Autenticação:** ✅ Requerida
- **Parâmetros:** `id` (ID do documento)
- **Retorna:** Documento completo com todas as assinaturas

---

### **2. ✍️ Assinatura Digital**

#### **POST `/api/assinaturas/assinar/:id`**
- **Descrição:** Assinar um documento digitalmente
- **Autenticação:** ✅ Requerida
- **Parâmetros:** `id` (ID do documento)
- **Body:**
  ```json
  {
    "assinatura": "base64_string",
    "geoloc": "latitude,longitude",
    "timestamp": "2025-01-01T10:00:00Z",
    "observacoes": "Observações opcionais"
  }
  ```

#### **POST `/api/assinaturas/recusar/:id`**
- **Descrição:** Recusar assinatura de um documento
- **Autenticação:** ✅ Requerida
- **Parâmetros:** `id` (ID do documento)
- **Body:**
  ```json
  {
    "motivo": "Motivo da recusa",
    "observacoes": "Observações adicionais"
  }
  ```

---

### **3. 📊 Histórico e Validação**

#### **GET `/api/assinaturas/historico`**
- **Descrição:** Buscar histórico de assinaturas do usuário
- **Autenticação:** ✅ Requerida
- **Query Parameters:**
  - `data_inicio` (opcional)
  - `data_fim` (opcional)
  - `status` (opcional)
  - `page` (opcional)
  - `limit` (opcional)

#### **GET `/api/assinaturas/:id/validar`**
- **Descrição:** Validar assinatura de um documento
- **Autenticação:** ✅ Requerida
- **Parâmetros:** `id` (ID do documento)
- **Retorna:** Status de validação da assinatura

---

### **4. 📁 Download e Upload**

#### **GET `/api/assinaturas/documento/:id/download`**
- **Descrição:** Download do documento original
- **Autenticação:** ✅ Requerida
- **Parâmetros:** `id` (ID do documento)
- **Retorna:** Arquivo PDF do documento

#### **POST `/api/assinaturas/:id/upload-assinado`**
- **Descrição:** Upload do documento assinado
- **Autenticação:** ✅ Requerida
- **Content-Type:** `multipart/form-data`
- **Body:** Arquivo PDF assinado
- **Limite:** 10MB

#### **GET `/api/assinaturas/:id/arquivo-assinado`**
- **Descrição:** Download do documento assinado
- **Autenticação:** ✅ Requerida
- **Parâmetros:** `id` (ID do documento)
- **Retorna:** Arquivo PDF assinado

---

### **5. 🔔 Notificações e Status**

#### **POST `/api/assinaturas/:id/lembrete`**
- **Descrição:** Enviar lembrete de assinatura
- **Autenticação:** ✅ Requerida
- **Parâmetros:** `id` (ID do documento)
- **Body:**
  ```json
  {
    "mensagem": "Mensagem personalizada do lembrete"
  }
  ```

#### **PUT `/api/assinaturas/:id/status`**
- **Descrição:** Atualizar status do documento
- **Autenticação:** ✅ Requerida
- **Parâmetros:** `id` (ID do documento)
- **Body:**
  ```json
  {
    "status": "novo_status",
    "observacoes": "Observações sobre a mudança"
  }
  ```

#### **POST `/api/assinaturas/:id/cancelar`**
- **Descrição:** Cancelar processo de assinatura
- **Autenticação:** ✅ Requerida
- **Parâmetros:** `id` (ID do documento)
- **Body:**
  ```json
  {
    "motivo": "Motivo do cancelamento",
    "observacoes": "Observações adicionais"
  }
  ```

---

## 🗄️ **Estrutura do Banco de Dados**

### **Tabelas Principais:**
- `obras_documentos` - Documentos principais
- `obras_documento_assinaturas` - Assinaturas dos documentos
- `v_obras_documentos_completo` - View com dados completos

### **Campos de Assinatura:**
- `status` - Status da assinatura (aguardando, assinado, recusado)
- `data_assinatura` - Data/hora da assinatura
- `arquivo_assinado` - Base64 da assinatura
- `observacoes` - Observações do assinante
- `geoloc` - Localização geográfica
- `timestamp` - Timestamp da assinatura

---

## 🔐 **Segurança e Validações**

### **Autenticação:**
- ✅ Token JWT obrigatório em todos os endpoints
- ✅ Validação de usuário autenticado

### **Validações:**
- ✅ Verificação de permissões do usuário
- ✅ Validação de status do documento
- ✅ Verificação de ordem de assinatura
- ✅ Validação de formato de arquivo (PDF)

### **Upload:**
- ✅ Limite de 10MB por arquivo
- ✅ Apenas arquivos PDF aceitos
- ✅ Validação de tipo MIME

---

## 📊 **Status dos Documentos**

| Status | Descrição |
|--------|-----------|
| `aguardando_assinatura` | Aguardando primeira assinatura |
| `em_assinatura` | Em processo de assinatura |
| `assinado` | Completamente assinado |
| `recusado` | Recusado por algum assinante |
| `cancelado` | Processo cancelado |

---

## 🚀 **Como Usar**

### **1. Buscar Documentos Pendentes:**
```bash
GET /api/assinaturas/pendentes
Authorization: Bearer <token>
```

### **2. Assinar Documento:**
```bash
POST /api/assinaturas/assinar/123
Authorization: Bearer <token>
Content-Type: application/json

{
  "assinatura": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "geoloc": "-23.5505,-46.6333",
  "timestamp": "2025-01-20T15:30:00Z",
  "observacoes": "Assinado digitalmente"
}
```

### **3. Download do Documento:**
```bash
GET /api/assinaturas/documento/123/download
Authorization: Bearer <token>
```

---

## ✅ **Conclusão**

O backend possui um **sistema completo de assinatura digital** com:

- ✅ **13 endpoints** funcionais
- ✅ **Autenticação JWT** em todos os endpoints
- ✅ **Upload/Download** de arquivos
- ✅ **Validação de assinaturas**
- ✅ **Histórico completo**
- ✅ **Notificações e lembretes**
- ✅ **Gestão de status**
- ✅ **Segurança robusta**

**O sistema está pronto para uso em produção!** 🎉
